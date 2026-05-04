/**
 * Entity Normalizer
 *
 * Extracts and normalizes entities (surgery type, disease name, symptoms, age, gender)
 * from user queries. Uses fuzzy matching with Levenshtein distance to handle typos
 * and ambiguous inputs (e.g., "knee stone removal").
 */

import type { AssistantIntent } from "./intent-classifier.js";

// ── Types ──

export interface ExtractedEntities {
  surgeryType?: string;
  surgeryKey?: string;
  diseaseName?: string;
  department?: string;
  symptoms?: string[];
  age?: number;
  gender?: "Male" | "Female";
  bloodPressure?: "Low" | "Normal" | "High";
  cholesterolLevel?: "Low" | "Normal" | "High";
  procedure?: string;
}

export interface NormalizationResult {
  entities: ExtractedEntities;
  needsClarification: boolean;
  clarificationMessage?: string;
  clarificationOptions?: string[];
}

// ── Surgery Map ──

interface SurgeryEntry {
  key: string;
  canonical: string;
  aliases: string[];
}

const SURGERY_MAP: SurgeryEntry[] = [
  // ── Orthopedic ──
  { key: "knee_replacement",       canonical: "Knee Replacement",        aliases: ["knee replacement", "knee surgery", "tkr", "total knee replacement", "knee arthroplasty"] },
  { key: "hip_replacement",        canonical: "Hip Replacement",         aliases: ["hip replacement", "hip surgery", "total hip replacement", "hip arthroplasty"] },
  { key: "acl_reconstruction",     canonical: "ACL Reconstruction",      aliases: ["acl", "acl reconstruction", "acl surgery", "acl repair", "anterior cruciate ligament"] },
  { key: "spinal_fusion",          canonical: "Spinal Fusion",           aliases: ["spinal fusion", "spine surgery", "spinal surgery", "spine fusion", "back surgery", "laminectomy"] },

  // ── Cardiac ──
  { key: "cardiac_bypass",         canonical: "Cardiac Bypass",          aliases: ["cardiac bypass", "heart bypass", "cabg", "coronary bypass", "bypass surgery", "bypass", "heart surgery", "open heart surgery", "open heart"] },
  { key: "angioplasty",            canonical: "Angioplasty",             aliases: ["angioplasty", "angiogram", "stent placement", "coronary angioplasty", "stent"] },
  { key: "heart_valve_replacement", canonical: "Heart Valve Replacement", aliases: ["heart valve", "valve replacement", "valve surgery", "heart valve replacement", "mitral valve", "aortic valve"] },
  { key: "pacemaker_implant",      canonical: "Pacemaker Implantation",  aliases: ["pacemaker", "pacemaker implant", "pacemaker surgery", "pacemaker implantation"] },

  // ── Abdominal / GI ──
  { key: "appendectomy",           canonical: "Appendectomy",            aliases: ["appendectomy", "appendix removal", "appendix surgery", "appendix"] },
  { key: "hernia_repair",          canonical: "Hernia Repair",           aliases: ["hernia", "hernia repair", "hernia surgery", "hernioplasty", "inguinal hernia"] },
  { key: "gallbladder_removal",    canonical: "Gallbladder Removal",     aliases: ["gallbladder", "gallbladder removal", "gallbladder surgery", "cholecystectomy", "gall bladder"] },
  { key: "colectomy",              canonical: "Colectomy",               aliases: ["colectomy", "colon surgery", "colon removal", "bowel surgery", "large intestine surgery"] },
  { key: "gastrectomy",            canonical: "Gastrectomy",             aliases: ["gastrectomy", "stomach surgery", "stomach removal", "gastric surgery"] },
  { key: "bariatric_surgery",      canonical: "Bariatric Surgery",       aliases: ["bariatric", "bariatric surgery", "weight loss surgery", "gastric bypass", "gastric sleeve", "lap band"] },

  // ── Urological ──
  { key: "kidney_stone_removal",   canonical: "Kidney Stone Removal",    aliases: ["kidney stone", "kidney stone removal", "lithotripsy", "kidney stone surgery", "renal stone"] },
  { key: "kidney_transplant",      canonical: "Kidney Transplant",       aliases: ["kidney transplant", "renal transplant", "kidney surgery"] },
  { key: "prostatectomy",          canonical: "Prostatectomy",           aliases: ["prostatectomy", "prostate surgery", "prostate removal", "prostate"] },

  // ── Hepatobiliary ──
  { key: "liver_surgery",          canonical: "Liver Surgery",           aliases: ["liver surgery", "hepatectomy", "liver resection", "liver transplant", "liver"] },

  // ── Neurosurgery ──
  { key: "craniotomy",             canonical: "Craniotomy",              aliases: ["craniotomy", "brain surgery", "brain tumor surgery", "brain operation", "brain tumor removal", "brain"] },

  // ── Oncology ──
  { key: "mastectomy",             canonical: "Mastectomy",              aliases: ["mastectomy", "breast surgery", "breast removal", "breast cancer surgery", "lumpectomy"] },
  { key: "tumor_removal",          canonical: "Tumor Removal",           aliases: ["tumor removal", "tumor surgery", "tumour removal", "tumour surgery", "cancer surgery", "cancer operation", "cancer"] },
  { key: "lung_surgery",           canonical: "Lung Surgery",            aliases: ["lung surgery", "lobectomy", "lung removal", "thoracotomy", "lung cancer surgery", "lung"] },
  { key: "thyroidectomy",          canonical: "Thyroidectomy",           aliases: ["thyroidectomy", "thyroid surgery", "thyroid removal", "thyroid"] },
  { key: "pancreatectomy",         canonical: "Pancreatectomy",          aliases: ["pancreatectomy", "pancreas surgery", "pancreas removal", "whipple procedure", "pancreas"] },

  // ── Eye ──
  { key: "cataract",               canonical: "Cataract Surgery",        aliases: ["cataract", "cataract surgery", "cataract removal", "lens replacement"] },

  // ── OB/GYN ──
  { key: "cesarean_section",       canonical: "Cesarean Section",        aliases: ["cesarean", "c-section", "c section", "caesarean", "cesarean section"] },
  { key: "hysterectomy",           canonical: "Hysterectomy",            aliases: ["hysterectomy", "uterus removal", "uterus surgery", "womb removal"] },

  // ── ENT ──
  { key: "tonsillectomy",          canonical: "Tonsillectomy",           aliases: ["tonsillectomy", "tonsil removal", "tonsil surgery", "tonsils"] },

  // ── Other ──
  { key: "ct_scan_and_medication", canonical: "CT Scan and Medication",  aliases: ["ct scan", "ct scan and medication"] },
  { key: "laparoscopy",            canonical: "Laparoscopic Surgery",    aliases: ["laparoscopy", "laparoscopic", "laparoscopic surgery", "keyhole surgery", "endoscopy"] },
];

