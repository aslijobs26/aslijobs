import mongoose from "mongoose";
import { ApplicationModel } from "../../applications/application.model.js";
import { EmployerModel } from "../../employers/employer.model.js";
import { JobModel } from "../../jobs/job.model.js";
import {
  WHATSAPP_NOTIFICATION_EVENTS,
  type WhatsAppNotificationEvent,
} from "../notifications/whatsapp-notification.constants.js";
import { WhatsAppNotificationDispatchModel } from "../notifications/whatsapp-notification.model.js";
import { buildWhatsAppNotificationBodyParameters } from "../notifications/whatsapp-notification.policy.js";
import type { WhatsAppNotificationPayload } from "../notifications/whatsapp-notification.types.js";
import {
  formatInterviewScheduledDate,
  formatInterviewScheduledTime,
} from "../notifications/interview-scheduled-online.notification.js";
import { resolveApplicationCompanyName } from "../notifications/job-application-submitted.notification.js";
import {
  isUnresolvedInboxTemplateBody,
  notificationInboxText,
} from "./whatsapp-template-text.js";

const NO_BODY_PARAMETER_EVENTS = new Set<WhatsAppNotificationEvent>([
  "JOBSEEKER_ACCOUNT_CREATED",
  "JOBSEEKER_PROFILE_COMPLETION",
  "JOB_POST_REJECTED",
  "JOB_REJECTED",
]);

const EMPLOYER_NAME_EVENTS = new Set<WhatsAppNotificationEvent>([
  "EMPLOYER_ACCOUNT_CREATED",
  "EMPLOYER_PROFILE_COMPLETION_REQUIRED",
  "EMPLOYER_PROFILE_COMPLETION_REMINDER",
  "EMPLOYER_ACCOUNT_REJECTED",
  "JOB_POST_SUBMITTED",
  "JOB_POST_APPROVED",
  "JOB_POST_INCOMPLETE",
  "JOB_APPROVED",
]);

const INTERVIEW_EVENTS = new Set<WhatsAppNotificationEvent>([
  "INTERVIEW_SCHEDULED_PHONE",
  "INTERVIEW_SCHEDULED_ONLINE",
  "INTERVIEW_SCHEDULED_OFFLINE",
  "INTERVIEW_RESCHEDULED",
  "INTERVIEW_CANCELLED",
]);

const JOB_MONGO_ID_EVENTS = new Set<WhatsAppNotificationEvent>([
  "JOB_POST_REJECTED",
  "JOB_REJECTED",
]);

const JOB_PUBLIC_ID_EVENTS = new Set<WhatsAppNotificationEvent>([
  "JOB_POST_SUBMITTED",
  "JOB_POST_APPROVED",
  "JOB_POST_INCOMPLETE",
  "JOB_APPROVED",
]);

type EmployerNameSource = {
  companyName?: string | null;
  establishmentName?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  accountType?: string | null;
};

export type HistoricalTemplateParameterInput = {
  event: string;
  employerName?: string | null;
  employerProfileType?: string | null;
  jobTitle?: string | null;
  companyName?: string | null;
  interviewDate?: string | null;
  interviewTime?: string | null;
  interviewVenue?: string | null;
};

export function recoverableEmployerName(
  employer: EmployerNameSource | null | undefined,
): string {
  if (!employer) return "";
  const companyName = employer.companyName?.trim() ?? "";
  const establishmentName = employer.establishmentName?.trim() ?? "";
  const personName = [employer.firstName, employer.lastName]
    .map((value) => value?.trim() ?? "")
    .filter(Boolean)
    .join(" ");
  return companyName || establishmentName || personName;
}

/**
 * Parameters already stored on the dispatch win. They are the values sent to
 * Meta. An empty array means they were not stored, not that the template has
 * no variables.
 */
export function chooseTemplateParameters(
  stored: readonly string[] | undefined,
  recovered: readonly string[] | null,
): string[] | null {
  const saved = stored ?? [];
  if (saved.some((value) => value.trim())) {
    return saved.map((value) => value.trim());
  }
  return recovered ? [...recovered] : null;
}

