import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  jobOrdinalFromText,
  looksLikeJobOrdinalSelection,
} from "./whatsapp-bot.criteria.js";
import {
  buildDeterministicReply,
  clearedTemporarySearchSessionFields,
  detectMenuSelection,
  formatApplicationStatusLabel,
  resolveTurnUnderstanding,
  understandLocally,
} from "./whatsapp-bot.logic.js";

function shownJobs(count: number) {
  return Array.from({ length: count }, (_, index) => ({
    jobId: `AJ-${index + 1}`,
    jobTitle: `Driver ${index + 1}`,
    companyName: `Co ${index + 1}`,
    cityName: "Hyderabad",
    salary: "₹20,000",
  }));
}

function pick(jobs: ReturnType<typeof shownJobs>, text: string) {
  const understanding = understandLocally(text);
  const ordinal = understanding.jobOrdinal ?? 0;
  if (ordinal <= 0) return { understanding, job: undefined };
  return { understanding, job: jobs[ordinal - 1] };
}

describe("WhatsApp application flow", () => {
  it("maps apply-by-number onto jobs 1, 5, and 8 without claiming submission", () => {
    const jobs = shownJobs(8);
    for (const [text, index] of [
      ["apply for 1", 0],
      ["apply for the first job", 0],
      ["apply for 5", 4],
      ["apply for the 5th job", 4],
      ["5", 4],
      ["apply for 8", 7],
      ["apply for the eighth job", 7],
    ] as const) {
      const { understanding, job } = pick(jobs, text);
      assert.equal(understanding.intent, "JOB_DETAILS", text);
      assert.equal(understanding.jobOrdinal, index + 1, text);
      assert.equal(job?.jobId, `AJ-${index + 1}`, text);
      const reply = buildDeterministicReply("en", {
        situation: "job_details",
        accountType: "seeker",
        applyOrigin: "https://aslijobs.com",
        jobs: [
          {
            jobTitle: job!.jobTitle,
            companyName: job!.companyName,
            cityName: job!.cityName,
            salary: job!.salary,
            jobId: job!.jobId,
          },
        ],
      });
      assert.match(reply ?? "", new RegExp(job!.jobId));
      assert.match(reply ?? "", /Apply Now/);
      assert.doesNotMatch(reply ?? "", /submitted|application was sent|successfully applied/i);
    }
  });

  it("rejects invalid numbers with which-job clarification, not applications list", () => {
    for (const text of ["apply for 9", "apply for 0", "0", "9", "apply for -1"]) {
      const u = understandLocally(text);
      assert.equal(u.intent, "JOB_DETAILS", text);
      assert.ok(looksLikeJobOrdinalSelection(text), text);
      assert.ok((u.jobOrdinal ?? 0) < 1 || (u.jobOrdinal ?? 0) > 8 || jobOrdinalFromText(text) == null, text);
    }
    const jobs = shownJobs(3);
    const over = pick(jobs, "apply for 5");
    assert.equal(over.understanding.intent, "JOB_DETAILS");
    assert.equal(over.job, undefined);
    const clarify = buildDeterministicReply("en", {
      situation: "clarify",
      missing: "which_job",
    });
    assert.match(clarify ?? "", /job number|apply for 1/i);
    assert.doesNotMatch(clarify ?? "", /driver jobs in Madhapur/i);
  });

  it("keeps numbered selection after show more using the latest shown batch", () => {
    const firstPage = shownJobs(8);
    const secondPage = Array.from({ length: 4 }, (_, index) => ({
      jobId: `AJ-B${index + 1}`,
      jobTitle: `Driver B${index + 1}`,
      companyName: `Co B${index + 1}`,
      cityName: "Hyderabad",
      salary: "₹22,000",
    }));
    const previous = {
      location: "Hyderabad",
      category: "Driver",
      intent: "JOB_SEARCH" as const,
      locationKind: "city" as const,
      experienceLevel: "fresher",
      minSalary: 20000,
      maxSalary: null,
    };
    const more = resolveTurnUnderstanding(
      "Show more",
      understandLocally("Show more"),
      previous,
      "JOB_SEARCH",
    );
    assert.equal(more.showMore, true);
    assert.equal(more.category, "Driver");
    assert.equal(more.location, "Hyderabad");

    const fromSecond = pick(secondPage, "apply for 2");
    assert.equal(fromSecond.job?.jobId, "AJ-B2");
    assert.notEqual(fromSecond.job?.jobId, firstPage[1]?.jobId);
  });

  it("does not let seeker menu digits steal a job pick when lastJobs exist", () => {
    assert.equal(detectMenuSelection("2", "SEEKER_MENU"), "MY_APPLICATIONS");
    assert.equal(looksLikeJobOrdinalSelection("2"), true);
    const u = understandLocally("2");
    assert.equal(u.intent, "JOB_DETAILS");
    assert.equal(u.jobOrdinal, 2);
  });

  it("clears temporary search slots including lastJobs on greeting restart", () => {
    const cleared = clearedTemporarySearchSessionFields();
    assert.deepEqual(cleared.lastJobs, []);
    assert.deepEqual(cleared.lastSeenJobIds, []);
  });

  it("shows human application status labels and never invents a status", () => {
    assert.equal(formatApplicationStatusLabel("submitted"), "Applied");
    assert.equal(formatApplicationStatusLabel("shortlisted"), "Shortlisted");
    assert.equal(formatApplicationStatusLabel("interview_scheduled"), "Interview Scheduled");
    assert.equal(formatApplicationStatusLabel("rejected"), "Rejected");
    assert.equal(formatApplicationStatusLabel("selected"), "Selected");
    assert.equal(formatApplicationStatusLabel(""), "Unknown");
    assert.equal(formatApplicationStatusLabel("not_a_real_status"), "not a real status");

    const reply = buildDeterministicReply("en", {
      situation: "status",
      total: 2,
      applications: [
        { jobTitle: "Driver", companyName: "ABC", status: "interview_scheduled" },
        { jobTitle: "Electrician", companyName: "XYZ", status: "shortlisted" },
      ],
    });
    assert.match(reply ?? "", /Interview Scheduled/);
    assert.match(reply ?? "", /Shortlisted/);
    assert.doesNotMatch(reply ?? "", /interview_scheduled|shortlisted/);
    assert.doesNotMatch(reply ?? "", /undefined|null|hired successfully/i);
  });

  it("keeps my-applications separate from apply-by-number", () => {
    const apps = understandLocally("my applications");
    assert.equal(apps.intent, "MY_APPLICATIONS");
    assert.equal(apps.jobOrdinal, null);

    const status = understandLocally("application status");
    assert.equal(status.intent, "APPLICATION_STATUS");

    const applyGuide = understandLocally("How to apply?");
    assert.equal(applyGuide.intent, "HOW_TO_APPLY");
  });

  it("does not claim WhatsApp itself submitted an application", () => {
    const reply = buildDeterministicReply("en", {
      situation: "job_details",
      accountType: "seeker",
      applyOrigin: "https://aslijobs.com",
      jobs: [
        {
          jobTitle: "Driver",
          companyName: "ABC",
          cityName: "Hyderabad",
          salary: "₹20,000",
          jobId: "AJ-SAFE-1",
        },
      ],
    });
    assert.match(reply ?? "", /Apply Now: https:\/\/aslijobs\.com\/jobs\/AJ-SAFE-1/);
    assert.doesNotMatch(
      reply ?? "",
      /application (was )?submitted|we have applied|applied successfully|application id/i,
    );
  });
});
