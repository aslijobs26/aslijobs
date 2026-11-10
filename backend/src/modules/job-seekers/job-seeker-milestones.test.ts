import assert from "node:assert/strict";
import { afterEach, describe, it, mock } from "node:test";
import mongoose from "mongoose";
import { EmployerModel } from "../employers/employer.model.js";
import { otpService } from "../otp/otp.service.js";
import { resumeService } from "../resumes/resume.service.js";
import { JobSeekerModel } from "./job-seeker.model.js";
import { jobSeekerService } from "./job-seeker.service.js";
import {
  markJobSeekerWhatsappVerified,
  recordJobSeekerProfileCompletion,
} from "./job-seeker-milestones.js";

const jobSeekerId = "64f0000000000000000000bb";

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

function completeProfile(overrides: Record<string, unknown> = {}) {
  return {
    fullName: "Asha Rao",
    isWhatsappVerified: true,
    dateOfBirth: new Date("1995-01-01T00:00:00.000Z"),
    gender: "female",
    jobRole: "Cleaner",
    jobType: "full-time",
    workMode: "on-site",
    preferredJobLocation: "Hyderabad",
    expectedSalary: 15000,
    education: { level: "below_10th" },
    experienceType: "fresher",
    experiences: [],
    languages: ["english"],
    availabilityStatus: "immediate",
    profileCompletedAt: null as Date | null,
    ...overrides,
  };
}

function seekerDocument(overrides: Record<string, unknown> = {}) {
  return {
    _id: new mongoose.Types.ObjectId(jobSeekerId),
    whatsappNumber: "9876543210",
    registrationStatus: "COMPLETED",
    accountStatus: "active",
    whatsappVerifiedAt: null as Date | null,
    otpHash: "hash",
    otpExpiresAt: new Date(Date.now() + 60_000),
    otpAttempts: 0,
    saves: 0,
    async save(this: { saves: number }) {
      this.saves += 1;
      return this;
    },
    set(this: Record<string, unknown>, path: string, value: unknown) {
      this[path] = value;
    },
    ...completeProfile(),
    ...overrides,
  };
}

describe("WhatsApp verification timestamp", () => {
  it("records the server time on first verification", () => {
    const seeker = { isWhatsappVerified: false, whatsappVerifiedAt: null as Date | null };
    const now = new Date("2026-11-10T06:00:00.000Z");
    markJobSeekerWhatsappVerified(seeker, now);
    assert.equal(seeker.isWhatsappVerified, true);
    assert.equal(seeker.whatsappVerifiedAt, now);
  });

  it("keeps the original date on a repeated verification", () => {
    const original = new Date("2026-11-01T06:00:00.000Z");
    const seeker = { isWhatsappVerified: true, whatsappVerifiedAt: original };
    markJobSeekerWhatsappVerified(seeker, new Date("2026-11-10T06:00:00.000Z"));
    assert.equal(seeker.whatsappVerifiedAt, original);
  });

  it("does not invent a date for accounts verified before tracking", () => {
    const seeker: { isWhatsappVerified: boolean; whatsappVerifiedAt?: Date | null } = {
      isWhatsappVerified: true,
    };
    markJobSeekerWhatsappVerified(seeker, new Date("2026-11-10T06:00:00.000Z"));
    assert.equal(seeker.whatsappVerifiedAt, undefined);
  });
});

describe("profile completion timestamp", () => {
  const now = new Date("2026-11-10T06:00:00.000Z");

  it("records the first incomplete → complete transition", () => {
    const seeker = completeProfile();
    assert.equal(recordJobSeekerProfileCompletion(seeker, false, now), true);
    assert.equal(seeker.profileCompletedAt, now);
  });

  it("does nothing while the shared rules still find the profile incomplete", () => {
    const seeker = completeProfile({ expectedSalary: 0 });
    assert.equal(recordJobSeekerProfileCompletion(seeker, false, now), false);
    assert.equal(seeker.profileCompletedAt, null);
  });

  it("does not reset the date when a completed profile is edited", () => {
    const original = new Date("2026-11-01T06:00:00.000Z");
    const seeker = completeProfile({ profileCompletedAt: original, jobRole: "Driver" });
    assert.equal(recordJobSeekerProfileCompletion(seeker, true, now), false);
    assert.equal(seeker.profileCompletedAt, original);
  });

  it("keeps the first date when the profile is incomplete and completed again", () => {
    const original = new Date("2026-11-01T06:00:00.000Z");
    const seeker = completeProfile({ profileCompletedAt: original });
    assert.equal(recordJobSeekerProfileCompletion(seeker, false, now), false);
    assert.equal(seeker.profileCompletedAt, original);
  });

  it("leaves legacy completed profiles without a date", () => {
    const seeker = completeProfile();
    assert.equal(recordJobSeekerProfileCompletion(seeker, true, now), false);
    assert.equal(seeker.profileCompletedAt, null);
  });
});

describe("job seeker service milestones", () => {
  afterEach(() => {
    mock.restoreAll();
  });

  it("saves whatsappVerifiedAt when registration OTP verification succeeds", async () => {
    const seeker = seekerDocument({
      isWhatsappVerified: false,
      registrationStatus: "PENDING",
    });
    mock.method(JobSeekerModel, "findById", () => queryResult(seeker));
    mock.method(JobSeekerModel, "findOne", () => queryResult(null));
    mock.method(EmployerModel, "findOne", () => queryResult(null));
    mock.method(otpService, "matchesTestOtp", () => false);
    mock.method(otpService, "verifyOtpHash", async () => true);

    const before = Date.now();
    await jobSeekerService.verifyOtp({ jobSeekerId, otp: "654321" });
    assert.equal(seeker.isWhatsappVerified, true);
    assert.ok(seeker.whatsappVerifiedAt instanceof Date);
    assert.ok(seeker.whatsappVerifiedAt.getTime() >= before);
    // Verification was the last missing requirement, so completion shares its timestamp.
    assert.equal(seeker.profileCompletedAt, seeker.whatsappVerifiedAt);
    assert.equal(seeker.saves, 1);
  });

  it("does not record verification when the OTP is wrong", async () => {
    const seeker = seekerDocument({
      isWhatsappVerified: false,
      registrationStatus: "PENDING",
    });
    mock.method(JobSeekerModel, "findById", () => queryResult(seeker));
    mock.method(otpService, "matchesTestOtp", () => false);
    mock.method(otpService, "verifyOtpHash", async () => false);

    await assert.rejects(() =>
      jobSeekerService.verifyOtp({ jobSeekerId, otp: "000000" }),
    );
    assert.equal(seeker.isWhatsappVerified, false);
    assert.equal(seeker.whatsappVerifiedAt, null);
  });

  it("sets profileCompletedAt once through profile edits", async () => {
    const seeker = seekerDocument({ availabilityStatus: undefined });
    mock.method(JobSeekerModel, "findById", () => queryResult(seeker));
    mock.method(resumeService, "markOutdated", async () => undefined);
    mock.method(resumeService, "generateFromProfile", async () => undefined);

    await jobSeekerService.updateAuthenticatedProfile(jobSeekerId, {
      preferredLanguage: undefined,
      availabilityStatus: "immediate",
    });
    const firstCompletedAt = seeker.profileCompletedAt;
    assert.ok(firstCompletedAt instanceof Date);

    await jobSeekerService.updateAuthenticatedProfile(jobSeekerId, {
      preferredLanguage: undefined,
      jobRole: "Driver",
    });
    assert.equal(seeker.profileCompletedAt, firstCompletedAt);
  });
});
