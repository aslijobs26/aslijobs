import assert from "node:assert/strict";
import { afterEach, describe, it, mock } from "node:test";
import mongoose from "mongoose";
import { ApplicationModel } from "../../applications/application.model.js";
import { applicationService } from "../../applications/application.service.js";
import { EmployerModel } from "../../employers/employer.model.js";
import { JobModel } from "../../jobs/job.model.js";
import { JobSeekerModel } from "../../job-seekers/job-seeker.model.js";
import { notificationService } from "../../notifications/notification.service.js";
import { resumeService } from "../../resumes/resume.service.js";
import { uploadedResumeService } from "../../resumes/uploaded-resume.service.js";
import { jobApplicationSubmittedWhatsApp } from "./job-application-submitted.notification.js";
import {
  buildWhatsAppNotificationBodyParameters,
  buildWhatsAppNotificationUrlButtonParameters,
  getWhatsAppNotificationTemplate,
  resolveWhatsAppNotificationLanguage,
} from "./whatsapp-notification.policy.js";
import { enqueueWhatsAppNotification } from "./whatsapp-notification.service.js";
import type { WhatsAppNotificationPayload } from "./whatsapp-notification.types.js";

const jobSeekerId = "64f0000000000000000000aa";
const employerId = "64f0000000000000000000bb";
const seekerPhone = "9876543210";
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

function seeker() {
  return {
    _id: new mongoose.Types.ObjectId(jobSeekerId),
    registrationStatus: "COMPLETED",
    isWhatsappVerified: true,
    accountStatus: "active",
    fullName: "Asha Rao",
    whatsappNumber: seekerPhone,
    city: "Hyderabad",
    state: "Telangana",
  };
}

function jobRecord(overrides: Record<string, unknown> = {}) {
  return {
    _id: new mongoose.Types.ObjectId(),
    jobId: "AJ-2026-000010",
    status: "active",
    creationSource: "operations",
    employerId: new mongoose.Types.ObjectId(employerId),
    companyId: new mongoose.Types.ObjectId(employerId),
    jobTitle: "Electrician",
    companyName: "ABC Services",
    ...overrides,
  };
}

function employerRecord(overrides: Record<string, unknown> = {}) {
  return {
    _id: new mongoose.Types.ObjectId(employerId),
    verificationStatus: "verified",
    companyName: "Other Employer Co",
    establishmentName: "",
    whatsappNumber: employerPhone,
    ...overrides,
  };
}

function stubApply(job: ReturnType<typeof jobRecord>, employer = employerRecord()) {
  mock.method(JobSeekerModel, "findById", () => queryResult(seeker()));
  mock.method(JobModel, "findOne", async () => job);
  mock.method(EmployerModel, "findById", () => queryResult(employer));
  mock.method(ApplicationModel, "findOne", () => queryResult(null));
  mock.method(JobModel, "updateOne", async () => ({ matchedCount: 1 }));
  mock.method(resumeService, "ensureReadyResumeForApply", async () => ({
    id: "resume-1",
    jobSeekerId,
    isActive: true,
    status: "READY",
    templateId: "basic",
    templateVersion: "1",
    versionNumber: 1,
    profileCompletionPercent: 80,
    resumeJson: {
      header: { fullName: "Asha Rao" },
      sections: { contact: {} },
      meta: {},
    },
    lastGeneratedAt: new Date("2026-10-10T00:00:00.000Z"),
  }));
  mock.method(uploadedResumeService, "getForJobSeeker", async () => ({
    uploadedResume: null,
    defaultResumeSource: "generated" as const,
  }));
  mock.method(notificationService, "handleApplicationEvent", async () => undefined);
  mock.method(ApplicationModel, "create", async (doc: { publicJobId: string; resumeVersion: number; resumeSource: string; appliedAt: Date; status: string }) => ({
    _id: new mongoose.Types.ObjectId(),
    publicJobId: doc.publicJobId,
    resumeVersion: doc.resumeVersion,
    resumeSource: doc.resumeSource,
    appliedAt: doc.appliedAt,
    status: doc.status,
  }));
}

