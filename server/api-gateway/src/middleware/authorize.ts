import { Request, Response, NextFunction } from 'express';

export const authorizeRoles = (...allowedRoles: string[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const roleHeader = req.headers['x-user-role'];
    const role = Array.isArray(roleHeader) ? roleHeader[0] : roleHeader;

    if (!role || !allowedRoles.includes(role)) {
      res.status(403).json({ error: 'Forbidden: insufficient permissions' });
      return;
    }

    next();
  };
};
