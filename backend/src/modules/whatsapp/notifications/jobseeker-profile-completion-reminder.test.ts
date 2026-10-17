import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { afterEach, describe, it, mock } from "node:test";
import mongoose from "mongoose";
import { env } from "../../../config/env.js";
import { evaluateJobSeekerProfileCompletion } from "../../job-seekers/job-seeker-profile-completion.js";
import { WhatsAppService } from "../whatsapp.service.js";
import {
  claimJobSeekerProfileCompletionReminder,
  findDueJobSeekerProfileCompletionReminderIds,
  JOBSEEKER_PROFILE_COMPLETION_REMINDER_STALE_PROCESSING_MS,
  JobSeekerProfileCompletionReminderModel,
  markJobSeekerProfileCompletionReminderStatus,
  skipPendingJobSeekerProfileCompletionReminder,
} from "./jobseeker-profile-completion-reminder.model.js";
import {
  isJobSeekerProfileCompletionReminderDue,
  jobSeekerProfileCompletionReminderDelayMs,
  shouldSendJobSeekerProfileCompletionReminder,
} from "./jobseeker-profile-completion-reminder.policy.js";
import {
  cancelJobSeekerProfileCompletionReminder,
  enqueueJobSeekerProfileCompletionReminder,
  getJobSeekerProfileCompletionReminderDelayMs,
  processJobSeekerProfileCompletionReminder,
  type ProcessJobSeekerProfileCompletionReminderDeps,
} from "./jobseeker-profile-completion-reminder.service.js";
import { jobSeekerProfileCompletionReminderJobId } from "./jobseeker-profile-completion-reminder.queue.js";
import { WhatsAppNotificationDispatchModel } from "./whatsapp-notification.model.js";
import {
  buildWhatsAppNotificationBodyParameters,
  buildWhatsAppNotificationUrlButtonParameters,
  getWhatsAppNotificationTemplate,
  JOBSEEKER_PROFILE_COMPLETION_BUTTON_URL,
  JOBSEEKER_PROFILE_COMPLETION_REQUIRED_BUTTON_URL,
  resolveWhatsAppNotificationDelivery,
  resolveWhatsAppNotificationLanguage,
  whatsAppNotificationIdempotencyKey,
} from "./whatsapp-notification.policy.js";
import * as notificationQueue from "./whatsapp-notification.queue.js";
import {
  shouldAbortJobSeekerProfileCompletionDelivery,
  syncReminderWithDispatchStatus,
} from "./whatsapp-notification.reminder-sync.js";
import type { WhatsAppNotificationEnqueueResult } from "./whatsapp-notification.types.js";

const jobSeekerId = "64f0000000000000000000a1";
const otherJobSeekerId = "64f0000000000000000000b2";
const verifiedPhone = "9876543210";

const incompleteSeeker = {
  fullName: "Asha",
  isWhatsappVerified: true,
  whatsappNumber: verifiedPhone,
  registrationStatus: "PENDING",
  accountStatus: "active",
};

const completeSeeker = {
  ...incompleteSeeker,
  dateOfBirth: new Date("1995-01-01T00:00:00.000Z"),
  gender: "female",
  jobRole: "Driver",
  jobType: "full_time",
  workMode: "onsite",
  preferredJobLocation: "Hyderabad",
  expectedSalary: 15000,
  education: { level: "graduate" },
  experienceType: "fresher",
  languages: ["Telugu"],
  availabilityStatus: "immediate",
};

