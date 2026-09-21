import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { canActorAccessDepartment } from "../teams/operations-teams-domain.js";

/**
 * Department module scope contracts discovered during final verification:
 * department-scoped actors must not mutate foreign departments.
 */
describe("department module scope contracts", () => {
  it("Technical actor cannot mutate Support department", () => {
    assert.equal(
      canActorAccessDepartment({
        isSuperAdmin: false,
        actorDepartmentId: "technical",
        targetDepartmentId: "support",
      }),
      false,
    );
  });

  it("Technical actor can mutate Technical department", () => {
    assert.equal(
      canActorAccessDepartment({
        isSuperAdmin: false,
        actorDepartmentId: "technical",
        targetDepartmentId: "technical",
      }),
      true,
    );
  });

  it("null department scope denies mutations", () => {
    assert.equal(
      canActorAccessDepartment({
        isSuperAdmin: false,
        actorDepartmentId: null,
        targetDepartmentId: "technical",
      }),
      false,
    );
  });
});
