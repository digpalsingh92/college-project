export type AssistantIntent =
  | "surgery-plan"
  | "price"
  | "wait-time"
  | "bed"
  | "disease"
  | "recommendations"
  | "unknown";

export type AssistantGender = "Male" | "Female";

export interface AssistantEntities {
  surgeryType?: string;
  age?: number;
  gender?: AssistantGender;
  symptoms?: string[];
}

export interface AssistantContext {
  lastIntent?: AssistantIntent;
  entities: AssistantEntities;
  updatedAt: number;
}

export interface AssistantResponse {
  intent: AssistantIntent;
  message: string;
  data: unknown;
  suggestions: string[];
}

export interface DetectedIntent {
  primaryIntent: AssistantIntent;
  intents: AssistantIntent[];
  scores: Record<AssistantIntent, number>;
  surgeryFirst: boolean;
}

export interface ParsedAssistantRequest {
  userId: string;
  message: string;
  authorization?: string;
}
