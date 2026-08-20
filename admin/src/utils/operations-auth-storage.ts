import type { OperationsAuthUser } from "../types/operations-auth";



const ACCESS_TOKEN_KEY = "aslijobs_operations_access_token";

const REFRESH_TOKEN_KEY = "aslijobs_operations_refresh_token";

const USER_KEY = "aslijobs_operations_user";



export const OPERATIONS_AUTH_CHANGE_EVENT = "aslijobs:operations-auth-change";



export type OperationsAuthSession = {

  accessToken: string;

  refreshToken: string;

};



function notifyAuthChange(): void {

  if (typeof window === "undefined") {

    return;

  }



  window.dispatchEvent(new Event(OPERATIONS_AUTH_CHANGE_EVENT));

}



export function getOperationsAccessToken(): string | null {

  if (typeof window === "undefined") {

    return null;

  }



  return window.localStorage.getItem(ACCESS_TOKEN_KEY);

}



export function getOperationsRefreshToken(): string | null {

  if (typeof window === "undefined") {

    return null;

  }



  return window.localStorage.getItem(REFRESH_TOKEN_KEY);

}



export function getOperationsAuthUser(): OperationsAuthUser | null {

  if (typeof window === "undefined") {

    return null;

  }



  const raw = window.localStorage.getItem(USER_KEY);

  if (!raw) {

    return null;

  }



  try {

    return JSON.parse(raw) as OperationsAuthUser;

  } catch {

    return null;

  }

}



export function setOperationsAuthSession(session: OperationsAuthSession): void {

  window.localStorage.setItem(ACCESS_TOKEN_KEY, session.accessToken);

  window.localStorage.setItem(REFRESH_TOKEN_KEY, session.refreshToken);

  notifyAuthChange();

}



export function setOperationsAuthUser(user: OperationsAuthUser): void {

  window.localStorage.setItem(USER_KEY, JSON.stringify(user));

  notifyAuthChange();

}



export function clearOperationsAuthSession(): void {

  window.localStorage.removeItem(ACCESS_TOKEN_KEY);

  window.localStorage.removeItem(REFRESH_TOKEN_KEY);

  window.localStorage.removeItem(USER_KEY);

  notifyAuthChange();

}



export function hasOperationsAuthSession(): boolean {

  return Boolean(getOperationsAccessToken());

}


