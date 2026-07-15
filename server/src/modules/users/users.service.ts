import bcrypt from "bcrypt";
import prisma from "../../lib/prisma.js";
import { signAccessToken, signRefreshToken, verifyRefreshToken } from "../../lib/jwt.js";
import { AppError } from "../../utils/app-error.js";
import type { RegisterPatientInput, LoginInput } from "./users.schemas.js";

type UserRole = "patient" | "admin";

type AuthResponse = {
  token: string;
  refreshToken: string;
  user: {
    id: string;
    name: string;
    email: string;
    role: "patient" | "admin" | "doctor";
    age?: number;
    createdAt: Date;
  };
};

const buildAuthResponse = async (user: {
  id: string;
  name: string;
  email: string;
  role: any;
  age?: number | null;
  createdAt: Date;
}): Promise<AuthResponse> => {
  const token = signAccessToken({
    id: user.id,
    email: user.email,
    role: user.role,
  });

  const refreshToken = signRefreshToken({
    id: user.id,
    email: user.email,
    role: user.role,
  });

  await prisma.user.update({
    where: { id: user.id },
    data: { refreshToken },
  });

  return {
    token,
    refreshToken,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      age: user.age ?? undefined,
      createdAt: user.createdAt,
    },
  };
};

export const registerPatient = async (input: RegisterPatientInput): Promise<AuthResponse> => {
  const passwordHash = await bcrypt.hash(input.password, 10);

  const existingUser = await prisma.user.findUnique({
    where: { email: input.email },
  });

  if (existingUser) {
    throw new AppError("Email already in use", 409);
  }

  // Also verify not in use by doctor
  const existingDoctor = await prisma.doctor.findUnique({
    where: { email: input.email },
  });

  if (existingDoctor) {
    throw new AppError("Email already in use", 409);
  }

  const user = await prisma.user.create({
    data: {
      name: input.name,
      email: input.email,
      passwordHash,
      role: "patient",
    },
  });

  return await buildAuthResponse(user);
};

export const loginByRole = async (input: LoginInput, role: UserRole): Promise<AuthResponse> => {
  const user = await prisma.user.findUnique({
    where: { email: input.email },
  });

  if (!user || user.role !== role) {
    throw new AppError("Invalid email or password", 401);
  }

  const isPasswordValid = await bcrypt.compare(input.password, user.passwordHash);
  if (!isPasswordValid) {
    throw new AppError("Invalid email or password", 401);
  }

  return await buildAuthResponse(user);
};

type PatientAnalyticsListParams = {
  page: number;
  limit: number;
  search?: string;
};

type PatientAnalyticsRow = {
  id: string;
  name: string;
  totalBookings: number;
  lastAppointment: string | null;
  status: "Active" | "Inactive";
};

type PatientAnalyticsResponse = {
  patients: PatientAnalyticsRow[];
  total: number;
  page: number;
  totalPages: number;
};

const ACTIVE_WINDOW_DAYS = 90;

export const getPatientAnalytics = async ({
  page,
  limit,
  search,
}: PatientAnalyticsListParams): Promise<PatientAnalyticsResponse> => {
  const skip = (page - 1) * limit;
  const trimmedSearch = search?.trim();

  const where = {
    role: "patient" as const,
    ...(trimmedSearch
      ? {
          OR: [
            { name: { contains: trimmedSearch, mode: "insensitive" as const } },
            { email: { contains: trimmedSearch, mode: "insensitive" as const } },
          ],
        }
      : {}),
  };

  const [total, patients] = await Promise.all([
    prisma.user.count({ where }),
    prisma.user.findMany({
      where,
      select: {
        id: true,
        name: true,
      },
      orderBy: { name: "asc" },
      skip,
      take: limit,
    }),
  ]);

  const patientIds = patients.map((patient) => patient.id);

  const stats = await prisma.appointment.groupBy({
    by: ["patientId"],
    where: {
      patientId: { in: patientIds },
    },
    _count: {
      _all: true,
    },
    _max: {
      date: true,
    },
  });

  const statsMap = new Map(stats.map((entry) => [entry.patientId, entry]));
  const activeCutoff = new Date();
  activeCutoff.setDate(activeCutoff.getDate() - ACTIVE_WINDOW_DAYS);

  return {
    patients: patients.map((patient) => {
      const patientStats = statsMap.get(patient.id);
      const totalBookings = patientStats?._count._all ?? 0;
      const lastAppointmentDate = patientStats?._max.date ?? null;

      const status: "Active" | "Inactive" =
        lastAppointmentDate && lastAppointmentDate >= activeCutoff ? "Active" : "Inactive";

      return {
        id: patient.id,
        name: patient.name,
        totalBookings,
        lastAppointment: lastAppointmentDate ? lastAppointmentDate.toISOString() : null,
        status,
      };
    }),
    total,
    page,
    totalPages: Math.max(1, Math.ceil(total / limit)),
  };
};

export const refreshAccessToken = async (token: string): Promise<AuthResponse> => {
  let decoded: any;
  try {
    decoded = verifyRefreshToken(token);
  } catch (error) {
    throw new AppError("Invalid or expired refresh token", 401);
  }

  if (!decoded || !decoded.id || !decoded.role) {
    throw new AppError("Invalid refresh token payload", 401);
  }

  // Check in DB
  if (decoded.role === "doctor") {
    const doctor = await prisma.doctor.findUnique({
      where: { id: decoded.id },
    });
    if (!doctor || doctor.refreshToken !== token) {
      throw new AppError("Invalid refresh token", 401);
    }

    // Rotate tokens
    const newAccessToken = signAccessToken({ id: doctor.id, email: doctor.email, role: "doctor" });
    const newRefreshToken = signRefreshToken({ id: doctor.id, email: doctor.email, role: "doctor" });

    await prisma.doctor.update({
      where: { id: doctor.id },
      data: { refreshToken: newRefreshToken },
    });

    return {
      token: newAccessToken,
      refreshToken: newRefreshToken,
      user: {
        id: doctor.id,
        name: doctor.name,
        email: doctor.email,
        role: "doctor",
        createdAt: doctor.createdAt,
        doctorProfile: {
          specialization: doctor.specialization,
          experience: doctor.experience,
          consultationFee: doctor.consultationFee,
        },
      } as any,
    };
  } else {
    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
    });
    if (!user || user.refreshToken !== token) {
      throw new AppError("Invalid refresh token", 401);
    }

    // Rotate tokens
    const newAccessToken = signAccessToken({ id: user.id, email: user.email, role: user.role });
    const newRefreshToken = signRefreshToken({ id: user.id, email: user.email, role: user.role });

    await prisma.user.update({
      where: { id: user.id },
      data: { refreshToken: newRefreshToken },
    });

    return {
      token: newAccessToken,
      refreshToken: newRefreshToken,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        age: user.age ?? undefined,
        createdAt: user.createdAt,
      },
    };
  }
};
