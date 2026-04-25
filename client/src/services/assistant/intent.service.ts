import { messageHasSurgeryTopic, normalizeText } from "@/services/assistant/entity.service";
import type { AssistantIntent, DetectedIntent } from "@/services/assistant/types";

const KNOWN_INTENTS: AssistantIntent[] = ["surgery-plan", "price", "wait-time", "bed", "disease", "recommendations", "unknown"];

const INTENT_KEYWORDS: Record<Exclude<AssistantIntent, "unknown">, Array<{ pattern: RegExp; weight: number }>> = {
  "surgery-plan": [
    { pattern: /\b(surgery|operation|procedure|replacement|recovery|recover|rehab|post-op|post operative)\b/, weight: 2.3 },
    { pattern: /\b(knee|hip|cataract|appendectomy|hernia|cardiac|bypass|angioplasty)\b/, weight: 2.5 },
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
    "surgery-plan": 0,
    price: 0,
    "wait-time": 0,
    bed: 0,
    disease: 0,
    recommendations: 0,
    unknown: 0,
  };
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

  const surgeryFirst = messageHasSurgeryTopic(normalized);
  if (surgeryFirst) {
    scores["surgery-plan"] += 3;
  }

  if (lastIntent && lastIntent !== "unknown") {
    scores[lastIntent] += 0.7;
  }

  const sortableIntents = KNOWN_INTENTS.filter((intent) => intent !== "unknown");
  const rankedIntents = sortableIntents.sort((a, b) => scores[b] - scores[a]);
  const topScore = scores[rankedIntents[0]];

  const candidateIntents = rankedIntents.filter((intent) => scores[intent] >= 1.5);
  const intents: AssistantIntent[] = candidateIntents.length > 0 ? candidateIntents : ["unknown"];

  const primaryIntent: AssistantIntent =
    surgeryFirst
      ? "surgery-plan"
      : topScore >= 1.5
        ? rankedIntents[0]
        : lastIntent && lastIntent !== "unknown"
          ? lastIntent
          : "unknown";

  return {
    primaryIntent,
    intents,
    scores,
    surgeryFirst,
  };
}
