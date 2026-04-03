import 'express';
import { JwtPayload } from './api.types';

declare global {
  namespace Express {
    interface Request {
      requestId?: string;
      user?: JwtPayload;
    }
  }
}

export {};
