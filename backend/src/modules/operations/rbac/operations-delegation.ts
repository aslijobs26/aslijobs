import { HTTP_STATUS } from "../../../constants/http-status.js";
import { AppError } from "../../../middleware/error.middleware.js";
import {
  isOperationsPermissionKey,
  listOperationsPermissionKeys,
} from "./operations-permission-catalog.js";
import type { OperationsRoleGrant } from "./operations-role.model.js";

export function assertDelegationBoundary(input: {
  isSuperAdmin: boolean;
  actorDelegatableKeys: Iterable<string>;
  requestedGrants: OperationsRoleGrant[];
}): void {
  if (input.isSuperAdmin) {
    assertKnownGrants(input.requestedGrants);
    return;
  }

  const delegatable = new Set(input.actorDelegatableKeys);

  if (delegatable.size === 0 && input.requestedGrants.length > 0) {
    throw new AppError(
      "You cannot assign permissions because none of your permissions are delegatable.",
      HTTP_STATUS.FORBIDDEN,
    );
  }

  for (const grant of input.requestedGrants) {
    if (!isOperationsPermissionKey(grant.key)) {
      throw new AppError(
        `Unknown permission: ${grant.key}`,
        HTTP_STATUS.BAD_REQUEST,
      );
    }

    if (!delegatable.has(grant.key)) {
      throw new AppError(
        "You can only assign permissions within your delegation boundary.",
        HTTP_STATUS.FORBIDDEN,
      );
    }

    if (grant.canDelegate && !delegatable.has(grant.key)) {
      throw new AppError(
        "You cannot mark a permission as delegatable unless you can delegate it.",
        HTTP_STATUS.FORBIDDEN,
      );
    }
  }
}

export function assertKnownGrants(grants: OperationsRoleGrant[]): void {
  const unknown = grants
    .map((grant) => grant.key)
    .filter((key) => !isOperationsPermissionKey(key));

  if (unknown.length > 0) {
    throw new AppError(
      `Unknown permission keys: ${unknown.join(", ")}`,
      HTTP_STATUS.BAD_REQUEST,
    );
  }
}

export function wouldCreateRoleCycle(
  roleId: string,
  nextParentId: string | null,
  ancestorIdsOfParent: string[],
): boolean {
  if (!nextParentId) {
    return false;
  }

  if (roleId === nextParentId) {
    return true;
  }

  return ancestorIdsOfParent.includes(roleId);
}

export function filterDelegatableCatalogKeys(
  actorDelegatableKeys: Iterable<string>,
  isSuperAdmin: boolean,
): string[] {
  if (isSuperAdmin) {
    return listOperationsPermissionKeys();
  }

  const allowed = new Set(actorDelegatableKeys);
  return listOperationsPermissionKeys().filter((key) => allowed.has(key));
}
