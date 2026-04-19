import { loadModelArtifact } from "./model-store.js";
import type { RecommendationsResult } from "./types.js";

export const getRecommendations = async (): Promise<RecommendationsResult> => {
  try {
    const model = await loadModelArtifact();

    // Find best and worst hours by average waiting time across departments
    const hourWaitMap: Record<number, { totalWait: number; count: number }> = {};

    for (const [key, rec] of Object.entries(model.resourceAllocationModel.byDepartmentHour)) {
      const parts = key.split("|");
      const hour = Number(parts[1]);
      if (!Number.isFinite(hour)) continue;

      if (!hourWaitMap[hour]) hourWaitMap[hour] = { totalWait: 0, count: 0 };
      hourWaitMap[hour].totalWait += rec.avgWaitingMinutes;
      hourWaitMap[hour].count += 1;
    }

    const hourAvgs = Object.entries(hourWaitMap)
      .map(([hour, data]) => ({
        hour: Number(hour),
        avgWait: data.totalWait / data.count,
      }))
      .sort((a, b) => a.avgWait - b.avgWait);

    if (hourAvgs.length === 0) {
      return {
        bestTime: "10:00 AM",
        worstTime: "2:00 PM",
        message: "Insufficient data for personalized recommendations. Try booking early morning slots.",
      };
    }

    const best = hourAvgs[0];
    const worst = hourAvgs[hourAvgs.length - 1];

    const formatHour = (h: number): string => {
      const period = h >= 12 ? "PM" : "AM";
      const display = h % 12 || 12;
      return `${display}:00 ${period}`;
    };

    return {
      bestTime: formatHour(best.hour),
      worstTime: formatHour(worst.hour),
      message: `Book your appointment around ${formatHour(best.hour)} for the shortest wait (avg ${Math.round(best.avgWait)} min). Avoid ${formatHour(worst.hour)} when wait times peak at ${Math.round(worst.avgWait)} min on average.`,
    };
  } catch {
    return {
      bestTime: "10:00 AM",
      worstTime: "2:00 PM",
      message: "Train the prediction model first for personalized recommendations. Generally, early morning slots have shorter wait times.",
    };
  }
};
