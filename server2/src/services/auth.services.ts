import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import prisma from "../lib/prisma.js"
import {
    DoctorProfileUpdateInput,
    DoctorSignupInput,
    LoginInput,
    PatientSignupInput,
} from "../schemas/auth.schema.js";
import { AuthResponse, Role } from "../types/api.types.js";
import { AppError } from "../utils/app-error.js";
import { config } from "../config/config.js";

const SALT_ROUNDS = 10;

const signToken = (id: string, email: string, role: Role): string => {
    if (!config.jwtSecret) {
        throw new AppError('JWT secret is not configured', 500);
    }

    return jwt.sign({ id, email, role }, config.jwtSecret, { expiresIn: '7d' });
};

const buildAuthResponse = (user: {
    id: string;
    name: string;
    email: string;
    role: Role;
    createdAt: Date;
    doctorProfile?: {
        specialization: string;
        experience: number;
        consultationFee: number;
    } | null;
}): AuthResponse => ({
    token: signToken(user.id, user.email, user.role),
    data: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        createdAt: user.createdAt,
        specialization: user.doctorProfile?.specialization,
        experience: user.doctorProfile?.experience,
        consultationFee: user.doctorProfile?.consultationFee,
    },
});

const createUser = async (
    input: PatientSignupInput | DoctorSignupInput,
    role: 'patient' | 'doctor'
): Promise<AuthResponse> => {
    const existingUser = await prisma.user.findUnique({ where: { email: input.email } });

    if (existingUser) {
        throw new AppError('Email is already in use', 409);
    }

    const passwordHash = await bcrypt.hash(input.password, SALT_ROUNDS);

    const user = await prisma.user.create({
        data: {
            name: input.name,
            email: input.email,
            passwordHash,
            role,
        },
        include: {
            doctorProfile: true,
        },
    });

    return buildAuthResponse({
        ...user,
        role: user.role as Role,
    });
};

const loginByRole = async (input: LoginInput, role: 'patient' | 'doctor'): Promise<AuthResponse> => {
    const user = await prisma.user.findUnique({
        where: { email: input.email },
        include: { doctorProfile: true },
    });

    if (!user || user.role !== role) {
        throw new AppError('Invalid email or password', 401);
    }

    const isMatch = await bcrypt.compare(input.password, user.passwordHash);

    if (!isMatch) {
        throw new AppError('Invalid email or password', 401);
    }

    return buildAuthResponse({
        ...user,
        role: user.role as Role,
    });
};

export const patientSignup = async (input: PatientSignupInput): Promise<AuthResponse> => {
    return createUser(input, 'patient');
};

export const doctorSignup = async (input: DoctorSignupInput): Promise<AuthResponse> => {
    return createUser(input, 'doctor');
};

export const patientLogin = async (input: LoginInput): Promise<AuthResponse> => {
    return loginByRole(input, 'patient');
};

export const doctorLogin = async (input: LoginInput): Promise<AuthResponse> => {
    return loginByRole(input, 'doctor');
};

export const upsertDoctorProfile = async (input: DoctorProfileUpdateInput): Promise<AuthResponse> => {
    const user = await prisma.user.findUnique({ where: { id: input.userId } });

    if (!user) {
        throw new AppError('Doctor account not found', 404);
    }

    if (user.role !== 'doctor') {
        throw new AppError('Only doctor accounts can set doctor profile details', 403);
    }

    await prisma.doctorProfile.upsert({
        where: { userId: input.userId },
        create: {
            userId: input.userId,
            specialization: input.specialization,
            experience: input.experience,
            consultationFee: input.consultationFee,
        },
        update: {
            specialization: input.specialization,
            experience: input.experience,
            consultationFee: input.consultationFee,
        },
    });

    const updatedUser = await prisma.user.findUnique({
        where: { id: input.userId },
        include: {
            doctorProfile: true,
        },
    });

    if (!updatedUser) {
        throw new AppError('Doctor account not found', 404);
    }

    return buildAuthResponse({
        ...updatedUser,
        role: updatedUser.role as Role,
    });
};