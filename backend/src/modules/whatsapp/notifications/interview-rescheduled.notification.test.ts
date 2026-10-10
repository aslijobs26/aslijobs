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
import {
  interviewRescheduledIdempotencyScope,
  interviewRescheduledWhatsApp,
} from "./interview-rescheduled.notification.js";
import { interviewScheduledOfflineWhatsApp } from "./interview-scheduled-offline.notification.js";
import { interviewScheduledOnlineWhatsApp } from "./interview-scheduled-online.notification.js";
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
    date: "2026-11-01",
    time: "09:00",
    mode: "offline",
    meetingLink: "",
    venue: "North gate",
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

function applicationDocument(overrides: Record<string, unknown> = {}) {
  return {
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
    async save(this: { saveCount: number }) {
      this.saveCount += 1;
      return this;
    },
    ...overrides,
  };
}

function installSchedulingMocks(input?: {
  job?: Record<string, unknown> | null;
  employer?: Record<string, unknown> | null;
  seeker?: Record<string, unknown> | null;
  application?: ReturnType<typeof applicationDocument> | null;
  enforceOwner?: boolean;
}) {
  const rescheduled: WhatsAppNotificationPayload[] = [];
  const scheduledOffline: WhatsAppNotificationPayload[] = [];
  const scheduledOnline: WhatsAppNotificationPayload[] = [];
  const cancelled: WhatsAppNotificationPayload[] = [];
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
    interviewRescheduledWhatsApp,
    "enqueue",
    async (payload: WhatsAppNotificationPayload) => {
      rescheduled.push(payload);
      return "queued" as const;
    },
  );
  mock.method(
    interviewScheduledOfflineWhatsApp,
    "enqueue",
    async (payload: WhatsAppNotificationPayload) => {
      scheduledOffline.push(payload);
      return "queued" as const;
    },
  );
  mock.method(
    interviewScheduledOnlineWhatsApp,
    "enqueue",
    async (payload: WhatsAppNotificationPayload) => {
      scheduledOnline.push(payload);
      return "queued" as const;
    },
  );
  mock.method(
    interviewCancelledWhatsApp,
    "enqueue",
    async (payload: WhatsAppNotificationPayload) => {
      cancelled.push(payload);
      return "queued" as const;
    },
  );

  return {
    rescheduled,
    scheduledOffline,
    scheduledOnline,
    cancelled,
    application,
  };
}

describe("interview_rescheduled template", () => {
  it("uses the approved name, language, and five body parameters", () => {
    const template = getWhatsAppNotificationTemplate("INTERVIEW_RESCHEDULED");
    assert.equal(template?.templateName, "interview_rescheduled");
    assert.equal(template?.defaultLanguage, "en");

    const payload: WhatsAppNotificationPayload = {
      event: "INTERVIEW_RESCHEDULED",
      entityId: applicationId,
      phoneNumber: seekerPhone,
      jobTitle: "Welder",
      companyName: "Northwind Services",
      interviewDate: "1 December 2026",
      interviewTime: "11:00 AM",
      interviewVenue: "South gate",
    };
    assert.deepEqual(
      buildWhatsAppNotificationBodyParameters("INTERVIEW_RESCHEDULED", payload),
      [
        "Welder",
        "Northwind Services",
        "1 December 2026",
        "11:00 AM",
        "South gate",
      ],
    );
    assert.deepEqual(
      buildWhatsAppNotificationUrlButtonParameters(
        "INTERVIEW_RESCHEDULED",
        payload,
      ),
      [],
    );
    assert.equal(
      interviewRescheduledIdempotencyScope("2026-12-01", "11:00"),
      "2026-12-01-1100",
    );
    assert.equal(
      whatsAppNotificationIdempotencyKey(
        "INTERVIEW_RESCHEDULED",
        applicationId,
        "2026-12-01-1100",
      ),
      `INTERVIEW_RESCHEDULED:${applicationId}:2026-12-01-1100`,
    );
  });
});

