import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";
import { fileURLToPath } from "node:url";
import {
  canOfferVerificationSubmit,
  employerVerificationSubmitErrors,
} from "./employer-verification-submit";

const readyIndividual = {
  accountType: "individual",
  isWhatsappVerified: true,
  verificationStatus: "pending",
  registrationStatus: "otp_verified",
  establishmentName: "Veeresh",
  firstName: "Veeresh",
  lastName: "Telugu",
  companyAddress: "Madhapur",
  pincode: "500081",
  city: "Hyderabad",
  state: "Telangana",
};

function readSource(relativePath: string): string {
  return readFileSync(
    fileURLToPath(new URL(relativePath, import.meta.url)),
    "utf8",
  );
}

describe("Submit for Verification", () => {
  it("blocks submission until required details and a document exist", () => {
    const errors = employerVerificationSubmitErrors(
      { ...readyIndividual, companyAddress: "" },
      0,
    );
    assert.ok(errors.includes("Upload the required verification document."));
    assert.ok(errors.includes("Address is required."));
    assert.deepEqual(employerVerificationSubmitErrors(readyIndividual, 1), []);
  });

  it("offers the button only before the first completed submission", () => {
    assert.equal(canOfferVerificationSubmit(readyIndividual), true);
    assert.equal(
      canOfferVerificationSubmit({
        ...readyIndividual,
        registrationStatus: "completed",
      }),
      false,
    );
    assert.equal(
      canOfferVerificationSubmit({
        ...readyIndividual,
        verificationStatus: "rejected",
      }),
      false,
    );
    assert.equal(
      canOfferVerificationSubmit({
        ...readyIndividual,
        verificationStatus: "verified",
      }),
      false,
    );
  });

  it("keeps the reminder CTA on the company profile and the 30-minute delay", () => {
    const policy = readSource(
      "../../../backend/src/modules/whatsapp/notifications/whatsapp-notification.policy.ts",
    );
    const constants = readSource(
      "../../../backend/src/modules/whatsapp/notifications/whatsapp-notification.constants.ts",
    );
    const envSource = readSource("../../../backend/src/config/env.ts");
    const reminder = readSource(
      "../../../backend/src/modules/whatsapp/notifications/employer-profile-completion-reminder.service.ts",
    );
    assert.match(policy, /https:\/\/www\.aslijobs\.com\/employer\/company-profile/);
    assert.match(constants, /templateName: "employer_profile_completion_required"/);
    assert.match(
      envSource,
      /EMPLOYER_PROFILE_COMPLETION_REMINDER_DELAY_MINUTES:[\s\S]*?\.default\(30\)/,
    );
    assert.match(reminder, /EMPLOYER_PROFILE_COMPLETION_REMINDER_DELAY_MINUTES/);
  });

  it("submits through the first-time verification endpoint", () => {
    const page = readSource(
      "../components/employer-profile/EmployerProfilePageContent.tsx",
    );
    const service = readSource("../services/employer-profile.service.ts");
    assert.match(page, /Submit for Verification/);
    assert.match(page, /submitEmployerVerification/);
    assert.match(service, /\/employers\/me\/verification\/submit/);
    assert.equal(page.includes('verificationStatus = "pending"'), false);
  });
});
