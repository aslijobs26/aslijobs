import { isAxiosError } from "axios";

/**
 * True only when the server explicitly rejected the session (unauthenticated).
 * Permission denials (403) must NOT clear the session — they surface as UX gates.
 */
export function isUnauthorizedAuthError(error: unknown): boolean {
  if (!isAxiosError(error)) {
    return false;
  }

  const status = error.response?.status;
  return status === 401;
}
