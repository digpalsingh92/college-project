export type AssistantIntent =
  | "emergency"
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
  city?: string;
  department?: string;
  wardType?: string;
  severity?: "Low" | "Normal" | "High";
}

export interface AssistantContext {
  lastIntent?: AssistantIntent;
  entities: AssistantEntities;
  updatedAt: number;
}

export interface AssistantResponse {
  intent: AssistantIntent;
  primaryIntent?: AssistantIntent;
  message: string;
  data: unknown;
  suggestions: string[];
}

export interface DetectedIntent {
  primaryIntent: AssistantIntent;
  primaryConfidence: number;
  intents: AssistantIntent[];
  scores: Record<AssistantIntent, number>;
  intentConfidences: Record<AssistantIntent, number>;
}

export interface ParsedAssistantRequest {
  userId: string;
  message: string;
  authorization?: string;
}

// ── Medical Reasoning Layer ──

export type UrgencyLevel = 1 | 2 | 3 | 4 | 5;

export interface MedicalReasoning {
  /** 1 = informational, 5 = life-threatening */
  urgency: UrgencyLevel;
  /** If reasoning detected a more appropriate intent, override here */
  escalatedIntent?: AssistantIntent;
  /** Missing entities that would improve the response */
  missingEntities: string[];
  /** Should we ask a clarifying question first? */
  needsClarification: boolean;
  /** Clarification prompt if needed */
  clarificationPrompt?: string;
  /** Inferred department from surgery/symptoms */
  inferredDepartment?: string;
  /** Detected clinical patterns (e.g. "cardiac", "respiratory") */
  clinicalPatterns: string[];
  /** Reasoning trace for debugging */
  reasoning: string[];
}

// ── Response Planner Layer ──

export type BackendAction = {
  /** Unique key for this action */
  key: string;
  /** API endpoint path */
  endpoint: string;
  /** HTTP method */
  method: "GET" | "POST";
  /** Request body */
  body: Record<string, unknown>;
  /** Is this the primary action or supplementary? */
  priority: "primary" | "supplementary";
  /** Should failure of this action fail the whole response? */
  critical: boolean;
  /** Human-readable label for this data fetch */
  label: string;
};

export type ResponseTone = "urgent" | "informative" | "empathetic" | "friendly";

export interface ActionPlan {
  /** Ordered list of backend calls to make */
  actions: BackendAction[];
  /** The tone to use in the final response */
  tone: ResponseTone;
  /** Should we ask for clarification before calling backends? */
  askFirst: boolean;
  /** The clarification message if askFirst is true */
  clarificationMessage?: string;
  /** Suggested follow-ups after this response */
  followUps: string[];
  /** Planning reasoning trace */
  planTrace: string[];
}

// ── Backend Orchestration Results ──

export interface BackendResult {
  key: string;
  label: string;
  ok: boolean;
  status: number;
  data: unknown;
  priority: "primary" | "supplementary";
}

// ── Formatter Output ──

export interface FormattedResponse {
  message: string;
  sections: FormattedSection[];
  suggestions: string[];
}

export interface FormattedSection {
  title: string;
  content: string;
  type: "text" | "metric" | "warning" | "info";
}
