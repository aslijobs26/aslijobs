import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { afterEach, describe, it, mock } from "node:test";
import { env } from "../../../config/env.js";
import { JobSeekerProfileCompletionReminderModel } from "./jobseeker-profile-completion-reminder.model.js";
import {
  isJobSeekerProfileCompletionReminderDue,
  jobSeekerProfileCompletionReminderDelayMs,
  shouldSendJobSeekerProfileCompletionReminder,
} from "./jobseeker-profile-completion-reminder.policy.js";
import {
  enqueueJobSeekerProfileCompletionReminder,
  getJobSeekerProfileCompletionReminderDelayMs,
  processJobSeekerProfileCompletionReminder,
  type ProcessJobSeekerProfileCompletionReminderDeps,
} from "./jobseeker-profile-completion-reminder.service.js";
import { jobSeekerProfileCompletionReminderJobId } from "./jobseeker-profile-completion-reminder.queue.js";
import {
  buildWhatsAppNotificationBodyParameters,
  buildWhatsAppNotificationUrlButtonParameters,
  getWhatsAppNotificationTemplate,
  JOBSEEKER_PROFILE_COMPLETION_BUTTON_URL,
  JOBSEEKER_PROFILE_COMPLETION_REQUIRED_BUTTON_URL,
  resolveWhatsAppNotificationLanguage,
  whatsAppNotificationIdempotencyKey,
} from "./whatsapp-notification.policy.js";
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
  claim?: boolean;
  seeker?: typeof incompleteSeeker | typeof completeSeeker | null;
  enqueueResult?: WhatsAppNotificationEnqueueResult;
  enqueueError?: Error;
  now?: Date;
}) {
  const enqueued: unknown[] = [];
  const statuses: string[] = [];
  let claimed = false;
  const now = options.now ?? new Date("2026-10-12T06:00:00.000Z");
  const deps: ProcessJobSeekerProfileCompletionReminderDeps = {
    loadReminder: async () =>
      options.dueAt
        ? { dueAt: options.dueAt, status: options.status ?? "scheduled" }
        : null,
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
});
