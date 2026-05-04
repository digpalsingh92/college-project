/**
 * Server-Side Conversation Context Store
 *
 * Per-user conversation state with TTL-based expiry.
 */

import type { AssistantIntent } from "./intent-classifier.js";
import type { ExtractedEntities } from "./entity-normalizer.js";

export interface ConversationContext {
  lastIntent?: AssistantIntent;
  entities: Partial<ExtractedEntities>;
  history: Array<{ role: "user" | "assistant"; message: string; timestamp: number }>;
  updatedAt: number;
}

const TTL_MS = 30 * 60 * 1000; // 30 minutes
const MAX_HISTORY = 10;
const store = new Map<string, ConversationContext>();

function cleanup(now: number): void {
  for (const [key, ctx] of store.entries()) {
    if (now - ctx.updatedAt > TTL_MS) store.delete(key);
  }
}

export function getContext(userId: string): ConversationContext {
  const now = Date.now();
  cleanup(now);
  return store.get(userId) ?? { entities: {}, history: [], updatedAt: now };
}

export function updateContext(
  userId: string,
  data: {
    lastIntent?: AssistantIntent;
    entities?: Partial<ExtractedEntities>;
    userMessage?: string;
    assistantMessage?: string;
  }
): void {
  const now = Date.now();
  const existing = getContext(userId);

  const merged: Partial<ExtractedEntities> = { ...existing.entities };
  if (data.entities) {
    for (const [k, v] of Object.entries(data.entities)) {
      if (v !== undefined) (merged as Record<string, unknown>)[k] = v;
    }
  }

  const history = [...existing.history];
  if (data.userMessage) {
    history.push({ role: "user", message: data.userMessage, timestamp: now });
  }
  if (data.assistantMessage) {
    history.push({ role: "assistant", message: data.assistantMessage, timestamp: now });
  }
  // Keep only last N entries
  while (history.length > MAX_HISTORY) history.shift();

  store.set(userId, {
    lastIntent: data.lastIntent ?? existing.lastIntent,
    entities: merged,
    history,
    updatedAt: now,
  });
}

export function clearContext(userId: string): void {
  store.delete(userId);
}
