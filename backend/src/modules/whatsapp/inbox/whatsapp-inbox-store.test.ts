import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";
import {
  combinedInboxDisplayName,
  employerInboxName,
  phoneLookupVariants,
  registeredAccountStatusLabel,
} from "./whatsapp-inbox-identity.js";
import {
  WHATSAPP_VERIFICATION_CODE_SENT,
  inboxTextContainsSecret,
} from "./whatsapp-inbox-redaction.js";
import {
  customerServiceWindowState,
  isInsideCustomerServiceWindow,
  normalizeInboxPhone,
} from "./whatsapp-inbox-store.js";

describe("whatsapp inbox store helpers", () => {
  it("normalizes cloud recipients to 10-digit national numbers", () => {
    assert.equal(normalizeInboxPhone("919876543210"), "9876543210");
    assert.equal(normalizeInboxPhone("9876543210"), "9876543210");
  });

  it("enforces the 24-hour customer service window", () => {
    assert.equal(customerServiceWindowState(null), "none");
    assert.equal(customerServiceWindowState(undefined), "none");
    assert.equal(isInsideCustomerServiceWindow(null), false);
    assert.equal(
      isInsideCustomerServiceWindow(new Date(Date.now() - 60 * 60 * 1000)),
      true,
    );
    assert.equal(
      isInsideCustomerServiceWindow(
        new Date(Date.now() - 25 * 60 * 60 * 1000),
      ),
      false,
    );
    assert.equal(
      customerServiceWindowState(new Date(Date.now() - 60 * 60 * 1000)),
      "open",
    );
    assert.equal(
      customerServiceWindowState(new Date(Date.now() - 25 * 60 * 60 * 1000)),
      "expired",
    );
  });

  it("names individual employers from the shop and contact person", () => {
    assert.equal(
      employerInboxName({
        accountType: "individual",
        establishmentName: "Sri Stores",
        firstName: "Lakshmi",
        lastName: "Rao",
      }),
      "Sri Stores · Lakshmi Rao",
    );
    assert.equal(
      employerInboxName({
        accountType: "company",
        companyName: "SR Enterprises",
        firstName: "Ravi",
        lastName: "Kumar",
      }),
      "SR Enterprises · Ravi Kumar",
    );
  });

  it("keeps both account names and flags ambiguous numbers", () => {
    assert.equal(
      combinedInboxDisplayName({
        ambiguous: false,
        employerName: "SR Enterprises · Ravi Kumar",
        seekerName: "Ravi Kumar",
        phoneNational: "9876543210",
      }),
      "SR Enterprises · Ravi Kumar",
    );
    assert.equal(
      combinedInboxDisplayName({
        ambiguous: false,
        employerName: "Sri Stores",
        seekerName: "Lakshmi Rao",
        phoneNational: "9876543210",
      }),
      "Sri Stores · Lakshmi Rao",
    );
    assert.equal(
      combinedInboxDisplayName({
        ambiguous: true,
        employerName: "SR Enterprises",
        seekerName: "Ravi Kumar",
        phoneNational: "9876543210",
      }),
      "Multiple accounts share this number",
    );
  });

  it("labels registration state from stored account fields", () => {
    assert.equal(
      registeredAccountStatusLabel({
        participantType: "job_seeker",
        registrationStatus: "COMPLETED",
      }),
      "Registered",
    );
    assert.equal(
      registeredAccountStatusLabel({
        participantType: "employer",
        registrationStatus: "pending_otp",
        verificationStatus: "pending",
      }),
      "OTP pending",
    );
  });

  it("matches phone numbers stored with or without a country code", () => {
    assert.deepEqual(phoneLookupVariants("919876543210"), [
      "9876543210",
      "919876543210",
      "+919876543210",
      "09876543210",
    ]);
  });

  it("represents OTP sends without the verification code", () => {
    assert.equal(inboxTextContainsSecret(WHATSAPP_VERIFICATION_CODE_SENT, ["482913"]), false);
    assert.equal(/\d{4,}/.test(WHATSAPP_VERIFICATION_CODE_SENT), false);
    assert.equal(
      inboxTextContainsSecret("code 482913", ["482913"]),
      true,
    );
  });

  it("persists inbound WhatsApp messages before acknowledging the webhook", () => {
    const source = readFileSync(
      new URL("../whatsapp-webhook.controller.ts", import.meta.url),
      "utf8",
    );
    const persist = source.indexOf("persistInboundMessages(body)");
    const ack = source.indexOf("res.sendStatus(200)");
    assert.equal(source.includes("describeInboundWhatsAppMessage(message)"), true);
    assert.ok(persist > 0);
    assert.ok(ack > persist);
    assert.equal(source.includes("recordInboundUserMessage({"), true);
    assert.equal(source.includes("inbox persist failed reason="), false);
  });
});
