import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { AppError } from "../../../middleware/error.middleware.js";
import {
  assertDelegationBoundary,
  wouldCreateRoleCycle,
} from "./operations-delegation.js";
import { sanitizeEmployerDetail } from "./operations-field-sanitize.js";
import type { OperationsResolvedAccess } from "./operations-access.types.js";
import {
  catalogKeysMatchingMatrix,
  projectGrantedKeysToMatrix,
} from "./operations-permission-projection.js";
import { isOperationsPermissionKey } from "./operations-permission-catalog.js";

function accessForKeys(
  grantedKeys: string[],
  delegatableKeys: string[] = [],
): OperationsResolvedAccess {
  return {
    userId: "actor",
    role: "CUSTOM",
    roleId: "111111111111111111111111",
    roleName: "Custom",
    departmentId: null,
    departmentName: null,
    departmentSlug: null,
    orgUnitId: null,
    isSuperAdmin: false,
    canCreateRoles: true,
    canManageUsers: false,
    canAssignRoles: false,
    grantedKeys,
    delegatableKeys,
    permissions: projectGrantedKeysToMatrix(grantedKeys, false),
    parentRoleId: null,
  };
}

describe("operations delegation boundary", () => {
  it("allows Super Admin to grant any known permission", () => {
    assert.doesNotThrow(() => {
      assertDelegationBoundary({
        isSuperAdmin: true,
        actorDelegatableKeys: [],
        requestedGrants: [
          { key: "employers.list.view", access: "allow", canDelegate: true },
        ],
      });
    });
  });

  it("rejects unknown permission keys", () => {
    assert.throws(
      () => {
        assertDelegationBoundary({
          isSuperAdmin: true,
          actorDelegatableKeys: [],
          requestedGrants: [
            { key: "finance.refund", access: "allow", canDelegate: false },
          ],
        });
      },
      (error: unknown) => error instanceof AppError,
    );
  });

  it("rejects grants when the actor has no delegatable keys", () => {
    assert.throws(
      () => {
        assertDelegationBoundary({
          isSuperAdmin: false,
          actorDelegatableKeys: [],
          requestedGrants: [
            { key: "employers.list.view", access: "allow", canDelegate: false },
          ],
        });
      },
      (error: unknown) =>
        error instanceof AppError && error.statusCode === 403,
    );
  });

  it("rejects permissions outside the actor delegation set", () => {
    assert.throws(
      () => {
        assertDelegationBoundary({
          isSuperAdmin: false,
          actorDelegatableKeys: ["employers.list.view"],
          requestedGrants: [
            { key: "jobs.list.view", access: "allow", canDelegate: false },
          ],
        });
      },
      (error: unknown) =>
        error instanceof AppError && error.statusCode === 403,
    );
  });

  it("allows a subset of delegatable permissions", () => {
    assert.doesNotThrow(() => {
      assertDelegationBoundary({
        isSuperAdmin: false,
        actorDelegatableKeys: [
          "employers.list.view",
          "employers.profile.actions.verify",
        ],
        requestedGrants: [
          { key: "employers.list.view", access: "allow", canDelegate: false },
          {
            key: "employers.profile.actions.verify",
            access: "allow",
            canDelegate: true,
          },
        ],
      });
    });
  });
});

describe("role hierarchy cycles", () => {
  it("rejects a role parenting itself", () => {
    assert.equal(wouldCreateRoleCycle("a", "a", []), true);
  });

  it("rejects A → B → A", () => {
    assert.equal(wouldCreateRoleCycle("a", "b", ["a"]), true);
  });

  it("allows attaching to an unrelated parent", () => {
    assert.equal(wouldCreateRoleCycle("a", "b", ["c"]), false);
  });
});

