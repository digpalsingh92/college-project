import { Request, Response } from "express";
import { loginByRole, registerPatient, getPatientAnalytics, refreshAccessToken } from "./users.service.js";
import { sendSuccess } from "../../utils/api-response.js";
import { AppError } from "../../utils/app-error.js";
import { verifyToken } from "../../lib/jwt.js";
import prisma from "../../lib/prisma.js";

export const patientRegister = async (req: Request, res: Response): Promise<void> => {
  const result = await registerPatient(req.body);
  sendSuccess(res, {
    statusCode: 201,
    message: "Patient registered successfully.",
    data: result,
  });
};

export const patientLogin = async (req: Request, res: Response): Promise<void> => {
  const result = await loginByRole(req.body, "patient");
  sendSuccess(res, {
    statusCode: 200,
    message: "Patient login successful.",
    data: result,
  });
};

export const adminLogin = async (req: Request, res: Response): Promise<void> => {
  const result = await loginByRole(req.body, "admin");
  sendSuccess(res, {
    statusCode: 200,
    message: "Admin login successful.",
    data: result,
  });
};

export const getPatientsController = async (req: Request, res: Response): Promise<void> => {
  if (!req.user || req.user.role !== "admin") {
    throw new AppError("Unauthorized", 401);
  }

  const page = Math.max(1, Number(req.query.page) || 1);
  const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 10));
  const search = req.query.search ? String(req.query.search) : undefined;

  const result = await getPatientAnalytics({ page, limit, search });
  res.status(200).json(result);
};

export const refreshTokenController = async (req: Request, res: Response): Promise<void> => {
  const { refreshToken } = req.body;
  if (!refreshToken) {
    throw new AppError("Refresh token is required", 400);
  }

  const result = await refreshAccessToken(refreshToken);
  sendSuccess(res, {
    statusCode: 200,
    message: "Token refreshed successfully.",
    data: result,
  });
};

export const logoutController = async (req: Request, res: Response): Promise<void> => {
  const authHeader = req.headers.authorization;
  if (authHeader) {
    const token = authHeader.split(" ")[1];
    if (token) {
      let decoded: any;
      try {
        decoded = verifyToken(token);
      } catch (e) {
        const payloadSegment = token.split(".")[1];
        if (payloadSegment) {
          try {
            const decodedPayload = JSON.parse(Buffer.from(payloadSegment, "base64").toString());
            decoded = decodedPayload;
          } catch {}
        }
      }

      const expiresAt = decoded?.exp ? new Date(decoded.exp * 1000) : new Date(Date.now() + 24 * 60 * 60 * 1000);

      await prisma.blacklistedToken.create({
        data: {
          token,
          expiresAt,
        },
      });

      if (decoded?.id && decoded?.role) {
        if (decoded.role === "doctor") {
          await prisma.doctor.update({
            where: { id: decoded.id },
            data: { refreshToken: null },
          });
        } else {
          await prisma.user.update({
            where: { id: decoded.id },
            data: { refreshToken: null },
          });
        }
      }
    }
  }

  sendSuccess(res, {
    statusCode: 200,
    message: "Logged out successfully.",
    data: null,
  });
};
