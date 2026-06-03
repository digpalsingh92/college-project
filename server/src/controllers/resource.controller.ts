import { Request, Response } from 'express';
import prisma from '../lib/prisma.js';
import { AppError } from '../utils/app-error.js';
import { broadcastOccupancyUpdate } from '../lib/socket.js';

type ResourceCategory = 'BED' | 'OT' | 'LAB' | 'MACHINE';
type ResourceStatus = 'ACTIVE' | 'INACTIVE' | 'MAINTENANCE' | 'OCCUPIED' | 'VACANT';

const normalizeCategory = (value: unknown): ResourceCategory | undefined => {
	if (typeof value !== 'string') return undefined;
	const upper = value.toUpperCase();
	if (upper === 'BED' || upper === 'OT' || upper === 'LAB' || upper === 'MACHINE') {
		return upper;
	}
	return undefined;
};

const normalizeStatus = (value: unknown): ResourceStatus | undefined => {
	if (typeof value !== 'string') return undefined;
	const upper = value.toUpperCase();
	if (upper === 'ACTIVE' || upper === 'INACTIVE' || upper === 'MAINTENANCE' || upper === 'OCCUPIED' || upper === 'VACANT') {
		return upper;
	}
	return undefined;
};

/** Compute unit summary counts from an array of ResourceUnit objects. */
const computeUnitSummary = (units: { isActive: boolean; occupancyStatus: string }[]) => {
	let activeCount = 0;
	let inactiveCount = 0;
	let occupiedCount = 0;
	let vacantCount = 0;

	for (const u of units) {
		if (u.isActive) {
			activeCount++;
			if (u.occupancyStatus === 'OCCUPIED') occupiedCount++;
			else vacantCount++;
		} else {
			inactiveCount++;
		}
	}

	return { activeCount, inactiveCount, occupiedCount, vacantCount };
};

const toResponseItem = (resource: {
	id: string;
	status: ResourceStatus;
	totalUnits: number;
	availableUnits: number;
	createdAt: Date;
	updatedAt: Date;
	resourceType: {
		id: string;
		name: string;
		category: ResourceCategory;
		basePrice: number;
		description: string | null;
	};
	units?: { id: string; unitNumber: string; isActive: boolean; occupancyStatus: string; createdAt: Date; updatedAt: Date }[];
}) => {
	const summary = resource.units ? computeUnitSummary(resource.units) : undefined;

	return {
		id: resource.id,
		name: resource.resourceType.name,
		category: resource.resourceType.category,
		basePrice: resource.resourceType.basePrice,
		description: resource.resourceType.description,
		status: resource.status,
		totalUnits: resource.totalUnits,
		availableUnits: resource.availableUnits,
		resourceTypeId: resource.resourceType.id,
		createdAt: resource.createdAt,
		updatedAt: resource.updatedAt,
		// New unit summary fields
		...(summary ? {
			activeCount: summary.activeCount,
			inactiveCount: summary.inactiveCount,
			occupiedCount: summary.occupiedCount,
			vacantCount: summary.vacantCount,
		} : {}),
	};
};

const CATEGORY_PREFIX: Record<string, string> = {
	BED: 'BED',
	MACHINE: 'MCH',
	OT: 'OT',
	LAB: 'LAB',
};

export const getResources = async (req: Request, res: Response) => {
	try {
		const { category, search } = req.query;

		const page = Math.max(1, Number(req.query.page) || 1);
		const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 10));
		const skip = (page - 1) * limit;

		const parsedCategory = normalizeCategory(category);
		const searchText = typeof search === 'string' ? search : undefined;

		const where = {
			...(parsedCategory ? { resourceType: { category: parsedCategory } } : {}),
			...(searchText
				? {
						resourceType: {
							...(parsedCategory ? { category: parsedCategory } : {}),
							name: { contains: searchText, mode: 'insensitive' as const },
						},
					}
				: {}),
		};

		const [resources, total] = await Promise.all([
			prisma.resource.findMany({
				where,
				include: {
					resourceType: true,
					units: {
						orderBy: { unitNumber: 'asc' },
					},
				},
				orderBy: { createdAt: 'desc' },
				skip,
				take: limit,
			}),
			prisma.resource.count({ where }),
		]);

		const totalPages = Math.ceil(total / limit);

		res.status(200).json({
			status: true,
			data: resources.map(toResponseItem),
			total,
			page,
			totalPages,
			limit,
		});
	} catch (error) {
		console.error('Error fetching resources:', error);
		res.status(500).json({
			status: false,
			message: 'Internal server error',
		});
	}
};

