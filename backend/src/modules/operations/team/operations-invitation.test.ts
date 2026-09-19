import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { AppError } from "../../../middleware/error.middleware.js";
import { getOperationsAdminLoginUrl } from "../auth/operations-admin-url.js";
import { env } from "../../../config/env.js";
import {
  buildOrganizationInvitationEmail,
  generateOrganizationTemporaryPassword,
  OPERATIONS_INVITATION_EMAIL_SUBJECT,
} from "./operations-invitation-email.service.js";
import { prepareRoleGrants } from "../roles/operations-role-grants.js";
import { updateOperationsRoleBodySchema } from "../roles/operations-roles.validation.js";

describe("organization invitation email", () => {
  it("includes role, login email, password, and environment login URL", () => {
    const loginUrl = getOperationsAdminLoginUrl();
    const content = buildOrganizationInvitationEmail({
      memberName: "Rahul",
      roleName: "Support",
      loginEmail: "rahul@aslijobs.com",
      temporaryPassword: "TempPass!234",
      loginUrl,
    });

    assert.equal(content.subject, OPERATIONS_INVITATION_EMAIL_SUBJECT);
    assert.match(content.text, /Role: Support/);
    assert.match(content.text, /Email: rahul@aslijobs.com/);
    assert.match(content.text, /Password: TempPass!234/);
    assert.match(content.text, new RegExp(loginUrl.replaceAll("/", "\\/")));
    assert.equal(loginUrl, `${env.ADMIN_URL.replace(/\/+$/, "")}/login`);
    assert.doesNotMatch(content.text, /passwordHash|refreshToken|jwt/i);
    assert.doesNotMatch(content.html, /passwordHash|refreshToken/i);
    assert.match(content.html, />\s*Login\s*</);
  });

  it("embeds a production dashboard URL when that environment URL is supplied", () => {
    const content = buildOrganizationInvitationEmail({
      memberName: "Rahul",
      roleName: "Support",
      loginEmail: "rahul@aslijobs.com",
      temporaryPassword: "TempPass!234",
      loginUrl: "https://admin.aslijobs.com/login",
    });
    assert.match(content.text, /https:\/\/admin\.aslijobs\.com\/login/);
    assert.match(content.html, /https:\/\/admin\.aslijobs\.com\/login/);
    assert.doesNotMatch(content.text, /localhost/);
  });

  it("uses the configured ADMIN_URL rather than a hardcoded host", () => {
    const loginUrl = getOperationsAdminLoginUrl();
    assert.equal(loginUrl.startsWith("http://") || loginUrl.startsWith("https://"), true);
    assert.match(loginUrl, /\/login$/);
  });

  it("generates a non-empty temporary password without storing it", () => {
    const password = generateOrganizationTemporaryPassword();
    assert.ok(password.length >= 12);
    assert.notEqual(password, generateOrganizationTemporaryPassword());
  });
});

describe("role grant preparation", () => {
  it("keeps catalog keys and drops unknown keys for Super Admin", () => {
    const grants = prepareRoleGrants({
      isSuperAdmin: true,
      actorDelegatableKeys: [],
      requestedGrants: [
        { key: "support.view", access: "allow", canDelegate: false },
        { key: "not.a.real.permission", access: "allow", canDelegate: false },
        { key: "support", access: "allow", canDelegate: false },
      ],
    });
    assert.deepEqual(
      grants.map((grant) => grant.key),
      ["support.view"],
    );
  });

  it("rejects unknown keys for non-super actors", () => {
    assert.throws(
      () => {
        prepareRoleGrants({
          isSuperAdmin: false,
          actorDelegatableKeys: ["support.view"],
          requestedGrants: [
            { key: "support.view", access: "allow", canDelegate: false },
            { key: "finance.refund", access: "allow", canDelegate: false },
          ],
        });
      },
      (error: unknown) =>
        error instanceof AppError && error.statusCode === 400,
    );
  });

  it("prevents permission escalation beyond the actor delegation boundary", () => {
    assert.throws(
      () => {
        prepareRoleGrants({
          isSuperAdmin: false,
          actorDelegatableKeys: ["support.view"],
          requestedGrants: [
            { key: "employers.list.view", access: "allow", canDelegate: false },
          ],
        });
      },
      (error: unknown) =>
        error instanceof AppError && error.statusCode === 403,
    );
  });
});

describe("role update CAS payload", () => {
  it("requires expectedRevision", () => {
    const result = updateOperationsRoleBodySchema.safeParse({
      grants: [{ key: "support.view", access: "allow" }],
    });
    assert.equal(result.success, false);
  });

  it("accepts a catalog grant update with expectedRevision", () => {
    const parsed = updateOperationsRoleBodySchema.parse({
      expectedRevision: 4,
      grants: [{ key: "support.view", access: "allow", canDelegate: false }],
    });
    assert.equal(parsed.expectedRevision, 4);
    assert.equal(parsed.grants?.[0]?.key, "support.view");
  });
});
