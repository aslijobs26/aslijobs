import { Queue, Worker } from "bullmq";
import { Redis } from "ioredis";
import { env } from "../../../config/env.js";
import {
  maskWhatsAppRecipient,
  WhatsAppService,
  WhatsAppTemplateDeliveryError,
} from "../whatsapp.service.js";
import {
  WHATSAPP_NOTIFICATION_BACKOFF_MS,
  WHATSAPP_NOTIFICATION_JOB_NAME,
  WHATSAPP_NOTIFICATION_MAX_ATTEMPTS,
  WHATSAPP_NOTIFICATION_QUEUE_NAME,
  WHATSAPP_NOTIFICATION_WORKER_CONCURRENCY,
} from "./whatsapp-notification.constants.js";
import {
  markWhatsAppNotificationDispatchAccepted,
  markWhatsAppNotificationDispatchAmbiguous,
  markWhatsAppNotificationDispatchFailed,
  markWhatsAppNotificationDispatchProcessing,
  wasWhatsAppNotificationDispatchHandedOff,
} from "./whatsapp-notification.model.js";
import {
  shouldAbortJobSeekerProfileCompletionDelivery,
  syncReminderFromQueueJob,
} from "./whatsapp-notification.reminder-sync.js";
import { whatsAppNotificationQueueJobId } from "./whatsapp-notification.policy.js";
import type { WhatsAppNotificationQueueJob } from "./whatsapp-notification.types.js";

const whatsAppService = new WhatsAppService();

let queue: Queue | null = null;
let queueConnection: Redis | null = null;
let worker: Worker | null = null;
let workerConnection: Redis | null = null;

function openRedis(): Redis {
  const connection = new Redis(env.REDIS_URL, {
    maxRetriesPerRequest: null,
    enableReadyCheck: false,
  });
  connection.on("error", (error: Error) => {
    console.error(`[WhatsAppNotification] redis_error ${error.message}`);
  });
  return connection;
}

function getQueue(): Queue | null {
  if (!env.REDIS_URL.trim()) {
    return null;
  }
  if (!queue) {
    queueConnection = openRedis();
    queue = new Queue(WHATSAPP_NOTIFICATION_QUEUE_NAME, {
      connection: queueConnection,
    });
  }
  return queue;
}

function markProfileReminderFailedOnDeliveryError(
  job: WhatsAppNotificationQueueJob,
  lastError: string,
): void {
  syncReminderFromQueueJob(job, "failed", lastError);
}

function isRetryableDeliveryError(error: unknown): boolean {
  return (
    error instanceof WhatsAppTemplateDeliveryError &&
    error.failureClass === "retryable"
  );
}

function isAmbiguousDeliveryError(error: unknown): boolean {
  return (
    error instanceof WhatsAppTemplateDeliveryError &&
    error.failureClass === "ambiguous"
  );
}

function logEmployerApprovalDeliveryFailure(
  job: WhatsAppNotificationQueueJob,
): void {
  if (job.event !== "EMPLOYER_ACCOUNT_APPROVED") {
    return;
  }
  console.error("[WhatsAppNotification] Employer approval notification failed", {
    employerId: job.entityId,
    template: "aslijobs_account_approved",
  });
}

function logEmployerRejectionDeliveryFailure(
  job: WhatsAppNotificationQueueJob,
): void {
  if (job.event !== "EMPLOYER_ACCOUNT_REJECTED") {
    return;
  }
  console.error("[WhatsAppNotification] Employer rejection notification failed", {
    employerId: job.entityId,
    template: "employer_account_rejected",
  });
}

function logInterviewScheduledOnlineDelivery(
  job: WhatsAppNotificationQueueJob,
  outcome: "accepted" | "failed",
): void {
  if (job.event !== "INTERVIEW_SCHEDULED_ONLINE") {
    return;
  }
  const details = {
    applicationId: job.entityId,
    template: job.templateName,
    language: job.languageCode,
    outcome,
  };
  if (outcome === "accepted") {
    console.info(
      "[WhatsAppNotification] interview_scheduled_online accepted",
      details,
    );
    return;
  }
  console.error(
    "[WhatsAppNotification] interview_scheduled_online delivery failed",
    details,
  );
}

