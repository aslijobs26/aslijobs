import mongoose from "mongoose";
import { ApplicationModel } from "../../applications/application.model.js";
import { EmployerModel } from "../../employers/employer.model.js";
import { JobModel } from "../../jobs/job.model.js";
import { JobSeekerModel } from "../../job-seekers/job-seeker.model.js";
import { WhatsAppNotificationDispatchModel } from "../notifications/whatsapp-notification.model.js";
import { refreshStoredNotificationTemplates } from "./whatsapp-inbox-template-refresh.js";
import { notificationInboxText } from "./whatsapp-template-text.js";
import { recordOutboundMessage } from "./whatsapp-inbox-store.js";
import type { WhatsAppInboxMessageStatus } from "./whatsapp-inbox.model.js";

const EMPLOYER_EVENTS = new Set([
  "EMPLOYER_ACCOUNT_CREATED",
  "EMPLOYER_ACCOUNT_APPROVED",
  "EMPLOYER_ACCOUNT_REJECTED",
  "EMPLOYER_PROFILE_COMPLETION_REQUIRED",
  "EMPLOYER_PROFILE_COMPLETION_REMINDER",
]);

const SEEKER_EVENTS = new Set([
  "JOBSEEKER_ACCOUNT_CREATED",
  "JOBSEEKER_PROFILE_COMPLETION",
]);

const APPLICATION_SEEKER_EVENTS = new Set([
  "JOB_APPLICATION_SUBMITTED",
  "APPLICATION_STATUS_UPDATED",
  "INTERVIEW_SCHEDULED",
  "INTERVIEW_SCHEDULED_PHONE",
  "INTERVIEW_SCHEDULED_ONLINE",
  "INTERVIEW_SCHEDULED_OFFLINE",
  "INTERVIEW_RESCHEDULED",
  "INTERVIEW_CANCELLED",
]);

const JOB_PUBLIC_ID_EVENTS = new Set([
  "JOB_POST_SUBMITTED",
  "JOB_POST_APPROVED",
  "JOB_POST_INCOMPLETE",
  "JOB_APPROVED",
]);

const JOB_MONGO_ID_EVENTS = new Set([
  "JOB_POST_REJECTED",
  "JOB_REJECTED",
]);

const RECOVERABLE_STATUSES = new Set([
  "accepted",
  "sent",
  "delivered",
  "read",
]);

let backfillTask: Promise<{ recovered: number; skipped: number }> | null = null;

export function ensureWhatsAppInboxBackfill(): Promise<{
  recovered: number;
  skipped: number;
}> {
  if (mongoose.connection.readyState !== 1) {
    return Promise.resolve({ recovered: 0, skipped: 0 });
  }
  if (!backfillTask) {
    backfillTask = backfillInboxFromNotificationDispatches()
      .then(async (result) => {
        await refreshStoredNotificationTemplates();
        return result;
      })
      .catch((error: unknown) => {
      backfillTask = null;
      console.error(
        `[WhatsAppInbox] history backfill failed reason=${
          error instanceof Error ? error.name : "unknown"
        }`,
      );
      return { recovered: 0, skipped: 0 };
    });
  }
  return backfillTask;
}

export async function backfillInboxFromNotificationDispatches(): Promise<{
  recovered: number;
  skipped: number;
}> {
  if (mongoose.connection.readyState !== 1) {
    return { recovered: 0, skipped: 0 };
  }

  const rows = await WhatsAppNotificationDispatchModel.find({
    messageId: { $nin: ["", null] },
    status: { $in: [...RECOVERABLE_STATUSES] },
  })
    .select("event entityId templateName language messageId status acceptedAt sentAt createdAt")
    .limit(500)
    .lean();

  let recovered = 0;
  let skipped = 0;

  for (const row of rows) {
    const phone = await resolveDispatchPhone(row.event, row.entityId);
    if (!phone) {
      skipped += 1;
      continue;
    }
    const occurredAt = row.sentAt ?? row.acceptedAt ?? row.createdAt ?? new Date();
    const saved = await recordOutboundMessage({
      phoneNational: phone,
      body: await notificationInboxText({
        templateName: row.templateName,
        language: row.language,
      }),
      senderType: "notification",
      providerMessageId: row.messageId,
      status: mapStatus(row.status),
      occurredAt,
    });
    if (saved.created) recovered += 1;
  }

  console.info(
    `[WhatsAppInbox] history backfill recovered=${recovered} skipped=${skipped}`,
  );
  return { recovered, skipped };
}

async function resolveDispatchPhone(
  event: string,
  entityId: string,
): Promise<string | null> {
  const id = entityId.trim();
  if (!id) return null;

  if (EMPLOYER_EVENTS.has(event)) {
    return phoneFromEmployerId(id);
  }
  if (SEEKER_EVENTS.has(event)) {
    return phoneFromSeekerId(id);
  }
  if (APPLICATION_SEEKER_EVENTS.has(event)) {
    if (!mongoose.Types.ObjectId.isValid(id)) return null;
    const application = await ApplicationModel.findById(id)
      .select("jobSeekerId")
      .lean();
    if (!application?.jobSeekerId) return null;
    return phoneFromSeekerId(String(application.jobSeekerId));
  }
  if (JOB_PUBLIC_ID_EVENTS.has(event)) {
    const job = await JobModel.findOne({
      jobId: { $in: [id, id.toUpperCase()] },
    })
      .select("employerId")
      .lean();
    if (!job?.employerId) return null;
    return phoneFromEmployerId(String(job.employerId));
  }
  if (JOB_MONGO_ID_EVENTS.has(event)) {
    if (!mongoose.Types.ObjectId.isValid(id)) return null;
    const job = await JobModel.findById(id).select("employerId").lean();
    if (!job?.employerId) return null;
    return phoneFromEmployerId(String(job.employerId));
  }
  return null;
}

async function phoneFromEmployerId(id: string): Promise<string | null> {
  if (!mongoose.Types.ObjectId.isValid(id)) return null;
  const employer = await EmployerModel.findById(id).select("whatsappNumber").lean();
  const phone = employer?.whatsappNumber?.trim() ?? "";
  return /^\d{10}$/.test(phone) ? phone : null;
}

async function phoneFromSeekerId(id: string): Promise<string | null> {
  if (!mongoose.Types.ObjectId.isValid(id)) return null;
  const seeker = await JobSeekerModel.findById(id).select("whatsappNumber").lean();
  const phone = seeker?.whatsappNumber?.trim() ?? "";
  return /^\d{10}$/.test(phone) ? phone : null;
}

function mapStatus(status: string): WhatsAppInboxMessageStatus {
  if (status === "sent" || status === "delivered" || status === "read" || status === "accepted") {
    return status;
  }
  return "accepted";
}
