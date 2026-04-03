import bcrypt from "bcrypt";
import prisma from "../lib/prisma.js";
import { signToken } from "../lib/jwt.js";
import { AppError } from "../utils/app-error.js";
import type {
  LoginInput,
  RegisterDoctorInput,
  RegisterPatientInput,
} from "../schemas/auth.schemas.js";

type UserRole = "doctor" | "patient";

type AuthResponse = {
  token: string;
  user: {
    id: string;
    name: string;
    email: string;
    role: UserRole;
    createdAt: Date;
    doctorProfile?: {
      specialization: string;
      experience: number;
      consultationFee: number;
    };
  };
};

const buildAuthResponse = (user: {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  createdAt: Date;
  doctorProfile: {
    specialization: string;
    experience: number;
    consultationFee: number;
  } | null;
}): AuthResponse => {
  const token = signToken({
    id: user.id,
    email: user.email,
    role: user.role,
  });

  return {
    token,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      createdAt: user.createdAt,
      doctorProfile: user.doctorProfile ?? undefined,
    },
  };
};

const createUser = async (
  payload: {
    name: string;
    email: string;
    passwordHash: string;
    role: UserRole;
    doctorProfile?: {
      specialization: string;
      experience: number;
      consultationFee: number;
    };
  },
): Promise<AuthResponse> => {
  const existingUser = await prisma.user.findUnique({
    where: { email: payload.email },
  });

  if (existingUser) {
    throw new AppError("Email already in use", 409);
  }

  const user = await prisma.user.create({
    data: {
      name: payload.name,
      email: payload.email,
      passwordHash: payload.passwordHash,
      role: payload.role,
      doctorProfile: payload.doctorProfile
        ? {
            create: payload.doctorProfile,
          }
        : undefined,
    },
    include: {
      doctorProfile: true,
    },
  });

  return buildAuthResponse(user);
};

export const registerDoctor = async (input: RegisterDoctorInput): Promise<AuthResponse> => {
  const passwordHash = await bcrypt.hash(input.password, 10);

  return createUser({
    name: input.name,
    email: input.email,
    passwordHash,
    role: "doctor",
    doctorProfile: {
      specialization: input.specialization,
      experience: input.experience,
      consultationFee: input.consultationFee,
    },
  });
};

export const registerPatient = async (input: RegisterPatientInput): Promise<AuthResponse> => {
  const passwordHash = await bcrypt.hash(input.password, 10);

  return createUser({
    name: input.name,
    email: input.email,
    passwordHash,
    role: "patient",
  });
};

export const loginByRole = async (input: LoginInput, role: UserRole): Promise<AuthResponse> => {
  const user = await prisma.user.findUnique({
    where: { email: input.email },
    include: {
      doctorProfile: true,
    },
  });

  if (!user || user.role !== role) {
    throw new AppError("Invalid email or password", 401);
  }

  const isPasswordValid = await bcrypt.compare(input.password, user.passwordHash);
  if (!isPasswordValid) {
    throw new AppError("Invalid email or password", 401);
  }

  return buildAuthResponse(user);
};