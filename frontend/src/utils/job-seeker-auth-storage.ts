const ACCESS_TOKEN_KEY = "aslijobs_jobseeker_access_token";
const REFRESH_TOKEN_KEY = "aslijobs_jobseeker_refresh_token";

export type JobSeekerAuthSession = {
  accessToken: string;
  refreshToken: string;
};

export function getJobSeekerAccessToken(): string | null {
  if (typeof window === "undefined") {
    return null;
  }

  return window.localStorage.getItem(ACCESS_TOKEN_KEY);
}

export function getJobSeekerRefreshToken(): string | null {
  if (typeof window === "undefined") {
    return null;
  }

  return window.localStorage.getItem(REFRESH_TOKEN_KEY);
}

export function setJobSeekerAuthSession(session: JobSeekerAuthSession): void {
  window.localStorage.setItem(ACCESS_TOKEN_KEY, session.accessToken);
  window.localStorage.setItem(REFRESH_TOKEN_KEY, session.refreshToken);
}

export function clearJobSeekerAuthSession(): void {
  window.localStorage.removeItem(ACCESS_TOKEN_KEY);
  window.localStorage.removeItem(REFRESH_TOKEN_KEY);
}
