type CachedValue<T> = {
  value: T;
  expiresAt: number;
};

const recommendationCache = new Map<string, CachedValue<unknown>>();
const CACHE_TTL_MS = 30_000;

export const getCachedRecommendation = <T>(key: string): T | null => {
  const cached = recommendationCache.get(key);
  if (!cached) {
    return null;
  }

  if (cached.expiresAt < Date.now()) {
    recommendationCache.delete(key);
    return null;
  }

  return cached.value as T;
};

export const setCachedRecommendation = <T>(key: string, value: T): void => {
  recommendationCache.set(key, {
    value,
    expiresAt: Date.now() + CACHE_TTL_MS,
  });
};

export const invalidateDoctorRecommendationCache = (doctorId: string, date?: string): void => {
  const prefix = date ? `${doctorId}|${date}` : `${doctorId}|`;

  for (const key of recommendationCache.keys()) {
    if (key.startsWith(prefix)) {
      recommendationCache.delete(key);
    }
  }
};
