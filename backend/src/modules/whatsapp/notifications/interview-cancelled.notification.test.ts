import assert from "node:assert/strict";
import { afterEach, describe, it, mock } from "node:test";
import mongoose from "mongoose";
import { ApplicationModel } from "../../applications/application.model.js";
import { applicationService } from "../../applications/application.service.js";
import type { ApplicationInterview } from "../../applications/application.types.js";
import { EmployerModel } from "../../employers/employer.model.js";
import { JobModel } from "../../jobs/job.model.js";
import { JobSeekerModel } from "../../job-seekers/job-seeker.model.js";
import { notificationService } from "../../notifications/notification.service.js";
import { SavedCandidateModel } from "../../saved-candidates/saved-candidate.model.js";
import { WhatsAppService } from "../whatsapp.service.js";
import { interviewCancelledWhatsApp } from "./interview-cancelled.notification.js";
import { interviewRescheduledWhatsApp } from "./interview-rescheduled.notification.js";
import {
  buildWhatsAppNotificationBodyParameters,
  buildWhatsAppNotificationUrlButtonParameters,
  getWhatsAppNotificationTemplate,
  whatsAppNotificationIdempotencyKey,
} from "./whatsapp-notification.policy.js";
import { enqueueWhatsAppNotification } from "./whatsapp-notification.service.js";
import { WhatsAppNotificationDispatchModel } from "./whatsapp-notification.model.js";
import * as notificationQueue from "./whatsapp-notification.queue.js";
import type { WhatsAppNotificationPayload } from "./whatsapp-notification.types.js";

const applicationId = "64f0000000000000000000cc";
const otherApplicationId = "64f0000000000000000000cd";
const employerId = "64f0000000000000000000bb";
const otherEmployerId = "64f0000000000000000000ff";
const jobId = "64f0000000000000000000dd";
const otherJobId = "64f0000000000000000000de";
const jobSeekerId = "64f0000000000000000000aa";
const otherJobSeekerId = "64f0000000000000000000ee";
const seekerPhone = "9876543210";
const otherSeekerPhone = "9123456780";
const employerPhone = "9000000001";

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

function wait(ms = 40): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

function interview(
  overrides: Partial<ApplicationInterview> = {},
): ApplicationInterview {
  return {
    date: "2026-11-12",
    time: "16:30",
    mode: "offline",
    meetingLink: "",
    venue: "Gachibowli site office",
    instructions: "",
    interviewerName: "Ravi",
    interviewerDesignation: "",
    interviewerEmail: "",
    interviewerPhone: "",
    cancelledAt: null,
    cancellationReason: "",
    cancelledByName: "",
    ...overrides,
  };
}

function applicationDocument(
  overrides: Record<string, unknown> = {},
  options?: { clearInterviewOnSave?: boolean },
) {
  const doc = {
    _id: new mongoose.Types.ObjectId(applicationId),
    employerId: new mongoose.Types.ObjectId(employerId),
    jobId: new mongoose.Types.ObjectId(jobId),
    jobSeekerId: new mongoose.Types.ObjectId(jobSeekerId),
    publicJobId: "AJ-2026-000062",
    status: "interview_scheduled",
    resumeVersion: 1,
    resumeStatus: "complete",
    resumeSource: "generated",
    resumeSnapshot: {
      resumeJson: {
        header: { fullName: "Veeresh" },
        sections: { contact: {} },
      },
    },
    interview: interview(),
    offer: null,
    shortlist: null,
    statusHistory: [] as unknown[],
    employerNotes: "",
    appliedAt: new Date("2026-08-01T00:00:00.000Z"),
    saveCount: 0,
    async save(this: {
      saveCount: number;
      interview: { date: string; time: string };
    }) {
      this.saveCount += 1;
      if (options?.clearInterviewOnSave) {
        this.interview.date = "";
        this.interview.time = "";
      }
      return this;
    },
    ...overrides,
  };
  return doc;
}

