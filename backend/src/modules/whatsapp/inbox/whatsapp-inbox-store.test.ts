import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";
import {
  combinedInboxDisplayName,
  employerInboxName,
  registeredAccountStatusLabel,
  resolveEmployerInboxIdentity,
  phoneLookupVariants,
  seekerInboxName,
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
      customerServiceWindowState(new Date(Date.now() - 25 * 60 * 60 * 1000)),
      "expired",
    );
  });

  it("keeps both account names and flags ambiguous numbers", () => {
    assert.equal(
      combinedInboxDisplayName({
        ambiguous: false,
        employerName: "SR Enterprises",
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

describe("employer inbox name resolution", () => {
  it("shows company name first and contact person underneath for company accounts", () => {
    assert.deepEqual(
      resolveEmployerInboxIdentity({
        accountType: "company",
        companyName: "Liya logistics",
        firstName: "Mohammed",
        lastName: "Ibrahim",
      }),
      {
        primaryName: "Liya logistics",
        secondaryName: "Mohammed Ibrahim",
      },
    );
    assert.equal(
      employerInboxName({
        accountType: "company",
        companyName: "Liya logistics",
        firstName: "Mohammed",
        lastName: "Ibrahim",
      }),
      "Liya logistics",
    );
  });

  it("shows consultancy name first and contact person underneath", () => {
    assert.deepEqual(
      resolveEmployerInboxIdentity({
        accountType: "consultancy",
        companyName: "ABC Consultancy",
        firstName: "Ravi",
        lastName: "Kumar",
      }),
      {
        primaryName: "ABC Consultancy",
        secondaryName: "Ravi Kumar",
      },
    );
  });

  it("keeps an individual employer's registered personal name as the primary name", () => {
    assert.deepEqual(
      resolveEmployerInboxIdentity({
        accountType: "individual",
        establishmentName: "Sri Stores",
        firstName: "Lakshmi",
        lastName: "Rao",
      }),
      {
        primaryName: "Lakshmi Rao",
        secondaryName: "",
      },
    );
    assert.equal(
      employerInboxName({
        accountType: "individual",
        establishmentName: "Sri Stores",
        firstName: "Lakshmi",
        lastName: "Rao",
      }),
      "Lakshmi Rao",
    );
  });

  it("omits an empty secondary line when a company has no contact person", () => {
    assert.deepEqual(
      resolveEmployerInboxIdentity({
        accountType: "company",
        companyName: "Northwind Services",
        firstName: "",
        lastName: "",
      }),
      {
        primaryName: "Northwind Services",
        secondaryName: "",
      },
    );
  });

  it("falls back safely when company information is missing", () => {
    assert.deepEqual(
      resolveEmployerInboxIdentity({
        accountType: "company",
        companyName: "",
        establishmentName: "",
        firstName: "Asha",
        lastName: "Rao",
      }),
      {
        primaryName: "Asha Rao",
        secondaryName: "",
      },
    );
    assert.deepEqual(
      resolveEmployerInboxIdentity({
        accountType: "consultancy",
        companyName: "",
        establishmentName: "Local Desk",
        firstName: "Asha",
        lastName: "Rao",
      }),
      {
        primaryName: "Local Desk",
        secondaryName: "Asha Rao",
      },
    );
  });

  it("does not repeat identical company and contact-person names", () => {
    assert.deepEqual(
      resolveEmployerInboxIdentity({
        accountType: "company",
        companyName: "Veeresh",
        firstName: "Veeresh",
        lastName: "",
      }),
      {
        primaryName: "Veeresh",
        secondaryName: "",
      },
    );
  });

  it("keeps punctuation inside company names instead of splitting them", () => {
    assert.deepEqual(
      resolveEmployerInboxIdentity({
        accountType: "company",
        companyName: "A.B.C. Tech-Works · Pvt. Ltd.",
        firstName: "Sita",
        lastName: "Devi",
      }),
      {
        primaryName: "A.B.C. Tech-Works · Pvt. Ltd.",
        secondaryName: "Sita Devi",
      },
    );
    assert.equal(
      employerInboxName({
        accountType: "company",
        companyName: "A.B.C. Tech-Works · Pvt. Ltd.",
        firstName: "Sita",
        lastName: "Devi",
      }).includes(" · Sita"),
      false,
    );
  });

  it("leaves job seeker names unchanged", () => {
    assert.equal(seekerInboxName("CHANDU"), "CHANDU");
    assert.equal(seekerInboxName("  veer  "), "veer");
    assert.equal(seekerInboxName(undefined), "");
  });

  it("uses the same identity helper for header and contact details", () => {
    const source = readFileSync(
      new URL(
        "../../operations/whatsapp-inbox/operations-whatsapp-inbox.service.ts",
        import.meta.url,
      ),
      "utf8",
    );
    assert.equal(source.includes("resolveEmployerInboxIdentity"), true);
    assert.equal(source.includes("secondaryDisplayName"), true);
    const panel = readFileSync(
      new URL(
        "../../../../../admin/src/components/operations/inbox/InboxContactPanel.tsx",
        import.meta.url,
      ),
      "utf8",
    );
    const chat = readFileSync(
      new URL(
        "../../../../../admin/src/components/operations/inbox/InboxChatPanel.tsx",
        import.meta.url,
      ),
      "utf8",
    );
    assert.equal(panel.includes("contactPerson"), true);
    assert.equal(panel.includes("secondaryDisplayName"), true);
    assert.equal(chat.includes("secondaryDisplayName"), true);
    assert.equal(panel.includes("split(\"·\")"), false);
    assert.equal(chat.includes("split(\"·\")"), false);
  });
});
