import { useQuery } from "@tanstack/react-query";
import { fetchOperationsSession } from "../services/operations-auth.service";
import { getOperationsAuthUser, hasOperationsAuthSession } from "../utils/operations-auth-storage";
import { OPERATIONS_AUTH_QUERY_KEY } from "../utils/operations-session";

const SESSION_STALE_TIME_MS = 5 * 60_000;
const SESSION_GC_TIME_MS = 30 * 60_000;

type OperationsSessionQueryMode = "protected" | "guest";

interface UseOperationsSessionQueryOptions {
  mode: OperationsSessionQueryMode;
}

function readCachedSession() {
  const cachedUser = getOperationsAuthUser();
  return cachedUser ? { user: cachedUser } : undefined;
}

export function useOperationsSessionQuery({
  mode: _mode,
}: UseOperationsSessionQueryOptions) {
  const hasToken = hasOperationsAuthSession();
  const cachedSession = readCachedSession();

  return useQuery({
    queryKey: OPERATIONS_AUTH_QUERY_KEY,
    queryFn: fetchOperationsSession,
    enabled: hasToken,
    retry: false,
    staleTime: SESSION_STALE_TIME_MS,
    gcTime: SESSION_GC_TIME_MS,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchOnReconnect: false,
    initialData: cachedSession,
    initialDataUpdatedAt: cachedSession ? Date.now() : undefined,
  });
}

export function resolveOperationsSessionUser(
  sessionUser: { user: { id: string } } | undefined,
) {
  return sessionUser?.user ?? getOperationsAuthUser() ?? null;
}
