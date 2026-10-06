import axios, { isAxiosError } from "axios";

const CANCEL_ERROR_NAMES = new Set([
  "AbortError",
  "CanceledError",
  "CancelledError",
]);

export function isRequestCancellationError(error: unknown): boolean {
  if (error == null) {
    return false;
  }

  if (axios.isCancel(error)) {
    return true;
  }

  if (isAxiosError(error) && error.code === "ERR_CANCELED") {
    return true;
  }

  if (typeof DOMException !== "undefined" && error instanceof DOMException) {
    return CANCEL_ERROR_NAMES.has(error.name);
  }

  if (error instanceof Error) {
    return CANCEL_ERROR_NAMES.has(error.name);
  }

  return false;
}

export function isVisibleQueryError(isError: boolean, error: unknown): boolean {
  return isError && !isRequestCancellationError(error);
}

export function shouldRetryQuery(failureCount: number, error: unknown): boolean {
  if (isRequestCancellationError(error)) {
    return false;
  }

  if (isAxiosError(error)) {
    const status = error.response?.status;
    if (
      status === 401 ||
      status === 403 ||
      status === 404 ||
      status === 429
    ) {
      return false;
    }
  }

  return failureCount < 1;
}

export function normalizeAbortedRequestError(
  error: unknown,
  signal?: AbortSignal,
): unknown {
  if (signal?.aborted || isRequestCancellationError(error)) {
    if (typeof DOMException !== "undefined") {
      return new DOMException("Aborted", "AbortError");
    }
    const abortError = new Error("Aborted");
    abortError.name = "AbortError";
    return abortError;
  }

  return error;
}
