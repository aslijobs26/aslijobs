import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  canActorAccessDepartment,
  canActorAccessOrgUnit,
  isDepartmentCompatible,
  isSameOrgBranch,
} from "../teams/operations-teams-domain.js";
import { projectGrantedKeysToMatrix } from "../rbac/operations-permission-projection.js";
import {
  canViewOperationsMemberEmail,
  canViewOperationsMemberMobile,
} from "../rbac/operations-access.service.js";
import type { OperationsResolvedAccess } from "../rbac/operations-access.types.js";
import {
  applyCasRevision,
  buildMemberSearchFields,
  isInvitationResendEligible,
  sanitizeMemberContactFields,
} from "./operations-people-security.js";
import { listOperationsPermissionProjectionDefinitions } from "../rbac/operations-permission-catalog.js";

/**
 * Final verification suite for Organization IDOR / null-scope / field /
 * invitation / CAS contracts. Live Mongo is optional; these assert the
 * authoritative domain + serializer behavior used by every API path.
 */

const LOCATIONS = {
  global: "global",
  india: "india",
  telangana: "telangana",
  hyderabad: "hyderabad",
  madhapur: "madhapur",
  gachibowli: "gachibowli",
  andhra: "andhra",
  westGodavari: "west-godavari",
  bhimavaram: "bhimavaram",
} as const;

const DEPTS = {
  technical: "dept-technical",
  support: "dept-support",
  hr: "dept-hr",
} as const;

const HYDERABAD_SUBTREE = [
  LOCATIONS.telangana,
  LOCATIONS.hyderabad,
  LOCATIONS.madhapur,
  LOCATIONS.gachibowli,
];

function access(
  partial: Partial<OperationsResolvedAccess> & { grantedKeys?: string[] },
): OperationsResolvedAccess {
  const grantedKeys = partial.grantedKeys ?? [];
  return {
    userId: "actor",
    role: "CUSTOM",
    roleId: "role-1",
    roleName: "Custom",
    departmentId: null,
    departmentName: null,
    departmentSlug: null,
    orgUnitId: null,
    isSuperAdmin: false,
    canCreateRoles: false,
    canManageUsers: false,
    canAssignRoles: false,
    grantedKeys,
    delegatableKeys: [],
    permissions: projectGrantedKeysToMatrix(
      grantedKeys,
      Boolean(partial.isSuperAdmin),
    ),
    parentRoleId: null,
    ...partial,
  };
}

describe("Organization IDOR matrix (Hyderabad Technical vs Bhimavaram Support)", () => {
  const userA = {
    isSuperAdmin: false,
    actorOrgUnitId: LOCATIONS.hyderabad,
    actorSubtreeIds: HYDERABAD_SUBTREE,
    actorDepartmentId: DEPTS.technical,
  };

  it("denies cross-state location access", () => {
    assert.equal(
      canActorAccessOrgUnit({
        ...userA,
        targetUnitId: LOCATIONS.bhimavaram,
      }),
      false,
    );
  });

  it("denies sibling city under different state", () => {
    assert.equal(
      canActorAccessOrgUnit({
        ...userA,
        targetUnitId: LOCATIONS.westGodavari,
      }),
      false,
    );
  });

  it("allows child office under Hyderabad", () => {
    assert.equal(
      canActorAccessOrgUnit({
        ...userA,
        targetUnitId: LOCATIONS.madhapur,
      }),
      true,
    );
  });

  it("denies cross-department access", () => {
    assert.equal(
      canActorAccessDepartment({
        isSuperAdmin: false,
        actorDepartmentId: DEPTS.technical,
        targetDepartmentId: DEPTS.support,
      }),
      false,
    );
  });

  it("allows same department", () => {
    assert.equal(
      canActorAccessDepartment({
        isSuperAdmin: false,
        actorDepartmentId: DEPTS.technical,
        targetDepartmentId: DEPTS.technical,
      }),
      true,
    );
  });

  it("rejects team assignment across department", () => {
    assert.equal(
      isDepartmentCompatible(DEPTS.support, DEPTS.technical),
      false,
    );
  });

  it("rejects team assignment across location branches", () => {
    assert.equal(
      isSameOrgBranch({
        userOrgUnitId: LOCATIONS.hyderabad,
        userAncestorIds: [LOCATIONS.global, LOCATIONS.india, LOCATIONS.telangana],
        teamOrgUnitId: LOCATIONS.bhimavaram,
        teamAncestorIds: [
          LOCATIONS.global,
          LOCATIONS.india,
          LOCATIONS.andhra,
          LOCATIONS.westGodavari,
        ],
      }),
      false,
    );
  });

  it("allows same-branch child location assignment", () => {
    assert.equal(
      isSameOrgBranch({
        userOrgUnitId: LOCATIONS.hyderabad,
        userAncestorIds: [LOCATIONS.global, LOCATIONS.india, LOCATIONS.telangana],
        teamOrgUnitId: LOCATIONS.madhapur,
        teamAncestorIds: [
          LOCATIONS.global,
          LOCATIONS.india,
          LOCATIONS.telangana,
          LOCATIONS.hyderabad,
        ],
      }),
      true,
    );
  });
});

