import type {
  OperationsCatalogTreeNode,
  OperationsRoleGrant,
} from "../../../types/operations-team";

/** Horizontal matrix columns matching the Create Role reference UI. */
export const PERMISSION_MATRIX_COLUMNS = [
  "view",
  "create",
  "edit",
  "delete",
  "assign",
  "reassign",
  "claim",
  "updateStatus",
  "complete",
  "priority",
  "due",
  "export",
] as const;

export type PermissionMatrixColumnId =
  (typeof PERMISSION_MATRIX_COLUMNS)[number];

export const PERMISSION_MATRIX_COLUMN_LABELS: Record<
  PermissionMatrixColumnId,
  string
> = {
  view: "View",
  create: "Create",
  edit: "Edit",
  delete: "Delete",
  assign: "Assign",
  reassign: "Reassign",
  claim: "Claim",
  updateStatus: "Update Status",
  complete: "Complete",
  priority: "Priority",
  due: "Due",
  export: "Export",
};

export type PermissionMatrixModuleRow = {
  id: string;
  label: string;
  /** All non-field leaf keys under this module. */
  leafKeys: string[];
  /** Field-level leaf keys (`.fields.`). */
  fieldKeys: string[];
  /** Column → catalog keys that belong in that column for this module. */
  columnKeys: Record<PermissionMatrixColumnId, string[]>;
};

function collectLeaves(node: OperationsCatalogTreeNode): string[] {
  if (node.children.length === 0) {
    return [node.key];
  }
  return node.children.flatMap(collectLeaves);
}

function isFieldKey(key: string): boolean {
  return key.includes(".fields.");
}

/**
 * Maps a granular catalog key onto a matrix column.
 * Returns null when the key belongs only to Field Level Access or is unmapped.
 */
export function classifyPermissionKey(
  key: string,
): PermissionMatrixColumnId | null {
  if (isFieldKey(key)) {
    return null;
  }

  const parts = key.split(".");
  const action = parts[parts.length - 1] ?? "";
  const section = parts.length >= 3 ? parts[parts.length - 2] : "";

  if (section === "priority" && action === "update") {
    return "priority";
  }
  if (section === "due" && action === "update") {
    return "due";
  }

  switch (action) {
    case "view":
    case "search":
    case "filter":
    case "history":
      return "view";
    case "create":
      return "create";
    case "update":
    case "edit":
      // Bare `module.update` (e.g. my_work.update) is status update in catalog.
      if (action === "update" && parts.length === 2) {
        return "updateStatus";
      }
      return "edit";
    case "delete":
    case "archive":
      return "delete";
    case "assign":
    case "assign_role":
    case "assign_department":
      return "assign";
    case "reassign":
      return "reassign";
    case "claim":
      return "claim";
    case "complete":
      return "complete";
    case "export":
      return "export";
    case "verify":
    case "reject":
    case "suspend":
    case "activate":
    case "approve":
    case "restore":
      return "updateStatus";
    default:
      return null;
  }
}

export function buildPermissionMatrixRows(
  tree: OperationsCatalogTreeNode[],
  /** When set, rows still include all keys; callers lock non-delegatable ones. */
  _allowedKeys?: Set<string> | null,
): PermissionMatrixModuleRow[] {
  return tree
    .map((moduleNode) => {
      const allLeaves = collectLeaves(moduleNode);
      const fieldKeys = allLeaves.filter(isFieldKey);
      const leafKeys = allLeaves.filter((key) => !isFieldKey(key));

      const columnKeys = Object.fromEntries(
        PERMISSION_MATRIX_COLUMNS.map((column) => [column, [] as string[]]),
      ) as Record<PermissionMatrixColumnId, string[]>;

      for (const key of leafKeys) {
        const column = classifyPermissionKey(key);
        if (column) {
          columnKeys[column].push(key);
        }
      }

      return {
        id: moduleNode.key,
        label: moduleNode.label,
        leafKeys,
        fieldKeys,
        columnKeys,
      };
    })
    .filter((row) => row.leafKeys.length > 0 || row.fieldKeys.length > 0);
}

/** Keys the actor may actually toggle (delegatable subset). */
export function filterDelegatableKeys(
  keys: string[],
  allowedKeys: Set<string> | null,
): string[] {
  if (!allowedKeys) {
    return keys;
  }
  return keys.filter((key) => allowedKeys.has(key));
}

export function isPermissionColumnLocked(
  keys: string[],
  allowedKeys: Set<string> | null,
): boolean {
  if (!allowedKeys || keys.length === 0) {
    return false;
  }
  return filterDelegatableKeys(keys, allowedKeys).length === 0;
}

export function grantKeySet(grants: OperationsRoleGrant[]): Set<string> {
  return new Set(grants.map((grant) => grant.key));
}

export function areKeysFullyGranted(
  keys: string[],
  selected: Set<string>,
): boolean {
  return keys.length > 0 && keys.every((key) => selected.has(key));
}

export function areKeysPartiallyGranted(
  keys: string[],
  selected: Set<string>,
): boolean {
  if (keys.length === 0) return false;
  const count = keys.filter((key) => selected.has(key)).length;
  return count > 0 && count < keys.length;
}

export function toggleKeysInGrants(
  grants: OperationsRoleGrant[],
  keys: string[],
  enabled: boolean,
): OperationsRoleGrant[] {
  if (keys.length === 0) {
    return grants;
  }
  const keySet = new Set(keys);
  const preserved = grants.filter((grant) => !keySet.has(grant.key));
  if (!enabled) {
    return preserved;
  }
  const existing = new Map(grants.map((grant) => [grant.key, grant]));
  return [
    ...preserved,
    ...keys.map((key) => ({
      key,
      access: "allow" as const,
      canDelegate: existing.get(key)?.canDelegate ?? false,
    })),
  ];
}

export function selectAllApplicableKeys(
  rows: PermissionMatrixModuleRow[],
  includeFields: boolean,
): string[] {
  const keys: string[] = [];
  for (const row of rows) {
    keys.push(...row.leafKeys);
    if (includeFields) {
      keys.push(...row.fieldKeys);
    }
  }
  return keys;
}
