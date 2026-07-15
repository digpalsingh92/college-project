import jwt from "jsonwebtoken";
import { AppError } from "../utils/app-error.js";
import dotenv from "dotenv";

dotenv.config();

export const tokenSecret = process.env.JWT_SECRET;

const ensureSecret = (): string => {
  if (!tokenSecret) {
    throw new AppError(
      "Server misconfiguration: JWT_SECRET is not set. Add it to the server environment (e.g. server/.env).",
      500
    );
  }
  return tokenSecret;
};

export const signToken = (
  payload: object,
  expiresIn: jwt.SignOptions["expiresIn"] = "1d"
): string => {
  const secret = ensureSecret();
  return jwt.sign(payload, secret, { expiresIn });
};

export const verifyToken = (token: string): object | string => {
  const secret = ensureSecret();
  return jwt.verify(token, secret);
};

export const signAccessToken = (payload: object): string => {
  return signToken(payload, "24h");
};

export const signRefreshToken = (payload: object): string => {
  return signToken(payload, "30d");
};

export const verifyAccessToken = (token: string): object | string => {
  return verifyToken(token);
};

export const verifyRefreshToken = (token: string): object | string => {
  return verifyToken(token);
};  