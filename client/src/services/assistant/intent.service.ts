import { messageHasEmergency, normalizeText, detectSymptomCombinations } from "@/services/assistant/entity.service";
import type { AssistantIntent, DetectedIntent } from "@/services/assistant/types";

const KNOWN_INTENTS: AssistantIntent[] = [
  "emergency",
  "surgery-plan",
  "price",
  "wait-time",
  "bed",
  "disease",
  "recommendations",
  "unknown",
];

const INTENT_KEYWORDS: Record<Exclude<AssistantIntent, "unknown">, Array<{ pattern: RegExp; weight: number }>> = {
  "surgery-plan": [
    // prefer explicit surgery phrases; entity.service contains conservative surgery detection
    { pattern: /\b(surgery|operation|procedure|replacement|post-op|post operative|rehab|recovery)\b/, weight: 2.3 },
  ],
  emergency: [
    { pattern: /\b(emergency|urgent|unconscious|severe chest pain|heart attack|heavy bleeding|cannot breathe|difficulty breathing|critical)\b/, weight: 5 },
  ],
  price: [
    { pattern: /\b(price|cost|estimate|estimated|how much|budget|expense|charges?)\b/, weight: 2.1 },
  ],
  "wait-time": [
    { pattern: /\b(wait|wait time|queue|how long|soon|delay|slot|availability time)\b/, weight: 2 },
  ],
  bed: [
    { pattern: /\b(bed|beds|availability|available|occupancy|icu|ward|admission)\b/, weight: 2.1 },
  ],
  disease: [
    { pattern: /\b(fever|cough|fatigue|breath|breathing|symptom|symptoms|disease|diagnosis|ill|sick|infection)\b/, weight: 2.2 },
  ],
  recommendations: [
    { pattern: /\b(recommend|suggest|advice|tips|general guidance|what should i do)\b/, weight: 1.6 },
  ],
};

function createScoreMap(): Record<AssistantIntent, number> {
  return {
    emergency: 0,
    "surgery-plan": 0,
    price: 0,
    "wait-time": 0,
    bed: 0,
    disease: 0,
    recommendations: 0,
    unknown: 0,
  };
}

function looksLikeFollowUpQuestion(message: string): boolean {
  return /\b(what about|how about|and what|also|same for this|this one|that one|again|more details|cost of that|recovery for that)\b/.test(
    message
  );
}

export function detectIntent(message: string, lastIntent?: AssistantIntent): DetectedIntent {
  const normalized = normalizeText(message);
  const scores = createScoreMap();

  for (const [intent, rules] of Object.entries(INTENT_KEYWORDS) as Array<[
    Exclude<AssistantIntent, "unknown">,
    Array<{ pattern: RegExp; weight: number }>,
  ]>) {
    for (const rule of rules) {
      if (rule.pattern.test(normalized)) {
        scores[intent] += rule.weight;
      }
    }
  }

  // Emergency detection should override other intents if present
  const emergencyDetected = messageHasEmergency(normalized);
  if (emergencyDetected) {
    scores["emergency"] += 5;
  }

  // Symptom combination boosts: e.g. fever + cough + breathing -> respiratory (boost disease)
  try {
    const combos = detectSymptomCombinations(message);
    if (combos.includes("respiratory")) {
      scores["disease"] += 2.2; // significant boost toward disease/respiratory
    }
    if (combos.includes("cardiac")) {
      scores["emergency"] += 3.5; // cardiac combos should increase emergency likelihood
    }
    if (combos.includes("orthopedic")) {
      scores["surgery-plan"] += 1.6; // suggest surgery planning may be relevant
    }
  } catch {
    // non-fatal if combination detection fails
  }

  if (lastIntent && lastIntent !== "unknown" && looksLikeFollowUpQuestion(normalized)) {
    scores[lastIntent] += 0.7;
  }

  const sortableIntents = KNOWN_INTENTS.filter((intent) => intent !== "unknown");
  const rankedIntents = sortableIntents.sort((a, b) => scores[b] - scores[a]);
  const topScore = scores[rankedIntents[0]];

  // Intents with score >= 1.5 are considered candidates
  const candidateIntents = rankedIntents.filter((intent) => scores[intent] >= 1.5);
  const intents: AssistantIntent[] = candidateIntents.length > 0 ? candidateIntents : ["unknown"];

  // Compute confidence per intent (scaled)
  const intentConfidences: Record<AssistantIntent, number> = Object.keys(scores).reduce((acc, k) => {
    const key = k as AssistantIntent;
    acc[key] = Math.min(scores[key] / 5, 1);
    return acc;
  }, {} as Record<AssistantIntent, number>);

  // Emergency overrides everything if detected
  let primaryIntent: AssistantIntent;
  if (emergencyDetected) {
    primaryIntent = "emergency";
  } else if (topScore >= 1.5) {
    primaryIntent = rankedIntents[0];
  } else if (lastIntent && lastIntent !== "unknown" && looksLikeFollowUpQuestion(normalized)) {
    primaryIntent = lastIntent;
  } else {
    primaryIntent = "unknown";
  }

  const primaryConfidence = intentConfidences[primaryIntent] ?? 0;

  return {
    primaryIntent,
    primaryConfidence,
    intents,
    scores,
    intentConfidences,
  };
}
