"use client";

import {
  employerProfileQueryKey,
  fetchAuthenticatedEmployer,
  type EmployerLoginPublic,
} from "@/services/employer-login.service";
import { isEmployerAuthActive } from "@/utils/auth-realm";
import {
  useQuery,
  type QueryClient,
  type UseQueryOptions,
  type UseQueryResult,
} from "@tanstack/react-query";

/**
 * Profile changes infrequently, but verification can flip while a session is open.
 * Keep a short stale window and refetch on focus so Post Job / dashboard stay aligned
 * with the database (source of truth).
 */
export const EMPLOYER_PROFILE_STALE_TIME_MS = 30_000;
export const EMPLOYER_PROFILE_GC_TIME_MS = 30 * 60_000;

export async function fetchEmployerProfileQuery(): Promise<EmployerLoginPublic> {
  const { employer } = await fetchAuthenticatedEmployer();
  return employer;
}

export const employerProfileQueryOptions = {
  queryKey: employerProfileQueryKey,
  queryFn: fetchEmployerProfileQuery,
  staleTime: EMPLOYER_PROFILE_STALE_TIME_MS,
  gcTime: EMPLOYER_PROFILE_GC_TIME_MS,
  refetchOnWindowFocus: true,
  refetchOnReconnect: true,
  refetchOnMount: true,
} as const;

/**
 * Single shared employer profile query for navbar, sidebar, dashboard,
 * profile page, messages, and auth bootstrap.
 */
export function useEmployerProfile(
  options?: Pick<
    UseQueryOptions<EmployerLoginPublic, Error>,
    "enabled" | "select"
  >,
): UseQueryResult<EmployerLoginPublic, Error> {
  const hasAccessToken =
    typeof window !== "undefined" && isEmployerAuthActive();

  return useQuery({
    ...employerProfileQueryOptions,
    ...options,
    enabled: (options?.enabled ?? true) && hasAccessToken,
  });
}

/** Prefill / auth bootstrap — reuses the same cache key and freshness rules. */
export function ensureEmployerProfile(
  queryClient: QueryClient,
): Promise<EmployerLoginPublic> {
  return queryClient.ensureQueryData({
    queryKey: employerProfileQueryOptions.queryKey,
    queryFn: employerProfileQueryOptions.queryFn,
    staleTime: employerProfileQueryOptions.staleTime,
  });
}

/** Always bypass cache — used before job submit so DB verification wins. */
export function fetchFreshEmployerProfile(
  queryClient: QueryClient,
): Promise<EmployerLoginPublic> {
  return queryClient.fetchQuery({
    queryKey: employerProfileQueryOptions.queryKey,
    queryFn: employerProfileQueryOptions.queryFn,
    staleTime: 0,
  });
}
