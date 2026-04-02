import prisma from "../lib/prisma";

type ScheduleInput = {
  dayOfWeek: string;
  startTime: string;
  endTime: string;
};

export const createDoctorSchedule = async (
  doctorId: string,
  input: ScheduleInput
) => {
  const doctor = await prisma.doctor.findUnique({
    where: { id: doctorId },
  });

  if (!doctor) {
    throw new Error("Doctor not found");
  }

  if (input.startTime >= input.endTime) {
    throw new Error("Invalid time range");
  }

  const existingSchedules = await prisma.schedule.findMany({
    where: {
      doctorId,
      dayOfWeek: input.dayOfWeek,
    },
  });

  const newStart = new Date(`1970-01-01T${input.startTime}:00`);
  const newEnd = new Date(`1970-01-01T${input.endTime}:00`);

if (newStart >= newEnd) {
  throw new Error("Invalid time range");
}

for (const schedule of existingSchedules) {
  const existingStart = new Date(schedule.startTime);
  const existingEnd = new Date(schedule.endTime);

  if (newStart < existingEnd && newEnd > existingStart) {
    throw new Error("Schedule conflict");
  }
}

  return prisma.schedule.create({
    data: {
      doctorId,
      dayOfWeek: input.dayOfWeek,
      startTime: input.startTime,
      endTime: input.endTime,
    },
  });
};

export const GetDoctorSchedule = async (doctorId: string) => {
  const doctor = await prisma.doctor.findUnique({
    where: { id: doctorId },
    include: { schedules: true },
  });

  if (!doctor) {
    throw new Error("Doctor not found");
  }

  return doctor.schedules;
}