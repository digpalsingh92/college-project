import { Request, Response } from 'express';
import prisma from '../lib/prisma.js';
import { AppError } from '../utils/app-error.js';

type ResourceCategory = string;
type ResourceStatus = string;

const hospitalResource = (prisma as any).hospitalResource;

export const getResources = async (req: Request, res: Response) => {
	try {
        const { category, search } = req.query;

        let whereClause: any = {};
        if (category) {
            whereClause.category = category as ResourceCategory;
        }
        if (search) {
            whereClause.name = {
                contains: search as string,
                mode: 'insensitive',
            };
        }

		const resources = await hospitalResource.findMany({
            where: whereClause,
            orderBy: { createdAt: 'desc' }
        });
		
		res.status(200).json({
			status: true,
			data: resources,
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
		const { name, category, basePrice, description } = req.body;

        if (!name || !category || basePrice === undefined) {
			throw new AppError('Name, category, and basePrice are required', 400);
		}

		const resource = await hospitalResource.create({
			data: {
                name,
                category: category as ResourceCategory,
                basePrice: Number(basePrice),
                description
            },
		});

		res.status(201).json({
			status: true,
			data: resource,
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
		const { status, name, basePrice, description } = req.body;

		const resource = await hospitalResource.update({
			where: { id },
			data: {
                status: status as ResourceStatus,
                name,
                basePrice: basePrice !== undefined ? Number(basePrice) : undefined,
                description
            },
		});

		res.status(200).json({
			status: true,
			data: resource,
		});
	} catch (error) {
		console.error('Error updating resource:', error);
		res.status(500).json({
			status: false,
			message: 'Internal server error',
		});
	}
};

