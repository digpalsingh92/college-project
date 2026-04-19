import { readFile } from "node:fs/promises";
import path from "node:path";
import { saveNamedArtifact } from "./model-store.js";
import type { NoShowBucket, NoShowModel } from "./types.js";

const MODEL_VERSION = "1.0.0";

const DATASET_PATH = path.resolve(
  process.cwd(),
  "src",
  "Datasets",
  "KaggleV2-May-2016.csv"
);

interface KaggleRow {
  gender: string;
  scheduledDay: string;
  appointmentDay: string;
  age: number;
  smsReceived: number;
  noShow: string; // "Yes" | "No"
}

const parseKaggleCsv = async (): Promise<KaggleRow[]> => {
  const raw = await readFile(DATASET_PATH, "utf-8");
  const lines = raw.split(/\r?\n/).filter(Boolean);
  if (lines.length <= 1) return [];

  // Header: PatientId,AppointmentID,Gender,ScheduledDay,AppointmentDay,Age,
  //         Neighbourhood,Scholarship,Hipertension,Diabetes,Alcoholism,Handcap,SMS_received,No-show
  return lines.slice(1).map((line) => {
    const cols = line.split(",");
    return {
      gender: (cols[2] ?? "").trim(),
      scheduledDay: (cols[3] ?? "").trim(),
      appointmentDay: (cols[4] ?? "").trim(),
      age: Number(cols[5]) || 0,
      smsReceived: Number(cols[12]) || 0,
      noShow: (cols[13] ?? "No").trim(),
    };
  });
};

const ageBucket = (age: number): string => {
  if (age <= 18) return "0-18";
  if (age <= 35) return "19-35";
  if (age <= 55) return "36-55";
  return "56+";
};

const daysDiffBucket = (diff: number): string => {
  if (diff <= 0) return "same_day";
  if (diff <= 3) return "1-3_days";
  if (diff <= 7) return "4-7_days";
  if (diff <= 14) return "8-14_days";
  return "15+_days";
};

const computeDaysDiff = (scheduled: string, appointment: string): number => {
  const s = new Date(scheduled);
  const a = new Date(appointment);
  if (isNaN(s.getTime()) || isNaN(a.getTime())) return 0;
  return Math.max(0, Math.round((a.getTime() - s.getTime()) / (1000 * 60 * 60 * 24)));
};

const buildBucket = (rows: KaggleRow[]): NoShowBucket => {
  const count = rows.length;
  const noShows = rows.filter((r) => r.noShow === "Yes").length;
  return {
    count,
    noShowRate: count > 0 ? Number((noShows / count).toFixed(4)) : 0,
  };
};

const groupBy = <T>(items: T[], key: (item: T) => string): Record<string, T[]> => {
  return items.reduce<Record<string, T[]>>((acc, item) => {
    const k = key(item);
    if (!acc[k]) acc[k] = [];
    acc[k].push(item);
    return acc;
  }, {});
};

export const trainNoShowModel = async (): Promise<NoShowModel> => {
  const rows = await parseKaggleCsv();
  if (rows.length === 0) {
    throw new Error("KaggleV2 dataset is empty. Cannot train no-show model.");
  }

  const enriched = rows.map((r) => ({
    ...r,
    ageBucket: ageBucket(r.age),
    daysDiff: computeDaysDiff(r.scheduledDay, r.appointmentDay),
  }));

  const enrichedWithDiffBucket = enriched.map((r) => ({
    ...r,
    daysDiffBucket: daysDiffBucket(r.daysDiff),
    smsKey: r.smsReceived >= 1 ? "yes" : "no",
  }));

  const globalBucket = buildBucket(rows);

  const byAge = groupBy(enrichedWithDiffBucket, (r) => r.ageBucket);
  const byGender = groupBy(enrichedWithDiffBucket, (r) => r.gender);
  const bySms = groupBy(enrichedWithDiffBucket, (r) => r.smsKey);
  const byDaysDiff = groupBy(enrichedWithDiffBucket, (r) => r.daysDiffBucket);
  const byComposite = groupBy(
    enrichedWithDiffBucket,
    (r) => `${r.ageBucket}|${r.gender}|${r.smsKey}|${r.daysDiffBucket}`
  );

  const mapBuckets = (groups: Record<string, KaggleRow[]>): Record<string, NoShowBucket> =>
    Object.fromEntries(Object.entries(groups).map(([k, v]) => [k, buildBucket(v)]));

  const model: NoShowModel = {
    version: MODEL_VERSION,
    trainedAt: new Date().toISOString(),
    datasetRecords: rows.length,
    globalNoShowRate: globalBucket.noShowRate,
    byAgeBucket: mapBuckets(byAge),
    byGender: mapBuckets(byGender),
    bySmsReceived: mapBuckets(bySms),
    byDaysDiffBucket: mapBuckets(byDaysDiff),
    byComposite: mapBuckets(byComposite),
  };

  await saveNamedArtifact("noshow", model);
  return model;
};
