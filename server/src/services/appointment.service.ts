import prisma from "../lib/prisma.js";
import {
  CreateAppointmentInput,
  UpdateAppointmentByDoctorInput,
} from "../schemas/appointment.schemas.js";
import { AppError } from "../utils/app-error.js";
import { minutesToLabel, normalizeDateOnly, parseTimeToMinutes } from "../utils/time.js";
import {
  calculateExpectedPatients,
  calculateWaitTime,
  predictNoShow,
} from "./predictionService.js";

type CreateAppointmentPayload = CreateAppointmentInput & {
  patientId: string;
};

const dayNameByIndex = [
  "SUNDAY",
  "MONDAY",
  "TUESDAY",
  "WEDNESDAY",
  "THURSDAY",
  "FRIDAY",
  "SATURDAY",
] as const;

const DEFAULT_DAY_START_MINUTES = 10 * 60;
const DEFAULT_DAY_END_MINUTES = 19 * 60;
const DEFAULT_SLOT_DURATION_MINUTES = 30;
const DEFAULT_AVG_CONSULTATION_TIME_MINUTES = 15;

type WaitLevel = "low" | "moderate" | "high";

type SlotPrediction = {
  time: string;
  startTime: string;
  endTime: string;
  estimatedWaitTime: number;
  waitLevel: WaitLevel;
};

type PredictedSlotResponse = {
  slots: SlotPrediction[];
  recommendedSlot: string | null;
  avoidSlot: string | null;
};

type AdminPredictionInsights = {
  totalAppointments: number;
  expectedPatients: number;
  predictedNoShows: number;
};

type PatientHistoryStats = {
  totalPastAppointments: number;
  previousNoShows: number;
};

const waitLevelForMinutes = (minutes: number): WaitLevel => {
  if (minutes <= 15) return "low";
  if (minutes <= 30) return "moderate";
  return "high";
};

const getPatientHistoryMap = async (
  patientIds: string[],
  cutoffDate: Date
): Promise<Map<string, PatientHistoryStats>> => {
  if (patientIds.length === 0) return new Map();

  const history = await prisma.appointment.findMany({
    where: {
      patientId: { in: patientIds },
      date: { lt: cutoffDate },
      status: { in: ["completed", "no_show"] },
    },
    select: {
      patientId: true,
      status: true,
    },
  });

  const map = new Map<string, PatientHistoryStats>();
  for (const record of history) {
    const existing = map.get(record.patientId) ?? { totalPastAppointments: 0, previousNoShows: 0 };
    existing.totalPastAppointments += 1;
    if (record.status === "no_show") {
      existing.previousNoShows += 1;
    }
    map.set(record.patientId, existing);
  }

  return map;
};

const getNoShowProbability = (
  patientId: string,
  appointmentDate: Date,
  startTimeMinutes: number,
  historyByPatientId: Map<string, PatientHistoryStats>
): number => {
  const stats = historyByPatientId.get(patientId) ?? {
    totalPastAppointments: 0,
    previousNoShows: 0,
  };
  const now = Date.now();
  const slotTimestamp = new Date(appointmentDate).getTime() + startTimeMinutes * 60 * 1000;
  const leadHours = Math.max(0, Math.round((slotTimestamp - now) / (60 * 60 * 1000)));

  return predictNoShow({
    previousNoShows: stats.previousNoShows,
    totalPastAppointments: stats.totalPastAppointments,
    leadHours,
    hasPriorVisits: stats.totalPastAppointments > 0,
  });
};

const estimateWaitForSlot = (
  slotStartMinutes: number,
  bookedAppointments: Array<{ startTime: number; noShowProbability: number }>,
  avgConsultationTimeMinutes = DEFAULT_AVG_CONSULTATION_TIME_MINUTES
): number => {
  const precedingProbabilities = bookedAppointments
    .filter((appointment) => appointment.startTime < slotStartMinutes)
    .map((appointment) => appointment.noShowProbability);
  const expectedPatients = calculateExpectedPatients(precedingProbabilities);
  return calculateWaitTime(expectedPatients, avgConsultationTimeMinutes);
};