describe("employer field sanitization", () => {
  it("omits PAN and GST when those field keys are not granted", () => {
    const access = accessForKeys([
      "employers.profile.view",
      "employers.profile.fields.name.view",
      "employers.profile.fields.phone.view",
    ]);

    const sanitized = sanitizeEmployerDetail(
      {
        id: "1",
        displayId: "EMP-1",
        accountType: "company",
        displayName: "Acme",
        companyName: "Acme Pvt Ltd",
        establishmentName: "",
        organizationType: "Pvt Ltd",
        phone: "9999999999",
        email: "hidden@example.com",
        location: "Pune",
        city: "Pune",
        state: "MH",
        registeredAt: null,
        registeredAtDate: "",
        registeredAtTime: "",
        verificationStatus: "pending",
        verificationStatusLabel: "Pending",
        verifiedAt: null,
        verifiedAtDate: "",
        status: "active",
        statusLabel: "Active",
        activeJobsCount: 0,
        totalJobsCount: 0,
        logoUrl: "",
        isWhatsappVerified: true,
        isProfileComplete: true,
        registrationStatus: "complete",
        contactPersonName: "Patel",
        companyAddress: "Pune",
        pincode: "411001",
        panNumber: "ABCDE1234F",
        gstNumber: "27AAAAA0000A1Z5",
        registrationNumber: "REG-1",
        alternatePhone: "",
        documents: [],
        analytics: {
          totalJobs: 0,
          activeJobs: 0,
          closedJobs: 0,
          applicationsReceived: 0,
        },
      } as never,
      access,
    );

    assert.equal("panNumber" in sanitized, false);
    assert.equal("gstNumber" in sanitized, false);
    assert.equal("email" in sanitized, false);
    assert.equal(sanitized.displayName, "Acme");
    assert.equal(sanitized.phone, "9999999999");
  });
});

describe("permission catalog integrity", () => {
  it("does not treat unknown keys as valid", () => {
    assert.equal(isOperationsPermissionKey("TeamManagement.Admin"), false);
    assert.equal(isOperationsPermissionKey("Finance.Refund"), false);
    assert.equal(isOperationsPermissionKey("employers.list.view"), true);
    assert.equal(isOperationsPermissionKey("team.members.delete"), true);
  });
});

describe("export as first-class coarse action", () => {
  it("view key alone grants read but not create or export", () => {
    const matrix = projectGrantedKeysToMatrix(["employers.list.view"], false);
    assert.equal(matrix.employers.read, true);
    assert.equal(matrix.employers.create, false);
    assert.equal(matrix.employers.export, false);
  });

  it("export key alone grants export but not read", () => {
    const matrix = projectGrantedKeysToMatrix(["employers.list.export"], false);
    assert.equal(matrix.employers.export, true);
    assert.equal(matrix.employers.read, false);
  });

  it("create key alone grants create but not read", () => {
    const matrix = projectGrantedKeysToMatrix(["employers.list.create"], false);
    assert.equal(matrix.employers.create, true);
    assert.equal(matrix.employers.read, false);
  });

  it("readOnly employers matrix does not include list export", () => {
    const matrix = projectGrantedKeysToMatrix([], false);
    matrix.employers = {
      read: true,
      create: false,
      update: false,
      delete: false,
      export: false,
    };
    const keys = catalogKeysMatchingMatrix(matrix).map((item) => item.key);
    assert.equal(keys.includes("employers.list.export"), false);
    assert.equal(keys.includes("employers.list.view"), true);
  });
});

describe("field grants do not unlock module navigation", () => {
  it("candidate field keys alone do not set candidates.read", () => {
    const matrix = projectGrantedKeysToMatrix(
      [
        "candidates.profile.fields.phone.view",
        "candidates.profile.fields.email.view",
        "candidates.profile.fields.name.view",
      ],
      false,
    );
    assert.equal(matrix.candidates.read, false);
    assert.equal(matrix.candidates.create, false);
    assert.equal(matrix.candidates.export, false);
  });

  it("candidate search/filter alone do not set candidates.read", () => {
    const matrix = projectGrantedKeysToMatrix(
      ["candidates.list.search", "candidates.list.filter"],
      false,
    );
    assert.equal(matrix.candidates.read, false);
  });

  it("candidate list.view unlocks candidates.read without create/export", () => {
    const matrix = projectGrantedKeysToMatrix(
      ["candidates.list.view"],
      false,
    );
    assert.equal(matrix.candidates.read, true);
    assert.equal(matrix.candidates.create, false);
    assert.equal(matrix.candidates.export, false);
  });

  it("documents.view alone does not unlock candidates.read", () => {
    const matrix = projectGrantedKeysToMatrix(
      ["candidates.profile.documents.view"],
      false,
    );
    assert.equal(matrix.candidates.read, false);
  });
});

describe("module entry access", () => {
  it("denies module access when only field grants exist", async () => {
    const { operationsAccessCanModule } = await import(
      "./operations-module-access.js"
    );
    const access = accessForKeys([
      "candidates.profile.fields.name.view",
      "candidates.profile.fields.phone.view",
    ]);
    assert.equal(operationsAccessCanModule(access, "candidates"), false);
  });

  it("allows module access with list.view", async () => {
    const { operationsAccessCanModule } = await import(
      "./operations-module-access.js"
    );
    const access = accessForKeys(["candidates.list.view"]);
    assert.equal(operationsAccessCanModule(access, "candidates"), true);
  });
});