// ── Disease Map ──

interface DiseaseEntry {
  key: string;
  canonical: string;
  aliases: string[];
  symptoms: string[];
  severity: "mild" | "moderate" | "severe";
  requiresSurgery: boolean;
  precautions: string[];
}

const DISEASE_MAP: DiseaseEntry[] = [
  {
    key: "dengue", canonical: "Dengue Fever",
    aliases: ["dengue", "dengue fever", "break-bone fever"],
    symptoms: ["high fever", "severe headache", "joint pain", "rash", "bleeding"],
    severity: "severe", requiresSurgery: false,
    precautions: ["Stay hydrated", "Rest completely", "Monitor platelet count", "Avoid aspirin/NSAIDs"],
  },
  {
    key: "malaria", canonical: "Malaria",
    aliases: ["malaria", "malarial fever"],
    symptoms: ["cyclic fever", "chills", "sweating", "headache", "nausea"],
    severity: "severe", requiresSurgery: false,
    precautions: ["Complete antimalarial course", "Use mosquito nets", "Stay hydrated"],
  },
  {
    key: "typhoid", canonical: "Typhoid Fever",
    aliases: ["typhoid", "typhoid fever", "enteric fever"],
    symptoms: ["sustained fever", "weakness", "stomach pain", "headache", "loss of appetite"],
    severity: "moderate", requiresSurgery: false,
    precautions: ["Antibiotics as prescribed", "Drink clean water", "Eat hygienically", "Rest"],
  },
  {
    key: "diabetes", canonical: "Diabetes",
    aliases: ["diabetes", "diabetes mellitus", "sugar", "blood sugar", "type 2 diabetes", "type 1 diabetes"],
    symptoms: ["frequent urination", "excessive thirst", "unexplained weight loss", "fatigue", "blurred vision"],
    severity: "moderate", requiresSurgery: false,
    precautions: ["Monitor blood sugar", "Follow prescribed diet", "Regular exercise", "Take insulin/medication"],
  },
  {
    key: "covid", canonical: "COVID-19",
    aliases: ["covid", "covid-19", "coronavirus", "sars-cov-2"],
    symptoms: ["fever", "dry cough", "fatigue", "loss of taste/smell", "breathing difficulty"],
    severity: "moderate", requiresSurgery: false,
    precautions: ["Isolate", "Wear mask", "Monitor oxygen levels", "Seek emergency care if breathing worsens"],
  },
  {
    key: "asthma", canonical: "Asthma",
    aliases: ["asthma", "bronchial asthma"],
    symptoms: ["wheezing", "shortness of breath", "chest tightness", "coughing"],
    severity: "moderate", requiresSurgery: false,
    precautions: ["Carry inhaler", "Avoid triggers", "Follow action plan", "Regular check-ups"],
  },
  {
    key: "pneumonia", canonical: "Pneumonia",
    aliases: ["pneumonia", "lung infection"],
    symptoms: ["cough with phlegm", "fever", "chills", "breathing difficulty", "chest pain"],
    severity: "severe", requiresSurgery: false,
    precautions: ["Complete antibiotic course", "Rest", "Stay hydrated", "Monitor breathing"],
  },
  {
    key: "hypertension", canonical: "Hypertension",
    aliases: ["hypertension", "high blood pressure", "high bp"],
    symptoms: ["headache", "dizziness", "blurred vision", "chest pain", "often asymptomatic"],
    severity: "moderate", requiresSurgery: false,
    precautions: ["Reduce salt intake", "Regular exercise", "Take prescribed medication", "Monitor BP"],
  },
  {
    key: "arthritis", canonical: "Arthritis",
    aliases: ["arthritis", "joint pain", "rheumatoid arthritis", "osteoarthritis"],
    symptoms: ["joint pain", "stiffness", "swelling", "decreased range of motion"],
    severity: "moderate", requiresSurgery: false,
    precautions: ["Stay active", "Physical therapy", "Anti-inflammatory medication", "Maintain healthy weight"],
  },
  {
    key: "tuberculosis", canonical: "Tuberculosis",
    aliases: ["tuberculosis", "tb"],
    symptoms: ["persistent cough", "coughing blood", "night sweats", "weight loss", "fatigue"],
    severity: "severe", requiresSurgery: false,
    precautions: ["Complete DOTS treatment", "Isolate during infectious phase", "Regular follow-up", "Nutritious diet"],
  },
];

