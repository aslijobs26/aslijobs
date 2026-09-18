import { apiClient } from "./api-client";
import type { OperationsOrganizationSettings } from "../types/operations-ops-teams";

const BASE = "/operations/settings";

export async function fetchOperationsOrganizationSettings(): Promise<OperationsOrganizationSettings> {
  const response = await apiClient.get<{ data: OperationsOrganizationSettings }>(
    BASE,
  );
  return response.data.data;
}

export async function updateOperationsOrganizationSettings(input: {
  organizationName: string;
  defaultCountryId: string;
  defaultTimezone: string;
  expectedRevision: number;
}): Promise<OperationsOrganizationSettings> {
  const response = await apiClient.patch<{ data: OperationsOrganizationSettings }>(
    BASE,
    input,
  );
  return response.data.data;
}
