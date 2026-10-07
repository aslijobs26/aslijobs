import { isAxiosError } from "axios";

export type OperationsFieldErrors = Record<string, string>;

export const EXISTING_EMPLOYER_WHATSAPP_MESSAGE =
  "An employer with this WhatsApp number already exists.";
export const EXISTING_JOB_SEEKER_WHATSAPP_MESSAGE =
  "A job seeker with this WhatsApp number already exists.";

type ValidationErrorDetails = {
  code?: string;
  accountKind?: string;
  fieldErrors?: Record<string, string>;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function readApiMessage(error: unknown): string {
  if (!isAxiosError(error)) {
    return "";
  }
  const message = error.response?.data?.message;
  return typeof message === "string" ? message : "";
}

function readApiDetails(error: unknown): ValidationErrorDetails | null {
  if (!isAxiosError(error)) {
    return null;
  }
  const details = error.response?.data?.details;
  if (!isRecord(details)) {
    return null;
  }
  return details as ValidationErrorDetails;
}

export function existingWhatsappAccountMessage(error: unknown): string | null {
  const details = readApiDetails(error);
  const topMessage = readApiMessage(error);
  const fieldMessage =
    typeof details?.fieldErrors?.whatsappNumber === "string"
      ? details.fieldErrors.whatsappNumber
      : "";
  const haystack = `${details?.accountKind ?? ""} ${fieldMessage} ${topMessage}`;

  if (
    details?.accountKind === "job_seeker" ||
    /job seeker/i.test(haystack)
  ) {
    return EXISTING_JOB_SEEKER_WHATSAPP_MESSAGE;
  }

  if (
    details?.accountKind === "employer" ||
    /already registered with an Employer/i.test(haystack) ||
    topMessage === "Duplicate WhatsApp Number"
  ) {
    return EXISTING_EMPLOYER_WHATSAPP_MESSAGE;
  }

  return null;
}

export function getOperationsApiErrorMessage(
  error: unknown,
  fallback = "Something went wrong. Please try again.",
): string {
  const existingWhatsapp = existingWhatsappAccountMessage(error);
  if (existingWhatsapp) {
    return existingWhatsapp;
  }

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

  return fallback;
}

export function firstOperationsErrorMessage(
  errors: Record<string, string>,
  fallback: string,
): string {
  for (const value of Object.values(errors)) {
    const trimmed = value.trim();
    if (trimmed) {
      return trimmed;
    }
  }
  return fallback;
}

export function getOperationsApiFieldErrors(error: unknown): OperationsFieldErrors {
  if (!isAxiosError(error)) {
    return {};
  }

  const details = readApiDetails(error);
  if (!details?.fieldErrors || !isRecord(details.fieldErrors)) {
    return {};
  }

  const mapped: OperationsFieldErrors = {};
  for (const [key, value] of Object.entries(details.fieldErrors)) {
    if (typeof value === "string" && value.trim()) {
      mapped[key] = value;
    }
  }

  const existingWhatsapp = existingWhatsappAccountMessage(error);
  if (existingWhatsapp) {
    mapped.whatsappNumber = existingWhatsapp;
  }

  return mapped;
}
