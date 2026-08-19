"use client";

import { fetchAuthenticatedJobSeeker } from "@/services/job-seeker-login.service";
import type { JobSeekerPublic } from "@/types/job-seeker";
import { isJobSeekerAuthActive } from "@/utils/auth-realm";
import {
  useQuery,
  type QueryClient,
  type UseQueryOptions,
  type UseQueryResult,
} from "@tanstack/react-query";

export const JOB_SEEKER_PROFILE_QUERY_KEY = ["job-seeker", "me"] as const;

export const JOB_SEEKER_PROFILE_STALE_TIME_MS = 5 * 60_000;
export const JOB_SEEKER_PROFILE_GC_TIME_MS = 30 * 60_000;

export async function fetchJobSeekerProfileQuery(): Promise<JobSeekerPublic> {
  const { jobSeeker } = await fetchAuthenticatedJobSeeker();
  return jobSeeker;
}

export const jobSeekerProfileQueryOptions = {
  queryKey: JOB_SEEKER_PROFILE_QUERY_KEY,
  queryFn: fetchJobSeekerProfileQuery,
  staleTime: JOB_SEEKER_PROFILE_STALE_TIME_MS,
  gcTime: JOB_SEEKER_PROFILE_GC_TIME_MS,
  refetchOnWindowFocus: false,
  refetchOnReconnect: false,
  refetchOnMount: false,
} as const;

export function useJobSeekerProfile(
  options?: Pick<
    UseQueryOptions<JobSeekerPublic, Error>,
    "enabled" | "select"
  >,
): UseQueryResult<JobSeekerPublic, Error> {
  const hasAccessToken =
    typeof window !== "undefined" && isJobSeekerAuthActive();

  return useQuery({
    ...jobSeekerProfileQueryOptions,
    ...options,
    enabled: (options?.enabled ?? true) && hasAccessToken,
  });
}

export function ensureJobSeekerProfile(
  queryClient: QueryClient,
): Promise<JobSeekerPublic> {
  return queryClient.ensureQueryData({
    queryKey: jobSeekerProfileQueryOptions.queryKey,
    queryFn: jobSeekerProfileQueryOptions.queryFn,
    staleTime: jobSeekerProfileQueryOptions.staleTime,
  });
}