const formatAppointment = (appointment: {
  id: string;
  patientId: string;
  doctorId: string;
  scheduleId: string;
  date: Date;
  startTime: number;
  endTime: number;
  patientAge?: number | null;
  status: string;
  remarks: string | null;
  createdAt: Date;
}) => ({
  id: appointment.id,
  patientId: appointment.patientId,
  doctorId: appointment.doctorId,
  scheduleId: appointment.scheduleId,
  date: appointment.date,
  startTime: minutesToLabel(appointment.startTime),
  endTime: minutesToLabel(appointment.endTime),
  patientAge: appointment.patientAge ?? null,
  status: appointment.status,
  remarks: appointment.remarks,
  createdAt: appointment.createdAt,
});

export const createAppointment = async (input: CreateAppointmentPayload) => {
  const [patient, doctor] = await Promise.all([
    prisma.user.findUnique({ where: { id: input.patientId } }),
    prisma.user.findUnique({ where: { id: input.doctorId } }),
  ]);

  if (!patient || patient.role !== "patient") {
    throw new AppError("Patient account not found", 404);
  }

  // If the booking provided a patient age, persist to patient profile for future use
  if (typeof input.patientAge === "number" && input.patientAge > 0) {
    try {
      const currentAge = (patient as any).age as number | undefined;
      if (!currentAge || currentAge !== input.patientAge) {
        await prisma.user.update({ where: { id: patient.id }, data: { age: input.patientAge } });
      }
    } catch (e) {
      // Non-fatal: if updating age fails, continue with appointment creation
    }
  }

  if (!doctor || doctor.role !== "doctor") {
    throw new AppError("Doctor account not found", 404);
  }

  const date = normalizeDateOnly(input.date);
  const startTime = parseTimeToMinutes(input.startTime);
  const endTime = parseTimeToMinutes(input.endTime);

  if (endTime <= startTime) {
    throw new AppError("Appointment end time must be after start time", 400);
  }

  const dayOfWeek = dayNameByIndex[new Date(date).getUTCDay()];

  const schedule = await prisma.schedule.findFirst({
    where: {
      doctorId: input.doctorId,
      dayOfWeek,
      startTime: { lte: startTime },
      endTime: { gte: endTime },
    },
  });
  let effectiveSchedule = schedule;

  if (!effectiveSchedule) {
    const isWithinDefaultWindow =
      startTime >= DEFAULT_DAY_START_MINUTES &&
      endTime <= DEFAULT_DAY_END_MINUTES &&
      endTime - startTime === DEFAULT_SLOT_DURATION_MINUTES &&
      (startTime - DEFAULT_DAY_START_MINUTES) % DEFAULT_SLOT_DURATION_MINUTES === 0;

    if (!isWithinDefaultWindow) {
      throw new AppError("Requested time is outside doctor schedule", 400);
    }

    const existingDefaultSchedule = await prisma.schedule.findFirst({
      where: {
        doctorId: input.doctorId,
        dayOfWeek,
        startTime: DEFAULT_DAY_START_MINUTES,
        endTime: DEFAULT_DAY_END_MINUTES,
        slotDurationMinutes: DEFAULT_SLOT_DURATION_MINUTES,
      },
    });

    effectiveSchedule =
      existingDefaultSchedule ??
      (await prisma.schedule.create({
        data: {
          doctorId: input.doctorId,
          dayOfWeek,
          startTime: DEFAULT_DAY_START_MINUTES,
          endTime: DEFAULT_DAY_END_MINUTES,
          slotDurationMinutes: DEFAULT_SLOT_DURATION_MINUTES,
        },
      }));
  }

  const blocked = await prisma.doctorUnavailability.findFirst({
    where: {
      doctorId: input.doctorId,
      date,
      startTime: { lt: endTime },
      endTime: { gt: startTime },
    },
  });

  if (blocked) {
    throw new AppError("Doctor is unavailable for this slot", 409);
  }

  const conflict = await prisma.appointment.findFirst({
    where: {
      doctorId: input.doctorId,
      date,
      status: "booked",
      startTime: { lt: endTime },
      endTime: { gt: startTime },
    },
  });

  if (conflict) {
    throw new AppError("This slot has already been booked", 409);
  }

  const appointment = await prisma.appointment.create({
    data: {
      patientId: input.patientId,
      doctorId: input.doctorId,
      scheduleId: effectiveSchedule.id,
      date,
      startTime,
      endTime,
      patientAge: input.patientAge ?? null,
      status: "booked",
      remarks: input.remarks ?? null,
    },
  });

  return formatAppointment(appointment);
};

