import assert from "node:assert/strict";
import { afterEach, describe, it, mock } from "node:test";
import mongoose from "mongoose";
import { env } from "../../../config/env.js";
import { EmployerModel } from "../../employers/employer.model.js";
import { JobCounterModel } from "../../jobs/job-counter.model.js";
import { JobModel } from "../../jobs/job.model.js";
import { jobService } from "../../jobs/job.service.js";
import { createJobSchema, type SaveDraftJobInput } from "../../jobs/job.validation.js";
import {
  getEmployerProfileCompletionReminderDelayMs,
} from "./employer-profile-completion-reminder.service.js";
import {
  armJobPostIncompleteReminder,
  getJobPostIncompleteReminderDelayMs,
  jobPostIncompleteReminder,
  processJobPostIncompleteReminder,
  scheduleJobPostIncompleteReminder,
  type JobPostIncompleteReminderDeps,
} from "./job-post-incomplete-reminder.service.js";
import {
  isJobDraftIncomplete,
  jobPostIncompleteReminderDelayMs,
  resolveJobPostIncompleteReminderDelayMinutes,
  type PersistedJobDraftSnapshot,
} from "./job-post-incomplete-reminder.policy.js";
import { enqueueWhatsAppNotification } from "./whatsapp-notification.service.js";
import {
  buildWhatsAppNotificationBodyParameters,
  buildWhatsAppNotificationUrlButtonParameters,
  getWhatsAppNotificationTemplate,
  composeApprovedJobPostIncompleteButtonUrl,
  jobPostIncompleteEditUrl,
  resolveWhatsAppNotificationLanguage,
} from "./whatsapp-notification.policy.js";
import {
  jobPostApprovedWhatsApp,
  jobPostSubmittedWhatsApp,
} from "./job-post-whatsapp.notification.js";

const employerId = "64f0000000000000000000aa";
const operationsUserId = "64f0000000000000000000bb";
const jobMongoId = "64f0000000000000000000cc";
const employerPhone = "9876543210";
const operationsPhone = "9000000001";

const completeDraft: PersistedJobDraftSnapshot = {
  status: "draft",
  employerId,
  companyName: "Acme Pvt Ltd",
  industry: "logistics",
  businessCategory: "transport",
  companySize: "11-50",
  jobTitle: "Driver",
  jobType: "full-time",
  contractPeriodFrom: "",
  contractPeriodTo: "",
  partTimeSchedule: "",
  partTimeStartTime: "",
  partTimeEndTime: "",
  partTimeFlexibleHours: "",
  workMode: "office",
  vacancies: 1,
  description: "Drive the company van.",
  state: "telangana",
  stateName: "Telangana",
  city: "hyderabad",
  cityName: "Hyderabad",
  address: "1 Road",
  landmark: "",
  salaryType: "fixed",
  salaryPeriod: "per-month",
  fixedSalary: 20000,
  minimumSalary: null,
  maximumSalary: null,
  perks: [],
  education: ["10th_or_below"],
  experience: "fresher",
  languages: [],
  gender: [],
  minimumAge: null,
  maximumAge: null,
  walkInEnabled: false,
  interviewAddress: "",
  walkInStartDate: "",
  walkInEndDate: "",
  walkInStartTime: "",
  walkInEndTime: "",
  interviewInstructions: "",
  contactPersonName: "Asha",
  contactEmail: "asha@example.com",
  contactMobile: "9876543210",
};

function reminderDeps(
  overrides: Partial<JobPostIncompleteReminderDeps> = {},
): JobPostIncompleteReminderDeps {
  return {
    loadJob: async () => ({ ...completeDraft, _id: jobMongoId, jobId: "AJ-2026-000010" }),
    loadEmployer: async () => ({
      whatsappNumber: employerPhone,
      companyName: "Acme Pvt Ltd",
      establishmentName: "",
      firstName: "Asha",
      lastName: "Rao",
    }),
    refresh: async () => ({ generation: 1, rescheduled: false }),
    invalidate: async () => null,
    findReminder: async () => ({
      jobMongoId,
      publicJobId: "AJ-2026-000010",
      employerId,
      generation: 1,
      dueAt: new Date("2026-10-09T05:00:00.000Z"),
      status: "scheduled",
    }),
    claim: async () => true,
    markStatus: async () => undefined,
    enqueueNotification: async () => "queued",
    enqueueDelayedJob: async () => undefined,
    now: () => new Date("2026-10-09T05:00:00.000Z"),
    ...overrides,
  };
}

