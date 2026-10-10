import assert from "node:assert/strict";
import { afterEach, describe, it, mock } from "node:test";
import mongoose from "mongoose";
import { EmployerModel } from "../../employers/employer.model.js";
import { JobSeekerModel } from "../../job-seekers/job-seeker.model.js";
import { jobSeekerService } from "../../job-seekers/job-seeker.service.js";
import { jobSeekerLoginService } from "../../job-seekers/job-seeker-login.service.js";
import { otpService } from "../../otp/otp.service.js";
import { resumeService } from "../../resumes/resume.service.js";
import { OperationsAuditLogModel } from "../../operations/rbac/operations-audit-log.model.js";
import { OperationsNotificationModel } from "../../operations/registration-awareness/operations-notification.model.js";
import { toWhatsAppCloudRecipient } from "../../../utils/whatsapp-phone.js";
import { jobseekerAccountCreatedWhatsApp } from "./jobseeker-account-created.notification.js";
import {
  buildWhatsAppNotificationBodyParameters,
  buildWhatsAppNotificationUrlButtonParameters,
  getWhatsAppNotificationTemplate,
  resolveWhatsAppNotificationLanguage,
} from "./whatsapp-notification.policy.js";
import { enqueueWhatsAppNotification } from "./whatsapp-notification.service.js";
import type { WhatsAppNotificationPayload } from "./whatsapp-notification.types.js";

const jobSeekerId = "64f0000000000000000000aa";
const seekerPhone = "9876543210";
const otherPhone = "9000000001";

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

function pendingSeeker(overrides: Record<string, unknown> = {}) {
  return {
    _id: new mongoose.Types.ObjectId(jobSeekerId),
    fullName: "Asha Rao",
    whatsappNumber: seekerPhone,
    isWhatsappVerified: true,
    registrationStatus: "PENDING",
    accountStatus: "active",
    dateOfBirth: new Date("1995-01-01T00:00:00.000Z"),
    gender: "female",
    jobRole: "Cleaner",
    jobType: "full-time",
    workMode: "on-site",
    preferredJobLocation: "Hyderabad",
    expectedSalary: 15000,
    expectedSalaryPeriod: "per-month",
    operationsRegistrationAwareness: null as { registeredAt?: Date } | null,
    otpHash: "hash",
    otpExpiresAt: new Date(Date.now() + 60_000),
    otpAttempts: 0,
    refreshTokenHash: "",
    refreshTokenExpiresAt: null as Date | null,
    lastLoginAt: null as Date | null,
    education: null,
    experienceType: undefined as string | undefined,
    languages: [] as string[],
    availabilityStatus: undefined as string | undefined,
    async save(this: { registrationStatus: string }) {
      return this;
    },
    set(this: Record<string, unknown>, path: string, value: unknown) {
      this[path] = value;
    },
    ...overrides,
  };
}