describe("job application submitted WhatsApp", () => {
  afterEach(() => {
    mock.restoreAll();
  });

  it("queues job_application_submitted with the job title and company name", async () => {
    const job = jobRecord();
    const queued: Array<{
      templateName: string;
      languageCode: string;
      phoneNumber: string;
      bodyParameters: string[];
      urlButtonParameters?: string[];
      idempotencyKey: string;
      entityId: string;
    }> = [];
    stubApply(job);
    mock.method(
      jobApplicationSubmittedWhatsApp,
      "enqueue",
      async (payload: WhatsAppNotificationPayload) => {
        assert.notEqual(payload.phoneNumber, employerPhone);
        return enqueueWhatsAppNotification(payload, {
          claim: async () => "claimed",
          enqueueJob: async (item) => {
            queued.push(item);
          },
        });
      },
    );

    const result = await applicationService.applyToJob({
      jobSeekerId,
      publicJobId: job.jobId,
    });
    await new Promise((resolve) => setTimeout(resolve, 20));

    assert.equal(result.application.publicJobId, job.jobId);
    assert.equal(queued.length, 1);
    assert.equal(queued[0]?.templateName, "job_application_submitted");
    assert.equal(queued[0]?.languageCode, "en");
    assert.equal(queued[0]?.phoneNumber, seekerPhone);
    assert.deepEqual(queued[0]?.bodyParameters, ["Electrician", "ABC Services"]);
    assert.equal(queued[0]?.urlButtonParameters, undefined);
    assert.equal(queued[0]?.entityId, result.application.id);
    assert.equal(
      queued[0]?.idempotencyKey,
      `JOB_APPLICATION_SUBMITTED:${result.application.id}`,
    );
    assert.equal(
      getWhatsAppNotificationTemplate("JOB_APPLICATION_SUBMITTED")?.templateName,
      "job_application_submitted",
    );
    assert.equal(
      resolveWhatsAppNotificationLanguage("JOB_APPLICATION_SUBMITTED", "te"),
      "en",
    );
    assert.deepEqual(
      buildWhatsAppNotificationBodyParameters("JOB_APPLICATION_SUBMITTED", {
        event: "JOB_APPLICATION_SUBMITTED",
        entityId: result.application.id,
        phoneNumber: seekerPhone,
        jobTitle: "Electrician",
        companyName: "ABC Services",
      }),
      ["Electrician", "ABC Services"],
    );
    assert.deepEqual(
      buildWhatsAppNotificationUrlButtonParameters("JOB_APPLICATION_SUBMITTED", {
        event: "JOB_APPLICATION_SUBMITTED",
        entityId: result.application.id,
        phoneNumber: seekerPhone,
      }),
      [],
    );
  });

  it("uses each application's own job and company, including the employer record fallback", async () => {
    const first = jobRecord({ jobTitle: "Electrician", companyName: "ABC Services" });
    const second = jobRecord({
      _id: new mongoose.Types.ObjectId(),
      jobId: "AJ-2026-000011",
      jobTitle: "Driver",
      companyName: "",
    });
    const queued: string[][] = [];
    let lookups = 0;
    stubApply(first);
    mock.method(JobModel, "findOne", async () => {
      lookups += 1;
      return lookups === 1 ? first : second;
    });
    mock.method(
      jobApplicationSubmittedWhatsApp,
      "enqueue",
      async (payload: WhatsAppNotificationPayload) =>
        enqueueWhatsAppNotification(payload, {
          claim: async () => "claimed",
          enqueueJob: async (item) => {
            queued.push(item.bodyParameters);
          },
        }),
    );

    await applicationService.applyToJob({
      jobSeekerId,
      publicJobId: first.jobId,
    });
    await applicationService.applyToJob({
      jobSeekerId,
      publicJobId: second.jobId,
    });
    await new Promise((resolve) => setTimeout(resolve, 20));

    assert.deepEqual(queued, [
      ["Electrician", "ABC Services"],
      ["Driver", "Other Employer Co"],
    ]);
  });

  it("does not send when the application is not created", async () => {
    let queued = 0;
    mock.method(jobApplicationSubmittedWhatsApp, "schedule", () => {
      queued += 1;
    });
    stubApply(jobRecord());
    mock.method(JobModel, "findOne", async () => null);
    await assert.rejects(() =>
      applicationService.applyToJob({
        jobSeekerId,
        publicJobId: "AJ-2026-000010",
      }),
    );

    mock.method(JobModel, "findOne", async () => jobRecord());
    mock.method(ApplicationModel, "findOne", () =>
      queryResult({ _id: new mongoose.Types.ObjectId() }),
    );
    await assert.rejects(() =>
      applicationService.applyToJob({
        jobSeekerId,
        publicJobId: "AJ-2026-000010",
      }),
    );
    assert.equal(queued, 0);
  });

  it("does not queue a second confirmation for the same application", async () => {
    const job = jobRecord();
    let queued = 0;
    stubApply(job);
    mock.method(
      jobApplicationSubmittedWhatsApp,
      "enqueue",
      async (payload: WhatsAppNotificationPayload) =>
        enqueueWhatsAppNotification(payload, {
          claim: async () => "duplicate",
          enqueueJob: async () => {
            queued += 1;
          },
        }),
    );

    const result = await applicationService.applyToJob({
      jobSeekerId,
      publicJobId: job.jobId,
    });
    await new Promise((resolve) => setTimeout(resolve, 20));
    assert.equal(result.application.status.length > 0, true);
    assert.equal(queued, 0);
  });

  it("keeps the application when WhatsApp delivery fails", async () => {
    const job = jobRecord();
    stubApply(job);
    mock.method(jobApplicationSubmittedWhatsApp, "enqueue", async () => {
      throw new Error("meta unavailable");
    });

    const result = await applicationService.applyToJob({
      jobSeekerId,
      publicJobId: job.jobId,
    });
    await new Promise((resolve) => setTimeout(resolve, 20));
    assert.equal(result.application.publicJobId, job.jobId);
  });

  it("does not send a placeholder when the job and company names are missing", async () => {
    const job = jobRecord({ jobTitle: "  ", companyName: "" });
    let queued = 0;
    stubApply(job, employerRecord({ companyName: "", establishmentName: " " }));
    mock.method(jobApplicationSubmittedWhatsApp, "enqueue", async () => {
      queued += 1;
      return "queued" as const;
    });

    const result = await applicationService.applyToJob({
      jobSeekerId,
      publicJobId: job.jobId,
    });
    await new Promise((resolve) => setTimeout(resolve, 20));
    assert.equal(result.application.publicJobId, job.jobId);
    assert.equal(queued, 0);
    assert.deepEqual(
      buildWhatsAppNotificationBodyParameters("JOB_APPLICATION_SUBMITTED", {
        event: "JOB_APPLICATION_SUBMITTED",
        entityId: result.application.id,
        phoneNumber: seekerPhone,
        jobTitle: "",
        companyName: "",
      }),
      [],
    );
  });
});
