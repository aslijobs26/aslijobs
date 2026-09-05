import { apiClient } from "./api-client";
import type { OperationsDepartment } from "../types/operations-team";

const BASE = "/operations/departments";

export async function fetchOperationsDepartments(params?: {
  search?: string;
  status?: "active" | "archived" | "all";
}): Promise<{ departments: OperationsDepartment[] }> {
  const response = await apiClient.get<{
    data: { departments: OperationsDepartment[] };
  }>(BASE, {
    params: {
      search: params?.search || undefined,
      status: params?.status || "active",
    },
  });
  return response.data.data;
}

export async function createOperationsDepartment(input: {
  name: string;
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
  input: { name?: string; description?: string; status?: "active" | "archived" },
): Promise<OperationsDepartment> {
  const response = await apiClient.patch<{ data: OperationsDepartment }>(
    `${BASE}/${encodeURIComponent(departmentId)}`,
    input,
  );
  return response.data.data;
}
