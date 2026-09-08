import { apiClient } from "./api-client";
import type {
  MarkRegistrationsSeenInput,
  OperationsNavBadgeCounts,
  OperationsNotificationListResult,
  OperationsRegistrationEntityType,
  OperationsRegistrationMetricsResult,
} from "../types/operations-registration-awareness";

const BASE = "/operations/registration-awareness";

export async function fetchOperationsRegistrationMetrics(): Promise<OperationsRegistrationMetricsResult> {
  const response = await apiClient.get<{
    data: OperationsRegistrationMetricsResult;
  }>(`${BASE}/metrics`);
  return response.data.data;
}

export async function fetchOperationsRegistrationBadges(): Promise<OperationsNavBadgeCounts> {
  const response = await apiClient.get<{ data: OperationsNavBadgeCounts }>(
    `${BASE}/badges`,
  );
  return response.data.data;
}

export async function markOperationsRegistrationSeen(
  entityType: OperationsRegistrationEntityType,
  entityId: string,
): Promise<void> {
  await apiClient.patch(
    `${BASE}/${encodeURIComponent(entityType)}/${encodeURIComponent(entityId)}/seen`,
  );
}

export async function markOperationsRegistrationsSeenBulk(
  payload: MarkRegistrationsSeenInput,
): Promise<void> {
  await apiClient.post(`${BASE}/mark-seen`, payload);
}

export async function fetchOperationsRegistrationNotifications(
  limit = 20,
): Promise<OperationsNotificationListResult> {
  const response = await apiClient.get<{
    data: OperationsNotificationListResult;
  }>(`${BASE}/notifications`, {
    params: { limit },
  });
  return response.data.data;
}

export async function markOperationsNotificationRead(
  notificationId: string,
): Promise<void> {
  await apiClient.patch(
    `${BASE}/notifications/${encodeURIComponent(notificationId)}/read`,
  );
}
