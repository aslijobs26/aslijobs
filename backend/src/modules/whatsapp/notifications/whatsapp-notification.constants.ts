export const WHATSAPP_NOTIFICATION_EVENTS = [
  "EMPLOYER_ACCOUNT_CREATED",
  "JOBSEEKER_ACCOUNT_CREATED",
  "JOBSEEKER_PROFILE_COMPLETION",
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
  "INTERVIEW_SCHEDULED_PHONE",
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

/**
 * Meta's template language list codes Telugu as `te` and Hindi as `hi`.
 * `te-IN` and `hi-IN` are speech-API codes and are not WhatsApp template languages.
 */
export const WHATSAPP_TEMPLATE_LANGUAGE_TELUGU = "te";
export const WHATSAPP_TEMPLATE_LANGUAGE_HINDI = "hi";
export const WHATSAPP_TEMPLATE_LANGUAGE_TAMIL = "ta";
export const WHATSAPP_TEMPLATE_LANGUAGE_KANNADA = "kn";

export type WhatsAppNotificationTemplateConfig = {
  /** English Meta template name. Never rename existing English templates. */
  templateName: string;
  defaultLanguage: WhatsAppNotificationSiteLanguage;
  /**
   * Site language -> approved Meta template language code.
   * Only languages with an approved Meta template are listed.
   */
  approvedLanguages: Partial<
    Record<WhatsAppNotificationSiteLanguage, string>
  >;
  /**
   * Site language -> distinct approved Meta template name.
   * Telugu and Hindi use `_te` and `_hi`. Tamil uses `_ta`. Kannada uses `_ka`
   * with Meta language `kn`, not a `_kn` name. Those are distinct template names.
   */
  localizedTemplateNames?: Partial<
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
    // Telugu and Hindi use separate template names, not this English name
    // with language te or hi. Hindi names are the WhatsApp Manager names for
    // this account. This registry does not re-query Graph for their status.
    templateName: "jobseeker_account_created",
    defaultLanguage: "en",
    approvedLanguages: {
      en: "en",
      te: WHATSAPP_TEMPLATE_LANGUAGE_TELUGU,
      hi: WHATSAPP_TEMPLATE_LANGUAGE_HINDI,
      ta: WHATSAPP_TEMPLATE_LANGUAGE_TAMIL,
      kn: WHATSAPP_TEMPLATE_LANGUAGE_KANNADA,
    },
    localizedTemplateNames: {
      te: "jobseeker_account_created_te",
      hi: "jobseeker_account_created_hi",
      ta: "jobseeker_account_created_ta",
      kn: "jobseeker_account_created_ka",
    },
  },
  JOBSEEKER_PROFILE_COMPLETION: {
    // Graph-confirmed APPROVED Utility.
    // Body has no variables. Complete Your Profile is a static URL button
    // to https://www.aslijobs.com/job-seeker/profile on every approved
    // language, so the API must not send body or button parameters.
    templateName: "jobseeker_profile_completion",
    defaultLanguage: "en",
    approvedLanguages: {
      en: "en",
      te: WHATSAPP_TEMPLATE_LANGUAGE_TELUGU,
      hi: WHATSAPP_TEMPLATE_LANGUAGE_HINDI,
      ta: WHATSAPP_TEMPLATE_LANGUAGE_TAMIL,
      kn: WHATSAPP_TEMPLATE_LANGUAGE_KANNADA,
    },
    localizedTemplateNames: {
      te: "jobseeker_profile_completion_te",
      hi: "jobseeker_profile_completion_hi",
      ta: "jobseeker_profile_completion_ta",
      kn: "jobseeker_profile_completion_ka",
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
    // Graph template aslijobs_account_approved, language en.
    // Body {{1}} is the employer profile type (Company, Consultancy, or
    // Individual), not the employer or company name. Post Job is a dynamic
    // URL button whose suffix is the employer id.
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
      te: WHATSAPP_TEMPLATE_LANGUAGE_TELUGU,
      hi: WHATSAPP_TEMPLATE_LANGUAGE_HINDI,
      ta: WHATSAPP_TEMPLATE_LANGUAGE_TAMIL,
      kn: WHATSAPP_TEMPLATE_LANGUAGE_KANNADA,
    },
    localizedTemplateNames: {
      te: "job_application_submitted_te",
      hi: "job_application_submitted_hi",
      ta: "job_application_submitted_ta",
      kn: "job_application_submitted_ka",
    },
  },
  INTERVIEW_SCHEDULED_PHONE: {
    // Approved Utility. English name interview_scheduled_phone, language en.
    // Body matches interview_scheduled_online: {{1}} job title, {{2}} company,
    // {{3}} date, {{4}} time. Interview type is static. No URL button.
    // Telugu uses a separate approved name, not this English name with language te.
    templateName: "interview_scheduled_phone",
    defaultLanguage: "en",
    approvedLanguages: {
      en: "en",
      te: WHATSAPP_TEMPLATE_LANGUAGE_TELUGU,
      hi: WHATSAPP_TEMPLATE_LANGUAGE_HINDI,
      ta: WHATSAPP_TEMPLATE_LANGUAGE_TAMIL,
      kn: WHATSAPP_TEMPLATE_LANGUAGE_KANNADA,
    },
    localizedTemplateNames: {
      te: "interview_scheduled_phone_te",
      hi: "interview_scheduled_phone_hi",
      ta: "interview_scheduled_phone_ta",
      kn: "interview_scheduled_phone_ka",
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
      te: WHATSAPP_TEMPLATE_LANGUAGE_TELUGU,
      hi: WHATSAPP_TEMPLATE_LANGUAGE_HINDI,
      ta: WHATSAPP_TEMPLATE_LANGUAGE_TAMIL,
      kn: WHATSAPP_TEMPLATE_LANGUAGE_KANNADA,
    },
    localizedTemplateNames: {
      te: "interview_scheduled_online_te",
      hi: "interview_scheduled_online_hi",
      ta: "interview_scheduled_online_ta",
      kn: "interview_scheduled_online_ka",
    },
  },
  INTERVIEW_SCHEDULED_OFFLINE: {
    // Graph-confirmed APPROVED Utility.
    // Body {{1}} job title, {{2}} company, {{3}} date, {{4}} time, {{5}} venue.
    // Tamil and Kannada use the same five variables. There is no URL button.
    templateName: "interview_scheduled_offline",
    defaultLanguage: "en",
    approvedLanguages: {
      en: "en",
      te: WHATSAPP_TEMPLATE_LANGUAGE_TELUGU,
      hi: WHATSAPP_TEMPLATE_LANGUAGE_HINDI,
      ta: WHATSAPP_TEMPLATE_LANGUAGE_TAMIL,
      kn: WHATSAPP_TEMPLATE_LANGUAGE_KANNADA,
    },
    localizedTemplateNames: {
      te: "interview_scheduled_offline_te",
      hi: "interview_scheduled_offline_hi",
      ta: "interview_scheduled_offline_ta",
      kn: "interview_scheduled_offline_ka",
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
      te: WHATSAPP_TEMPLATE_LANGUAGE_TELUGU,
      hi: WHATSAPP_TEMPLATE_LANGUAGE_HINDI,
      ta: WHATSAPP_TEMPLATE_LANGUAGE_TAMIL,
      kn: WHATSAPP_TEMPLATE_LANGUAGE_KANNADA,
    },
    localizedTemplateNames: {
      te: "interview_rescheduled_te",
      hi: "interview_rescheduled_hi",
      ta: "interview_rescheduled_ta",
      kn: "interview_rescheduled_ka",
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
      te: WHATSAPP_TEMPLATE_LANGUAGE_TELUGU,
      hi: WHATSAPP_TEMPLATE_LANGUAGE_HINDI,
      ta: WHATSAPP_TEMPLATE_LANGUAGE_TAMIL,
      kn: WHATSAPP_TEMPLATE_LANGUAGE_KANNADA,
    },
    localizedTemplateNames: {
      te: "interview_cancelled_te",
      hi: "interview_cancelled_hi",
      ta: "interview_cancelled_ta",
      kn: "interview_cancelled_ka",
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
