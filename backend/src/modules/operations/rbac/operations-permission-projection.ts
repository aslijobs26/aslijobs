import {
  OPERATIONS_PERMISSION_ACTIONS,
  OPERATIONS_PERMISSION_MODULES,
  buildSuperAdminPermissions,
  type OperationsPermissionMap,
} from "../auth/operations-rbac.js";
import {
  OPERATIONS_PERMISSION_CATALOG,
  type OperationsPermissionDefinition,
} from "./operations-permission-catalog.js";

function denyAllMatrix(): OperationsPermissionMap {
  const map = {} as OperationsPermissionMap;
  for (const moduleKey of OPERATIONS_PERMISSION_MODULES) {
    map[moduleKey] = {
      read: false,
      create: false,
      update: false,
      delete: false,
    };
  }
  return map;
}

export function projectGrantedKeysToMatrix(
  grantedKeys: Iterable<string>,
  isSuperAdmin: boolean,
): OperationsPermissionMap {
  if (isSuperAdmin) {
    return buildSuperAdminPermissions();
  }

  const granted = new Set(grantedKeys);
  const matrix = denyAllMatrix();
  const byKey = new Map(
    OPERATIONS_PERMISSION_CATALOG.map((item) => [item.key, item]),
  );

  for (const key of granted) {
    const definition = byKey.get(key);
    if (!definition) {
      continue;
    }
    matrix[definition.mapsTo.module][definition.mapsTo.action] = true;
  }

  return matrix;
}

export function catalogKeysMatchingMatrix(
  matrix: OperationsPermissionMap,
): OperationsPermissionDefinition[] {
  return OPERATIONS_PERMISSION_CATALOG.filter(
    (item) => matrix[item.mapsTo.module]?.[item.mapsTo.action] === true,
  );
}

export function listGrantedMatrixKeys(
  matrix: OperationsPermissionMap,
): string[] {
  const granted: string[] = [];
  for (const moduleKey of OPERATIONS_PERMISSION_MODULES) {
    for (const action of OPERATIONS_PERMISSION_ACTIONS) {
      if (matrix[moduleKey][action]) {
        granted.push(`${moduleKey}:${action}`);
      }
    }
  }
  return granted;
}
