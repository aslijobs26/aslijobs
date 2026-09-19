import { HTTP_STATUS } from "../../../constants/http-status.js";
import { AppError } from "../../../middleware/error.middleware.js";
import { assertDelegationBoundary } from "../rbac/operations-delegation.js";
import { isOperationsPermissionKey } from "../rbac/operations-permission-catalog.js";
import type { OperationsRoleGrant } from "../rbac/operations-role.model.js";

export function normalizeRoleGrants(
  grants: Array<{ key: string; access?: "allow"; canDelegate?: boolean }>,
): OperationsRoleGrant[] {
  const unique = new Map<string, OperationsRoleGrant>();
  for (const grant of grants) {
    const key = grant.key.trim();
    if (!key) {
      continue;
    }
    unique.set(key, {
      key,
      access: "allow",
      canDelegate: Boolean(grant.canDelegate),
    });
  }
  return [...unique.values()];
}

/**
 * Catalog-authoritative grant preparation.
 * Super Admin: unknown/stale keys are dropped so existing roles remain editable.
 * Custom managers: unknown keys are rejected; remaining keys must be delegatable.
 */
export function prepareRoleGrants(input: {
  requestedGrants: Array<{
    key: string;
    access?: "allow";
    canDelegate?: boolean;
  }>;
  isSuperAdmin: boolean;
  actorDelegatableKeys: Iterable<string>;
}): OperationsRoleGrant[] {
  const normalized = normalizeRoleGrants(input.requestedGrants);
  const known: OperationsRoleGrant[] = [];
  const unknown: string[] = [];

  for (const grant of normalized) {
    if (isOperationsPermissionKey(grant.key)) {
      known.push(grant);
    } else {
      unknown.push(grant.key);
    }
  }

  if (unknown.length > 0 && !input.isSuperAdmin) {
    throw new AppError(
      "Unknown permission keys cannot be assigned.",
      HTTP_STATUS.BAD_REQUEST,
      { unknownKeys: unknown.slice(0, 20) },
    );
  }

  assertDelegationBoundary({
    isSuperAdmin: input.isSuperAdmin,
    actorDelegatableKeys: input.actorDelegatableKeys,
    requestedGrants: known,
  });

  return known;
}
