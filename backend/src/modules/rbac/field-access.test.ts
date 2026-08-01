import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  coerceFieldAccessLevel,
  isKnownField,
  normalizeFieldAccessMap,
} from "../team/field-access.catalog.js";
import {
  maskAadhaar,
  maskEmail,
  maskPAN,
  maskPhone,
  maskSalary,
} from "./field-masking.js";
import {
  buildMemberRbacContext,
  canAccessField,
  canExportField,
  getFieldLevel,
} from "./rbac.engine.js";
import {
  CANDIDATE_LIST_FIELD_BINDINGS,
  filterExportFieldsByAccess,
  sanitizeDtoByFieldAccess,
} from "./field-access.sanitize.js";

describe("field access catalog", () => {
  it("recognizes known candidate fields", () => {
    assert.equal(isKnownField("candidates", "phone"), true);
    assert.equal(isKnownField("candidates", "unknown_field"), false);
  });

  it("coerces legacy booleans", () => {
    assert.equal(coerceFieldAccessLevel(true), "edit");
    assert.equal(coerceFieldAccessLevel(false), "hidden");
    assert.equal(coerceFieldAccessLevel("mask"), "mask");
  });

  it("normalizes maps and drops unknown keys", () => {
    const normalized = normalizeFieldAccessMap({
      candidates: {
        phone: "mask",
        bogus: "edit",
      },
      dashboard: {
        anything: "edit",
      },
    });
    assert.deepEqual(normalized, {
      candidates: { phone: "mask" },
    });
  });
});

describe("masking", () => {
  it("masks phone email salary pan aadhaar", () => {
    assert.equal(maskPhone("9876543210"), "******3210");
    assert.match(maskEmail("chaitanya@gmail.com"), /^cha\*+@gmail\.com$/);
    assert.match(maskSalary(125000), /^₹\*{6}\d{2}$/);
    assert.match(maskPAN("ABCDE1234F"), /^ABCDE\*+F$/);
    assert.equal(maskAadhaar("123456789012"), "XXXX XXXX 9012");
  });
});

describe("rbac field levels", () => {
  const context = buildMemberRbacContext({
    employerId: "507f1f77bcf86cd799439011",
    memberId: "507f1f77bcf86cd799439012",
    roleId: "507f1f77bcf86cd799439013",
    roleName: "Recruiter",
    isSystem: false,
    accessLevel: "custom",
    permissions: {
      candidates: {
        fullAccess: false,
        create: true,
        read: true,
        update: true,
        delete: false,
        export: true,
      },
    },
    fieldAccess: {
      candidates: {
        phone: "mask",
        resume: "hidden",
        expected_salary: "view",
        notes: "edit",
      },
    },
  });

  it("resolves levels and write rules", () => {
    assert.equal(getFieldLevel(context, "candidates", "phone"), "mask");
    assert.equal(getFieldLevel(context, "candidates", "resume"), "hidden");
    assert.equal(canAccessField(context, "candidates", "phone", "read"), true);
    assert.equal(canAccessField(context, "candidates", "phone", "write"), false);
    assert.equal(canAccessField(context, "candidates", "resume", "read"), false);
    assert.equal(canAccessField(context, "candidates", "notes", "write"), true);
    assert.equal(canExportField(context, "candidates", "phone"), false);
    assert.equal(canExportField(context, "candidates", "expected_salary"), true);
  });

  it("sanitizes list DTOs", () => {
    const dto = {
      candidatePhone: "9876543210",
      candidateLocation: "Pune",
      candidateName: "Alex",
    };
    sanitizeDtoByFieldAccess(
      context,
      "candidates",
      dto,
      CANDIDATE_LIST_FIELD_BINDINGS,
    );
    assert.equal(dto.candidatePhone, "******3210");
    assert.equal(dto.candidateLocation, "Pune");
  });

  it("filters export fields for hidden and mask", () => {
    const fields = filterExportFieldsByAccess(
      context,
      "candidates",
      ["candidateName", "phone", "resume", "location"] as const,
      {
        phone: "phone",
        resume: "resume",
        location: "location",
      },
    );
    assert.deepEqual(fields, ["candidateName", "location"]);
  });
});
