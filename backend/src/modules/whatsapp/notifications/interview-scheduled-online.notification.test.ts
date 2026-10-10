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
import {
  formatInterviewScheduledDate,
  formatInterviewScheduledTime,
  interviewScheduledOnlineWhatsApp,
} from "./interview-scheduled-online.notification.js";
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
const jobId = "64f0000000000000000000dd";
const otherJobId = "64f0000000000000000000de";
const jobSeekerId = "64f0000000000000000000aa";
const otherJobSeekerId = "64f0000000000000000000ee";
const seekerPhone = "9876543210";
const otherSeekerPhone = "9123456780";
const employerPhone = "9000000001";
const meetingLink = "https://meet.example.com/welder-room";

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
    date: "2026-12-30",
    time: "11:00",
    mode: "online",
    meetingLink,
    venue: "",
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
) {
  const doc = {
    _id: new mongoose.Types.ObjectId(applicationId),
    employerId: new mongoose.Types.ObjectId(employerId),
    jobId: new mongoose.Types.ObjectId(jobId),
    jobSeekerId: new mongoose.Types.ObjectId(jobSeekerId),
    publicJobId: "AJ-2026-000062",
    status: "shortlisted",
    resumeVersion: 1,
    resumeStatus: "complete",
    resumeSource: "generated",
    resumeSnapshot: {
      resumeJson: {
        header: { fullName: "Veeresh" },
        sections: { contact: {} },
      },
    },
    interview: {
      date: "",
      time: "",
      mode: "",
      meetingLink: "",
      venue: "",
      instructions: "",
      interviewerName: "",
      interviewerDesignation: "",
      interviewerEmail: "",
      interviewerPhone: "",
      cancelledAt: null,
      cancellationReason: "",
      cancelledByName: "",
    },
    offer: null,
    shortlist: null,
    statusHistory: [] as unknown[],
    employerNotes: "",
    appliedAt: new Date("2026-10-01T00:00:00.000Z"),
    saveCount: 0,
    async save(this: { saveCount: number }) {
      this.saveCount += 1;
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

  mock.method(ApplicationModel, "findOne", async () => application);
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
    interviewScheduledOnlineWhatsApp,
    "enqueue",
    async (payload: WhatsAppNotificationPayload) => {
      queued.push(payload);
      return "queued" as const;
    },
  );

  return { queued, application };
}

describe("interview_scheduled_online formatting and template", () => {
  it("formats the saved calendar date and 24-hour time for the approved template", () => {
    assert.equal(formatInterviewScheduledDate("2026-12-30"), "30 December 2026");
    assert.equal(formatInterviewScheduledDate("2026-01-05"), "5 January 2026");
    assert.equal(formatInterviewScheduledDate("2026-02-31"), "");
    assert.equal(formatInterviewScheduledDate("30 December 2026"), "");
    assert.equal(formatInterviewScheduledTime("11:00"), "11:00 AM");
    assert.equal(formatInterviewScheduledTime("00:15"), "12:15 AM");
    assert.equal(formatInterviewScheduledTime("15:05"), "3:05 PM");
    assert.equal(formatInterviewScheduledTime("12:00"), "12:00 PM");
    assert.equal(formatInterviewScheduledTime("25:00"), "");
  });

  it("uses the approved template name, language, and body parameter order", () => {
    const template = getWhatsAppNotificationTemplate(
      "INTERVIEW_SCHEDULED_ONLINE",
    );
    assert.equal(template?.templateName, "interview_scheduled_online");
    assert.equal(template?.defaultLanguage, "en");

    const body = buildWhatsAppNotificationBodyParameters(
      "INTERVIEW_SCHEDULED_ONLINE",
      {
        event: "INTERVIEW_SCHEDULED_ONLINE",
        entityId: applicationId,
        phoneNumber: seekerPhone,
        jobTitle: "Welder",
        companyName: "Northwind Services",
        interviewDate: "30 December 2026",
        interviewTime: "11:00 AM",
      },
    );
    assert.deepEqual(body, [
      "Welder",
      "Northwind Services",
      "30 December 2026",
      "11:00 AM",
    ]);
    assert.deepEqual(
      buildWhatsAppNotificationUrlButtonParameters(
        "INTERVIEW_SCHEDULED_ONLINE",
        {
          event: "INTERVIEW_SCHEDULED_ONLINE",
          entityId: applicationId,
          phoneNumber: seekerPhone,
          jobTitle: "Welder",
          companyName: "Northwind Services",
          interviewDate: "30 December 2026",
          interviewTime: "11:00 AM",
        },
      ),
      [],
    );
    assert.equal(
      whatsAppNotificationIdempotencyKey(
        "INTERVIEW_SCHEDULED_ONLINE",
        applicationId,
      ),
      `INTERVIEW_SCHEDULED_ONLINE:${applicationId}`,
    );
  });

  it("omits body parameters when any required value is missing", () => {
    assert.deepEqual(
      buildWhatsAppNotificationBodyParameters("INTERVIEW_SCHEDULED_ONLINE", {
        event: "INTERVIEW_SCHEDULED_ONLINE",
        entityId: applicationId,
        phoneNumber: seekerPhone,
        jobTitle: "Welder",
        companyName: "",
        interviewDate: "30 December 2026",
        interviewTime: "11:00 AM",
      }),
      [],
    );
  });
});

describe("interview_scheduled_online scheduling", () => {
  afterEach(() => {
    mock.restoreAll();
  });

  it("queues the template after a saved online interview with database values", async () => {
    const { queued, application } = installSchedulingMocks();

    const result = await applicationService.updateInterviewForEmployer({
      employerId,
      applicationId,
      interview: interview(),
      updatedByName: "Ram",
    });
    await wait();

    assert.equal(result.action, "scheduled");
    assert.equal(application?.saveCount, 1);
    assert.equal(application?.interview.date, "2026-12-30");
    assert.equal(application?.interview.time, "11:00");
    assert.equal(application?.interview.meetingLink, meetingLink);
    assert.equal(queued.length, 1);
    assert.equal(queued[0]?.event, "INTERVIEW_SCHEDULED_ONLINE");
    assert.equal(queued[0]?.entityId, applicationId);
    assert.equal(queued[0]?.phoneNumber, seekerPhone);
    assert.notEqual(queued[0]?.phoneNumber, employerPhone);
    assert.equal(queued[0]?.jobTitle, "Welder");
    assert.equal(queued[0]?.companyName, "Northwind Services");
    assert.equal(queued[0]?.interviewDate, "30 December 2026");
    assert.equal(queued[0]?.interviewTime, "11:00 AM");
    assert.equal(queued[0]?.preferredLanguage, "en");
    assert.equal(queued[0]?.urlButtonParameters, undefined);
    assert.equal(
      JSON.stringify(queued[0]).includes(meetingLink),
      false,
    );
  });

  it("uses the employer company name when the job company is blank", async () => {
    const queued: WhatsAppNotificationPayload[] = [];
    mock.method(JobModel, "findById", () =>
      queryResult({ jobTitle: "Carpenter", companyName: "  " }),
    );
    mock.method(EmployerModel, "findById", () =>
      queryResult({
        companyName: "Harbour Works",
        establishmentName: "Harbour Yard",
      }),
    );
    mock.method(JobSeekerModel, "findById", () =>
      queryResult({ whatsappNumber: seekerPhone }),
    );
    mock.method(
      interviewScheduledOnlineWhatsApp,
      "enqueue",
      async (payload: WhatsAppNotificationPayload) => {
        queued.push(payload);
        return "queued" as const;
      },
    );

    interviewScheduledOnlineWhatsApp.schedule({
      applicationId,
      jobId,
      employerId,
      jobSeekerId,
      interviewDate: "2026-12-30",
      interviewTime: "15:05",
    });
    await wait();

    assert.equal(queued.length, 1);
    assert.equal(queued[0]?.jobTitle, "Carpenter");
    assert.equal(queued[0]?.companyName, "Harbour Works");
    assert.equal(queued[0]?.interviewTime, "3:05 PM");
  });

  it("falls back to the establishment name", async () => {
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
      interviewScheduledOnlineWhatsApp,
      "enqueue",
      async (payload: WhatsAppNotificationPayload) => {
        queued.push(payload);
        return "queued" as const;
      },
    );

    interviewScheduledOnlineWhatsApp.schedule({
      applicationId,
      jobId,
      employerId,
      jobSeekerId,
      interviewDate: "2026-12-30",
      interviewTime: "11:00",
    });
    await wait();

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
      queryResult({
        companyName: "Northwind Services",
        whatsappNumber: employerPhone,
      }),
    );
    mock.method(JobSeekerModel, "findById", (id: unknown) =>
      queryResult({
        whatsappNumber:
          String(id) === otherJobSeekerId ? otherSeekerPhone : seekerPhone,
      }),
    );
    mock.method(
      interviewScheduledOnlineWhatsApp,
      "enqueue",
      async (payload: WhatsAppNotificationPayload) => {
        queued.push(payload);
        return "queued" as const;
      },
    );

    interviewScheduledOnlineWhatsApp.schedule({
      applicationId,
      jobId,
      employerId,
      jobSeekerId,
      interviewDate: "2026-12-30",
      interviewTime: "11:00",
    });
    await wait();

    assert.equal(queued.length, 1);
    assert.equal(queued[0]?.entityId, applicationId);
    assert.equal(queued[0]?.phoneNumber, seekerPhone);
    assert.equal(queued[0]?.jobTitle, "Welder");
    assert.notEqual(queued[0]?.phoneNumber, otherSeekerPhone);
    assert.notEqual(queued[0]?.entityId, otherApplicationId);
  });

  it("does not queue offline or phone interviews", async () => {
    const offline = installSchedulingMocks();
    await applicationService.updateInterviewForEmployer({
      employerId,
      applicationId,
      interview: interview({
        mode: "offline",
        meetingLink: "",
        venue: "Site office",
      }),
      updatedByName: "Ram",
    });
    await wait();
    assert.equal(offline.application?.saveCount, 1);
    assert.equal(offline.queued.length, 0);

    mock.restoreAll();
    const phone = installSchedulingMocks();
    await applicationService.updateInterviewForEmployer({
      employerId,
      applicationId,
      interview: interview({
        mode: "phone",
        meetingLink: "",
        interviewerPhone: "9000000002",
      }),
      updatedByName: "Ram",
    });
    await wait();
    assert.equal(phone.application?.saveCount, 1);
    assert.equal(phone.queued.length, 0);
  });

  it("does not queue when an existing interview is edited", async () => {
    const { queued, application } = installSchedulingMocks({
      application: applicationDocument({
        interview: interview({ date: "2026-11-01", time: "09:00" }),
        status: "interview_scheduled",
      }),
    });

    const result = await applicationService.updateInterviewForEmployer({
      employerId,
      applicationId,
      interview: interview({ time: "16:30" }),
      updatedByName: "Ram",
    });
    await wait();

    assert.equal(result.action, "updated");
    assert.equal(application?.interview.time, "16:30");
    assert.equal(queued.length, 0);
  });

  it("does not queue when scheduling fails before save", async () => {
    const queued: WhatsAppNotificationPayload[] = [];
    mock.method(ApplicationModel, "findOne", async () => null);
    mock.method(
      interviewScheduledOnlineWhatsApp,
      "enqueue",
      async (payload: WhatsAppNotificationPayload) => {
        queued.push(payload);
        return "queued" as const;
      },
    );

    await assert.rejects(
      () =>
        applicationService.updateInterviewForEmployer({
          employerId,
          applicationId,
          interview: interview(),
          updatedByName: "Ram",
        }),
      /Application not found/,
    );

    const cancelled = installSchedulingMocks({
      application: applicationDocument({
        interview: interview({
          date: "2026-11-01",
          cancelledAt: "2026-11-02T00:00:00.000Z",
        }),
      }),
    });
    await assert.rejects(
      () =>
        applicationService.updateInterviewForEmployer({
          employerId,
          applicationId,
          interview: interview(),
          updatedByName: "Ram",
        }),
      /cancelled/,
    );

    const terminal = installSchedulingMocks({
      application: applicationDocument({ status: "rejected" }),
    });
    await assert.rejects(
      () =>
        applicationService.updateInterviewForEmployer({
          employerId,
          applicationId,
          interview: interview(),
          updatedByName: "Ram",
        }),
      /terminal/,
    );

    assert.equal(queued.length, 0);
    assert.equal(cancelled.queued.length, 0);
    assert.equal(terminal.queued.length, 0);
    assert.equal(terminal.application?.saveCount, 0);
  });

  it("skips the notification when required data is missing", async () => {
    const queued: WhatsAppNotificationPayload[] = [];
    mock.method(
      interviewScheduledOnlineWhatsApp,
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

    interviewScheduledOnlineWhatsApp.schedule({
      applicationId,
      jobId,
      employerId,
      jobSeekerId,
      interviewDate: "2026-12-30",
      interviewTime: "11:00",
    });
    interviewScheduledOnlineWhatsApp.schedule({
      applicationId,
      jobId,
      employerId,
      jobSeekerId,
      interviewDate: "not-a-date",
      interviewTime: "11:00",
    });
    interviewScheduledOnlineWhatsApp.schedule({
      applicationId,
      jobId,
      employerId,
      jobSeekerId,
      interviewDate: "2026-12-30",
      interviewTime: "11",
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
      interview: interview(),
      updatedByName: "Ram",
    });
    await wait();
    assert.equal(missingPhone.application?.saveCount, 1);
    assert.equal(missingPhone.queued.length, 0);

    mock.restoreAll();
    const invalidPhone = installSchedulingMocks({
      seeker: { whatsappNumber: "12", availabilityStatus: "available" },
    });
    await applicationService.updateInterviewForEmployer({
      employerId,
      applicationId,
      interview: interview(),
      updatedByName: "Ram",
    });
    await wait();
    assert.equal(invalidPhone.application?.interview.date, "2026-12-30");
    assert.equal(invalidPhone.queued.length, 0);
  });

  it("keeps the saved interview when WhatsApp enqueue fails", async () => {
    const { application } = installSchedulingMocks();
    mock.method(interviewScheduledOnlineWhatsApp, "enqueue", async () => {
      throw new Error("WhatsApp unavailable");
    });

    const result = await applicationService.updateInterviewForEmployer({
      employerId,
      applicationId,
      interview: interview(),
      updatedByName: "Ram",
    });
    await wait();

    assert.equal(result.action, "scheduled");
    assert.equal(application?.saveCount, 1);
    assert.equal(application?.interview.date, "2026-12-30");
    assert.equal(application?.interview.time, "11:00");
    assert.equal(application?.interview.mode, "online");
  });
});

