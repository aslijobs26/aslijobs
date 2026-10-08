import assert from "node:assert/strict";
import { afterEach, describe, it, mock } from "node:test";
import { EmployerProfileCompletionReminderModel } from "./employer-profile-completion-reminder.model.js";
import {
  enqueueEmployerProfileCompletionReminder,
  getEmployerProfileCompletionReminderDelayMs,
  processEmployerProfileCompletionReminder,
  type ProcessEmployerProfileCompletionReminderDeps,
} from "./employer-profile-completion-reminder.service.js";
import type { WhatsAppNotificationEnqueueResult } from "./whatsapp-notification.types.js";

const employerId = "64f000000000000000000011";

function createDeps(options: {
  claim?: boolean;
  employer?: {
    isProfileComplete: boolean;
    registrationStatus: string;
    whatsappNumber: string;
    companyName?: string;
  } | null;
  enqueueResult?: WhatsAppNotificationEnqueueResult;
  enqueueError?: Error;
}) {
  const enqueued: unknown[] = [];
  const statuses: string[] = [];
  const deps: ProcessEmployerProfileCompletionReminderDeps = {
    claim: async () => options.claim !== false,
    loadEmployer: async () => options.employer ?? null,
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
  };
  return { enqueued, statuses, deps };
}

describe("processEmployerProfileCompletionReminder", () => {
  it("sends after the delay when the latest profile is still incomplete", async () => {
    const { deps, enqueued, statuses } = createDeps({
      employer: {
        isProfileComplete: false,
        registrationStatus: "otp_verified",
        whatsappNumber: "9876543210",
        companyName: "Open Company",
      },
    });

    const result = await processEmployerProfileCompletionReminder(
      employerId,
      deps,
    );

    assert.equal(result, "sent");
    assert.equal(enqueued.length, 1);
    assert.deepEqual(statuses, ["sent"]);
    const job = enqueued[0] as { event: string; phoneNumber: string };
    assert.equal(job.event, "EMPLOYER_PROFILE_COMPLETION_REQUIRED");
    assert.equal(job.phoneNumber, "9876543210");
  });

  it("does not send when the employer completed the profile before the reminder ran", async () => {
    const { deps, enqueued, statuses } = createDeps({
      employer: {
        isProfileComplete: true,
        registrationStatus: "completed",
        whatsappNumber: "9876543210",
      },
    });

    const result = await processEmployerProfileCompletionReminder(
      employerId,
      deps,
    );

    assert.equal(result, "skipped");
    assert.equal(enqueued.length, 0);
    assert.deepEqual(statuses, ["skipped_complete"]);
  });

  it("does not enqueue again when the reminder job was already claimed", async () => {
    const { deps, enqueued } = createDeps({
      claim: false,
      employer: {
        isProfileComplete: false,
        registrationStatus: "otp_verified",
        whatsappNumber: "9876543210",
      },
    });

    const result = await processEmployerProfileCompletionReminder(
      employerId,
      deps,
    );

    assert.equal(result, "skipped");
    assert.equal(enqueued.length, 0);
  });

  it("does not send a duplicate WhatsApp message when the same reminder job retries", async () => {
    const { deps, enqueued, statuses } = createDeps({
      employer: {
        isProfileComplete: false,
        registrationStatus: "otp_verified",
        whatsappNumber: "9876543210",
      },
      enqueueResult: "skipped_duplicate",
    });

    const result = await processEmployerProfileCompletionReminder(
      employerId,
      deps,
    );

    assert.equal(result, "skipped");
    assert.equal(enqueued.length, 1);
    assert.deepEqual(statuses, ["sent"]);
  });

  it("does not throw when WhatsApp notification delivery fails", async () => {
    const { deps, enqueued } = createDeps({
      employer: {
        isProfileComplete: false,
        registrationStatus: "otp_verified",
        whatsappNumber: "9876543210",
      },
      enqueueError: new Error("WhatsApp template delivery failed"),
    });

    const result = await processEmployerProfileCompletionReminder(
      employerId,
      deps,
    );

    assert.equal(result, "failed");
    assert.equal(enqueued.length, 0);
  });
});

describe("Company Profile OTP reminder flow", () => {
  afterEach(() => {
    mock.restoreAll();
  });

  it("TEST A: company OTP verify with incomplete profile schedules the reminder", async () => {
    const employerId = "64f0000000000000000000aa";
    let scheduledDueAt: Date | null = null;
    mock.method(
      EmployerProfileCompletionReminderModel,
      "updateOne",
      async (
        _filter: unknown,
        update: { $setOnInsert?: { employerId?: string; dueAt?: Date } },
      ) => {
        scheduledDueAt = update.$setOnInsert?.dueAt ?? null;
        return { upsertedCount: 1 };
      },
    );

    const result = await enqueueEmployerProfileCompletionReminder(employerId);
    assert.equal(result, "scheduled");
    assert.ok(scheduledDueAt);
    const delayMs =
      (scheduledDueAt as Date).getTime() - Date.now();
    const expected = getEmployerProfileCompletionReminderDelayMs();
    assert.ok(Math.abs(delayMs - expected) < 2_000);
  });

  it("TEST B: company profile still incomplete after delay sends the reminder", async () => {
    const { deps, enqueued } = createDeps({
      employer: {
        isProfileComplete: false,
        registrationStatus: "otp_verified",
        whatsappNumber: "9876543210",
        companyName: "Veeresh",
      },
    });
    const result = await processEmployerProfileCompletionReminder(
      employerId,
      deps,
    );
    assert.equal(result, "sent");
    const job = enqueued[0] as { event: string; employerName: string };
    assert.equal(job.event, "EMPLOYER_PROFILE_COMPLETION_REQUIRED");
    assert.equal(job.employerName, "Veeresh");
  });

  it("TEST C: company profile completed before delay skips the reminder", async () => {
    const { deps, enqueued } = createDeps({
      employer: {
        isProfileComplete: true,
        registrationStatus: "completed",
        whatsappNumber: "9876543210",
        companyName: "Veeresh",
      },
    });
    const result = await processEmployerProfileCompletionReminder(
      employerId,
      deps,
    );
    assert.equal(result, "skipped");
    assert.equal(enqueued.length, 0);
  });

  it("TEST D: reminder worker retry does not send a duplicate WhatsApp message", async () => {
    const { deps } = createDeps({
      employer: {
        isProfileComplete: false,
        registrationStatus: "otp_verified",
        whatsappNumber: "9876543210",
        companyName: "Veeresh",
      },
      enqueueResult: "skipped_duplicate",
    });
    const result = await processEmployerProfileCompletionReminder(
      employerId,
      deps,
    );
    assert.equal(result, "skipped");
  });

  it("TEST E: Meta template failure does not affect the employer account", async () => {
    const { deps } = createDeps({
      employer: {
        isProfileComplete: false,
        registrationStatus: "otp_verified",
        whatsappNumber: "9876543210",
        companyName: "Veeresh",
      },
      enqueueError: new Error("WhatsApp template delivery failed"),
    });
    const result = await processEmployerProfileCompletionReminder(
      employerId,
      deps,
    );
    assert.equal(result, "failed");
  });
});
