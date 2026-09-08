import { isAxiosError } from "axios";
import {
  AUTH_MESSAGE_FIELD_BINDINGS,
  AUTH_VALIDATION_MESSAGES,
  BACKEND_AUTH_MESSAGE_MAP,
} from "@/constants/auth-validation-messages";

export type NormalizedApiError = {
  message: string;
  fieldErrors: Record<string, string>;
  status: number | null;
  code: string | null;
};

type ApiErrorBody = {
  message?: unknown;
  details?: unknown;
  error?: unknown;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function readString(value: unknown): string | null {
  if (typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function looksTechnicalMessage(message: string): boolean {
  const normalized = message.toLowerCase();

  if (
    normalized.includes("mongo") ||
    normalized.includes("mongoose") ||
    normalized.includes("zoderror") ||
    normalized.includes("zod ") ||
    normalized.includes("econnrefused") ||
    normalized.includes("enotfound") ||
    normalized.includes("etimedout") ||
    normalized.includes("axioserror") ||
    normalized.includes("cast to objectid") ||
    normalized.includes("validationerror") ||
    normalized.includes("unexpected token") ||
    normalized.includes("syntaxerror") ||
    normalized.includes("typeerror") ||
    normalized.includes("referenceerror") ||
    normalized.includes("internal server error")
  ) {
    return true;
  }

  // Stack-trace shaped strings
  if (message.includes("\n") && /\bat\s+\S+/.test(message)) {
    return true;
  }

  if (/^[A-Z][A-Za-z0-9]+Error:/.test(message)) {
    return true;
  }

  return false;
}

function mapKnownBackendMessage(message: string): string {
  return BACKEND_AUTH_MESSAGE_MAP[message] ?? message;
}

function sanitizeUserMessage(message: string | null, fallback: string): string {
  if (!message) {
    return fallback;
  }

  const mapped = mapKnownBackendMessage(message);
  if (looksTechnicalMessage(mapped)) {
    return AUTH_VALIDATION_MESSAGES.SERVER_ERROR;
  }

  return mapped;
}

function readFieldErrors(details: unknown): Record<string, string> {
  if (!isRecord(details)) {
    return {};
  }

  const raw = details.fieldErrors;
  if (!isRecord(raw)) {
    return {};
  }

  const fieldErrors: Record<string, string> = {};

  for (const [key, value] of Object.entries(raw)) {
    const message = readString(value);
    if (message) {
      fieldErrors[key] = mapKnownBackendMessage(message);
    }
  }

  return fieldErrors;
}

function readErrorCode(details: unknown, body: ApiErrorBody): string | null {
  if (isRecord(details)) {
    const fromDetails = readString(details.code);
    if (fromDetails) {
      return fromDetails;
    }
  }

  if (isRecord(body.error)) {
    return readString(body.error.code);
  }

  return null;
}

/**
 * When the API returns a known account/conflict message without Zod fieldErrors,
 * bind it to the relevant input so auth forms surface it next to the field.
 */
function attachMessageFieldBindings(
  message: string,
  fieldErrors: Record<string, string>,
): Record<string, string> {
  const fieldName = AUTH_MESSAGE_FIELD_BINDINGS[message];
  if (!fieldName || fieldErrors[fieldName]) {
    return fieldErrors;
  }

  return {
    ...fieldErrors,
    [fieldName]: message,
  };
}

function readBodyMessage(body: unknown): string | null {
  if (typeof body === "string") {
    return readString(body);
  }

  if (!isRecord(body)) {
    return null;
  }

  const direct = readString(body.message);
  if (direct) {
    return direct;
  }

  if (isRecord(body.error)) {
    return readString(body.error.message);
  }

  return null;
}

/**
 * Normalizes Axios / unknown API failures into a stable shape for auth forms.
 */
export function normalizeApiError(error: unknown): NormalizedApiError {
  if (isAxiosError(error)) {
    const status = error.response?.status ?? null;

    if (!error.response) {
      return {
        message: AUTH_VALIDATION_MESSAGES.NETWORK_ERROR,
        fieldErrors: {},
        status: null,
        code: "NETWORK_ERROR",
      };
    }

    const body = (error.response.data ?? {}) as ApiErrorBody;
    const details = isRecord(body) ? body.details : undefined;
    const code = readErrorCode(details, body);
    const rawMessage = readBodyMessage(body);

    const fallback =
      status !== null && status >= 500
        ? AUTH_VALIDATION_MESSAGES.SERVER_ERROR
        : AUTH_VALIDATION_MESSAGES.GENERIC_SUBMIT_ERROR;

    const message = sanitizeUserMessage(rawMessage, fallback);
    const fieldErrors = attachMessageFieldBindings(
      message,
      readFieldErrors(details),
    );

    return {
      message,
      fieldErrors,
      status,
      code,
    };
  }

  if (error instanceof Error) {
    const message = sanitizeUserMessage(
      error.message,
      AUTH_VALIDATION_MESSAGES.GENERIC_SUBMIT_ERROR,
    );

    return {
      message,
      fieldErrors: attachMessageFieldBindings(message, {}),
      status: null,
      code: null,
    };
  }

  return {
    message: AUTH_VALIDATION_MESSAGES.GENERIC_SUBMIT_ERROR,
    fieldErrors: {},
    status: null,
    code: null,
  };
}

/** Convenience helper — message only (replaces local getErrorMessage helpers). */
export function getApiErrorMessage(
  error: unknown,
  fallback: string = AUTH_VALIDATION_MESSAGES.GENERIC_SUBMIT_ERROR,
): string {
  const normalized = normalizeApiError(error);

  if (normalized.code === "NETWORK_ERROR") {
    return normalized.message;
  }

  if (isAxiosError(error) && error.response) {
    const rawMessage = readBodyMessage(error.response.data);
    if (rawMessage) {
      return normalized.message;
    }

    if (Object.keys(normalized.fieldErrors).length > 0) {
      return normalized.message;
    }

    if ((error.response.status ?? 0) >= 500) {
      return AUTH_VALIDATION_MESSAGES.SERVER_ERROR;
    }

    return fallback;
  }

  if (error instanceof Error && error.message.trim()) {
    return normalized.message;
  }

  return fallback;
}
