import { NextFunction, Request, Response } from "express";
import { ZodTypeAny } from "zod";
import { AppError } from "../utils/app-error.js";

type RequestSchemas = {
  body?: ZodTypeAny;
  query?: ZodTypeAny;
  params?: ZodTypeAny;
};

export const validateRequest = (schemas: RequestSchemas) => {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (schemas.body) {
      const parsedBody = schemas.body.safeParse(req.body);
      if (!parsedBody.success) {
        throw new AppError("Validation failed", 400, parsedBody.error.flatten());
      }
      req.body = parsedBody.data;
    }

    if (schemas.query) {
      const parsedQuery = schemas.query.safeParse(req.query);
      if (!parsedQuery.success) {
        throw new AppError("Validation failed", 400, parsedQuery.error.flatten());
      }
      req.query = parsedQuery.data as Request["query"];
    }

    if (schemas.params) {
      const parsedParams = schemas.params.safeParse(req.params);
      if (!parsedParams.success) {
        throw new AppError("Validation failed", 400, parsedParams.error.flatten());
      }
      req.params = parsedParams.data as Request["params"];
    }

    next();
  };
};