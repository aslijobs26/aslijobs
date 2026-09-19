import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  accessHasWorkCapability,
  buildCapabilitySummary,
  capabilityRejectionMessage,
  getWorkTypeCapability,
  roleGrantsHaveWorkCapability,
  WORK_TYPE_CAPABILITY_REGISTRY,
} from "./operations-work-capability.js";
import { projectGrantedKeysToMatrix } from "../rbac/operations-permission-projection.js";
import type { OperationsPermissionMap } from "../auth/operations-rbac.js";

function accessFromKeys(keys: string[]) {
  return {
    isSuperAdmin: false,
    grantedKeys: keys,
    permissions: projectGrantedKeysToMatrix(keys, false) as OperationsPermissionMap,
  };
}

describe("work type capability registry", () => {
  it("defines a capability for every work type", () => {
    const types = Object.keys(WORK_TYPE_CAPABILITY_REGISTRY);
    assert.ok(types.includes("verification"));
    assert.ok(types.includes("job_operations"));
    assert.ok(types.includes("placements"));
    assert.ok(types.includes("support"));
  });

  it("allows Super Admin for every type", () => {
    const access = {
      isSuperAdmin: true,
      grantedKeys: [] as string[],
      permissions: projectGrantedKeysToMatrix([], true),
    };
    assert.equal(accessHasWorkCapability(access, "verification"), true);
    assert.equal(accessHasWorkCapability(access, "job_operations"), true);
  });

  it("allows a verification specialist with employer verify + verifications read", () => {
    const access = accessFromKeys([
      "employers.list.view",
      "employers.profile.actions.verify",
      "verifications.read",
    ]);
    assert.equal(accessHasWorkCapability(access, "verification"), true);
    assert.equal(accessHasWorkCapability(access, "job_operations"), false);
  });

  it("rejects a technical-style role without verification permissions", () => {
    const access = accessFromKeys([
      "my_work.list.view",
      "my_work.update",
      "my_work.complete",
      "support.read",
      "support.update",
    ]);
    assert.equal(accessHasWorkCapability(access, "verification"), false);
    assert.equal(accessHasWorkCapability(access, "support"), true);
  });

  it("allows job moderation with approve action", () => {
    const access = accessFromKeys([
      "jobs.list.view",
      "jobs.detail.actions.approve",
    ]);
    assert.equal(accessHasWorkCapability(access, "job_operations"), true);
    assert.equal(accessHasWorkCapability(access, "verification"), false);
  });

  it("allows placements with update_joining", () => {
    const access = accessFromKeys([
      "placements.list.view",
      "placements.detail.actions.update_joining",
    ]);
    assert.equal(accessHasWorkCapability(access, "placements"), true);
  });

  it("role grant helper matches access helper", () => {
    const keys = [
      "employers.list.view",
      "employers.profile.actions.verify",
      "verifications.read",
    ];
    assert.equal(roleGrantsHaveWorkCapability(keys, "verification"), true);
    assert.equal(roleGrantsHaveWorkCapability(keys, "job_operations"), false);
  });

  it("builds a human-readable rejection message", () => {
    const message = capabilityRejectionMessage("verification");
    assert.match(message, /Verification/i);
    assert.match(message, /cannot perform/i);
  });

  it("exposes required permission summary for UI", () => {
    const summary = buildCapabilitySummary("verification");
    assert.equal(summary.workType, "verification");
    assert.ok(summary.requiredPermissions.length >= 2);
    assert.equal(
      getWorkTypeCapability("verification").capabilityLabel,
      summary.capabilityLabel,
    );
  });
});
