import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  assertWorkStatusTransition,
  formatWorkDisplayId,
  isTerminalWorkStatus,
} from "./operations-work-domain.js";
import {
  isWithinDepartmentScope,
  isStrictRoleDescendantOfActor,
} from "./operations-work-assignment.js";
import type { OperationsResolvedAccess } from "../rbac/operations-access.types.js";

describe("operations work domain", () => {
  it("formats display ids", () => {
    assert.match(formatWorkDisplayId("abcdef123456"), /^WI-\d{4}-[A-F0-9]{6}$/);
  });

  it("allows valid status transitions and blocks invalid ones", () => {
    assert.doesNotThrow(() =>
      assertWorkStatusTransition("queued", "assigned"),
    );
    assert.doesNotThrow(() =>
      assertWorkStatusTransition("assigned", "in_progress"),
    );
    assert.doesNotThrow(() =>
      assertWorkStatusTransition("in_progress", "waiting"),
    );
    assert.doesNotThrow(() =>
      assertWorkStatusTransition("waiting", "in_progress"),
    );
    assert.doesNotThrow(() =>
      assertWorkStatusTransition("in_progress", "completed"),
    );
    assert.throws(() => assertWorkStatusTransition("queued", "completed"));
    assert.throws(() => assertWorkStatusTransition("completed", "assigned"));
  });

  it("marks terminal statuses", () => {
    assert.equal(isTerminalWorkStatus("completed"), true);
    assert.equal(isTerminalWorkStatus("cancelled"), true);
    assert.equal(isTerminalWorkStatus("in_progress"), false);
  });
});

describe("operations work assignment scope", () => {
  const baseActor = {
    userId: "aaaaaaaaaaaaaaaaaaaaaaaa",
    role: "CUSTOM" as const,
    roleId: "bbbbbbbbbbbbbbbbbbbbbbbb",
    roleName: "Manager",
    departmentId: "cccccccccccccccccccccccc",
    departmentName: "Verification",
    isSuperAdmin: false,
    canCreateRoles: false,
    canManageUsers: true,
    canAssignRoles: true,
    grantedKeys: ["my_work.assign"],
    delegatableKeys: [],
    permissions: {} as OperationsResolvedAccess["permissions"],
    parentRoleId: null,
  } satisfies OperationsResolvedAccess;

  it("enforces department scope for non-super-admins", () => {
    assert.equal(
      isWithinDepartmentScope(baseActor, "cccccccccccccccccccccccc"),
      true,
    );
    assert.equal(
      isWithinDepartmentScope(baseActor, "dddddddddddddddddddddddd"),
      false,
    );
    assert.equal(isWithinDepartmentScope(baseActor, null), false);
    assert.equal(
      isWithinDepartmentScope(
        { ...baseActor, isSuperAdmin: true },
        "dddddddddddddddddddddddd",
      ),
      true,
    );
  });

  it("rejects peer (same role) assignment for non-super-admin", async () => {
    const allowed = await isStrictRoleDescendantOfActor(
      baseActor,
      baseActor.roleId,
    );
    assert.equal(allowed, false);
  });

  it("allows super admin any target role", async () => {
    const allowed = await isStrictRoleDescendantOfActor(
      { ...baseActor, isSuperAdmin: true },
      "eeeeeeeeeeeeeeeeeeeeeeee",
    );
    assert.equal(allowed, true);
  });
});
