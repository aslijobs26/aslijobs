import assert from "node:assert/strict";
import { afterEach, describe, it, mock } from "node:test";
import mongoose from "mongoose";
import { EmployerModel } from "./employer.model.js";
import { employerService } from "./employer.service.js";
import { otpService } from "../otp/otp.service.js";
import { JobSeekerModel } from "../job-seekers/job-seeker.model.js";
import { EmployerProfileCompletionReminderModel } from "../whatsapp/notifications/employer-profile-completion-reminder.model.js";

const employerId = "64f0000000000000000000cc";

function emptyFindOne() {
  return {
    select: () => ({
      lean: async () => null,
    }),
  };
}

describe("Company Profile OTP verification schedules reminder", () => {
  afterEach(() => {
    mock.restoreAll();
  });

  it("TEST A: company employer OTP verify with incomplete profile schedules the reminder", async () => {
    const employer = {
      _id: new mongoose.Types.ObjectId(employerId),
      accountType: "company" as const,
      companyName: "Veeresh",
      establishmentName: "",
      firstName: "Veeresh",
      lastName: "K",
      whatsappNumber: "9876543210",
      emailAddress: "veeresh@example.com",
      isWhatsappVerified: false,
      isProfileComplete: false,
      registrationStatus: "pending_otp",
      otpHash: "hash" as string | null,
      otpExpiresAt: new Date(Date.now() + 5 * 60_000) as Date | null,
      otpAttempts: 0,
      async save() {
        this.isWhatsappVerified = true;
        this.registrationStatus = "otp_verified";
        this.isProfileComplete = false;
        this.otpHash = null;
        this.otpExpiresAt = null;
        this.otpAttempts = 0;
      },
    };

    mock.method(EmployerModel, "findById", () => ({
      select: async () => employer,
    }));
    mock.method(EmployerModel, "findOne", emptyFindOne);
    mock.method(JobSeekerModel, "findOne", emptyFindOne);
    mock.method(otpService, "matchesTestOtp", () => false);
    mock.method(otpService, "verifyOtpHash", async () => true);
    mock.method(otpService, "logVerificationSuccess", () => undefined);

    let scheduledEmployerId = "";
    mock.method(
      EmployerProfileCompletionReminderModel,
      "updateOne",
      async (
        filter: { employerId?: string },
        _update: unknown,
      ) => {
        scheduledEmployerId = filter.employerId ?? "";
        return { upsertedCount: 1 };
      },
    );

    const result = await employerService.verifyEmployerOtp({
      employerId,
      otp: "123456",
    });

    await new Promise((resolve) => setTimeout(resolve, 40));

    assert.equal(result.employer.accountType, "company");
    assert.equal(result.employer.isProfileComplete, false);
    assert.equal(result.employer.isWhatsappVerified, true);
    assert.equal(result.employer.registrationStatus, "otp_verified");
    assert.equal(result.nextStep, "company-profile");
    assert.equal(scheduledEmployerId, employer._id.toString());
  });
});