describe("null scope deny-by-default", () => {
  it("Case A: null orgUnitId denies location targets", () => {
    assert.equal(
      canActorAccessOrgUnit({
        isSuperAdmin: false,
        actorOrgUnitId: null,
        actorSubtreeIds: [],
        targetUnitId: LOCATIONS.hyderabad,
      }),
      false,
    );
  });

  it("Case B: null departmentId denies department targets", () => {
    assert.equal(
      canActorAccessDepartment({
        isSuperAdmin: false,
        actorDepartmentId: null,
        targetDepartmentId: DEPTS.technical,
      }),
      false,
    );
  });

  it("Case C: both null still denies", () => {
    assert.equal(
      canActorAccessOrgUnit({
        isSuperAdmin: false,
        actorOrgUnitId: null,
        actorSubtreeIds: [],
        targetUnitId: LOCATIONS.global,
      }),
      false,
    );
    assert.equal(
      canActorAccessDepartment({
        isSuperAdmin: false,
        actorDepartmentId: null,
        targetDepartmentId: DEPTS.hr,
      }),
      false,
    );
  });

  it("Super Admin remains unrestricted", () => {
    assert.equal(
      canActorAccessOrgUnit({
        isSuperAdmin: true,
        actorOrgUnitId: null,
        actorSubtreeIds: [],
        targetUnitId: LOCATIONS.bhimavaram,
      }),
      true,
    );
    assert.equal(
      canActorAccessDepartment({
        isSuperAdmin: true,
        actorDepartmentId: null,
        targetDepartmentId: DEPTS.support,
      }),
      true,
    );
  });
});

describe("field omit and search security", () => {
  it("omits email and mobile when unauthorized", () => {
    const sanitized = sanitizeMemberContactFields({
      email: "a@aslijobs.com",
      mobileNumber: "9999999999",
      canViewEmail: false,
      canViewMobile: false,
    });
    assert.equal(Object.hasOwn(sanitized, "email"), false);
    assert.equal(Object.hasOwn(sanitized, "mobileNumber"), false);
  });

  it("never blanks unauthorized fields", () => {
    const sanitized = sanitizeMemberContactFields({
      email: "a@aslijobs.com",
      mobileNumber: "9999999999",
      canViewEmail: false,
      canViewMobile: true,
    });
    assert.equal(sanitized.mobileNumber, "9999999999");
    assert.equal(Object.hasOwn(sanitized, "email"), false);
  });

  it("blocks email/mobile from search when unauthorized", () => {
    const fields = buildMemberSearchFields({
      pattern: "9999",
      canViewEmail: false,
      canViewMobile: false,
    });
    assert.equal(fields.length, 1);
    assert.ok("fullName" in fields[0]!);
  });

  it("includes email/mobile search only when allowed", () => {
    const fields = buildMemberSearchFields({
      pattern: "rahul",
      canViewEmail: true,
      canViewMobile: true,
    });
    assert.equal(fields.length, 3);
  });

  it("field keys do not unlock team module read", () => {
    const matrix = projectGrantedKeysToMatrix(
      [
        "team.members.fields.email.view",
        "team.members.fields.mobile.view",
      ],
      false,
    );
    assert.equal(matrix.team.read, false);
  });

  it("fine grants without field keys deny email/mobile", () => {
    const actor = access({ grantedKeys: ["team.members.view"] });
    assert.equal(canViewOperationsMemberEmail(actor), false);
    assert.equal(canViewOperationsMemberMobile(actor), false);
  });
});

