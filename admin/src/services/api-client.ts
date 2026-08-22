import axios, {
  AxiosHeaders,
  type AxiosError,
  type InternalAxiosRequestConfig,
} from "axios";
import { isDevOperationsAccessToken } from "../auth/dev/operations-auth.dev";
import { env } from "../constants/env";
import {
  clearOperationsAuthSession,
  getOperationsAccessToken,
  getOperationsRefreshToken,
  setOperationsAuthSession,
} from "../utils/operations-auth-storage";
import {
  isOperationsSessionTransientError,
  shouldClearSessionOnRefreshError,
} from "../utils/operations-session-errors";

type RetryConfig = InternalAxiosRequestConfig & {
  _retry?: boolean;
};

export const apiClient = axios.create({
  baseURL: env.apiUrl,
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true,
  timeout: 30_000,
});

const refreshClient = axios.create({
  baseURL: env.apiUrl,
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true,
  timeout: 15_000,
});

let refreshPromise: Promise<string | null> | null = null;

async function refreshAccessToken(): Promise<string | null> {
  const refreshToken = getOperationsRefreshToken();
  if (!refreshToken) {
    clearOperationsAuthSession();
    return null;
  }

  if (env.useDevOperationsAuth && isDevOperationsAccessToken(refreshToken)) {
    return getOperationsAccessToken();
  }

  try {
    const response = await refreshClient.post<{
      data: {
        accessToken: string;
        refreshToken: string;
      };
    }>("/operations/auth/refresh", { refreshToken });

    const { accessToken, refreshToken: nextRefreshToken } = response.data.data;
    setOperationsAuthSession({
      accessToken,
      refreshToken: nextRefreshToken,
    });
    return accessToken;
  } catch (error) {
    if (shouldClearSessionOnRefreshError(error)) {
      clearOperationsAuthSession();
    }

    if (isOperationsSessionTransientError(error)) {
      throw error;
    }

    return null;
  }
}

apiClient.interceptors.request.use((config) => {
  const token = getOperationsAccessToken();
  if (token) {
    const headers = AxiosHeaders.from(config.headers);
    headers.set("Authorization", `Bearer ${token}`);
    config.headers = headers;
  }
  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as RetryConfig | undefined;
    const requestUrl = originalRequest?.url ?? "";

    if (
      !originalRequest ||
      originalRequest._retry ||
      error.response?.status !== 401 ||
      requestUrl.includes("/operations/auth/refresh")
    ) {
      return Promise.reject(error);
    }

    originalRequest._retry = true;

    if (!refreshPromise) {
      refreshPromise = refreshAccessToken().finally(() => {
        refreshPromise = null;
      });
    }

    try {
      const accessToken = await refreshPromise;
      if (!accessToken) {
        return Promise.reject(error);
      }

      const headers = AxiosHeaders.from(originalRequest.headers);
      headers.set("Authorization", `Bearer ${accessToken}`);
      originalRequest.headers = headers;

      return apiClient(originalRequest);
    } catch (refreshError) {
      return Promise.reject(refreshError);
    }
  },
);
