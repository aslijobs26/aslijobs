import {
  OPERATIONS_PERMISSION_MODULES,
  buildPermissionMap,
  canOperationsPermission,
  type OperationsPermissionAction,
  type OperationsPermissionMap,
  type OperationsPermissionModule,
} from "../constants/operations-permissions";
import type {
  OperationsPermissionProjectionDefinition,
  OperationsRoleGrant,
} from "../types/operations-team";

const PREVIEW_STORAGE_KEY = "aslijobs:operations-role-preview";

export type OperationsRolePreviewDraft = {
  roleId: string;
  roleName: string;
  grants: OperationsRoleGrant[];
  canCreateRoles: boolean;
  canManageUsers: boolean;
  canAssignRoles: boolean;
  /** When true, draft came from unsaved editor state. */
  unsaved: boolean;
  /** Return path after Exit Preview (usually role edit). */
  returnPath: string;
  baseRevision: number | null;
};

function isPermissionModule(value: string): value is OperationsPermissionModule {
  return (OPERATIONS_PERMISSION_MODULES as readonly string[]).includes(value);
}

function isPermissionAction(value: string): value is OperationsPermissionAction {
  return (
    value === "read" ||
    value === "create" ||
    value === "update" ||
    value === "delete" ||
    value === "export"
  );
}

/**
 * Projects fine grant keys onto the coarse can(module, action) matrix.
 * Uses the same catalog mapsTo / field / section rules as backend
 * `projectGrantedKeysToMatrix` when definitions are provided.
 */
export function projectRoleGrantsToPermissionMatrix(
  grants: OperationsRoleGrant[],
  definitions?: readonly OperationsPermissionProjectionDefinition[],
): OperationsPermissionMap {
  if (definitions && definitions.length > 0) {
    return projectWithCatalogDefinitions(grants, definitions);
  }
  return projectWithHeuristicFallback(grants);
}

function projectWithCatalogDefinitions(
  grants: OperationsRoleGrant[],
  definitions: readonly OperationsPermissionProjectionDefinition[],
): OperationsPermissionMap {
  const matrix = buildPermissionMap({});
  const byKey = new Map(definitions.map((item) => [item.key, item]));
  const granted = new Set(
    grants.map((grant) => grant.key.trim()).filter(Boolean),
  );

  for (const key of granted) {
    const definition = byKey.get(key);
    if (!definition) continue;
    // Field permissions never unlock module coarse actions.
    if (definition.field) continue;
    if (definition.mapsTo.action === "read") {
      const isPageView =
        definition.action === "view" || definition.action === "read";
      if (!isPageView) continue;
      if (definition.section) continue;
    }
    const moduleKey = definition.mapsTo.module;
    const action = definition.mapsTo.action;
    if (!isPermissionModule(moduleKey) || !isPermissionAction(action)) {
      continue;
    }
    matrix[moduleKey][action] = true;
  }
  return matrix;
}

/** Legacy fallback when catalog definitions have not loaded yet. */
function projectWithHeuristicFallback(
  grants: OperationsRoleGrant[],
): OperationsPermissionMap {
  const matrix = buildPermissionMap({});
  for (const grant of grants) {
    const key = grant.key.trim();
    if (!key) continue;
    const parts = key.split(".");
    const moduleKey = parts[0] ?? "";
    if (!isPermissionModule(moduleKey)) continue;
    if (key.includes(".fields.") || parts.includes("fields")) continue;
    if (
      parts.length >= 4 &&
      (parts[2] === "documents" ||
        parts[2] === "applications" ||
        parts[2] === "actions" ||
        parts[2] === "jobs")
    ) {
      continue;
    }
    const leaf = parts[parts.length - 1] ?? "";
    if (leaf === "search" || leaf === "filter" || leaf === "history") {
      continue;
    }
    if (parts.length === 2) {
      const coarse = mapKeyActionToCoarse(parts[1] ?? "");
      if (coarse) matrix[moduleKey][coarse] = true;
      continue;
    }
    const coarse = mapKeyActionToCoarse(leaf);
    if (coarse) matrix[moduleKey][coarse] = true;
  }
  return matrix;
}

function mapKeyActionToCoarse(
  action: string,
): OperationsPermissionAction | null {
  switch (action) {
    case "view":
    case "read":
    case "search":
    case "filter":
    case "history":
    case "list":
      return "read";
    case "export":
      return "export";
    case "create":
      return "create";
    case "update":
    case "edit":
    case "approve":
    case "reject":
    case "verify":
    case "activate":
    case "deactivate":
    case "assign":
    case "reassign":
    case "claim":
    case "complete":
    case "update_joining":
      return "update";
    case "delete":
    case "archive":
    case "remove":
      return "delete";
    default:
      return null;
  }
}

export function grantKeysFromGrants(grants: OperationsRoleGrant[]): string[] {
  return [...new Set(grants.map((grant) => grant.key.trim()).filter(Boolean))];
}

export function diffRoleGrantKeys(
  initial: OperationsRoleGrant[],
  next: OperationsRoleGrant[],
): { added: string[]; removed: string[] } {
  const before = new Set(grantKeysFromGrants(initial));
  const after = new Set(grantKeysFromGrants(next));
  const added = [...after].filter((key) => !before.has(key)).sort();
  const removed = [...before].filter((key) => !after.has(key)).sort();
  return { added, removed };
}

export function saveRolePreviewDraft(draft: OperationsRolePreviewDraft): void {
  sessionStorage.setItem(PREVIEW_STORAGE_KEY, JSON.stringify(draft));
}

export function loadRolePreviewDraft(): OperationsRolePreviewDraft | null {
  try {
    const raw = sessionStorage.getItem(PREVIEW_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as OperationsRolePreviewDraft;
    if (!parsed?.roleId || !Array.isArray(parsed.grants)) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

export function clearRolePreviewDraft(): void {
  sessionStorage.removeItem(PREVIEW_STORAGE_KEY);
}

export function isOperationsRolePreviewActive(): boolean {
  if (typeof window === "undefined") return false;
  return (
    window.location.pathname.includes("/operations/roles/") &&
    window.location.pathname.endsWith("/preview")
  );
}

export function previewCanModule(
  permissions: OperationsPermissionMap,
  module: OperationsPermissionModule,
  action: OperationsPermissionAction = "read",
): boolean {
  return canOperationsPermission(permissions, module, action);
}

export function operationsRolePreviewPath(roleId: string): string {
  return `/operations/roles/${encodeURIComponent(roleId)}/preview`;
}
