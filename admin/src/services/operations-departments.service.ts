import { apiClient } from "./api-client";
import type {
  OperationsDepartment,
  OperationsDepartmentListParams,
  OperationsDepartmentListResult,
  OperationsDepartmentMetrics,
} from "../types/operations-team";

const BASE = "/operations/departments";

export type OperationsDepartmentDependencies = {
  activeMembers: number;
  scopedRoles: number;
  openWorkItems: number;
  activeTeams?: number;
};

export type OperationsDepartmentDependenciesResponse = {
  department: {
    id: string;
    name: string;
    status: string;
  };
  code: "DEPARTMENT_HAS_DEPENDENCIES";
  dependencies: OperationsDepartmentDependencies;
  blocking: boolean;
};

export async function fetchOperationsDepartments(
  params?: OperationsDepartmentListParams,
): Promise<OperationsDepartmentListResult> {
  const response = await apiClient.get<{
    data: OperationsDepartmentListResult;
  }>(BASE, {
    params: {
      page: params?.page ?? 1,
      limit: params?.limit ?? 100,
      search: params?.search || undefined,
      status: params?.status || "all",
    },
  });
  return response.data.data;
}

export async function fetchOperationsDepartmentMetrics(): Promise<OperationsDepartmentMetrics> {
  const response = await apiClient.get<{ data: OperationsDepartmentMetrics }>(
    `${BASE}/metrics`,
  );
  return response.data.data;
}

export async function fetchOperationsDepartment(
  departmentId: string,
): Promise<OperationsDepartment> {
  const response = await apiClient.get<{ data: OperationsDepartment }>(
    `${BASE}/${encodeURIComponent(departmentId)}`,
  );
  return response.data.data;
}

export async function fetchOperationsDepartmentDependencies(
  departmentId: string,
): Promise<OperationsDepartmentDependenciesResponse> {
  const response = await apiClient.get<{
    data: OperationsDepartmentDependenciesResponse;
  }>(`${BASE}/${encodeURIComponent(departmentId)}/dependencies`);
  return response.data.data;
}

export async function createOperationsDepartment(input: {
  name: string;
  code?: string;
  description?: string;
}): Promise<OperationsDepartment> {
  const response = await apiClient.post<{ data: OperationsDepartment }>(
    BASE,
    input,
  );
  return response.data.data;
}

export async function updateOperationsDepartment(
  departmentId: string,
  input: {
    name?: string;
    description?: string;
    status?: "active" | "archived";
    expectedRevision: number;
  },
): Promise<OperationsDepartment> {
  const response = await apiClient.patch<{ data: OperationsDepartment }>(
    `${BASE}/${encodeURIComponent(departmentId)}`,
    input,
  );
  return response.data.data;
}

export async function deleteOperationsDepartment(
  departmentId: string,
  expectedRevision: number,
): Promise<OperationsDepartment> {
  const response = await apiClient.delete<{ data: OperationsDepartment }>(
    `${BASE}/${encodeURIComponent(departmentId)}`,
    { data: { expectedRevision } },
  );
  return response.data.data;
}
