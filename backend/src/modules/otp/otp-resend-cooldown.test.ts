import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { otpService } from "./otp.service.js";

describe("OTP resend cooldown", () => {
  it("allows a login OTP after the registration code was verified", () => {
    assert.equal(
      otpService.shouldEnforceResendCooldown({
        otpHash: null,
        otpExpiresAt: new Date(Date.now() + 60_000),
        lastOtpSentAt: new Date(),
        save: async () => undefined,
      }),
      false,
    );
  });

  it("still waits while an unused OTP is active", () => {
    assert.equal(
      otpService.shouldEnforceResendCooldown({
        otpHash: "pending-hash",
        otpExpiresAt: new Date(Date.now() + 60_000),
        lastOtpSentAt: new Date(),
        save: async () => undefined,
      }),
      true,
    );
  });

  it("allows a new OTP after the previous code expired", () => {
    assert.equal(
      otpService.shouldEnforceResendCooldown({
        otpHash: "expired-hash",
        otpExpiresAt: new Date(Date.now() - 1_000),
        lastOtpSentAt: new Date(),
        save: async () => undefined,
      }),
      false,
    );
  });
});
