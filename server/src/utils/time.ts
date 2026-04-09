import { AppError } from "./app-error.js";

export const parseTimeToMinutes = (value: string): number => {
  const input = value.trim().toUpperCase();

  const amPmMatch = input.match(/^(\d{1,2})(?::(\d{2}))?\s*(AM|PM)$/);
  if (amPmMatch) {
    const hours = Number(amPmMatch[1]);
    const minutes = amPmMatch[2] ? Number(amPmMatch[2]) : 0;
    const period = amPmMatch[3];

    if (hours < 1 || hours > 12 || minutes < 0 || minutes > 59) {
      throw new AppError("Invalid time format", 400);
    }

    const normalizedHours = hours % 12 + (period === "PM" ? 12 : 0);
    return normalizedHours * 60 + minutes;
  }

  const twentyFourMatch = input.match(/^(\d{1,2}):(\d{2})$/);
  if (twentyFourMatch) {
    const hours = Number(twentyFourMatch[1]);
    const minutes = Number(twentyFourMatch[2]);

    if (hours < 0 || hours > 23 || minutes < 0 || minutes > 59) {
      throw new AppError("Invalid time format", 400);
    }

    return hours * 60 + minutes;
  }

  throw new AppError("Invalid time format. Use '10 AM', '10:30 AM' or '18:30'", 400);
};

export const minutesToLabel = (minutes: number): string => {
  const hours24 = Math.floor(minutes / 60);
  const mins = minutes % 60;
  const period = hours24 >= 12 ? "PM" : "AM";
  const hours12 = hours24 % 12 || 12;
  return `${hours12}:${String(mins).padStart(2, "0")} ${period}`;
};

export const normalizeDateOnly = (input: string): Date => {
  const date = new Date(input);
  if (Number.isNaN(date.getTime())) {
    throw new AppError("Invalid date. Use YYYY-MM-DD", 400);
  }

  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
};