describe("incomplete job draft reminder", () => {
  afterEach(() => {
    mock.restoreAll();
  });

  it("reads a 1 minute testing delay and leaves the profile reminder at 30 minutes", () => {
    assert.equal(env.JOB_POST_INCOMPLETE_REMINDER_DELAY_MINUTES, 1);
    assert.equal(jobPostIncompleteReminderDelayMs(1), 60_000);
    assert.equal(getJobPostIncompleteReminderDelayMs(), 60_000);
    assert.equal(jobPostIncompleteReminderDelayMs(30), 1_800_000);
    assert.equal(env.EMPLOYER_PROFILE_COMPLETION_REMINDER_DELAY_MINUTES, 30);
    assert.equal(getEmployerProfileCompletionReminderDelayMs(), 1_800_000);
  });

  it("waits 30 minutes in production even when the configured delay is 1 or 2 minutes", () => {
    assert.equal(resolveJobPostIncompleteReminderDelayMinutes(1, "production"), 30);
    assert.equal(resolveJobPostIncompleteReminderDelayMinutes(2, "production"), 30);
    assert.equal(
      jobPostIncompleteReminderDelayMs(
        resolveJobPostIncompleteReminderDelayMinutes(2, "production"),
      ),
      1_800_000,
    );
    assert.equal(resolveJobPostIncompleteReminderDelayMinutes(1, "development"), 1);
    assert.equal(resolveJobPostIncompleteReminderDelayMinutes(2, "test"), 2);
  });

  it("treats a draft that fails publish validation as incomplete", () => {
    assert.equal(
      createJobSchema.safeParse({ ...completeDraft, status: "draft" }).success,
      true,
    );
    assert.equal(isJobDraftIncomplete(completeDraft), false);
    assert.equal(
      isJobDraftIncomplete({
        status: "draft",
        employerId,
        companyName: "Acme Pvt Ltd",
        jobTitle: "Driver",
      }),
      true,
    );
    assert.equal(
      isJobDraftIncomplete({ ...completeDraft, status: "pending_approval" }),
      false,
    );
  });

  it("schedules an incomplete draft for 1 minute and refreshes the generation on edit", async () => {
    const delayed: Array<{ generation: number; previousGeneration: number | null }> = [];
    const now = new Date("2026-10-09T05:00:00.000Z");
    let dueAt = new Date(0);
    const first = await armJobPostIncompleteReminder(
      jobMongoId,
      reminderDeps({
        loadJob: async () => ({
          status: "draft",
          employerId,
          jobTitle: "Driver",
          companyName: "Acme",
          jobId: "AJ-2026-000010",
        }),
        now: () => now,
        refresh: async (input) => {
          dueAt = input.dueAt;
          return { generation: 1, rescheduled: false };
        },
        enqueueDelayedJob: async (input) => {
          delayed.push(input);
        },
      }),
    );
    const second = await armJobPostIncompleteReminder(
      jobMongoId,
      reminderDeps({
        loadJob: async () => ({
          status: "draft",
          employerId,
          jobTitle: "Driver",
          companyName: "Acme",
          jobId: "AJ-2026-000010",
        }),
        refresh: async () => ({ generation: 2, rescheduled: true }),
        enqueueDelayedJob: async (input) => {
          delayed.push(input);
        },
      }),
    );

    assert.equal(first, "scheduled");
    assert.equal(second, "rescheduled");
    assert.equal(dueAt.getTime() - now.getTime(), 60_000);
    assert.deepEqual(
      delayed.map((item) => item.generation),
      [1, 2],
    );
    assert.equal(delayed[1]?.previousGeneration, 1);
  });

  it("does not send job_post_incomplete_ before the saved due time", async () => {
    let enqueued = false;
    const result = await processJobPostIncompleteReminder(
      jobMongoId,
      1,
      reminderDeps({
        now: () => new Date("2026-10-09T05:02:00.000Z"),
        findReminder: async () => ({
          jobMongoId,
          publicJobId: "AJ-2026-000010",
          employerId,
          generation: 1,
          dueAt: new Date("2026-10-09T05:30:00.000Z"),
          status: "scheduled",
        }),
        enqueueNotification: async () => {
          enqueued = true;
          return "queued";
        },
      }),
    );

    assert.equal(result, "skipped");
    assert.equal(enqueued, false);
  });

  it("dispatches job_post_incomplete_ to the employer when the draft is still incomplete", async () => {
    const queued: Array<{
      phoneNumber: string;
      employerName: string;
      entityId: string;
      idempotencyScope?: string;
    }> = [];
    const result = await processJobPostIncompleteReminder(
      jobMongoId,
      1,
      reminderDeps({
        loadJob: async () => ({
          status: "draft",
          employerId,
          jobTitle: "Driver",
          companyName: "",
          jobId: "AJ-2026-000010",
        }),
        enqueueNotification: async (payload) => {
          queued.push(payload);
          assert.notEqual(payload.phoneNumber, operationsPhone);
          return "queued";
        },
      }),
    );

    assert.equal(result, "sent");
    assert.equal(queued[0]?.phoneNumber, employerPhone);
    assert.equal(queued[0]?.employerName, "Acme Pvt Ltd");
    assert.equal(queued[0]?.entityId, jobMongoId);
    assert.equal(queued[0]?.idempotencyScope, "g1");
    assert.equal(
      getWhatsAppNotificationTemplate("JOB_POST_INCOMPLETE")?.templateName,
      "job_post_incomplete_",
    );
    assert.equal(resolveWhatsAppNotificationLanguage("JOB_POST_INCOMPLETE", "hi"), "en");
    const bodyParameters = buildWhatsAppNotificationBodyParameters(
      "JOB_POST_INCOMPLETE",
      {
        event: "JOB_POST_INCOMPLETE",
        entityId: jobMongoId,
        phoneNumber: employerPhone,
        employerName: "Acme Pvt Ltd",
      },
    );
    const urlButtonParameters = buildWhatsAppNotificationUrlButtonParameters(
      "JOB_POST_INCOMPLETE",
      {
        event: "JOB_POST_INCOMPLETE",
        entityId: jobMongoId,
        phoneNumber: employerPhone,
      },
    );
    assert.deepEqual(bodyParameters, ["Acme Pvt Ltd"]);
    assert.equal(bodyParameters.length, 1);
    assert.deepEqual(urlButtonParameters, [jobMongoId]);
    assert.equal(urlButtonParameters.length, 1);
    const correctedUrl = jobPostIncompleteEditUrl(jobMongoId);
    assert.equal(
      correctedUrl,
      `https://www.aslijobs.com/post-job/${jobMongoId}`,
    );
    assert.equal(correctedUrl.includes("{{"), false);
    assert.equal(correctedUrl.includes("%7B"), false);
    const openedUrl = composeApprovedJobPostIncompleteButtonUrl(jobMongoId);
    assert.equal(
      openedUrl,
      `https://www.aslijobs.com/post-job/%7B%7B1%7D%7D${jobMongoId}`,
    );
    const decodedUrl = decodeURIComponent(openedUrl);
    assert.equal(
      decodedUrl,
      `https://www.aslijobs.com/post-job/{{1}}${jobMongoId}`,
    );
    assert.deepEqual(decodedUrl.match(/[a-f0-9]{24}/gi), [jobMongoId]);
    assert.equal(openedUrl.includes(employerId), false);
    assert.equal(openedUrl.includes("AJ-2026-000010"), false);
  });

  it("skips submitted, published, deleted, complete, and employerless jobs", async () => {
    const reasons: string[] = [];
    const cases: Array<{
      job: PersistedJobDraftSnapshot | null;
      status: "skipped_complete" | "skipped_ineligible";
    }> = [
      { job: { ...completeDraft, status: "pending_approval" }, status: "skipped_ineligible" },
      { job: { ...completeDraft, status: "active" }, status: "skipped_ineligible" },
      { job: null, status: "skipped_ineligible" },
      { job: completeDraft, status: "skipped_complete" },
      {
        job: { status: "draft", employerId: null, jobTitle: "Driver" },
        status: "skipped_ineligible",
      },
    ];

    for (const item of cases) {
      const marked: string[] = [];
      const result = await processJobPostIncompleteReminder(
        jobMongoId,
        1,
        reminderDeps({
          loadJob: async () =>
            item.job
              ? { ...item.job, jobId: "AJ-2026-000010" }
              : null,
          markStatus: async (input) => {
            marked.push(input.status);
          },
          enqueueNotification: async () => {
            throw new Error("should not send");
          },
        }),
      );
      assert.equal(result, "skipped");
      assert.deepEqual(marked, [item.status]);
      reasons.push(item.status);
    }
    assert.equal(reasons.length, 5);
  });

  it("ignores a stale generation and does not send a duplicate of the same generation", async () => {
    let sent = 0;
    const stale = await processJobPostIncompleteReminder(
      jobMongoId,
      1,
      reminderDeps({
        findReminder: async () => ({
          jobMongoId,
          publicJobId: "AJ-2026-000010",
          employerId,
          generation: 2,
          dueAt: new Date("2026-10-09T05:00:00.000Z"),
          status: "scheduled",
        }),
        enqueueNotification: async () => {
          sent += 1;
          return "queued";
        },
      }),
    );
    const duplicate = await processJobPostIncompleteReminder(
      jobMongoId,
      2,
      reminderDeps({
        findReminder: async () => ({
          jobMongoId,
          publicJobId: "AJ-2026-000010",
          employerId,
          generation: 2,
          dueAt: new Date("2026-10-09T05:00:00.000Z"),
          status: "scheduled",
        }),
        claim: async () => false,
        enqueueNotification: async () => {
          sent += 1;
          return "queued";
        },
      }),
    );
    const alreadySent = await processJobPostIncompleteReminder(
      jobMongoId,
      2,
      reminderDeps({
        findReminder: async () => ({
          jobMongoId,
          publicJobId: "AJ-2026-000010",
          employerId,
          generation: 2,
          dueAt: new Date("2026-10-09T05:00:00.000Z"),
          status: "sent",
        }),
        enqueueNotification: async () => {
          sent += 1;
          return "queued";
        },
      }),
    );
    const deliveredJobs: Array<{
      templateName: string;
      languageCode: string;
      phoneNumber: string;
      bodyParameters: string[];
      urlButtonParameters?: string[];
      idempotencyKey: string;
    }> = [];
    const nextCycle = await enqueueWhatsAppNotification(
      {
        event: "JOB_POST_INCOMPLETE",
        entityId: jobMongoId,
        phoneNumber: employerPhone,
        employerName: "Acme Pvt Ltd",
        preferredLanguage: "en",
        idempotencyScope: "g3",
      },
      {
        claim: async () => "claimed",
        enqueueJob: async (job) => {
          deliveredJobs.push(job);
        },
      },
    );

    assert.equal(stale, "skipped");
    assert.equal(duplicate, "skipped");
    assert.equal(alreadySent, "skipped");
    assert.equal(sent, 0);
    assert.equal(nextCycle, "queued");
    assert.equal(deliveredJobs[0]?.templateName, "job_post_incomplete_");
    assert.equal(deliveredJobs[0]?.languageCode, "en");
    assert.equal(deliveredJobs[0]?.phoneNumber, employerPhone);
    assert.deepEqual(deliveredJobs[0]?.bodyParameters, ["Acme Pvt Ltd"]);
    assert.deepEqual(deliveredJobs[0]?.urlButtonParameters, [jobMongoId]);
    assert.equal(
      deliveredJobs[0]?.idempotencyKey,
      `JOB_POST_INCOMPLETE:${jobMongoId}:g3`,
    );
  });

  it("does not throw when WhatsApp delivery fails", async () => {
    const result = await processJobPostIncompleteReminder(
      jobMongoId,
      1,
      reminderDeps({
        loadJob: async () => ({
          status: "draft",
          employerId,
          jobTitle: "Driver",
          jobId: "AJ-2026-000010",
        }),
        enqueueNotification: async () => {
          throw new Error("meta unavailable");
        },
      }),
    );
    assert.equal(result, "failed");

    mock.method(JobModel, "findById", () => {
      throw new Error("database unavailable");
    });
    scheduleJobPostIncompleteReminder(jobMongoId);
    await new Promise((resolve) => setTimeout(resolve, 20));
  });

  it("keeps job submission and approval notifications mapped", () => {
    assert.equal(
      getWhatsAppNotificationTemplate("JOB_POST_SUBMITTED")?.templateName,
      "job_post_submitted",
    );
    assert.equal(
      getWhatsAppNotificationTemplate("JOB_POST_APPROVED")?.templateName,
      "job_post_approved",
    );
    assert.equal(typeof jobPostSubmittedWhatsApp.schedule, "function");
    assert.equal(typeof jobPostApprovedWhatsApp.schedule, "function");
  });
});