function createDeps(options: {
  dueAt?: Date;
  status?: string;
  reminderAfterClaim?: { dueAt: Date; status: string } | null;
  claim?: boolean;
  seeker?:
    | (typeof incompleteSeeker & { whatsappLanguage?: string })
    | typeof completeSeeker
    | (typeof incompleteSeeker & Record<string, unknown>)
    | null;
  enqueueResult?: WhatsAppNotificationEnqueueResult;
  enqueueError?: Error;
  now?: Date;
}) {
  const enqueued: unknown[] = [];
  const statuses: string[] = [];
  let claimed = false;
  let reminderLoads = 0;
  const now = options.now ?? new Date("2026-10-12T06:00:00.000Z");
  const deps: ProcessJobSeekerProfileCompletionReminderDeps = {
    loadReminder: async () => {
      reminderLoads += 1;
      if (reminderLoads > 1 && options.reminderAfterClaim !== undefined) {
        return options.reminderAfterClaim;
      }
      return options.dueAt
        ? { dueAt: options.dueAt, status: options.status ?? "scheduled" }
        : null;
    },
    claim: async () => {
      claimed = true;
      return options.claim !== false;
    },
    loadJobSeeker: async () =>
      options.seeker === undefined ? incompleteSeeker : options.seeker,
    enqueueNotification: async (payload) => {
      if (options.enqueueError) {
        throw options.enqueueError;
      }
      enqueued.push(payload);
      return options.enqueueResult ?? "queued";
    },
    markStatus: async (input) => {
      statuses.push(input.status);
    },
    now: () => now,
  };
  return {
    enqueued,
    statuses,
    deps,
    now,
    wasClaimed: () => claimed,
  };
}

function stubMongoReady(ready: boolean): () => void {
  Object.defineProperty(mongoose.connection, "readyState", {
    configurable: true,
    enumerable: true,
    get: () => (ready ? 1 : 0),
  });
  return () => {
    Object.defineProperty(mongoose.connection, "readyState", {
      configurable: true,
      enumerable: true,
      get: () => 0,
    });
  };
}

