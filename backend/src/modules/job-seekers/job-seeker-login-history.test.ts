import assert from "node:assert/strict";
import { afterEach, describe, it, mock } from "node:test";
import mongoose from "mongoose";
import { EmployerModel } from "../employers/employer.model.js";
import { OperationsAuditLogModel } from "../operations/rbac/operations-audit-log.model.js";
import { OperationsNotificationModel } from "../operations/registration-awareness/operations-notification.model.js";
import { otpService } from "../otp/otp.service.js";
import { resumeService } from "../resumes/resume.service.js";
import { jobseekerAccountCreatedWhatsApp } from "../whatsapp/notifications/jobseeker-account-created.notification.js";
import { JobSeekerProfileCompletionReminderModel } from "../whatsapp/notifications/jobseeker-profile-completion-reminder.model.js";
import { JobSeekerModel } from "./job-seeker.model.js";
import { jobSeekerService } from "./job-seeker.service.js";
import { JobSeekerLoginEventModel } from "./job-seeker-login-event.model.js";
import {
  buildJobSeekerLoginDedupeKey,
  recordJobSeekerLogin,
  summarizeUserAgent,
} from "./job-seeker-login-history.js";
import { jobSeekerLoginService } from "./job-seeker-login.service.js";

const jobSeekerId = "64f0000000000000000000cc";
const ANDROID_CHROME =
  "Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Mobile Safari/537.36";

function queryResult<T>(value: T) {
  const promise = Promise.resolve(value);
  return {
    select() {
      return this;
    },
    lean() {
      return promise;
    },
    then(
      onFulfilled: (value: T) => unknown,
      onRejected?: (reason: unknown) => unknown,
    ) {
      return promise.then(onFulfilled, onRejected);
    },
  };
}

function verifiedSeeker(overrides: Record<string, unknown> = {}) {
  return {
    _id: new mongoose.Types.ObjectId(jobSeekerId),
    fullName: "Asha Rao",
    whatsappNumber: "9876543210",
    isWhatsappVerified: true,
    registrationStatus: "COMPLETED",
    accountStatus: "active",
    otpHash: "$2a$10$consumedOtpHashValue",
    otpExpiresAt: new Date(Date.now() + 60_000),
    otpAttempts: 0,
    refreshTokenHash: null as string | null,
    refreshTokenExpiresAt: null as Date | null,
    lastLoginAt: null as Date | null,
    async save() {
      return this;
    },
    ...overrides,
  };
}

type CreatedEvent = Record<string, unknown>;

function captureLoginEvents(options: { failWith?: unknown } = {}) {
  const created: CreatedEvent[] = [];
  const keys = new Set<string>();
  mock.method(JobSeekerLoginEventModel, "create", (async (doc: CreatedEvent) => {
    if (options.failWith) {
      throw options.failWith;
    }
    const key = `${String(doc.jobSeekerId)}:${String(doc.dedupeKey)}`;
    if (keys.has(key)) {
      throw Object.assign(new Error("E11000 duplicate key"), { code: 11000 });
    }
    keys.add(key);
    created.push(doc);
    return doc;
  }) as never);
  return created;
}

describe("summarizeUserAgent", () => {
  it("keeps only coarse browser, OS and device type", () => {
    assert.deepEqual(summarizeUserAgent(ANDROID_CHROME), {
      browser: "Chrome",
      os: "Android",
      deviceType: "mobile",
    });
    assert.deepEqual(
      summarizeUserAgent(
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36 Edg/130.0.0.0",
      ),
      { browser: "Edge", os: "Windows", deviceType: "desktop" },
    );
    assert.deepEqual(
      summarizeUserAgent(
        "Mozilla/5.0 (iPad; CPU OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1",
      ),
      { browser: "Safari", os: "iOS", deviceType: "tablet" },
    );
    assert.deepEqual(summarizeUserAgent(undefined), {
      browser: "",
      os: "",
      deviceType: "unknown",
    });
  });
});

describe("recordJobSeekerLogin", () => {
  afterEach(() => {
    mock.restoreAll();
  });

  it("stores only the id, time, method, client summary and a hashed key", async () => {
    const created = captureLoginEvents();
    const loggedInAt = new Date("2026-11-10T06:00:00.000Z");
    const result = await recordJobSeekerLogin({
      jobSeekerId,
      method: "whatsapp_otp",
      loggedInAt,
      challengeKey: "otp:$2a$10$secretOtpHash",
      userAgent: ANDROID_CHROME,
    });
    assert.equal(result, "recorded");
    assert.equal(created.length, 1);
    const [doc] = created;
    assert.deepEqual(Object.keys(doc ?? {}).sort(), [
      "client",
      "dedupeKey",
      "jobSeekerId",
      "loggedInAt",
      "method",
    ]);
    assert.equal(doc?.loggedInAt, loggedInAt);
    assert.match(String(doc?.dedupeKey), /^[a-f0-9]{64}$/);
    const serialized = JSON.stringify(doc);
    assert.ok(!serialized.includes("secretOtpHash"));
    assert.ok(!serialized.includes("Pixel 8"));
  });

  it("ignores a duplicate write for the same challenge", async () => {
    captureLoginEvents();
    const input = {
      jobSeekerId,
      method: "whatsapp_otp" as const,
      loggedInAt: new Date(),
      challengeKey: "otp:same",
    };
    assert.equal(await recordJobSeekerLogin(input), "recorded");
    assert.equal(await recordJobSeekerLogin(input), "duplicate");
  });

  it("never throws when the history write fails", async () => {
    captureLoginEvents({ failWith: new Error("db down") });
    mock.method(console, "error", () => undefined);
    assert.equal(
      await recordJobSeekerLogin({
        jobSeekerId,
        method: "registration_otp",
        loggedInAt: new Date(),
        challengeKey: "registration:x",
      }),
      "failed",
    );
  });

  it("scopes dedupe keys by method", () => {
    assert.equal(
      buildJobSeekerLoginDedupeKey("whatsapp_otp", "k"),
      buildJobSeekerLoginDedupeKey("whatsapp_otp", "k"),
    );
    assert.notEqual(
      buildJobSeekerLoginDedupeKey("whatsapp_otp", "k"),
      buildJobSeekerLoginDedupeKey("registration_otp", "k"),
    );
  });
});

