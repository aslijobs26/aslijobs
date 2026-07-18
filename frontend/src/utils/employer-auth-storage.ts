const ACCESS_TOKEN_KEY = "aslijobs_employer_access_token";
const REFRESH_TOKEN_KEY = "aslijobs_employer_refresh_token";

export type EmployerAuthSession = {
  accessToken: string;
  refreshToken: string;
};

export function getEmployerAccessToken(): string | null {
  if (typeof window === "undefined") {
    return null;
  }

  return window.localStorage.getItem(ACCESS_TOKEN_KEY);
}

export function getEmployerRefreshToken(): string | null {
  if (typeof window === "undefined") {
    return null;
  }

  return window.localStorage.getItem(REFRESH_TOKEN_KEY);
}

export function setEmployerAuthSession(session: EmployerAuthSession): void {
  window.localStorage.setItem(ACCESS_TOKEN_KEY, session.accessToken);
  window.localStorage.setItem(REFRESH_TOKEN_KEY, session.refreshToken);
}

export function clearEmployerAuthSession(): void {
  window.localStorage.removeItem(ACCESS_TOKEN_KEY);
  window.localStorage.removeItem(REFRESH_TOKEN_KEY);
}
