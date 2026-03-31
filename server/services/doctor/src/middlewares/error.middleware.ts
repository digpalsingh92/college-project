import { NextFunction, Request, Response } from 'express';
import { Prisma } from '@prisma/client';
import { AppError } from '../utils/app-error';

export const notFoundHandler = (req: Request, _res: Response, next: NextFunction): void => {
  next(new AppError(`Route not found: ${req.method} ${req.originalUrl}`, 404));
};

export const errorHandler = (
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction
): void => {
  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      success: false,
      error: {
        message: err.message,
        details: err.details,
      },
    });
    return;
  }

  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === 'P2002') {
      res.status(409).json({
        success: false,
        error: {
          message: 'Duplicate field value',
          details: err.meta,
        },
      });
      return;
    }
  }

  res.status(500).json({
    success: false,
    error: {
      message: 'Internal server error',
    },
  });
};
