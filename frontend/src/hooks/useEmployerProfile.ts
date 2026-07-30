"use client";

import {
  employerProfileQueryKey,
  fetchAuthenticatedEmployer,
  type EmployerLoginPublic,
} from "@/services/employer-login.service";
import {
  useQuery,
  type QueryClient,
  type UseQueryOptions,
  type UseQueryResult,
} from "@tanstack/react-query";

/** Profile data changes rarely; share one cache across the employer workspace. */
export const EMPLOYER_PROFILE_STALE_TIME_MS = 5 * 60_000;
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
  refetchOnWindowFocus: false,
  refetchOnReconnect: false,
  refetchOnMount: false,
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
  return useQuery({
    ...employerProfileQueryOptions,
    ...options,
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
