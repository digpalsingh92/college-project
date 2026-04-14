import { readFile } from "node:fs/promises";
import path from "node:path";

export type ReminderSent = "Yes" | "No";

export interface UnifiedFeatureRow {
  age: number;
  gender: string;
  department: string;
  scheduledHour: number;
  appointmentType: string;
  previousNoShows: number;
  smsReceived: ReminderSent;
  hourOfDay: number;
  noShowFlag: 0 | 1;
  waitingTimeMinutes?: number;
}

export interface BucketStats {
  count: number;
  avgWaitingMinutes: number;
  p90WaitingMinutes: number;
  avgAge: number;
}

export interface SignalStats {
  count: number;
  noShowRate: number;
}

export interface RecommendationModel {
  trainedAt: string;
  sources: string[];
  waitByDepartmentHour: Record<string, BucketStats>;
  waitByDepartment: Record<string, BucketStats>;
  ageByDepartmentHour: Record<string, number>;
  ageByDepartment: Record<string, number>;
  noShowBySignal: Record<string, SignalStats>;
  globalNoShowRate: SignalStats;
  globalAge: number;
}

const WAIT_DATASET = path.resolve(process.cwd(), "src", "Datasets", "healthcare_appointment_no_show_wait_time.csv");
const NOSHOW_DATASET = path.resolve(process.cwd(), "src", "Datasets", "KaggleV2-May-2016.csv");

