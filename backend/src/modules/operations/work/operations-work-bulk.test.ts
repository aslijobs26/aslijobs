import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  bulkAssignOperationsWorkBodySchema,
  createOperationsWorkBodySchema,
} from "./operations-work.validation.js";
import {
  assertHasAssignOrReassignPermission,
  isWithinDepartmentScope,
  resolveBulkTargetValidationMode,
  WORK_BULK_ASSIGN_MAX,
} from "./operations-work-assignment.js";
import type { OperationsResolvedAccess } from "../rbac/operations-access.types.js";
import { AppError } from "../../../middleware/error.middleware.js";

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
    grantedKeys: ["my_work.assign", "my_work.reassign", "my_work.create"],
    delegatableKeys: [],
    permissions: {} as OperationsResolvedAccess["permissions"],
    parentRoleId: null,
    ...overrides,
  };
}

describe("operations work bulk assign validation", () => {
  const id1 = "111111111111111111111111";
  const id2 = "222222222222222222222222";
  const target = "333333333333333333333333";

  it("accepts a valid user bulk assign payload", () => {
    const parsed = bulkAssignOperationsWorkBodySchema.parse({
      workItemIds: [id1, id2],
      targetType: "user",
      targetId: target,
      expectedRevisions: { [id1]: 1, [id2]: 4 },
    });
    assert.equal(parsed.workItemIds.length, 2);
    assert.equal(parsed.targetType, "user");
  });

  it("accepts a valid department bulk assign payload", () => {
    const parsed = bulkAssignOperationsWorkBodySchema.parse({
      workItemIds: [id1],
      targetType: "department",
      targetId: target,
      expectedRevisions: { [id1]: 2 },
    });
    assert.equal(parsed.targetType, "department");
  });

  it("rejects duplicate work item ids", () => {
    assert.throws(() =>
      bulkAssignOperationsWorkBodySchema.parse({
        workItemIds: [id1, id1],
        targetType: "user",
        targetId: target,
        expectedRevisions: { [id1]: 1 },
      }),
    );
  });

  it("rejects missing expectedRevision for an id", () => {
    assert.throws(() =>
      bulkAssignOperationsWorkBodySchema.parse({
        workItemIds: [id1, id2],
        targetType: "user",
        targetId: target,
        expectedRevisions: { [id1]: 1 },
      }),
    );
  });

  it("rejects oversized batches beyond max", () => {
    const ids = Array.from({ length: WORK_BULK_ASSIGN_MAX + 1 }, (_, i) =>
      i.toString(16).padStart(24, "0"),
    );
    const revisions = Object.fromEntries(ids.map((id) => [id, 1]));
    assert.throws(() =>
      bulkAssignOperationsWorkBodySchema.parse({
        workItemIds: ids,
        targetType: "user",
        targetId: target,
        expectedRevisions: revisions,
      }),
    );
  });
});

describe("operations work create assignment modes", () => {
  it("requires assignee when assignTo=user", () => {
    assert.throws(() =>
      createOperationsWorkBodySchema.parse({
        title: "Review docs",
        type: "verification",
        priority: "P1",
        assignTo: "user",
      }),
    );
  });

  it("rejects assignee when assignTo=team_queue", () => {
    assert.throws(() =>
      createOperationsWorkBodySchema.parse({
        title: "Review docs",
        type: "verification",
        priority: "P1",
        assignTo: "team_queue",
        assignedToUserId: "111111111111111111111111",
      }),
    );
  });

  it("accepts team_queue without assignee", () => {
    const parsed = createOperationsWorkBodySchema.parse({
      title: "Review docs",
      type: "verification",
      priority: "P1",
      assignTo: "team_queue",
      departmentId: "cccccccccccccccccccccccc",
    });
    assert.equal(parsed.assignTo, "team_queue");
  });
});

describe("department routing scope", () => {
  it("blocks department heads from foreign departments", () => {
    assert.equal(
      isWithinDepartmentScope(actor(), "dddddddddddddddddddddddd"),
      false,
    );
    assert.equal(
      isWithinDepartmentScope(actor(), "cccccccccccccccccccccccc"),
      true,
    );
    assert.equal(
      isWithinDepartmentScope(
        actor({ isSuperAdmin: true }),
        "dddddddddddddddddddddddd",
      ),
      true,
    );
  });
});

describe("bulk assign permission gates", () => {
  it("rejects specialists without assign or reassign", () => {
    assert.throws(
      () =>
        assertHasAssignOrReassignPermission(
          actor({ grantedKeys: ["my_work.view", "my_work.claim"] }),
        ),
      (error: unknown) =>
        error instanceof AppError && error.statusCode === 403,
    );
  });

  it("allows actors with assign or reassign only", () => {
    assert.doesNotThrow(() =>
      assertHasAssignOrReassignPermission(
        actor({ grantedKeys: ["my_work.assign"] }),
      ),
    );
    assert.doesNotThrow(() =>
      assertHasAssignOrReassignPermission(
        actor({ grantedKeys: ["my_work.reassign"] }),
      ),
    );
  });

  it("uses reassign mode for pre-validation when assign is missing", () => {
    assert.equal(
      resolveBulkTargetValidationMode(
        actor({ grantedKeys: ["my_work.reassign"] }),
      ),
      "reassign",
    );
    assert.equal(
      resolveBulkTargetValidationMode(
        actor({ grantedKeys: ["my_work.assign", "my_work.reassign"] }),
      ),
      "assign",
    );
  });
});