describe("jobseeker profile completion reminder", () => {
  afterEach(() => {
    mock.restoreAll();
  });

  it("uses the configured 30 minute delay", () => {
    assert.equal(env.JOBSEEKER_PROFILE_COMPLETION_REMINDER_DELAY_MINUTES, 30);
    assert.equal(jobSeekerProfileCompletionReminderDelayMs(30), 1_800_000);
    assert.equal(getJobSeekerProfileCompletionReminderDelayMs(), 1_800_000);
  });

  it("schedules one reminder after verified incomplete registration and does not reset it", async () => {
    const updates: Array<{
      filter: { jobSeekerId?: string };
      update: { $setOnInsert?: { dueAt?: Date }; $set?: unknown };
    }> = [];
    const scheduledIds = new Set<string>();
    mock.method(
      JobSeekerProfileCompletionReminderModel,
      "updateOne",
      async (
        filter: { jobSeekerId?: string },
        update: { $setOnInsert?: { dueAt?: Date }; $set?: unknown },
      ) => {
        updates.push({ filter, update });
        const id = filter.jobSeekerId ?? "";
        if (scheduledIds.has(id)) {
          return { upsertedCount: 0 };
        }
        scheduledIds.add(id);
        return { upsertedCount: 1 };
      },
    );

    const first = await enqueueJobSeekerProfileCompletionReminder(jobSeekerId);
    const second = await enqueueJobSeekerProfileCompletionReminder(jobSeekerId);
    const other = await enqueueJobSeekerProfileCompletionReminder(otherJobSeekerId);

    assert.equal(first, "scheduled");
    assert.equal(second, "already_scheduled");
    assert.equal(other, "scheduled");
    assert.equal(updates[0]?.filter.jobSeekerId, jobSeekerId);
    assert.equal(updates[1]?.filter.jobSeekerId, jobSeekerId);
    assert.equal(updates[2]?.filter.jobSeekerId, otherJobSeekerId);
    assert.equal(updates[0]?.update.$set, undefined);
    assert.equal(updates[1]?.update.$set, undefined);
    const firstDueAt = updates[0]?.update.$setOnInsert?.dueAt;
    assert.ok(firstDueAt);
    assert.ok(
      Math.abs(firstDueAt.getTime() - Date.now() - 1_800_000) < 2_000,
    );
    assert.notEqual(
      jobSeekerProfileCompletionReminderJobId(jobSeekerId),
      jobSeekerProfileCompletionReminderJobId(otherJobSeekerId),
    );
  });

  it("does not send before the configured delay", async () => {
    const now = new Date("2026-10-12T06:00:00.000Z");
    const { deps, enqueued, wasClaimed } = createDeps({
      now,
      dueAt: new Date(now.getTime() + 1_800_000),
      seeker: incompleteSeeker,
    });

    const result = await processJobSeekerProfileCompletionReminder(
      jobSeekerId,
      deps,
    );

    assert.equal(result, "skipped");
    assert.equal(enqueued.length, 0);
    assert.equal(wasClaimed(), false);
    assert.equal(
      isJobSeekerProfileCompletionReminderDue(
        new Date(now.getTime() + 1_800_000),
        new Date(now.getTime() + 29 * 60_000),
      ),
      false,
    );
  });

  it("sends jobseeker_profile_completion to the verified number after the delay", async () => {
    const now = new Date("2026-10-12T06:00:00.000Z");
    const { deps, enqueued, statuses } = createDeps({
      now,
      dueAt: new Date(now.getTime() - 1_000),
      seeker: incompleteSeeker,
    });

    const result = await processJobSeekerProfileCompletionReminder(
      jobSeekerId,
      deps,
    );
    const job = enqueued[0] as {
      event: string;
      phoneNumber: string;
      entityId: string;
    };

    assert.equal(result, "queued");
    assert.equal(job.event, "JOBSEEKER_PROFILE_COMPLETION");
    assert.equal(job.entityId, jobSeekerId);
    assert.equal(job.phoneNumber, verifiedPhone);
    assert.deepEqual(statuses, ["queued"]);
    assert.equal(
      getWhatsAppNotificationTemplate("JOBSEEKER_PROFILE_COMPLETION")
        ?.templateName,
      "jobseeker_profile_completion",
    );
    assert.equal(
      resolveWhatsAppNotificationLanguage("JOBSEEKER_PROFILE_COMPLETION", "en"),
      "en",
    );
    assert.equal(
      resolveWhatsAppNotificationLanguage("JOBSEEKER_PROFILE_COMPLETION", "hi"),
      "hi",
    );
    assert.equal(
      resolveWhatsAppNotificationLanguage("JOBSEEKER_PROFILE_COMPLETION", "te"),
      "te",
    );
    assert.deepEqual(
      buildWhatsAppNotificationBodyParameters("JOBSEEKER_PROFILE_COMPLETION", {
        event: "JOBSEEKER_PROFILE_COMPLETION",
        entityId: jobSeekerId,
        phoneNumber: verifiedPhone,
      }),
      [],
    );
    assert.deepEqual(
      buildWhatsAppNotificationUrlButtonParameters(
        "JOBSEEKER_PROFILE_COMPLETION",
        {
          event: "JOBSEEKER_PROFILE_COMPLETION",
          entityId: jobSeekerId,
          phoneNumber: verifiedPhone,
        },
      ),
      [],
    );
    assert.equal(
      JOBSEEKER_PROFILE_COMPLETION_BUTTON_URL.includes("{{"),
      false,
    );
    assert.equal(
      JOBSEEKER_PROFILE_COMPLETION_REQUIRED_BUTTON_URL,
      "https://www.aslijobs.com/job-seeker/profile",
    );
    assert.equal(
      JOBSEEKER_PROFILE_COMPLETION_REQUIRED_BUTTON_URL.endsWith("/job-seeker/profile"),
      true,
    );
    assert.equal(
      whatsAppNotificationIdempotencyKey(
        "JOBSEEKER_PROFILE_COMPLETION",
        jobSeekerId,
      ),
      `JOBSEEKER_PROFILE_COMPLETION:${jobSeekerId}`,
    );
  });

  it("does not send when the profile is completed before the reminder is due", async () => {
    const now = new Date("2026-10-12T06:00:00.000Z");
    const { deps, enqueued, statuses } = createDeps({
      now,
      dueAt: now,
      seeker: completeSeeker,
    });

    const result = await processJobSeekerProfileCompletionReminder(
      jobSeekerId,
      deps,
    );

    assert.equal(result, "skipped");
    assert.equal(enqueued.length, 0);
    assert.deepEqual(statuses, ["skipped_complete"]);
    assert.equal(shouldSendJobSeekerProfileCompletionReminder(completeSeeker), false);
    assert.equal(
      shouldSendJobSeekerProfileCompletionReminder(incompleteSeeker),
      true,
    );
  });

  it("does not send for an invalid, unverified, or unreachable account", async () => {
    assert.equal(
      shouldSendJobSeekerProfileCompletionReminder({
        ...incompleteSeeker,
        isWhatsappVerified: false,
      }),
      false,
    );
    assert.equal(
      shouldSendJobSeekerProfileCompletionReminder({
        ...incompleteSeeker,
        accountStatus: "blocked",
      }),
      false,
    );
    assert.equal(
      shouldSendJobSeekerProfileCompletionReminder({
        ...incompleteSeeker,
        whatsappNumber: " ",
      }),
      false,
    );
    assert.equal(shouldSendJobSeekerProfileCompletionReminder(null), false);

    const now = new Date("2026-10-12T06:00:00.000Z");
    const { deps, enqueued, statuses } = createDeps({
      now,
      dueAt: now,
      seeker: null,
    });
    const result = await processJobSeekerProfileCompletionReminder(
      jobSeekerId,
      deps,
    );
    assert.equal(result, "skipped");
    assert.equal(enqueued.length, 0);
    assert.deepEqual(statuses, ["skipped_ineligible"]);
  });

  it("does not send again when the queue retries a successful reminder", async () => {
    const now = new Date("2026-10-12T06:00:00.000Z");
    const duplicate = createDeps({
      now,
      dueAt: now,
      seeker: incompleteSeeker,
      enqueueResult: "skipped_duplicate",
    });
    const duplicateResult = await processJobSeekerProfileCompletionReminder(
      jobSeekerId,
      duplicate.deps,
    );
    assert.equal(duplicateResult, "skipped");
    assert.deepEqual(duplicate.statuses, ["queued"]);

    const claimed = createDeps({
      now,
      dueAt: now,
      seeker: incompleteSeeker,
      claim: false,
    });
    const claimedResult = await processJobSeekerProfileCompletionReminder(
      jobSeekerId,
      claimed.deps,
    );
    assert.equal(claimedResult, "skipped");
    assert.equal(claimed.enqueued.length, 0);
  });

  it("records WhatsApp failure without throwing", async () => {
    const now = new Date("2026-10-12T06:00:00.000Z");
    const { deps, statuses } = createDeps({
      now,
      dueAt: now,
      seeker: incompleteSeeker,
      enqueueError: new Error("WhatsApp template delivery failed"),
    });

    const result = await processJobSeekerProfileCompletionReminder(
      jobSeekerId,
      deps,
    );

    assert.equal(result, "failed");
    assert.deepEqual(statuses, ["failed"]);
  });

  it("schedules only from successful registration OTP verification", () => {
    const registration = readFileSync(
      new URL("../../job-seekers/job-seeker.service.ts", import.meta.url),
      "utf8",
    );
    const login = readFileSync(
      new URL("../../job-seekers/job-seeker-login.service.ts", import.meta.url),
      "utf8",
    );
    const application = readFileSync(
      new URL("../../applications/application.service.ts", import.meta.url),
      "utf8",
    );

    const verifyStart = registration.indexOf("async verifyOtp");
    const verifyEnd = registration.indexOf("async searchJobRoles");
    const verifyBody = registration.slice(verifyStart, verifyEnd);
    const verifiedAt = verifyBody.indexOf("isWhatsappVerified = true");
    const armedAt = verifyBody.indexOf("armJobSeekerProfileCompletionReminder");
    assert.ok(verifiedAt >= 0);
    assert.ok(armedAt > verifiedAt);

    const registerBody = registration.slice(
      registration.indexOf("async registerJobSeeker"),
      registration.indexOf("async resendOtp"),
    );
    const resendBody = registration.slice(
      registration.indexOf("async resendOtp"),
      verifyStart,
    );
    assert.equal(registerBody.includes("armJobSeekerProfileCompletionReminder"), false);
    assert.equal(resendBody.includes("armJobSeekerProfileCompletionReminder"), false);
    assert.equal(verifyBody.slice(0, verifiedAt).includes("armJobSeeker"), false);
    assert.equal(login.includes("jobseeker-profile-completion-reminder"), false);
    assert.equal(login.includes("armJobSeekerProfileCompletionReminder"), false);

    const finalizeStart = registration.indexOf(
      "async function finalizeJobSeekerAccountIfReady",
    );
    const finalizeBody = registration.slice(
      finalizeStart,
      registration.indexOf("async function refreshResumeAfterProfileChange"),
    );
    assert.ok(
      finalizeBody.indexOf("jobseekerAccountCreatedWhatsApp.schedule") <
        finalizeBody.indexOf("cancelJobSeekerProfileCompletionReminder"),
    );
    assert.ok(
      registration.indexOf("jobseekerAccountCreatedWhatsApp.schedule") <
        registration.lastIndexOf("cancelJobSeekerProfileCompletionReminder"),
    );

    const applyStart = application.indexOf("assertJobSeekerProfileAllowsApply");
    const applyNotify = application.indexOf("jobApplicationSubmittedWhatsApp.schedule");
    assert.ok(applyStart >= 0);
    assert.ok(applyNotify > applyStart);
    assert.equal(application.includes("JOBSEEKER_PROFILE_COMPLETION"), false);
    assert.deepEqual(
      buildWhatsAppNotificationBodyParameters("JOBSEEKER_ACCOUNT_CREATED", {
        event: "JOBSEEKER_ACCOUNT_CREATED",
        entityId: jobSeekerId,
        phoneNumber: verifiedPhone,
      }),
      [],
    );
    assert.deepEqual(
      buildWhatsAppNotificationBodyParameters("JOB_APPLICATION_SUBMITTED", {
        event: "JOB_APPLICATION_SUBMITTED",
        entityId: "application-1",
        phoneNumber: verifiedPhone,
        jobTitle: "Driver",
        companyName: "Ram Organization",
      }),
      ["Driver", "Ram Organization"],
    );
  });

  it("does not schedule a reminder when OTP verification finds a completed profile", () => {
    const registration = readFileSync(
      new URL("../../job-seekers/job-seeker.service.ts", import.meta.url),
      "utf8",
    );
    const verifyStart = registration.indexOf("async verifyOtp");
    const verifyEnd = registration.indexOf("async searchJobRoles");
    const verifyBody = registration.slice(verifyStart, verifyEnd);
    assert.ok(
      verifyBody.includes(
        "if (!evaluateJobSeekerProfileCompletion(jobSeeker).isComplete)",
      ),
    );
    assert.ok(
      verifyBody.includes("armJobSeekerProfileCompletionReminder"),
    );
  });

  it("uses 30 minutes when the configured delay is not a finite number", () => {
    assert.equal(jobSeekerProfileCompletionReminderDelayMs(Number.NaN), 1_800_000);
    assert.equal(
      jobSeekerProfileCompletionReminderDelayMs(Number.POSITIVE_INFINITY),
      1_800_000,
    );
    assert.equal(jobSeekerProfileCompletionReminderDelayMs(45), 2_700_000);
  });

  it("does not send for a completed registration, blocked, or suspended account", () => {
    assert.equal(
      shouldSendJobSeekerProfileCompletionReminder({
        ...incompleteSeeker,
        registrationStatus: "COMPLETED",
      }),
      false,
    );
    assert.equal(
      shouldSendJobSeekerProfileCompletionReminder({
        ...incompleteSeeker,
        accountStatus: "suspended",
      }),
      false,
    );
    assert.equal(
      shouldSendJobSeekerProfileCompletionReminder({
        ...completeSeeker,
        registrationStatus: "COMPLETED",
      }),
      false,
    );
  });

  it("treats each missing required profile section as incomplete", () => {
    const gaps: Array<Record<string, unknown>> = [
      { dateOfBirth: undefined, gender: "" },
      { jobRole: "", jobType: "", workMode: "" },
      { education: { level: "" } },
      { experienceType: "experienced", experiences: [] as Array<{ companyName: string; jobRole: string }> },
      { languages: [] as string[] },
      { availabilityStatus: "" },
    ];

    for (const gap of gaps) {
      const seeker = { ...completeSeeker, ...gap } as typeof completeSeeker;
      assert.equal(evaluateJobSeekerProfileCompletion(seeker).isComplete, false);
      assert.equal(shouldSendJobSeekerProfileCompletionReminder(seeker), true);
    }

    assert.equal(evaluateJobSeekerProfileCompletion(completeSeeker).isComplete, true);
    assert.equal(shouldSendJobSeekerProfileCompletionReminder(completeSeeker), false);
  });

  it("selects Hindi, Telugu, and English profile-completion templates from saved language", async () => {
    const now = new Date("2026-10-12T06:00:00.000Z");
    const hindi = createDeps({
      now,
      dueAt: now,
      seeker: { ...incompleteSeeker, whatsappLanguage: "hi" },
    });
    await processJobSeekerProfileCompletionReminder(jobSeekerId, hindi.deps);
    const hindiJob = hindi.enqueued[0] as { preferredLanguage: string };
    assert.equal(hindiJob.preferredLanguage, "hi");
    assert.deepEqual(
      resolveWhatsAppNotificationDelivery("JOBSEEKER_PROFILE_COMPLETION", "hi"),
      {
        templateName: "jobseeker_profile_completion_hi",
        languageCode: "hi",
      },
    );

    const telugu = createDeps({
      now,
      dueAt: now,
      seeker: { ...incompleteSeeker, whatsappLanguage: "te" },
    });
    await processJobSeekerProfileCompletionReminder(jobSeekerId, telugu.deps);
    const teluguJob = telugu.enqueued[0] as { preferredLanguage: string };
    assert.equal(teluguJob.preferredLanguage, "te");
    assert.deepEqual(
      resolveWhatsAppNotificationDelivery("JOBSEEKER_PROFILE_COMPLETION", "te"),
      {
        templateName: "jobseeker_profile_completion_te",
        languageCode: "te",
      },
    );

    const english = createDeps({
      now,
      dueAt: now,
      seeker: { ...incompleteSeeker, whatsappLanguage: "en" },
    });
    await processJobSeekerProfileCompletionReminder(jobSeekerId, english.deps);
    const englishJob = english.enqueued[0] as { preferredLanguage: string };
    assert.equal(englishJob.preferredLanguage, "en");
    assert.deepEqual(
      resolveWhatsAppNotificationDelivery("JOBSEEKER_PROFILE_COMPLETION", "en"),
      {
        templateName: "jobseeker_profile_completion",
        languageCode: "en",
      },
    );
    assert.equal(
      getWhatsAppNotificationTemplate("JOBSEEKER_PROFILE_COMPLETION")
        ?.localizedTemplateNames?.hi,
      "jobseeker_profile_completion_hi",
    );

    const tamil = createDeps({
      now,
      dueAt: now,
      seeker: { ...incompleteSeeker, whatsappLanguage: "ta" },
    });
    await processJobSeekerProfileCompletionReminder(jobSeekerId, tamil.deps);
    const tamilJob = tamil.enqueued[0] as { preferredLanguage: string };
    assert.equal(tamilJob.preferredLanguage, "ta");
    assert.deepEqual(
      resolveWhatsAppNotificationDelivery("JOBSEEKER_PROFILE_COMPLETION", "ta"),
      {
        templateName: "jobseeker_profile_completion_ta",
        languageCode: "ta",
      },
    );

    const kannada = createDeps({
      now,
      dueAt: now,
      seeker: { ...incompleteSeeker, whatsappLanguage: "kn" },
    });
    await processJobSeekerProfileCompletionReminder(jobSeekerId, kannada.deps);
    const kannadaJob = kannada.enqueued[0] as { preferredLanguage: string };
    assert.equal(kannadaJob.preferredLanguage, "kn");
    assert.deepEqual(
      resolveWhatsAppNotificationDelivery("JOBSEEKER_PROFILE_COMPLETION", "kn"),
      {
        templateName: "jobseeker_profile_completion_ka",
        languageCode: "kn",
      },
    );
  });

  it("invalidates processing and queued reminders when registration completes", async () => {
    const filters: Array<{ status?: { $in?: string[] } }> = [];
    mock.method(
      JobSeekerProfileCompletionReminderModel,
      "updateOne",
      async (filter: { status?: { $in?: string[] } }) => {
        filters.push(filter);
        return { modifiedCount: 1 };
      },
    );

    const cancelled = await skipPendingJobSeekerProfileCompletionReminder(
      jobSeekerId,
    );
    assert.equal(cancelled, true);
    assert.deepEqual(filters[0]?.status?.$in, [
      "scheduled",
      "failed",
      "processing",
      "queued",
    ]);

    cancelJobSeekerProfileCompletionReminder(jobSeekerId);
    await new Promise((resolve) => setTimeout(resolve, 20));
    assert.ok(filters.length >= 2);
  });

  it("does not enqueue WhatsApp when cancellation races with the worker", async () => {
    const now = new Date("2026-10-12T06:00:00.000Z");
    const { deps, enqueued, statuses } = createDeps({
      now,
      dueAt: now,
      status: "processing",
      seeker: incompleteSeeker,
      reminderAfterClaim: { dueAt: now, status: "skipped_complete" },
    });

    const result = await processJobSeekerProfileCompletionReminder(
      jobSeekerId,
      deps,
    );

    assert.equal(result, "skipped");
    assert.equal(enqueued.length, 0);
    assert.deepEqual(statuses, []);
  });

  it("does not overwrite a skipped reminder with a later failed sync", async () => {
    let updated = false;
    mock.method(
      JobSeekerProfileCompletionReminderModel,
      "findOne",
      () => ({
        select: () => ({
          lean: async () => ({ status: "skipped_complete" }),
        }),
      }),
    );
    mock.method(
      JobSeekerProfileCompletionReminderModel,
      "updateOne",
      async () => {
        updated = true;
        return { modifiedCount: 1 };
      },
    );

    await syncReminderWithDispatchStatus({
      event: "JOBSEEKER_PROFILE_COMPLETION",
      entityId: jobSeekerId,
      status: "failed",
      lastError: "template_not_found",
    });

    assert.equal(updated, false);

    const markFilters: Array<{ status?: { $nin?: string[] } }> = [];
    mock.restoreAll();
    mock.method(
      JobSeekerProfileCompletionReminderModel,
      "updateOne",
      async (filter: { status?: { $nin?: string[] } }) => {
        markFilters.push(filter);
        return { modifiedCount: 0 };
      },
    );
    const marked = await markJobSeekerProfileCompletionReminderStatus({
      jobSeekerId,
      status: "failed",
      lastError: "template_not_found",
    });
    assert.equal(marked, false);
    assert.deepEqual(markFilters[0]?.status?.$nin, [
      "skipped_complete",
      "skipped_ineligible",
      "accepted",
      "sent",
    ]);
  });

  it("reclaims a stale processing reminder and ignores a fresh one", async () => {
    const now = new Date("2026-10-12T06:00:00.000Z");
    const dueQueries: unknown[] = [];
    mock.method(
      JobSeekerProfileCompletionReminderModel,
      "find",
      (query: unknown) => {
        dueQueries.push(query);
        return {
          select: () => ({
            limit: () => ({
              lean: async () => [{ jobSeekerId }],
            }),
          }),
        };
      },
    );

    const ids = await findDueJobSeekerProfileCompletionReminderIds(now);
    assert.deepEqual(ids, [jobSeekerId]);
    const query = dueQueries[0] as {
      dueAt?: { $lte?: Date };
      $or?: Array<{
        status?: string | { $in?: string[] };
        updatedAt?: { $lte?: Date };
      }>;
    };
    assert.equal(query.dueAt?.$lte?.getTime(), now.getTime());
    assert.deepEqual(query.$or?.[0]?.status, {
      $in: ["scheduled", "failed", "queued"],
    });
    assert.equal(query.$or?.[1]?.status, "processing");
    assert.equal(
      query.$or?.[1]?.updatedAt?.$lte?.getTime(),
      now.getTime() - JOBSEEKER_PROFILE_COMPLETION_REMINDER_STALE_PROCESSING_MS,
    );

    const claimFilters: unknown[] = [];
    mock.method(
      JobSeekerProfileCompletionReminderModel,
      "findOneAndUpdate",
      async (filter: unknown) => {
        claimFilters.push(filter);
        return { jobSeekerId };
      },
    );
    const claimed = await claimJobSeekerProfileCompletionReminder(
      jobSeekerId,
      now,
    );
    assert.equal(claimed, true);
    const claim = claimFilters[0] as {
      $or?: Array<{ status?: string | { $in?: string[] } }>;
    };
    assert.deepEqual(claim.$or?.[0]?.status, {
      $in: ["scheduled", "failed", "queued"],
    });
    assert.equal(claim.$or?.[1]?.status, "processing");
  });

  it("skips an invalid WhatsApp number without sending", async () => {
    const now = new Date("2026-10-12T06:00:00.000Z");
    const { deps, enqueued, statuses } = createDeps({
      now,
      dueAt: now,
      seeker: { ...incompleteSeeker, whatsappNumber: "12" },
    });
    const result = await processJobSeekerProfileCompletionReminder(
      jobSeekerId,
      deps,
    );
    assert.equal(result, "skipped");
    assert.equal(enqueued.length, 0);
    assert.deepEqual(statuses, ["skipped_ineligible"]);
  });

  it("does not send when the WhatsApp number is unverified", async () => {
    const now = new Date("2026-10-12T06:00:00.000Z");
    const { deps, enqueued, statuses } = createDeps({
      now,
      dueAt: now,
      seeker: { ...incompleteSeeker, isWhatsappVerified: false },
    });
    const result = await processJobSeekerProfileCompletionReminder(
      jobSeekerId,
      deps,
    );
    assert.equal(result, "skipped");
    assert.equal(enqueued.length, 0);
    assert.deepEqual(statuses, ["skipped_ineligible"]);
  });

  it("retries a queued reminder that never reached Meta", async () => {
    const now = new Date("2026-10-12T06:00:00.000Z");
    const { deps, enqueued, statuses } = createDeps({
      now,
      dueAt: now,
      status: "queued",
      seeker: { ...incompleteSeeker, whatsappLanguage: "hi" },
    });
    const result = await processJobSeekerProfileCompletionReminder(
      jobSeekerId,
      deps,
    );
    const job = enqueued[0] as { preferredLanguage?: string };
    assert.equal(result, "queued");
    assert.equal(enqueued.length, 1);
    assert.equal(job.preferredLanguage, "hi");
    assert.deepEqual(statuses, ["queued"]);
  });

  it("records template misconfiguration without throwing", async () => {
    const now = new Date("2026-10-12T06:00:00.000Z");
    const { deps, statuses } = createDeps({
      now,
      dueAt: now,
      seeker: incompleteSeeker,
      enqueueResult: "skipped_unconfigured",
    });
    const result = await processJobSeekerProfileCompletionReminder(
      jobSeekerId,
      deps,
    );
    assert.equal(result, "failed");
    assert.deepEqual(statuses, ["failed"]);
  });

  it("recovers delayed reminders through sweep when Redis enqueue fails", () => {
    const queueSource = readFileSync(
      new URL("./jobseeker-profile-completion-reminder.queue.ts", import.meta.url),
      "utf8",
    );
    assert.ok(queueSource.includes("queue_unavailable"));
    assert.ok(queueSource.includes("duplicate queue job skipped"));
    assert.ok(queueSource.includes("processDueJobSeekerProfileCompletionReminders"));
    assert.ok(queueSource.includes("arm rejected"));
  });

  it("aborts WhatsApp delivery after the reminder was invalidated", async () => {
    const restoreReady = stubMongoReady(true);
    try {
      const sent: string[] = [];
      mock.method(
        JobSeekerProfileCompletionReminderModel,
        "findOne",
        () => ({
          select: () => ({
            lean: async () => ({ status: "skipped_complete" }),
          }),
        }),
      );
      mock.method(
        WhatsAppService.prototype,
        "sendTemplateMessage",
        async () => {
          sent.push("sent");
          return { messageId: "wamid.skip", messageStatus: "accepted" };
        },
      );
      mock.method(WhatsAppNotificationDispatchModel, "findOne", () => ({
        select: () => ({
          lean: async () => null,
        }),
      }));

      const job = {
        event: "JOBSEEKER_PROFILE_COMPLETION" as const,
        entityId: jobSeekerId,
        phoneNumber: verifiedPhone,
        templateName: "jobseeker_profile_completion",
        languageCode: "en",
        bodyParameters: [],
        idempotencyKey: `JOBSEEKER_PROFILE_COMPLETION:${jobSeekerId}`,
      };

      assert.equal(await shouldAbortJobSeekerProfileCompletionDelivery(job), true);
      await notificationQueue.deliverWhatsAppNotificationJob(job);
      assert.deepEqual(sent, []);
    } finally {
      restoreReady();
    }
  });
});