function installSchedulingMocks(input?: {
  job?: Record<string, unknown> | null;
  employer?: Record<string, unknown> | null;
  seeker?: Record<string, unknown> | null;
  application?: ReturnType<typeof applicationDocument> | null;
  enforceOwner?: boolean;
}) {
  const queued: WhatsAppNotificationPayload[] = [];
  const application =
    input && "application" in input
      ? input.application
      : applicationDocument();
  const job =
    input && "job" in input
      ? input.job
      : {
          jobTitle: "Welder",
          companyName: "Northwind Services",
          jobId: "AJ-2026-000062",
        };
  const employer =
    input && "employer" in input
      ? input.employer
      : {
          companyName: "Fallback Company",
          establishmentName: "Fallback Establishment",
          whatsappNumber: employerPhone,
        };
  const seeker =
    input && "seeker" in input
      ? input.seeker
      : {
          whatsappNumber: seekerPhone,
          availabilityStatus: "available",
          preferredJobLocation: "Hyderabad",
        };

  mock.method(
    ApplicationModel,
    "findOne",
    async (query: { employerId?: unknown }) => {
      if (
        input?.enforceOwner &&
        String(query?.employerId ?? "") !== employerId
      ) {
        return null;
      }
      return application;
    },
  );
  mock.method(JobModel, "findById", () => queryResult(job));
  mock.method(EmployerModel, "findById", () => queryResult(employer));
  mock.method(JobSeekerModel, "findById", () => queryResult(seeker));
  mock.method(SavedCandidateModel, "findOne", () => queryResult(null));
  mock.method(
    notificationService,
    "handleApplicationEvent",
    async () => undefined,
  );
  mock.method(
    interviewCancelledWhatsApp,
    "enqueue",
    async (payload: WhatsAppNotificationPayload) => {
      queued.push(payload);
      return "queued" as const;
    },
  );
  mock.method(interviewRescheduledWhatsApp, "enqueue", async () => {
    return "queued" as const;
  });

  return { queued, application };
}

describe("interview_cancelled template", () => {
  it("uses the approved name, language, and four body parameters", () => {
    const template = getWhatsAppNotificationTemplate("INTERVIEW_CANCELLED");
    assert.equal(template?.templateName, "interview_cancelled");
    assert.equal(template?.defaultLanguage, "en");

    const payload: WhatsAppNotificationPayload = {
      event: "INTERVIEW_CANCELLED",
      entityId: applicationId,
      phoneNumber: seekerPhone,
      jobTitle: "Welder",
      companyName: "Northwind Services",
      interviewDate: "12 November 2026",
      interviewTime: "4:30 PM",
    };
    assert.deepEqual(
      buildWhatsAppNotificationBodyParameters("INTERVIEW_CANCELLED", payload),
      ["Welder", "Northwind Services", "12 November 2026", "4:30 PM"],
    );
    assert.deepEqual(
      buildWhatsAppNotificationUrlButtonParameters(
        "INTERVIEW_CANCELLED",
        payload,
      ),
      [],
    );
    assert.equal(
      whatsAppNotificationIdempotencyKey("INTERVIEW_CANCELLED", applicationId),
      `INTERVIEW_CANCELLED:${applicationId}`,
    );
  });
});