function logInterviewScheduledOfflineDelivery(
  job: WhatsAppNotificationQueueJob,
  outcome: "accepted" | "failed",
): void {
  if (job.event !== "INTERVIEW_SCHEDULED_OFFLINE") {
    return;
  }
  const details = {
    applicationId: job.entityId,
    template: job.templateName,
    language: job.languageCode,
    outcome,
  };
  if (outcome === "accepted") {
    console.info(
      "[WhatsAppNotification] interview_scheduled_offline accepted",
      details,
    );
    return;
  }
  console.error(
    "[WhatsAppNotification] interview_scheduled_offline delivery failed",
    details,
  );
}

function logInterviewCancelledDelivery(
  job: WhatsAppNotificationQueueJob,
  outcome: "accepted" | "failed",
): void {
  if (job.event !== "INTERVIEW_CANCELLED") {
    return;
  }
  const details = {
    applicationId: job.entityId,
    template: job.templateName,
    language: job.languageCode,
    outcome,
  };
  if (outcome === "accepted") {
    console.info("[WhatsAppNotification] interview_cancelled accepted", details);
    return;
  }
  console.error(
    "[WhatsAppNotification] interview_cancelled delivery failed",
    details,
  );
}

function logInterviewRescheduledDelivery(
  job: WhatsAppNotificationQueueJob,
  outcome: "accepted" | "failed",
): void {
  if (job.event !== "INTERVIEW_RESCHEDULED") {
    return;
  }
  const details = {
    applicationId: job.entityId,
    template: job.templateName,
    language: job.languageCode,
    outcome,
  };
  if (outcome === "accepted") {
    console.info(
      "[WhatsAppNotification] interview_rescheduled accepted",
      details,
    );
    return;
  }
  console.error(
    "[WhatsAppNotification] interview_rescheduled delivery failed",
    details,
  );
}

function logJobApplicationSubmittedDelivery(
  job: WhatsAppNotificationQueueJob,
  outcome: "accepted" | "failed",
): void {
  if (job.event !== "JOB_APPLICATION_SUBMITTED") {
    return;
  }
  const details = {
    applicationId: job.entityId,
    template: job.templateName,
    language: job.languageCode,
    outcome,
  };
  if (outcome === "accepted") {
    console.info(
      "[WhatsAppNotification] job_application_submitted accepted",
      details,
    );
    return;
  }
  console.error(
    "[WhatsAppNotification] job_application_submitted delivery failed",
    details,
  );
}

function logJobseekerAccountCreatedDelivery(
  job: WhatsAppNotificationQueueJob,
  outcome: "accepted" | "failed",
): void {
  if (job.event !== "JOBSEEKER_ACCOUNT_CREATED") {
    return;
  }
  const details = {
    jobSeekerId: job.entityId,
    template: job.templateName,
    language: job.languageCode,
    correlationId: job.correlationId || "-",
    outcome,
  };
  if (outcome === "accepted") {
    console.info(
      "[WhatsAppNotification] jobseeker_account_created accepted",
      details,
    );
    return;
  }
  console.error(
    "[WhatsAppNotification] jobseeker_account_created delivery failed",
    details,
  );
}

function logJobPostRejectedDelivery(
  job: WhatsAppNotificationQueueJob,
  outcome: "accepted" | "failed",
): void {
  if (job.event !== "JOB_POST_REJECTED") {
    return;
  }
  const details = {
    jobMongoId: job.entityId,
    template: job.templateName,
    language: job.languageCode,
    outcome,
  };
  if (outcome === "accepted") {
    console.info("[WhatsAppNotification] job_post_rejected_v1 accepted", details);
    return;
  }
  console.error("[WhatsAppNotification] job_post_rejected_v1 delivery failed", details);
}

function logJobPostIncompleteDelivery(
  job: WhatsAppNotificationQueueJob,
  outcome: "accepted" | "failed",
): void {
  if (job.event !== "JOB_POST_INCOMPLETE") {
    return;
  }
  const details = {
    jobMongoId: job.entityId,
    template: job.templateName,
    language: job.languageCode,
  };
  if (outcome === "accepted") {
    console.info("[JobPostIncompleteReminder] accepted by Meta", details);
    return;
  }
  console.error("[JobPostIncompleteReminder] delivery failed", details);
}

