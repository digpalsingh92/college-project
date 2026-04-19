import jwt from "jsonwebtoken";
import { AppError } from "../utils/app-error.js";

export const tokenSecret = process.env.JWT_SECRET;

export const signToken = (
  payload: object,
  expiresIn: jwt.SignOptions["expiresIn"] = "1d"
): string => {
  if (!tokenSecret) {
    throw new AppError(
      "Server misconfiguration: JWT_SECRET is not set. Add it to the server environment (e.g. server/.env).",
      500
    );
  }
  return jwt.sign(payload, tokenSecret, { expiresIn });
};

export const verifyToken = (token: string): object | string => {
  if (!tokenSecret) {
    throw new AppError(
      "Server misconfiguration: JWT_SECRET is not set. Add it to the server environment (e.g. server/.env).",
      500
    );
  }
  return jwt.verify(token, tokenSecret);
};  