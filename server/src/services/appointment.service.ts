import prisma from "../lib/prisma.js";
import { CreateAppointmentInput } from "../schemas/appointment.schemas.js";
import { AppError } from "../utils/app-error.js";
import { minutesToLabel, normalizeDateOnly, parseTimeToMinutes } from "../utils/time.js";

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

const formatAppointment = (appointment: {
  id: string;
  patientId: string;
  doctorId: string;
  scheduleId: string;
  date: Date;
  startTime: number;
  endTime: number;
  status: string;
  createdAt: Date;
}) => ({
  id: appointment.id,
  patientId: appointment.patientId,
  doctorId: appointment.doctorId,
  scheduleId: appointment.scheduleId,
  date: appointment.date,
  startTime: minutesToLabel(appointment.startTime),
  endTime: minutesToLabel(appointment.endTime),
  status: appointment.status,
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

  if (!schedule) {
    throw new AppError("Requested time is outside doctor schedule", 400);
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
      scheduleId: schedule.id,
      date,
      startTime,
      endTime,
      status: "booked",
    },
  });

  return formatAppointment(appointment);
};

export const getAppointmentsForPatient = async (patientId: string) => {
  const appointments = await prisma.appointment.findMany({
    where: { patientId },
    orderBy: { date: "desc" },
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
  });

  return appointments.map((a) => ({
    ...formatAppointment(a),
    doctor: a.doctor,
  }));
};

export const getAppointmentsForDoctor = async (doctorId: string) => {
  const appointments = await prisma.appointment.findMany({
    where: { doctorId },
    orderBy: { date: "desc" },
    include: {
      patient: {
        select: { id: true, name: true, email: true },
      },
    },
  });

  return appointments.map((a) => ({
    ...formatAppointment(a),
    patient: a.patient,
  }));
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
    data: { status: "cancelled" },
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
