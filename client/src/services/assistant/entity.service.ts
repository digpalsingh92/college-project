import type { AssistantContext, AssistantEntities, AssistantGender } from "@/services/assistant/types";

const SURGERY_PATTERNS: Array<{ pattern: RegExp; value: string }> = [
  { pattern: /\b(knee\s+replacement|knee)\b/i, value: "knee replacement" },
  { pattern: /\b(hip\s+replacement|hip)\b/i, value: "hip replacement" },
  { pattern: /\b(cataract)\b/i, value: "cataract" },
  { pattern: /\b(appendectomy|appendix)\b/i, value: "appendectomy" },
  { pattern: /\b(hernia)\b/i, value: "hernia repair" },
  { pattern: /\b(cardiac\s+bypass|bypass)\b/i, value: "cardiac bypass" },
  { pattern: /\b(angioplasty)\b/i, value: "angioplasty" },
];

const SYMPTOM_PATTERNS: Array<{ symptom: string; pattern: RegExp }> = [
  { symptom: "fever", pattern: /\b(fever|temperature|hot|burning)\b/i },
  { symptom: "cough", pattern: /\b(cough|coughing|cold|phlegm|sneeze|sneezing)\b/i },
  { symptom: "fatigue", pattern: /\b(fatigue|tired|weak|exhausted|lethargic|sleepy)\b/i },
  { symptom: "difficultyBreathing", pattern: /\b(breathing|breath|shortness of breath|short of breath|wheezing|chest tightness)\b/i },
];

export function normalizeText(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9\s-]/g, " ").replace(/\s+/g, " ").trim();
}

export function messageHasSurgeryTopic(message: string): boolean {
  const normalized = normalizeText(message);
  return /\b(knee|hip|cataract|appendectomy|hernia|cardiac|bypass|angioplasty|surgery|operation|procedure|replacement)\b/.test(normalized);
}

function extractSurgeryType(message: string): string | undefined {
  for (const entry of SURGERY_PATTERNS) {
    if (entry.pattern.test(message)) return entry.value;
  }
  return undefined;
}

function extractAge(message: string): number | undefined {
  const match = message.match(/\b(\d{1,3})\s*(?:years?\s*old|yo|yrs?\.?|year\s*old)?\b/i);
  if (!match) return undefined;

  const parsed = Number(match[1]);
  if (!Number.isFinite(parsed)) return undefined;

  return Math.max(0, Math.min(120, parsed));
}

function extractGender(message: string): AssistantGender | undefined {
  const normalized = normalizeText(message);
  if (/\b(male|man|boy|him|his)\b/.test(normalized)) return "Male";
  if (/\b(female|woman|girl|her|hers)\b/.test(normalized)) return "Female";
  return undefined;
}

function extractSymptoms(message: string): string[] {
  return SYMPTOM_PATTERNS.filter((entry) => entry.pattern.test(message)).map((entry) => entry.symptom);
}

export function extractSubject(message: string): string {
  const normalized = normalizeText(message);
  const cleaned = normalized
    .replace(/\b(what is|what's|whats|tell me|show me|give me|can you|could you|please|the)\b/g, " ")
    .replace(/\b(price|cost|estimate|estimated|wait time|wait|bed|beds|availability|available|queue|how long|how much|recovery)\b/g, " ")
    .replace(/\b(for|of|about|on|in|regarding)\b/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  return cleaned.length > 0 ? cleaned : normalized;
}

export function extractEntities(message: string, context?: AssistantContext): AssistantEntities {
  const surgeryType = extractSurgeryType(message) ?? context?.entities.surgeryType;
  const age = extractAge(message) ?? context?.entities.age;
  const gender = extractGender(message) ?? context?.entities.gender;
  const extractedSymptoms = extractSymptoms(message);
  const symptoms = extractedSymptoms.length > 0 ? extractedSymptoms : context?.entities.symptoms;

  return {
    surgeryType,
    age,
    gender,
    symptoms,
  };
}

function extractLevel(message: string, lowWords: RegExp, highWords: RegExp): "Low" | "Normal" | "High" {
  const normalized = normalizeText(message);
  if (highWords.test(normalized)) return "High";
  if (lowWords.test(normalized)) return "Low";
  return "Normal";
}

export function buildDiseasePayload(message: string, entities: AssistantEntities) {
  const normalized = normalizeText(message);
  return {
    fever: /\b(fever|temperature|hot|burning)\b/.test(normalized),
    cough: /\b(cough|coughing|cold|phlegm|sneeze|sneezing)\b/.test(normalized),
    fatigue: /\b(fatigue|tired|weak|exhausted|lethargic|sleepy)\b/.test(normalized),
    difficultyBreathing: /\b(breathing|breath|shortness of breath|short of breath|wheezing|chest tightness)\b/.test(normalized),
    age: entities.age ?? 30,
    gender: entities.gender ?? "Female",
    bloodPressure: extractLevel(normalized, /\b(low bp|low blood pressure|hypotension)\b/, /\b(high bp|high blood pressure|hypertension)\b/),
    cholesterolLevel: extractLevel(normalized, /\b(low cholesterol)\b/, /\b(high cholesterol)\b/),
  };
}
