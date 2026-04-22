import { AppError } from "../utils/app-error.js";
import { loadNamedArtifact } from "./model-store.js";
import type { PriceBucket, PriceModel } from "./types.js";

let cached: PriceModel | null = null;
const USD_TO_INR = 83;

const getModel = async (): Promise<PriceModel> => {
  if (cached) return cached;
  try {
    cached = await loadNamedArtifact<PriceModel>("price");
    return cached;
  } catch {
    throw new AppError("Price model not trained yet. POST /predictions/train/price first.", 400);
  }
};

export const reloadPriceModel = (): void => {
  cached = null;
};

const normalize = (s: string): string =>
  s.toLowerCase().replace(/[^a-z0-9]/g, " ").replace(/\s+/g, " ").trim();

const toInrBucket = (bucket: PriceBucket): PriceBucket => ({
  ...bucket,
  min: Math.round(bucket.min * USD_TO_INR),
  max: Math.round(bucket.max * USD_TO_INR),
  avg: Math.round(bucket.avg * USD_TO_INR),
  median: Math.round(bucket.median * USD_TO_INR),
});

/**
 * Fuzzy-match: find best matching procedure from model.
 * Tries exact match first, then substring match, then word overlap.
 */
const findProcedure = (model: PriceModel, query: string): PriceBucket | null => {
  const key = normalize(query);

  // Exact match
  if (model.byProcedure[key]) return model.byProcedure[key];

  // Substring match
  for (const [k, bucket] of Object.entries(model.byProcedure)) {
    if (k.includes(key) || key.includes(k)) return bucket;
  }

  // Word overlap
  const queryWords = key.split(" ").filter(Boolean);
  let bestMatch: PriceBucket | null = null;
  let bestScore = 0;

  for (const [k, bucket] of Object.entries(model.byProcedure)) {
    const procWords = k.split(" ").filter(Boolean);
    const overlap = queryWords.filter((w) => procWords.some((pw) => pw.includes(w) || w.includes(pw))).length;
    const score = overlap / Math.max(queryWords.length, 1);
    if (score > bestScore && score >= 0.3) {
      bestScore = score;
      bestMatch = bucket;
    }
  }

  return bestMatch;
};

export const estimatePrice = async (input: {
  procedure: string;
  condition?: string;
}): Promise<PriceBucket> => {
  const model = await getModel();
  const modelCurrency = model.currency ?? "USD";

  // Try procedure first
  let match = findProcedure(model, input.procedure);

  // If no match on procedure, try condition
  if (!match && input.condition) {
    match = findProcedure(model, input.condition);
  }

  if (!match) {
    // Return global averages
    const allBuckets = Object.values(model.byProcedure);
    const allCosts = allBuckets.map((b) => b.avg).filter((c) => c > 0);
    const avg = allCosts.length > 0
      ? Math.round(allCosts.reduce((s, c) => s + c, 0) / allCosts.length)
      : 5000;

    const fallbackBucket: PriceBucket = {
      procedure: input.procedure,
      count: 0,
      min: Math.round(avg * 0.5),
      max: Math.round(avg * 2),
      avg,
      median: avg,
    };

    return modelCurrency === "INR" ? fallbackBucket : toInrBucket(fallbackBucket);
  }

  return modelCurrency === "INR" ? match : toInrBucket(match);
};