// ── Symptom patterns ──

const SYMPTOM_PATTERNS: Array<{ symptom: string; pattern: RegExp }> = [
  { symptom: "fever",               pattern: /\b(fever|temperature|hot|burning)\b/i },
  { symptom: "cough",               pattern: /\b(cough|coughing|cold|phlegm|sneeze|sneezing)\b/i },
  { symptom: "fatigue",             pattern: /\b(fatigue|tired|weak|exhausted|lethargic|sleepy)\b/i },
  { symptom: "difficultyBreathing", pattern: /\b(breathing|breath|shortness of breath|short of breath|wheezing|chest tightness)\b/i },
  { symptom: "headache",            pattern: /\b(headache|head pain|migraine)\b/i },
  { symptom: "nausea",              pattern: /\b(nausea|vomiting|throwing up)\b/i },
  { symptom: "rash",                pattern: /\b(rash|skin rash|hives|itching)\b/i },
  { symptom: "diarrhea",            pattern: /\b(diarrhea|loose motion|loose stool)\b/i },
];

// ── Fuzzy matching (Levenshtein) ──

function levenshtein(a: string, b: string): number {
  const m = a.length;
  const n = b.length;
  const dp: number[][] = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0) as number[]);

  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      dp[i][j] = a[i - 1] === b[j - 1]
        ? dp[i - 1][j - 1]
        : 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
    }
  }

  return dp[m][n];
}

function similarity(a: string, b: string): number {
  const maxLen = Math.max(a.length, b.length);
  if (maxLen === 0) return 1;
  return 1 - levenshtein(a, b) / maxLen;
}

function normalizeText(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9\s-]/g, " ").replace(/\s+/g, " ").trim();
}

// ── Surgery matching ──