describe("interview_cancelled scheduling", () => {
  afterEach(() => {
    mock.restoreAll();
  });

  it("queues the cancelled interview details for the owning jobseeker", async () => {
    const { queued, application } = installSchedulingMocks();

    const result = await applicationService.cancelInterviewForEmployer({
      employerId,
      applicationId,
      reason: "Role filled",
      cancelledByName: "Ram",
    });
    await wait();

    assert.equal(application?.saveCount, 1);
    assert.ok(application?.interview.cancelledAt);
    assert.equal(result.interview.date, "2026-11-12");
    assert.equal(queued.length, 1);
    assert.equal(queued[0]?.event, "INTERVIEW_CANCELLED");
    assert.equal(queued[0]?.entityId, applicationId);
    assert.equal(queued[0]?.phoneNumber, seekerPhone);
    assert.notEqual(queued[0]?.phoneNumber, employerPhone);
    assert.equal(queued[0]?.jobTitle, "Welder");
    assert.equal(queued[0]?.companyName, "Northwind Services");
    assert.equal(queued[0]?.interviewDate, "12 November 2026");
    assert.equal(queued[0]?.interviewTime, "4:30 PM");
    assert.equal(queued[0]?.preferredLanguage, "en");
    assert.equal(queued[0]?.urlButtonParameters, undefined);
  });

  it("keeps the original date and time when save clears the interview fields", async () => {
    const { queued, application } = installSchedulingMocks({
      application: applicationDocument({}, { clearInterviewOnSave: true }),
    });

    await applicationService.cancelInterviewForEmployer({
      employerId,
      applicationId,
      reason: "Role filled",
      cancelledByName: "Ram",
    });
    await wait();

    assert.equal(application?.interview.date, "");
    assert.equal(application?.interview.time, "");
    assert.ok(application?.interview.cancelledAt);
    assert.equal(queued[0]?.interviewDate, "12 November 2026");
    assert.equal(queued[0]?.interviewTime, "4:30 PM");
  });

  it("uses employer and establishment company fallbacks", async () => {
    const queued: WhatsAppNotificationPayload[] = [];
    mock.method(JobModel, "findById", () =>
      queryResult({ jobTitle: "Carpenter", companyName: "" }),
    );
    mock.method(EmployerModel, "findById", () =>
      queryResult({ companyName: "", establishmentName: "Harbour Yard" }),
    );
    mock.method(JobSeekerModel, "findById", () =>
      queryResult({ whatsappNumber: seekerPhone }),
    );
    mock.method(
      interviewCancelledWhatsApp,
      "enqueue",
      async (payload: WhatsAppNotificationPayload) => {
        queued.push(payload);
        return "queued" as const;
      },
    );

    interviewCancelledWhatsApp.schedule({
      applicationId,
      jobId,
      employerId,
      jobSeekerId,
      interviewDate: "2026-11-12",
      interviewTime: "16:30",
    });
    await wait();

    assert.equal(queued[0]?.jobTitle, "Carpenter");
    assert.equal(queued[0]?.companyName, "Harbour Yard");
  });

  it("sends only to the jobseeker on the selected application", async () => {
    const queued: WhatsAppNotificationPayload[] = [];
    mock.method(JobModel, "findById", (id: unknown) =>
      queryResult({
        jobTitle: String(id) === otherJobId ? "Carpenter" : "Welder",
        companyName: "Northwind Services",
      }),
    );
    mock.method(EmployerModel, "findById", () =>
      queryResult({ companyName: "Northwind Services" }),
    );
    mock.method(JobSeekerModel, "findById", (id: unknown) =>
      queryResult({
        whatsappNumber:
          String(id) === otherJobSeekerId ? otherSeekerPhone : seekerPhone,
      }),
    );
    mock.method(
      interviewCancelledWhatsApp,
      "enqueue",
      async (payload: WhatsAppNotificationPayload) => {
        queued.push(payload);
        return "queued" as const;
      },
    );

    interviewCancelledWhatsApp.schedule({
      applicationId,
      jobId,
      employerId,
      jobSeekerId,
      interviewDate: "2026-11-12",
      interviewTime: "16:30",
    });
    await wait();

    assert.equal(queued.length, 1);
    assert.equal(queued[0]?.entityId, applicationId);
    assert.equal(queued[0]?.phoneNumber, seekerPhone);
    assert.equal(queued[0]?.jobTitle, "Welder");
    assert.notEqual(queued[0]?.phoneNumber, otherSeekerPhone);
    assert.notEqual(queued[0]?.entityId, otherApplicationId);
  });

  it("does not queue a failed, repeated, or foreign cancellation", async () => {
    const missing = installSchedulingMocks({ application: null });
    await assert.rejects(
      () =>
        applicationService.cancelInterviewForEmployer({
          employerId,
          applicationId,
          reason: "Role filled",
          cancelledByName: "Ram",
        }),
      /Application not found/,
    );

    mock.restoreAll();
    const unscheduled = installSchedulingMocks({
      application: applicationDocument({
        interview: interview({ date: "", time: "" }),
      }),
    });
    await assert.rejects(
      () =>
        applicationService.cancelInterviewForEmployer({
          employerId,
          applicationId,
          reason: "Role filled",
          cancelledByName: "Ram",
        }),
      /No interview is scheduled/,
    );

    mock.restoreAll();
    const repeated = installSchedulingMocks();
    await applicationService.cancelInterviewForEmployer({
      employerId,
      applicationId,
      reason: "Role filled",
      cancelledByName: "Ram",
    });
    await assert.rejects(
      () =>
        applicationService.cancelInterviewForEmployer({
          employerId,
          applicationId,
          reason: "Role filled",
          cancelledByName: "Ram",
        }),
      /already cancelled/,
    );
    await wait();

    mock.restoreAll();
    const foreign = installSchedulingMocks({ enforceOwner: true });
    await assert.rejects(
      () =>
        applicationService.cancelInterviewForEmployer({
          employerId: otherEmployerId,
          applicationId,
          reason: "Role filled",
          cancelledByName: "Ram",
        }),
      /Application not found/,
    );

    assert.equal(missing.queued.length, 0);
    assert.equal(unscheduled.queued.length, 0);
    assert.equal(unscheduled.application?.saveCount, 0);
    assert.equal(repeated.queued.length, 1);
    assert.equal(repeated.application?.saveCount, 1);
    assert.equal(foreign.queued.length, 0);
    assert.equal(foreign.application?.saveCount, 0);
  });

  it("does not queue when an interview is rescheduled", async () => {
    const { queued } = installSchedulingMocks({
      application: applicationDocument({
        interview: interview({ date: "2026-11-01", time: "09:00" }),
      }),
    });

    const result = await applicationService.updateInterviewForEmployer({
      employerId,
      applicationId,
      interview: interview({ date: "2026-11-12", time: "16:30" }),
      updatedByName: "Ram",
    });
    await wait();

    assert.equal(result.action, "updated");
    assert.equal(queued.length, 0);
  });

  it("skips the notification when required data is missing", async () => {
    const queued: WhatsAppNotificationPayload[] = [];
    mock.method(
      interviewCancelledWhatsApp,
      "enqueue",
      async (payload: WhatsAppNotificationPayload) => {
        queued.push(payload);
        return "queued" as const;
      },
    );
    mock.method(JobModel, "findById", () =>
      queryResult({ jobTitle: "", companyName: "Northwind Services" }),
    );
    mock.method(EmployerModel, "findById", () =>
      queryResult({ companyName: "", establishmentName: "" }),
    );
    mock.method(JobSeekerModel, "findById", () =>
      queryResult({ whatsappNumber: seekerPhone }),
    );

    interviewCancelledWhatsApp.schedule({
      applicationId,
      jobId,
      employerId,
      jobSeekerId,
      interviewDate: "2026-11-12",
      interviewTime: "16:30",
    });
    interviewCancelledWhatsApp.schedule({
      applicationId,
      jobId,
      employerId,
      jobSeekerId,
      interviewDate: "not-a-date",
      interviewTime: "16:30",
    });
    await wait();
    assert.equal(queued.length, 0);

    mock.restoreAll();
    const missingPhone = installSchedulingMocks({
      seeker: { whatsappNumber: "" },
    });
    await applicationService.cancelInterviewForEmployer({
      employerId,
      applicationId,
      reason: "Role filled",
      cancelledByName: "Ram",
    });
    await wait();
    assert.equal(missingPhone.application?.saveCount, 1);
    assert.ok(missingPhone.application?.interview.cancelledAt);
    assert.equal(missingPhone.queued.length, 0);
  });

  it("keeps the cancellation when WhatsApp enqueue fails", async () => {
    const { application } = installSchedulingMocks();
    mock.method(interviewCancelledWhatsApp, "enqueue", async () => {
      throw new Error("WhatsApp unavailable");
    });

    const result = await applicationService.cancelInterviewForEmployer({
      employerId,
      applicationId,
      reason: "Role filled",
      cancelledByName: "Ram",
    });
    await wait();

    assert.equal(application?.saveCount, 1);
    assert.ok(application?.interview.cancelledAt);
    assert.equal(result.interview.cancellationReason, "Role filled");
    assert.equal(application?.interview.date, "2026-11-12");
  });

  it("does not queue when the database save fails", async () => {
    const application = applicationDocument();
    application.save = async () => {
      throw new Error("database write failed");
    };
    const { queued } = installSchedulingMocks({ application });

    await assert.rejects(
      () =>
        applicationService.cancelInterviewForEmployer({
          employerId,
          applicationId,
          reason: "Role filled",
          cancelledByName: "Ram",
        }),
      /database write failed/,
    );
    await wait();

    assert.equal(queued.length, 0);
  });
});