function isDuplicateJobError(error: unknown): boolean {
  const message = error instanceof Error ? error.message : "";
  return /already exists|duplicate|jobid/i.test(message);
}

export async function deliverWhatsAppNotificationJob(
  job: WhatsAppNotificationQueueJob,
  context: { mode: "inline" | "queue"; attempt: number } = {
    mode: "queue",
    attempt: 1,
  },
): Promise<void> {
  if (await wasWhatsAppNotificationDispatchHandedOff(job.idempotencyKey)) {
    console.info("[WhatsAppNotification] already accepted, skipping retry", {
      event: job.event,
      entityId: job.entityId,
      template: job.templateName,
      correlationId: job.correlationId || "-",
      mode: context.mode,
      attempt: context.attempt,
    });
    return;
  }

  if (await shouldAbortJobSeekerProfileCompletionDelivery(job)) {
    console.info("[JobSeekerProfileReminder] skipped cancelled reminder", {
      jobSeekerId: job.entityId,
      template: job.templateName,
      language: job.languageCode,
      reason: "reminder_invalidated",
    });
    return;
  }

  await markWhatsAppNotificationDispatchProcessing({
    idempotencyKey: job.idempotencyKey,
    attempt: context.attempt,
  });

  let result: { messageId: string; messageStatus: string };
  try {
    result = await whatsAppService.sendTemplateMessage(
      job.phoneNumber,
      job.templateName,
      job.languageCode,
      job.bodyParameters,
      job.urlButtonParameters ?? [],
      { correlationId: job.correlationId },
    );
  } catch (error) {
    const safeMessage =
      error instanceof WhatsAppTemplateDeliveryError
        ? [error.message, error.detail].filter(Boolean).join(" ").slice(0, 300)
        : error instanceof Error
          ? error.message
          : "delivery_failed";
    if (isAmbiguousDeliveryError(error)) {
      await markWhatsAppNotificationDispatchAmbiguous({
        idempotencyKey: job.idempotencyKey,
        lastError: safeMessage,
      });
      console.error("[WhatsAppNotification] ambiguous Meta response", {
        event: job.event,
        template: job.templateName,
        language: job.languageCode,
        correlationId: job.correlationId || "-",
        mode: context.mode,
        attempt: context.attempt,
        failureClass: "ambiguous",
      });
      return;
    }
    if (!isRetryableDeliveryError(error) && error instanceof WhatsAppTemplateDeliveryError) {
      await markWhatsAppNotificationDispatchFailed({
        idempotencyKey: job.idempotencyKey,
        lastError: safeMessage,
        failureClass: "permanent",
        metaCode:
          error.metaCode === null ? "" : String(error.metaCode),
      });
      syncReminderFromQueueJob(job, "failed", safeMessage);
      console.error("[WhatsAppNotification] permanent template failure", {
        event: job.event,
        template: job.templateName,
        language: job.languageCode,
        correlationId: job.correlationId || "-",
        mode: context.mode,
        attempt: context.attempt,
        status: error.status,
        metaCode: error.metaCode,
      });
      return;
    }
    throw error;
  }

  await markWhatsAppNotificationDispatchAccepted({
    idempotencyKey: job.idempotencyKey,
    messageId: result.messageId,
  });
  if (result.messageId) {
    const { recordOutboundMessage } = await import("../inbox/whatsapp-inbox-store.js");
    const { notificationInboxText } = await import("../inbox/whatsapp-template-text.js");
    await recordOutboundMessage({
      phoneNational: job.phoneNumber,
      body: await notificationInboxText({
        templateName: job.templateName,
        language: job.languageCode,
        bodyParameters: job.bodyParameters,
      }),
      senderType: "notification",
      providerMessageId: result.messageId,
      status: "accepted",
    }).catch((error: unknown) => {
      console.error(
        `[WhatsAppNotification] inbox mirror failed reason=${
          error instanceof Error ? error.name : "unknown"
        }`,
      );
    });
  }
  syncReminderFromQueueJob(job, "accepted");

  console.info("[WhatsAppNotification] accepted by Meta", {
    event: job.event,
    templateName: job.templateName,
    language: job.languageCode,
    correlationId: job.correlationId || "-",
    recipient: maskWhatsAppRecipient(job.phoneNumber),
    messageId: result.messageId || "-",
    messageStatus: result.messageStatus || "-",
    mode: context.mode,
    attempt: context.attempt,
    timestamp: new Date().toISOString(),
  });
  logJobPostIncompleteDelivery(job, "accepted");
  logJobPostRejectedDelivery(job, "accepted");
  logJobseekerAccountCreatedDelivery(job, "accepted");
  logJobApplicationSubmittedDelivery(job, "accepted");
  logInterviewScheduledOnlineDelivery(job, "accepted");
  logInterviewScheduledOfflineDelivery(job, "accepted");
  logInterviewCancelledDelivery(job, "accepted");
  logInterviewRescheduledDelivery(job, "accepted");
}