export const createResource = async (req: Request, res: Response) => {
	try {
		const { name, category, basePrice, description, status, totalUnits: rawTotalUnits } = req.body;

				const parsedCategory = normalizeCategory(category);
				const parsedStatus = normalizeStatus(status) ?? 'ACTIVE';

		if (!name || !parsedCategory || basePrice === undefined) {
			throw new AppError('Name, category, and basePrice are required', 400);
		}

				const numericBasePrice = Number(basePrice);
				if (!Number.isFinite(numericBasePrice) || numericBasePrice < 0) {
					throw new AppError('basePrice must be a valid positive number', 400);
				}

				const unitCount = Math.max(1, Number(rawTotalUnits) || 1);

				const existingType = await prisma.resourceType.findFirst({
					where: {
						name: String(name),
						category: parsedCategory,
					},
				});

				const resourceType =
					existingType ??
					(await prisma.resourceType.create({
						data: {
							name: String(name),
							category: parsedCategory,
							basePrice: numericBasePrice,
							description: description ? String(description) : null,
						},
					}));

				// Keep type pricing/description current when seeding or adding similar resources again.
				if (existingType) {
					await prisma.resourceType.update({
						where: { id: existingType.id },
						data: {
							basePrice: numericBasePrice,
							description: description !== undefined ? String(description) : existingType.description,
						},
					});
				}

		const resource = await prisma.resource.create({
			data: {
							resourceTypeId: resourceType.id,
							totalUnits: unitCount,
							availableUnits: parsedStatus === 'OCCUPIED' ? 0 : unitCount,
							status: parsedStatus,
            },
			include: {
						resourceType: true,
					},
		});

		// Auto-generate ResourceUnit rows
		const prefix = CATEGORY_PREFIX[parsedCategory] ?? parsedCategory;
		// Find the current max unit number for this prefix
		const lastUnit = await prisma.resourceUnit.findFirst({
			where: { unitNumber: { startsWith: prefix } },
			orderBy: { unitNumber: 'desc' },
		});
		let startIndex = 1;
		if (lastUnit) {
			const parts = lastUnit.unitNumber.split('-');
			startIndex = (parseInt(parts[1], 10) || 0) + 1;
		}

		const unitData = [];
		for (let i = 0; i < unitCount; i++) {
			unitData.push({
				unitNumber: `${prefix}-${String(startIndex + i).padStart(3, '0')}`,
				isActive: parsedStatus !== 'INACTIVE',
				occupancyStatus: parsedStatus === 'OCCUPIED' ? ('OCCUPIED' as const) : ('VACANT' as const),
				resourceId: resource.id,
			});
		}
		if (unitData.length > 0) {
			await prisma.resourceUnit.createMany({ data: unitData });
		}

		// Re-fetch with units
		const refreshed = await prisma.resource.findUnique({
			where: { id: resource.id },
			include: { resourceType: true, units: { orderBy: { unitNumber: 'asc' } } },
		});

		res.status(201).json({
			status: true,
			data: refreshed ? toResponseItem(refreshed as any) : toResponseItem(resource as any),
		});
	} catch (error) {
		if (error instanceof AppError) {
            res.status(error.statusCode).json({ status: false, message: error.message });
            return;
        }
        console.error('Error creating resource:', error);
        res.status(500).json({ status: false, message: 'Internal server error' });
	}
};

