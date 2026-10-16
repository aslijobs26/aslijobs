import { Queue, Worker } from "bullmq";
import { Redis } from "ioredis";
import { env } from "../../../config/env.js";
import {
  findJobSeekerProfileCompletionReminder,
  isSkippedJobSeekerProfileCompletionReminderStatus,
} from "./jobseeker-profile-completion-reminder.model.js";
import {
  enqueueJobSeekerProfileCompletionReminder,
  getJobSeekerProfileCompletionReminderDelayMs,
  processDueJobSeekerProfileCompletionReminders,
  processJobSeekerProfileCompletionReminder,
} from "./jobseeker-profile-completion-reminder.service.js";

const QUEUE_NAME = "jobseeker-profile-completion-reminders";
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
  const delayMs = getJobSeekerProfileCompletionReminderDelayMs();
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
    console.error(`[JobSeekerProfileReminder] redis_error ${error.message}`);
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

export function jobSeekerProfileCompletionReminderJobId(
  jobSeekerId: string,
): string {
  return `jobseeker-profile-reminder-${jobSeekerId.trim()}`;
}

function remainingReminderDelayMs(dueAt: Date, now = Date.now()): number {
  return Math.max(0, dueAt.getTime() - now);
}

function startLocalBackupTimer(jobSeekerId: string, delayMs: number): void {
  if (env.NODE_ENV === "test" || localTimers.has(jobSeekerId)) {
    return;
  }
  const timer = setTimeout(() => {
    localTimers.delete(jobSeekerId);
    void processJobSeekerProfileCompletionReminder(jobSeekerId);
  }, delayMs);
  timer.unref?.();
  localTimers.set(jobSeekerId, timer);
}

export function armJobSeekerProfileCompletionReminder(jobSeekerId: string): void {
  void (async () => {
    const result = await enqueueJobSeekerProfileCompletionReminder(jobSeekerId);
    if (result === "already_scheduled") {
      console.info("[JobSeekerProfileReminder] already scheduled", {
        jobSeekerId,
      });
    }
    await enqueueJobSeekerProfileCompletionReminderJob(jobSeekerId);
    const reminder = await findJobSeekerProfileCompletionReminder(jobSeekerId);
    if (
      reminder &&
      !isSkippedJobSeekerProfileCompletionReminderStatus(reminder.status) &&
      reminder.status !== "accepted" &&
      reminder.status !== "sent"
    ) {
      startLocalBackupTimer(
        jobSeekerId,
        remainingReminderDelayMs(reminder.dueAt),
      );
    }
  })().catch((error) => {
    console.error("[JobSeekerProfileReminder] arm rejected", {
      jobSeekerId,
      errorCategory: error instanceof Error ? error.name : "unknown",
    });
  });
}

export async function enqueueJobSeekerProfileCompletionReminderJob(
  jobSeekerId: string,
): Promise<void> {
  const activeQueue = getQueue();
  if (!activeQueue) {
    return;
  }

  const reminder = await findJobSeekerProfileCompletionReminder(jobSeekerId);
  if (
    !reminder ||
    isSkippedJobSeekerProfileCompletionReminderStatus(reminder.status) ||
    reminder.status === "accepted" ||
    reminder.status === "sent"
  ) {
    return;
  }

  try {
    await activeQueue.add(
      JOB_NAME,
      { jobSeekerId: jobSeekerId.trim() },
      {
        jobId: jobSeekerProfileCompletionReminderJobId(jobSeekerId),
        delay: remainingReminderDelayMs(reminder.dueAt),
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
      console.info("[JobSeekerProfileReminder] duplicate queue job skipped");
      return;
    }
    console.error(
      `[JobSeekerProfileReminder] queue_unavailable reason=${
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
    await processDueJobSeekerProfileCompletionReminders();
  } catch (error) {
    console.error("[JobSeekerProfileReminder] sweep failed", {
      errorCategory: error instanceof Error ? error.name : "unknown",
    });
  } finally {
    sweepRunning = false;
  }
}

export function startJobSeekerProfileCompletionReminderRuntime(): () => Promise<void> {
  if (env.NODE_ENV === "test") {
    return async () => undefined;
  }

  console.info("[JobSeekerProfileReminder] runtime started", {
    delayMinutes: env.JOBSEEKER_PROFILE_COMPLETION_REMINDER_DELAY_MINUTES,
    delayMs: getJobSeekerProfileCompletionReminderDelayMs(),
    redisConfigured: Boolean(env.REDIS_URL.trim()),
    nodeEnv: env.NODE_ENV,
  });

  if (env.REDIS_URL.trim() && !worker) {
    workerConnection = openRedis();
    worker = new Worker(
      QUEUE_NAME,
      async (bullJob) => {
        const data = bullJob.data as { jobSeekerId?: string };
        const jobSeekerId = data.jobSeekerId?.trim() ?? "";
        if (!jobSeekerId) {
          return;
        }
        console.info("[JobSeekerProfileReminder] job started", {
          jobSeekerId,
          jobId: String(bullJob.id ?? "-"),
          attempt: bullJob.attemptsMade + 1,
        });
        const result = await processJobSeekerProfileCompletionReminder(jobSeekerId);
        if (result === "failed") {
          throw new Error("jobseeker_profile_completion_reminder_failed");
        }
        console.info("[JobSeekerProfileReminder] job completed", {
          jobSeekerId,
          result,
        });
      },
      {
        connection: workerConnection,
        concurrency: 2,
      },
    );
    worker.on("failed", (bullJob, error) => {
      console.error(
        `[JobSeekerProfileReminder] worker_failed jobId=${bullJob?.id ?? "-"} reason=${error.name}`,
      );
    });
  }

  if (sweepTimer) {
    clearInterval(sweepTimer);
  }
  void safeSweepTick();
  sweepTimer = setInterval(() => {
    void safeSweepTick();
  }, reminderPollIntervalMs());
  sweepTimer.unref?.();

  return stopJobSeekerProfileCompletionReminderRuntime;
}

export async function stopJobSeekerProfileCompletionReminderRuntime(): Promise<void> {
  for (const timer of localTimers.values()) {
    clearTimeout(timer);
  }
  localTimers.clear();
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
