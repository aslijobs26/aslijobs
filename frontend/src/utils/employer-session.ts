import {
  employerProfileQueryKey,
  type EmployerLoginPublic,
} from "@/services/employer-login.service";
import {
  logoutJobSeekerServerSession,
  logoutWorkspaceServerSession,
} from "@/services/api-client";
import {
  clearEmployerAuthSession,
  setEmployerAuthSession,
  type EmployerAuthSession,
} from "@/utils/employer-auth-storage";
import { clearJobSeekerAuthSession } from "@/utils/job-seeker-auth-storage";
import type { QueryClient } from "@tanstack/react-query";

async function revokeJobSeekerSessionIfPresent(): Promise<void> {
  await logoutJobSeekerServerSession();
  clearJobSeekerAuthSession();
}

/**
 * Cancel in-flight requests and drop the entire React Query cache.
 * Employer dashboard keys are not user-scoped, so any residual cache from a
 * previous employer must be removed before the next authenticated session.
 */
export async function resetEmployerClientCache(
  queryClient: QueryClient,
): Promise<void> {
  await queryClient.cancelQueries();
  queryClient.clear();
}

/**
 * Full employer logout cleanup: revoke refresh server-side when possible,
 * stop pending requests, clear cached employer data, and remove auth tokens.
 */
export async function clearEmployerClientSession(
  queryClient: QueryClient,
): Promise<void> {
  await logoutWorkspaceServerSession();
  await resetEmployerClientCache(queryClient);
  clearEmployerAuthSession();
}

/**
 * Establish a new employer session after login/registration.
 * Clears any previous employer's cache before writing tokens / profile so the
 * UI never renders another account's data — even for one frame.
 */
export async function establishEmployerClientSession(
  queryClient: QueryClient,
  input: EmployerAuthSession & {
    employer?: EmployerLoginPublic;
  },
): Promise<void> {
  await revokeJobSeekerSessionIfPresent();
  await resetEmployerClientCache(queryClient);
  setEmployerAuthSession({
    accessToken: input.accessToken,
    refreshToken: input.refreshToken,
  });

  if (input.employer) {
    queryClient.setQueryData(employerProfileQueryKey, input.employer);
  }
}
