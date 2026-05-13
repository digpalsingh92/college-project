import type { AssistantContext, AssistantEntities, AssistantGender } from "@/services/assistant/types";

// --- Medical synonyms and simple fuzzy matching ---
const MEDICAL_SYNONYMS: Record<string, string[]> = {
  "heart attack": ["cardiac arrest", "mi", "myocardial infarction"],
  "shortness of breath": ["sob", "difficulty breathing", "cannot breathe"],
  "fever": ["pyrexia"],
};

function levenshtein(a: string, b: string): number {
  const matrix: number[][] = Array.from({ length: a.length + 1 }, () => []);
  for (let i = 0; i <= a.length; i++) matrix[i][0] = i;
  for (let j = 0; j <= b.length; j++) matrix[0][j] = j;
  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      matrix[i][j] = Math.min(matrix[i - 1][j] + 1, matrix[i][j - 1] + 1, matrix[i - 1][j - 1] + cost);
    }
  }
  return matrix[a.length][b.length];
}

function fuzzyIncludes(text: string, token: string, maxRatio = 0.3): boolean {
  // token relative to text words
  const words = text.split(/\s+/);
  for (const w of words) {
    const dist = levenshtein(w, token);
    const ratio = dist / Math.max(w.length, token.length);
    if (ratio <= maxRatio) return true;
  }
  return false;
}

function textMatchesSynonyms(text: string, canonical: string): boolean {
  const normalized = normalizeText(text);
  if (normalized.includes(normalizeText(canonical))) return true;
  const syns = MEDICAL_SYNONYMS[canonical] ?? [];
  for (const s of syns) {
    if (normalized.includes(normalizeText(s))) return true;
    if (fuzzyIncludes(normalized, normalizeText(s))) return true;
  }
  // fuzzy match canonical itself
  if (fuzzyIncludes(normalized, normalizeText(canonical))) return true;
  return false;
}

// Match explicit surgery phrases and common procedures.
const SURGERY_PATTERNS: Array<{ pattern: RegExp; value: string }> = [
  { pattern: /\b(knee\s+(replacement|surgery|arthroplasty))\b/i, value: "knee replacement" },
  { pattern: /\b(hip\s+(replacement|surgery|arthroplasty))\b/i, value: "hip replacement" },
  { pattern: /\b(cataract\s+(surgery|operation|procedure))\b/i, value: "cataract surgery" },
  { pattern: /\b(appendectomy|appendix\s+(surgery|removal))\b/i, value: "appendectomy" },
  { pattern: /\b(hernia\s+(repair|surgery))\b/i, value: "hernia repair" },
  { pattern: /\b(cardiac\s+bypass|bypass\s+surgery|open\s+heart\s+surgery)\b/i, value: "cardiac bypass" },
  { pattern: /\b(heart\s+(surgery|operation|procedure))\b/i, value: "heart surgery" },
  { pattern: /\b(brain\s+(surgery|operation|procedure))\b/i, value: "brain surgery" },
  { pattern: /\b(spinal?\s+(surgery|fusion|operation))\b/i, value: "spinal surgery" },
  { pattern: /\b(gallbladder\s+(surgery|removal)|cholecystectomy)\b/i, value: "gallbladder surgery" },
  { pattern: /\b(tonsil(lectomy|\s+removal|\s+surgery))\b/i, value: "tonsillectomy" },
  { pattern: /\b(lasik|laser\s+eye\s+surgery)\b/i, value: "lasik" },
  { pattern: /\b(coronary\s+artery\s+bypass|cabg)\b/i, value: "cardiac bypass" },
  { pattern: /\b(angioplasty)\b/i, value: "angioplasty" },
  { pattern: /\b(c-section|cesarean\s+section|caesarean)\b/i, value: "cesarean section" },
  { pattern: /\b(mastectomy|breast\s+(surgery|removal))\b/i, value: "mastectomy" },
  { pattern: /\b(liver\s+(transplant|surgery))\b/i, value: "liver transplant" },
  { pattern: /\b(kidney\s+(transplant|surgery))\b/i, value: "kidney transplant" },
  { pattern: /\b(stent\s+(placement|surgery|procedure))\b/i, value: "stent placement" },
  { pattern: /\b(pacemaker\s+(implant|surgery|procedure))\b/i, value: "pacemaker implant" },
];

// Generic fallback: catches "<word> surgery" patterns not in the list above
const GENERIC_SURGERY_RE = /\b([a-z]+)\s+surgery\b/i;

