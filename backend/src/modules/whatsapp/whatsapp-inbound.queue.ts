import { Queue, Worker } from "bullmq";
import type { Redis } from "ioredis";
import { env } from "../../config/env.js";
import { handleConversationalMessage } from "./whatsapp-bot.service.js";
import {
  isBullMqDuplicateJobError,
  openWhatsAppProducerRedis,
  openWhatsAppWorkerRedis,
  withQueueEnqueueTimeout,
} from "./whatsapp-redis.js";

const QUEUE_NAME = "whatsapp-inbound";

export type WhatsAppInboundJob = {
  from: string;
  text?: string;
  languageHint?: string;
  messageId?: string;
  messageType?: string;
  mediaId?: string;
  mimeType?: string;
  fileName?: string;
};

let queue: Queue | null = null;
let queueConnection: Redis | null = null;
let worker: Worker | null = null;
let workerConnection: Redis | null = null;

function getQueue(): Queue | null {
  if (!env.REDIS_URL.trim()) {
    return null;
  }
  if (!queue) {
    queueConnection = openWhatsAppProducerRedis(env.REDIS_URL);
    queue = new Queue(QUEUE_NAME, { connection: queueConnection });
  }
  return queue;
}

/**
 * Redis queues the turn and returns immediately.
 * Without Redis (or when enqueue times out) the message is handled in-process.
 */
export async function enqueueWhatsAppInbound(job: WhatsAppInboundJob): Promise<void> {
  const activeQueue = getQueue();
  if (!activeQueue) {
    await handleConversationalMessage(job);
    return;
  }
  try {
    await withQueueEnqueueTimeout(
      activeQueue.add("message", job, {
        jobId: job.messageId || undefined,
        attempts: 2,
        backoff: { type: "exponential", delay: 2_000 },
        removeOnComplete: true,
        removeOnFail: 100,
      }),
    );
  } catch (error) {
    if (isBullMqDuplicateJobError(error)) {
      console.info("[WhatsApp] duplicate queue job skipped");
      return;
    }
    // Timeout does not cancel add() — avoid double-processing if the job landed late.
    if (
      error instanceof Error &&
      error.message === "WhatsAppQueueEnqueueTimeout" &&
      job.messageId
    ) {
      try {
        const existing = await activeQueue.getJob(job.messageId);
        if (existing) {
          console.info(
            `[WhatsApp] enqueue_timeout_but_job_present messageId=${job.messageId}`,
          );
          return;
        }
      } catch {
        // Fall through to inline handling.
      }
    }
    console.error(
      `[WhatsApp] queue_unavailable reason=${error instanceof Error ? error.name : "unknown"}`,
    );
    await handleConversationalMessage(job);
  }
}

export function startWhatsAppInboundRuntime(): () => Promise<void> {
  if (env.NODE_ENV === "test" || !env.REDIS_URL.trim() || worker) {
    return async () => undefined;
  }
  workerConnection = openWhatsAppWorkerRedis(env.REDIS_URL);
  worker = new Worker(
    QUEUE_NAME,
    async (bullJob) => {
      const data = bullJob.data as WhatsAppInboundJob;
      await handleConversationalMessage(data);
    },
    { connection: workerConnection, concurrency: env.WHATSAPP_INBOUND_CONCURRENCY },
  );
  worker.on("failed", (bullJob, error) => {
    console.error(
      `[WhatsApp] worker_failed messageId=${bullJob?.id ?? "-"} reason=${error.name}`,
    );
  });
  return stopWhatsAppInboundRuntime;
}

export async function stopWhatsAppInboundRuntime(): Promise<void> {
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
