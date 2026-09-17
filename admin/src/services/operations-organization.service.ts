import { apiClient } from "./api-client";
import type {
  CreateOperationsOrgUnitInput,
  OperationsOrgOverviewResponse,
  OperationsOrgPeopleResponse,
  OperationsOrgTreeResponse,
  OperationsOrgUnitPublic,
  UpdateOperationsOrgUnitInput,
} from "../types/operations-organization";

const BASE = "/operations/organization";

export async function fetchOperationsOrgTree(params?: {
  search?: string;
  status?: "active" | "archived" | "all";
  scopeId?: string;
}): Promise<OperationsOrgTreeResponse> {
  const response = await apiClient.get<{ data: OperationsOrgTreeResponse }>(
    `${BASE}/tree`,
    {
      params: {
        search: params?.search || undefined,
        status: params?.status || "active",
        scopeId: params?.scopeId || undefined,
      },
    },
  );
  return response.data.data;
}

export async function fetchOperationsOrgUnit(
  unitId: string,
): Promise<OperationsOrgUnitPublic> {
  const response = await apiClient.get<{ data: OperationsOrgUnitPublic }>(
    `${BASE}/${encodeURIComponent(unitId)}`,
  );
  return response.data.data;
}

export async function fetchOperationsOrgOverview(
  unitId: string,
): Promise<OperationsOrgOverviewResponse> {
  const response = await apiClient.get<{ data: OperationsOrgOverviewResponse }>(
    `${BASE}/${encodeURIComponent(unitId)}/overview`,
  );
  return response.data.data;
}

export async function fetchOperationsOrgPeople(
  unitId: string,
  params?: {
    page?: number;
    limit?: number;
    search?: string;
    status?: "active" | "inactive" | "suspended" | "all";
  },
): Promise<OperationsOrgPeopleResponse> {
  const response = await apiClient.get<{ data: OperationsOrgPeopleResponse }>(
    `${BASE}/${encodeURIComponent(unitId)}/people`,
    {
      params: {
        page: params?.page ?? 1,
        limit: params?.limit ?? 20,
        search: params?.search || undefined,
        status: params?.status || "active",
      },
    },
  );
  return response.data.data;
}

export async function createOperationsOrgUnit(
  input: CreateOperationsOrgUnitInput,
): Promise<OperationsOrgUnitPublic> {
  const response = await apiClient.post<{ data: OperationsOrgUnitPublic }>(
    BASE,
    input,
  );
  return response.data.data;
}

export async function createOperationsOrgSubUnit(
  parentId: string,
  input: Omit<CreateOperationsOrgUnitInput, "parentId">,
): Promise<OperationsOrgUnitPublic> {
  const response = await apiClient.post<{ data: OperationsOrgUnitPublic }>(
    `${BASE}/${encodeURIComponent(parentId)}/sub-units`,
    input,
  );
  return response.data.data;
}

export async function updateOperationsOrgUnit(
  unitId: string,
  input: UpdateOperationsOrgUnitInput,
): Promise<OperationsOrgUnitPublic> {
  const response = await apiClient.patch<{ data: OperationsOrgUnitPublic }>(
    `${BASE}/${encodeURIComponent(unitId)}`,
    input,
  );
  return response.data.data;
}
