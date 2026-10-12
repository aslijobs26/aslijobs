import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";
import { HTTP_STATUS } from "../../constants/http-status.js";
import {
  assertJobSeekerProfileAllowsApply,
  canLoginVerifiedJobSeeker,
  evaluateJobSeekerProfileCompletion,
  PROFILE_INCOMPLETE_CODE,
  type JobSeekerProfileCompletionSource,
} from "./job-seeker-profile-completion.js";

const completeProfile: JobSeekerProfileCompletionSource = {
  fullName: "Asha Rao",
  isWhatsappVerified: true,
  dateOfBirth: "1998-04-12",
  gender: "female",
  jobRole: "Sales Executive",
  jobType: "full-time",
  workMode: "on-site",
  preferredJobLocation: "Hyderabad",
  expectedSalary: 18000,
  education: { level: "graduation" },
  experienceType: "fresher",
  experiences: [],
  languages: ["telugu", "english"],
  availabilityStatus: "immediate",
};

describe("evaluateJobSeekerProfileCompletion", () => {
  it("keeps a verified mobile-only account incomplete", () => {
    const result = evaluateJobSeekerProfileCompletion({
      fullName: "Asha Rao",
      isWhatsappVerified: true,
    });

    assert.equal(result.isComplete, false);
    assert.equal(result.percent < 100, true);
    assert.deepEqual(result.missingSectionIds, [
      "personal",
      "preferences",
      "education",
      "experience",
      "languages",
      "availability",
    ]);
  });

  it("marks a fresher complete without work history, photo, skills, or resume", () => {
    const result = evaluateJobSeekerProfileCompletion(completeProfile);
    assert.equal(result.isComplete, true);
    assert.equal(result.percent, 100);
    assert.deepEqual(result.missingSectionIds, []);
  });

  it("requires at least one job for an experienced seeker", () => {
    const result = evaluateJobSeekerProfileCompletion({
      ...completeProfile,
      experienceType: "experienced",
      experiences: [],
    });
    assert.equal(result.isComplete, false);
    assert.deepEqual(result.missingSectionIds, ["experience"]);
  });

  it("counts a saved experience toward completion", () => {
    const result = evaluateJobSeekerProfileCompletion({
      ...completeProfile,
      experienceType: "experienced",
      experiences: [{ companyName: "Ram Stores", jobRole: "Cashier" }],
    });
    assert.equal(result.isComplete, true);
  });
});

describe("assertJobSeekerProfileAllowsApply", () => {
  it("rejects an incomplete profile before an application can be created", () => {
    assert.throws(
      () =>
        assertJobSeekerProfileAllowsApply({
          fullName: "Asha Rao",
          isWhatsappVerified: true,
        }),
      (error: unknown) => {
        assert.equal(error instanceof Error, true);
        const appError = error as {
          message: string;
          statusCode: number;
          details?: {
            code?: string;
            missingSections?: Array<{ id: string }>;
          };
        };
        assert.equal(appError.statusCode, HTTP_STATUS.FORBIDDEN);
        assert.match(appError.message, /Complete your profile/);
        assert.equal(appError.details?.code, PROFILE_INCOMPLETE_CODE);
        assert.equal(
          appError.details?.missingSections?.some(
            (section) => section.id === "education",
          ),
          true,
        );
        return true;
      },
    );
  });

  it("allows a complete profile", () => {
    const result = assertJobSeekerProfileAllowsApply(completeProfile);
    assert.equal(result.isComplete, true);
  });
});

describe("applyToJob profile gate order", () => {
  it("checks profile completion before creating an application or sending WhatsApp", () => {
    const source = readFileSync(
      new URL("../applications/application.service.ts", import.meta.url),
      "utf8",
    );
    const applyStart = source.indexOf("async applyToJob");
    const guardAt = source.indexOf(
      "assertJobSeekerProfileAllowsApply",
      applyStart,
    );
    const createAt = source.indexOf("ApplicationModel.create", applyStart);
    const whatsappAt = source.indexOf(
      "jobApplicationSubmittedWhatsApp.schedule",
      applyStart,
    );

    assert.equal(guardAt > applyStart, true);
    assert.equal(guardAt < createAt, true);
    assert.equal(guardAt < whatsappAt, true);
  });
});

describe("canLoginVerifiedJobSeeker", () => {
  it("allows login after OTP even when profile fields are still empty", () => {
    assert.equal(
      canLoginVerifiedJobSeeker({ isWhatsappVerified: true }),
      true,
    );
  });

  it("does not treat an unverified registration as a login", () => {
    assert.equal(
      canLoginVerifiedJobSeeker({ isWhatsappVerified: false }),
      false,
    );
  });
});
