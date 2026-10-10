export const WHATSAPP_NOTIFICATION_EVENTS = [
  "EMPLOYER_ACCOUNT_CREATED",
  "JOBSEEKER_ACCOUNT_CREATED",
  "EMPLOYER_PROFILE_COMPLETION_REQUIRED",
  "EMPLOYER_PROFILE_COMPLETION_REMINDER",
  "EMPLOYER_ACCOUNT_APPROVED",
  "EMPLOYER_ACCOUNT_REJECTED",
  "JOB_POST_SUBMITTED",
  "JOB_POST_APPROVED",
  "JOB_POST_REJECTED",
  "JOB_POST_INCOMPLETE",
  "JOB_APPROVED",
  "JOB_REJECTED",
  "JOB_APPLICATION_SUBMITTED",
  "APPLICATION_RECEIVED",
  "INTERVIEW_SCHEDULED",
  "INTERVIEW_SCHEDULED_ONLINE",
  "INTERVIEW_SCHEDULED_OFFLINE",
  "INTERVIEW_RESCHEDULED",
  "INTERVIEW_CANCELLED",
  "APPLICATION_STATUS_UPDATED",
] as const;

export type WhatsAppNotificationEvent =
  (typeof WHATSAPP_NOTIFICATION_EVENTS)[number];

export const WHATSAPP_NOTIFICATION_SITE_LANGUAGES = [
  "en",
  "hi",
  "te",
  "ta",
  "kn",
  "ml",
] as const;

export type WhatsAppNotificationSiteLanguage =
  (typeof WHATSAPP_NOTIFICATION_SITE_LANGUAGES)[number];

export type WhatsAppNotificationTemplateConfig = {
  templateName: string;
  defaultLanguage: WhatsAppNotificationSiteLanguage;
  /**
   * Site language -> approved Meta template language code.
   * Only languages with an approved Meta template are listed.
   */
  approvedLanguages: Partial<
    Record<WhatsAppNotificationSiteLanguage, string>
  >;
};

/**
 * Only templates already approved in Meta belong here.
 * Future events stay in WHATSAPP_NOTIFICATION_EVENTS until a template exists.
 *
 * employer_account_created was approved as English Utility. Graph listing from
 * the current WABA did not return this name, so the Meta language code defaults
 * to `en` (same as WHATSAPP_TEMPLATE_LANGUAGE). Confirm in Meta if it is en_US.
 */
export const WHATSAPP_NOTIFICATION_TEMPLATES: Partial<
  Record<WhatsAppNotificationEvent, WhatsAppNotificationTemplateConfig>
> = {
  EMPLOYER_ACCOUNT_CREATED: {
    templateName: "employer_account_created",
    defaultLanguage: "en",
    approvedLanguages: {
      en: "en",
    },
  },
  JOBSEEKER_ACCOUNT_CREATED: {
    // Graph-confirmed APPROVED Utility. Stored name is lowercase.
    // Language en. Body has no variables and there is no button.
    templateName: "jobseeker_account_created",
    defaultLanguage: "en",
    approvedLanguages: {
      en: "en",
    },
  },
  EMPLOYER_PROFILE_COMPLETION_REQUIRED: {
    // Graph-confirmed on the current WABA: APPROVED, language `en`.
    templateName: "employer_profile_completion_required",
    defaultLanguage: "en",
    approvedLanguages: {
      en: "en",
    },
  },
  EMPLOYER_ACCOUNT_APPROVED: {
    templateName: "aslijobs_account_approved",
    defaultLanguage: "en",
    approvedLanguages: {
      en: "en",
    },
  },
  EMPLOYER_ACCOUNT_REJECTED: {
    templateName: "employer_account_rejected",
    defaultLanguage: "en",
    approvedLanguages: {
      en: "en",
    },
  },
  JOB_POST_SUBMITTED: {
    templateName: "job_post_submitted",
    defaultLanguage: "en",
    approvedLanguages: {
      en: "en",
    },
  },
  JOB_POST_APPROVED: {
    templateName: "job_post_approved",
    defaultLanguage: "en",
    approvedLanguages: {
      en: "en",
    },
  },
  JOB_POST_REJECTED: {
    // Graph-confirmed APPROVED Utility, language en.
    // Body has no variables. Edit Job Post is https://www.aslijobs.com/post-job/{{1}}.
    templateName: "job_post_rejected_v1",
    defaultLanguage: "en",
    approvedLanguages: {
      en: "en",
    },
  },
  JOB_APPLICATION_SUBMITTED: {
    // Graph-confirmed APPROVED Utility, language en.
    // Body {{1}} is the job title and {{2}} is the company name. No button.
    templateName: "job_application_submitted",
    defaultLanguage: "en",
    approvedLanguages: {
      en: "en",
    },
  },
  INTERVIEW_SCHEDULED_ONLINE: {
    // Graph-confirmed APPROVED Utility, language en.
    // Body {{1}} job title, {{2}} company, {{3}} date, {{4}} time.
    // Interview Type is static text. There is no URL button.
    templateName: "interview_scheduled_online",
    defaultLanguage: "en",
    approvedLanguages: {
      en: "en",
    },
  },
  INTERVIEW_SCHEDULED_OFFLINE: {
    // Graph-confirmed APPROVED Utility, language en.
    // Body {{1}} job title, {{2}} company, {{3}} date, {{4}} time, {{5}} venue.
    // There is no URL button.
    templateName: "interview_scheduled_offline",
    defaultLanguage: "en",
    approvedLanguages: {
      en: "en",
    },
  },
  INTERVIEW_RESCHEDULED: {
    // Graph-confirmed APPROVED Utility, language en.
    // Body {{1}} job title, {{2}} company, {{3}} new date, {{4}} new time, {{5}} venue.
    // There is no URL button.
    templateName: "interview_rescheduled",
    defaultLanguage: "en",
    approvedLanguages: {
      en: "en",
    },
  },
  INTERVIEW_CANCELLED: {
    // Graph-confirmed APPROVED Utility, language en.
    // Body {{1}} job title, {{2}} company, {{3}} date, {{4}} time.
    // There is no URL button.
    templateName: "interview_cancelled",
    defaultLanguage: "en",
    approvedLanguages: {
      en: "en",
    },
  },
  JOB_POST_INCOMPLETE: {
    templateName: "job_post_incomplete_",
    defaultLanguage: "en",
    approvedLanguages: {
      en: "en",
    },
  },
};

export const WHATSAPP_NOTIFICATION_QUEUE_NAME = "whatsapp-notifications";
export const WHATSAPP_NOTIFICATION_JOB_NAME = "send-template";
export const WHATSAPP_NOTIFICATION_MAX_ATTEMPTS = 3;
export const WHATSAPP_NOTIFICATION_BACKOFF_MS = 2_000;
export const WHATSAPP_NOTIFICATION_WORKER_CONCURRENCY = 2;
