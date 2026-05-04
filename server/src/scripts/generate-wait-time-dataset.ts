import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const departments = ["Orthopedics", "Cardiology", "Pediatrics", "General Medicine"] as const;
const appointmentTypes = ["New", "Follow-up"] as const;
const genders = ["Male", "Female"] as const;
const statuses = ["Completed", "No-Show", "Cancelled"] as const;

type DatasetRecord = {
  appointment_id: number;
  appointment_date: string;
  patient_age: number;
  gender: (typeof genders)[number];
  department: (typeof departments)[number];
  appointment_type: (typeof appointmentTypes)[number];
  scheduled_hour: number;
  waiting_time_minutes: number;
  reminder_sent: "Yes" | "No";
  previous_no_shows: number;
  appointment_status: (typeof statuses)[number];
};

const getWaitTime = (hour: number, noShows: number) => {
  let base = 0;

  if (hour >= 8 && hour <= 11) {
    base = 20;
  } else if (hour >= 12 && hour <= 16) {
    base = 50;
  } else if (hour >= 17 && hour <= 21) {
    base = 90;
  } else {
    base = 10;
  }

  return base + noShows * 5 + Math.floor(Math.random() * 20);
};

const toDateTimeString = (day: number, hour: number) => {
  return `2024-01-${String(day).padStart(2, "0")} ${String(hour).padStart(2, "0")}:00:00`;
};

const randomFrom = <T,>(values: readonly T[]) => {
  return values[Math.floor(Math.random() * values.length)];
};

const data: DatasetRecord[] = [];

for (let i = 1; i <= 10000; i += 1) {
  const hour = Math.floor(Math.random() * 24);
  const noShows = Math.floor(Math.random() * 5);
  const day = ((i - 1) % 31) + 1;

  const record: DatasetRecord = {
    appointment_id: i,
    appointment_date: toDateTimeString(day, hour),
    patient_age: Math.floor(Math.random() * 80) + 10,
    gender: randomFrom(genders),
    department: randomFrom(departments),
    appointment_type: randomFrom(appointmentTypes),
    scheduled_hour: hour,
    waiting_time_minutes: getWaitTime(hour, noShows),
    reminder_sent: Math.random() > 0.5 ? "Yes" : "No",
    previous_no_shows: noShows,
    appointment_status: randomFrom(statuses),
  };

  data.push(record);
}

const csvHeader = Object.keys(data[0]).join(",");
const csvRows = data.map((obj) => Object.values(obj).join(","));

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const outputPath = path.resolve(__dirname, "../Datasets/wait_time_no_show_dataset_01.csv");

fs.writeFileSync(outputPath, [csvHeader, ...csvRows].join("\n"), "utf8");

console.log(`Dataset generated: ${outputPath}`);