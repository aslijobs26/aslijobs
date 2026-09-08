import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { useEffect } from "react";
import {
  fetchOperationsRegistrationBadges,
  fetchOperationsRegistrationMetrics,
  fetchOperationsRegistrationNotifications,
  markOperationsNotificationRead,
  markOperationsRegistrationSeen,
  markOperationsRegistrationsSeenBulk,
} from "../services/operations-registration-awareness.service";
import type {
  MarkRegistrationsSeenInput,
  OperationsRegistrationEntityType,
} from "../types/operations-registration-awareness";
import { isOperationsSessionTransientError } from "../utils/operations-session-errors";

export const OPERATIONS_REGISTRATION_AWARENESS_QUERY_KEY = [
  "operations",
  "registration-awareness",
] as const;

export const OPERATIONS_REGISTRATION_METRICS_QUERY_KEY = [
  ...OPERATIONS_REGISTRATION_AWARENESS_QUERY_KEY,
  "metrics",
] as const;

export const OPERATIONS_REGISTRATION_BADGES_QUERY_KEY = [
  ...OPERATIONS_REGISTRATION_AWARENESS_QUERY_KEY,
  "badges",
] as const;

export const OPERATIONS_REGISTRATION_NOTIFICATIONS_QUERY_KEY = [
  ...OPERATIONS_REGISTRATION_AWARENESS_QUERY_KEY,
  "notifications",
] as const;

const POLL_INTERVAL_MS = 30_000;

function shouldRetry(failureCount: number, error: unknown): boolean {
  if (failureCount >= 3) {
    return false;
  }
  return isOperationsSessionTransientError(error);
}

function retryDelay(attemptIndex: number): number {
  return Math.min(1000 * 2 ** attemptIndex, 5000);
}

function invalidateRegistrationAwareness(
  queryClient: ReturnType<typeof useQueryClient>,
) {
  void queryClient.invalidateQueries({
    queryKey: OPERATIONS_REGISTRATION_AWARENESS_QUERY_KEY,
  });
}

export function useOperationsRegistrationMetrics(options?: {
  enabled?: boolean;
}) {
  return useQuery({
    queryKey: OPERATIONS_REGISTRATION_METRICS_QUERY_KEY,
    queryFn: fetchOperationsRegistrationMetrics,
    staleTime: 15_000,
    refetchInterval: POLL_INTERVAL_MS,
    refetchIntervalInBackground: false,
    refetchOnWindowFocus: true,
    retry: shouldRetry,
    retryDelay,
    enabled: options?.enabled ?? true,
  });
}

export function useOperationsRegistrationBadges(options?: {
  enabled?: boolean;
}) {
  return useQuery({
    queryKey: OPERATIONS_REGISTRATION_BADGES_QUERY_KEY,
    queryFn: fetchOperationsRegistrationBadges,
    staleTime: 15_000,
    refetchInterval: POLL_INTERVAL_MS,
    refetchIntervalInBackground: false,
    refetchOnWindowFocus: true,
    retry: shouldRetry,
    retryDelay,
    enabled: options?.enabled ?? true,
  });
}

export function useOperationsRegistrationNotifications(
  limit = 20,
  options?: { enabled?: boolean },
) {
  return useQuery({
    queryKey: [...OPERATIONS_REGISTRATION_NOTIFICATIONS_QUERY_KEY, limit],
    queryFn: () => fetchOperationsRegistrationNotifications(limit),
    staleTime: 15_000,
    refetchInterval: POLL_INTERVAL_MS,
    refetchIntervalInBackground: false,
    refetchOnWindowFocus: true,
    retry: shouldRetry,
    retryDelay,
    enabled: options?.enabled ?? true,
  });
}

export function useMarkOperationsRegistrationSeen() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      entityType,
      entityId,
    }: {
      entityType: OperationsRegistrationEntityType;
      entityId: string;
    }) => markOperationsRegistrationSeen(entityType, entityId),
    onSuccess: () => {
      invalidateRegistrationAwareness(queryClient);
    },
  });
}

export function useMarkOperationsRegistrationsSeenBulk() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: MarkRegistrationsSeenInput) =>
      markOperationsRegistrationsSeenBulk(payload),
    onSuccess: () => {
      invalidateRegistrationAwareness(queryClient);
    },
  });
}

export function useMarkOperationsNotificationRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (notificationId: string) =>
      markOperationsNotificationRead(notificationId),
    onSuccess: () => {
      invalidateRegistrationAwareness(queryClient);
    },
  });
}

/** Invalidate badge/metrics caches after a detail view (backend marks seen). */
export function useInvalidateRegistrationAwarenessOnDetail(
  enabled: boolean,
) {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!enabled) {
      return;
    }
    invalidateRegistrationAwareness(queryClient);
  }, [enabled, queryClient]);
}