const SYMPTOM_PATTERNS: Array<{ symptom: string; pattern: RegExp }> = [
  { symptom: "fever", pattern: /\b(fever|temperature|hot|burning)\b/i },
  { symptom: "cough", pattern: /\b(cough|coughing|cold|phlegm|sneeze|sneezing)\b/i },
  { symptom: "fatigue", pattern: /\b(fatigue|tired|weak|exhausted|lethargic|sleepy)\b/i },
  { symptom: "difficultyBreathing", pattern: /\b(breathing|breath|shortness of breath|short of breath|wheezing|chest tightness|difficulty breathing|cannot breathe|difficulty breathing)\b/i },
  { symptom: "chestPain", pattern: /\b(chest pain|chest pains|severe chest pain|pain in chest)\b/i },
  { symptom: "headache", pattern: /\b(headache|headaches|migraine)\b/i },
  { symptom: "nausea", pattern: /\b(nausea|nauseous)\b/i },
  { symptom: "vomiting", pattern: /\b(vomit|vomiting|throw up)\b/i },
  { symptom: "dizziness", pattern: /\b(dizziness|dizzy|lightheaded)\b/i },
  { symptom: "blurredVision", pattern: /\b(blurred vision|blurry vision)\b/i },
  { symptom: "swelling", pattern: /\b(swelling|swollen)\b/i },
  { symptom: "fracture", pattern: /\b(fracture|broken bone|broken)\b/i },
  { symptom: "jointPain", pattern: /\b(joint pain|joint pains|arthralgia)\b/i },
  { symptom: "backPain", pattern: /\b(back pain|lower back pain|upper back pain)\b/i },
];

export function normalizeText(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9\s-]/g, " ").replace(/\s+/g, " ").trim();
}

export function messageHasSurgeryTopic(message: string): boolean {
  const normalized = normalizeText(message);
  // Conservative: only if explicit surgery phrases exist
  return SURGERY_PATTERNS.some((p) => p.pattern.test(normalized));
}

export function messageHasEmergency(message: string): boolean {
  const normalized = normalizeText(message);
  // Check explicit emergency tokens, plus synonyms (e.g., "cardiac arrest", "mi")
  if (/\b(emergency|urgent|unconscious|severe|critical|heavy bleeding|bleeding heavily)\b/.test(normalized)) return true;
  if (/\b(severe chest pain|chest pain)\b/.test(normalized)) return true;
  if (textMatchesSynonyms(normalized, "heart attack")) return true;
  if (textMatchesSynonyms(normalized, "shortness of breath")) return true;
  return false;
}

function extractSurgeryType(message: string): string | undefined {
  // Try explicit patterns first
  for (const entry of SURGERY_PATTERNS) {
    if (entry.pattern.test(message)) return entry.value;
  }
  // Fallback: match generic "<word> surgery" (e.g. "heart surgery", "eye surgery")
  const generic = message.match(GENERIC_SURGERY_RE);
  if (generic && generic[0]) {
    return generic[0].toLowerCase();
  }
  // Fallback: match "<word> operation" or "<word> procedure"
  const altMatch = message.match(/\b([a-z]+)\s+(operation|procedure)\b/i);
  if (altMatch && altMatch[0]) {
    return altMatch[0].toLowerCase().replace(/(operation|procedure)$/, "surgery").trim();
  }
  return undefined;
}

function extractAge(message: string): number | undefined {
  // Require explicit age indicators to avoid picking up numbers like '2 days'
  const explicit = message.match(/\b(\d{1,3})\s*(?:years?\s*old|yo\b|yrs?\.?|year\s*old|aged|age)\b/i);
  if (explicit && explicit[1]) {
    const parsed = Number(explicit[1]);
    if (!Number.isFinite(parsed)) return undefined;
    return Math.max(0, Math.min(120, parsed));
  }

  // also support formats like 'age 45' or 'aged 45'
  const ageInline = message.match(/\bage\s*(?:is\s*)?(\d{1,3})\b/i) || message.match(/\baged\s*(\d{1,3})\b/i);
  if (ageInline && ageInline[1]) return Math.max(0, Math.min(120, Number(ageInline[1])));

  // Fallback: bare number that looks like a plausible age (18-120)
  // Only match when the message is short (likely a follow-up like "heart surgery, 64")
  if (message.trim().split(/\s+/).length <= 8) {
    const bareNumber = message.match(/\b(\d{1,3})\b/);
    if (bareNumber && bareNumber[1]) {
      const n = Number(bareNumber[1]);
      if (n >= 1 && n <= 120) return n;
    }
  }

  return undefined;
}