export const updateResource = async (req: Request, res: Response) => {
	try {
        const { id } = req.params;
		const resourceId = Array.isArray(id) ? id[0] : id;
		const { status, name, basePrice, description } = req.body;

				const existing = await prisma.resource.findUnique({
					where: { id: resourceId },
					include: { resourceType: true },
				});

				if (!existing) {
					throw new AppError('Resource not found', 404);
				}

				const parsedStatus = normalizeStatus(status);

		const resource = await prisma.resource.update({
			where: { id: resourceId },
			data: {
							status: parsedStatus,
							availableUnits:
								parsedStatus === 'OCCUPIED'
									? 0
									: parsedStatus === 'VACANT' || parsedStatus === 'ACTIVE'
										? existing.totalUnits
										: undefined,
            },
			include: { resourceType: true },
		});

				if (name !== undefined || basePrice !== undefined || description !== undefined) {
					await prisma.resourceType.update({
						where: { id: existing.resourceTypeId },
						data: {
							name: name !== undefined ? String(name) : undefined,
							basePrice: basePrice !== undefined ? Number(basePrice) : undefined,
							description: description !== undefined ? String(description) : undefined,
						},
					});
				}

				const refreshed = await prisma.resource.findUnique({
					where: { id: resourceId },
					include: { resourceType: true, units: { orderBy: { unitNumber: 'asc' } } },
				});

		res.status(200).json({
			status: true,
			data: refreshed ? toResponseItem(refreshed as any) : toResponseItem(resource as any),
		});
	} catch (error) {
		if (error instanceof AppError) {
					res.status(error.statusCode).json({ status: false, message: error.message });
					return;
				}
		console.error('Error updating resource:', error);
		res.status(500).json({
			status: false,
			message: 'Internal server error',
		});
	}
};

export const getResourceById = async (req: Request, res: Response) => {
	try {
		const { id } = req.params;
		const resourceId = Array.isArray(id) ? id[0] : id;

		const resource = await prisma.resource.findUnique({
			where: { id: resourceId },
			include: { resourceType: true, units: { orderBy: { unitNumber: 'asc' } } },
		});

		if (!resource) {
			throw new AppError('Resource not found', 404);
		}

		res.status(200).json({
			status: true,
			data: toResponseItem(resource as any),
		});
	} catch (error) {
		if (error instanceof AppError) {
			res.status(error.statusCode).json({ status: false, message: error.message });
			return;
		}
		console.error('Error fetching resource:', error);
		res.status(500).json({ status: false, message: 'Internal server error' });
	}
};

export const deleteResource = async (req: Request, res: Response) => {
	try {
		const { id } = req.params;
		const resourceId = Array.isArray(id) ? id[0] : id;

		const existing = await prisma.resource.findUnique({
			where: { id: resourceId },
		});

		if (!existing) {
			throw new AppError('Resource not found', 404);
		}

		await prisma.resource.delete({
			where: { id: resourceId },
		});

		// Check if any other resources reference the same ResourceType
		const siblingCount = await prisma.resource.count({
			where: { resourceTypeId: existing.resourceTypeId },
		});

		// If no more resources use this type, clean it up
		if (siblingCount === 0) {
			await prisma.resourceType.delete({
				where: { id: existing.resourceTypeId },
			});
		}

		res.status(200).json({
			status: true,
			message: 'Resource deleted successfully',
		});
	} catch (error) {
		if (error instanceof AppError) {
			res.status(error.statusCode).json({ status: false, message: error.message });
			return;
		}
		console.error('Error deleting resource:', error);
		res.status(500).json({ status: false, message: 'Internal server error' });
	}
};

/* ── Resource Unit endpoints ── */

/** GET /resources/:id/units — list all units for a resource */
export const getResourceUnits = async (req: Request, res: Response) => {
	try {
		const { id } = req.params;
		const resourceId = Array.isArray(id) ? id[0] : id;

		const resource = await prisma.resource.findUnique({
			where: { id: resourceId },
			include: { resourceType: true },
		});

		if (!resource) {
			throw new AppError('Resource not found', 404);
		}

		const units = await prisma.resourceUnit.findMany({
			where: { resourceId },
			orderBy: { unitNumber: 'asc' },
		});

		res.status(200).json({
			status: true,
			data: units,
			resourceName: resource.resourceType.name,
			category: resource.resourceType.category,
		});
	} catch (error) {
		if (error instanceof AppError) {
			res.status(error.statusCode).json({ status: false, message: error.message });
			return;
		}
		console.error('Error fetching resource units:', error);
		res.status(500).json({ status: false, message: 'Internal server error' });
	}
};

