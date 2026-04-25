import type { DayOfWeek } from "../../generated/prisma/enums.js";
import prisma from "../lib/prisma.js";
import { AppError } from "../utils/app-error.js";
import {
  CreateScheduleInput,
  GetAvailabilityQuery,
  UpdateScheduleInput,
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

const DEFAULT_DAY_START_MINUTES = 10 * 60; // 10:00 AM
const DEFAULT_DAY_END_MINUTES = 19 * 60; // 7:00 PM
const DEFAULT_SLOT_DURATION_MINUTES = 30;

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
  const slotDurationMinutes = input.slotDurationMinutes ?? DEFAULT_SLOT_DURATION_MINUTES;

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
      slotDurationMinutes,
    },
  });

  return {
    id: schedule.id,
    doctorId: schedule.doctorId,
    dayOfWeek: schedule.dayOfWeek,
    startTime: minutesToLabel(schedule.startTime),
    endTime: minutesToLabel(schedule.endTime),
    slotDurationMinutes: schedule.slotDurationMinutes,
  };
};

export const getDoctorSchedules = async (doctorId: string) => {
  await assertDoctor(doctorId);

  const schedules = await prisma.schedule.findMany({
    where: { doctorId },
    orderBy: [{ dayOfWeek: "asc" }, { startTime: "asc" }],
  });

  return schedules.map((s) => ({
    id: s.id,
    doctorId: s.doctorId,
    dayOfWeek: s.dayOfWeek,
    startTime: minutesToLabel(s.startTime),
    endTime: minutesToLabel(s.endTime),
    slotDurationMinutes: s.slotDurationMinutes,
  }));
};

export const updateDoctorSchedule = async (scheduleId: string, doctorId: string, input: UpdateScheduleInput) => {
  const existing = await prisma.schedule.findUnique({ where: { id: scheduleId } });
  if (!existing || existing.doctorId !== doctorId) {
    throw new AppError("Schedule not found", 404);
  }

  const startTimeMinutes = parseTimeToMinutes(input.startTime);
  const endTimeMinutes = parseTimeToMinutes(input.endTime);

  if (endTimeMinutes <= startTimeMinutes) {
    throw new AppError("Schedule end time must be after start time", 400);
  }

  const overlapping = await prisma.schedule.findFirst({
    where: {
      doctorId,
      dayOfWeek: input.dayOfWeek ?? existing.dayOfWeek,
      id: { not: scheduleId },
      startTime: { lt: endTimeMinutes },
      endTime: { gt: startTimeMinutes },
    },
  });

  if (overlapping) {
    throw new AppError("Updated schedule overlaps an existing slot", 409);
  }

  const updated = await prisma.schedule.update({
    where: { id: scheduleId },
    data: {
      dayOfWeek: input.dayOfWeek ?? existing.dayOfWeek,
      startTime: startTimeMinutes,
      endTime: endTimeMinutes,
    },
  });

  return {
    id: updated.id,
    doctorId: updated.doctorId,
    dayOfWeek: updated.dayOfWeek,
    startTime: minutesToLabel(updated.startTime),
    endTime: minutesToLabel(updated.endTime),
    slotDurationMinutes: existing.slotDurationMinutes,
  };
};

export const deleteDoctorSchedule = async (scheduleId: string, doctorId: string) => {
  const existing = await prisma.schedule.findUnique({ where: { id: scheduleId } });
  if (!existing || existing.doctorId !== doctorId) {
    throw new AppError("Schedule not found", 404);
  }
  await prisma.schedule.delete({ where: { id: scheduleId } });
  return { success: true };
};

export const getDoctorUnavailabilities = async (doctorId: string) => {
  await assertDoctor(doctorId);

  const records = await prisma.doctorUnavailability.findMany({
    where: { doctorId },
    orderBy: [{ date: "asc" }, { startTime: "asc" }],
  });

  return records.map((r) => ({
    id: r.id,
    doctorId: r.doctorId,
    date: r.date,
    startTime: minutesToLabel(r.startTime),
    endTime: minutesToLabel(r.endTime),
    reason: r.reason,
  }));
};

export const deleteDoctorUnavailability = async (unavailabilityId: string, doctorId: string) => {
  const existing = await prisma.doctorUnavailability.findUnique({ where: { id: unavailabilityId } });
  if (!existing || existing.doctorId !== doctorId) {
    throw new AppError("Unavailability record not found", 404);
  }
  await prisma.doctorUnavailability.delete({ where: { id: unavailabilityId } });
  return { success: true };
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
  const requestedSlotDurationMinutes = query.slotDurationMinutes;
  const dayOfWeek = dayNameByIndex[new Date(date).getUTCDay()];

  const schedules = await prisma.schedule.findMany({
    where: {
      doctorId,
      dayOfWeek,
    },
    orderBy: {
      startTime: "asc",
    },
    select: {
      startTime: true,
      endTime: true,
      slotDurationMinutes: true,
    },
  });

  const scheduleWindows =
    schedules.length > 0
      ? schedules.map((schedule) => ({
          startTime: schedule.startTime,
          endTime: schedule.endTime,
          slotDurationMinutes: requestedSlotDurationMinutes ?? schedule.slotDurationMinutes,
        }))
      : [
          {
            startTime: DEFAULT_DAY_START_MINUTES,
            endTime: DEFAULT_DAY_END_MINUTES,
            slotDurationMinutes: requestedSlotDurationMinutes ?? DEFAULT_SLOT_DURATION_MINUTES,
          },
        ];

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
  const allSlots: Array<{
    startTime: string;
    endTime: string;
    isAvailable: boolean;
    status: "available" | "booked" | "unavailable";
  }> = [];

  for (const schedule of scheduleWindows) {
    for (
      let current = schedule.startTime;
      current + schedule.slotDurationMinutes <= schedule.endTime;
      current += schedule.slotDurationMinutes
    ) {
      const slotStart = current;
      const slotEnd = current + schedule.slotDurationMinutes;

      const blocked = blocks.some((block) => block.startTime < slotEnd && block.endTime > slotStart);
      const reserved = booked.some((item) => item.startTime < slotEnd && item.endTime > slotStart);

      const isAvailable = !blocked && !reserved;
      allSlots.push({
        startTime: minutesToLabel(slotStart),
        endTime: minutesToLabel(slotEnd),
        isAvailable,
        status: blocked ? "unavailable" : reserved ? "booked" : "available",
      });

      if (isAvailable) {
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
    slotDurationMinutes: requestedSlotDurationMinutes ?? DEFAULT_SLOT_DURATION_MINUTES,
    slots,
    allSlots,
  };
};
