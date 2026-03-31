import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import prisma from '../lib/prisma';
import { AppError } from '../utils/app-error';
import { CreateDoctorInput, LoginDoctorInput, RegisterDoctorInput } from '../schemas/doctor.schema';
import { AuthDoctorResponse, JwtPayload } from '../types/api.types';

const JWT_EXPIRES_IN =
  (process.env.JWT_EXPIRES_IN as jwt.SignOptions['expiresIn'] | undefined) || '7d';

const getJwtSecret = (): string => {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new AppError('JWT secret is not configured', 500);
  }

  return secret;
};

const mapDoctor = (doctor: {
  id: string;
  name: string;
  email: string;
  specialization: string;
  role: 'doctor';
  createdAt: Date;
}) => ({
  id: doctor.id,
  name: doctor.name,
  email: doctor.email,
  specialization: doctor.specialization,
  role: doctor.role,
  createdAt: doctor.createdAt,
});

const signDoctorToken = (payload: JwtPayload): string => {
  return jwt.sign(payload, getJwtSecret(), { expiresIn: JWT_EXPIRES_IN });
};

const findDoctorByEmail = async (email: string) => {
  return prisma.doctor.findUnique({ where: { email } });
};

const createDoctorRecord = async (input: CreateDoctorInput) => {
  const existing = await prisma.doctor.findFirst({
    where: {
      OR: [{ email: input.email }, { licenseNumber: input.licenseNumber }],
    },
  });

  if (existing) {
    throw new AppError('Doctor already exists with this email or license number', 409);
  }

  const passwordHash = await bcrypt.hash(input.password, 12);

  const doctor = await prisma.doctor.create({
    data: {
      name: input.name,
      email: input.email,
      passwordHash,
      specialization: input.specialization,
      licenseNumber: input.licenseNumber,
      phone: input.phone,
    },
    select: {
      id: true,
      name: true,
      email: true,
      specialization: true,
      role: true,
      createdAt: true,
    },
  });

  return doctor;
};

export const createDoctor = async (input: CreateDoctorInput) => {
  return createDoctorRecord(input);
};

export const registerDoctor = async (input: RegisterDoctorInput): Promise<AuthDoctorResponse> => {
  const doctor = await createDoctorRecord(input);

  const token = signDoctorToken({
    id: doctor.id,
    email: doctor.email,
    role: doctor.role,
  });

  return {
    token,
    doctor: mapDoctor(doctor),
  };
};

export const loginDoctor = async (input: LoginDoctorInput): Promise<AuthDoctorResponse> => {
  const doctor = await findDoctorByEmail(input.email);
  if (!doctor) {
    throw new AppError('Invalid email or password', 401);
  }

  const passwordMatches = await bcrypt.compare(input.password, doctor.passwordHash);
  if (!passwordMatches) {
    throw new AppError('Invalid email or password', 401);
  }

  const token = signDoctorToken({
    id: doctor.id,
    email: doctor.email,
    role: doctor.role,
  });

  return {
    token,
    doctor: {
      id: doctor.id,
      name: doctor.name,
      email: doctor.email,
      specialization: doctor.specialization,
      role: doctor.role,
      createdAt: doctor.createdAt,
    },
  };
};

export const listDoctors = async () => {
  return prisma.doctor.findMany({
    select: {
      id: true,
      name: true,
      email: true,
      specialization: true,
      role: true,
      createdAt: true,
    },
    orderBy: {
      createdAt: 'desc',
    },
  });
};