/** PATCH /resources/units/:unitId — update a single unit's isActive or occupancyStatus */
export const updateResourceUnit = async (req: Request, res: Response) => {
	try {
		const { unitId } = req.params;
		const id = Array.isArray(unitId) ? unitId[0] : unitId;
		const { isActive, occupancyStatus } = req.body;

		const existing = await prisma.resourceUnit.findUnique({
			where: { id },
			include: { resource: { include: { resourceType: true } } },
		});

		if (!existing) {
			throw new AppError('Resource unit not found', 404);
		}

		const updateData: any = {};
		if (isActive !== undefined) updateData.isActive = Boolean(isActive);
		if (occupancyStatus !== undefined) {
			const upper = String(occupancyStatus).toUpperCase();
			if (upper !== 'OCCUPIED' && upper !== 'VACANT') {
				throw new AppError('occupancyStatus must be OCCUPIED or VACANT', 400);
			}
			updateData.occupancyStatus = upper;
		}

		const updatedUnit = await prisma.resourceUnit.update({
			where: { id },
			data: updateData,
		});

		// Recompute parent resource's aggregate counters
		const allUnits = await prisma.resourceUnit.findMany({
			where: { resourceId: existing.resourceId },
		});

		const summary = computeUnitSummary(allUnits);
		const newAvailable = summary.vacantCount;
		const newTotal = summary.activeCount + summary.inactiveCount;

		// Derive a summary status for the parent resource
		let derivedStatus: ResourceStatus = 'ACTIVE';
		if (summary.activeCount === 0) derivedStatus = 'INACTIVE';
		else if (summary.vacantCount === 0 && summary.occupiedCount > 0) derivedStatus = 'OCCUPIED';
		else if (summary.occupiedCount === 0 && summary.vacantCount > 0) derivedStatus = 'VACANT';

		await prisma.resource.update({
			where: { id: existing.resourceId },
			data: {
				totalUnits: newTotal,
				availableUnits: newAvailable,
				status: derivedStatus,
			},
		});

		// Broadcast occupancy update for real-time dashboards
		broadcastOccupancyUpdate({
			category: existing.resource.resourceType.category,
			availableUnits: newAvailable,
			totalUnits: newTotal,
		});

		res.status(200).json({
			status: true,
			data: updatedUnit,
			summary: {
				activeCount: summary.activeCount,
				inactiveCount: summary.inactiveCount,
				occupiedCount: summary.occupiedCount,
				vacantCount: summary.vacantCount,
				totalUnits: newTotal,
				availableUnits: newAvailable,
			},
		});
	} catch (error) {
		if (error instanceof AppError) {
			res.status(error.statusCode).json({ status: false, message: error.message });
			return;
		}
		console.error('Error updating resource unit:', error);
		res.status(500).json({ status: false, message: 'Internal server error' });
	}
};

