import prisma from '../lib/prisma';


export const getDoctorProfile = async (doctorId: string) => {
  return prisma.doctor.findUnique({
    where: { id: doctorId },
    select: {
      id: true,
      name: true,
      email: true,
      specialization: true,
      role: true,
      createdAt: true,
    },
  });
};


export const updateDoctorProfile = async (doctorId: string, updateData: Partial<{ name: string; specialization: string }>) => {
  return prisma.doctor.update({
    where: { id: doctorId },
    data: updateData,
  });
};
