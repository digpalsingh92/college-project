import prisma from "../lib/prisma.js";
import { predictNoShow } from "./noshow-inference.js";
import type { QueueStatusResult } from "./types.js";

const AVG_CONSULTATION_MINUTES = 15;

const delayLevel = (wait: number): "low" | "medium" | "high" => {
  if (wait <= 15) return "low";
  if (wait <= 40) return "medium";
  return "high";
};

export const getQueueStatus = async (doctorId: string): Promise<QueueStatusResult> => {
  const today = new Date();
  const normalizedToday = new Date(
    Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate())
  );

  const bookedToday = await prisma.appointment.findMany({
    where: {
      doctorId,
      date: normalizedToday,
      status: "booked",
    },
  });

  const completedToday = await prisma.appointment.count({
    where: {
      doctorId,
      date: normalizedToday,
      status: "completed",
    },
  });

  const currentQueue = bookedToday.length;

  // Estimate expected patients by adjusting for no-show
  let expectedPatients = currentQueue;
  try {
    const noShowResult = await predictNoShow({
      age: 40,
      gender: "M",
      daysDiff: 0,
      smsReceived: true,
    });
    expectedPatients = Math.round(currentQueue * (1 - noShowResult.probability));
  } catch {
    // No-show model not trained; use raw count
  }

  const avgWaitTime = Math.round(expectedPatients * AVG_CONSULTATION_MINUTES);

  return {
    doctorId,
    currentQueue,
    expectedPatients,
    avgWaitTime,
    delayLevel: delayLevel(avgWaitTime),
  };
};
