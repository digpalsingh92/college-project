export class AppError extends Error {
  readonly statusCode: number;
  readonly status: false;
  readonly details?: unknown;
  readonly isOperational: boolean;

  constructor(message: string, statusCode = 500, details?: unknown) {
    super(message);

    this.name = "AppError";
    this.statusCode = statusCode;
    this.status = false;
    this.details = details;
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}