function waitForRetry(attempt: number): Promise<void> {
  if (env.NODE_ENV === "test") {
    return Promise.resolve();
  }
  const delayMs = WHATSAPP_NOTIFICATION_BACKOFF_MS * 2 ** (attempt - 1);
  return new Promise((resolve) => {
    setTimeout(resolve, delayMs);
  });
}

/**
 * Inline mode runs in the API process. It retries only retryable errors,
 * up to the same attempt limit as BullMQ, and loses the job if the process exits.
 */
async function deliverInlineWithBoundedRetries(
  job: WhatsAppNotificationQueueJob,
): Promise<void> {
  for (let attempt = 1; attempt <= WHATSAPP_NOTIFICATION_MAX_ATTEMPTS; attempt += 1) {
    try {
      await deliverWhatsAppNotificationJob(job, { mode: "inline", attempt });
      return;
    } catch (error) {
      const lastError = error instanceof Error ? error.message : "delivery_failed";
      const canRetry =
        attempt < WHATSAPP_NOTIFICATION_MAX_ATTEMPTS &&
        (isRetryableDeliveryError(error) ||
          !(error instanceof WhatsAppTemplateDeliveryError));
      console.error("[WhatsAppNotification] inline delivery failed", {
        event: job.event,
        entityId: job.entityId,
        template: job.templateName,
        language: job.languageCode,
        correlationId: job.correlationId || "-",
        mode: "inline",
        attempt,
        errorCategory: error instanceof Error ? error.name : "unknown",
      });
      if (!canRetry) {
        await markWhatsAppNotificationDispatchFailed({
          idempotencyKey: job.idempotencyKey,
          lastError,
          failureClass: "retryable",
        });
        markProfileReminderFailedOnDeliveryError(job, lastError);
        logEmployerApprovalDeliveryFailure(job);
        logEmployerRejectionDeliveryFailure(job);
        logJobPostIncompleteDelivery(job, "failed");
        logJobPostRejectedDelivery(job, "failed");
        logJobseekerAccountCreatedDelivery(job, "failed");
        logJobApplicationSubmittedDelivery(job, "failed");
        logInterviewScheduledOnlineDelivery(job, "failed");
        logInterviewScheduledOfflineDelivery(job, "failed");
        logInterviewCancelledDelivery(job, "failed");
        logInterviewRescheduledDelivery(job, "failed");
        return;
      }
      await waitForRetry(attempt);
    }
  }
}

/**
 * Sends in the current process. Used by the profile-completion reminder so
 * due Mongo work does not depend on a second Redis worker to reach Meta.
 */
export async function enqueueWhatsAppNotificationJobImmediate(
  job: WhatsAppNotificationQueueJob,
): Promise<void> {
  console.info("[WhatsAppNotification] inline delivery started", {
    event: job.event,
    entityId: job.entityId,
    template: job.templateName,
    language: job.languageCode,
    correlationId: job.correlationId || "-",
    mode: "inline",
  });
  await deliverInlineWithBoundedRetries(job);
}

