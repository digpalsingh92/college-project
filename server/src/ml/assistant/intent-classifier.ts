/**
 * Deterministic Intent Classifier
 *
 * Uses weighted keyword scoring — no LLM.
 * Returns a single intent with confidence, or "clarification" when ambiguous.
 */

export type AssistantIntent =
  | "surgery_plan"
  | "disease_info"
  | "price_estimate"
  | "bed_availability"
  | "wait_time"
  | "appointment_booking"
  | "clarification"
  | "unknown";

export interface IntentResult {
  intent: AssistantIntent;
  confidence: number;
  /** When intent === "clarification", the top-N candidates the user might mean. */
  alternatives?: Array<{ intent: AssistantIntent; label: string }>;
}

// ── Keyword rules ──

interface KeywordRule {
  pattern: RegExp;
  weight: number;
}

const INTENT_RULES: Record<
  Exclude<AssistantIntent, "clarification" | "unknown">,
  KeywordRule[]
> = {
  surgery_plan: [
    { pattern: /\b(surgery|operation|procedure|transplant|post-op|post operative|pre-op)\b/, weight: 2.2 },
    { pattern: /\b(knee replacement|hip replacement|cataract|appendectomy|hernia|cardiac bypass|angioplasty|bypass)\b/, weight: 2.5 },
    { pattern: /\b(heart surgery|liver surgery|kidney surgery|brain surgery|cancer surgery|spinal surgery|gallbladder|mastectomy|colectomy|gastrectomy|craniotomy|laminectomy|cholecystectomy|nephrectomy|hepatectomy|lobectomy|thoracotomy|laparoscopy|endoscopy)\b/, weight: 2.5 },
    { pattern: /\b(heart|liver|kidney|brain|lung|spine|spinal|gallbladder|prostate|bladder|colon|stomach|thyroid|pancreas|tumor|tumour|cancer)\b/, weight: 1.6 },
    { pattern: /\b(recovery|rehab|rehabilitation|recover)\b/, weight: 1.4 },
  ],
  disease_info: [
    { pattern: /\b(disease|diagnosis|illness|condition|disorder|infection|syndrome)\b/, weight: 2.2 },
    { pattern: /\b(dengue|malaria|typhoid|tuberculosis|tb|covid|diabetes|asthma|pneumonia|cholera|hepatitis|arthritis|hypertension|migraine|anemia)\b/, weight: 2.8 },
    { pattern: /\b(fever|cough|fatigue|breathing|breath|symptom|symptoms|nausea|vomiting|headache|rash|diarrhea|sick|ill)\b/, weight: 2.0 },
  ],
  price_estimate: [
    { pattern: /\b(price|cost|estimate|estimated|how much|budget|expense|charges?|fee|fees|billing|bill|afford)\b/, weight: 2.3 },
  ],
  bed_availability: [
    { pattern: /\b(bed|beds|availability|available|occupancy|icu|ward|admission|admit|room|rooms)\b/, weight: 2.2 },
  ],
  wait_time: [
    { pattern: /\b(wait|wait time|queue|how long|delay|slot|waiting)\b/, weight: 2.2 },
    { pattern: /\b(soon|earliest|next available|when can)\b/, weight: 1.8 },
  ],
  appointment_booking: [
    { pattern: /\b(book|booking|appointment|schedule|reserve|visit|consult|consultation|check-?up)\b/, weight: 2.5 },
    { pattern: /\b(doctor|specialist|meet|see a doctor|available doctors?)\b/, weight: 1.6 },
  ],
};

const INTENT_LABELS: Record<Exclude<AssistantIntent, "clarification" | "unknown">, string> = {
  surgery_plan: "Surgery Planning",
  disease_info: "Disease Information",
  price_estimate: "Price Estimate",
  bed_availability: "Bed Availability",
  wait_time: "Wait Time",
  appointment_booking: "Appointment Booking",
};

// ── Scoring ──

function normalizeText(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9\s-]/g, " ").replace(/\s+/g, " ").trim();
}

/**
 * Classify user query into a deterministic intent.
 *
 * Context-carry: if `lastIntent` is provided and no strong match is found,
 * we give a small boost to the previous intent for multi-turn flows.
 */
export function classifyIntent(query: string, lastIntent?: AssistantIntent): IntentResult {
  const normalized = normalizeText(query);

  const scores: Record<string, number> = {};
  const intents = Object.keys(INTENT_RULES) as Array<Exclude<AssistantIntent, "clarification" | "unknown">>;

  for (const intent of intents) {
    scores[intent] = 0;
    for (const rule of INTENT_RULES[intent]) {
      if (rule.pattern.test(normalized)) {
        scores[intent] += rule.weight;
      }
    }
  }

  // Context carry — mild boost only
  if (lastIntent && lastIntent !== "unknown" && lastIntent !== "clarification" && scores[lastIntent] !== undefined) {
    scores[lastIntent] += 0.5;
  }

  // ── Co-occurrence resolution ──
  // When surgery keywords appear alongside price/wait/bed keywords, the user
  // is asking about a surgery aspect. Route to surgery_plan (it includes cost,
  // wait time, and bed data in its response).
  const hasSurgerySignal = scores["surgery_plan"] >= 1.5;
  const hasPriceSignal = scores["price_estimate"] >= 1.5;
  const hasWaitSignal = scores["wait_time"] >= 1.5;
  const hasBedSignal = scores["bed_availability"] >= 1.5;

  if (hasSurgerySignal && (hasPriceSignal || hasWaitSignal || hasBedSignal)) {
    // Surgery + secondary aspect → route to surgery_plan
    scores["surgery_plan"] += 1.5;
  }

  // Sort by score descending
  const ranked = intents.slice().sort((a, b) => scores[b] - scores[a]);
  const topScore = scores[ranked[0]];
  const secondScore = scores[ranked[1]];

  // No meaningful match
  if (topScore < 1.5) {
    return {
      intent: "unknown",
      confidence: 0,
    };
  }

  // Ambiguity check: if top-2 are within 25% of each other and both > threshold
  // Skip clarification if the top intent already has a strong absolute score (> 4)
  if (
    secondScore >= 1.5 &&
    topScore > 0 &&
    topScore <= 4 &&
    (secondScore / topScore) >= 0.75
  ) {
    return {
      intent: "clarification",
      confidence: topScore / (topScore + secondScore),
      alternatives: [
        { intent: ranked[0], label: INTENT_LABELS[ranked[0]] },
        { intent: ranked[1], label: INTENT_LABELS[ranked[1]] },
      ],
    };
  }

  // Compute confidence as ratio of top to total
  const totalScore = intents.reduce((sum, i) => sum + Math.max(scores[i], 0), 0);
  const confidence = totalScore > 0 ? Math.min(topScore / totalScore, 0.99) : 0;

  return {
    intent: ranked[0],
    confidence: Number(confidence.toFixed(2)),
  };
}
