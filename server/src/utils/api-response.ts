import { Response } from "express";
import { ApiResponse, PaginationMeta } from "../types/api.types.js";

type SendSuccessParams<T> = {
  statusCode: number;
  message: string;
  data: T;
  pagination?: PaginationMeta;
};

export const sendSuccess = <T>(
  res: Response,
  { statusCode, message, data, pagination }: SendSuccessParams<T>,
): Response<ApiResponse<T>> => {
  return res.status(statusCode).json({
    status: true,
    statusCode,
    message,
    result: {
      data,
      ...(pagination ? { pagination } : {}),
    },
  });
};
