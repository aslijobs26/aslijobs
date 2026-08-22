import { isAxiosError } from "axios";

export function isOperationsSessionUnauthorized(error: unknown): boolean {
  if (!isAxiosError(error) || error.response?.status !== 401) {
    return false;
  }

  // A 401 during refresh/token rotation must not be treated as logged-out
  // when the underlying failure was a temporary outage.
  if (isOperationsSessionTransientError(error)) {
    return false;
  }

  return true;
}

/** Backend unreachable, proxy failure, timeout, or other temporary outage. */
export function isOperationsSessionTransientError(error: unknown): boolean {
  if (!isAxiosError(error)) {
    return false;
  }

  if (
    error.code === "ECONNABORTED" ||
    error.code === "ERR_NETWORK" ||
    error.message.toLowerCase().includes("network error")
  ) {
    return true;
  }

  if (!error.response) {
    return true;
  }

  const status = error.response.status;
  return status === 408 || status === 429 || (status >= 502 && status <= 504);
}

export function shouldClearSessionOnRefreshError(error: unknown): boolean {
  if (!isAxiosError(error)) {
    return true;
  }

  if (isOperationsSessionTransientError(error)) {
    return false;
  }

  const status = error.response?.status;
  return status === 401 || status === 403;
}
