import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  EMPTY_TEMPLATE,
  FULL_ACCESS_TEMPLATE,
  LIMITED_TEMPLATE,
  VIEW_ONLY_TEMPLATE,
  generatePermissionsFromAccessLevel,
  shouldReplacePermissionsOnAccessLevelChange,
} from "../team/team-access-templates.js";
import { TEAM_PERMISSION_MODULES } from "../team/team-permissions.js";

describe("access level templates", () => {
  it("full access enables every action on every module", () => {
    const matrix = generatePermissionsFromAccessLevel("full_access");
    for (const moduleKey of TEAM_PERMISSION_MODULES) {
      assert.equal(matrix[moduleKey].fullAccess, true);
      assert.equal(matrix[moduleKey].create, true);
      assert.equal(matrix[moduleKey].read, true);
      assert.equal(matrix[moduleKey].update, true);
      assert.equal(matrix[moduleKey].delete, true);
      assert.equal(matrix[moduleKey].export, true);
    }
    assert.deepEqual(matrix, FULL_ACCESS_TEMPLATE);
  });

  it("view only enables only read", () => {
    const matrix = generatePermissionsFromAccessLevel("view_only");
    for (const moduleKey of TEAM_PERMISSION_MODULES) {
      assert.equal(matrix[moduleKey].read, true);
      assert.equal(matrix[moduleKey].create, false);
      assert.equal(matrix[moduleKey].update, false);
      assert.equal(matrix[moduleKey].delete, false);
      assert.equal(matrix[moduleKey].export, false);
      assert.equal(matrix[moduleKey].fullAccess, false);
    }
    assert.deepEqual(matrix, VIEW_ONLY_TEMPLATE);
  });

  it("limited uses hiring-manager template", () => {
    const matrix = generatePermissionsFromAccessLevel("limited");
    assert.equal(matrix.dashboard.read, true);
    assert.equal(matrix.jobs.create, true);
    assert.equal(matrix.jobs.update, true);
    assert.equal(matrix.candidates.update, true);
    assert.equal(matrix.reports.export, true);
    assert.equal(matrix.settings.read, false);
    assert.equal(matrix.subscription.read, false);
    assert.equal(matrix.team_management.read, false);
    assert.equal(matrix.company_profile.read, false);
    assert.deepEqual(matrix, LIMITED_TEMPLATE);
  });

  it("custom starts empty", () => {
    const matrix = generatePermissionsFromAccessLevel("custom");
    for (const moduleKey of TEAM_PERMISSION_MODULES) {
      assert.equal(matrix[moduleKey].read, false);
      assert.equal(matrix[moduleKey].create, false);
    }
    assert.deepEqual(matrix, EMPTY_TEMPLATE);
  });

  it("replace rules keep matrix when switching to custom", () => {
    assert.equal(
      shouldReplacePermissionsOnAccessLevelChange("limited", "full_access"),
      true,
    );
    assert.equal(
      shouldReplacePermissionsOnAccessLevelChange("full_access", "custom"),
      false,
    );
    assert.equal(
      shouldReplacePermissionsOnAccessLevelChange("limited", "limited"),
      false,
    );
  });
});
