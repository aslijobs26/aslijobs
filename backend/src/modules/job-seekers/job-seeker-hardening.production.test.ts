import assert from "node:assert/strict";
import { describe, it } from "node:test";
import jwt from "jsonwebtoken";
import { env } from "../../config/env.js";
import { jwtService } from "../auth/jwt.service.js";
import {
  assertJobSeekerAccountActive,
  isJobSeekerAccountActive,
  normalizeJobSeekerAccountStatus,
} from "../job-seekers/job-seeker-account-status.js";
import { toPublicJobSeeker } from "../job-seekers/job-seeker.serializer.js";
import {
  sanitizeCandidateDetail,
  sanitizeCandidateListItem,
} from "../operations/rbac/operations-field-sanitize.js";
import {
  CANDIDATE_FIELD_PERMISSION_KEYS,
  CANDIDATE_LIST_VIEW_PERMISSION_KEY,
  CANDIDATE_PROFILE_VIEW_PERMISSION_KEY,
  isOperationsPermissionKey,
} from "../operations/rbac/operations-permission-catalog.js";
import { projectGrantedKeysToMatrix } from "../operations/rbac/operations-permission-projection.js";
import type { OperationsResolvedAccess } from "../operations/rbac/operations-access.types.js";
import { isSensitiveUploadPublicPath } from "../storage/private-file.service.js";
import { WITHDRAWABLE_STATUSES } from "../applications/application.constants.js";
import { AppError } from "../../middleware/error.middleware.js";
import mongoose from "mongoose";

function accessForKeys(grantedKeys: string[]): OperationsResolvedAccess {
  return {
    userId: "tester",
    role: "CUSTOM",
    roleId: "role1",
    roleName: "Custom",
    departmentId: null,
    departmentName: null,
    departmentSlug: null,
    isSuperAdmin: false,
    canCreateRoles: false,
    canManageUsers: false,
    canAssignRoles: false,
    grantedKeys,
    delegatableKeys: [],
    permissions: projectGrantedKeysToMatrix(grantedKeys, false),
    parentRoleId: null,
  };
}

describe("Jobseeker hardening — account status", () => {
  it("treats missing status as active", () => {
    assert.equal(normalizeJobSeekerAccountStatus(undefined), "active");
    assert.equal(normalizeJobSeekerAccountStatus(null), "active");
    assert.equal(isJobSeekerAccountActive(undefined), true);
  });

  it("blocks blocked and suspended accounts", () => {
    assert.throws(
      () => assertJobSeekerAccountActive("blocked"),
      (error: unknown) => error instanceof AppError && error.statusCode === 403,
    );
    assert.throws(
      () => assertJobSeekerAccountActive("suspended"),
      (error: unknown) => error instanceof AppError && error.statusCode === 403,
    );
  });
});

describe("Jobseeker hardening — registration continuation token", () => {
  it("issues and verifies a short-lived registration token", () => {
    const issued = jwtService.issueJobSeekerRegistrationContinuationToken({
      jobSeekerId: new mongoose.Types.ObjectId().toString(),
      whatsappNumber: "9876543210",
    });
    assert.ok(issued.token.length > 20);
    const claims = jwtService.verifyJobSeekerRegistrationContinuationToken(
      issued.token,
    );
    assert.equal(claims.typ, "job_seeker_registration");
    assert.equal(claims.whatsappNumber, "9876543210");
  });

  it("rejects normal job seeker access tokens as continuation", () => {
    const session = jwtService.issueJobSeekerTokens({
      sub: new mongoose.Types.ObjectId().toString(),
      whatsappNumber: "9876543210",
    });
    assert.throws(() =>
      jwtService.verifyJobSeekerRegistrationContinuationToken(
        session.accessToken,
      ),
    );
  });

  it("rejects forged continuation without typ claim", () => {
    const forged = jwt.sign(
      {
        sub: new mongoose.Types.ObjectId().toString(),
        whatsappNumber: "9876543210",
        role: "job_seeker",
      },
      env.JWT_ACCESS_SECRET,
      { expiresIn: "10m" },
    );
    assert.throws(() =>
      jwtService.verifyJobSeekerRegistrationContinuationToken(forged),
    );
  });
});