function matchSurgery(query: string): { entry: SurgeryEntry; score: number } | null {
  const normalized = normalizeText(query);
  let bestEntry: SurgeryEntry | null = null;
  let bestScore = 0;

  for (const entry of SURGERY_MAP) {
    for (const alias of entry.aliases) {
      // Exact substring
      if (normalized.includes(alias)) {
        const score = alias.length / normalized.length;
        const adjustedScore = Math.max(score, 0.85);
        if (adjustedScore > bestScore) {
          bestScore = adjustedScore;
          bestEntry = entry;
        }
      }
      // Fuzzy match
      const sim = similarity(normalized, alias);
      if (sim > bestScore) {
        bestScore = sim;
        bestEntry = entry;
      }
      // Word overlap fuzzy: check each word in the query against the alias words
      const queryWords = normalized.split(" ");
      const aliasWords = alias.split(" ");
      for (const qw of queryWords) {
        for (const aw of aliasWords) {
          const wordSim = similarity(qw, aw);
          const weighted = wordSim * 0.7; // word-level has lower confidence
          if (weighted > bestScore) {
            bestScore = weighted;
            bestEntry = entry;
          }
        }
      }
    }
  }

  return bestEntry && bestScore > 0.3 ? { entry: bestEntry, score: bestScore } : null;
}

// ── Disease matching ──

function matchDisease(query: string): { entry: DiseaseEntry; score: number } | null {
  const normalized = normalizeText(query);
  let bestEntry: DiseaseEntry | null = null;
  let bestScore = 0;

  for (const entry of DISEASE_MAP) {
    for (const alias of entry.aliases) {
      if (normalized.includes(alias)) {
        const score = Math.max(alias.length / normalized.length, 0.9);
        if (score > bestScore) {
          bestScore = score;
          bestEntry = entry;
        }
      }
      const sim = similarity(normalized, alias);
      if (sim > bestScore) {
        bestScore = sim;
        bestEntry = entry;
      }
    }
  }

  return bestEntry && bestScore > 0.4 ? { entry: bestEntry, score: bestScore } : null;
}

// ── Extraction helpers ──

function extractAge(message: string): number | undefined {
  const match = message.match(/\b(\d{1,3})\s*(?:years?\s*old|yo|yrs?\.?|year\s*old)?\b/i);
  if (!match) return undefined;
  const parsed = Number(match[1]);
  if (!Number.isFinite(parsed) || parsed < 1 || parsed > 120) return undefined;
  return parsed;
}

function extractGender(message: string): "Male" | "Female" | undefined {
  const normalized = normalizeText(message);
  if (/\b(male|man|boy|him|his)\b/.test(normalized)) return "Male";
  if (/\b(female|woman|girl|her|hers)\b/.test(normalized)) return "Female";
  return undefined;
}

function extractSymptoms(message: string): string[] {
  return SYMPTOM_PATTERNS.filter((entry) => entry.pattern.test(message)).map((entry) => entry.symptom);
}

function extractLevel(message: string, lowWords: RegExp, highWords: RegExp): "Low" | "Normal" | "High" {
  const normalized = normalizeText(message);
  if (highWords.test(normalized)) return "High";
  if (lowWords.test(normalized)) return "Low";
  return "Normal";
}

function extractDepartment(message: string): string | undefined {
  const normalized = normalizeText(message);
  const departments: Array<{ name: string; pattern: RegExp }> = [
    { name: "orthopedics",      pattern: /\b(orthopedic|ortho)\b/ },
    { name: "cardiology",       pattern: /\b(cardio|heart|cardiac)\b/ },
    { name: "neurology",        pattern: /\b(neuro|brain|neurolog)\b/ },
    { name: "general surgery",  pattern: /\b(general|surgery)\b/ },
    { name: "ophthalmology",    pattern: /\b(eye|ophthal|cataract)\b/ },
    { name: "icu",              pattern: /\b(icu|intensive)\b/ },
    { name: "emergency",        pattern: /\b(emergency|er|trauma)\b/ },
  ];

  for (const dept of departments) {
    if (dept.pattern.test(normalized)) return dept.name;
  }
  return undefined;
}

