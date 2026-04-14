import prisma from "../lib/prisma.js";
import { getDoctorAvailability } from "./schedule.service.js";
import { getAgeEstimate, getWaitStats, predictNoShowProbability, scoreSlot } from "../ml/predict.js";
import { buildRecommendationModel, type RecommendationModel } from "../ml/features.js";
import { getCachedRecommendation, setCachedRecommendation } from "./recommendationCache.js";
import { parseTimeToMinutes } from "../utils/time.js";

type UserContext = {
  id: string;
  role: string;
} | null;

interface RecommendationSlotBlueprint {
  time: string;
  endTime: string;
  department: string;
  scheduledHour: number;
  baseWaitMinutes: number;
  p90WaitMinutes: number;
  queueAhead: number;
  supportingSamples: number;
  ageEstimate: number;
  slotDurationMinutes: number;
}

export interface RecommendationSlotDto {
  time: string;
  endTime: string;
  estimatedWait: number;
  noShowProbability: number;
  score: number;
  label: "recommended" | "normal" | "avoid";
  confidence: number;
  queueAhead: number;
  available: boolean;
}

export interface RecommendationResponse {
  doctorId: string;
  date: string;
  generatedAt: string;
  confidence: number;
  slots: RecommendationSlotDto[];
  recommendedTime?: string;
  avoidTime?: string;
}

let cachedModel: RecommendationModel | null = null;

const getRecommendationModel = async (): Promise<RecommendationModel> => {
  if (!cachedModel) {
    cachedModel = await buildRecommendationModel();
  }

  return cachedModel;
};

const normalizeDateKey = (value: string): string => value.slice(0, 10);

const getDoctorDepartment = async (doctorId: string): Promise<string> => {
  const doctor = await prisma.user.findUnique({
    where: { id: doctorId },
    select: {
      doctorProfile: {
        select: { specialization: true },
      },
    },
  });

  return doctor?.doctorProfile?.specialization?.trim().toLowerCase() || "general";
};

const getPatientPreviousNoShows = async (patientId: string): Promise<number> => {
  return prisma.appointment.count({
    where: {
      patientId,
      status: "no_show",
    },
  });
};

const buildBlueprint = async (doctorId: string, date: string, model: RecommendationModel): Promise<RecommendationSlotBlueprint[]> => {
  const availability = await getDoctorAvailability(doctorId, { date });
  const department = await getDoctorDepartment(doctorId);
  const bookedAppointments = await prisma.appointment.findMany({
    where: {
      doctorId,
      date: new Date(normalizeDateKey(date)),
      status: "booked",
    },
    select: {
      startTime: true,
    },
  });

  return availability.slots.map((slot) => {
    const slotStartMinutes = parseTimeToMinutes(slot.startTime);
    const scheduledHour = Math.floor(slotStartMinutes / 60);
    const queueAhead = bookedAppointments.filter((appointment) => appointment.startTime < slotStartMinutes).length;
    const waitStats = getWaitStats(model, {
      department,
      scheduledHour,
    });

    return {
      time: slot.startTime,
      endTime: slot.endTime,
      department,
      scheduledHour,
      baseWaitMinutes: waitStats.avgWaitingMinutes,
      p90WaitMinutes: waitStats.p90WaitingMinutes,
      queueAhead,
      supportingSamples: waitStats.supportingSamples,
      ageEstimate: getAgeEstimate(model, department, scheduledHour),
      slotDurationMinutes: availability.slotDurationMinutes,
    };
  });
};

export const getDoctorSlotRecommendations = async ({
  doctorId,
  date,
  user,
}: {
  doctorId: string;
  date: string;
  user: UserContext;
}): Promise<RecommendationResponse> => {
  const model = await getRecommendationModel();
  const cacheKey = `${doctorId}|${normalizeDateKey(date)}`;
  let blueprint = getCachedRecommendation<RecommendationSlotBlueprint[]>(cacheKey);

  if (!blueprint) {
    blueprint = await buildBlueprint(doctorId, date, model);
    setCachedRecommendation(cacheKey, blueprint);
  }

  if (blueprint.length === 0) {
    return {
      doctorId,
      date: normalizeDateKey(date),
      generatedAt: new Date().toISOString(),
      confidence: 0,
      slots: [],
    };
  }

  const previousNoShows = user?.role === "patient" ? await getPatientPreviousNoShows(user.id) : 0;

  const estimatedWaits = blueprint.map((item) => {
    const queuePenalty = item.queueAhead * Math.max(5, Math.round(item.slotDurationMinutes * 0.65));
    const estimatedWait = Math.max(0, Math.round(item.baseWaitMinutes + queuePenalty));
    const noShow = predictNoShowProbability(model, {
      smsReceived: "Yes",
      previousNoShows,
      age: item.ageEstimate,
    });

    return {
      ...item,
      estimatedWait,
      noShowProbability: noShow.probability,
      noShowSamples: noShow.supportingSamples,
    };
  });

  const minWait = Math.min(...estimatedWaits.map((item) => item.estimatedWait));
  const maxWait = Math.max(...estimatedWaits.map((item) => item.estimatedWait));

  const scoredSlots: RecommendationSlotDto[] = estimatedWaits.map((item) => {
    const score = scoreSlot({
      estimatedWaitMinutes: item.estimatedWait,
      minWaitMinutes: minWait,
      maxWaitMinutes: maxWait,
      noShowProbability: item.noShowProbability,
    });

    return {
      time: item.time,
      endTime: item.endTime,
      estimatedWait: item.estimatedWait,
      noShowProbability: item.noShowProbability,
      score,
      label: "normal" as const,
      confidence: Number((0.55 + Math.min(item.supportingSamples / 160, 0.25) + (1 - item.noShowProbability) * 0.2).toFixed(2)),
      queueAhead: item.queueAhead,
      available: true,
    };
  });

  if (scoredSlots.length > 0) {
    const sortedByScore = [...scoredSlots].sort((left, right) => right.score - left.score);
    const best = sortedByScore[0];
    const worst = sortedByScore[sortedByScore.length - 1];

    for (const slot of scoredSlots) {
      if (slot.time === best.time && slot.endTime === best.endTime) {
        slot.label = "recommended";
        continue;
      }

      if (slot.time === worst.time && slot.endTime === worst.endTime) {
        slot.label = "avoid";
      }
    }
  }

  const recommended = scoredSlots.find((slot) => slot.label === "recommended");
  const avoid = scoredSlots.find((slot) => slot.label === "avoid");

  return {
    doctorId,
    date: normalizeDateKey(date),
    generatedAt: new Date().toISOString(),
    confidence: Number((scoredSlots.reduce((sum, slot) => sum + slot.confidence, 0) / Math.max(scoredSlots.length, 1)).toFixed(2)),
    slots: scoredSlots,
    recommendedTime: recommended?.time,
    avoidTime: avoid?.time,
  };
};
