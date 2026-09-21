import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  canViewOperationsMemberEmail,
  canViewOperationsMemberMobile,
} from "./operations-access.service.js";
import { projectGrantedKeysToMatrix } from "./operations-permission-projection.js";
import type { OperationsResolvedAccess } from "./operations-access.types.js";

function access(
  partial: Partial<OperationsResolvedAccess> & {
    grantedKeys?: string[];
  },
): OperationsResolvedAccess {
  const grantedKeys = partial.grantedKeys ?? [];
  return {
    userId: "u1",
    role: "CUSTOM",
    roleId: "r1",
    roleName: "Custom",
    isSuperAdmin: false,
    departmentId: "d1",
    departmentName: null,
    departmentSlug: null,
    orgUnitId: "o1",
    canCreateRoles: false,
    canManageUsers: false,
    canAssignRoles: false,
    permissions: projectGrantedKeysToMatrix(grantedKeys, Boolean(partial.isSuperAdmin)),
    grantedKeys,
    delegatableKeys: [],
    parentRoleId: null,
    ...partial,
  };
}

describe("organization member field visibility", () => {
  it("omits mobile unless the field key or legacy coarse read applies", () => {
    assert.equal(
      canViewOperationsMemberMobile(
        access({
          grantedKeys: ["team.members.view"],
        }),
      ),
      false,
    );
    assert.equal(
      canViewOperationsMemberMobile(
        access({
          grantedKeys: ["team.members.fields.mobile.view"],
        }),
      ),
      true,
    );
    assert.equal(
      canViewOperationsMemberMobile(
        access({
          isSuperAdmin: true,
          grantedKeys: [],
        }),
      ),
      true,
    );
  });

  it("omits email unless the field key or legacy coarse read applies", () => {
    assert.equal(
      canViewOperationsMemberEmail(
        access({
          grantedKeys: ["team.members.view"],
        }),
      ),
      false,
    );
    assert.equal(
      canViewOperationsMemberEmail(
        access({
          grantedKeys: ["team.members.fields.email.view"],
        }),
      ),
      true,
    );
  });

  it("does not project field keys onto coarse module read", () => {
    const matrix = projectGrantedKeysToMatrix(
      ["team.members.fields.mobile.view", "team.members.fields.email.view"],
      false,
    );
    assert.equal(matrix.team.read, false);
    assert.equal(matrix.team.create, false);
  });

  it("projects page view keys onto coarse module read", () => {
    const matrix = projectGrantedKeysToMatrix(
      ["team.members.view", "team.organization.view", "team.teams.view"],
      false,
    );
    assert.equal(matrix.team.read, true);
  });
});
