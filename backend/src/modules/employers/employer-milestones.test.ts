import assert from "node:assert/strict";
import { afterEach, describe, it, mock } from "node:test";
import mongoose from "mongoose";
import { JobSeekerModel } from "../job-seekers/job-seeker.model.js";
import { otpService } from "../otp/otp.service.js";
import { EmployerProfileCompletionReminderModel } from "../whatsapp/notifications/employer-profile-completion-reminder.model.js";
import {
  markEmployerProfileComplete,
  markEmployerWhatsappVerified,
} from "./employer-milestones.js";
import { EmployerModel } from "./employer.model.js";
import { employerService } from "./employer.service.js";

const first = new Date("2026-11-01T05:00:00.000Z");
const later = new Date("2026-11-05T05:00:00.000Z");

describe("employer WhatsApp verification timestamp", () => {
  it("records the time of the first verification", () => {
    const employer = { isWhatsappVerified: false, whatsappVerifiedAt: null as Date | null };
    markEmployerWhatsappVerified(employer, first);
    assert.equal(employer.isWhatsappVerified, true);
    assert.equal(employer.whatsappVerifiedAt, first);
  });

  it("keeps the original date when verification repeats", () => {
    const employer = { isWhatsappVerified: false, whatsappVerifiedAt: first as Date | null };
    markEmployerWhatsappVerified(employer, later);
    assert.equal(employer.whatsappVerifiedAt, first);
  });

  it("does not invent a date for numbers verified before tracking", () => {
    const employer = { isWhatsappVerified: true, whatsappVerifiedAt: null as Date | null };
    markEmployerWhatsappVerified(employer, later);
    assert.equal(employer.whatsappVerifiedAt, null);
  });
});

describe("employer profile completion timestamp", () => {
  it("records the first incomplete → complete transition", () => {
    const employer = { isProfileComplete: false, profileCompletedAt: null as Date | null };
    assert.equal(markEmployerProfileComplete(employer, first), true);
    assert.equal(employer.isProfileComplete, true);
    assert.equal(employer.profileCompletedAt, first);
  });

  it("never moves the date on resubmission or after a reset", () => {
    const employer = { isProfileComplete: false, profileCompletedAt: first as Date | null };
    assert.equal(markEmployerProfileComplete(employer, later), false);
    assert.equal(employer.profileCompletedAt, first);
  });

  it("leaves legacy completed profiles without a date", () => {
    const employer = { isProfileComplete: true, profileCompletedAt: null as Date | null };
    assert.equal(markEmployerProfileComplete(employer, later), false);
    assert.equal(employer.profileCompletedAt, null);
  });
});

describe("employer service milestones", () => {
  afterEach(() => {
    mock.restoreAll();
  });

  function emptyFindOne() {
    return { select: () => ({ lean: async () => null }) };
  }

  function stubOtpVerification(valid: boolean) {
    mock.method(EmployerModel, "findOne", emptyFindOne);
    mock.method(JobSeekerModel, "findOne", emptyFindOne);
    mock.method(otpService, "matchesTestOtp", () => false);
    mock.method(otpService, "verifyOtpHash", async () => valid);
    mock.method(otpService, "logVerificationSuccess", () => undefined);
    mock.method(otpService, "logVerificationFailure", () => undefined);
    mock.method(EmployerProfileCompletionReminderModel, "updateOne", async () => ({
      upsertedCount: 1,
    }));
  }

  function pendingEmployer() {
    return {
      _id: new mongoose.Types.ObjectId("64f0000000000000000000ce"),
      accountType: "company" as const,
      companyName: "Acme",
      establishmentName: "",
      firstName: "Asha",
      lastName: "R",
      whatsappNumber: "9876543210",
      emailAddress: "",
      isWhatsappVerified: false,
      whatsappVerifiedAt: null as Date | null,
      isProfileComplete: false,
      registrationStatus: "pending_otp",
      otpHash: "hash" as string | null,
      otpExpiresAt: new Date(Date.now() + 5 * 60_000) as Date | null,
      otpAttempts: 0,
      async save() {
        return this;
      },
    };
  }

  it("saves whatsappVerifiedAt when registration OTP verification succeeds", async () => {
    const employer = pendingEmployer();
    mock.method(EmployerModel, "findById", () => ({ select: async () => employer }));
    stubOtpVerification(true);

    const before = Date.now();
    await employerService.verifyEmployerOtp({
      employerId: employer._id.toString(),
      otp: "123456",
    });

    assert.equal(employer.isWhatsappVerified, true);
    assert.ok(employer.whatsappVerifiedAt instanceof Date);
    assert.ok(employer.whatsappVerifiedAt.getTime() >= before);
  });

  it("does not record verification when the OTP is wrong", async () => {
    const employer = pendingEmployer();
    mock.method(EmployerModel, "findById", () => ({ select: async () => employer }));
    stubOtpVerification(false);

    await assert.rejects(
      employerService.verifyEmployerOtp({
        employerId: employer._id.toString(),
        otp: "000000",
      }),
    );
    assert.equal(employer.isWhatsappVerified, false);
    assert.equal(employer.whatsappVerifiedAt, null);
  });
});
