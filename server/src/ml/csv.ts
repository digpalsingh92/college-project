import { readFile } from "node:fs/promises";
import { DatasetRow } from "./types.js";

const normalizeStatus = (value: string): DatasetRow["appointmentStatus"] => {
  if (value === "Completed" || value === "No-Show" || value === "Cancelled") {
    return value;
  }
  return "Completed";
};

const normalizeReminder = (value: string): DatasetRow["reminderSent"] => {
  return value === "No" ? "No" : "Yes";
};

const toNumber = (value: string): number => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

export const parseDatasetCsv = async (datasetPath: string): Promise<DatasetRow[]> => {
  const raw = await readFile(datasetPath, "utf-8");
  const lines = raw.split(/\r?\n/).filter(Boolean);

  if (lines.length <= 1) {
    return [];
  }

  const rows = lines.slice(1);
  return rows.map((line) => {
    const [
      appointmentId,
      appointmentDate,
      patientAge,
      gender,
      department,
      appointmentType,
      scheduledHour,
      waitingTimeMinutes,
      reminderSent,
      previousNoShows,
      appointmentStatus,
    ] = line.split(",");

    return {
      appointmentId: toNumber(appointmentId),
      appointmentDate,
      patientAge: toNumber(patientAge),
      gender,
      department,
      appointmentType,
      scheduledHour: toNumber(scheduledHour),
      waitingTimeMinutes: toNumber(waitingTimeMinutes),
      reminderSent: normalizeReminder(reminderSent),
      previousNoShows: toNumber(previousNoShows),
      appointmentStatus: normalizeStatus(appointmentStatus),
    } satisfies DatasetRow;
  });
};