const completionInput = {
  education: {
    level: "below_10th" as const,
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
  experienceType: "fresher" as const,
  experiences: [],
  languages: ["english" as const],
  availabilityStatus: "immediate" as const,
};

function stubCompletionSideEffects(): void {
  mock.method(JobSeekerModel, "findOne", () => queryResult(null));
  mock.method(EmployerModel, "findOne", () => queryResult(null));
  mock.method(OperationsNotificationModel, "updateOne", async () => ({
    acknowledged: true,
  }));
  mock.method(OperationsAuditLogModel, "findOne", () => queryResult({ _id: "audit" }));
  mock.method(resumeService, "generateFromProfile", async () => undefined);
}

describe("jobseeker account created WhatsApp", () => {
  afterEach(() => {
    mock.restoreAll();
  });

  it("sends jobseeker_account_created after registration is completed", async () => {
    const seeker = pendingSeeker();
    const queued: Array<{
      templateName: string;
      languageCode: string;
      phoneNumber: string;
      bodyParameters: string[];
      urlButtonParameters?: string[];
      idempotencyKey: string;
      entityId: string;
    }> = [];
    mock.method(JobSeekerModel, "findById", () => queryResult(seeker));
    stubCompletionSideEffects();
    mock.method(
      jobseekerAccountCreatedWhatsApp,
      "enqueue",
      async (payload: WhatsAppNotificationPayload) => {
        assert.equal(seeker.registrationStatus, "COMPLETED");
        assert.notEqual(payload.phoneNumber, otherPhone);
        return enqueueWhatsAppNotification(payload, {
          claim: async () => "claimed",
          enqueueJob: async (job) => {
            queued.push(job);
          },
        });
      },
    );

    const result = await jobSeekerService.completeRegistration(
      jobSeekerId,
      completionInput,
    );
    await new Promise((resolve) => setTimeout(resolve, 20));

    assert.equal(result.jobSeeker.registrationStatus, "COMPLETED");
    assert.equal(queued.length, 1);
    assert.equal(queued[0]?.templateName, "jobseeker_account_created");
    assert.equal(queued[0]?.languageCode, "en");
    assert.equal(queued[0]?.phoneNumber, seekerPhone);
    assert.equal(toWhatsAppCloudRecipient(seekerPhone), `91${seekerPhone}`);
    assert.deepEqual(queued[0]?.bodyParameters, []);
    assert.equal(queued[0]?.urlButtonParameters, undefined);
    assert.equal(queued[0]?.entityId, jobSeekerId);
    assert.equal(
      queued[0]?.idempotencyKey,
      `JOBSEEKER_ACCOUNT_CREATED:${jobSeekerId}`,
    );
    assert.equal(
      getWhatsAppNotificationTemplate("JOBSEEKER_ACCOUNT_CREATED")?.templateName,
      "jobseeker_account_created",
    );
    assert.equal(
      resolveWhatsAppNotificationLanguage("JOBSEEKER_ACCOUNT_CREATED", "hi"),
      "en",
    );
    assert.deepEqual(
      buildWhatsAppNotificationBodyParameters("JOBSEEKER_ACCOUNT_CREATED", {
        event: "JOBSEEKER_ACCOUNT_CREATED",
        entityId: jobSeekerId,
        phoneNumber: seekerPhone,
        employerName: "Should not be sent",
      }),
      [],
    );
    assert.deepEqual(
      buildWhatsAppNotificationUrlButtonParameters("JOBSEEKER_ACCOUNT_CREATED", {
        event: "JOBSEEKER_ACCOUNT_CREATED",
        entityId: jobSeekerId,
        phoneNumber: seekerPhone,
      }),
      [],
    );
  });

  it("does not send when registration is not completed", async () => {
    let queued = 0;
    mock.method(jobseekerAccountCreatedWhatsApp, "schedule", () => {
      queued += 1;
    });

    const unverified = pendingSeeker({ isWhatsappVerified: false });
    mock.method(JobSeekerModel, "findById", () => queryResult(unverified));
    await assert.rejects(() =>
      jobSeekerService.completeRegistration(jobSeekerId, completionInput),
    );
    assert.equal(unverified.registrationStatus, "PENDING");

    const incomplete = pendingSeeker({ jobRole: "" });
    mock.method(JobSeekerModel, "findById", () => queryResult(incomplete));
    await assert.rejects(() =>
      jobSeekerService.completeRegistration(jobSeekerId, completionInput),
    );
    assert.equal(incomplete.registrationStatus, "PENDING");

    const completed = pendingSeeker({ registrationStatus: "COMPLETED" });
    mock.method(JobSeekerModel, "findById", () => queryResult(completed));
    await assert.rejects(() =>
      jobSeekerService.completeRegistration(jobSeekerId, completionInput),
    );

    const failingSave = pendingSeeker({
      async save() {
        throw new Error("database unavailable");
      },
    });
    mock.method(JobSeekerModel, "findById", () => queryResult(failingSave));
    stubCompletionSideEffects();
    await assert.rejects(() =>
      jobSeekerService.completeRegistration(jobSeekerId, completionInput),
    );
    assert.equal(failingSave.registrationStatus, "COMPLETED");
    assert.equal(queued, 0);

    await assert.rejects(() =>
      jobSeekerService.registerJobSeeker({
        fullName: "Asha Rao",
        whatsappNumber: "123",
      }),
    );
    assert.equal(queued, 0);
  });

  it("does not send during OTP verification or an existing account login", async () => {
    let queued = 0;
    mock.method(jobseekerAccountCreatedWhatsApp, "schedule", () => {
      queued += 1;
    });
    mock.method(otpService, "verifyOtpHash", async () => true);
    mock.method(JobSeekerModel, "findOne", () => queryResult(null));
    mock.method(EmployerModel, "findOne", () => queryResult(null));

    const registering = pendingSeeker({ isWhatsappVerified: false });
    mock.method(JobSeekerModel, "findById", () => queryResult(registering));
    const verified = await jobSeekerService.verifyOtp({
      jobSeekerId,
      otp: "123456",
    });
    assert.equal(verified.jobSeeker.registrationStatus, "PENDING");
    assert.equal(verified.jobSeeker.isWhatsappVerified, true);
    assert.equal(queued, 0);

    const existing = pendingSeeker({
      registrationStatus: "COMPLETED",
      isWhatsappVerified: true,
    });
    mock.method(JobSeekerModel, "findOne", () => queryResult(existing));
    const login = await jobSeekerLoginService.verifyLoginOtp({
      whatsappNumber: seekerPhone,
      otp: "123456",
    });
    assert.equal(login.jobSeeker.registrationStatus, "COMPLETED");
    assert.equal(queued, 0);
  });

  it("does not send a second message for the same jobseeker", async () => {
    const seeker = pendingSeeker();
    let queued = 0;
    mock.method(JobSeekerModel, "findById", () => queryResult(seeker));
    stubCompletionSideEffects();
    mock.method(
      jobseekerAccountCreatedWhatsApp,
      "enqueue",
      async (payload: WhatsAppNotificationPayload) =>
        enqueueWhatsAppNotification(payload, {
          claim: async () => "duplicate",
          enqueueJob: async () => {
            queued += 1;
          },
        }),
    );

    await jobSeekerService.completeRegistration(jobSeekerId, completionInput);
    await assert.rejects(() =>
      jobSeekerService.completeRegistration(jobSeekerId, completionInput),
    );
    await new Promise((resolve) => setTimeout(resolve, 20));
    assert.equal(queued, 0);
    assert.equal(seeker.registrationStatus, "COMPLETED");
  });

  it("keeps the completed account when WhatsApp delivery fails", async () => {
    const seeker = pendingSeeker();
    mock.method(JobSeekerModel, "findById", () => queryResult(seeker));
    stubCompletionSideEffects();
    mock.method(jobseekerAccountCreatedWhatsApp, "enqueue", async () => {
      throw new Error("meta unavailable");
    });

    const result = await jobSeekerService.completeRegistration(
      jobSeekerId,
      completionInput,
    );
    await new Promise((resolve) => setTimeout(resolve, 20));
    assert.equal(seeker.registrationStatus, "COMPLETED");
    assert.equal(result.jobSeeker.whatsappNumber, seekerPhone);
    assert.equal(typeof result.accessToken, "string");
  });

  it("skips a missing or invalid WhatsApp number without sending", async () => {
    let queued = 0;
    mock.method(jobseekerAccountCreatedWhatsApp, "enqueue", async () => {
      queued += 1;
      return "queued" as const;
    });

    jobseekerAccountCreatedWhatsApp.schedule({
      jobSeekerId,
      phoneNumber: "   ",
    });
    jobseekerAccountCreatedWhatsApp.schedule({
      jobSeekerId,
      phoneNumber: "12345",
    });

    const invalid = pendingSeeker({ whatsappNumber: "12345" });
    mock.method(JobSeekerModel, "findById", () => queryResult(invalid));
    stubCompletionSideEffects();
    await assert.rejects(() =>
      jobSeekerService.completeRegistration(jobSeekerId, completionInput),
    );
    assert.equal(invalid.registrationStatus, "PENDING");
    await new Promise((resolve) => setTimeout(resolve, 20));
    assert.equal(queued, 0);
  });
});
