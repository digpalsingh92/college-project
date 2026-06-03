import prisma from "../lib/prisma.js";
import { predictWaitingTime } from "./inference.js";
import { predictNoShow } from "./noshow-inference.js";
import type { SlotAnalysis, SlotAnalysisResult } from "./types.js";
import { minutesToLabel } from "../utils/time.js";

const AVG_CONSULTATION_MINUTES = 15;

const dayNameByIndex = [
  "SUNDAY", "MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY",
] as const;

const waitLevel = (minutes: number): "low" | "medium" | "high" => {
  if (minutes <= 15) return "low";
  if (minutes <= 40) return "medium";
  return "high";
};

export const analyzeSlots = async (
  doctorId: string,
  date: string
): Promise<SlotAnalysisResult> => {
  const targetDate = new Date(date);
  const dayOfWeek = dayNameByIndex[targetDate.getUTCDay()];

  // Fetch doctor profile to resolve their dynamic specialization department
  const doctor = await prisma.user.findUnique({
    where: { id: doctorId },
    include: { doctorProfile: true },
  });
  const dept = doctor?.doctorProfile?.specialization ?? "General";

  // Get doctor's schedules for that day
  const schedules = await prisma.schedule.findMany({
    where: { doctorId, dayOfWeek },
  });

  if (schedules.length === 0) {
    return {
      doctorId,
      date,
      slots: [],
      recommendedSlot: null,
      avoidSlot: null,
    };
  }

  // Get booked appointments for that day
  const normalizedDate = new Date(
    Date.UTC(targetDate.getUTCFullYear(), targetDate.getUTCMonth(), targetDate.getUTCDate())
  );

  const bookedAppointments = await prisma.appointment.findMany({
    where: {
      doctorId,
      date: normalizedDate,
      status: "booked",
    },
  });

  // Generate slots from schedules
  const slots: SlotAnalysis[] = [];

  for (const schedule of schedules) {
    const slotDuration = schedule.slotDurationMinutes ?? 30;
    let current = schedule.startTime;

    while (current + slotDuration <= schedule.endTime) {
      const slotStart = current;
      const slotEnd = current + slotDuration;
      const hour = Math.floor(slotStart / 60);

      // Count booked appointments before this slot
      const queueBefore = bookedAppointments.filter(
        (a) => a.startTime < slotEnd
      ).length;

      // Predict no-show for queue adjustment
      let noShowAdjusted = queueBefore;
      try {
        const noShowResult = await predictNoShow({
          age: 35, // average
          gender: "M",
          daysDiff: Math.max(0, Math.round((normalizedDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24))),
          smsReceived: true,
        });
        noShowAdjusted = Math.round(queueBefore * (1 - noShowResult.probability));
      } catch {
        // No-show model not trained; use raw queue count
      }

      // Estimate wait time
      let estimatedWait = noShowAdjusted * AVG_CONSULTATION_MINUTES;

      // Also try using the trained waiting time model
      try {
        const wtResult = await predictWaitingTime({
          department: dept,
          appointmentType: "Consultation",
          scheduledHour: hour,
          reminderSent: "Yes",
          previousNoShows: 0,
        });
        // Blend: 60% queue-based, 40% model-based
        estimatedWait = Math.round(estimatedWait * 0.6 + wtResult.predictedWaitingTimeMinutes * 0.4);
      } catch {
        // Wait time model not trained; use queue-based estimate
      }

      slots.push({
        startTime: minutesToLabel(slotStart),
        endTime: minutesToLabel(slotEnd),
        estimatedWaitMinutes: estimatedWait,
        level: waitLevel(estimatedWait),
        noShowAdjustedQueue: noShowAdjusted,
      });

      current += slotDuration;
    }
  }

  // Find recommended (min wait) and avoid (max wait) slots
  const sortedByWait = [...slots].sort((a, b) => a.estimatedWaitMinutes - b.estimatedWaitMinutes);
  const recommendedSlot = sortedByWait[0] ?? null;
  const avoidSlot = sortedByWait[sortedByWait.length - 1] ?? null;

  return {
    doctorId,
    date,
    slots,
    recommendedSlot: recommendedSlot !== avoidSlot ? recommendedSlot : null,
    avoidSlot: sortedByWait.length > 1 ? avoidSlot : null,
  };
};
