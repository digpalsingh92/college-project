import prisma from "../lib/prisma.js";
import { AppError } from "../utils/app-error.js";

type DoctorAnalyticsListParams = {
  page: number;
  limit: number;
  search?: string;
};

type DoctorAnalyticsRow = {
  id: string;
  name: string;
  specialization: string;
  totalAppointments: number;
  upcomingAppointments: number;
};

type DoctorAnalyticsResponse = {
  doctors: DoctorAnalyticsRow[];
  total: number;
  page: number;
  totalPages: number;
};

const doctorSelect = {
  id: true,
  name: true,
  email: true,
  createdAt: true,
  doctorProfile: {
    select: {
      specialization: true,
      experience: true,
      consultationFee: true,
    },
  },
};

export const getDoctorProfile = async (userId: string) => {
  const doctor = await prisma.user.findUnique({
    where: { id: userId, role: "doctor" },
    select: doctorSelect,
  });

  if (!doctor) {
    throw new AppError("Doctor profile not found", 404);
  }

  return doctor;
};

export const getAllDoctors = async (filters?: { search?: string; specialization?: string }) => {
  const search = filters?.search?.trim();
  const specialization = filters?.specialization?.trim();

  const where: any = {
    role: "doctor" as const,
  };

  const andConditions: any[] = [];

  if (search) {
    andConditions.push({
      OR: [
        { name: { contains: search, mode: "insensitive" as const } },
        { email: { contains: search, mode: "insensitive" as const } },
      ],
    });
  }

  if (specialization) {
    andConditions.push({
      doctorProfile: {
        specialization: { contains: specialization, mode: "insensitive" as const },
      },
    });
  }

  if (andConditions.length > 0) {
    where.AND = andConditions;
  }

  return prisma.user.findMany({
    where,
    select: doctorSelect,
    orderBy: { name: "asc" },
  });
};

export const getDoctorById = async (id: string) => {
  const doctor = await prisma.user.findUnique({
    where: { id, role: "doctor" },
    select: doctorSelect,
  });

  if (!doctor) {
    throw new AppError("Doctor not found", 404);
  }

  return doctor;
};

export const getDoctorAnalytics = async ({
  page,
  limit,
  search,
}: DoctorAnalyticsListParams): Promise<DoctorAnalyticsResponse> => {
  const skip = (page - 1) * limit;
  const trimmedSearch = search?.trim();

  const where = {
    role: "doctor" as const,
    ...(trimmedSearch
      ? {
          OR: [
            { name: { contains: trimmedSearch, mode: "insensitive" as const } },
            {
              doctorProfile: {
                specialization: { contains: trimmedSearch, mode: "insensitive" as const },
              },
            },
          ],
        }
      : {}),
  };

  const [total, doctors] = await Promise.all([
    prisma.user.count({ where }),
    prisma.user.findMany({
      where,
      select: {
        id: true,
        name: true,
        doctorProfile: {
          select: {
            specialization: true,
          },
        },
      },
      orderBy: { name: "asc" },
      skip,
      take: limit,
    }),
  ]);

  const doctorIds = doctors.map((doctor) => doctor.id);

  const [totalsByDoctor, upcomingByDoctor] = await Promise.all([
    prisma.appointment.groupBy({
      by: ["doctorId"],
      where: {
        doctorId: { in: doctorIds },
      },
      _count: {
        _all: true,
      },
    }),
    prisma.appointment.groupBy({
      by: ["doctorId"],
      where: {
        doctorId: { in: doctorIds },
        status: "booked",
        date: {
          gte: new Date(),
        },
      },
      _count: {
        _all: true,
      },
    }),
  ]);

  const totalCountMap = new Map(totalsByDoctor.map((entry) => [entry.doctorId, entry._count._all]));
  const upcomingCountMap = new Map(upcomingByDoctor.map((entry) => [entry.doctorId, entry._count._all]));

  return {
    doctors: doctors.map((doctor) => ({
      id: doctor.id,
      name: doctor.name,
      specialization: doctor.doctorProfile?.specialization ?? "General",
      totalAppointments: totalCountMap.get(doctor.id) ?? 0,
      upcomingAppointments: upcomingCountMap.get(doctor.id) ?? 0,
    })),
    total,
    page,
    totalPages: Math.max(1, Math.ceil(total / limit)),
  };
};
