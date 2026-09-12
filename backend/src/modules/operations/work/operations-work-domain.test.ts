import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  assertWorkStatusTransition,
  buildDoNowFilter,
  formatWorkDisplayId,
  isTerminalWorkStatus,
} from "./operations-work-domain.js";
import {
  isWithinDepartmentScope,
  isStrictRoleDescendantOfActor,
  buildWorkVisibilityFilter,
} from "./operations-work-assignment.js";
import {
  joiningPendingSourceEventKey,
  jobModerationOpenSourceEventKey,
  verificationOpenSourceEventKey,
} from "./operations-work-emit.js";
import { workTypesForDepartmentSlug } from "./operations-work-department.js";
import type { OperationsResolvedAccess } from "../rbac/operations-access.types.js";

function actor(
  overrides: Partial<OperationsResolvedAccess> = {},
): OperationsResolvedAccess {
  return {
    userId: "aaaaaaaaaaaaaaaaaaaaaaaa",
    role: "CUSTOM",
    roleId: "bbbbbbbbbbbbbbbbbbbbbbbb",
    roleName: "Manager",
    departmentId: "cccccccccccccccccccccccc",
    departmentName: "Verification",
    departmentSlug: "verification",
    isSuperAdmin: false,
    canCreateRoles: false,
    canManageUsers: true,
    canAssignRoles: true,
    grantedKeys: ["my_work.assign"],
    delegatableKeys: [],
    permissions: {} as OperationsResolvedAccess["permissions"],
    parentRoleId: null,
    ...overrides,
  };
}

describe("operations work domain transitions", () => {
  it("formats display ids", () => {
    assert.match(formatWorkDisplayId("abcdef123456"), /^WI-\d{4}-[A-F0-9]{6}$/);
  });

  it("allows valid status transitions and blocks invalid ones", () => {
    assert.doesNotThrow(() => assertWorkStatusTransition("queued", "assigned"));
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
    assert.doesNotThrow(() => assertWorkStatusTransition("queued", "cancelled"));
    assert.throws(() => assertWorkStatusTransition("queued", "completed"));
    assert.throws(() => assertWorkStatusTransition("completed", "assigned"));
    assert.throws(() => assertWorkStatusTransition("cancelled", "queued"));
  });

  it("marks terminal statuses", () => {
    assert.equal(isTerminalWorkStatus("completed"), true);
    assert.equal(isTerminalWorkStatus("cancelled"), true);
    assert.equal(isTerminalWorkStatus("in_progress"), false);
  });

  it("builds Do Now as P1 OR overdue among open statuses", () => {
    const now = new Date("2026-09-12T10:00:00.000Z");
    const filter = buildDoNowFilter(now);
    assert.deepEqual(filter.status, {
      $in: ["assigned", "in_progress", "queued"],
    });
    assert.ok(Array.isArray(filter.$or));
    assert.deepEqual(filter.$or, [
      { priority: "P1" },
      { dueAt: { $lt: now } },
    ]);
  });
});

describe("operations work assignment scope", () => {
  it("enforces department scope for non-super-admins", () => {
    const base = actor();
    assert.equal(
      isWithinDepartmentScope(base, "cccccccccccccccccccccccc"),
      true,
    );
    assert.equal(
      isWithinDepartmentScope(base, "dddddddddddddddddddddddd"),
      false,
    );
    assert.equal(isWithinDepartmentScope(base, null), false);
    assert.equal(
      isWithinDepartmentScope({ ...base, isSuperAdmin: true }, "dddddddddddddddddddddddd"),
      true,
    );
  });

  it("rejects peer (same role) assignment for non-super-admin", async () => {
    const base = actor();
    const allowed = await isStrictRoleDescendantOfActor(base, base.roleId);
    assert.equal(allowed, false);
  });

  it("allows super admin any target role", async () => {
    const allowed = await isStrictRoleDescendantOfActor(
      actor({ isSuperAdmin: true }),
      "eeeeeeeeeeeeeeeeeeeeeeee",
    );
    assert.equal(allowed, true);
  });

  it("builds visibility with department team queue for department actors", () => {
    const filter = buildWorkVisibilityFilter(actor());
    assert.ok("$or" in filter);
    const clauses = filter.$or as Record<string, unknown>[];
    assert.ok(
      clauses.some(
        (c) =>
          c.assignedToUserId === null &&
          c.departmentId === "cccccccccccccccccccccccc",
      ),
    );
  });

  it("super admin visibility is unrestricted", () => {
    assert.deepEqual(
      buildWorkVisibilityFilter(actor({ isSuperAdmin: true })),
      {},
    );
  });
});

describe("operations work source event keys", () => {
  it("uses stable open keys for verification/job/placement", () => {
    assert.equal(
      verificationOpenSourceEventKey("emp1"),
      "employer.verification_open:emp1",
    );
    assert.equal(
      jobModerationOpenSourceEventKey("job-9"),
      "job.moderation_open:JOB-9",
    );
    assert.equal(
      joiningPendingSourceEventKey("app1"),
      "placement.joining_pending:app1",
    );
  });

  it("maps department slugs to work types", () => {
    assert.deepEqual(workTypesForDepartmentSlug("verification"), [
      "verification",
    ]);
    assert.ok(workTypesForDepartmentSlug("placements").includes("placements"));
    assert.deepEqual(workTypesForDepartmentSlug(null), []);
  });
});