describe("interview_cancelled delivery", () => {
  afterEach(() => {
    mock.restoreAll();
  });

  it("claims one idempotency key and skips a duplicate request", async () => {
    const seen = new Set<string>();
    const queued: Array<{ phoneNumber: string; bodyParameters: string[] }> =
      [];
    const payload: WhatsAppNotificationPayload = {
      event: "INTERVIEW_CANCELLED",
      entityId: applicationId,
      phoneNumber: seekerPhone,
      jobTitle: "Welder",
      companyName: "Northwind Services",
      interviewDate: "12 November 2026",
      interviewTime: "4:30 PM",
      preferredLanguage: "en",
    };
    const deps = {
      claim: async (input: { idempotencyKey: string }) => {
        if (seen.has(input.idempotencyKey)) {
          return "duplicate" as const;
        }
        seen.add(input.idempotencyKey);
        return "claimed" as const;
      },
      enqueueJob: async (job: {
        phoneNumber: string;
        bodyParameters: string[];
        urlButtonParameters?: string[];
      }) => {
        queued.push(job);
        assert.equal(job.urlButtonParameters, undefined);
      },
    };

    const first = await enqueueWhatsAppNotification(payload, deps);
    const second = await enqueueWhatsAppNotification(payload, deps);

    assert.equal(first, "queued");
    assert.equal(second, "skipped_duplicate");
    assert.equal(queued.length, 1);
    assert.deepEqual(queued[0]?.bodyParameters, [
      "Welder",
      "Northwind Services",
      "12 November 2026",
      "4:30 PM",
    ]);
    assert.equal(queued[0]?.phoneNumber, seekerPhone);
  });

  it("does not send again after a successful dispatch and does not roll back on API failure", async () => {
    let sendCount = 0;
    let lookups = 0;
    mock.method(WhatsAppService.prototype, "sendTemplateMessage", async () => {
      sendCount += 1;
      return { messageId: "wamid.cancelled", messageStatus: "accepted" };
    });
    mock.method(WhatsAppNotificationDispatchModel, "findOne", () => ({
      select: () => ({
        lean: async () => (lookups++ === 0 ? null : { _id: "already-sent" }),
      }),
    }));
    mock.method(WhatsAppNotificationDispatchModel, "updateOne", async () => ({
      acknowledged: true,
    }));

    const job = {
      event: "INTERVIEW_CANCELLED" as const,
      entityId: applicationId,
      phoneNumber: `91${seekerPhone}`,
      templateName: "interview_cancelled",
      languageCode: "en",
      bodyParameters: [
        "Welder",
        "Northwind Services",
        "12 November 2026",
        "4:30 PM",
      ],
      idempotencyKey: `INTERVIEW_CANCELLED:${applicationId}`,
    };

    await notificationQueue.deliverWhatsAppNotificationJob(job);
    await notificationQueue.deliverWhatsAppNotificationJob(job);
    assert.equal(sendCount, 1);

    mock.restoreAll();
    mock.method(WhatsAppNotificationDispatchModel, "findOne", () => ({
      select: () => ({
        lean: async () => null,
      }),
    }));
    mock.method(WhatsAppService.prototype, "sendTemplateMessage", async () => {
      throw new Error("WhatsApp template delivery failed");
    });

    const savedCancellation = { cancelled: true, date: "2026-11-12" };
    await assert.rejects(
      () => notificationQueue.deliverWhatsAppNotificationJob(job),
      /WhatsApp template delivery failed/,
    );
    assert.deepEqual(savedCancellation, {
      cancelled: true,
      date: "2026-11-12",
    });
  });
});
