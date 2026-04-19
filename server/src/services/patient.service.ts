import prisma from "../lib/prisma.js";

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