export const allocateResourceController = async (req: Request, res: Response) => {
	try {
		const { resourceId, patientId, notes, unitId } = req.body;

		if (!resourceId || !patientId || !unitId) {
			throw new AppError('resourceId, patientId, and unitId are required', 400);
		}

		const unit = await prisma.resourceUnit.findUnique({
			where: { id: String(unitId) },
			include: { resource: { include: { resourceType: true } } },
		});

		if (!unit || unit.resourceId !== resourceId) {
			throw new AppError('Unit not found for this resource', 404);
		}

		if (!unit.isActive) {
			throw new AppError('This unit is inactive or offline', 409);
		}

		if (unit.occupancyStatus === 'OCCUPIED') {
			throw new AppError('This unit is already occupied', 409);
		}

		// Create allocation and mark the specific unit occupied
		const allocation = await prisma.$transaction(async (tx) => {
			await tx.resourceUnit.update({
				where: { id: unit.id },
				data: { occupancyStatus: 'OCCUPIED' },
			});

			return tx.appointmentResource.create({
				data: {
					resourceId,
					resourceUnitId: unit.id,
					patientId,
					notes: notes ? String(notes) : null,
					status: 'ALLOCATED',
				},
				include: {
					patient: { select: { name: true, email: true } },
					resource: { include: { resourceType: true } },
					resourceUnit: { select: { id: true, unitNumber: true } },
				},
			});
		});

		const allUnits = await prisma.resourceUnit.findMany({
			where: { resourceId },
		});
		const summary = computeUnitSummary(allUnits);

		const updatedResource = await prisma.resource.update({
			where: { id: resourceId },
			data: {
				totalUnits: summary.activeCount + summary.inactiveCount,
				availableUnits: summary.vacantCount,
				status:
					summary.activeCount === 0
						? 'INACTIVE'
						: summary.vacantCount === 0 && summary.occupiedCount > 0
							? 'OCCUPIED'
							: summary.occupiedCount === 0 && summary.vacantCount > 0
								? 'VACANT'
								: 'ACTIVE',
			},
			include: { resourceType: true },
		});

		broadcastOccupancyUpdate({
			category: updatedResource.resourceType.category,
			availableUnits: updatedResource.availableUnits,
			totalUnits: updatedResource.totalUnits,
		});

		res.status(201).json({
			status: true,
			data: allocation,
		});
	} catch (error) {
		if (error instanceof AppError) {
			res.status(error.statusCode).json({ status: false, message: error.message });
			return;
		}
		console.error('Error allocating resource:', error);
		res.status(500).json({ status: false, message: 'Internal server error' });
	}
};

export const releaseResourceController = async (req: Request, res: Response) => {
	try {
		const { allocationId } = req.body;

		if (!allocationId) {
			throw new AppError('allocationId is required', 400);
		}

		const allocation = await prisma.appointmentResource.findUnique({
			where: { id: allocationId },
		});

		if (!allocation) {
			throw new AppError('Resource allocation record not found', 404);
		}

		if (allocation.status !== 'ALLOCATED') {
			throw new AppError('Resource is already released or not active', 400);
		}

		const updatedAllocation = await prisma.$transaction(async (tx) => {
			if (allocation.resourceUnitId) {
				await tx.resourceUnit.update({
					where: { id: allocation.resourceUnitId },
					data: { occupancyStatus: 'VACANT' },
				});
			}

			return tx.appointmentResource.update({
				where: { id: allocationId },
				data: { status: 'RELEASED', allocatedTo: new Date() },
			});
		});

		const allUnits = await prisma.resourceUnit.findMany({
			where: { resourceId: allocation.resourceId },
		});
		const summary = computeUnitSummary(allUnits);

		const updatedResource = await prisma.resource.update({
			where: { id: allocation.resourceId },
			data: {
				totalUnits: summary.activeCount + summary.inactiveCount,
				availableUnits: summary.vacantCount,
				status:
					summary.activeCount === 0
						? 'INACTIVE'
						: summary.vacantCount === 0 && summary.occupiedCount > 0
							? 'OCCUPIED'
							: summary.occupiedCount === 0 && summary.vacantCount > 0
								? 'VACANT'
								: 'ACTIVE',
			},
			include: { resourceType: true },
		});

		// Broadcast update
		broadcastOccupancyUpdate({
			category: updatedResource.resourceType.category,
			availableUnits: updatedResource.availableUnits,
			totalUnits: updatedResource.totalUnits
		});

		res.status(200).json({
			status: true,
			data: updatedAllocation
		});
	} catch (error) {
		if (error instanceof AppError) {
			res.status(error.statusCode).json({ status: false, message: error.message });
			return;
		}
		console.error('Error releasing resource:', error);
		res.status(500).json({ status: false, message: 'Internal server error' });
	}
};

export const getAllocationsController = async (req: Request, res: Response) => {
	try {
		const allocations = await prisma.appointmentResource.findMany({
			where: { status: 'ALLOCATED' },
			include: {
				patient: { select: { id: true, name: true, email: true } },
				resource: { include: { resourceType: true } },
				resourceUnit: { select: { id: true, unitNumber: true } },
			},
			orderBy: { allocatedFrom: 'desc' },
		});

		res.status(200).json({
			status: true,
			data: allocations
		});
	} catch (error) {
		console.error('Error fetching resource allocations:', error);
		res.status(500).json({ status: false, message: 'Internal server error' });
	}
};
