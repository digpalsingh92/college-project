import { NextFunction, Request, Response } from 'express';
import { ZodTypeAny, ZodError } from 'zod';
import { AppError } from '../utils/app-error';

export const validate = (schema: ZodTypeAny) => {
  return (req: Request, _res: Response, next: NextFunction): void => {
    try {
      req.body = schema.parse(req.body);
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const details = error.issues.map((issue) => ({
          path: issue.path.join('.'),
          message: issue.message,
        }));
        next(new AppError('Validation failed', 400, details));
        return;
      }

      next(error);
    }
  };
};
