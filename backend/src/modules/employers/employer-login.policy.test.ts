import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";
import { fileURLToPath } from "node:url";
import { isEmployerEligibleForLogin } from "./employer-login.policy.js";

describe("isEmployerEligibleForLogin", () => {
  it("allows a company employer after OTP verify with an incomplete profile", () => {
    assert.equal(
      isEmployerEligibleForLogin({
        status: "active",
        isWhatsappVerified: true,
        registrationStatus: "otp_verified",
      }),
      true,
    );
  });

  it("allows document-uploaded and profile-incomplete employers to finish onboarding", () => {
    assert.equal(
      isEmployerEligibleForLogin({
        isWhatsappVerified: true,
        registrationStatus: "document_uploaded",
      }),
      true,
    );
    assert.equal(
      isEmployerEligibleForLogin({
        isWhatsappVerified: true,
        registrationStatus: "profile_incomplete",
      }),
      true,
    );
  });

  it("allows fully completed employers", () => {
    assert.equal(
      isEmployerEligibleForLogin({
        status: "active",
        isWhatsappVerified: true,
        registrationStatus: "completed",
      }),
      true,
    );
  });

  it("rejects unverified or pre-OTP registration", () => {
    assert.equal(
      isEmployerEligibleForLogin({
        isWhatsappVerified: false,
        registrationStatus: "otp_verified",
      }),
      false,
    );
    assert.equal(
      isEmployerEligibleForLogin({
        isWhatsappVerified: true,
        registrationStatus: "pending_otp",
      }),
      false,
    );
    assert.equal(
      isEmployerEligibleForLogin({
        isWhatsappVerified: true,
        registrationStatus: "otp_sent",
      }),
      false,
    );
  });

  it("is used by employer login send/verify OTP lookup", () => {
    const source = readFileSync(
      fileURLToPath(new URL("./employer-login.service.ts", import.meta.url)),
      "utf8",
    );
    assert.match(source, /isEmployerEligibleForLogin/);
    assert.doesNotMatch(
      source,
      /employer\.registrationStatus === "completed"/,
    );
  });

  it("rejects suspended and inactive accounts", () => {
    assert.equal(
      isEmployerEligibleForLogin({
        status: "suspended",
        isWhatsappVerified: true,
        registrationStatus: "otp_verified",
      }),
      false,
    );
    assert.equal(
      isEmployerEligibleForLogin({
        status: "inactive",
        isWhatsappVerified: true,
        registrationStatus: "completed",
      }),
      false,
    );
    assert.equal(
      isEmployerEligibleForLogin({
        status: "deactivated",
        isWhatsappVerified: true,
        registrationStatus: "otp_verified",
      }),
      false,
    );
  });
});