describe("job seeker login history from OTP sign-in", () => {
  afterEach(() => {
    mock.restoreAll();
  });

  it("records one event after a successful OTP login", async () => {
    const created = captureLoginEvents();
    const seeker = verifiedSeeker();
    mock.method(JobSeekerModel, "findOne", () => queryResult(seeker));
    mock.method(otpService, "matchesTestOtp", () => false);
    mock.method(otpService, "verifyOtpHash", async () => true);

    const result = await jobSeekerLoginService.verifyLoginOtp(
      { whatsappNumber: "9876543210", otp: "654321" },
      { userAgent: ANDROID_CHROME },
    );

    assert.equal(created.length, 1);
    const [doc] = created;
    assert.equal(String(doc?.jobSeekerId), jobSeekerId);
    assert.equal(doc?.method, "whatsapp_otp");
    assert.equal(doc?.loggedInAt, seeker.lastLoginAt);
    assert.deepEqual(doc?.client, {
      browser: "Chrome",
      os: "Android",
      deviceType: "mobile",
    });
    const serialized = JSON.stringify(doc);
    for (const secret of [
      "654321",
      "consumedOtpHashValue",
      result.accessToken,
      result.refreshToken,
    ]) {
      assert.ok(!serialized.includes(secret));
    }
  });

  it("does not record a login when the OTP is invalid", async () => {
    const created = captureLoginEvents();
    mock.method(JobSeekerModel, "findOne", () => queryResult(verifiedSeeker()));
    mock.method(otpService, "matchesTestOtp", () => false);
    mock.method(otpService, "verifyOtpHash", async () => false);

    await assert.rejects(() =>
      jobSeekerLoginService.verifyLoginOtp({
        whatsappNumber: "9876543210",
        otp: "000000",
      }),
    );
    assert.equal(created.length, 0);
  });

  it("does not record a login for an expired OTP", async () => {
    const created = captureLoginEvents();
    mock.method(JobSeekerModel, "findOne", () =>
      queryResult(verifiedSeeker({ otpExpiresAt: new Date(Date.now() - 1000) })),
    );
    mock.method(otpService, "matchesTestOtp", () => false);

    await assert.rejects(() =>
      jobSeekerLoginService.verifyLoginOtp({
        whatsappNumber: "9876543210",
        otp: "654321",
      }),
    );
    assert.equal(created.length, 0);
  });

  it("records the registration sign-in once per account", async () => {
    const created = captureLoginEvents();
    const seeker = verifiedSeeker({
      registrationStatus: "PENDING",
      dateOfBirth: new Date("1995-01-01T00:00:00.000Z"),
      gender: "female",
      jobRole: "Cleaner",
      jobType: "full-time",
      workMode: "on-site",
      preferredJobLocation: "Hyderabad",
      expectedSalary: 15000,
      expectedSalaryPeriod: "per-month",
      operationsRegistrationAwareness: null,
      set(this: Record<string, unknown>, path: string, value: unknown) {
        this[path] = value;
      },
    });
    mock.method(JobSeekerModel, "findById", () => queryResult(seeker));
    mock.method(JobSeekerModel, "findOne", () => queryResult(null));
    mock.method(EmployerModel, "findOne", () => queryResult(null));
    mock.method(OperationsNotificationModel, "updateOne", async () => ({
      acknowledged: true,
    }));
    mock.method(OperationsAuditLogModel, "findOne", () =>
      queryResult({ _id: "audit" }),
    );
    mock.method(resumeService, "generateFromProfile", async () => undefined);
    mock.method(jobseekerAccountCreatedWhatsApp, "schedule", () => undefined);
    mock.method(
      JobSeekerProfileCompletionReminderModel,
      "updateOne",
      (async () => ({ modifiedCount: 0 })) as never,
    );

    await jobSeekerService.completeRegistration(
      jobSeekerId,
      {
        education: {
          level: "below_10th",
          schoolName: "City School",
          collegeName: "",
          instituteName: "",
          board: "",
          stream: "",
          trade: "",
          branch: "",
          degree: "",
          specialization: "",
          passingYear: "",
          percentage: "",
          cgpa: "",
        },
        experienceType: "fresher",
        experiences: [],
        languages: ["english"],
        availabilityStatus: "immediate",
      },
      { userAgent: ANDROID_CHROME },
    );

    assert.equal(created.length, 1);
    assert.equal(created[0]?.method, "registration_otp");
    assert.equal(created[0]?.loggedInAt, seeker.lastLoginAt);
    assert.ok(
      (seeker as { profileCompletedAt?: Date | null }).profileCompletedAt instanceof
        Date,
    );
  });

  it("records a retried callback for the same OTP challenge only once", async () => {
    const created = captureLoginEvents();
    mock.method(JobSeekerModel, "findOne", () => queryResult(verifiedSeeker()));
    mock.method(otpService, "matchesTestOtp", () => false);
    mock.method(otpService, "verifyOtpHash", async () => true);

    const input = { whatsappNumber: "9876543210", otp: "654321" };
    await jobSeekerLoginService.verifyLoginOtp(input);
    await jobSeekerLoginService.verifyLoginOtp(input);
    assert.equal(created.length, 1);
  });
});