export const getAppointmentsForPatient = async (
  patientId: string,
  page = 1,
  limit = 10
) => {
  const skip = (page - 1) * limit;
  const where = { patientId };

  const [total, appointments] = await Promise.all([
    prisma.appointment.count({ where }),
    prisma.appointment.findMany({
      where,
      orderBy: { date: "desc" },
      skip,
      take: limit,
      include: {
        doctor: {
          select: {
            id: true,
            name: true,
            email: true,
            doctorProfile: {
              select: { specialization: true, consultationFee: true },
            },
          },
        },
      },
    }),
  ]);

  const bookedByDoctorDateKey = new Map<string, Array<{ startTime: number; noShowProbability: number }>>();

  const bookingKeys = Array.from(
    new Set(
      appointments
        .filter((appointment) => appointment.status === "booked")
        .map((appointment) => `${appointment.doctorId}|${appointment.date.toISOString().slice(0, 10)}`)
    )
  );

  for (const key of bookingKeys) {
    const [doctorId, datePart] = key.split("|");
    const date = normalizeDateOnly(datePart);
    const bookedAppointments = await prisma.appointment.findMany({
      where: {
        doctorId,
        date,
        status: "booked",
      },
      select: {
        patientId: true,
        startTime: true,
      },
      orderBy: { startTime: "asc" },
    });

    const patientHistoryMap = await getPatientHistoryMap(
      Array.from(new Set(bookedAppointments.map((item) => item.patientId))),
      date
    );

    bookedByDoctorDateKey.set(
      key,
      bookedAppointments.map((item) => ({
        startTime: item.startTime,
        noShowProbability: getNoShowProbability(item.patientId, date, item.startTime, patientHistoryMap),
      }))
    );
  }

  return {
    appointments: appointments.map((a) => {
      const formatted = formatAppointment(a);
      if (a.status !== "booked") {
        return { ...formatted, doctor: a.doctor, estimatedWaitTime: null };
      }

      const key = `${a.doctorId}|${a.date.toISOString().slice(0, 10)}`;
      const dayAppointments = bookedByDoctorDateKey.get(key) ?? [];
      const estimatedWaitTime = estimateWaitForSlot(a.startTime, dayAppointments);

      return { ...formatted, doctor: a.doctor, estimatedWaitTime };
    }),
    total,
    page,
    totalPages: Math.max(1, Math.ceil(total / limit)),
  };
};

export const getAppointmentsForDoctor = async (
  doctorId: string,
  page = 1,
  limit = 10,
  search?: string,
  dateStr?: string
) => {
  const skip = (page - 1) * limit;
  const where: any = { doctorId };

  if (dateStr) {
    where.date = normalizeDateOnly(dateStr);
  }

  if (search) {
    where.OR = [
      { id: { contains: search, mode: "insensitive" } },
      { patient: { name: { contains: search, mode: "insensitive" } } },
    ];
  }

  const [total, appointments] = await Promise.all([
    prisma.appointment.count({ where }),
    prisma.appointment.findMany({
      where,
      orderBy: { date: "desc" },
      skip,
      take: limit,
      include: {
        patient: {
          select: { id: true, name: true, email: true },
        },
      },
    }),
  ]);

  return {
    appointments: appointments.map((a) => ({ ...formatAppointment(a), patient: a.patient })),
    total,
    page,
    totalPages: Math.max(1, Math.ceil(total / limit)),
  };
};