function extractProcedureName(message: string): string {
  const normalized = normalizeText(message);
  return normalized
    .replace(/\b(what is|what's|whats|tell me|show me|give me|can you|could you|please|the)\b/g, " ")
    .replace(/\b(price|cost|estimate|estimated|how much|budget|expense|charges?|fee|fees)\b/g, " ")
    .replace(/\b(for|of|about|on|in|regarding)\b/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

// ── Main entry point ──

/**
 * Find top-2 surgery candidates for clarification when the match is ambiguous.
 */
function findSurgeryAmbiguity(query: string): { needsClarification: boolean; options: string[]; message: string } {
  const normalized = normalizeText(query);
  const scored: Array<{ entry: SurgeryEntry; score: number }> = [];

  for (const entry of SURGERY_MAP) {
    let best = 0;
    for (const alias of entry.aliases) {
      const sim = similarity(normalized, alias);
      if (sim > best) best = sim;
      if (normalized.includes(alias)) {
        best = Math.max(best, 0.85);
      }
    }
    if (best > 0.3) scored.push({ entry, score: best });
  }

  scored.sort((a, b) => b.score - a.score);

  // If top match is below 0.6, or top-2 are close → clarification
  if (scored.length >= 2 && scored[0].score < 0.8 && (scored[1].score / scored[0].score) > 0.6) {
    return {
      needsClarification: true,
      options: scored.slice(0, 2).map((s) => s.entry.canonical),
      message: `Did you mean ${scored[0].entry.canonical} or ${scored[1].entry.canonical}?`,
    };
  }

  return { needsClarification: false, options: [], message: "" };
}

export function normalizeEntities(
  query: string,
  intent: AssistantIntent,
  contextEntities?: Partial<ExtractedEntities>
): NormalizationResult {
  const symptoms = extractSymptoms(query);
  const age = extractAge(query) ?? contextEntities?.age;
  const gender = extractGender(query) ?? contextEntities?.gender;
  const department = extractDepartment(query) ?? contextEntities?.department;
  const bloodPressure = extractLevel(query, /\b(low bp|low blood pressure|hypotension)\b/, /\b(high bp|high blood pressure|hypertension)\b/);
  const cholesterolLevel = extractLevel(query, /\b(low cholesterol)\b/, /\b(high cholesterol)\b/);

  const entities: ExtractedEntities = {
    age,
    gender,
    department,
    symptoms: symptoms.length > 0 ? symptoms : contextEntities?.symptoms,
    bloodPressure,
    cholesterolLevel,
  };

  // Surgery-related: try matching
  if (intent === "surgery_plan" || intent === "price_estimate") {
    const ambiguity = findSurgeryAmbiguity(query);
    if (ambiguity.needsClarification) {
      return {
        entities,
        needsClarification: true,
        clarificationMessage: ambiguity.message,
        clarificationOptions: ambiguity.options,
      };
    }

    const surgeryMatch = matchSurgery(query);
    if (surgeryMatch && surgeryMatch.score >= 0.6) {
      entities.surgeryType = surgeryMatch.entry.canonical;
      entities.surgeryKey = surgeryMatch.entry.key;
      entities.procedure = surgeryMatch.entry.canonical;
    } else {
      entities.procedure = extractProcedureName(query);
      entities.surgeryType = contextEntities?.surgeryType;
      entities.surgeryKey = contextEntities?.surgeryKey;
    }
  }

  // Disease-related: try matching
  if (intent === "disease_info") {
    const diseaseMatch = matchDisease(query);
    if (diseaseMatch) {
      entities.diseaseName = diseaseMatch.entry.canonical;
    }
  }

  return { entities, needsClarification: false };
}

/** Exported for the disease engine to look up disease data. */
export function lookupDisease(name: string): DiseaseEntry | undefined {
  const normalized = normalizeText(name);
  return DISEASE_MAP.find((entry) =>
    entry.aliases.some((alias) => normalized.includes(alias) || alias.includes(normalized))
  );
}

/** Exported for the disease engine to build payload from symptoms. */
export function buildDiseasePayload(entities: ExtractedEntities) {
  const symptoms = entities.symptoms ?? [];
  return {
    fever: symptoms.includes("fever"),
    cough: symptoms.includes("cough"),
    fatigue: symptoms.includes("fatigue"),
    difficultyBreathing: symptoms.includes("difficultyBreathing"),
    age: entities.age ?? 30,
    gender: entities.gender ?? "Female",
    bloodPressure: entities.bloodPressure ?? "Normal",
    cholesterolLevel: entities.cholesterolLevel ?? "Normal",
  };
}