describe("draft save arms the incomplete reminder", () => {
  afterEach(() => {
    mock.restoreAll();
  });

  it("arms an employer draft and still saves when scheduling throws", async () => {
    const armed: string[] = [];
    mock.method(EmployerModel, "findById", async () => ({
      _id: new mongoose.Types.ObjectId(employerId),
    }));
    mock.method(JobCounterModel, "findByIdAndUpdate", async () => ({ sequence: 10 }));
    mock.method(JobModel, "create", async (doc: Record<string, unknown>) => ({
      ...doc,
      _id: new mongoose.Types.ObjectId(jobMongoId),
      reviewDecision: "",
      rejectionReason: "",
      reviewHistory: [],
    }));
    mock.method(jobPostIncompleteReminder, "schedule", (id: string) => {
      armed.push(id);
      throw new Error("queue unavailable");
    });

    const draft: SaveDraftJobInput = {
      completedStep: 1,
      wizardSnapshot: {
        jobInformation: {
          companyDetails: "Acme",
          industry: "",
          businessCategory: "",
          companySize: "",
          jobTitle: "Driver",
          jobType: "",
          contractPeriodFrom: "",
          contractPeriodTo: "",
          partTimeSchedule: "",
          partTimeStartTime: "",
          partTimeEndTime: "",
          partTimeFlexibleHours: "",
          workMode: "",
          vacancies: "",
          jobDescription: "",
        },
        locationAndSalary: {
          state: "",
          city: "",
          address: "",
          landmark: "",
          salaryType: "",
          salaryPeriod: "",
          salaryMin: "",
          salaryMax: "",
          incentives: "",
          perks: [],
        },
        candidateAndInterview: {
          education: [],
          experienceRequired: "",
          additionalRequirements: { language: false, gender: false, age: false },
          languages: [],
          gender: [],
          ageMin: "",
          ageMax: "",
          walkIn: "",
          walkInAddress: "",
          walkInStartDate: "",
          walkInEndDate: "",
          walkInStartTime: "",
          walkInEndTime: "",
          otherInstructions: "",
          contactName: "",
          contactEmail: "",
          contactMobile: "",
        },
      },
    };

    const result = await jobService.createDraft(employerId, draft);
    assert.equal(result.job.status, "draft");
    assert.deepEqual(armed, [jobMongoId]);
  });

  it("arms an operations draft for the assigned employer, not the internal user", async () => {
    const armed: string[] = [];
    mock.method(JobModel, "findOne", async () => null);
    mock.method(EmployerModel, "findById", async () => ({
      _id: new mongoose.Types.ObjectId(employerId),
      companyName: "Acme Pvt Ltd",
      businessCategory: "",
      industry: "",
      whatsappNumber: employerPhone,
    }));
    mock.method(JobCounterModel, "findByIdAndUpdate", async () => ({ sequence: 11 }));
    mock.method(JobModel, "create", async (doc: Record<string, unknown>) => ({
      ...doc,
      _id: new mongoose.Types.ObjectId(jobMongoId),
      reviewDecision: "",
      rejectionReason: "",
      reviewHistory: [],
    }));
    mock.method(jobPostIncompleteReminder, "schedule", (id: string) => {
      armed.push(id);
      assert.notEqual(id, operationsUserId);
      assert.notEqual(id, operationsPhone);
    });

    const result = await jobService.createOperationsDraft(
      operationsUserId,
      {
        completedStep: 1,
        wizardSnapshot: {
          jobInformation: {
            companyDetails: "Acme",
            industry: "",
            businessCategory: "",
            companySize: "",
            jobTitle: "Driver",
            jobType: "",
            contractPeriodFrom: "",
            contractPeriodTo: "",
            partTimeSchedule: "",
            partTimeStartTime: "",
            partTimeEndTime: "",
            partTimeFlexibleHours: "",
            workMode: "",
            vacancies: "",
            jobDescription: "",
          },
          locationAndSalary: {
            state: "",
            city: "",
            address: "",
            landmark: "",
            salaryType: "",
            salaryPeriod: "",
            salaryMin: "",
            salaryMax: "",
            incentives: "",
            perks: [],
          },
          candidateAndInterview: {
            education: [],
            experienceRequired: "",
            additionalRequirements: { language: false, gender: false, age: false },
            languages: [],
            gender: [],
            ageMin: "",
            ageMax: "",
            walkIn: "",
            walkInAddress: "",
            walkInStartDate: "",
            walkInEndDate: "",
            walkInStartTime: "",
            walkInEndTime: "",
            otherInstructions: "",
            contactName: "",
            contactEmail: "",
            contactMobile: "",
          },
        },
      },
      employerId,
    );

    assert.equal(result.job.employerId, employerId);
    assert.equal(result.job.status, "draft");
    assert.deepEqual(armed, [jobMongoId]);
  });
});
