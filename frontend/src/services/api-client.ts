import axios, {
  AxiosHeaders,
  type AxiosError,
  type InternalAxiosRequestConfig,
} from "axios";
import { env } from "@/constants/env";
import {
  clearEmployerAuthSession,
  getEmployerAccessToken,
  getEmployerRefreshToken,
  setEmployerAuthSession,
} from "@/utils/employer-auth-storage";
import {
  clearJobSeekerAuthSession,
  getJobSeekerAccessToken,
  getJobSeekerRefreshToken,
  setJobSeekerAuthSession,
} from "@/utils/job-seeker-auth-storage";

/**
 * Auth transport decision (intentionally deferred from httpOnly cookies):
 * - Dual principals (employer workspace + job seeker) share one SPA origin and
 *   path-based token selection; cookie realms would need careful path/name
 *   isolation and CSRF defenses for every mutating request.
 * - Current production path uses Bearer access + rotated refresh with
 *   single-flight renew, multi-tab storage sync, and server-side hash revoke.
 * - Migrating to httpOnly cookies is a dedicated cross-cutting project
 *   (CSRF tokens, SameSite, SSR cookie forwarding, admin CORS) — not a safe
 *   drop-in for this final hardening pass.
 */

type RetryConfig = InternalAxiosRequestConfig & {
  _retry?: boolean;
  _authRealm?: "employer" | "job-seeker";
};

type RefreshResponse = {
  success: true;
  data: {
    accessToken: string;
    refreshToken: string;
  };
};

export const apiClient = axios.create({
  baseURL: env.apiUrl,
  timeout: 30_000,
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true,
});

/** Bare client for refresh/logout — never attached to the auth interceptor. */
const refreshClient = axios.create({
  baseURL: env.apiUrl,
  timeout: 15_000,
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true,
});

let workspaceRefreshPromise: Promise<string | null> | null = null;
let jobSeekerRefreshPromise: Promise<string | null> | null = null;

function resolveAuthRealm(
  requestUrl: string,
  pathname: string,
): "employer" | "job-seeker" {
  const isNotificationsRequest = requestUrl.includes("/notifications");
  if (isNotificationsRequest) {
    return pathname.startsWith("/employer") ? "employer" : "job-seeker";
  }

  const isPublicJobsRequest = requestUrl.includes("/jobs/public");
  const isJobSeekerRequest =
    requestUrl.includes("/jobseekers") ||
    requestUrl.includes("/resumes") ||
    requestUrl.includes("/applications/apply") ||
    requestUrl.includes("/applications/me") ||
    isPublicJobsRequest;

  if (isPublicJobsRequest) {
    return getJobSeekerAccessToken() ? "job-seeker" : "employer";
  }

  return isJobSeekerRequest ? "job-seeker" : "employer";
}

function attachAccessToken(
  config: InternalAxiosRequestConfig,
  accessToken: string | null,
): void {
  if (!accessToken) {
    return;
  }
  const headers = AxiosHeaders.from(config.headers ?? {});
  headers.set("Authorization", `Bearer ${accessToken}`);
  config.headers = headers;
}

async function refreshWorkspaceAccessToken(): Promise<string | null> {
  if (workspaceRefreshPromise) {
    return workspaceRefreshPromise;
  }

  workspaceRefreshPromise = (async () => {
    const refreshToken = getEmployerRefreshToken();
    if (!refreshToken) {
      return null;
    }

    try {
      const response = await refreshClient.post<RefreshResponse>(
        "/auth/workspace/refresh",
        { refreshToken },
      );
      const next = response.data.data;
      setEmployerAuthSession({
        accessToken: next.accessToken,
        refreshToken: next.refreshToken,
      });
      return next.accessToken;
    } catch {
      clearEmployerAuthSession();
      return null;
    } finally {
      workspaceRefreshPromise = null;
    }
  })();

  return workspaceRefreshPromise;
}

async function refreshJobSeekerAccessToken(): Promise<string | null> {
  if (jobSeekerRefreshPromise) {
    return jobSeekerRefreshPromise;
  }

  jobSeekerRefreshPromise = (async () => {
    const refreshToken = getJobSeekerRefreshToken();
    if (!refreshToken) {
      return null;
    }

    try {
      const response = await refreshClient.post<RefreshResponse>(
        "/auth/job-seeker/refresh",
        { refreshToken },
      );
      const next = response.data.data;
      setJobSeekerAuthSession({
        accessToken: next.accessToken,
        refreshToken: next.refreshToken,
      });
      return next.accessToken;
    } catch {
      clearJobSeekerAuthSession();
      return null;
    } finally {
      jobSeekerRefreshPromise = null;
    }
  })();

  return jobSeekerRefreshPromise;
}

apiClient.interceptors.request.use((config) => {
  const requestUrl = config.url ?? "";
  const pathname =
    typeof window !== "undefined" ? window.location.pathname : "";
  const realm = resolveAuthRealm(requestUrl, pathname);
  (config as RetryConfig)._authRealm = realm;

  const accessToken =
    realm === "job-seeker"
      ? getJobSeekerAccessToken() ||
        (requestUrl.includes("/notifications")
          ? getEmployerAccessToken()
          : null)
      : getEmployerAccessToken();

  attachAccessToken(config, accessToken);
  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const original = error.config as RetryConfig | undefined;
    const status = error.response?.status;
    const requestUrl = original?.url ?? "";

    if (
      !original ||
      status !== 401 ||
      original._retry ||
      requestUrl.includes("/auth/") ||
      requestUrl.includes("/login/")
    ) {
      return Promise.reject(error);
    }

    original._retry = true;
    const realm =
      original._authRealm ??
      resolveAuthRealm(
        requestUrl,
        typeof window !== "undefined" ? window.location.pathname : "",
      );

    const nextAccessToken =
      realm === "job-seeker"
        ? await refreshJobSeekerAccessToken()
        : await refreshWorkspaceAccessToken();

    if (!nextAccessToken) {
      return Promise.reject(error);
    }

    attachAccessToken(original, nextAccessToken);
    return apiClient.request(original);
  },
);

/**
 * Multi-tab sync: when another tab rotates or clears tokens, keep this tab
 * aligned without forcing a full page reload.
 */
if (typeof window !== "undefined") {
  window.addEventListener("storage", (event) => {
    if (
      event.key === "aslijobs_employer_access_token" ||
      event.key === "aslijobs_employer_refresh_token"
    ) {
      window.dispatchEvent(new Event("aslijobs:employer-auth-change"));
    }
    if (
      event.key === "aslijobs_jobseeker_access_token" ||
      event.key === "aslijobs_jobseeker_refresh_token"
    ) {
      window.dispatchEvent(new Event("aslijobs:jobseeker-auth-change"));
    }
  });
}

export async function logoutWorkspaceServerSession(): Promise<void> {
  const refreshToken = getEmployerRefreshToken();
  try {
    await refreshClient.post("/auth/workspace/logout", { refreshToken });
  } catch {
    // Client cleanup still proceeds.
  }
}

export async function logoutJobSeekerServerSession(): Promise<void> {
  const refreshToken = getJobSeekerRefreshToken();
  try {
    await refreshClient.post("/auth/job-seeker/logout", { refreshToken });
  } catch {
    // Client cleanup still proceeds.
  }
}