describe("interview_rescheduled scheduling", () => {
  afterEach(() => {
    mock.restoreAll();
  });

  it("sends the first offline schedule on the scheduled template only", async () => {
    const { rescheduled, scheduledOffline } = installSchedulingMocks({
      application: applicationDocument({
        status: "shortlisted",
        interview: interview({ date: "", time: "", venue: "" }),
      }),
    });

    const result = await applicationService.updateInterviewForEmployer({
      employerId,
      applicationId,
      interview: interview({
        date: "2026-12-01",
        time: "11:00",
        venue: "South gate",
      }),
      updatedByName: "Ram",
    });
    await wait();

    assert.equal(result.action, "scheduled");
    assert.equal(scheduledOffline.length, 1);
    assert.equal(scheduledOffline[0]?.event, "INTERVIEW_SCHEDULED_OFFLINE");
    assert.equal(rescheduled.length, 0);
  });

  it("queues the updated offline date, time, and venue for that jobseeker", async () => {
    const { rescheduled, scheduledOffline, application } =
      installSchedulingMocks();

    const result = await applicationService.updateInterviewForEmployer({
      employerId,
      applicationId,
      interview: interview({
        date: "2026-12-01",
        time: "11:00",
        venue: "South gate",
      }),
      updatedByName: "Ram",
    });
    await wait();

    assert.equal(result.action, "updated");
    assert.equal(application?.saveCount, 1);
    assert.equal(application?.interview.date, "2026-12-01");
    assert.equal(application?.interview.time, "11:00");
    assert.equal(application?.interview.venue, "South gate");
    assert.equal(scheduledOffline.length, 0);
    assert.equal(rescheduled.length, 1);
    assert.equal(rescheduled[0]?.event, "INTERVIEW_RESCHEDULED");
    assert.equal(rescheduled[0]?.entityId, applicationId);
    assert.equal(rescheduled[0]?.phoneNumber, seekerPhone);
    assert.notEqual(rescheduled[0]?.phoneNumber, employerPhone);
    assert.equal(rescheduled[0]?.jobTitle, "Welder");
    assert.equal(rescheduled[0]?.companyName, "Northwind Services");
    assert.equal(rescheduled[0]?.interviewDate, "1 December 2026");
    assert.equal(rescheduled[0]?.interviewTime, "11:00 AM");
    assert.equal(rescheduled[0]?.interviewVenue, "South gate");
    assert.equal(rescheduled[0]?.idempotencyScope, "2026-12-01-1100");
    assert.equal(rescheduled[0]?.preferredLanguage, "en");
    assert.equal(rescheduled[0]?.urlButtonParameters, undefined);
  });

  it("sends one notification for each distinct saved slot", async () => {
    const { rescheduled, application } = installSchedulingMocks();

    await applicationService.updateInterviewForEmployer({
      employerId,
      applicationId,
      interview: interview({
        date: "2026-12-01",
        time: "11:00",
        venue: "South gate",
      }),
      updatedByName: "Ram",
    });
    await applicationService.updateInterviewForEmployer({
      employerId,
      applicationId,
      interview: interview({
        date: "2026-12-02",
        time: "15:05",
        venue: "West yard",
      }),
      updatedByName: "Ram",
    });
    const repeat = await applicationService.updateInterviewForEmployer({
      employerId,
      applicationId,
      interview: interview({
        date: "2026-12-02",
        time: "15:05",
        venue: "West yard",
      }),
      updatedByName: "Ram",
    });
    await wait();

    assert.equal(repeat.action, "updated");
    assert.equal(application?.saveCount, 2);
    assert.equal(rescheduled.length, 2);
    assert.equal(rescheduled[0]?.idempotencyScope, "2026-12-01-1100");
    assert.equal(rescheduled[0]?.interviewVenue, "South gate");
    assert.equal(rescheduled[1]?.idempotencyScope, "2026-12-02-1505");
    assert.equal(rescheduled[1]?.interviewDate, "2 December 2026");
    assert.equal(rescheduled[1]?.interviewTime, "3:05 PM");
    assert.equal(rescheduled[1]?.interviewVenue, "West yard");
  });

  it("does not queue online, phone, venue-only, or cancellation updates", async () => {
    const online = installSchedulingMocks({
      application: applicationDocument({
        interview: interview({
          mode: "online",
          venue: "",
          meetingLink: "https://meet.example.com/welder-room",
        }),
      }),
    });
    await applicationService.updateInterviewForEmployer({
      employerId,
      applicationId,
      interview: interview({
        mode: "online",
        date: "2026-12-01",
        time: "11:00",
        venue: "",
        meetingLink: "https://meet.example.com/welder-room",
      }),
      updatedByName: "Ram",
    });
    await wait();
    assert.equal(online.rescheduled.length, 0);
    assert.equal(online.scheduledOnline.length, 0);

    mock.restoreAll();
    const phone = installSchedulingMocks({
      application: applicationDocument({
        interview: interview({
          mode: "phone",
          venue: "",
          interviewerPhone: "9000000002",
        }),
      }),
    });
    await applicationService.updateInterviewForEmployer({
      employerId,
      applicationId,
      interview: interview({
        mode: "phone",
        date: "2026-12-01",
        time: "11:00",
        venue: "",
        interviewerPhone: "9000000002",
      }),
      updatedByName: "Ram",
    });
    await wait();
    assert.equal(phone.rescheduled.length, 0);

    mock.restoreAll();
    const venueOnly = installSchedulingMocks();
    await applicationService.updateInterviewForEmployer({
      employerId,
      applicationId,
      interview: interview({ venue: "Renamed gate" }),
      updatedByName: "Ram",
    });
    await wait();
    assert.equal(venueOnly.application?.saveCount, 1);
    assert.equal(venueOnly.application?.interview.venue, "Renamed gate");
    assert.equal(venueOnly.rescheduled.length, 0);

    mock.restoreAll();
    const cancellation = installSchedulingMocks();
    await applicationService.cancelInterviewForEmployer({
      employerId,
      applicationId,
      reason: "Role filled",
      cancelledByName: "Ram",
    });
    await wait();
    assert.equal(cancellation.rescheduled.length, 0);
    assert.equal(cancellation.cancelled.length, 1);
  });

  it("does not queue a failed save or another employer's interview", async () => {
    const application = applicationDocument();
    application.save = async () => {
      throw new Error("database write failed");
    };
    const failed = installSchedulingMocks({ application });
    await assert.rejects(
      () =>
        applicationService.updateInterviewForEmployer({
          employerId,
          applicationId,
          interview: interview({ date: "2026-12-01", time: "11:00" }),
          updatedByName: "Ram",
        }),
      /database write failed/,
    );

    mock.restoreAll();
    const foreign = installSchedulingMocks({ enforceOwner: true });
    await assert.rejects(
      () =>
        applicationService.updateInterviewForEmployer({
          employerId: otherEmployerId,
          applicationId,
          interview: interview({ date: "2026-12-01", time: "11:00" }),
          updatedByName: "Ram",
        }),
      /Application not found/,
    );
    await wait();

    assert.equal(failed.rescheduled.length, 0);
    assert.equal(foreign.rescheduled.length, 0);
    assert.equal(foreign.application?.saveCount, 0);
  });

  it("uses the establishment name and only the selected application's jobseeker", async () => {
    const queued: WhatsAppNotificationPayload[] = [];
    mock.method(JobModel, "findById", (id: unknown) =>
      queryResult({
        jobTitle: String(id) === otherJobId ? "Carpenter" : "Welder",
        companyName: "",
      }),
    );
    mock.method(EmployerModel, "findById", () =>
      queryResult({ companyName: "", establishmentName: "Harbour Yard" }),
    );
    mock.method(JobSeekerModel, "findById", (id: unknown) =>
      queryResult({
        whatsappNumber:
          String(id) === otherJobSeekerId ? otherSeekerPhone : seekerPhone,
      }),
    );
    mock.method(
      interviewRescheduledWhatsApp,
      "enqueue",
      async (payload: WhatsAppNotificationPayload) => {
        queued.push(payload);
        return "queued" as const;
      },
    );

    interviewRescheduledWhatsApp.schedule({
      applicationId,
      jobId,
      employerId,
      jobSeekerId,
      interviewDate: "2026-12-01",
      interviewTime: "11:00",
      interviewVenue: "South gate",
    });
    await wait();

    assert.equal(queued.length, 1);
    assert.equal(queued[0]?.entityId, applicationId);
    assert.equal(queued[0]?.phoneNumber, seekerPhone);
    assert.equal(queued[0]?.jobTitle, "Welder");
    assert.equal(queued[0]?.companyName, "Harbour Yard");
    assert.notEqual(queued[0]?.phoneNumber, otherSeekerPhone);
    assert.notEqual(queued[0]?.entityId, otherApplicationId);
  });

  it("skips the notification when required data is missing", async () => {
    const queued: WhatsAppNotificationPayload[] = [];
    mock.method(
      interviewRescheduledWhatsApp,
      "enqueue",
      async (payload: WhatsAppNotificationPayload) => {
        queued.push(payload);
        return "queued" as const;
      },
    );
    mock.method(JobModel, "findById", () =>
      queryResult({ jobTitle: "Welder", companyName: "Northwind Services" }),
    );
    mock.method(EmployerModel, "findById", () =>
      queryResult({ companyName: "Northwind Services", establishmentName: "" }),
    );
    mock.method(JobSeekerModel, "findById", () =>
      queryResult({ whatsappNumber: seekerPhone }),
    );

    interviewRescheduledWhatsApp.schedule({
      applicationId,
      jobId,
      employerId,
      jobSeekerId,
      interviewDate: "2026-12-01",
      interviewTime: "11:00",
      interviewVenue: "   ",
    });
    interviewRescheduledWhatsApp.schedule({
      applicationId,
      jobId,
      employerId,
      jobSeekerId,
      interviewDate: "not-a-date",
      interviewTime: "11:00",
      interviewVenue: "South gate",
    });
    await wait();
    assert.equal(queued.length, 0);

    mock.restoreAll();
    const missingPhone = installSchedulingMocks({
      seeker: { whatsappNumber: "" },
    });
    await applicationService.updateInterviewForEmployer({
      employerId,
      applicationId,
      interview: interview({ date: "2026-12-01", time: "11:00" }),
      updatedByName: "Ram",
    });
    await wait();
    assert.equal(missingPhone.application?.interview.date, "2026-12-01");
    assert.equal(missingPhone.rescheduled.length, 0);
  });

  it("keeps the saved schedule when WhatsApp enqueue fails", async () => {
    const { application } = installSchedulingMocks();
    mock.method(interviewRescheduledWhatsApp, "enqueue", async () => {
      throw new Error("WhatsApp unavailable");
    });

    const result = await applicationService.updateInterviewForEmployer({
      employerId,
      applicationId,
      interview: interview({
        date: "2026-12-01",
        time: "11:00",
        venue: "South gate",
      }),
      updatedByName: "Ram",
    });
    await wait();

    assert.equal(result.action, "updated");
    assert.equal(application?.saveCount, 1);
    assert.equal(application?.interview.date, "2026-12-01");
    assert.equal(application?.interview.time, "11:00");
    assert.equal(application?.interview.venue, "South gate");
    assert.equal(application?.interview.mode, "offline");
  });
});