export async function resolveDispatchTemplateParameters(input: {
  storedParameters?: readonly string[];
  storedRenderedBody?: string;
  loadRecovered: () => Promise<string[] | null>;
}): Promise<{ parameters: string[] | null; renderedBody: string }> {
  const storedBody = input.storedRenderedBody?.trim() ?? "";
  if (storedBody && !isUnresolvedInboxTemplateBody(storedBody)) {
    return {
      parameters: chooseTemplateParameters(input.storedParameters, null),
      renderedBody: storedBody,
    };
  }
  const stored = chooseTemplateParameters(input.storedParameters, null);
  if (stored) {
    return { parameters: stored, renderedBody: "" };
  }
  return {
    parameters: await input.loadRecovered(),
    renderedBody: "",
  };
}

/**
 * Rebuilds body parameters from the same fields the sender used.
 * Returns null when a required value is not on the related record.
 * Never substitutes a placeholder name.
 */
export function historicalBodyParameters(
  input: HistoricalTemplateParameterInput,
): string[] | null {
  if (!isNotificationEvent(input.event)) return null;
  const event = input.event;
  if (NO_BODY_PARAMETER_EVENTS.has(event)) return [];

  if (event === "EMPLOYER_ACCOUNT_APPROVED") {
    const built = buildParameters(event, {
      employerProfileType: input.employerProfileType?.trim() ?? "",
    });
    return built.length > 0 ? built : null;
  }

  if (EMPLOYER_NAME_EVENTS.has(event)) {
    const employerName = input.employerName?.trim() ?? "";
    if (!employerName) return null;
    return buildParameters(event, { employerName });
  }

  if (event === "JOB_APPLICATION_SUBMITTED") {
    const built = buildParameters(event, {
      jobTitle: input.jobTitle?.trim() ?? "",
      companyName: input.companyName?.trim() ?? "",
    });
    return built.length > 0 ? built : null;
  }

  if (INTERVIEW_EVENTS.has(event)) {
    const interviewDate = formatInterviewScheduledDate(input.interviewDate ?? "");
    const interviewTime = formatInterviewScheduledTime(input.interviewTime ?? "");
    const interviewVenue = input.interviewVenue?.trim() ?? "";
    if (!interviewDate || !interviewTime) return null;
    const built = buildParameters(event, {
      jobTitle: input.jobTitle?.trim() ?? "",
      companyName: input.companyName?.trim() ?? "",
      interviewDate,
      interviewTime,
      interviewVenue,
    });
    return built.length > 0 ? built : null;
  }

  return null;
}

export async function loadHistoricalBodyParameters(input: {
  event: string;
  entityId: string;
}): Promise<string[] | null> {
  if (!isNotificationEvent(input.event)) return null;
  const event = input.event;
  const entityId = input.entityId.trim();
  if (NO_BODY_PARAMETER_EVENTS.has(event)) return [];
  if (!entityId) return null;

  if (JOB_PUBLIC_ID_EVENTS.has(event) || JOB_MONGO_ID_EVENTS.has(event)) {
    return loadJobEmployerParameters(event, entityId);
  }

  if (event === "JOB_APPLICATION_SUBMITTED" || INTERVIEW_EVENTS.has(event)) {
    return loadApplicationParameters(event, entityId);
  }

  if (event === "EMPLOYER_ACCOUNT_APPROVED" || EMPLOYER_NAME_EVENTS.has(event)) {
    const employer = await findEmployer(entityId);
    if (!employer) return null;
    return historicalBodyParameters({
      event,
      employerName: recoverableEmployerName(employer),
      employerProfileType: employer.accountType ?? "",
    });
  }

  return null;
}

