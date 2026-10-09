import { Queue, Worker } from "bullmq";
import { Redis } from "ioredis";
import { env } from "../../../config/env.js";
import {
  getJobPostIncompleteReminderDelayMs,
  processDueJobPostIncompleteReminders,
  processJobPostIncompleteReminder,
} from "./job-post-incomplete-reminder.service.js";

const QUEUE_NAME = "job-post-incomplete-reminders";
const JOB_NAME = "check-and-send";
const MAX_POLL_INTERVAL_MS = 15_000;
const MIN_POLL_INTERVAL_MS = 5_000;

let queue: Queue | null = null;
let queueConnection: Redis | null = null;
let worker: Worker | null = null;
let workerConnection: Redis | null = null;
let sweepTimer: ReturnType<typeof setInterval> | null = null;
let sweepRunning = false;
const localTimers = new Map<string, ReturnType<typeof setTimeout>>();

function reminderPollIntervalMs(): number {
  const delayMs = getJobPostIncompleteReminderDelayMs();
  return Math.min(
    MAX_POLL_INTERVAL_MS,
    Math.max(MIN_POLL_INTERVAL_MS, Math.floor(delayMs / 4)),
  );
}

function openRedis(): Redis {
  const connection = new Redis(env.REDIS_URL, {
    maxRetriesPerRequest: null,
    enableReadyCheck: false,
  });
  connection.on("error", (error: Error) => {
    console.error(`[JobPostIncompleteReminder] redis_error ${error.message}`);
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

export function jobPostIncompleteReminderJobId(
  jobMongoId: string,
  generation: number,
): string {
  return `job-post-incomplete-${jobMongoId.trim()}-g${generation}`;
}

function isDuplicateJobError(error: unknown): boolean {
  const message = error instanceof Error ? error.message : "";
  return /already exists|duplicate|jobid/i.test(message);
}

async function removeQueuedReminder(
  jobMongoId: string,
  generation: number,
): Promise<void> {
  const activeQueue = getQueue();
  if (!activeQueue) {
    return;
  }
  try {
    const existing = await activeQueue.getJob(
      jobPostIncompleteReminderJobId(jobMongoId, generation),
    );
    await existing?.remove();
  } catch (error) {
    console.info("[JobPostIncompleteReminder] previous queue job not removed", {
      jobMongoId,
      generation,
      errorCategory: error instanceof Error ? error.name : "unknown",
    });
  }
}

/**
 * Durable scheduling is the Mongo reminder row plus the sweep.
 * Redis delivers it on time when configured. Without Redis, the sweep
 * still sends after dueAt; the local timer only speeds up the current process.
 */
export async function enqueueJobPostIncompleteReminderJob(input: {
  jobMongoId: string;
  generation: number;
  previousGeneration: number | null;
}): Promise<void> {
  const jobMongoId = input.jobMongoId.trim();
  const delayMs = getJobPostIncompleteReminderDelayMs();
  if (input.previousGeneration && input.previousGeneration > 0) {
    await removeQueuedReminder(jobMongoId, input.previousGeneration);
  }

  const activeQueue = getQueue();
  if (!activeQueue) {
    console.info("[JobPostIncompleteReminder] redis unavailable; Mongo sweep will deliver", {
      jobMongoId,
      generation: input.generation,
      delayMs,
    });
    if (env.NODE_ENV !== "test") {
      const previous = localTimers.get(jobMongoId);
      if (previous) {
        clearTimeout(previous);
      }
      const timer = setTimeout(() => {
        localTimers.delete(jobMongoId);
        void processJobPostIncompleteReminder(jobMongoId, input.generation);
      }, delayMs);
      timer.unref?.();
      localTimers.set(jobMongoId, timer);
    }
    return;
  }

  try {
    await activeQueue.add(
      JOB_NAME,
      { jobMongoId, generation: input.generation },
      {
        jobId: jobPostIncompleteReminderJobId(jobMongoId, input.generation),
        delay: delayMs,
        attempts: 3,
        backoff: { type: "exponential", delay: 2_000 },
        removeOnComplete: true,
        removeOnFail: 50,
      },
    );
  } catch (error) {
    if (isDuplicateJobError(error)) {
      console.info("[JobPostIncompleteReminder] duplicate queue job skipped", {
        jobMongoId,
        generation: input.generation,
      });
      return;
    }
    console.error("[JobPostIncompleteReminder] queue unavailable", {
      jobMongoId,
      generation: input.generation,
      errorCategory: error instanceof Error ? error.name : "unknown",
    });
  }
}

async function safeSweepTick(): Promise<void> {
  if (sweepRunning) {
    return;
  }
  sweepRunning = true;
  try {
    await processDueJobPostIncompleteReminders();
  } catch (error) {
    console.error("[JobPostIncompleteReminder] sweep failed", {
      errorCategory: error instanceof Error ? error.name : "unknown",
    });
  } finally {
    sweepRunning = false;
  }
}

export function startJobPostIncompleteReminderRuntime(): () => Promise<void> {
  if (env.NODE_ENV === "test") {
    return async () => undefined;
  }

  console.info("[JobPostIncompleteReminder] runtime started", {
    delayMinutes: env.JOB_POST_INCOMPLETE_REMINDER_DELAY_MINUTES,
    delayMs: getJobPostIncompleteReminderDelayMs(),
    redisConfigured: Boolean(env.REDIS_URL.trim()),
    nodeEnv: env.NODE_ENV,
  });

  if (env.REDIS_URL.trim() && !worker) {
    workerConnection = openRedis();
    worker = new Worker(
      QUEUE_NAME,
      async (bullJob) => {
        const data = bullJob.data as { jobMongoId?: string; generation?: number };
        const jobMongoId = data.jobMongoId?.trim() ?? "";
        const generation = data.generation ?? 0;
        if (!jobMongoId || generation < 1) {
          return;
        }
        const result = await processJobPostIncompleteReminder(jobMongoId, generation);
        if (result === "failed") {
          throw new Error("job_post_incomplete_reminder_failed");
        }
      },
      { connection: workerConnection, concurrency: 2 },
    );
    worker.on("failed", (bullJob, error) => {
      console.error("[JobPostIncompleteReminder] worker_failed", {
        jobId: bullJob?.id ?? "-",
        reason: error.name,
      });
    });
  }

  if (sweepTimer) {
    clearInterval(sweepTimer);
  }
  sweepTimer = setInterval(() => {
    void safeSweepTick();
  }, reminderPollIntervalMs());
  sweepTimer.unref?.();
  return stopJobPostIncompleteReminderRuntime;
}

export async function stopJobPostIncompleteReminderRuntime(): Promise<void> {
  if (sweepTimer) {
    clearInterval(sweepTimer);
    sweepTimer = null;
  }
  for (const timer of localTimers.values()) {
    clearTimeout(timer);
  }
  localTimers.clear();
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
