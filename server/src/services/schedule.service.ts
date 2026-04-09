import { DayOfWeek } from "@prisma/client";
import prisma from "../lib/prisma.js";
import { AppError } from "../utils/app-error.js";
import {
  CreateScheduleInput,
  GetAvailabilityQuery,
  UpsertUnavailabilityInput,
} from "../schemas/schedule.schemas.js";
import { minutesToLabel, normalizeDateOnly, parseTimeToMinutes } from "../utils/time.js";

const dayNameByIndex: DayOfWeek[] = [
  "SUNDAY",
  "MONDAY",
  "TUESDAY",
  "WEDNESDAY",
  "THURSDAY",
  "FRIDAY",
  "SATURDAY",
];

const assertDoctor = async (doctorId: string) => {
  const doctor = await prisma.user.findUnique({ where: { id: doctorId } });

  if (!doctor || doctor.role !== "doctor") {
    throw new AppError("Doctor account not found", 404);
  }
};

export const createDoctorSchedule = async (input: CreateScheduleInput) => {
  await assertDoctor(input.doctorId);

  const startTimeMinutes = parseTimeToMinutes(input.startTime);
  const endTimeMinutes = parseTimeToMinutes(input.endTime);

  if (endTimeMinutes <= startTimeMinutes) {
    throw new AppError("Schedule end time must be after start time", 400);
  }

  const overlapping = await prisma.schedule.findFirst({
    where: {
      doctorId: input.doctorId,
      dayOfWeek: input.dayOfWeek,
      startTime: { lt: endTimeMinutes },
      endTime: { gt: startTimeMinutes },
    },
  });

  if (overlapping) {
    throw new AppError("Schedule overlaps an existing slot", 409);
  }

  const schedule = await prisma.schedule.create({
    data: {
      doctorId: input.doctorId,
      dayOfWeek: input.dayOfWeek,
      startTime: startTimeMinutes,
      endTime: endTimeMinutes,
    },
  });

  return {
    id: schedule.id,
    doctorId: schedule.doctorId,
    dayOfWeek: schedule.dayOfWeek,
    startTime: minutesToLabel(schedule.startTime),
    endTime: minutesToLabel(schedule.endTime),
  };
};

export const addDoctorUnavailability = async (input: UpsertUnavailabilityInput) => {
  await assertDoctor(input.doctorId);

  const date = normalizeDateOnly(input.date);
  const startTime = parseTimeToMinutes(input.startTime);
  const endTime = parseTimeToMinutes(input.endTime);

  if (endTime <= startTime) {
    throw new AppError("Unavailable end time must be after start time", 400);
  }

  const dayOfWeek = dayNameByIndex[new Date(date).getUTCDay()];
  const coveringSchedule = await prisma.schedule.findFirst({
    where: {
      doctorId: input.doctorId,
      dayOfWeek,
      startTime: { lte: startTime },
      endTime: { gte: endTime },
    },
  });

  if (!coveringSchedule) {
    throw new AppError("Unavailable window must be inside an existing schedule", 400);
  }

  const overlap = await prisma.doctorUnavailability.findFirst({
    where: {
      doctorId: input.doctorId,
      date,
      startTime: { lt: endTime },
      endTime: { gt: startTime },
    },
  });

  if (overlap) {
    throw new AppError("Unavailable window overlaps an existing one", 409);
  }

  const blocked = await prisma.doctorUnavailability.create({
    data: {
      doctorId: input.doctorId,
      date,
      startTime,
      endTime,
      reason: input.reason,
    },
  });

  return {
    id: blocked.id,
    doctorId: blocked.doctorId,
    date: blocked.date,
    startTime: minutesToLabel(blocked.startTime),
    endTime: minutesToLabel(blocked.endTime),
    reason: blocked.reason,
  };
};

export const getDoctorAvailability = async (doctorId: string, query: GetAvailabilityQuery) => {
  await assertDoctor(doctorId);

  const date = normalizeDateOnly(query.date);
  const slotDurationMinutes = query.slotDurationMinutes ?? 30;
  const dayOfWeek = dayNameByIndex[new Date(date).getUTCDay()];

  const schedules = await prisma.schedule.findMany({
    where: {
      doctorId,
      dayOfWeek,
    },
    orderBy: {
      startTime: "asc",
    },
  });

  const blocks = await prisma.doctorUnavailability.findMany({
    where: {
      doctorId,
      date,
    },
  });

  const booked = await prisma.appointment.findMany({
    where: {
      doctorId,
      date,
      status: "booked",
    },
    select: {
      startTime: true,
      endTime: true,
    },
  });

  const slots: Array<{ startTime: string; endTime: string }> = [];

  for (const schedule of schedules) {
    for (
      let current = schedule.startTime;
      current + slotDurationMinutes <= schedule.endTime;
      current += slotDurationMinutes
    ) {
      const slotStart = current;
      const slotEnd = current + slotDurationMinutes;

      const blocked = blocks.some((block) => block.startTime < slotEnd && block.endTime > slotStart);
      const reserved = booked.some((item) => item.startTime < slotEnd && item.endTime > slotStart);

      if (!blocked && !reserved) {
        slots.push({
          startTime: minutesToLabel(slotStart),
          endTime: minutesToLabel(slotEnd),
        });
      }
    }
  }

  return {
    doctorId,
    date,
    slotDurationMinutes,
    slots,
  };
};
