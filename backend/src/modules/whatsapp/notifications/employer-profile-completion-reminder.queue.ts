import { Queue, Worker } from "bullmq";
import { Redis } from "ioredis";
import { env } from "../../../config/env.js";
import {
  enqueueEmployerProfileCompletionReminder,
  getEmployerProfileCompletionReminderDelayMs,
  processDueEmployerProfileCompletionReminders,
  processEmployerProfileCompletionReminder,
} from "./employer-profile-completion-reminder.service.js";

const QUEUE_NAME = "employer-profile-completion-reminders";
const JOB_NAME = "check-and-send";
const MAX_POLL_INTERVAL_MS = 15_000;
const MIN_POLL_INTERVAL_MS = 5_000;

let queue: Queue | null = null;
let queueConnection: Redis | null = null;
let worker: Worker | null = null;
let workerConnection: Redis | null = null;
let sweepTimer: ReturnType<typeof setInterval> | null = null;
let sweepRunning = false;

function reminderPollIntervalMs(): number {
  const delayMs = getEmployerProfileCompletionReminderDelayMs();
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
    console.error(`[EmployerProfileReminder] redis_error ${error.message}`);
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

export function employerProfileCompletionReminderJobId(
  employerId: string,
): string {
  return `employer-profile-reminder-${employerId.trim()}`;
}

export function armEmployerProfileCompletionReminder(employerId: string): void {
  void (async () => {
    const result = await enqueueEmployerProfileCompletionReminder(employerId);
    if (result === "already_scheduled") {
      return;
    }
    await enqueueEmployerProfileCompletionReminderJob(employerId);
    if (!env.REDIS_URL.trim() && env.NODE_ENV !== "test") {
      const timer = setTimeout(() => {
        void processEmployerProfileCompletionReminder(employerId);
      }, getEmployerProfileCompletionReminderDelayMs());
      timer.unref?.();
    }
  })().catch((error) => {
    console.error("[EmployerProfileReminder] arm rejected", {
      employerId,
      errorCategory: error instanceof Error ? error.name : "unknown",
    });
  });
}

export async function enqueueEmployerProfileCompletionReminderJob(
  employerId: string,
): Promise<void> {
  const activeQueue = getQueue();
  if (!activeQueue) {
    return;
  }

  try {
    await activeQueue.add(
      JOB_NAME,
      { employerId: employerId.trim() },
      {
        jobId: employerProfileCompletionReminderJobId(employerId),
        delay: getEmployerProfileCompletionReminderDelayMs(),
        attempts: 3,
        backoff: {
          type: "exponential",
          delay: 2_000,
        },
        removeOnComplete: true,
        removeOnFail: 50,
      },
    );
  } catch (error) {
    if (isDuplicateJobError(error)) {
      console.info("[EmployerProfileReminder] duplicate queue job skipped");
      return;
    }
    console.error(
      `[EmployerProfileReminder] queue_unavailable reason=${
        error instanceof Error ? error.name : "unknown"
      }`,
    );
  }
}

async function safeSweepTick(): Promise<void> {
  if (sweepRunning) {
    return;
  }
  sweepRunning = true;
  try {
    await processDueEmployerProfileCompletionReminders();
  } catch (error) {
    console.error("[EmployerProfileReminder] sweep failed", {
      errorCategory: error instanceof Error ? error.name : "unknown",
    });
  } finally {
    sweepRunning = false;
  }
}

export function startEmployerProfileCompletionReminderRuntime(): () => Promise<void> {
  if (env.NODE_ENV === "test") {
    return async () => undefined;
  }

  console.info("[EmployerProfileReminder] runtime started", {
    delayMinutes: env.EMPLOYER_PROFILE_COMPLETION_REMINDER_DELAY_MINUTES,
    delayMs: getEmployerProfileCompletionReminderDelayMs(),
    redisConfigured: Boolean(env.REDIS_URL.trim()),
    nodeEnv: env.NODE_ENV,
  });

  if (env.REDIS_URL.trim() && !worker) {
    workerConnection = openRedis();
    worker = new Worker(
      QUEUE_NAME,
      async (bullJob) => {
        const data = bullJob.data as { employerId?: string };
        const employerId = data.employerId?.trim() ?? "";
        if (!employerId) {
          return;
        }
        const result =
          await processEmployerProfileCompletionReminder(employerId);
        if (result === "failed") {
          throw new Error("employer_profile_completion_reminder_failed");
        }
      },
      {
        connection: workerConnection,
        concurrency: 2,
      },
    );
    worker.on("failed", (bullJob, error) => {
      console.error(
        `[EmployerProfileReminder] worker_failed jobId=${bullJob?.id ?? "-"} reason=${error.name}`,
      );
    });
  }

  if (sweepTimer) {
    clearInterval(sweepTimer);
  }
  sweepTimer = setInterval(() => {
    void safeSweepTick();
  }, reminderPollIntervalMs());
  sweepTimer.unref?.();

  return stopEmployerProfileCompletionReminderRuntime;
}

export async function stopEmployerProfileCompletionReminderRuntime(): Promise<void> {
  if (sweepTimer) {
    clearInterval(sweepTimer);
    sweepTimer = null;
  }
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
