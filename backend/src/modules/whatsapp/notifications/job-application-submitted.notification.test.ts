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

const seekerSelects: string[] = [];

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

function seeker(overrides: Record<string, unknown> = {}) {
  return {
    _id: new mongoose.Types.ObjectId(jobSeekerId),
    registrationStatus: "COMPLETED",
    isWhatsappVerified: true,
    accountStatus: "active",
    fullName: "Asha Rao",
    whatsappNumber: seekerPhone,
    whatsappLanguage: "",
    dateOfBirth: new Date("1995-01-01T00:00:00.000Z"),
    gender: "female",
    jobRole: "Electrician",
    jobType: "full-time",
    workMode: "on-site",
    preferredJobLocation: "Hyderabad",
    expectedSalary: 15000,
    education: { level: "below_10th" },
    experienceType: "fresher",
    experiences: [],
    languages: ["english"],
    availabilityStatus: "immediate",
    city: "Hyderabad",
    state: "Telangana",
    ...overrides,
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

function stubApply(
  job: ReturnType<typeof jobRecord>,
  employer = employerRecord(),
  seekerOverrides: Record<string, unknown> = {},
) {
  seekerSelects.length = 0;
  mock.method(JobSeekerModel, "findById", () => {
    const record = seeker(seekerOverrides);
    const promise = Promise.resolve(record);
    return {
      select(fields: string) {
        seekerSelects.push(fields);
        return this;
      },
      lean() {
        return promise;
      },
      then(
        onFulfilled: (value: typeof record) => unknown,
        onRejected?: (reason: unknown) => unknown,
      ) {
        return promise.then(onFulfilled, onRejected);
      },
    };
  });
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
      resolveWhatsAppNotificationLanguage("JOB_APPLICATION_SUBMITTED", "hi"),
      "hi",
    );
    assert.equal(
      resolveWhatsAppNotificationLanguage("JOB_APPLICATION_SUBMITTED", "te"),
      "te",
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

  async function applyAndQueue(seekerOverrides: Record<string, unknown> = {}) {
    const job = jobRecord();
    const queued: Array<{
      templateName: string;
      languageCode: string;
      bodyParameters: string[];
    }> = [];
    const payloads: Array<{ preferredLanguage?: string | null }> = [];
    stubApply(job, employerRecord(), seekerOverrides);
    mock.method(
      jobApplicationSubmittedWhatsApp,
      "enqueue",
      async (payload: WhatsAppNotificationPayload) => {
        payloads.push(payload);
        return enqueueWhatsAppNotification(payload, {
          claim: async () => "claimed",
          enqueueJob: async (item) => {
            queued.push(item);
          },
        });
      },
    );
    await applicationService.applyToJob({
      jobSeekerId,
      publicJobId: job.jobId,
    });
    await new Promise((resolve) => setTimeout(resolve, 20));
    return { queued, payloads };
  }

  it("sends the Hindi application template from the saved Job Seeker preference", async () => {
    const { queued, payloads } = await applyAndQueue({
      whatsappLanguage: "hi",
    });
    assert.equal(
      seekerSelects.some((fields) => fields.includes("whatsappLanguage")),
      true,
    );
    assert.equal(payloads[0]?.preferredLanguage, "hi");
    assert.equal(queued[0]?.templateName, "job_application_submitted_hi");
    assert.equal(queued[0]?.languageCode, "hi");
    assert.notEqual(queued[0]?.languageCode, "hi-IN");
    assert.deepEqual(queued[0]?.bodyParameters, ["Electrician", "ABC Services"]);
  });

  it("sends the Telugu application template from the saved Job Seeker preference", async () => {
    const { queued, payloads } = await applyAndQueue({
      whatsappLanguage: "te",
    });
    assert.equal(payloads[0]?.preferredLanguage, "te");
    assert.equal(queued[0]?.templateName, "job_application_submitted_te");
    assert.equal(queued[0]?.languageCode, "te");
    assert.notEqual(queued[0]?.languageCode, "te-IN");
    assert.deepEqual(queued[0]?.bodyParameters, ["Electrician", "ABC Services"]);
  });

  it("sends the English application template for a saved English preference", async () => {
    const { queued, payloads } = await applyAndQueue({
      whatsappLanguage: "en",
    });
    assert.equal(payloads[0]?.preferredLanguage, "en");
    assert.equal(queued[0]?.templateName, "job_application_submitted");
    assert.equal(queued[0]?.languageCode, "en");
  });

  it("falls back to English when the saved preference is missing", async () => {
    const { queued, payloads } = await applyAndQueue({
      whatsappLanguage: "",
    });
    assert.equal(payloads[0]?.preferredLanguage, "en");
    assert.equal(queued[0]?.templateName, "job_application_submitted");
    assert.equal(queued[0]?.languageCode, "en");
  });

  it("keeps the saved website language when a WhatsApp session would disagree", async () => {
    const hindiOverTelugu = await applyAndQueue({ whatsappLanguage: "hi" });
    assert.equal(hindiOverTelugu.payloads[0]?.preferredLanguage, "hi");
    assert.equal(
      hindiOverTelugu.queued[0]?.templateName,
      "job_application_submitted_hi",
    );
    assert.equal(hindiOverTelugu.queued[0]?.languageCode, "hi");

    const teluguOverHindi = await applyAndQueue({ whatsappLanguage: "te" });
    assert.equal(teluguOverHindi.payloads[0]?.preferredLanguage, "te");
    assert.equal(
      teluguOverHindi.queued[0]?.templateName,
      "job_application_submitted_te",
    );
    assert.equal(teluguOverHindi.queued[0]?.languageCode, "te");
  });

  it("falls back to English for an unsupported saved language", async () => {
    const { queued, payloads } = await applyAndQueue({
      whatsappLanguage: "fr",
    });
    assert.equal(payloads[0]?.preferredLanguage, "en");
    assert.equal(queued[0]?.templateName, "job_application_submitted");
    assert.equal(queued[0]?.languageCode, "en");
  });

  it("sends the Tamil application template from the saved Job Seeker preference", async () => {
    const { queued, payloads } = await applyAndQueue({
      whatsappLanguage: "ta",
    });
    assert.equal(payloads[0]?.preferredLanguage, "ta");
    assert.equal(queued[0]?.templateName, "job_application_submitted_ta");
    assert.equal(queued[0]?.languageCode, "ta");
    assert.deepEqual(queued[0]?.bodyParameters, ["Electrician", "ABC Services"]);
  });

  it("sends the Kannada application template from the saved Job Seeker preference", async () => {
    const { queued, payloads } = await applyAndQueue({
      whatsappLanguage: "kn",
    });
    assert.equal(payloads[0]?.preferredLanguage, "kn");
    assert.equal(queued[0]?.templateName, "job_application_submitted_ka");
    assert.equal(queued[0]?.languageCode, "kn");
    assert.notEqual(queued[0]?.languageCode, "ka");
    assert.deepEqual(queued[0]?.bodyParameters, ["Electrician", "ABC Services"]);
  });

  it("sends the Malayalam application template from the saved Job Seeker preference", async () => {
    const { queued, payloads } = await applyAndQueue({
      whatsappLanguage: "ml",
    });
    assert.equal(payloads[0]?.preferredLanguage, "ml");
    assert.equal(queued[0]?.templateName, "job_application_submitted_ml");
    assert.equal(queued[0]?.languageCode, "ml");
    assert.notEqual(queued[0]?.languageCode, "ml-IN");
    assert.deepEqual(queued[0]?.bodyParameters, ["Electrician", "ABC Services"]);
  });

  it("does not notify a Malayalam applicant who has no WhatsApp number", async () => {
    const job = jobRecord();
    let queued = 0;
    stubApply(job, employerRecord(), {
      whatsappLanguage: "ml",
      whatsappNumber: "",
    });
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
  });

  it("keeps a saved Kannada preference ahead of another language alias", async () => {
    const kannada = await applyAndQueue({ whatsappLanguage: "kannada" });
    assert.equal(kannada.payloads[0]?.preferredLanguage, "kn");
    assert.equal(
      kannada.queued[0]?.templateName,
      "job_application_submitted_ka",
    );
    const tamil = await applyAndQueue({ whatsappLanguage: "tamil" });
    assert.equal(tamil.payloads[0]?.preferredLanguage, "ta");
    assert.equal(tamil.queued[0]?.templateName, "job_application_submitted_ta");
  });

  it("normalizes website language aliases onto the approved Meta templates", async () => {
    const hindi = await applyAndQueue({ whatsappLanguage: "hindi" });
    assert.equal(hindi.queued[0]?.templateName, "job_application_submitted_hi");
    assert.equal(hindi.queued[0]?.languageCode, "hi");

    const telugu = await applyAndQueue({ whatsappLanguage: "telugu" });
    assert.equal(telugu.queued[0]?.templateName, "job_application_submitted_te");
    assert.equal(telugu.queued[0]?.languageCode, "te");
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
