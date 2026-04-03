import prisma from "../lib/prisma.js"
import type { Request, Response } from "express";
import bcrypt from "bcrypt";
import { AppError } from '../utils/app-error.js';

export const login = async (req: Request, res: Response): Promise<void> => {
    const user = await prisma.users.findUnique({
        where: {
            email: req.body.email
        }
    });
    if (!user) {
        res.status(404).json({ error: "User not found" });
        return;
    }

    const passwordMatches = await bcrypt.compare(req.body.password, user.passwordHash);
  if (!passwordMatches) {
    throw new AppError('Invalid email or password', 401);
  }

}