describe("interview_rescheduled delivery", () => {
  afterEach(() => {
    mock.restoreAll();
  });

  it("claims one key per slot and skips a duplicate of that slot", async () => {
    const seen = new Set<string>();
    const queued: Array<{ bodyParameters: string[]; idempotencyKey: string }> =
      [];
    const payload: WhatsAppNotificationPayload = {
      event: "INTERVIEW_RESCHEDULED",
      entityId: applicationId,
      phoneNumber: seekerPhone,
      jobTitle: "Welder",
      companyName: "Northwind Services",
      interviewDate: "1 December 2026",
      interviewTime: "11:00 AM",
      interviewVenue: "South gate",
      idempotencyScope: "2026-12-01-1100",
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
        bodyParameters: string[];
        idempotencyKey: string;
        urlButtonParameters?: string[];
      }) => {
        queued.push(job);
        assert.equal(job.urlButtonParameters, undefined);
      },
    };

    const first = await enqueueWhatsAppNotification(payload, deps);
    const duplicate = await enqueueWhatsAppNotification(payload, deps);
    const nextSlot = await enqueueWhatsAppNotification(
      { ...payload, idempotencyScope: "2026-12-02-1505" },
      deps,
    );

    assert.equal(first, "queued");
    assert.equal(duplicate, "skipped_duplicate");
    assert.equal(nextSlot, "queued");
    assert.equal(queued.length, 2);
    assert.equal(
      queued[0]?.idempotencyKey,
      `INTERVIEW_RESCHEDULED:${applicationId}:2026-12-01-1100`,
    );
    assert.deepEqual(queued[0]?.bodyParameters, [
      "Welder",
      "Northwind Services",
      "1 December 2026",
      "11:00 AM",
      "South gate",
    ]);
  });

  it("does not send again after a successful dispatch", async () => {
    let sendCount = 0;
    let lookups = 0;
    mock.method(WhatsAppService.prototype, "sendTemplateMessage", async () => {
      sendCount += 1;
      return { messageId: "wamid.rescheduled", messageStatus: "accepted" };
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
      event: "INTERVIEW_RESCHEDULED" as const,
      entityId: applicationId,
      phoneNumber: `91${seekerPhone}`,
      templateName: "interview_rescheduled",
      languageCode: "en",
      bodyParameters: [
        "Welder",
        "Northwind Services",
        "1 December 2026",
        "11:00 AM",
        "South gate",
      ],
      idempotencyScope: "2026-12-01-1100",
      idempotencyKey: `INTERVIEW_RESCHEDULED:${applicationId}:2026-12-01-1100`,
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

    const savedInterview = { date: "2026-12-01", time: "11:00", venue: "South gate" };
    await assert.rejects(
      () => notificationQueue.deliverWhatsAppNotificationJob(job),
      /WhatsApp template delivery failed/,
    );
    assert.deepEqual(savedInterview, {
      date: "2026-12-01",
      time: "11:00",
      venue: "South gate",
    });
  });
});
