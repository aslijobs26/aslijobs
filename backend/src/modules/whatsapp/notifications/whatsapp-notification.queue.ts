import { Queue, Worker } from "bullmq";
import { Redis } from "ioredis";
import { env } from "../../../config/env.js";
import { maskWhatsAppRecipient, WhatsAppService } from "../whatsapp.service.js";
import {
  WHATSAPP_NOTIFICATION_BACKOFF_MS,
  WHATSAPP_NOTIFICATION_JOB_NAME,
  WHATSAPP_NOTIFICATION_MAX_ATTEMPTS,
  WHATSAPP_NOTIFICATION_QUEUE_NAME,
  WHATSAPP_NOTIFICATION_WORKER_CONCURRENCY,
} from "./whatsapp-notification.constants.js";
import { markEmployerProfileCompletionReminderStatus } from "./employer-profile-completion-reminder.model.js";
import {
  markWhatsAppNotificationDispatchFailed,
  markWhatsAppNotificationDispatchSent,
  wasWhatsAppNotificationDispatchSent,
} from "./whatsapp-notification.model.js";
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
  if (job.event !== "EMPLOYER_PROFILE_COMPLETION_REQUIRED") {
    return;
  }
  void markEmployerProfileCompletionReminderStatus({
    employerId: job.entityId,
    status: "failed",
    lastError,
  });
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
): Promise<void> {
  if (await wasWhatsAppNotificationDispatchSent(job.idempotencyKey)) {
    console.info("[WhatsAppNotification] already sent, skipping retry", {
      event: job.event,
      entityId: job.entityId,
    });
    return;
  }

  const result = await whatsAppService.sendTemplateMessage(
    job.phoneNumber,
    job.templateName,
    job.languageCode,
    job.bodyParameters,
    job.urlButtonParameters ?? [],
  );

  await markWhatsAppNotificationDispatchSent({
    idempotencyKey: job.idempotencyKey,
    messageId: result.messageId,
  });

  console.info("[WhatsAppNotification] delivered", {
    event: job.event,
    templateName: job.templateName,
    language: job.languageCode,
    recipient: maskWhatsAppRecipient(job.phoneNumber),
    messageId: result.messageId || "-",
    timestamp: new Date().toISOString(),
  });
  logJobPostIncompleteDelivery(job, "accepted");
}

export async function enqueueWhatsAppNotificationJob(
  job: WhatsAppNotificationQueueJob,
): Promise<void> {
  const activeQueue = getQueue();
  if (!activeQueue) {
    void deliverWhatsAppNotificationJob(job).catch((error) => {
      console.error("[WhatsAppNotification] inline delivery failed", {
        event: job.event,
        entityId: job.entityId,
        errorCategory: error instanceof Error ? error.name : "unknown",
      });
      void markWhatsAppNotificationDispatchFailed({
        idempotencyKey: job.idempotencyKey,
        lastError: error instanceof Error ? error.message : "delivery_failed",
      });
      markProfileReminderFailedOnDeliveryError(
        job,
        error instanceof Error ? error.message : "delivery_failed",
      );
      logEmployerApprovalDeliveryFailure(job);
      logEmployerRejectionDeliveryFailure(job);
      logJobPostIncompleteDelivery(job, "failed");
    });
    return;
  }

  try {
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
    void deliverWhatsAppNotificationJob(job).catch((inlineError) => {
      console.error("[WhatsAppNotification] inline delivery failed", {
        event: job.event,
        entityId: job.entityId,
        errorCategory:
          inlineError instanceof Error ? inlineError.name : "unknown",
      });
      markProfileReminderFailedOnDeliveryError(
        job,
        inlineError instanceof Error ? inlineError.message : "delivery_failed",
      );
      logEmployerApprovalDeliveryFailure(job);
      logEmployerRejectionDeliveryFailure(job);
      logJobPostIncompleteDelivery(job, "failed");
    });
  }
}

export function startWhatsAppNotificationRuntime(): () => Promise<void> {
  if (env.NODE_ENV === "test" || !env.REDIS_URL.trim() || worker) {
    return async () => undefined;
  }

  workerConnection = openRedis();
  worker = new Worker(
    WHATSAPP_NOTIFICATION_QUEUE_NAME,
    async (bullJob) => {
      await deliverWhatsAppNotificationJob(
        bullJob.data as WhatsAppNotificationQueueJob,
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
      });
      if (data) {
        markProfileReminderFailedOnDeliveryError(
          data,
          error.message || error.name,
        );
        logEmployerApprovalDeliveryFailure(data);
        logEmployerRejectionDeliveryFailure(data);
        logJobPostIncompleteDelivery(data, "failed");
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