function extractGender(message: string): AssistantGender | undefined {
  // Only use explicit gender words. Do not infer from pronouns.
  const normalized = normalizeText(message);
  if (/\b(male|man|boy)\b/.test(normalized)) return "Male";
  if (/\b(female|woman|girl)\b/.test(normalized)) return "Female";
  return undefined;
}

function extractSymptoms(message: string): string[] {
  const normalized = normalizeText(message);
  const matches = new Set<string>();
  for (const entry of SYMPTOM_PATTERNS) {
    if (entry.pattern.test(message) || fuzzyIncludes(normalized, normalizeText(entry.symptom))) {
      matches.add(entry.symptom);
    }
  }
  // Also match via synonyms map
  for (const canonical of Object.keys(MEDICAL_SYNONYMS)) {
    if (textMatchesSynonyms(message, canonical)) {
      // map a few canonical synonyms into our symptom keys
      if (canonical === "heart attack") matches.add("chestPain");
      if (canonical === "shortness of breath") matches.add("difficultyBreathing");
      if (canonical === "fever") matches.add("fever");
    }
  }
  return Array.from(matches);
}

export function detectSymptomCombinations(message: string): string[] {
  const syms = extractSymptoms(message);
  const set = new Set(syms);
  const combos: string[] = [];

  // respiratory: fever + cough + difficultyBreathing
  if (set.has("fever") && set.has("cough") && (set.has("difficultyBreathing") || textMatchesSynonyms(message, "shortness of breath"))) {
    combos.push("respiratory");
  }

  // cardiac: chest pain + (dizziness|nausea|vomiting)
  if (set.has("chestPain") && (set.has("dizziness") || set.has("nausea") || set.has("vomiting"))) {
    combos.push("cardiac");
  }

  // orthopedic: jointPain + swelling or fracture
  if (set.has("jointPain") && (set.has("swelling") || set.has("fracture") || set.has("backPain"))) {
    combos.push("orthopedic");
  }

  return combos;
}

function extractCity(message: string): string | undefined {
  // Very conservative: look for 'in <city>' or 'at <city>' before common stopwords
  const m = message.match(/\b(?:in|at)\s+([a-z\s]{2,40}?)(?:\b(?:hospital|clinic|centre|center|ward|icu|department|$))/i);
  if (m && m[1]) return m[1].trim();
  return undefined;
}

function extractDepartment(message: string): string | undefined {
  const normalized = normalizeText(message);
  if (/\b(icu|intensive care|intensive care unit)\b/.test(normalized)) return "ICU";
  if (/\b(cardiology|cardiology department)\b/.test(normalized)) return "Cardiology";
  if (/\b(orthopedics|orthopaedics|orthopedics department)\b/.test(normalized)) return "Orthopedics";
  if (/\b(emergency|er|a&e|accident and emergency)\b/.test(normalized)) return "Emergency";
  if (/\b(general ward|general ward|ward)\b/.test(normalized)) return "General";
  return undefined;
}

function extractWardType(message: string): string | undefined {
  const normalized = normalizeText(message);
  if (/\b(private room|private)\b/.test(normalized)) return "Private";
  if (/\b(semi[- ]?private)\b/.test(normalized)) return "Semi-Private";
  if (/\b(icu|intensive care)\b/.test(normalized)) return "ICU";
  return undefined;
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
  const city = extractCity(message) ?? context?.entities.city;
  const department = extractDepartment(message) ?? context?.entities.department;
  const wardType = extractWardType(message) ?? context?.entities.wardType;
  const severity = extractLevel(message, /\b(mild|little|slight)\b/, /\b(severe|extreme|unbearable|critical)\b/);

  return {
    surgeryType,
    age,
    gender,
    symptoms,
    city,
    department,
    wardType,
    severity,
  };
}

export function computeEntityConfidence(e: AssistantEntities): number {
  const keys = [e.surgeryType, e.age, e.gender, e.symptoms && e.symptoms.length ? e.symptoms : undefined, e.department];
  const filled = keys.filter(Boolean).length;
  return Math.min(filled / keys.length, 1);
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
    age: entities.age,
    gender: entities.gender,
    bloodPressure: extractLevel(normalized, /\b(low bp|low blood pressure|hypotension)\b/, /\b(high bp|high blood pressure|hypertension)\b/),
    cholesterolLevel: extractLevel(normalized, /\b(low cholesterol)\b/, /\b(high cholesterol)\b/),
  };
}