export const getAppointmentsForAdmin = async (
  page = 1,
  limit = 10,
  search?: string,
  dateStr?: string,
  status?: "booked" | "completed" | "cancelled"
) => {
  const skip = (page - 1) * limit;
  const where: any = {};

  if (status) {
    where.status = status;
  }

  if (dateStr) {
    where.date = normalizeDateOnly(dateStr);
  }

  if (search) {
    where.OR = [
      { id: { contains: search, mode: "insensitive" } },
      { patient: { name: { contains: search, mode: "insensitive" } } },
      { doctor: { name: { contains: search, mode: "insensitive" } } },
    ];
  }

  const [total, appointments] = await Promise.all([
    prisma.appointment.count({ where }),
    prisma.appointment.findMany({
      where,
      orderBy: { date: "desc" },
      skip,
      take: limit,
      include: {
        patient: { select: { id: true, name: true, email: true } },
        doctor: { select: { id: true, name: true, email: true } },
      },
    }),
  ]);

  return {
    appointments: appointments.map((a) => ({
      ...formatAppointment(a),
      patient: a.patient,
      doctor: a.doctor,
    })),
    total,
    page,
    totalPages: Math.max(1, Math.ceil(total / limit)),
  };
};

export const cancelAppointmentById = async (
  appointmentId: string,
  userId: string,
  role: string
) => {
  const appointment = await prisma.appointment.findUnique({
    where: { id: appointmentId },
  });

  if (!appointment) {
    throw new AppError("Appointment not found", 404);
  }

  if (role === "patient" && appointment.patientId !== userId) {
    throw new AppError("You can only cancel your own appointments", 403);
  }

  if (appointment.status === "cancelled") {
    throw new AppError("Appointment is already cancelled", 400);
  }

  if (appointment.status === "completed") {
    throw new AppError("Cannot cancel a completed appointment", 400);
  }

  const updated = await prisma.appointment.update({
    where: { id: appointmentId },
    data: { status: "cancelled", remarks: appointment.remarks },
  });

  return formatAppointment(updated);
};

export const completeAppointmentById = async (
  appointmentId: string,
  doctorId: string
) => {
  const appointment = await prisma.appointment.findUnique({
    where: { id: appointmentId },
  });

  if (!appointment) {
    throw new AppError("Appointment not found", 404);
  }

  if (appointment.doctorId !== doctorId) {
    throw new AppError("You can only complete your own appointments", 403);
  }

  if (appointment.status !== "booked") {
    throw new AppError("Only booked appointments can be marked as completed", 400);
  }

  const updated = await prisma.appointment.update({
    where: { id: appointmentId },
    data: { status: "completed" },
  });

  return formatAppointment(updated);
};

export const updateAppointmentByDoctor = async (
  appointmentId: string,
  doctorId: string,
  input: UpdateAppointmentByDoctorInput
) => {
  const appointment = await prisma.appointment.findUnique({ where: { id: appointmentId } });

  if (!appointment) {
    throw new AppError("Appointment not found", 404);
  }

  if (appointment.doctorId !== doctorId) {
    throw new AppError("You can only update your own appointments", 403);
  }

  if (appointment.status === "completed" || appointment.status === "cancelled") {
    throw new AppError("Completed or cancelled appointments cannot be changed", 400);
  }

  const updated = await prisma.appointment.update({
    where: { id: appointmentId },
    data: {
      status: input.status,
      remarks: input.remarks ?? appointment.remarks,
    },
  });

  return formatAppointment(updated);
};

