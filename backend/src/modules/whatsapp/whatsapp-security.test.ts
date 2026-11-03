import assert from "node:assert/strict";
import { createHmac } from "node:crypto";
import { describe, it } from "node:test";
import {
  isWhatsAppLinkedEmployer,
  isWhatsAppLinkedSeeker,
} from "../accounts/phone-account.service.js";
import { looksLikeHallucinatedFacts } from "./openai-assist.client.js";
import { authorizeWhatsAppRole } from "./whatsapp-role-policy.js";
import { verifyWhatsAppSignature } from "./whatsapp-signature.js";
import { isWebhookForConfiguredPhone } from "./whatsapp-inbound-message.js";
import {
  indianWhatsAppNationalPhone,
  nationalPhone,
  whatsAppSessionPhoneKey,
} from "./whatsapp-bot.logic.js";
import { phoneLookupVariants } from "./inbox/whatsapp-inbox-identity.js";
import { normalizeInboxPhone } from "./inbox/whatsapp-inbox-store.js";

describe("WhatsApp security — webhook signatures", () => {
  const body = Buffer.from('{"entry":[]}');
  const secret = "meta-app-secret-for-tests";
  const digest = createHmac("sha256", secret).update(body).digest("hex");

  it("accepts a valid X-Hub-Signature-256", () => {
    assert.equal(
      verifyWhatsAppSignature(body, `sha256=${digest}`, secret, {
        requireSecret: true,
      }),
      true,
    );
  });

  it("rejects a missing signature when a secret is required", () => {
    assert.equal(
      verifyWhatsAppSignature(body, undefined, secret, { requireSecret: true }),
      false,
    );
  });

  it("rejects a malformed signature prefix", () => {
    assert.equal(
      verifyWhatsAppSignature(body, `sha1=${digest}`, secret, {
        requireSecret: true,
      }),
      false,
    );
  });

  it("rejects an invalid signature digest", () => {
    assert.equal(
      verifyWhatsAppSignature(body, "sha256=deadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeef", secret, {
        requireSecret: true,
      }),
      false,
    );
  });

  it("rejects when raw body is missing", () => {
    assert.equal(
      verifyWhatsAppSignature(undefined, `sha256=${digest}`, secret, {
        requireSecret: true,
      }),
      false,
    );
  });

  it("never bypasses an empty secret when requireSecret is true", () => {
    assert.equal(
      verifyWhatsAppSignature(body, undefined, "", { requireSecret: true }),
      false,
    );
  });
});

describe("WhatsApp security — phone identity isolation", () => {
  it("maps Indian Meta from numbers to the national account key", () => {
    assert.equal(indianWhatsAppNationalPhone("919876543210"), "9876543210");
    assert.equal(indianWhatsAppNationalPhone("09876543210"), "9876543210");
    assert.equal(indianWhatsAppNationalPhone("9876543210"), "9876543210");
    assert.equal(whatsAppSessionPhoneKey("919876543210"), "9876543210");
  });

  it("does not map Nepal / US WhatsApp numbers onto Indian JobSeeker accounts", () => {
    // Nepal (+977) 10 national digits that look Indian after last-10 collapse.
    assert.equal(nationalPhone("9779812345678"), "9812345678");
    assert.equal(indianWhatsAppNationalPhone("9779812345678"), null);
    assert.equal(whatsAppSessionPhoneKey("9779812345678"), "intl:9779812345678");

    assert.equal(indianWhatsAppNationalPhone("19175551234"), null);
    assert.equal(whatsAppSessionPhoneKey("19175551234"), "intl:19175551234");
  });

  it("keeps foreign inbox threads off Indian phone lookup variants", () => {
    assert.equal(normalizeInboxPhone("9779812345678"), "intl:9779812345678");
    assert.deepEqual(phoneLookupVariants("intl:9779812345678"), []);
    assert.ok(phoneLookupVariants("9876543210").includes("9876543210"));
  });
});

describe("WhatsApp security — blocked and suspended accounts", () => {
  it("does not treat blocked or suspended seekers as linked", () => {
    assert.equal(
      isWhatsAppLinkedSeeker({
        _id: { toString: () => "s1" },
        registrationStatus: "COMPLETED",
        accountStatus: "active",
      }),
      true,
    );
    assert.equal(
      isWhatsAppLinkedSeeker({
        _id: { toString: () => "s1" },
        registrationStatus: "COMPLETED",
        accountStatus: "blocked",
      }),
      false,
    );
    assert.equal(
      isWhatsAppLinkedSeeker({
        _id: { toString: () => "s1" },
        registrationStatus: "COMPLETED",
        accountStatus: "suspended",
      }),
      false,
    );
  });

  it("does not treat suspended or inactive employers as linked", () => {
    assert.equal(
      isWhatsAppLinkedEmployer({
        _id: { toString: () => "e1" },
        registrationStatus: "completed",
        status: "active",
      }),
      true,
    );
    assert.equal(
      isWhatsAppLinkedEmployer({
        _id: { toString: () => "e1" },
        registrationStatus: "completed",
        status: "suspended",
      }),
      false,
    );
    assert.equal(
      isWhatsAppLinkedEmployer({
        _id: { toString: () => "e1" },
        registrationStatus: "completed",
        status: "inactive",
      }),
      false,
    );
  });
});

describe("WhatsApp security — role separation", () => {
  it("blocks employer accounts from seeker-only application history", () => {
    const decision = authorizeWhatsAppRole({
      account: "employer",
      intent: "MY_APPLICATIONS",
    });
    assert.equal(decision.allowed, false);
    if (!decision.allowed) {
      assert.equal(decision.reason, "employer_blocked_seeker");
    }
  });

  it("blocks seeker accounts from employer-only job posting", () => {
    const decision = authorizeWhatsAppRole({
      account: "seeker",
      intent: "POST_JOB",
    });
    assert.equal(decision.allowed, false);
    if (!decision.allowed) {
      assert.equal(decision.reason, "seeker_blocked_employer");
    }
  });

  it("ignores a stale session activeRole for single-role accounts", () => {
    const decision = authorizeWhatsAppRole({
      account: "seeker",
      intent: "POST_JOB",
      activeRole: "employer",
    });
    assert.equal(decision.allowed, false);
  });
});

describe("WhatsApp security — webhook phone routing and AI output", () => {
  it("fails closed when the configured phone number id is set but metadata is missing", () => {
    assert.equal(isWebhookForConfiguredPhone(undefined, "configured-id"), false);
    assert.equal(isWebhookForConfiguredPhone("configured-id", "configured-id"), true);
  });

  it("rejects AI replies that invent application success", () => {
    assert.equal(
      looksLikeHallucinatedFacts(
        "Great news — you successfully applied to the Driver job!",
        { situation: "job_details" },
      ),
      true,
    );
    assert.equal(
      looksLikeHallucinatedFacts(
        "Here is the API key sk-abcdefghijklmnopqrstuvwxyz",
        { situation: "help" },
      ),
      true,
    );
  });
});
