import { RBAC_QUERY_KEYS } from "@/constants/employer-rbac";
import { EMPLOYER_TEAM_QUERY_KEYS } from "@/constants/employer-team-management";
import type { QueryClient } from "@tanstack/react-query";

/** Invalidate team data and live RBAC session after mutations. */
export async function invalidateEmployerAccessCaches(
  queryClient: QueryClient,
): Promise<void> {
  await Promise.all([
    queryClient.invalidateQueries({ queryKey: EMPLOYER_TEAM_QUERY_KEYS.all }),
    queryClient.invalidateQueries({ queryKey: RBAC_QUERY_KEYS.all }),
  ]);
}
