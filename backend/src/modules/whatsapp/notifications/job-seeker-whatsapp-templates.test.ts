import assert from "node:assert/strict";
import { afterEach, describe, it, mock } from "node:test";
import {
  buildWhatsAppNotificationBodyParameters,
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
      assert.notEqual(
        resolveWhatsAppNotificationDelivery(event, "te")?.languageCode,
        "te_IN",
      );
      assert.notEqual(
        resolveWhatsAppNotificationDelivery(event, "te")?.languageCode,
        "te-IN",
      );
    }
  });

  it("selects the Hindi template names and Meta language hi", () => {
    const cases = [
      ["JOBSEEKER_ACCOUNT_CREATED", "jobseeker_account_created_hi", []],
      ["JOBSEEKER_PROFILE_COMPLETION", "jobseeker_profile_completion_hi", []],
      ["JOB_APPLICATION_SUBMITTED", "job_application_submitted_hi", ["Welder", "Northwind Services"]],
      [
        "INTERVIEW_SCHEDULED_PHONE",
        "interview_scheduled_phone_hi",
        ["Welder", "Northwind Services", "30 December 2026", "11:00 AM"],
      ],
      [
        "INTERVIEW_SCHEDULED_ONLINE",
        "interview_scheduled_online_hi",
        ["Welder", "Northwind Services", "30 December 2026", "11:00 AM"],
      ],
      [
        "INTERVIEW_SCHEDULED_OFFLINE",
        "interview_scheduled_offline_hi",
        ["Welder", "Northwind Services", "30 December 2026", "11:00 AM", "North gate"],
      ],
      [
        "INTERVIEW_RESCHEDULED",
        "interview_rescheduled_hi",
        ["Welder", "Northwind Services", "30 December 2026", "11:00 AM", "North gate"],
      ],
      [
        "INTERVIEW_CANCELLED",
        "interview_cancelled_hi",
        ["Welder", "Northwind Services", "30 December 2026", "11:00 AM"],
      ],
    ] as const;

    for (const [event, templateName, bodyParameters] of cases) {
      for (const language of ["hi", "hindi", "hi-IN", "hi_IN"]) {
        assert.deepEqual(resolveWhatsAppNotificationDelivery(event, language), {
          templateName,
          languageCode: "hi",
        });
      }
      assert.deepEqual(
        buildWhatsAppNotificationBodyParameters(event, {
          event,
          entityId: applicationId,
          phoneNumber: seekerPhone,
          jobTitle: "Welder",
          companyName: "Northwind Services",
          interviewDate: "30 December 2026",
          interviewTime: "11:00 AM",
          interviewVenue: "North gate",
        }),
        [...bodyParameters],
      );
      assert.notEqual(
        resolveWhatsAppNotificationDelivery(event, "hi")?.languageCode,
        "hi-IN",
      );
      assert.notEqual(
        resolveWhatsAppNotificationDelivery(event, "hi")?.templateName,
        templateName.replace(/_hi$/, ""),
      );
      assert.notEqual(
        resolveWhatsAppNotificationDelivery(event, "hi")?.templateName,
        templateName.replace(/_hi$/, "_te"),
      );
    }
  });

  it("keeps existing English templates for English and unsupported languages", () => {
    for (const language of ["en", "en-US", "unknown", "", undefined]) {
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
    assert.deepEqual(
      resolveWhatsAppNotificationDelivery("EMPLOYER_ACCOUNT_CREATED", "ta"),
      {
        templateName: "employer_account_created",
        languageCode: "en",
      },
    );
    assert.deepEqual(
      resolveWhatsAppNotificationDelivery("JOB_POST_SUBMITTED", "kn"),
      {
        templateName: "job_post_submitted",
        languageCode: "en",
      },
    );
    assert.deepEqual(
      resolveWhatsAppNotificationDelivery("EMPLOYER_ACCOUNT_CREATED", "ml"),
      {
        templateName: "employer_account_created",
        languageCode: "en",
      },
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

  it("queues Telugu, Hindi, and English template names without changing body variables", async () => {
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
    assert.equal(queued[0]?.templateName, "job_application_submitted_hi");
    assert.equal(queued[0]?.languageCode, "hi");
    assert.deepEqual(queued[0]?.bodyParameters, [
      "Welder",
      "Northwind Services",
    ]);

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
    assert.equal(queued[0]?.templateName, "interview_scheduled_phone_hi");
    assert.equal(queued[0]?.languageCode, "hi");
    assert.deepEqual(queued[0]?.bodyParameters, [
      "Welder",
      "Northwind Services",
      "30 December 2026",
      "11:00 AM",
    ]);
  });

  it("queues every Hindi job-seeker event with its own template and the shared body order", async () => {
    const events = [
      {
        event: "JOBSEEKER_ACCOUNT_CREATED" as const,
        templateName: "jobseeker_account_created_hi",
        bodyParameters: [] as string[],
      },
      {
        event: "JOBSEEKER_PROFILE_COMPLETION" as const,
        templateName: "jobseeker_profile_completion_hi",
        bodyParameters: [] as string[],
      },
      {
        event: "JOB_APPLICATION_SUBMITTED" as const,
        templateName: "job_application_submitted_hi",
        bodyParameters: ["Welder", "Northwind Services"],
      },
      {
        event: "INTERVIEW_SCHEDULED_ONLINE" as const,
        templateName: "interview_scheduled_online_hi",
        bodyParameters: ["Welder", "Northwind Services", "30 December 2026", "11:00 AM"],
      },
      {
        event: "INTERVIEW_SCHEDULED_OFFLINE" as const,
        templateName: "interview_scheduled_offline_hi",
        bodyParameters: [
          "Welder",
          "Northwind Services",
          "30 December 2026",
          "11:00 AM",
          "North gate",
        ],
      },
      {
        event: "INTERVIEW_RESCHEDULED" as const,
        templateName: "interview_rescheduled_hi",
        bodyParameters: [
          "Welder",
          "Northwind Services",
          "30 December 2026",
          "11:00 AM",
          "North gate",
        ],
      },
      {
        event: "INTERVIEW_CANCELLED" as const,
        templateName: "interview_cancelled_hi",
        bodyParameters: ["Welder", "Northwind Services", "30 December 2026", "11:00 AM"],
      },
    ];

    for (const item of events) {
      const queued: Array<{
        templateName: string;
        languageCode: string;
        bodyParameters: string[];
      }> = [];
      const result = await enqueueWhatsAppNotification(
        {
          event: item.event,
          entityId: applicationId,
          phoneNumber: seekerPhone,
          jobTitle: "Welder",
          companyName: "Northwind Services",
          interviewDate: "30 December 2026",
          interviewTime: "11:00 AM",
          interviewVenue: "North gate",
          preferredLanguage: "hi-IN",
        },
        {
          claim: async () => "claimed",
          enqueueJob: async (job) => {
            queued.push(job);
          },
        },
      );
      assert.equal(result, "queued");
      assert.equal(queued[0]?.templateName, item.templateName);
      assert.equal(queued[0]?.languageCode, "hi");
      assert.deepEqual(queued[0]?.bodyParameters, item.bodyParameters);
    }
  });

  it("queues Tamil and Kannada templates with the Graph language and body order", async () => {
    const sharedBody = {
      jobTitle: "Welder",
      companyName: "Northwind Services",
      interviewDate: "30 December 2026",
      interviewTime: "11:00 AM",
      interviewVenue: "North gate",
    };
    const tamil = [
      ["JOBSEEKER_ACCOUNT_CREATED", "jobseeker_account_created_ta", "ta", []],
      ["JOBSEEKER_PROFILE_COMPLETION", "jobseeker_profile_completion_ta", "ta", []],
      ["JOB_APPLICATION_SUBMITTED", "job_application_submitted_ta", "ta", ["Welder", "Northwind Services"]],
      ["INTERVIEW_SCHEDULED_PHONE", "interview_scheduled_phone_ta", "ta", ["Welder", "Northwind Services", "30 December 2026", "11:00 AM"]],
      ["INTERVIEW_SCHEDULED_ONLINE", "interview_scheduled_online_ta", "ta", ["Welder", "Northwind Services", "30 December 2026", "11:00 AM"]],
      ["INTERVIEW_SCHEDULED_OFFLINE", "interview_scheduled_offline_ta", "ta", ["Welder", "Northwind Services", "30 December 2026", "11:00 AM", "North gate"]],
      ["INTERVIEW_RESCHEDULED", "interview_rescheduled_ta", "ta", ["Welder", "Northwind Services", "30 December 2026", "11:00 AM", "North gate"]],
      ["INTERVIEW_CANCELLED", "interview_cancelled_ta", "ta", ["Welder", "Northwind Services", "30 December 2026", "11:00 AM"]],
    ] as const;
    const kannada = [
      ["JOBSEEKER_ACCOUNT_CREATED", "jobseeker_account_created_ka", "kn", []],
      ["JOBSEEKER_PROFILE_COMPLETION", "jobseeker_profile_completion_ka", "kn", []],
      ["JOB_APPLICATION_SUBMITTED", "job_application_submitted_ka", "kn", ["Welder", "Northwind Services"]],
      ["INTERVIEW_SCHEDULED_PHONE", "interview_scheduled_phone_ka", "kn", ["Welder", "Northwind Services", "30 December 2026", "11:00 AM"]],
      ["INTERVIEW_SCHEDULED_ONLINE", "interview_scheduled_online_ka", "kn", ["Welder", "Northwind Services", "30 December 2026", "11:00 AM"]],
      ["INTERVIEW_SCHEDULED_OFFLINE", "interview_scheduled_offline_ka", "kn", ["Welder", "Northwind Services", "30 December 2026", "11:00 AM", "North gate"]],
      ["INTERVIEW_RESCHEDULED", "interview_rescheduled_ka", "kn", ["Welder", "Northwind Services", "30 December 2026", "11:00 AM", "North gate"]],
      ["INTERVIEW_CANCELLED", "interview_cancelled_ka", "kn", ["Welder", "Northwind Services", "30 December 2026", "11:00 AM"]],
    ] as const;

    for (const [language, cases] of [
      ["ta", tamil],
      ["tamil", tamil],
      ["kn", kannada],
      ["kannada", kannada],
    ] as const) {
      for (const [event, templateName, languageCode, bodyParameters] of cases) {
        const queued: Array<{
          templateName: string;
          languageCode: string;
          bodyParameters: string[];
          urlButtonParameters?: string[];
        }> = [];
        const result = await enqueueWhatsAppNotification(
          {
            event,
            entityId: applicationId,
            phoneNumber: seekerPhone,
            preferredLanguage: language,
            ...sharedBody,
          },
          {
            claim: async () => "claimed",
            enqueueJob: async (job) => {
              queued.push(job);
            },
          },
        );
        assert.equal(result, "queued");
        assert.equal(queued[0]?.templateName, templateName);
        assert.equal(queued[0]?.languageCode, languageCode);
        assert.notEqual(queued[0]?.languageCode, "ta_IN");
        assert.notEqual(queued[0]?.languageCode, "kn_IN");
        assert.deepEqual(queued[0]?.bodyParameters, [...bodyParameters]);
        assert.equal(queued[0]?.urlButtonParameters, undefined);
      }
    }

    for (const venue of ["North gate", "Madhapur, Hyderabad"]) {
      assert.deepEqual(
        buildWhatsAppNotificationBodyParameters("INTERVIEW_SCHEDULED_OFFLINE", {
          event: "INTERVIEW_SCHEDULED_OFFLINE",
          entityId: applicationId,
          phoneNumber: seekerPhone,
          jobTitle: "Welder",
          companyName: "Northwind Services",
          interviewDate: "30 December 2026",
          interviewTime: "11:00 AM",
          interviewVenue: venue,
          preferredLanguage: "ta",
        }),
        ["Welder", "Northwind Services", "30 December 2026", "11:00 AM", venue],
      );
      assert.deepEqual(
        buildWhatsAppNotificationBodyParameters("INTERVIEW_SCHEDULED_OFFLINE", {
          event: "INTERVIEW_SCHEDULED_OFFLINE",
          entityId: applicationId,
          phoneNumber: seekerPhone,
          jobTitle: "Welder",
          companyName: "Northwind Services",
          interviewDate: "30 December 2026",
          interviewTime: "11:00 AM",
          interviewVenue: venue,
          preferredLanguage: "kn",
        }),
        ["Welder", "Northwind Services", "30 December 2026", "11:00 AM", venue],
      );
    }
    assert.equal(
      resolveWhatsAppNotificationDelivery("JOBSEEKER_PROFILE_COMPLETION", "ta")
        ?.languageCode,
      "ta",
    );
    assert.deepEqual(
      resolveWhatsAppNotificationDelivery("INTERVIEW_SCHEDULED_OFFLINE", "kn"),
      {
        templateName: "interview_scheduled_offline_ka",
        languageCode: "kn",
      },
    );
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

  it("selects the approved Malayalam template name and Meta language ml", () => {
    const cases = [
      ["JOBSEEKER_ACCOUNT_CREATED", "jobseeker_account_created_ml", []],
      ["JOBSEEKER_PROFILE_COMPLETION", "jobseeker_profile_completion_ml", []],
      [
        "JOB_APPLICATION_SUBMITTED",
        "job_application_submitted_ml",
        ["Welder", "Northwind Services"],
      ],
      [
        "INTERVIEW_SCHEDULED_PHONE",
        "interview_scheduled_phone_ml",
        ["Welder", "Northwind Services", "30 December 2026", "11:00 AM", "ഫോൺ കോൾ"],
      ],
      [
        "INTERVIEW_SCHEDULED_ONLINE",
        "interview_scheduled_online_ml",
        ["Welder", "Northwind Services", "30 December 2026", "11:00 AM", "ഓൺലൈൻ"],
      ],
      [
        "INTERVIEW_SCHEDULED_OFFLINE",
        "interview_scheduled_offline_ml",
        ["Welder", "Northwind Services", "30 December 2026", "11:00 AM", "North gate"],
      ],
      [
        "INTERVIEW_RESCHEDULED",
        "interview_rescheduled_ml",
        ["Welder", "Northwind Services", "1 December 2026", "3:05 PM", "South gate"],
      ],
      [
        "INTERVIEW_CANCELLED",
        "interview_cancelled_ml",
        ["Welder", "Northwind Services", "30 December 2026", "11:00 AM"],
      ],
    ] as const;

    const shared = {
      entityId: applicationId,
      phoneNumber: seekerPhone,
      jobTitle: "Welder",
      companyName: "Northwind Services",
      interviewDate: "30 December 2026",
      interviewTime: "11:00 AM",
      interviewVenue: "North gate",
    };

    for (const [event, templateName, bodyParameters] of cases) {
      for (const language of ["ml", "malayalam", "ml-IN", "ml_IN"]) {
        assert.deepEqual(resolveWhatsAppNotificationDelivery(event, language), {
          templateName,
          languageCode: "ml",
        });
        assert.notEqual(
          resolveWhatsAppNotificationDelivery(event, language)?.languageCode,
          "ml-IN",
        );
      }
      const payload = {
        event,
        ...shared,
        ...(event === "INTERVIEW_RESCHEDULED"
          ? {
              interviewDate: "1 December 2026",
              interviewTime: "3:05 PM",
              interviewVenue: "South gate",
            }
          : {}),
        preferredLanguage: "ml",
      };
      assert.deepEqual(
        buildWhatsAppNotificationBodyParameters(event, payload, "ml"),
        [...bodyParameters],
      );
      assert.notEqual(
        resolveWhatsAppNotificationDelivery(event, "ml")?.templateName,
        templateName.replace(/_ml$/, ""),
      );
    }

    for (const language of ["en", "te", "hi", "ta", "kn"] as const) {
      assert.deepEqual(
        buildWhatsAppNotificationBodyParameters(
          "INTERVIEW_SCHEDULED_ONLINE",
          { ...shared, event: "INTERVIEW_SCHEDULED_ONLINE", preferredLanguage: language },
          language,
        ),
        ["Welder", "Northwind Services", "30 December 2026", "11:00 AM"],
      );
      assert.deepEqual(
        buildWhatsAppNotificationBodyParameters(
          "INTERVIEW_SCHEDULED_PHONE",
          { ...shared, event: "INTERVIEW_SCHEDULED_PHONE", preferredLanguage: language },
          language,
        ),
        ["Welder", "Northwind Services", "30 December 2026", "11:00 AM"],
      );
    }

    assert.deepEqual(
      buildWhatsAppNotificationBodyParameters(
        "INTERVIEW_SCHEDULED_ONLINE",
        { ...shared, event: "INTERVIEW_SCHEDULED_ONLINE", preferredLanguage: "ml" },
        "en",
      ),
      ["Welder", "Northwind Services", "30 December 2026", "11:00 AM"],
    );
    assert.deepEqual(
      buildWhatsAppNotificationBodyParameters("INTERVIEW_SCHEDULED_PHONE", {
        event: "INTERVIEW_SCHEDULED_PHONE",
        ...shared,
        companyName: "",
        preferredLanguage: "ml",
      }),
      [],
    );
    assert.deepEqual(
      buildWhatsAppNotificationBodyParameters(
        "INTERVIEW_SCHEDULED_OFFLINE",
        {
          event: "INTERVIEW_SCHEDULED_OFFLINE",
          ...shared,
          interviewVenue: " ",
          preferredLanguage: "ml",
        },
        "ml",
      ),
      [],
    );
  });

  it("queues Malayalam templates with language ml and the approved parameter order", async () => {
    const sharedBody = {
      jobTitle: "Welder",
      companyName: "Northwind Services",
      interviewDate: "30 December 2026",
      interviewTime: "11:00 AM",
      interviewVenue: "North gate",
    };
    const cases = [
      ["JOBSEEKER_ACCOUNT_CREATED", "jobseeker_account_created_ml", []],
      ["JOBSEEKER_PROFILE_COMPLETION", "jobseeker_profile_completion_ml", []],
      ["JOB_APPLICATION_SUBMITTED", "job_application_submitted_ml", ["Welder", "Northwind Services"]],
      [
        "INTERVIEW_SCHEDULED_PHONE",
        "interview_scheduled_phone_ml",
        ["Welder", "Northwind Services", "30 December 2026", "11:00 AM", "ഫോൺ കോൾ"],
      ],
      [
        "INTERVIEW_SCHEDULED_ONLINE",
        "interview_scheduled_online_ml",
        ["Welder", "Northwind Services", "30 December 2026", "11:00 AM", "ഓൺലൈൻ"],
      ],
      [
        "INTERVIEW_SCHEDULED_OFFLINE",
        "interview_scheduled_offline_ml",
        ["Welder", "Northwind Services", "30 December 2026", "11:00 AM", "North gate"],
      ],
      [
        "INTERVIEW_RESCHEDULED",
        "interview_rescheduled_ml",
        ["Welder", "Northwind Services", "30 December 2026", "11:00 AM", "North gate"],
      ],
      [
        "INTERVIEW_CANCELLED",
        "interview_cancelled_ml",
        ["Welder", "Northwind Services", "30 December 2026", "11:00 AM"],
      ],
    ] as const;

    for (const language of ["ml", "malayalam"] as const) {
      for (const [event, templateName, bodyParameters] of cases) {
        const queued: Array<{
          templateName: string;
          languageCode: string;
          bodyParameters: string[];
          urlButtonParameters?: string[];
        }> = [];
        const result = await enqueueWhatsAppNotification(
          {
            event,
            entityId: applicationId,
            phoneNumber: seekerPhone,
            preferredLanguage: language,
            ...sharedBody,
          },
          {
            claim: async () => "claimed",
            enqueueJob: async (job) => {
              queued.push(job);
            },
          },
        );
        assert.equal(result, "queued");
        assert.equal(queued[0]?.templateName, templateName);
        assert.equal(queued[0]?.languageCode, "ml");
        assert.notEqual(queued[0]?.languageCode, "ml-IN");
        assert.deepEqual(queued[0]?.bodyParameters, [...bodyParameters]);
        assert.equal(queued[0]?.urlButtonParameters, undefined);
      }
    }
  });

  it("does not queue a second Malayalam message for the same event", async () => {
    let queued = 0;
    const payload = {
      event: "JOB_APPLICATION_SUBMITTED" as const,
      entityId: applicationId,
      phoneNumber: seekerPhone,
      jobTitle: "Welder",
      companyName: "Northwind Services",
      preferredLanguage: "ml",
    };
    const first = await enqueueWhatsAppNotification(payload, {
      claim: async () => "claimed",
      enqueueJob: async () => {
        queued += 1;
      },
    });
    const second = await enqueueWhatsAppNotification(payload, {
      claim: async () => "duplicate",
      enqueueJob: async () => {
        queued += 1;
      },
    });
    assert.equal(first, "queued");
    assert.equal(second, "skipped_duplicate");
    assert.equal(queued, 1);
  });
});
