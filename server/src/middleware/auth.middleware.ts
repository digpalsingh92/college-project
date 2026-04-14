import { NextFunction, Request, Response } from "express";
import { Role } from "../types/api.types.js";
import { verifyToken } from "../lib/jwt.js";
import { AppError } from "../utils/app-error.js";

type TokenPayload = {
	id: string;
	email: string;
	role: Role;
};

const extractBearerToken = (headerValue?: string): string => {
	if (!headerValue) {
		throw new AppError("Please login before creating appointment", 401);
	}

	const [scheme, token] = headerValue.split(" ");
	if (scheme !== "Bearer" || !token) {
		throw new AppError("Invalid authorization header. Use Bearer token", 401);
	}

	return token;
};

const attachUserFromToken = (req: Request, token: string): void => {
	const decoded = verifyToken(token);
	if (typeof decoded === "string") {
		throw new AppError("Invalid token", 401);
	}

	const payload = decoded as Partial<TokenPayload>;
	if (!payload.id || !payload.email || !payload.role) {
		throw new AppError("Invalid token payload", 401);
	}

	req.user = {
		id: payload.id,
		email: payload.email,
		role: payload.role,
	};
};

export const requireAuth = (req: Request, _res: Response, next: NextFunction): void => {
	const token = extractBearerToken(req.headers.authorization);

	try {
		attachUserFromToken(req, token);

		next();
	} catch (_error) {
		throw new AppError("Unauthorized. Please login again", 401);
	}
};

export const optionalAuth = (req: Request, _res: Response, next: NextFunction): void => {
	const headerValue = req.headers.authorization;
	if (!headerValue) {
		next();
		return;
	}

	try {
		const token = extractBearerToken(headerValue);
		attachUserFromToken(req, token);
	} catch (_error) {
		// Public endpoint: ignore invalid auth and continue as anonymous.
	}

	next();
};

export const requireRole = (...allowedRoles: Role[]) => {
	return (req: Request, _res: Response, next: NextFunction): void => {
		if (!req.user) {
			throw new AppError("Unauthorized. Please login first", 401);
		}

		if (!allowedRoles.includes(req.user.role)) {
			throw new AppError("Forbidden: You do not have permission to access this route", 403);
		}

		next();
	};
};
