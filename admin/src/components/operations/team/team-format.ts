import { isAxiosError } from "axios";

export function getOperationsApiErrorMessage(
  error: unknown,
  fallback: string,
): string {
  if (isAxiosError(error)) {
    const data = error.response?.data;
    if (data && typeof data === "object" && "message" in data) {
      const message = (data as { message?: unknown }).message;
      if (typeof message === "string" && message.trim()) {
        return message.trim();
      }
    }
  }
  if (error instanceof Error && error.message.trim()) {
    return error.message.trim();
  }
  return fallback;
}

export function getOperationsApiErrorDetails(
  error: unknown,
): unknown | undefined {
  if (!isAxiosError(error)) {
    return undefined;
  }
  const data = error.response?.data;
  if (!data || typeof data !== "object" || !("details" in data)) {
    return undefined;
  }
  return (data as { details?: unknown }).details;
}

export function formatOperationsTimestamp(
  value: string | null | undefined,
): string {
  if (!value) {
    return "—";
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "—";
  }
  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}
