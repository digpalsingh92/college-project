import prisma from "../lib/prisma.js";
import { AppError } from "../utils/app-error.js";

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

export const getAllDoctors = async () => {
  return prisma.user.findMany({
    where: { role: "doctor" },
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