describe("invitation resend lifecycle", () => {
  it("allows pending invited members", () => {
    assert.equal(
      isInvitationResendEligible({
        email: "pending@aslijobs.com",
        role: "CUSTOM",
        lastActiveAt: null,
        invitedAt: new Date(),
      }),
      true,
    );
  });

  it("blocks active users", () => {
    assert.equal(
      isInvitationResendEligible({
        email: "active@aslijobs.com",
        role: "CUSTOM",
        lastActiveAt: new Date(),
        invitedAt: new Date(),
      }),
      false,
    );
  });

  it("blocks members never invited", () => {
    assert.equal(
      isInvitationResendEligible({
        email: "x@aslijobs.com",
        role: "CUSTOM",
        lastActiveAt: null,
        invitedAt: null,
      }),
      false,
    );
  });

  it("blocks Super Admin accounts", () => {
    assert.equal(
      isInvitationResendEligible({
        email: "admin@aslijobs.com",
        role: "SUPER_ADMIN",
        lastActiveAt: null,
        invitedAt: new Date(),
      }),
      false,
    );
  });
});

describe("CAS concurrency contract", () => {
  it("first writer succeeds and increments revision", () => {
    const first = applyCasRevision({
      currentRevision: 4,
      expectedRevision: 4,
    });
    assert.deepEqual(first, { ok: true, nextRevision: 5 });
  });

  it("second writer with stale revision conflicts", () => {
    const second = applyCasRevision({
      currentRevision: 5,
      expectedRevision: 4,
    });
    assert.deepEqual(second, { ok: false, code: "STALE_REVISION" });
  });

  it("simulates Admin A then Admin B race", () => {
    let revision = 1;
    const a = applyCasRevision({
      currentRevision: revision,
      expectedRevision: 1,
    });
    assert.equal(a.ok, true);
    if (a.ok) revision = a.nextRevision;
    const b = applyCasRevision({
      currentRevision: revision,
      expectedRevision: 1,
    });
    assert.equal(b.ok, false);
  });
});

describe("Role Preview projection parity with backend catalog", () => {
  it("uses catalog definitions so field grants do not unlock modules", () => {
    const definitions = listOperationsPermissionProjectionDefinitions();
    const byKey = new Map(definitions.map((d) => [d.key, d]));
    const email = byKey.get("team.members.fields.email.view");
    assert.ok(email);
    assert.equal(email!.field, "email");

    const matrix = projectGrantedKeysToMatrix(
      ["team.members.fields.email.view", "team.members.view"],
      false,
    );
    assert.equal(matrix.team.read, true);
    // email field alone would not unlock; members.view does
  });

  it("archive maps to delete for departments", () => {
    const definitions = listOperationsPermissionProjectionDefinitions();
    const archive = definitions.find((d) => d.key === "departments.archive");
    assert.ok(archive);
    assert.equal(archive!.mapsTo.action, "delete");
    const matrix = projectGrantedKeysToMatrix(["departments.archive"], false);
    assert.equal(matrix.departments.delete, true);
    assert.equal(matrix.departments.update, false);
  });
});
