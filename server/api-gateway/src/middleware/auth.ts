import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export interface AuthRequest extends Request {
  user?: jwt.JwtPayload | string;
}

export const authMiddleware = (req: AuthRequest, res: Response, next: NextFunction): void => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer <token>

  if (!token) {
    res.status(401).json({ error: 'Access token required' });
    return;
  }

  const secret = process.env.JWT_SECRET;
  if (!secret) {
    res.status(500).json({ error: 'Server configuration error' });
    return;
  }

  try {
    const decoded = jwt.verify(token, secret);
    req.user = decoded;
    // Forward user info to downstream services
    req.headers['x-user-id']   = typeof decoded === 'object' ? String(decoded.id)   : '';
    req.headers['x-user-role'] = typeof decoded === 'object' ? String(decoded.role) : '';
    next();
  } catch {
    res.status(403).json({ error: 'Invalid or expired token' });
  }
};