export async function renderStoredDispatchForInbox(row: {
  _id: unknown;
  event: string;
  entityId: string;
  templateName: string;
  language?: string;
  bodyParameters?: readonly string[];
  renderedBody?: string;
}): Promise<{ body: string; parameters: string[] }> {
  const hadStoredParameters = (row.bodyParameters ?? []).some((value) => value.trim());
  const hadRenderedBody =
    Boolean(row.renderedBody?.trim()) &&
    !isUnresolvedInboxTemplateBody(row.renderedBody ?? "");
  const resolved = await resolveDispatchTemplateParameters({
    storedParameters: row.bodyParameters,
    storedRenderedBody: row.renderedBody,
    loadRecovered: () =>
      loadHistoricalBodyParameters({
        event: row.event,
        entityId: row.entityId,
      }),
  });
  if (resolved.renderedBody) {
    return {
      body: resolved.renderedBody,
      parameters: resolved.parameters ?? [],
    };
  }

  const parameters = resolved.parameters ?? [];
  const body = await notificationInboxText({
    templateName: row.templateName,
    language: row.language,
    bodyParameters: parameters,
  });
  if (!isUnresolvedInboxTemplateBody(body)) {
    const update: { bodyParameters?: string[]; renderedBody?: string } = {};
    if (!hadRenderedBody) update.renderedBody = body.slice(0, 4096);
    if (!hadStoredParameters && parameters.some((value) => value.trim())) {
      update.bodyParameters = parameters;
    }
    if (update.bodyParameters || update.renderedBody) {
      await WhatsAppNotificationDispatchModel.updateOne(
        { _id: row._id },
        { $set: update },
      );
    }
  }
  return { body, parameters };
}

function buildParameters(
  event: WhatsAppNotificationEvent,
  fields: Partial<WhatsAppNotificationPayload>,
): string[] {
  return buildWhatsAppNotificationBodyParameters(event, {
    event,
    entityId: "historical",
    phoneNumber: "0000000000",
    ...fields,
  });
}

function isNotificationEvent(value: string): value is WhatsAppNotificationEvent {
  return (WHATSAPP_NOTIFICATION_EVENTS as readonly string[]).includes(value);
}

async function findEmployer(id: string): Promise<EmployerNameSource | null> {
  if (!mongoose.Types.ObjectId.isValid(id)) return null;
  return EmployerModel.findById(id)
    .select("companyName establishmentName firstName lastName accountType")
    .lean();
}

async function loadApplicationParameters(
  event: WhatsAppNotificationEvent,
  entityId: string,
): Promise<string[] | null> {
  if (!mongoose.Types.ObjectId.isValid(entityId)) return null;
  const application = await ApplicationModel.findById(entityId)
    .select("jobId employerId interview")
    .lean();
  if (!application?.jobId) return null;
  const job = await JobModel.findById(application.jobId)
    .select("jobTitle companyName")
    .lean();
  const employer = application.employerId
    ? await EmployerModel.findById(application.employerId)
        .select("companyName establishmentName")
        .lean()
    : null;
  const interview = application.interview ?? {};
  return historicalBodyParameters({
    event,
    jobTitle: job?.jobTitle ?? "",
    companyName: resolveApplicationCompanyName({
      jobCompanyName: job?.companyName,
      employerCompanyName: employer?.companyName,
      employerEstablishmentName: employer?.establishmentName,
    }),
    interviewDate: interview.date ?? "",
    interviewTime: interview.time ?? "",
    interviewVenue: interview.venue ?? "",
  });
}

async function loadJobEmployerParameters(
  event: WhatsAppNotificationEvent,
  entityId: string,
): Promise<string[] | null> {
  const job = JOB_MONGO_ID_EVENTS.has(event)
    ? await findJobByMongoId(entityId)
    : await JobModel.findOne({
        jobId: { $in: [entityId, entityId.toUpperCase()] },
      })
        .select("employerId")
        .lean();
  if (!job?.employerId) return null;
  const employer = await findEmployer(String(job.employerId));
  if (!employer) return null;
  return historicalBodyParameters({
    event,
    employerName: recoverableEmployerName(employer),
    employerProfileType: employer.accountType ?? "",
  });
}

async function findJobByMongoId(entityId: string) {
  if (!mongoose.Types.ObjectId.isValid(entityId)) return null;
  return JobModel.findById(entityId).select("employerId").lean();
}
