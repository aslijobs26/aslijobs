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
import { interviewScheduledOnlineWhatsApp } from "./interview-scheduled-online.notification.js";
import { interviewScheduledPhoneWhatsApp } from "./interview-scheduled-phone.notification.js";
import {
  buildWhatsAppNotificationBodyParameters,
  buildWhatsAppNotificationUrlButtonParameters,
  getWhatsAppNotificationTemplate,
  resolveWhatsAppNotificationDelivery,
  whatsAppNotificationIdempotencyKey,
} from "./whatsapp-notification.policy.js";
import type { WhatsAppNotificationPayload } from "./whatsapp-notification.types.js";

const applicationId = "64f0000000000000000000cc";
const employerId = "64f0000000000000000000bb";
const jobId = "64f0000000000000000000dd";
const jobSeekerId = "64f0000000000000000000aa";
const seekerPhone = "9876543210";

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

function phoneInterview(
  overrides: Partial<ApplicationInterview> = {},
): ApplicationInterview {
  return {
    date: "2026-12-30",
    time: "11:00",
    mode: "phone",
    meetingLink: "",
    venue: "",
    instructions: "",
    interviewerName: "Ravi",
    interviewerDesignation: "",
    interviewerEmail: "",
    interviewerPhone: "9000000002",
    cancelledAt: null,
    cancellationReason: "",
    cancelledByName: "",
    ...overrides,
  };
}

function installPhoneMocks(seekerLanguage?: string) {
  const phoneQueued: WhatsAppNotificationPayload[] = [];
  const onlineQueued: WhatsAppNotificationPayload[] = [];
  const application = {
    _id: new mongoose.Types.ObjectId(applicationId),
    jobId: new mongoose.Types.ObjectId(jobId),
    employerId: new mongoose.Types.ObjectId(employerId),
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
  };

  mock.method(ApplicationModel, "findOne", async () => application);
  mock.method(JobModel, "findById", () =>
    queryResult({
      jobTitle: "Welder",
      companyName: "Northwind Services",
      jobId: "AJ-2026-000062",
    }),
  );
  mock.method(EmployerModel, "findById", () =>
    queryResult({
      companyName: "Northwind Services",
      establishmentName: "",
    }),
  );
  mock.method(JobSeekerModel, "findById", () =>
    queryResult({
      whatsappNumber: seekerPhone,
      whatsappLanguage: seekerLanguage ?? "",
    }),
  );
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
      onlineQueued.push(payload);
      return "queued" as const;
    },
  );
  mock.method(
    interviewScheduledPhoneWhatsApp,
    "enqueue",
    async (payload: WhatsAppNotificationPayload) => {
      phoneQueued.push(payload);
      return "queued" as const;
    },
  );

  return { phoneQueued, onlineQueued, application };
}

describe("interview_scheduled_phone WhatsApp", () => {
  afterEach(() => {
    mock.restoreAll();
  });

  it("uses the approved English template name and the same body order as online", () => {
    const template = getWhatsAppNotificationTemplate("INTERVIEW_SCHEDULED_PHONE");
    assert.equal(template?.templateName, "interview_scheduled_phone");
    assert.equal(template?.defaultLanguage, "en");
    assert.equal(template?.approvedLanguages.en, "en");
    assert.equal(template?.localizedTemplateNames?.te, "interview_scheduled_phone_te");
    assert.deepEqual(
      resolveWhatsAppNotificationDelivery("INTERVIEW_SCHEDULED_PHONE", "en"),
      { templateName: "interview_scheduled_phone", languageCode: "en" },
    );
    assert.deepEqual(
      resolveWhatsAppNotificationDelivery("INTERVIEW_SCHEDULED_PHONE", "te"),
      { templateName: "interview_scheduled_phone_te", languageCode: "te" },
    );
    assert.deepEqual(
      resolveWhatsAppNotificationDelivery("INTERVIEW_SCHEDULED_PHONE", "hi"),
      { templateName: "interview_scheduled_phone", languageCode: "en" },
    );
    assert.deepEqual(
      buildWhatsAppNotificationBodyParameters("INTERVIEW_SCHEDULED_PHONE", {
        event: "INTERVIEW_SCHEDULED_PHONE",
        entityId: applicationId,
        phoneNumber: seekerPhone,
        jobTitle: "Welder",
        companyName: "Northwind Services",
        interviewDate: "30 December 2026",
        interviewTime: "11:00 AM",
      }),
      ["Welder", "Northwind Services", "30 December 2026", "11:00 AM"],
    );
    assert.deepEqual(
      buildWhatsAppNotificationUrlButtonParameters("INTERVIEW_SCHEDULED_PHONE", {
        event: "INTERVIEW_SCHEDULED_PHONE",
        entityId: applicationId,
        phoneNumber: seekerPhone,
        jobTitle: "Welder",
        companyName: "Northwind Services",
        interviewDate: "30 December 2026",
        interviewTime: "11:00 AM",
      }),
      [],
    );
    assert.equal(
      whatsAppNotificationIdempotencyKey("INTERVIEW_SCHEDULED_PHONE", applicationId),
      `INTERVIEW_SCHEDULED_PHONE:${applicationId}`,
    );
  });

  it("omits body parameters when any required value is missing", () => {
    assert.deepEqual(
      buildWhatsAppNotificationBodyParameters("INTERVIEW_SCHEDULED_PHONE", {
        event: "INTERVIEW_SCHEDULED_PHONE",
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

  it("queues the Telugu phone template and not the online template", async () => {
    const { phoneQueued, onlineQueued } = installPhoneMocks("te");

    const result = await applicationService.updateInterviewForEmployer({
      employerId,
      applicationId,
      interview: phoneInterview(),
      updatedByName: "Ram",
    });
    await wait();

    assert.equal(result.action, "scheduled");
    assert.equal(onlineQueued.length, 0);
    assert.equal(phoneQueued.length, 1);
    assert.equal(phoneQueued[0]?.event, "INTERVIEW_SCHEDULED_PHONE");
    assert.equal(phoneQueued[0]?.preferredLanguage, "te");
    assert.equal(phoneQueued[0]?.jobTitle, "Welder");
    assert.equal(phoneQueued[0]?.interviewDate, "30 December 2026");
    assert.equal(phoneQueued[0]?.interviewTime, "11:00 AM");
  });

  it("queues the English phone template for English users and not the online template", async () => {
    const { phoneQueued, onlineQueued } = installPhoneMocks("en");

    const result = await applicationService.updateInterviewForEmployer({
      employerId,
      applicationId,
      interview: phoneInterview(),
      updatedByName: "Ram",
    });
    await wait();

    assert.equal(result.action, "scheduled");
    assert.equal(onlineQueued.length, 0);
    assert.equal(phoneQueued.length, 1);
    assert.equal(phoneQueued[0]?.preferredLanguage, "en");
    assert.equal(phoneQueued[0]?.event, "INTERVIEW_SCHEDULED_PHONE");
    assert.equal(phoneQueued[0]?.jobTitle, "Welder");
    assert.equal(phoneQueued[0]?.companyName, "Northwind Services");
    assert.equal(phoneQueued[0]?.interviewDate, "30 December 2026");
    assert.equal(phoneQueued[0]?.interviewTime, "11:00 AM");
  });
});
