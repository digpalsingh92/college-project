/**
 * Medical Reasoning Layer
 *
 * Sits between entity extraction and response planning.
 * Responsibilities:
 *   1. Urgency scoring — combines symptom severity, patterns, and entity confidence
 *   2. Cross-intent escalation — e.g. bed query + chest pain → emergency
 *   3. Entity gap analysis — determines what's missing for a high-quality answer
 *   4. Medical context enrichment — infers department, severity from context
 */

import {
  detectSymptomCombinations,
  computeEntityConfidence,
  messageHasEmergency,
} from "@/services/assistant/entity.service";
import type {
  AssistantEntities,
  AssistantIntent,
  DetectedIntent,
  MedicalReasoning,
  UrgencyLevel,
  AssistantContext,
} from "@/services/assistant/types";

// ── Surgery → Department mapping ──
const SURGERY_DEPARTMENT_MAP: Record<string, string> = {
  "knee replacement": "Orthopedics",
  "hip replacement": "Orthopedics",
  "cataract surgery": "Ophthalmology",
  appendectomy: "General Surgery",
  "hernia repair": "General Surgery",
  "cardiac bypass": "Cardiology",
  "heart surgery": "Cardiology",
  angioplasty: "Cardiology",
  "stent placement": "Cardiology",
  "pacemaker implant": "Cardiology",
  "cesarean section": "Obstetrics & Gynecology",
  "brain surgery": "Neurosurgery",
  "spinal surgery": "Neurosurgery",
  "gallbladder surgery": "General Surgery",
  tonsillectomy: "ENT",
  lasik: "Ophthalmology",
  mastectomy: "Oncology",
  "liver transplant": "Transplant Unit",
  "kidney transplant": "Transplant Unit",
};

// ── Symptom → Department inference ──
const SYMPTOM_DEPARTMENT_MAP: Record<string, string> = {
  chestPain: "Cardiology",
  difficultyBreathing: "Pulmonology",
  fracture: "Orthopedics",
  jointPain: "Orthopedics",
  backPain: "Orthopedics",
  fever: "Internal Medicine",
  nausea: "Gastroenterology",
  vomiting: "Gastroenterology",
  headache: "Neurology",
  dizziness: "Neurology",
  blurredVision: "Ophthalmology",
};

// ── Required entities per intent ──
const REQUIRED_ENTITIES: Record<string, string[]> = {
  "surgery-plan": ["surgeryType"],
  price: [],
  "wait-time": [],
  bed: [],
  disease: ["symptoms"],
  recommendations: [],
  emergency: [],
};

// ── Urgency scores for clinical patterns ──
const PATTERN_URGENCY: Record<string, number> = {
  cardiac: 4,
  respiratory: 3,
  orthopedic: 2,
};

const SEVERITY_URGENCY: Record<string, number> = {
  High: 4,
  Normal: 2,
  Low: 1,
};

/**
 * Analyse the user's medical context and produce a reasoning result.
 */
