import axios, { AxiosError } from "axios";
import { getToken } from "@/lib/auth";

type TrainApiResponse = {
  message?: string;
};

const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_BASE_URL ?? "/api",
});

function getErrorMessage(error: unknown): string {
  if (error instanceof AxiosError) {
    const responseMessage = (error.response?.data as { message?: string } | undefined)?.message;
    if (responseMessage) return responseMessage;
    if (error.message) return error.message;
  }

  if (error instanceof Error && error.message) return error.message;
  return "Something went wrong. Please try again.";
}

async function postTrainingEndpoint(path: string): Promise<string> {
  try {
    const token = getToken();
    const response = await apiClient.post<TrainApiResponse>(
      path,
      {},
      {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      }
    );

    return response.data?.message ?? "Request completed successfully.";
  } catch (error) {
    throw new Error(getErrorMessage(error));
  }
}

export const aiModelApi = {
  trainWaitTimeModel: () => postTrainingEndpoint("predictions/train"),
  trainNoShowModel: () => postTrainingEndpoint("predictions/train/no-show"),
  trainPriceModel: () => postTrainingEndpoint("predictions/train/price"),
  trainBedModel: () => postTrainingEndpoint("predictions/train/bed"),
  trainDiseaseModel: () => postTrainingEndpoint("predictions/train/disease"),
  reloadWaitTimeModel: () => postTrainingEndpoint("predictions/reload"),
  reloadMainModel: () => postTrainingEndpoint("predictions/reload"),
};
