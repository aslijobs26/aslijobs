import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type { JobSeekerPublic } from "../types/job-seeker";
import { computeProfileCompletion } from "./job-seeker-profile";
import {
  isProfileReadyToApply,
  listIncompleteApplySections,
  readProfileIncompleteError,
} from "./profile-apply-gate";
import {
  readPendingJobApply,
  storePendingJobApply,
} from "./pending-job-apply";

const completeSeeker = {
  id: "seeker-1",
  fullName: "Asha Rao",
  whatsappNumber: "9000000000",
  dateOfBirth: "1998-04-12",
  gender: "female",
  pincode: "",
  city: "",
  state: "",
  jobRole: "Sales Executive",
  jobType: "full-time",
  workMode: "on-site",
  preferredJobLocation: "Hyderabad",
  expectedSalary: 18000,
  education: { level: "graduation" },
  experienceType: "fresher",
  experiences: [],
  languages: ["telugu"],
  availabilityStatus: "immediate",
  isWhatsappVerified: true,
  registrationStatus: "PENDING",
} as unknown as JobSeekerPublic;

describe("job seeker apply profile completion", () => {
  it("keeps a mobile-only profile incomplete and lists the missing sections", () => {
    const seeker = {
      ...completeSeeker,
      dateOfBirth: null,
      gender: null,
      jobRole: "",
      jobType: null,
      workMode: null,
      preferredJobLocation: "",
      expectedSalary: null,
      education: null,
      experienceType: null,
      languages: [],
      availabilityStatus: null,
    } as unknown as JobSeekerPublic;

    const completion = computeProfileCompletion(seeker, null);
    assert.equal(completion.percent < 100, true);
    assert.equal(isProfileReadyToApply(seeker), false);
    assert.deepEqual(
      listIncompleteApplySections(seeker).map((section) => section.id),
      [
        "personal",
        "preferences",
        "education",
        "experience",
        "languages",
        "availability",
      ],
    );
  });

  it("treats a saved required profile as ready to apply without a photo or resume", () => {
    const completion = computeProfileCompletion(completeSeeker, null);
    assert.equal(completion.percent, 100);
    assert.equal(isProfileReadyToApply(completeSeeker), true);
  });

  it("reads the backend profile-incomplete error without submitting", () => {
    const sections = readProfileIncompleteError({
      response: {
        data: {
          message: "Complete your profile before applying for jobs.",
          details: {
            code: "PROFILE_INCOMPLETE",
            missingSections: [{ id: "education", label: "Education" }],
          },
        },
      },
    });
    assert.deepEqual(sections, [{ id: "education", label: "Education" }]);
  });
});

describe("pending job apply", () => {
  it("keeps the selected job while the profile is completed", () => {
    const storage = new Map<string, string>();
    const previousWindow = globalThis.window;
    Object.defineProperty(globalThis, "window", {
      configurable: true,
      value: {
        sessionStorage: {
          getItem: (key: string) => storage.get(key) ?? null,
          setItem: (key: string, value: string) => {
            storage.set(key, value);
          },
          removeItem: (key: string) => {
            storage.delete(key);
          },
        },
      },
    });

    try {
      storePendingJobApply({
        jobId: "AJ-2026-000073",
        jobTitle: "Sales Executive",
        companyName: "Ram Organization",
        returnUrl: "/jobs?job=AJ-2026-000073",
      });
      const firstRead = readPendingJobApply();
      const secondRead = readPendingJobApply();
      assert.equal(firstRead, secondRead);
      assert.deepEqual(firstRead, {
        jobId: "AJ-2026-000073",
        jobTitle: "Sales Executive",
        companyName: "Ram Organization",
        returnUrl: "/jobs?job=AJ-2026-000073",
      });
    } finally {
      if (previousWindow) {
        Object.defineProperty(globalThis, "window", {
          configurable: true,
          value: previousWindow,
        });
      } else {
        Reflect.deleteProperty(globalThis, "window");
      }
    }
  });
});