export function performMedicalReasoning(
  message: string,
  intentResult: DetectedIntent,
  entities: AssistantEntities,
  context: AssistantContext
): MedicalReasoning {
  const reasoning: string[] = [];

  // ── 1. Clinical pattern detection ──
  const clinicalPatterns = detectSymptomCombinations(message);
  if (clinicalPatterns.length > 0) {
    reasoning.push(`Detected clinical patterns: ${clinicalPatterns.join(", ")}`);
  }

  // ── 2. Urgency scoring ──
  let urgencyScore = 1;

  // From severity
  if (entities.severity) {
    const sevScore = SEVERITY_URGENCY[entities.severity] ?? 2;
    urgencyScore = Math.max(urgencyScore, sevScore);
    reasoning.push(`Severity "${entities.severity}" → urgency ${sevScore}`);
  }

  // From clinical patterns
  for (const pattern of clinicalPatterns) {
    const pScore = PATTERN_URGENCY[pattern] ?? 1;
    urgencyScore = Math.max(urgencyScore, pScore);
    reasoning.push(`Pattern "${pattern}" → urgency ${pScore}`);
  }

  // From emergency keywords
  if (messageHasEmergency(message)) {
    urgencyScore = 5;
    reasoning.push("Emergency keywords detected → urgency 5");
  }

  // Intent-based bump
  if (intentResult.primaryIntent === "emergency") {
    urgencyScore = 5;
  }

  const urgency = Math.min(5, Math.max(1, urgencyScore)) as UrgencyLevel;

  // ── 3. Cross-intent escalation ──
  let escalatedIntent: AssistantIntent | undefined;

  // If someone asks about beds/price/wait but mentions emergency symptoms → escalate
  if (
    urgency >= 4 &&
    intentResult.primaryIntent !== "emergency" &&
    intentResult.primaryIntent !== "disease"
  ) {
    escalatedIntent = "emergency";
    reasoning.push(
      `Cross-intent escalation: "${intentResult.primaryIntent}" escalated to "emergency" due to urgency ${urgency}`
    );
  }

  // If disease intent has a surgery type, might actually be surgery-plan
  if (
    intentResult.primaryIntent === "disease" &&
    entities.surgeryType &&
    !entities.symptoms?.length
  ) {
    escalatedIntent = "surgery-plan";
    reasoning.push("Disease intent with surgery type and no symptoms → escalated to surgery-plan");
  }

  // ── 4. Entity gap analysis ──
  const effectiveIntent = escalatedIntent ?? intentResult.primaryIntent;
  const requiredKeys = REQUIRED_ENTITIES[effectiveIntent] ?? [];
  const missingEntities: string[] = [];

  for (const key of requiredKeys) {
    const val = entities[key as keyof AssistantEntities];
    const isEmpty = val === undefined || val === null || (Array.isArray(val) && val.length === 0);
    if (isEmpty) {
      missingEntities.push(key);
    }
  }

  if (missingEntities.length > 0) {
    reasoning.push(`Missing entities for "${effectiveIntent}": ${missingEntities.join(", ")}`);
  }

  // ── 5. Clarification logic ──
  // Only ask for clarification if we're NOT in emergency and entities are critically missing
  const needsClarification =
    urgency < 4 &&
    missingEntities.length > 0 &&
    intentResult.primaryConfidence < 0.4;

  let clarificationPrompt: string | undefined;
  if (needsClarification) {
    clarificationPrompt = buildClarificationPrompt(effectiveIntent, missingEntities, entities);
    reasoning.push(`Clarification needed: ${clarificationPrompt}`);
  }

  // ── 6. Medical context enrichment ──
  let inferredDepartment = entities.department;

  // Infer from surgery type
  if (!inferredDepartment && entities.surgeryType) {
    const surgeryLower = entities.surgeryType.toLowerCase();
    inferredDepartment = SURGERY_DEPARTMENT_MAP[surgeryLower];
    if (inferredDepartment) {
      reasoning.push(`Inferred department "${inferredDepartment}" from surgery "${entities.surgeryType}"`);
    }
  }

  // Infer from symptoms
  if (!inferredDepartment && entities.symptoms && entities.symptoms.length > 0) {
    // Pick the department with the most symptom matches
    const deptCounts: Record<string, number> = {};
    for (const sym of entities.symptoms) {
      const dept = SYMPTOM_DEPARTMENT_MAP[sym];
      if (dept) {
        deptCounts[dept] = (deptCounts[dept] ?? 0) + 1;
      }
    }
    const topDept = Object.entries(deptCounts).sort((a, b) => b[1] - a[1])[0];
    if (topDept) {
      inferredDepartment = topDept[0];
      reasoning.push(`Inferred department "${inferredDepartment}" from symptom analysis`);
    }
  }

  // Infer from clinical patterns
  if (!inferredDepartment && clinicalPatterns.length > 0) {
    if (clinicalPatterns.includes("cardiac")) inferredDepartment = "Cardiology";
    else if (clinicalPatterns.includes("respiratory")) inferredDepartment = "Pulmonology";
    else if (clinicalPatterns.includes("orthopedic")) inferredDepartment = "Orthopedics";

    if (inferredDepartment) {
      reasoning.push(`Inferred department "${inferredDepartment}" from clinical pattern`);
    }
  }

  // ── 7. Entity confidence check for reasoning quality ──
  const entityConfidence = computeEntityConfidence(entities);
  reasoning.push(`Entity confidence: ${(entityConfidence * 100).toFixed(0)}%`);
  reasoning.push(`Final urgency level: ${urgency}/5`);

  return {
    urgency,
    escalatedIntent,
    missingEntities,
    needsClarification,
    clarificationPrompt,
    inferredDepartment,
    clinicalPatterns,
    reasoning,
  };
}

// ── Clarification prompt builder ──

function buildClarificationPrompt(
  intent: AssistantIntent,
  missing: string[],
  entities: AssistantEntities
): string {
  const parts: string[] = [];

  if (intent === "surgery-plan" && missing.includes("surgeryType")) {
    parts.push("Which surgery or procedure are you asking about?");
    parts.push("For example: knee replacement, cataract surgery, cardiac bypass, or hernia repair.");
  }

  if (intent === "disease" && missing.includes("symptoms")) {
    parts.push("Could you describe your symptoms in more detail?");
    parts.push("For example: fever, cough, chest pain, difficulty breathing, or joint pain.");
  }

  if (missing.includes("age") && !entities.age) {
    parts.push("What is the patient's age?");
  }

  if (parts.length === 0) {
    parts.push("Could you provide a few more details so I can give you a more accurate answer?");
  }

  return parts.join("\n");
}
