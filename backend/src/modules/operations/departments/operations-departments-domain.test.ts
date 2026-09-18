import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  buildDepartmentArchiveBlockedMessage,
  hasBlockingDepartmentDependencies,
  toDepartmentDependencyDetails,
} from "./operations-departments-domain.js";

describe("operations departments domain", () => {
  it("allows archive when all dependency counts are zero", () => {
    assert.equal(
      hasBlockingDepartmentDependencies({
        activeMembers: 0,
        scopedRoles: 0,
        openWorkItems: 0,
        activeTeams: 0,
      }),
      false,
    );
  });

  it("blocks archive when active members exist", () => {
    assert.equal(
      hasBlockingDepartmentDependencies({
        activeMembers: 3,
        scopedRoles: 0,
        openWorkItems: 0,
        activeTeams: 0,
      }),
      true,
    );
  });

  it("blocks archive when scoped roles exist", () => {
    assert.equal(
      hasBlockingDepartmentDependencies({
        activeMembers: 0,
        scopedRoles: 2,
        openWorkItems: 0,
        activeTeams: 0,
      }),
      true,
    );
  });

  it("blocks archive when open work items exist", () => {
    assert.equal(
      hasBlockingDepartmentDependencies({
        activeMembers: 0,
        scopedRoles: 0,
        openWorkItems: 4,
        activeTeams: 0,
      }),
      true,
    );
  });

  it("builds a clear blocked message with counts", () => {
    const message = buildDepartmentArchiveBlockedMessage("Operations", {
      activeMembers: 5,
      scopedRoles: 1,
      openWorkItems: 2,
      activeTeams: 3,
    });
    assert.match(message, /Operations/);
    assert.match(message, /5 active members/);
    assert.match(message, /1 scoped role/);
    assert.match(message, /2 open work items/);
    assert.match(message, /3 active teams/);
  });

  it("blocks archive when active teams exist", () => {
    assert.equal(
      hasBlockingDepartmentDependencies({
        activeMembers: 0,
        scopedRoles: 0,
        openWorkItems: 0,
        activeTeams: 2,
      }),
      true,
    );
  });

  it("marks dependency details as blocking when counts are present", () => {
    const details = toDepartmentDependencyDetails({
      activeMembers: 1,
      scopedRoles: 0,
      openWorkItems: 0,
      activeTeams: 0,
    });
    assert.equal(details.code, "DEPARTMENT_HAS_DEPENDENCIES");
    assert.equal(details.blocking, true);
    assert.equal(details.dependencies.activeMembers, 1);
  });
});
