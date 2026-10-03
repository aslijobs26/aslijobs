import { Queue, Worker } from "bullmq";
import { Redis } from "ioredis";
import { env } from "../../config/env.js";
import { handleConversationalMessage } from "./whatsapp-bot.service.js";

const QUEUE_NAME = "whatsapp-inbound";

export type WhatsAppInboundJob = {
  from: string;
  text: string;
  languageHint?: string;
  messageId?: string;
  messageType?: string;
};

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
    console.error(`[WhatsApp] redis_error ${error.message}`);
  });
  return connection;
}

function getQueue(): Queue | null {
  if (!env.REDIS_URL.trim()) {
    return null;
  }
  if (!queue) {
    queueConnection = openRedis();
    queue = new Queue(QUEUE_NAME, { connection: queueConnection });
  }
  return queue;
}

function isDuplicateJobError(error: unknown): boolean {
  const message = error instanceof Error ? error.message : "";
  return /already exists|duplicate|jobid/i.test(message);
}

/**
 * Redis queues the turn and returns immediately.
 * Without Redis the message is handled in this process, still after the webhook ACK.
 */
export async function enqueueWhatsAppInbound(job: WhatsAppInboundJob): Promise<void> {
  const activeQueue = getQueue();
  if (!activeQueue) {
    await handleConversationalMessage(job);
    return;
  }
  try {
    await activeQueue.add("message", job, {
      jobId: job.messageId || undefined,
      attempts: 2,
      backoff: { type: "exponential", delay: 2_000 },
      removeOnComplete: true,
      removeOnFail: 100,
    });
  } catch (error) {
    if (isDuplicateJobError(error)) {
      console.info("[WhatsApp] duplicate queue job skipped");
      return;
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
  workerConnection = openRedis();
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
