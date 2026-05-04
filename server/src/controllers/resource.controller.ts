import { Request, Response } from 'express';
import prisma from '../lib/prisma.js';
import { AppError } from '../utils/app-error.js';

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
}) => ({
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
});

export const getResources = async (req: Request, res: Response) => {
	try {
        const { category, search } = req.query;

				const parsedCategory = normalizeCategory(category);
				const searchText = typeof search === 'string' ? search : undefined;

		const resources = await prisma.resource.findMany({
						where: {
							...(parsedCategory ? { resourceType: { category: parsedCategory } } : {}),
							...(searchText
								? {
										resourceType: {
											...(parsedCategory ? { category: parsedCategory } : {}),
											name: { contains: searchText, mode: 'insensitive' },
										},
									}
								: {}),
						},
						include: {
							resourceType: true,
						},
						orderBy: { createdAt: 'desc' },
        });
		
		res.status(200).json({
			status: true,
			data: resources.map(toResponseItem),
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
		const { name, category, basePrice, description, status } = req.body;

				const parsedCategory = normalizeCategory(category);
				const parsedStatus = normalizeStatus(status) ?? 'ACTIVE';

		if (!name || !parsedCategory || basePrice === undefined) {
			throw new AppError('Name, category, and basePrice are required', 400);
		}

				const numericBasePrice = Number(basePrice);
				if (!Number.isFinite(numericBasePrice) || numericBasePrice < 0) {
					throw new AppError('basePrice must be a valid positive number', 400);
				}

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
								totalUnits: 1,
								availableUnits: parsedStatus === 'OCCUPIED' ? 0 : 1,
								status: parsedStatus,
            },
			include: {
							resourceType: true,
						},
		});

		res.status(201).json({
			status: true,
			data: toResponseItem(resource as any),
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
					include: { resourceType: true },
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

