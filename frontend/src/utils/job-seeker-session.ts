import { JOB_SEEKER_PROFILE_QUERY_KEY } from "@/hooks/useJobSeekerProfile";
import {
  logoutJobSeekerServerSession,
  logoutWorkspaceServerSession,
} from "@/services/api-client";
import { clearEmployerAuthSession } from "@/utils/employer-auth-storage";
import {
  clearJobSeekerAuthSession,
  setJobSeekerAuthSession,
  type JobSeekerAuthSession,
} from "@/utils/job-seeker-auth-storage";
import type { JobSeekerPublic } from "@/types/job-seeker";
import type { QueryClient } from "@tanstack/react-query";

async function revokeEmployerSessionIfPresent(): Promise<void> {
  await logoutWorkspaceServerSession();
  clearEmployerAuthSession();
}

/**
 * Cancel in-flight requests and drop the entire React Query cache so a new
 * job seeker session never renders another account's cached data.
 */
export async function resetJobSeekerClientCache(
  queryClient: QueryClient,
): Promise<void> {
  await queryClient.cancelQueries();
  queryClient.clear();
}

/**
 * Full job seeker logout cleanup: revoke refresh server-side when possible,
 * stop pending requests, clear cached data, and remove auth tokens.
 */
export async function clearJobSeekerClientSession(
  queryClient: QueryClient,
): Promise<void> {
  await logoutJobSeekerServerSession();
  await resetJobSeekerClientCache(queryClient);
  clearJobSeekerAuthSession();
}

/**
 * Establish a new job seeker session after login/registration.
 * Clears any employer session and prior cache before writing tokens/profile.
 */
export async function establishJobSeekerClientSession(
  queryClient: QueryClient,
  input: JobSeekerAuthSession & {
    jobSeeker?: JobSeekerPublic;
  },
): Promise<void> {
  await revokeEmployerSessionIfPresent();
  await resetJobSeekerClientCache(queryClient);
  setJobSeekerAuthSession({
    accessToken: input.accessToken,
    refreshToken: input.refreshToken,
  });

  if (input.jobSeeker) {
    queryClient.setQueryData(JOB_SEEKER_PROFILE_QUERY_KEY, input.jobSeeker);
  }
}