const normalizeText = (value: unknown, fallback = "unknown"): string => {
  if (typeof value !== "string") {
    return fallback;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : fallback;
};

const normalizeKey = (value: string): string => value.trim().toLowerCase();

const toNumber = (value: unknown, fallback = 0): number => {
  const parsed = typeof value === "number" ? value : Number(String(value ?? "").trim());
  return Number.isFinite(parsed) ? parsed : fallback;
};

const yesNoFromValue = (value: unknown): ReminderSent => {
  return String(value ?? "").trim().toLowerCase() === "no" ? "No" : "Yes";
};

const parseBooleanFlag = (value: unknown): 0 | 1 => {
  const normalized = String(value ?? "").trim().toLowerCase();
  return normalized === "yes" || normalized === "1" || normalized === "true" ? 1 : 0;
};

const splitCsvLine = (line: string): string[] => {
  const cells: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let index = 0; index < line.length; index += 1) {
    const char = line[index];

    if (char === '"') {
      const nextChar = line[index + 1];
      if (inQuotes && nextChar === '"') {
        current += '"';
        index += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (char === "," && !inQuotes) {
      cells.push(current);
      current = "";
      continue;
    }

    current += char;
  }

  cells.push(current);
  return cells.map((cell) => cell.trim());
};

const parseCsvTable = (raw: string): Array<Record<string, string>> => {
  const lines = raw.split(/\r?\n/).filter(Boolean);
  if (lines.length <= 1) {
    return [];
  }

  const headers = splitCsvLine(lines[0]);
  return lines.slice(1).map((line) => {
    const values = splitCsvLine(line);
    return headers.reduce<Record<string, string>>((row, header, index) => {
      row[header] = values[index] ?? "";
      return row;
    }, {});
  });
};

const roundTo2 = (value: number): number => Number(value.toFixed(2));

const average = (values: number[]): number => {
  if (values.length === 0) {
    return 0;
  }

  return values.reduce((sum, value) => sum + value, 0) / values.length;
};

const percentile = (values: number[], p: number): number => {
  if (values.length === 0) {
    return 0;
  }

  const sorted = [...values].sort((left, right) => left - right);
  const index = Math.ceil((p / 100) * sorted.length) - 1;
  return sorted[Math.max(0, Math.min(index, sorted.length - 1))];
};

const ageBucket = (age: number): string => {
  if (age < 20) return "under_20";
  if (age < 40) return "20s_30s";
  if (age < 60) return "40s_50s";
  return "60_plus";
};

const previousNoShowsBucket = (value: number): string => {
  if (value <= 0) return "0";
  if (value === 1) return "1";
  if (value === 2) return "2";
  return "3_plus";
};

const buildBucketStats = (rows: UnifiedFeatureRow[]): BucketStats => {
  const waitTimes = rows.map((row) => row.waitingTimeMinutes ?? 0);
  const ages = rows.map((row) => row.age);

  return {
    count: rows.length,
    avgWaitingMinutes: roundTo2(average(waitTimes)),
    p90WaitingMinutes: roundTo2(percentile(waitTimes, 90)),
    avgAge: roundTo2(average(ages)),
  };
};

const buildFrequencyStats = (rows: UnifiedFeatureRow[]): Record<string, SignalStats> => {
  return rows.reduce<Record<string, SignalStats>>((acc, row) => {
    const key = [row.smsReceived, previousNoShowsBucket(row.previousNoShows), ageBucket(row.age)].join("|");
    const existing = acc[key] ?? { count: 0, noShowRate: 0 };
    const count = existing.count + 1;
    const noShowCount = existing.noShowRate * existing.count + row.noShowFlag;

    acc[key] = {
      count,
      noShowRate: roundTo2(noShowCount / count),
    };
    return acc;
  }, {});
};

const parseWaitDataset = (rows: Array<Record<string, string>>): UnifiedFeatureRow[] => {
  return rows.map((row) => ({
    age: toNumber(row.patient_age),
    gender: normalizeText(row.gender),
    department: normalizeKey(normalizeText(row.department)),
    scheduledHour: toNumber(row.scheduled_hour),
    appointmentType: normalizeKey(normalizeText(row.appointment_type)),
    previousNoShows: toNumber(row.previous_no_shows),
    smsReceived: yesNoFromValue(row.reminder_sent),
    hourOfDay: toNumber(row.scheduled_hour),
    noShowFlag: String(row.appointment_status ?? "").trim().toLowerCase() === "no-show" ? 1 : 0,
    waitingTimeMinutes: toNumber(row.waiting_time_minutes),
  }));
};

const parseNoShowDataset = (rows: Array<Record<string, string>>): UnifiedFeatureRow[] => {
  return rows.map((row) => ({
    age: toNumber(row.Age),
    gender: normalizeText(row.Gender),
    department: "general",
    scheduledHour: 0,
    appointmentType: "general",
    previousNoShows: 0,
    smsReceived: parseBooleanFlag(row.SMS_received) ? "Yes" : "No",
    hourOfDay: 0,
    noShowFlag: String(row["No-show"] ?? "").trim().toLowerCase() === "yes" ? 1 : 0,
  }));
};

const buildMap = (
  rows: UnifiedFeatureRow[],
  keyBuilder: (row: UnifiedFeatureRow) => string
): Record<string, BucketStats> => {
  const grouped = rows.reduce<Record<string, UnifiedFeatureRow[]>>((acc, row) => {
    const key = keyBuilder(row);
    (acc[key] ??= []).push(row);
    return acc;
  }, {});

  return Object.fromEntries(Object.entries(grouped).map(([key, group]) => [key, buildBucketStats(group)]));
};

const buildAgeMap = (
  rows: UnifiedFeatureRow[],
  keyBuilder: (row: UnifiedFeatureRow) => string
): Record<string, number> => {
  const grouped = rows.reduce<Record<string, UnifiedFeatureRow[]>>((acc, row) => {
    const key = keyBuilder(row);
    (acc[key] ??= []).push(row);
    return acc;
  }, {});

  return Object.fromEntries(
    Object.entries(grouped).map(([key, group]) => [key, roundTo2(average(group.map((row) => row.age)))])
  );
};

export const loadRecommendationRows = async (): Promise<UnifiedFeatureRow[]> => {
  const [waitRaw, noShowRaw] = await Promise.all([
    readFile(WAIT_DATASET, "utf-8"),
    readFile(NOSHOW_DATASET, "utf-8"),
  ]);

  return [...parseWaitDataset(parseCsvTable(waitRaw)), ...parseNoShowDataset(parseCsvTable(noShowRaw))];
};

export const buildRecommendationModel = async (): Promise<RecommendationModel> => {
  const rows = await loadRecommendationRows();
  const waitRows = rows.filter((row) => typeof row.waitingTimeMinutes === "number");

  const waitByDepartmentHour = buildMap(waitRows, (row) => `${row.department}|${row.scheduledHour}`);
  const waitByDepartment = buildMap(waitRows, (row) => row.department);
  const ageByDepartmentHour = buildAgeMap(waitRows, (row) => `${row.department}|${row.scheduledHour}`);
  const ageByDepartment = buildAgeMap(waitRows, (row) => row.department);
  const noShowStats = buildFrequencyStats(rows);
  const globalNoShowRate = {
    count: rows.length,
    noShowRate: roundTo2(average(rows.map((row) => row.noShowFlag))),
  };

  return {
    trainedAt: new Date().toISOString(),
    sources: [WAIT_DATASET, NOSHOW_DATASET],
    waitByDepartmentHour,
    waitByDepartment,
    ageByDepartmentHour,
    ageByDepartment,
    noShowBySignal: noShowStats,
    globalNoShowRate,
    globalAge: roundTo2(average(rows.map((row) => row.age))),
  };
};
