import { isAxiosError } from "axios";
import {
  fetchDevOperationsSession,
  isDevOperationsAccessToken,
  loginDevOperationsTeam,
  logoutDevOperationsTeam,
} from "../auth/dev/operations-auth.dev";
import { env } from "../constants/env";
import { apiClient } from "../services/api-client";
import {
  getOperationsAccessToken,
  getOperationsAuthUser,
  setOperationsAuthUser,
} from "../utils/operations-auth-storage";
import type {
  OperationsAuthUser,
  OperationsLoginInput,
  OperationsLoginResponse,
  OperationsSessionResponse,
} from "../types/operations-auth";

const OPERATIONS_AUTH_BASE = "/operations/auth";

type BackendAuthUser = {
  id: string;
  fullName: string;
  email?: string;
  mobileNumber?: string;
  role: OperationsAuthUser["role"];
};

type BackendLoginResponse = Omit<OperationsLoginResponse, "user"> & {
  user: BackendAuthUser;
};

type BackendSessionResponse = {
  user: BackendAuthUser;
};

function mapAuthUser(user: BackendAuthUser): OperationsAuthUser {
  return {
    id: user.id,
    fullName: user.fullName,
    email: user.email?.trim() || "",
    mobileNumber: user.mobileNumber,
    role: user.role,
  };
}

function mapLoginResponse(data: BackendLoginResponse): OperationsLoginResponse {
  return {
    ...data,
    user: mapAuthUser(data.user),
  };
}

export async function loginOperationsTeam(
  input: OperationsLoginInput,
): Promise<OperationsLoginResponse> {
  try {
    const response = await apiClient.post<{ data: BackendLoginResponse }>(
      `${OPERATIONS_AUTH_BASE}/login`,
      {
        email: input.email.trim().toLowerCase(),
        password: input.password,
      },
    );

    return mapLoginResponse(response.data.data);
  } catch (error) {
    if (env.useDevOperationsAuth) {
      return loginDevOperationsTeam(input);
    }

    throw error;
  }
}

export async function fetchOperationsSession(): Promise<OperationsSessionResponse> {
  const accessToken = getOperationsAccessToken();

  if (
    env.useDevOperationsAuth &&
    accessToken &&
    isDevOperationsAccessToken(accessToken)
  ) {
    const user = getOperationsAuthUser();
    if (!user) {
      throw new Error("Invalid or expired session.");
    }

    return fetchDevOperationsSession(user);
  }

  const response = await apiClient.get<{ data: BackendSessionResponse }>(
    `${OPERATIONS_AUTH_BASE}/session`,
  );

  const user = mapAuthUser(response.data.data.user);
  setOperationsAuthUser(user);

  return {
    user,
  };
}

export async function refreshOperationsSession(
  refreshToken: string,
): Promise<OperationsLoginResponse> {
  const response = await apiClient.post<{ data: BackendLoginResponse }>(
    `${OPERATIONS_AUTH_BASE}/refresh`,
    { refreshToken },
  );

  return mapLoginResponse(response.data.data);
}

export async function logoutOperationsTeam(): Promise<void> {
  const accessToken = getOperationsAccessToken();

  if (
    env.useDevOperationsAuth &&
    accessToken &&
    isDevOperationsAccessToken(accessToken)
  ) {
    await logoutDevOperationsTeam();
    return;
  }

  await apiClient.post(`${OPERATIONS_AUTH_BASE}/logout`);
}

export function getOperationsAuthErrorMessage(
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

    if (error.response?.status === 401) {
      return "Invalid email or password.";
    }

    if (error.response?.status === 429) {
      return "Too many login attempts. Please try again later.";
    }
  }

  if (error instanceof Error && error.message.trim()) {
    return error.message.trim();
  }

  return fallback;
}
