import { isAxiosError } from "axios";

/**
 * True only when the server explicitly rejected the session.
 * Network failures, 429, and 5xx must NOT be treated as logout signals.
 */
export function isUnauthorizedAuthError(error: unknown): boolean {
  if (!isAxiosError(error)) {
    return false;
  }

  const status = error.response?.status;
  return status === 401 || status === 403;
}
