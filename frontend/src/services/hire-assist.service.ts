import { apiClient } from "@/services/api-client";
import type { HireAssistAssistanceValue } from "@/constants/hire-assist";
import axios from "axios";

export interface HireAssistSubmission {
  fullName: string;
  companyName: string;
  mobileNumber: string;
  email: string;
  designation: string;
  assistanceType: HireAssistAssistanceValue;
  message: string;
  clientRequestId: string;
}

export interface HireAssistSubmissionResult {
  ticketId: string;
  status: string;
  statusLabel: string;
  created: boolean;
}

export interface HireAssistFieldErrors {
  [field: string]: string;
}

export function readHireAssistError(error: unknown): {
  message: string;
  fieldErrors: HireAssistFieldErrors;
} {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data as
      | {
          message?: string;
          details?: { fieldErrors?: HireAssistFieldErrors };
        }
      | undefined;
    return {
      message:
        data?.message ||
        "We couldn't submit your request. Please try again.",
      fieldErrors: data?.details?.fieldErrors ?? {},
    };
  }

  return {
    message: "We couldn't submit your request. Please try again.",
    fieldErrors: {},
  };
}

export async function submitHireAssistRequest(
  body: HireAssistSubmission,
): Promise<HireAssistSubmissionResult> {
  const response = await apiClient.post<{
    data: HireAssistSubmissionResult;
  }>("/hire-assist", body);
  return response.data.data;
}
