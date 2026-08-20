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

} from "../utils/operations-auth-storage";

import type {

  OperationsLoginInput,

  OperationsLoginResponse,

  OperationsSessionResponse,

} from "../types/operations-auth";



const OPERATIONS_AUTH_BASE = "/operations/auth";



export async function loginOperationsTeam(

  input: OperationsLoginInput,

): Promise<OperationsLoginResponse> {

  if (env.useDevOperationsAuth) {

    return loginDevOperationsTeam(input);

  }



  const response = await apiClient.post<{ data: OperationsLoginResponse }>(

    `${OPERATIONS_AUTH_BASE}/login`,

    input,

  );

  return response.data.data;

}



export async function fetchOperationsSession(): Promise<OperationsSessionResponse> {

  if (env.useDevOperationsAuth) {

    const accessToken = getOperationsAccessToken();

    const user = getOperationsAuthUser();



    if (!accessToken || !user || !isDevOperationsAccessToken(accessToken)) {

      throw new Error("Invalid or expired session.");

    }



    return fetchDevOperationsSession(user);

  }



  const response = await apiClient.get<{ data: OperationsSessionResponse }>(

    `${OPERATIONS_AUTH_BASE}/session`,

  );

  return response.data.data;

}



export async function refreshOperationsSession(

  refreshToken: string,

): Promise<OperationsLoginResponse> {

  const response = await apiClient.post<{ data: OperationsLoginResponse }>(

    `${OPERATIONS_AUTH_BASE}/refresh`,

    { refreshToken },

  );

  return response.data.data;

}



export async function logoutOperationsTeam(): Promise<void> {

  if (env.useDevOperationsAuth) {

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