export const getPredictedSlotsForDoctor = async (
  doctorId: string,
  dateInput: string,
  avgConsultationTimeMinutes = DEFAULT_AVG_CONSULTATION_TIME_MINUTES
): Promise<PredictedSlotResponse> => {
  const doctor = await prisma.user.findUnique({ where: { id: doctorId } });
  if (!doctor || doctor.role !== "doctor") {
    throw new AppError("Doctor account not found", 404);
  }

  const date = normalizeDateOnly(dateInput);
  const dayOfWeek = dayNameByIndex[new Date(date).getUTCDay()];

  const schedules = await prisma.schedule.findMany({
    where: {
      doctorId,
      dayOfWeek,
    },
    orderBy: { startTime: "asc" },
    select: {
      startTime: true,
      endTime: true,
      slotDurationMinutes: true,
    },
  });

  const scheduleWindows =
    schedules.length > 0
      ? schedules
      : [
          {
            startTime: DEFAULT_DAY_START_MINUTES,
            endTime: DEFAULT_DAY_END_MINUTES,
            slotDurationMinutes: DEFAULT_SLOT_DURATION_MINUTES,
          },
        ];

  const [blocks, bookedAppointments] = await Promise.all([
    prisma.doctorUnavailability.findMany({
      where: {
        doctorId,
        date,
      },
      select: {
        startTime: true,
        endTime: true,
      },
    }),
    prisma.appointment.findMany({
      where: {
        doctorId,
        date,
        status: "booked",
      },
      select: {
        patientId: true,
        startTime: true,
        endTime: true,
      },
      orderBy: { startTime: "asc" },
    }),
  ]);

  const patientHistoryMap = await getPatientHistoryMap(
    Array.from(new Set(bookedAppointments.map((item) => item.patientId))),
    date
  );

  const bookedWithPrediction = bookedAppointments.map((appointment) => ({
    startTime: appointment.startTime,
    noShowProbability: getNoShowProbability(
      appointment.patientId,
      date,
      appointment.startTime,
      patientHistoryMap
    ),
  }));

  const predictedSlots: SlotPrediction[] = [];

  for (const schedule of scheduleWindows) {
    for (
      let current = schedule.startTime;
      current + schedule.slotDurationMinutes <= schedule.endTime;
      current += schedule.slotDurationMinutes
    ) {
      const slotStart = current;
      const slotEnd = current + schedule.slotDurationMinutes;

      const blocked = blocks.some((block) => block.startTime < slotEnd && block.endTime > slotStart);
      const reserved = bookedAppointments.some(
        (item) => item.startTime < slotEnd && item.endTime > slotStart
      );

      if (blocked || reserved) {
        continue;
      }

      const estimatedWaitTime = estimateWaitForSlot(
        slotStart,
        bookedWithPrediction,
        avgConsultationTimeMinutes
      );

      predictedSlots.push({
        time: minutesToLabel(slotStart),
        startTime: minutesToLabel(slotStart),
        endTime: minutesToLabel(slotEnd),
        estimatedWaitTime,
        waitLevel: waitLevelForMinutes(estimatedWaitTime),
      });
    }
  }

  if (predictedSlots.length === 0) {
    return {
      slots: [],
      recommendedSlot: null,
      avoidSlot: null,
    };
  }

  const byWaitAsc = [...predictedSlots].sort((a, b) => a.estimatedWaitTime - b.estimatedWaitTime);

  return {
    slots: predictedSlots,
    recommendedSlot: byWaitAsc[0].time,
    avoidSlot: byWaitAsc[byWaitAsc.length - 1].time,
  };
};

export const getAdminAppointmentPredictionInsights = async (): Promise<AdminPredictionInsights> => {
  const [totalAppointments, upcomingBooked] = await Promise.all([
    prisma.appointment.count(),
    prisma.appointment.findMany({
      where: {
        status: "booked",
        date: {
          gte: normalizeDateOnly(new Date().toISOString()),
        },
      },
      select: {
        patientId: true,
        startTime: true,
        date: true,
      },
    }),
  ]);

  const patientHistoryMap = await getPatientHistoryMap(
    Array.from(new Set(upcomingBooked.map((item) => item.patientId))),
    normalizeDateOnly(new Date().toISOString())
  );

  const noShowProbabilities = upcomingBooked.map((appointment) =>
    getNoShowProbability(appointment.patientId, appointment.date, appointment.startTime, patientHistoryMap)
  );

  const expectedPatients = calculateExpectedPatients(noShowProbabilities);
  const predictedNoShows = Number((upcomingBooked.length - expectedPatients).toFixed(2));

  return {
    totalAppointments,
    expectedPatients,
    predictedNoShows,
  };
};
