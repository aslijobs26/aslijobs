import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  buildTeamArchiveBlockedMessage,
  canActorAccessDepartment,
  canActorAccessOrgUnit,
  hasBlockingTeamDependencies,
  isDepartmentCompatible,
  isSameOrgBranch,
} from "./operations-teams-domain.js";

describe("operations teams domain", () => {
  it("treats user org unit as compatible with the same branch", () => {
    assert.equal(
      isSameOrgBranch({
        userOrgUnitId: "hyderabad",
        userAncestorIds: ["global", "india", "south", "telangana"],
        teamOrgUnitId: "telangana",
        teamAncestorIds: ["global", "india", "south"],
      }),
      true,
    );
    assert.equal(
      isSameOrgBranch({
        userOrgUnitId: "telangana",
        userAncestorIds: ["global", "india", "south"],
        teamOrgUnitId: "hyderabad",
        teamAncestorIds: ["global", "india", "south", "telangana"],
      }),
      true,
    );
    assert.equal(
      isSameOrgBranch({
        userOrgUnitId: "warangal",
        userAncestorIds: ["global", "india", "south", "telangana"],
        teamOrgUnitId: "vijayawada",
        teamAncestorIds: ["global", "india", "south", "andhra"],
      }),
      false,
    );
    assert.equal(
      isSameOrgBranch({
        userOrgUnitId: null,
        userAncestorIds: [],
        teamOrgUnitId: "hyderabad",
        teamAncestorIds: ["global"],
      }),
      true,
    );
  });

  it("requires matching departments when the user already has one", () => {
    assert.equal(isDepartmentCompatible("ops", "ops"), true);
    assert.equal(isDepartmentCompatible(null, "ops"), true);
    assert.equal(isDepartmentCompatible("support", "ops"), false);
  });

  it("blocks team archive when members or open work remain", () => {
    assert.equal(
      hasBlockingTeamDependencies({ activeMembers: 0, openWorkItems: 0 }),
      false,
    );
    assert.equal(
      hasBlockingTeamDependencies({ activeMembers: 2, openWorkItems: 0 }),
      true,
    );
    assert.equal(
      hasBlockingTeamDependencies({ activeMembers: 0, openWorkItems: 1 }),
      true,
    );
    assert.match(
      buildTeamArchiveBlockedMessage("Hyderabad Operations", {
        activeMembers: 2,
        openWorkItems: 3,
      }),
      /Hyderabad Operations/,
    );
  });

  it("scopes managers to their department and org subtree", () => {
    assert.equal(
      canActorAccessDepartment({
        isSuperAdmin: false,
        actorDepartmentId: "ops",
        targetDepartmentId: "ops",
      }),
      true,
    );
    assert.equal(
      canActorAccessDepartment({
        isSuperAdmin: false,
        actorDepartmentId: "ops",
        targetDepartmentId: "support",
      }),
      false,
    );
    assert.equal(
      canActorAccessOrgUnit({
        isSuperAdmin: false,
        actorOrgUnitId: "telangana",
        actorSubtreeIds: ["telangana", "hyderabad"],
        targetUnitId: "hyderabad",
      }),
      true,
    );
    assert.equal(
      canActorAccessOrgUnit({
        isSuperAdmin: false,
        actorOrgUnitId: "telangana",
        actorSubtreeIds: ["telangana", "hyderabad"],
        targetUnitId: "vijayawada",
      }),
      false,
    );
    assert.equal(
      canActorAccessOrgUnit({
        isSuperAdmin: true,
        actorOrgUnitId: "telangana",
        actorSubtreeIds: [],
        targetUnitId: "vijayawada",
      }),
      true,
    );
  });
});
