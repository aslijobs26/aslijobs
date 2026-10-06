import { isAxiosError } from "axios";

export type OperationsFieldErrors = Record<string, string>;

type ValidationErrorDetails = {
  code?: string;
  fieldErrors?: Record<string, string>;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

export function getOperationsApiErrorMessage(error: unknown): string {
  if (isAxiosError(error)) {
    const message = error.response?.data?.message;
    if (typeof message === "string" && message.trim()) {
      return message;
    }
    if (error.code === "ERR_NETWORK" || error.message === "Network Error") {
      return "Unable to connect to the server. Please check your connection and try again.";
    }
  }

  if (error instanceof Error && error.message.trim()) {
    return error.message;
  }

  return "Something went wrong. Please try again.";
}

export function getOperationsApiFieldErrors(error: unknown): OperationsFieldErrors {
  if (!isAxiosError(error)) {
    return {};
  }

  const details = error.response?.data?.details;
  if (!isRecord(details)) {
    return {};
  }

  const payload = details as ValidationErrorDetails;
  if (!payload.fieldErrors || !isRecord(payload.fieldErrors)) {
    return {};
  }

  const mapped: OperationsFieldErrors = {};
  for (const [key, value] of Object.entries(payload.fieldErrors)) {
    if (typeof value === "string" && value.trim()) {
      mapped[key] = value;
    }
  }

  const whatsappMessage = mapped.whatsappNumber;
  if (
    whatsappMessage?.includes("already registered with an Employer") ||
    error.response?.data?.message === "Duplicate WhatsApp Number"
  ) {
    mapped.whatsappNumber =
      "An employer with this WhatsApp number already exists.";
  }

  return mapped;
}
