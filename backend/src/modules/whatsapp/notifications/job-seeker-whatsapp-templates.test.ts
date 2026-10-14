import assert from "node:assert/strict";
import { afterEach, describe, it, mock } from "node:test";
import {
  getWhatsAppNotificationTemplate,
  resolveWhatsAppNotificationDelivery,
  resolveWhatsAppNotificationLanguage,
  resolveWhatsAppNotificationTemplateName,
} from "./whatsapp-notification.policy.js";
import { enqueueWhatsAppNotification } from "./whatsapp-notification.service.js";

const seekerPhone = "9876543210";
const applicationId = "64f0000000000000000000cc";

describe("job seeker WhatsApp template language routing", () => {
  afterEach(() => {
    mock.restoreAll();
  });

  it("keeps English template names as the default for every job-seeker event", () => {
    assert.equal(
      getWhatsAppNotificationTemplate("JOBSEEKER_ACCOUNT_CREATED")?.templateName,
      "jobseeker_account_created",
    );
    assert.equal(
      getWhatsAppNotificationTemplate("JOBSEEKER_PROFILE_COMPLETION")
        ?.templateName,
      "jobseeker_profile_completion",
    );
    assert.equal(
      getWhatsAppNotificationTemplate("JOB_APPLICATION_SUBMITTED")?.templateName,
      "job_application_submitted",
    );
    assert.equal(
      getWhatsAppNotificationTemplate("INTERVIEW_SCHEDULED_ONLINE")
        ?.templateName,
      "interview_scheduled_online",
    );
    assert.equal(
      getWhatsAppNotificationTemplate("INTERVIEW_SCHEDULED_OFFLINE")
        ?.templateName,
      "interview_scheduled_offline",
    );
    assert.equal(
      getWhatsAppNotificationTemplate("INTERVIEW_RESCHEDULED")?.templateName,
      "interview_rescheduled",
    );
    assert.equal(
      getWhatsAppNotificationTemplate("INTERVIEW_CANCELLED")?.templateName,
      "interview_cancelled",
    );
    assert.equal(
      getWhatsAppNotificationTemplate("INTERVIEW_SCHEDULED_PHONE")?.templateName,
      "interview_scheduled_phone",
    );
  });

  it("selects the approved Telugu template names for Telugu users", () => {
    const cases = [
      ["JOBSEEKER_ACCOUNT_CREATED", "jobseeker_account_created_te"],
      ["JOBSEEKER_PROFILE_COMPLETION", "jobseeker_profile_completion_te"],
      ["JOB_APPLICATION_SUBMITTED", "job_application_submitted_te"],
      ["INTERVIEW_SCHEDULED_PHONE", "interview_scheduled_phone_te"],
      ["INTERVIEW_SCHEDULED_ONLINE", "interview_scheduled_online_te"],
      ["INTERVIEW_SCHEDULED_OFFLINE", "interview_scheduled_offline_te"],
      ["INTERVIEW_RESCHEDULED", "interview_rescheduled_te"],
      ["INTERVIEW_CANCELLED", "interview_cancelled_te"],
    ] as const;

    for (const [event, templateName] of cases) {
      assert.deepEqual(resolveWhatsAppNotificationDelivery(event, "te"), {
        templateName,
        languageCode: "te",
      });
    }
  });

  it("keeps existing English templates for English, Hindi, and unknown languages", () => {
    for (const language of ["en", "hi", "ta", "unknown", "", undefined]) {
      assert.deepEqual(
        resolveWhatsAppNotificationDelivery("JOBSEEKER_ACCOUNT_CREATED", language),
        {
          templateName: "jobseeker_account_created",
          languageCode: "en",
        },
      );
      assert.deepEqual(
        resolveWhatsAppNotificationDelivery("JOB_APPLICATION_SUBMITTED", language),
        {
          templateName: "job_application_submitted",
          languageCode: "en",
        },
      );
      assert.deepEqual(
        resolveWhatsAppNotificationDelivery("INTERVIEW_SCHEDULED_ONLINE", language),
        {
          templateName: "interview_scheduled_online",
          languageCode: "en",
        },
      );
      assert.deepEqual(
        resolveWhatsAppNotificationDelivery("INTERVIEW_SCHEDULED_PHONE", language),
        {
          templateName: "interview_scheduled_phone",
          languageCode: "en",
        },
      );
    }
  });

  it("does not change employer template names or language when Telugu is requested", () => {
    assert.deepEqual(
      resolveWhatsAppNotificationDelivery("EMPLOYER_ACCOUNT_CREATED", "te"),
      {
        templateName: "employer_account_created",
        languageCode: "en",
      },
    );
    assert.equal(
      resolveWhatsAppNotificationLanguage("EMPLOYER_ACCOUNT_APPROVED", "te"),
      "en",
    );
    assert.equal(
      resolveWhatsAppNotificationTemplateName("EMPLOYER_ACCOUNT_APPROVED", "hi"),
      "aslijobs_account_approved",
    );
  });

  it("falls back to English when a Telugu template name is missing", () => {
    const config = getWhatsAppNotificationTemplate("JOB_POST_SUBMITTED");
    assert.equal(config?.localizedTemplateNames?.te, undefined);
    assert.deepEqual(
      resolveWhatsAppNotificationDelivery("JOB_POST_SUBMITTED", "te"),
      {
        templateName: "job_post_submitted",
        languageCode: "en",
      },
    );
  });

  it("queues Telugu template names and English fallbacks without changing body variables", async () => {
    const queued: Array<{
      templateName: string;
      languageCode: string;
      bodyParameters: string[];
    }> = [];

    const telugu = await enqueueWhatsAppNotification(
      {
        event: "JOB_APPLICATION_SUBMITTED",
        entityId: applicationId,
        phoneNumber: seekerPhone,
        jobTitle: "Welder",
        companyName: "Northwind Services",
        preferredLanguage: "te",
      },
      {
        claim: async () => "claimed",
        enqueueJob: async (job) => {
          queued.push(job);
        },
      },
    );
    assert.equal(telugu, "queued");
    assert.equal(queued[0]?.templateName, "job_application_submitted_te");
    assert.equal(queued[0]?.languageCode, "te");
    assert.deepEqual(queued[0]?.bodyParameters, [
      "Welder",
      "Northwind Services",
    ]);

    queued.length = 0;
    const hindi = await enqueueWhatsAppNotification(
      {
        event: "JOB_APPLICATION_SUBMITTED",
        entityId: applicationId,
        phoneNumber: seekerPhone,
        jobTitle: "Welder",
        companyName: "Northwind Services",
        preferredLanguage: "hi",
      },
      {
        claim: async () => "claimed",
        enqueueJob: async (job) => {
          queued.push(job);
        },
      },
    );
    assert.equal(hindi, "queued");
    assert.equal(queued[0]?.templateName, "job_application_submitted");
    assert.equal(queued[0]?.languageCode, "en");

    queued.length = 0;
    const english = await enqueueWhatsAppNotification(
      {
        event: "INTERVIEW_SCHEDULED_ONLINE",
        entityId: applicationId,
        phoneNumber: seekerPhone,
        jobTitle: "Welder",
        companyName: "Northwind Services",
        interviewDate: "30 December 2026",
        interviewTime: "11:00 AM",
        preferredLanguage: "en",
      },
      {
        claim: async () => "claimed",
        enqueueJob: async (job) => {
          queued.push(job);
        },
      },
    );
    assert.equal(english, "queued");
    assert.equal(queued[0]?.templateName, "interview_scheduled_online");
    assert.equal(queued[0]?.languageCode, "en");
    assert.deepEqual(queued[0]?.bodyParameters, [
      "Welder",
      "Northwind Services",
      "30 December 2026",
      "11:00 AM",
    ]);
  });

  it("sends the English or Telugu phone interview template, not both", async () => {
    const queued: Array<{
      templateName: string;
      languageCode: string;
      bodyParameters: string[];
    }> = [];
    const telugu = await enqueueWhatsAppNotification(
      {
        event: "INTERVIEW_SCHEDULED_PHONE",
        entityId: applicationId,
        phoneNumber: seekerPhone,
        jobTitle: "Welder",
        companyName: "Northwind Services",
        interviewDate: "30 December 2026",
        interviewTime: "11:00 AM",
        preferredLanguage: "te",
      },
      {
        claim: async () => "claimed",
        enqueueJob: async (job) => {
          queued.push(job);
        },
      },
    );
    assert.equal(telugu, "queued");
    assert.equal(queued[0]?.templateName, "interview_scheduled_phone_te");
    assert.equal(queued[0]?.languageCode, "te");
    assert.deepEqual(queued[0]?.bodyParameters, [
      "Welder",
      "Northwind Services",
      "30 December 2026",
      "11:00 AM",
    ]);

    queued.length = 0;
    const english = await enqueueWhatsAppNotification(
      {
        event: "INTERVIEW_SCHEDULED_PHONE",
        entityId: applicationId,
        phoneNumber: seekerPhone,
        jobTitle: "Welder",
        companyName: "Northwind Services",
        interviewDate: "30 December 2026",
        interviewTime: "11:00 AM",
        preferredLanguage: "en",
      },
      {
        claim: async () => "claimed",
        enqueueJob: async (job) => {
          queued.push(job);
        },
      },
    );
    assert.equal(english, "queued");
    assert.equal(queued[0]?.templateName, "interview_scheduled_phone");
    assert.equal(queued[0]?.languageCode, "en");
    assert.deepEqual(queued[0]?.bodyParameters, [
      "Welder",
      "Northwind Services",
      "30 December 2026",
      "11:00 AM",
    ]);
    assert.notEqual(queued[0]?.templateName, "interview_scheduled_phone_te");

    queued.length = 0;
    const hindi = await enqueueWhatsAppNotification(
      {
        event: "INTERVIEW_SCHEDULED_PHONE",
        entityId: applicationId,
        phoneNumber: seekerPhone,
        jobTitle: "Welder",
        companyName: "Northwind Services",
        interviewDate: "30 December 2026",
        interviewTime: "11:00 AM",
        preferredLanguage: "hi",
      },
      {
        claim: async () => "claimed",
        enqueueJob: async (job) => {
          queued.push(job);
        },
      },
    );
    assert.equal(hindi, "queued");
    assert.equal(queued[0]?.templateName, "interview_scheduled_phone");
    assert.equal(queued[0]?.languageCode, "en");
  });

  it("does not send a second message when the same event is retried", async () => {
    let claims = 0;
    let queued = 0;
    const payload = {
      event: "JOBSEEKER_ACCOUNT_CREATED" as const,
      entityId: "64f0000000000000000000aa",
      phoneNumber: seekerPhone,
      preferredLanguage: "te",
    };

    const first = await enqueueWhatsAppNotification(payload, {
      claim: async () => {
        claims += 1;
        return "claimed";
      },
      enqueueJob: async () => {
        queued += 1;
      },
    });
    const second = await enqueueWhatsAppNotification(payload, {
      claim: async () => {
        claims += 1;
        return "duplicate";
      },
      enqueueJob: async () => {
        queued += 1;
      },
    });

    assert.equal(first, "queued");
    assert.equal(second, "skipped_duplicate");
    assert.equal(claims, 2);
    assert.equal(queued, 1);
  });
});
