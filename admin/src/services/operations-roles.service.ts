import { apiClient } from "./api-client";
import type {
  CreateOperationsRoleInput,
  OperationsCatalogTreeNode,
  OperationsPermissionProjectionDefinition,
  OperationsRole,
  OperationsRoleDetail,
  OperationsRoleTreeNode,
} from "../types/operations-team";

const BASE = "/operations/roles";

export async function fetchOperationsRoles(params?: {
  search?: string;
  status?: "active" | "archived" | "all";
  departmentId?: string;
}): Promise<{ roles: OperationsRole[] }> {
  const response = await apiClient.get<{ data: { roles: OperationsRole[] } }>(
    BASE,
    {
      params: {
        search: params?.search || undefined,
        status: params?.status || "active",
        departmentId: params?.departmentId || undefined,
      },
    },
  );
  return response.data.data;
}

export async function fetchOperationsRoleHierarchy(): Promise<{
  tree: OperationsRoleTreeNode[];
}> {
  const response = await apiClient.get<{ data: { tree: OperationsRoleTreeNode[] } }>(
    `${BASE}/hierarchy`,
  );
  return response.data.data;
}

export async function fetchOperationsPermissionCatalog(): Promise<{
  tree: OperationsCatalogTreeNode[];
  definitions: OperationsPermissionProjectionDefinition[];
}> {
  const response = await apiClient.get<{
    data: {
      tree: OperationsCatalogTreeNode[];
      definitions: OperationsPermissionProjectionDefinition[];
    };
  }>(`${BASE}/catalog`);
  return response.data.data;
}

export async function fetchOperationsRoleDetail(
  roleId: string,
): Promise<OperationsRoleDetail> {
  const response = await apiClient.get<{ data: OperationsRoleDetail }>(
    `${BASE}/${encodeURIComponent(roleId)}`,
  );
  return response.data.data;
}

export async function createOperationsRole(
  input: CreateOperationsRoleInput,
): Promise<OperationsRole> {
  const response = await apiClient.post<{ data: OperationsRole }>(BASE, input);
  return response.data.data;
}

export async function updateOperationsRole(
  roleId: string,
  input: CreateOperationsRoleInput,
): Promise<OperationsRole> {
  const response = await apiClient.patch<{ data: OperationsRole }>(
    `${BASE}/${encodeURIComponent(roleId)}`,
    input,
  );
  return response.data.data;
}

export async function archiveOperationsRole(
  roleId: string,
  expectedRevision: number,
  reassignRoleId?: string,
): Promise<OperationsRole> {
  const response = await apiClient.post<{ data: OperationsRole }>(
    `${BASE}/${encodeURIComponent(roleId)}/archive`,
    {
      reassignRoleId: reassignRoleId ?? "",
      expectedRevision,
    },
  );
  return response.data.data;
}

export async function restoreOperationsRole(
  roleId: string,
  expectedRevision: number,
): Promise<OperationsRole> {
  const response = await apiClient.post<{ data: OperationsRole }>(
    `${BASE}/${encodeURIComponent(roleId)}/restore`,
    { expectedRevision },
  );
  return response.data.data;
}