describe("interview_scheduled_online delivery", () => {
  afterEach(() => {
    mock.restoreAll();
  });

  it("claims one idempotency key and skips a duplicate request", async () => {
    const seen = new Set<string>();
    const queued: Array<{ phoneNumber: string; bodyParameters: string[] }> =
      [];
    const payload: WhatsAppNotificationPayload = {
      event: "INTERVIEW_SCHEDULED_ONLINE",
      entityId: applicationId,
      phoneNumber: seekerPhone,
      jobTitle: "Welder",
      companyName: "Northwind Services",
      interviewDate: "30 December 2026",
      interviewTime: "11:00 AM",
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
      "30 December 2026",
      "11:00 AM",
    ]);
    assert.equal(queued[0]?.phoneNumber, seekerPhone);
  });

  it("does not send again after a successful dispatch and does not roll back on API failure", async () => {
    let sendCount = 0;
    let lookups = 0;
    mock.method(WhatsAppService.prototype, "sendTemplateMessage", async () => {
      sendCount += 1;
      return { messageId: "wamid.online", messageStatus: "accepted" };
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
      event: "INTERVIEW_SCHEDULED_ONLINE" as const,
      entityId: applicationId,
      phoneNumber: `91${seekerPhone}`,
      templateName: "interview_scheduled_online",
      languageCode: "en",
      bodyParameters: [
        "Welder",
        "Northwind Services",
        "30 December 2026",
        "11:00 AM",
      ],
      idempotencyKey: `INTERVIEW_SCHEDULED_ONLINE:${applicationId}`,
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

    const savedInterview = { date: "2026-12-30", time: "11:00", mode: "online" };
    await assert.rejects(
      () => notificationQueue.deliverWhatsAppNotificationJob(job),
      /WhatsApp template delivery failed/,
    );
    assert.deepEqual(savedInterview, {
      date: "2026-12-30",
      time: "11:00",
      mode: "online",
    });
  });
});
