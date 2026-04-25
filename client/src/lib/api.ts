import { getToken } from "@/lib/auth";

type ApiErrorPayload = {
  message?: string;
  details?: unknown;
};

export class ApiError extends Error {
  readonly status?: number;
  readonly details?: unknown;

  constructor(message: string, status?: number, details?: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.details = details;
  }
}

type TrainingResponse = {
  message?: string;
  data?: unknown;
};

const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL ?? "/api";

async function parseErrorResponse(response: Response): Promise<ApiError> {
  let payload: ApiErrorPayload = {};

  try {
    payload = (await response.json()) as ApiErrorPayload;
  } catch {
    payload = {};
  }

  return new ApiError(payload.message ?? `Request failed with status ${response.status}`, response.status, payload.details);
}

async function requestTraining(path: string): Promise<string> {
  const token = getToken();
  const response = await fetch(`${baseUrl}/${path.replace(/^\//, "")}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({}),
    cache: "no-store",
  });

  if (!response.ok) {
    throw await parseErrorResponse(response);
  }

  const payload = (await response.json()) as TrainingResponse;
  return payload.message ?? "Request completed successfully.";
}

export const modelApi = {
  trainWaitTimeModel: () => requestTraining("predictions/train"),
  reloadWaitTimeModel: () => requestTraining("predictions/reload"),
  trainNoShowModel: () => requestTraining("predictions/train/no-show"),
  trainPriceModel: () => requestTraining("predictions/train/price"),
  trainBedModel: () => requestTraining("predictions/train/bed"),
  trainDiseaseModel: () => requestTraining("predictions/train/disease"),
};
