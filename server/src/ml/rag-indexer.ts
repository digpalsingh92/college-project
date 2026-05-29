import { readFile } from "node:fs/promises";
import path from "node:path";
import { datasetPath, findDatasetFiles } from "./dataset-discovery.js";
import { RAGDocument } from "./rag-vectorizer.js";

const USD_TO_INR = 83;

// Helper to convert USD string or number to INR
const usdToInr = (usd: number | string): number => {
  const cleaned = typeof usd === "string" ? usd.replace(/[$,"\s]/g, "") : usd;
  const n = Number(cleaned);
  return Math.round((Number.isFinite(n) ? n : 0) * USD_TO_INR);
};

// Robust CSV parser supporting quotes
function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim());
      current = "";
    } else {
      current += char;
    }
  }
  result.push(current.trim());
  return result;
}

/**
 * Load and index all hospital datasets, returning an array of RAGDocuments.
 * Uses smart aggregation for large datasets to prevent memory bloat and ensure high-quality retrieval.
 */
export async function loadAndIndexDatasets(): Promise<RAGDocument[]> {
  const documents: RAGDocument[] = [];
  console.log("[RAG-Indexer] Starting dataset indexing process...");

  // 1. Index surgery_data.csv (Small, full indexing)
  try {
    const filename = "surgery_data.csv";
    const raw = await readFile(datasetPath(filename), "utf-8");
    const lines = raw.split(/\r?\n/).filter(Boolean);
    if (lines.length > 1) {
      const headers = parseCSVLine(lines[0]);
      for (let i = 1; i < lines.length; i++) {
        const cols = parseCSVLine(lines[i]);
        if (cols.length < headers.length) continue;

        const row: Record<string, string> = {};
        headers.forEach((h, idx) => {
          row[h] = cols[idx] || "";
        });

        const content = `Surgery type: ${row.surgeryType} in department: ${row.department} costs ${row.priceRange} (average cost: ${row.avgCost}). Recovery time: ${row.recoveryTime}. Surgery duration: ${row.surgeryDuration}. Bed availability: ${row.bedAvailability || "Contact hospital"}.`;
        
        documents.push({
          id: `${filename}_row_${i}`,
          content,
          metadata: {
            source: filename,
            category: "surgery",
            department: row.department,
            surgeryType: row.surgeryType,
          },
          raw: row,
        });
      }
      console.log(`[RAG-Indexer] Indexed surgery_data.csv: ${lines.length - 1} records`);
    }
  } catch (error) {
    console.error("[RAG-Indexer] Error indexing surgery_data.csv:", error);
  }

  // 2. Index bed capacity datasets (Small, full indexing)
  const bedFiles = await findDatasetFiles([/^bed_capacity_dataset_.*\.csv$/i]);
  for (const filename of bedFiles) {
    try {
      const raw = await readFile(datasetPath(filename), "utf-8");
      const lines = raw.split(/\r?\n/).filter(Boolean);
      if (lines.length > 1) {
        const headers = parseCSVLine(lines[0]);
        for (let i = 1; i < lines.length; i++) {
          const cols = parseCSVLine(lines[i]);
          if (cols.length < headers.length) continue;

          const row: Record<string, string> = {};
          headers.forEach((h, idx) => {
            row[h] = cols[idx] || "";
          });

          const dept = row.Department || "Unknown Department";
          const totalBeds = row.Total_Beds || row.Total_Amount_of_Beds || "0";
          const freeBeds = row.Free_Beds || "0";
          const totalICU = row.Total_ICU_Beds || "0";
          const freeICU = row.Free_ICU_Beds || "0";
          const staff = row.Staff_On_Duty || "0";
          const occupied = row.Occupied_Beds || String(Number(totalBeds) - Number(freeBeds));

          const content = `Bed capacity in ${dept}: Total beds: ${totalBeds}, Free beds: ${freeBeds}, Occupied beds: ${occupied}. Total ICU beds: ${totalICU}, Free ICU beds: ${freeICU}. Staff on duty: ${staff} members.`;

          documents.push({
            id: `${filename}_row_${i}`,
            content,
            metadata: {
              source: filename,
              category: "bed_capacity",
              department: dept,
            },
            raw: row,
          });
        }
        console.log(`[RAG-Indexer] Indexed ${filename}: ${lines.length - 1} records`);
      }
    } catch (error) {
      console.error(`[RAG-Indexer] Error indexing ${filename}:`, error);
    }
  }

  // 3. Index disease symptom profiles (Small, full indexing)
  try {
    const filename = "disease_symptom_profile_dataset_01.csv";
    const raw = await readFile(datasetPath(filename), "utf-8");
    const lines = raw.split(/\r?\n/).filter(Boolean);
    if (lines.length > 1) {
      const headers = parseCSVLine(lines[0]);
      for (let i = 1; i < lines.length; i++) {
        const cols = parseCSVLine(lines[i]);
        if (cols.length < headers.length) continue;

        const row: Record<string, string> = {};
        headers.forEach((h, idx) => {
          row[h] = cols[idx] || "";
        });

        const disease = row.Disease || "Unknown Disease";
        const fever = row.Fever === "Yes" ? "Fever" : "";
        const cough = row.Cough === "Yes" ? "Cough" : "";
        const fatigue = row.Fatigue === "Yes" ? "Fatigue" : "";
        const difficultyBreathing = row.Difficulty_Breathing === "Yes" || row["Difficulty Breathing"] === "Yes" ? "Difficulty Breathing" : "";
        
        const symptomsList = [fever, cough, fatigue, difficultyBreathing].filter(Boolean).join(", ");
        const symptomsText = symptomsList ? `presenting symptoms: ${symptomsList}` : "no primary respiratory symptoms reported";

        const content = `Disease Profile: ${disease}. Patient profile: Age ${row.Age}, Gender ${row.Gender}, Blood Pressure ${row["Blood Pressure"] || row.Blood_Pressure || "Normal"}, Cholesterol ${row["Cholesterol Level"] || row.Cholesterol_Level || "Normal"}. Symptom presentation: ${symptomsText}. Clinical outcome: ${row["Outcome Variable"] || row.Outcome || "Positive"}.`;

        documents.push({
          id: `${filename}_row_${i}`,
          content,
          metadata: {
            source: filename,
            category: "disease",
            disease: disease,
          },
          raw: row,
        });
      }
      console.log(`[RAG-Indexer] Indexed disease symptom dataset: ${lines.length - 1} records`);
    }
  } catch (error) {
    console.error("[RAG-Indexer] Error indexing disease symptom profile dataset:", error);
  }

  // 4. Index price_hospital_dataset_01.csv (Medium size, fully index with USD to INR conversion)
  try {
    const filename = "price_hospital_dataset_01.csv";
    const raw = await readFile(datasetPath(filename), "utf-8");
    const lines = raw.split(/\r?\n/).filter(Boolean);
    if (lines.length > 1) {
      const headers = parseCSVLine(lines[0]);
      for (let i = 1; i < lines.length; i++) {
        const cols = parseCSVLine(lines[i]);
        if (cols.length < headers.length) continue;

        const row: Record<string, string> = {};
        headers.forEach((h, idx) => {
          row[h] = cols[idx] || "";
        });

        const costInr = usdToInr(row.Cost);
        const content = `Hospital billing record: Procedure ${row.Procedure} for condition ${row.Condition} costs ₹${costInr.toLocaleString("en-IN")} (length of stay: ${row.Length_of_Stay} days). Patient was a ${row.Age}-year-old ${row.Gender}. Readmission: ${row.Readmission || "No"}. Treatment outcome: ${row.Outcome || "Recovered"}. Patient satisfaction rating: ${row.Satisfaction}/5.`;

        documents.push({
          id: `${filename}_row_${i}`,
          content,
          metadata: {
            source: filename,
            category: "hospital_billing",
            procedure: row.Procedure,
            condition: row.Condition,
          },
          raw: { ...row, costInr },
        });
      }
      console.log(`[RAG-Indexer] Indexed hospital billing dataset: ${lines.length - 1} records`);
    }
  } catch (error) {
    console.error("[RAG-Indexer] Error indexing hospital billing dataset:", error);
  }

  // 5. Index price_inpatient_dataset_01.csv (HUGE 25MB - Summarize and aggregate by procedure to save memory & guarantee relevant answers!)
  try {
    const filename = "price_inpatient_dataset_01.csv";
    const raw = await readFile(datasetPath(filename), "utf-8");
    const lines = raw.split(/\r?\n/).filter(Boolean);
    if (lines.length > 1) {
      const headers = parseCSVLine(lines[0]);
      
      // Group by procedure to aggregate costs
      const groups: Record<string, { costs: number[]; discharges: number; rawDRG: string }> = {};

      for (let i = 1; i < lines.length; i++) {
        const cols = parseCSVLine(lines[i]);
        if (cols.length < headers.length) continue;

        const drg = cols[0] || "";
        // Extract procedure description (remove the numeric code prefix, e.g. "039 - EXTRACRANIAL PROCEDURES W/O CC/MCC" -> "EXTRACRANIAL PROCEDURES W/O CC/MCC")
        const procedure = drg.replace(/^\d+\s*-\s*/, "").trim();
        if (!procedure) continue;

        // " Average Covered Charges " is the 3rd column from the end (index headers.length - 3)
        const costStr = cols[headers.length - 3] || "0";
        const costInr = usdToInr(costStr);
        const discharges = Number(cols[headers.length - 4]) || 1;

        if (!groups[procedure]) {
          groups[procedure] = { costs: [], discharges: 0, rawDRG: drg };
        }
        groups[procedure].costs.push(costInr);
        groups[procedure].discharges += discharges;
      }

      // Generate summarized documents for each unique procedure
      let indexCount = 0;
      for (const [procedure, data] of Object.entries(groups)) {
        if (data.costs.length === 0) continue;
        
        const sortedCosts = data.costs.sort((a, b) => a - b);
        const totalCost = sortedCosts.reduce((a, b) => a + b, 0);
        const avgCost = Math.round(totalCost / sortedCosts.length);
        const minCost = sortedCosts[0];
        const maxCost = sortedCosts[sortedCosts.length - 1];
        const medianCost = sortedCosts[Math.floor(sortedCosts.length / 2)];

        const content = `Inpatient Procedure Cost Summary: ${procedure} (DRG classification: ${data.rawDRG}). Across ${data.discharges} clinical discharges, the average covered hospital charge is ₹${avgCost.toLocaleString("en-IN")}, with charges ranging from a minimum of ₹${minCost.toLocaleString("en-IN")} to a maximum of ₹${maxCost.toLocaleString("en-IN")}. The median cost is ₹${medianCost.toLocaleString("en-IN")}.`;

        documents.push({
          id: `${filename}_procedure_${indexCount++}`,
          content,
          metadata: {
            source: filename,
            category: "pricing_summary",
            procedure,
          },
          raw: {
            procedure,
            drg: data.rawDRG,
            avgCost,
            minCost,
            maxCost,
            medianCost,
            discharges: data.discharges,
          },
        });
      }
      console.log(`[RAG-Indexer] Summarized & indexed inpatient charges: ${indexCount} unique procedure summaries (from ${lines.length - 1} raw rows)`);
    }
  } catch (error) {
    console.error("[RAG-Indexer] Error indexing inpatient charges dataset:", error);
  }

  // 6. Index wait_time_no_show_dataset_01.csv (Medium 743KB - Aggregate by Department & Appointment Type)
  try {
    const filename = "wait_time_no_show_dataset_01.csv";
    const raw = await readFile(datasetPath(filename), "utf-8");
    const lines = raw.split(/\r?\n/).filter(Boolean);
    if (lines.length > 1) {
      const headers = parseCSVLine(lines[0]);
      
      const deptGroups: Record<string, { waitTimes: number[]; noShowCount: number; totalCount: number }> = {};

      for (let i = 1; i < lines.length; i++) {
        const cols = parseCSVLine(lines[i]);
        if (cols.length < headers.length) continue;

        // Fields: appointment_id, appointment_date, patient_age, gender, department, appointment_type, scheduled_hour, waiting_time_minutes, reminder_sent, previous_no_shows, appointment_status
        const dept = cols[4] || "General";
        const type = cols[5] || "General";
        const waitTime = Number(cols[7]) || 0;
        const status = cols[10] || "Completed";

        const key = `${dept} - ${type}`;

        if (!deptGroups[key]) {
          deptGroups[key] = { waitTimes: [], noShowCount: 0, totalCount: 0 };
        }
        
        deptGroups[key].waitTimes.push(waitTime);
        deptGroups[key].totalCount += 1;
        if (status === "No-Show") {
          deptGroups[key].noShowCount += 1;
        }
      }

      let indexCount = 0;
      for (const [key, data] of Object.entries(deptGroups)) {
        const [dept, type] = key.split(" - ");
        const avgWait = Math.round(data.waitTimes.reduce((a, b) => a + b, 0) / data.waitTimes.length);
        const noShowRate = Math.round((data.noShowCount / data.totalCount) * 100);
        
        const content = `Appointment Wait Time & No-Show Summary: In the ${dept} department for ${type} appointments, the average patient waiting time is ${avgWait} minutes. The appointment no-show rate is ${noShowRate}% (based on ${data.totalCount} historical records).`;

        documents.push({
          id: `${filename}_summary_${indexCount++}`,
          content,
          metadata: {
            source: filename,
            category: "waiting_time_summary",
            department: dept,
            appointmentType: type,
          },
          raw: {
            department: dept,
            appointmentType: type,
            avgWaitTimeMinutes: avgWait,
            noShowRatePercent: noShowRate,
            totalAppointments: data.totalCount,
          },
        });
      }
      console.log(`[RAG-Indexer] Summarized & indexed waiting times: ${indexCount} department/type summaries (from ${lines.length - 1} raw rows)`);
    }
  } catch (error) {
    console.error("[RAG-Indexer] Error indexing waiting time dataset:", error);
  }

  // 7. Index no_show_occurrence_dataset_01.csv (10.7MB - Generate high-level clinical demographics & medical condition summaries)
  try {
    const filename = "no_show_occurrence_dataset_01.csv";
    const raw = await readFile(datasetPath(filename), "utf-8");
    const lines = raw.split(/\r?\n/).filter(Boolean);
    if (lines.length > 1) {
      const headers = parseCSVLine(lines[0]);

      let total = 0;
      let totalNoShows = 0;

      let diabetesTotal = 0;
      let diabetesNoShows = 0;

      let hypertensionTotal = 0;
      let hypertensionNoShows = 0;

      let smsTotal = 0;
      let smsNoShows = 0;

      let alcoholismTotal = 0;
      let alcoholismNoShows = 0;

      const ageGroups: Record<string, { total: number; noShows: number }> = {
        "Pediatric (0-18)": { total: 0, noShows: 0 },
        "Young Adult (19-35)": { total: 0, noShows: 0 },
        "Adult (36-60)": { total: 0, noShows: 0 },
        "Senior (61+)": { total: 0, noShows: 0 },
      };

      for (let i = 1; i < lines.length; i++) {
        const cols = parseCSVLine(lines[i]);
        if (cols.length < headers.length) continue;

        // Columns: PatientId, AppointmentID, Gender, ScheduledDay, AppointmentDay, Age, Neighbourhood, Scholarship, Hipertension, Diabetes, Alcoholism, Handcap, SMS_received, No-show
        const age = Number(cols[5]) || 0;
        const hipertension = cols[8] === "1";
        const diabetes = cols[9] === "1";
        const alcoholism = cols[10] === "1";
        const sms = cols[12] === "1";
        const isNoShow = cols[13].toLowerCase() === "yes";

        total++;
        if (isNoShow) totalNoShows++;

        if (diabetes) {
          diabetesTotal++;
          if (isNoShow) diabetesNoShows++;
        }

        if (hipertension) {
          hypertensionTotal++;
          if (isNoShow) hypertensionNoShows++;
        }

        if (alcoholism) {
          alcoholismTotal++;
          if (isNoShow) alcoholismNoShows++;
        }

        if (sms) {
          smsTotal++;
          if (isNoShow) smsNoShows++;
        }

        // Age categories
        let group = "Adult (36-60)";
        if (age <= 18) group = "Pediatric (0-18)";
        else if (age <= 35) group = "Young Adult (19-35)";
        else if (age >= 61) group = "Senior (61+)";

        ageGroups[group].total++;
        if (isNoShow) ageGroups[group].noShows++;
      }

      const overallRate = Math.round((totalNoShows / total) * 100);
      const diabetesRate = Math.round((diabetesNoShows / (diabetesTotal || 1)) * 100);
      const hyperRate = Math.round((hypertensionNoShows / (hypertensionTotal || 1)) * 100);
      const smsRate = Math.round((smsNoShows / (smsTotal || 1)) * 100);
      const nonSmsRate = Math.round(((totalNoShows - smsNoShows) / ((total - smsTotal) || 1)) * 100);
      const alcoholRate = Math.round((alcoholismNoShows / (alcoholismTotal || 1)) * 100);

      // Document 1: Medical Conditions & No-shows
      documents.push({
        id: `${filename}_medical_conditions_summary`,
        content: `No-Show Risk by Medical Condition: Patients diagnosed with Diabetes have a no-show rate of ${diabetesRate}%. Patients diagnosed with Hypertension (high blood pressure) have a no-show rate of ${hyperRate}%. Patients with Alcoholism have a no-show rate of ${alcoholRate}%. Overall, the hospital's baseline appointment no-show rate is ${overallRate}%.`,
        metadata: { source: filename, category: "no_show_medical_summary" },
        raw: { overallRate, diabetesRate, hyperRate, alcoholRate },
      });

      // Document 2: Reminders & No-shows
      documents.push({
        id: `${filename}_sms_summary`,
        content: `No-Show Risk and Communication: Patients who received an SMS confirmation reminder have a no-show rate of ${smsRate}%. In contrast, patients who did not receive an SMS reminder have a no-show rate of ${nonSmsRate}%. Sending SMS reminders decreases the likelihood of missing appointments.`,
        metadata: { source: filename, category: "no_show_sms_summary" },
        raw: { smsRate, nonSmsRate },
      });

      // Document 3: Age Demographics & No-shows
      let ageContent = "No-Show Risk by Patient Age Demographics: ";
      const ageRaw: Record<string, number> = {};
      for (const [group, data] of Object.entries(ageGroups)) {
        const rate = Math.round((data.noShows / (data.total || 1)) * 100);
        ageContent += `${group} patients have an appointment no-show rate of ${rate}%. `;
        ageRaw[group] = rate;
      }
      documents.push({
        id: `${filename}_age_demographics_summary`,
        content: ageContent.trim(),
        metadata: { source: filename, category: "no_show_age_summary" },
        raw: ageRaw,
      });

      console.log(`[RAG-Indexer] Summarized & indexed no-show occurrence dataset: 3 comprehensive clinical summaries (from ${lines.length - 1} raw rows)`);
    }
  } catch (error) {
    console.error("[RAG-Indexer] Error indexing no-show occurrence dataset:", error);
  }

  console.log(`[RAG-Indexer] Indexing complete! Generated total of ${documents.length} RAG documents`);
  return documents;
}
