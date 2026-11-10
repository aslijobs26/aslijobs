import assert from "node:assert/strict";
import { afterEach, describe, it, mock } from "node:test";
import mongoose from "mongoose";
import { otpService } from "../otp/otp.service.js";
import { EmployerLoginEventModel } from "./employer-login-event.model.js";
import { recordEmployerLogin } from "./employer-login-history.js";
import { employerLoginService } from "./employer-login.service.js";
import { EmployerModel } from "./employer.model.js";

const employerId = "64f0000000000000000000de";
const chromeOnWindows =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Safari/537.36";

function captureCreates() {
  const rows: Array<Record<string, unknown>> = [];
  mock.method(EmployerLoginEventModel, "create", async (row: Record<string, unknown>) => {
    rows.push(row);
    return row;
  });
  return rows;
}

describe("recordEmployerLogin", () => {
  afterEach(() => {
    mock.restoreAll();
  });

  it("stores only the id, time, method, client summary and a hashed key", async () => {
    const rows = captureCreates();
    const loggedInAt = new Date("2026-11-09T10:00:00.000Z");

    const result = await recordEmployerLogin({
      employerId,
      method: "whatsapp_otp",
      loggedInAt,
      challengeKey: "otp:secret-hash",
      userAgent: chromeOnWindows,
    });

    assert.equal(result, "recorded");
    assert.equal(rows.length, 1);
    const row = rows[0]!;
    assert.deepEqual(Object.keys(row).sort(), [
      "client",
      "dedupeKey",
      "employerId",
      "loggedInAt",
      "method",
    ]);
    assert.deepEqual(row.client, { browser: "Chrome", os: "Windows", deviceType: "desktop" });
    assert.match(String(row.dedupeKey), /^[a-f0-9]{64}$/);
    assert.ok(!String(row.dedupeKey).includes("secret-hash"));
  });

  it("ignores a duplicate write for the same challenge", async () => {
    mock.method(EmployerLoginEventModel, "create", async () => {
      throw Object.assign(new Error("dup"), { code: 11000 });
    });
    const result = await recordEmployerLogin({
      employerId,
      method: "registration_otp",
      loggedInAt: new Date(),
      challengeKey: `registration:${employerId}`,
    });
    assert.equal(result, "duplicate");
  });

  it("never throws when the history write fails", async () => {
    mock.method(console, "error", () => undefined);
    mock.method(EmployerLoginEventModel, "create", async () => {
      throw new Error("db down");
    });
    const result = await recordEmployerLogin({
      employerId,
      method: "whatsapp_otp",
      loggedInAt: new Date(),
      challengeKey: "otp:x",
    });
    assert.equal(result, "failed");
  });
});

describe("employer login history from OTP sign-in", () => {
  afterEach(() => {
    mock.restoreAll();
  });

  function loginEmployer() {
    return {
      _id: new mongoose.Types.ObjectId(employerId),
      accountType: "company",
      companyName: "Acme",
      firstName: "Asha",
      lastName: "R",
      whatsappNumber: "9876543210",
      status: "active",
      isWhatsappVerified: true,
      isProfileComplete: true,
      registrationStatus: "completed",
      verificationStatus: "verified",
      otpHash: "issued-otp-hash" as string | null,
      otpExpiresAt: new Date(Date.now() + 60_000) as Date | null,
      otpAttempts: 0,
      lastLoginAt: null as Date | null,
      save: async () => undefined,
    };
  }

  function mockLookup(employer: ReturnType<typeof loginEmployer>) {
    mock.method(EmployerModel, "find", () => ({
      select: () => ({ sort: () => ({ limit: async () => [employer] }) }),
    }));
    mock.method(otpService, "matchesTestOtp", () => false);
    mock.method(otpService, "logVerificationSuccess", () => undefined);
    mock.method(otpService, "logVerificationFailure", () => undefined);
  }

  it("records one event after a successful OTP login", async () => {
    const employer = loginEmployer();
    mockLookup(employer);
    mock.method(otpService, "verifyOtpHash", async () => true);
    const rows = captureCreates();

    await employerLoginService.verifyLoginOtp(
      { whatsappNumber: "9876543210", otp: "123456" },
      { userAgent: chromeOnWindows },
    );

    assert.equal(rows.length, 1);
    assert.equal(rows[0]?.method, "whatsapp_otp");
    assert.equal(rows[0]?.loggedInAt, employer.lastLoginAt);
    assert.equal(String(rows[0]?.employerId), employerId);
  });

  it("does not record a login when the OTP is invalid", async () => {
    const employer = loginEmployer();
    mockLookup(employer);
    mock.method(otpService, "verifyOtpHash", async () => false);
    const rows = captureCreates();

    await assert.rejects(
      employerLoginService.verifyLoginOtp({ whatsappNumber: "9876543210", otp: "000000" }),
    );
    assert.equal(rows.length, 0);
  });

  it("uses the consumed OTP as the dedupe challenge so retries map to one key", async () => {
    const keys: string[] = [];
    mock.method(EmployerLoginEventModel, "create", async (row: { dedupeKey: string }) => {
      keys.push(row.dedupeKey);
      return row;
    });
    for (let attempt = 0; attempt < 2; attempt += 1) {
      const employer = loginEmployer();
      mockLookup(employer);
      mock.method(otpService, "verifyOtpHash", async () => true);
      await employerLoginService.verifyLoginOtp({ whatsappNumber: "9876543210", otp: "123456" });
    }
    assert.equal(keys.length, 2);
    assert.equal(keys[0], keys[1]);
  });
});