export async function enqueueWhatsAppNotificationJob(
  job: WhatsAppNotificationQueueJob,
): Promise<void> {
  const activeQueue = getQueue();
  if (!activeQueue) {
    console.info("[WhatsAppNotification] inline delivery started", {
      event: job.event,
      entityId: job.entityId,
      template: job.templateName,
      language: job.languageCode,
      correlationId: job.correlationId || "-",
      mode: "inline",
    });
    void deliverInlineWithBoundedRetries(job);
    return;
  }

  try {
    console.info("[WhatsAppNotification] queue job created", {
      event: job.event,
      entityId: job.entityId,
      template: job.templateName,
      language: job.languageCode,
      correlationId: job.correlationId || "-",
    });
    await activeQueue.add(WHATSAPP_NOTIFICATION_JOB_NAME, job, {
      jobId: whatsAppNotificationQueueJobId(
        job.event,
        job.entityId,
        job.idempotencyScope,
      ),
      attempts: WHATSAPP_NOTIFICATION_MAX_ATTEMPTS,
      backoff: {
        type: "exponential",
        delay: WHATSAPP_NOTIFICATION_BACKOFF_MS,
      },
      removeOnComplete: true,
      removeOnFail: 50,
    });
  } catch (error) {
    if (isDuplicateJobError(error)) {
      console.info("[WhatsAppNotification] duplicate queue job skipped");
      return;
    }
    console.error(
      `[WhatsAppNotification] queue_unavailable reason=${
        error instanceof Error ? error.name : "unknown"
      }`,
    );
    void deliverInlineWithBoundedRetries(job);
  }
}

export function startWhatsAppNotificationRuntime(): () => Promise<void> {
  if (env.NODE_ENV === "test") {
    return async () => undefined;
  }
  if (!env.REDIS_URL.trim()) {
    console.info(
      "[WhatsAppNotification] REDIS_URL is empty. Notifications send inline in the API process. Inline retries are bounded and are lost if the process exits.",
    );
    return async () => undefined;
  }
  if (worker) {
    return async () => undefined;
  }

  console.info(
    "[WhatsAppNotification] worker started queue=whatsapp-notifications",
  );
  workerConnection = openRedis();
  worker = new Worker(
    WHATSAPP_NOTIFICATION_QUEUE_NAME,
    async (bullJob) => {
      await deliverWhatsAppNotificationJob(
        bullJob.data as WhatsAppNotificationQueueJob,
        {
          mode: "queue",
          attempt: (bullJob.attemptsMade ?? 0) + 1,
        },
      );
    },
    {
      connection: workerConnection,
      concurrency: WHATSAPP_NOTIFICATION_WORKER_CONCURRENCY,
    },
  );
  worker.on("failed", (bullJob, error) => {
    const data = bullJob?.data as WhatsAppNotificationQueueJob | undefined;
    const attempts = bullJob?.opts.attempts ?? WHATSAPP_NOTIFICATION_MAX_ATTEMPTS;
    const attemptsMade = bullJob?.attemptsMade ?? 0;
    console.error(
      `[WhatsAppNotification] worker_failed jobId=${bullJob?.id ?? "-"} attempt=${attemptsMade}/${attempts} reason=${error.name}`,
    );
    if (data?.idempotencyKey && attemptsMade >= attempts) {
      void markWhatsAppNotificationDispatchFailed({
        idempotencyKey: data.idempotencyKey,
        lastError: error.message || error.name,
        failureClass: isRetryableDeliveryError(error) ? "retryable" : "permanent",
      });
      if (data) {
        markProfileReminderFailedOnDeliveryError(
          data,
          error.message || error.name,
        );
        logEmployerApprovalDeliveryFailure(data);
        logEmployerRejectionDeliveryFailure(data);
        logJobPostIncompleteDelivery(data, "failed");
        logJobPostRejectedDelivery(data, "failed");
        logJobseekerAccountCreatedDelivery(data, "failed");
        logJobApplicationSubmittedDelivery(data, "failed");
        logInterviewScheduledOnlineDelivery(data, "failed");
        logInterviewScheduledOfflineDelivery(data, "failed");
        logInterviewCancelledDelivery(data, "failed");
        logInterviewRescheduledDelivery(data, "failed");
      }
    }
  });

  return stopWhatsAppNotificationRuntime;
}

export async function stopWhatsAppNotificationRuntime(): Promise<void> {
  if (worker) {
    await worker.close();
    worker = null;
  }
  if (workerConnection) {
    try {
      await workerConnection.quit();
    } catch {
      workerConnection.disconnect();
    }
    workerConnection = null;
  }
  if (queue) {
    await queue.close();
    queue = null;
  }
  if (queueConnection) {
    try {
      await queueConnection.quit();
    } catch {
      queueConnection.disconnect();
    }
    queueConnection = null;
  }
}
