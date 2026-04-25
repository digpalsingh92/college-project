import type { AssistantContext, AssistantEntities, AssistantIntent } from "@/services/assistant/types";

const DEFAULT_TTL_MS = 30 * 60 * 1000;
const contextStore = new Map<string, AssistantContext>();

function cleanupExpiredContext(now: number): void {
  for (const [key, value] of contextStore.entries()) {
    if (now - value.updatedAt > DEFAULT_TTL_MS) {
      contextStore.delete(key);
    }
  }
}

function mergeEntities(current: AssistantEntities, incoming: Partial<AssistantEntities>): AssistantEntities {
  return {
    surgeryType: incoming.surgeryType ?? current.surgeryType,
    age: incoming.age ?? current.age,
    gender: incoming.gender ?? current.gender,
    symptoms: incoming.symptoms && incoming.symptoms.length > 0 ? [...new Set(incoming.symptoms)] : current.symptoms,
  };
}

export function getContext(userId: string): AssistantContext {
  const now = Date.now();
  cleanupExpiredContext(now);

  const existing = contextStore.get(userId);
  if (existing) return existing;

  return {
    entities: {},
    updatedAt: now,
  };
}

export function updateContext(
  userId: string,
  data: {
    lastIntent?: AssistantIntent;
    entities?: Partial<AssistantEntities>;
  }
): AssistantContext {
  const now = Date.now();
  const existing = getContext(userId);

  const updated: AssistantContext = {
    lastIntent: data.lastIntent ?? existing.lastIntent,
    entities: data.entities ? mergeEntities(existing.entities, data.entities) : existing.entities,
    updatedAt: now,
  };

  contextStore.set(userId, updated);
  return updated;
}

export function clearContext(userId: string): void {
  contextStore.delete(userId);
}
