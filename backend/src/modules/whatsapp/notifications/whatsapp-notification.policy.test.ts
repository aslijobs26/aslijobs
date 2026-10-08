import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { WHATSAPP_NOTIFICATION_MAX_ATTEMPTS } from "./whatsapp-notification.constants.js";
import {
  buildWhatsAppNotificationBodyParameters,
  buildWhatsAppNotificationUrlButtonParameters,
  EMPLOYER_ACCOUNT_REJECTED_RESUBMIT_PATH,
  EMPLOYER_ACCOUNT_REJECTED_RESUBMIT_URL,
  employerAccountApprovedPostJobUrl,
  getWhatsAppNotificationTemplate,
  resolveWhatsAppNotificationLanguage,
  whatsAppNotificationIdempotencyKey,
  whatsAppNotificationQueueJobId,
} from "./whatsapp-notification.policy.js";

describe("WhatsApp notification template mapping", () => {
  it("maps EMPLOYER_ACCOUNT_CREATED to employer_account_created", () => {
    const config = getWhatsAppNotificationTemplate("EMPLOYER_ACCOUNT_CREATED");
    assert.equal(config?.templateName, "employer_account_created");
    assert.equal(config?.approvedLanguages.en, "en");
  });

  it("puts employer name in {{1}}", () => {
    assert.deepEqual(
      buildWhatsAppNotificationBodyParameters("EMPLOYER_ACCOUNT_CREATED", {
        event: "EMPLOYER_ACCOUNT_CREATED",
        entityId: "abc",
        phoneNumber: "9876543210",
        employerName: "Test Employer",
      }),
      ["Test Employer"],
    );
  });

  it("falls back to English when the requested language is not approved", () => {
    assert.equal(
      resolveWhatsAppNotificationLanguage("EMPLOYER_ACCOUNT_CREATED", "te"),
      "en",
    );
    assert.equal(
      resolveWhatsAppNotificationLanguage("EMPLOYER_ACCOUNT_CREATED", "hi"),
      "en",
    );
  });

  it("uses a stable idempotency key per employer event", () => {
    assert.equal(
      whatsAppNotificationIdempotencyKey(
        "EMPLOYER_ACCOUNT_CREATED",
        "64f000000000000000000001",
      ),
      "EMPLOYER_ACCOUNT_CREATED:64f000000000000000000001",
    );
    assert.equal(
      whatsAppNotificationQueueJobId(
        "EMPLOYER_ACCOUNT_CREATED",
        "64f000000000000000000001",
      ).includes(":"),
      false,
    );
  });

  it("maps EMPLOYER_PROFILE_COMPLETION_REQUIRED to employer_profile_completion_required", () => {
    const config = getWhatsAppNotificationTemplate(
      "EMPLOYER_PROFILE_COMPLETION_REQUIRED",
    );
    assert.equal(
      config?.templateName,
      "employer_profile_completion_required",
    );
    assert.equal(config?.approvedLanguages.en, "en");
  });

  it("retries a bounded number of times", () => {
    assert.equal(WHATSAPP_NOTIFICATION_MAX_ATTEMPTS, 3);
  });

  it("maps EMPLOYER_ACCOUNT_APPROVED to employer_account_approved in English", () => {
    const config = getWhatsAppNotificationTemplate("EMPLOYER_ACCOUNT_APPROVED");
    assert.equal(config?.templateName, "employer_account_approved");
    assert.equal(config?.approvedLanguages.en, "en");
    assert.equal(
      resolveWhatsAppNotificationLanguage("EMPLOYER_ACCOUNT_APPROVED", "te"),
      "en",
    );
    assert.deepEqual(
      buildWhatsAppNotificationBodyParameters("EMPLOYER_ACCOUNT_APPROVED", {
        event: "EMPLOYER_ACCOUNT_APPROVED",
        entityId: "6ac746ac72aed3c70a82de5b",
        phoneNumber: "9876543210",
        employerName: "Acme Pvt Ltd",
      }),
      ["Acme Pvt Ltd"],
    );
    assert.deepEqual(
      buildWhatsAppNotificationUrlButtonParameters("EMPLOYER_ACCOUNT_APPROVED", {
        event: "EMPLOYER_ACCOUNT_APPROVED",
        entityId: "6ac746ac72aed3c70a82de5b",
        phoneNumber: "9876543210",
      }),
      ["6ac746ac72aed3c70a82de5b"],
    );
    assert.equal(
      employerAccountApprovedPostJobUrl("6ac746ac72aed3c70a82de5b"),
      "https://www.aslijobs.com/post-job/6ac746ac72aed3c70a82de5b",
    );
    assert.equal(
      whatsAppNotificationIdempotencyKey(
        "EMPLOYER_ACCOUNT_APPROVED",
        "6ac746ac72aed3c70a82de5b",
      ),
      "EMPLOYER_ACCOUNT_APPROVED:6ac746ac72aed3c70a82de5b",
    );
  });

  it("maps EMPLOYER_ACCOUNT_REJECTED to employer_account_rejected and the company profile URL", () => {
    const config = getWhatsAppNotificationTemplate("EMPLOYER_ACCOUNT_REJECTED");
    assert.equal(config?.templateName, "employer_account_rejected");
    assert.equal(config?.approvedLanguages.en, "en");
    assert.equal(
      resolveWhatsAppNotificationLanguage("EMPLOYER_ACCOUNT_REJECTED", "hi"),
      "en",
    );
    assert.deepEqual(
      buildWhatsAppNotificationBodyParameters("EMPLOYER_ACCOUNT_REJECTED", {
        event: "EMPLOYER_ACCOUNT_REJECTED",
        entityId: "6ac746ac72aed3c70a82de5b",
        phoneNumber: "9876543210",
        employerName: "Acme Pvt Ltd",
      }),
      ["Acme Pvt Ltd"],
    );
    assert.equal(
      EMPLOYER_ACCOUNT_REJECTED_RESUBMIT_URL,
      "https://www.aslijobs.com/employer/company-profile",
    );
    assert.equal(
      EMPLOYER_ACCOUNT_REJECTED_RESUBMIT_PATH,
      "/employer/company-profile",
    );
    assert.equal(
      whatsAppNotificationIdempotencyKey(
        "EMPLOYER_ACCOUNT_REJECTED",
        "6ac746ac72aed3c70a82de5b",
        "1000",
      ),
      "EMPLOYER_ACCOUNT_REJECTED:6ac746ac72aed3c70a82de5b:1000",
    );
    assert.notEqual(
      whatsAppNotificationIdempotencyKey(
        "EMPLOYER_ACCOUNT_REJECTED",
        "6ac746ac72aed3c70a82de5b",
        "1000",
      ),
      whatsAppNotificationIdempotencyKey(
        "EMPLOYER_ACCOUNT_REJECTED",
        "6ac746ac72aed3c70a82de5b",
        "2000",
      ),
    );
  });
});