describe("Jobseeker hardening — public serializer privacy", () => {
  it("does not expose storage paths or public upload URLs for photos", () => {
    const publicSeeker = toPublicJobSeeker({
      _id: new mongoose.Types.ObjectId(),
      fullName: "Test Seeker",
      whatsappNumber: "9876543210",
      isWhatsappVerified: true,
      registrationStatus: "COMPLETED",
      accountStatus: "active",
      profilePhoto: {
        url: "/uploads/job-seekers/x/profile/photo.jpg",
        storagePath: "uploads/job-seekers/x/profile/photo.jpg",
        publicId: "secret",
        storageProvider: "local",
        originalName: "photo.jpg",
        mimeType: "image/jpeg",
        fileSize: 12,
      },
    });

    assert.equal(publicSeeker.profilePhoto?.url, "/api/v1/jobseekers/me/photo");
    assert.equal(
      "storagePath" in (publicSeeker.profilePhoto ?? {}),
      false,
    );
    assert.equal(publicSeeker.accountStatus, "active");
  });
});

describe("Jobseeker hardening — sensitive static uploads", () => {
  it("flags resumes and job-seeker folders as sensitive", () => {
    assert.equal(isSensitiveUploadPublicPath("/resumes/a.pdf"), true);
    assert.equal(isSensitiveUploadPublicPath("/job-seekers/x/photo.jpg"), true);
    assert.equal(isSensitiveUploadPublicPath("/employer-logos/logo.png"), false);
  });
});

describe("Jobseeker hardening — Operations candidate field RBAC", () => {
  it("registers dob and salary field permission keys", () => {
    assert.equal(isOperationsPermissionKey(CANDIDATE_FIELD_PERMISSION_KEYS.dob), true);
    assert.equal(
      isOperationsPermissionKey(CANDIDATE_FIELD_PERMISSION_KEYS.expectedSalary),
      true,
    );
    assert.equal(
      isOperationsPermissionKey(CANDIDATE_FIELD_PERMISSION_KEYS.currentSalary),
      true,
    );
    assert.equal(isOperationsPermissionKey(CANDIDATE_LIST_VIEW_PERMISSION_KEY), true);
    assert.equal(
      isOperationsPermissionKey(CANDIDATE_PROFILE_VIEW_PERMISSION_KEY),
      true,
    );
  });

  it("omits dob and salary fields without permission", () => {
    const access = accessForKeys([
      CANDIDATE_FIELD_PERMISSION_KEYS.name,
      CANDIDATE_FIELD_PERMISSION_KEYS.phone,
    ]);
    const detail = sanitizeCandidateDetail(
      {
        candidateName: "A",
        candidatePhone: "9",
        candidateEmail: "a@b.com",
        candidateLocation: "Hyd",
        candidateCity: "Hyd",
        candidateState: "TS",
        candidatePincode: "500001",
        preferredLocations: ["Hyd"],
        dateOfBirth: "2000-01-01T00:00:00.000Z",
        expectedSalary: 25000,
        expectedSalaryPeriod: "per-month",
        experiences: [{ salary: "20000" } as never],
        uploadedResumeUrl: "/uploads/resumes/x.pdf",
        uploadedResumeName: "x.pdf",
        hasUploadedResume: true,
      } as never,
      access,
    );

    assert.equal("dateOfBirth" in detail, false);
    assert.equal("expectedSalary" in detail, false);
    assert.equal("expectedSalaryPeriod" in detail, false);
    assert.equal(
      (detail.experiences?.[0] as { salary?: string } | undefined)?.salary,
      undefined,
    );
  });

  it("omits list PII without field keys", () => {
    const access = accessForKeys([]);
    const item = sanitizeCandidateListItem(
      {
        candidateName: "A",
        candidatePhone: "9",
        candidateEmail: "a@b.com",
        candidateLocation: "Hyd",
      } as never,
      access,
    );
    assert.equal("candidateName" in item, false);
    assert.equal("candidatePhone" in item, false);
    assert.equal("candidateEmail" in item, false);
    assert.equal("candidateLocation" in item, false);
  });
});

describe("Jobseeker hardening — withdraw rules", () => {
  it("keeps withdrawable statuses limited to early pipeline", () => {
    assert.deepEqual([...WITHDRAWABLE_STATUSES], [
      "submitted",
      "viewed",
      "under_review",
      "shortlisted",
    ]);
  });
});
