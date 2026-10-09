import mongoose from "mongoose";
import { Queue, Worker } from "bullmq";
import { Redis } from "ioredis";
import { env } from "../../config/env.js";
import { resolveJobSourceLanguage, type JobContentLanguage } from "./job-content-language.js";
import { JobModel } from "./job.model.js";
import { JobTranslationTaskModel } from "./job-translation-task.model.js";
import {
  cachedTranslationMatchesSource,
  closeJobTranslationCache,
  invalidateJobTranslationCache,
  readCachedJobTranslation,
  writeCachedJobTranslation,
} from "./job-translation.cache.js";
import {
  canEnqueueJobTranslation,
  claimTranslationEnqueueSlot,
  isDuplicateKeyError,
  jobTranslationQueueJobId,
  jobTranslationSourceHash,
  jobTranslationTaskKey,
  JOB_TRANSLATION_QUEUE_NAME,
  parseConfiguredJobLanguages,
  releaseTranslationEnqueueSlot,
  safeTranslationErrorMessage,
  shouldResetStoredTranslationTask,
  translationRetryDelayMs,
} from "./job-translation.policy.js";
import {
  hashJobField,
  languageNeedsTranslation,
  resolvePublicJobTranslationView,
  shouldSkipFailedTranslationRetry,
  translateJobContentOnDemand,
  TRANSLATION_RETRY_COOLDOWN_MS,
  type JobContentTranslations,
  type PublicJobTranslationStatus,
} from "./job-content-translation.js";

type TranslationSource = {
  jobTitle: string;
  description: string;
  interviewInstructions: string;
  contentLanguage?: string | null;
  contentTranslations?: JobContentTranslations | null;
};

const STALE_LOCK_MS = 5 * 60_000;
const DRAIN_INTERVAL_MS = 3_000;

let queue: Queue | null = null;
let queueConnection: Redis | null = null;
let worker: Worker | null = null;
let workerConnection: Redis | null = null;
let drainTimer: ReturnType<typeof setInterval> | null = null;
let draining = false;

function logTranslationFailure(details: {
  jobId?: string;
  language?: string;
  attempt?: number;
  error: string;
}): void {
  console.error("[JOB-TRANSLATE] event=TRANSLATION_FAILED", {
    jobId: details.jobId ?? "-",
    language: details.language ?? "-",
    attempt: details.attempt ?? 0,
    error: details.error,
    timestamp: new Date().toISOString(),
  });
}

function bullConnection(): Redis | null {
  if (!env.REDIS_URL.trim()) {
    return null;
  }
  return new Redis(env.REDIS_URL, {
    maxRetriesPerRequest: null,
    enableReadyCheck: false,
  });
}

function getQueue(): Queue | null {
  if (!env.REDIS_URL.trim()) {
    return null;
  }
  if (!queue) {
    queueConnection = bullConnection();
    if (!queueConnection) {
      return null;
    }
    queueConnection.on("error", (error: Error) => {
      logTranslationFailure({ error: `redis_unavailable ${error.message}` });
    });
    queue = new Queue(JOB_TRANSLATION_QUEUE_NAME, { connection: queueConnection });
  }
  return queue;
}

async function pushQueueJob(
  taskId: string,
  jobMongoId: string,
  language: string,
  sourceHash: string,
  attempt: number,
  delay = 0,
): Promise<void> {
  const activeQueue = getQueue();
  if (!activeQueue) {
    return;
  }
  try {
    await activeQueue.add(
      "translate",
      { taskId },
      {
        jobId: jobTranslationQueueJobId(jobMongoId, language, sourceHash, attempt),
        delay,
        attempts: 1,
        removeOnComplete: true,
        removeOnFail: 50,
      },
    );
  } catch (error) {
    logTranslationFailure({
      jobId: jobMongoId,
      language,
      attempt,
      error: `queue_add_failed ${safeTranslationErrorMessage(error)}`,
    });
  }
}

async function enqueueJobLanguageTranslation(
  jobMongoId: string,
  language: JobContentLanguage,
): Promise<"queued" | "skipped" | "exhausted"> {
  if (!mongoose.Types.ObjectId.isValid(jobMongoId)) {
    return "skipped";
  }
  const job = await JobModel.findById(jobMongoId).select(
    "jobId status jobTitle description interviewInstructions contentLanguage contentTranslations",
  );
  if (!job || job.status === "draft") {
    return "skipped";
  }

  const source = {
    jobTitle: job.jobTitle?.trim() ?? "",
    description: job.description?.trim() ?? "",
    interviewInstructions: job.interviewInstructions?.trim() ?? "",
  };
  const sample = `${source.jobTitle}\n${source.description}\n${source.interviewInstructions}`;
  const sourceLanguage = resolveJobSourceLanguage({
    ...source,
    contentLanguage: job.contentLanguage,
  });
  if (!sample.trim() || language === sourceLanguage) {
    if (language === sourceLanguage) {
      console.info(
        `[JOB-TRANSLATE] event=TRANSLATION_SKIPPED_SOURCE_LANGUAGE jobId=${job.jobId} language=${language}`,
      );
    }
    return "skipped";
  }

  const translations = (job.contentTranslations ?? null) as JobContentTranslations | null;
  if (
    !languageNeedsTranslation(
      { ...source, contentLanguage: job.contentLanguage, contentTranslations: translations },
      language,
    ) ||
    shouldSkipFailedTranslationRetry(translations?.[language], source)
  ) {
    return "skipped";
  }

  const sourceHash = jobTranslationSourceHash(source);
  const slotKey = jobTranslationTaskKey(jobMongoId, language, sourceHash);
  if (!claimTranslationEnqueueSlot(slotKey)) {
    return "skipped";
  }

  try {
    const existing = await JobTranslationTaskModel.findOne({
      jobMongoId: job._id,
      language,
      sourceHash,
    }).select("status attempts nextAttemptAt");

    if (existing?.status === "pending" || existing?.status === "processing") {
      return "skipped";
    }

    if (existing?.status === "failed") {
      if (!canEnqueueJobTranslation(existing, Date.now(), env.JOB_TRANSLATION_MAX_ATTEMPTS)) {
        return "exhausted";
      }
      const reset = await JobTranslationTaskModel.findOneAndUpdate(
        { _id: existing._id, status: "failed" },
        {
          $set: {
            status: "pending",
            lastError: "",
            lockedAt: null,
            nextAttemptAt: new Date(),
          },
        },
        { new: true },
      );
      if (!reset) {
        return "skipped";
      }
      await pushQueueJob(
        reset._id.toString(),
        jobMongoId,
        language,
        sourceHash,
        reset.attempts,
      );
      console.info(
        `[JOB-TRANSLATE] event=TRANSLATION_ENQUEUED jobId=${job.jobId} language=${language} sourceHash=${sourceHash} field=job calls=0`,
      );
      return "queued";
    }

    const needsReset = Boolean(
      existing &&
        shouldResetStoredTranslationTask(existing.status, true),
    );
    if (existing && !needsReset) {
      return "skipped";
    }

    let taskId = "";
    if (existing) {
      const reset = await JobTranslationTaskModel.findOneAndUpdate(
        { _id: existing._id, status: { $in: ["failed", "completed"] } },
        {
          $set: {
            status: "pending",
            attempts: 0,
            lastError: "",
            lockedAt: null,
            nextAttemptAt: new Date(),
          },
        },
        { new: true },
      );
      if (!reset) {
        return "skipped";
      }
      taskId = reset._id.toString();
    } else {
      try {
        const created = await JobTranslationTaskModel.create({
          jobMongoId: job._id,
          publicJobId: job.jobId,
          language,
          sourceHash,
          status: "pending",
          attempts: 0,
          nextAttemptAt: new Date(),
        });
        taskId = created._id.toString();
      } catch (error) {
        if (isDuplicateKeyError(error)) {
          return "skipped";
        }
        throw error;
      }
    }

    await pushQueueJob(taskId, jobMongoId, language, sourceHash, 0);
    console.info(
      `[JOB-TRANSLATE] event=TRANSLATION_ENQUEUED jobId=${job.jobId} language=${language} sourceHash=${sourceHash} field=job calls=0`,
    );
    return "queued";
  } finally {
    releaseTranslationEnqueueSlot(slotKey);
  }
}

export async function enqueueConfiguredJobTranslations(jobMongoId: string): Promise<number> {
  const languages = parseConfiguredJobLanguages(env.JOB_TRANSLATION_LANGUAGES);
  let queued = 0;
  for (const language of languages) {
    const result = await enqueueJobLanguageTranslation(jobMongoId, language);
    if (result === "queued") {
      queued += 1;
    }
  }
  return queued;
}

export function scheduleJobContentTranslations(_jobMongoId: string): void {
  // Eager all-language enqueue is disabled. Use scheduleJobLanguageTranslation
  // from a detail request, or the manual backfill script.
}

export function scheduleJobLanguageTranslation(
  jobMongoId: string,
  language: JobContentLanguage,
): void {
  void enqueueJobLanguageTranslation(jobMongoId, language).catch((error: unknown) => {
    logTranslationFailure({
      jobId: jobMongoId,
      language,
      error: safeTranslationErrorMessage(error),
    });
  });
}

export function scheduleJobTranslationRefresh(jobMongoId: string): void {
  void invalidateJobTranslationCache(jobMongoId).catch((error: unknown) => {
    logTranslationFailure({
      jobId: jobMongoId,
      error: safeTranslationErrorMessage(error),
    });
  });
}

async function retryOrFail(
  claimed: {
    _id: mongoose.Types.ObjectId;
    attempts: number;
    jobMongoId: unknown;
    publicJobId?: string;
    language: string;
    sourceHash: string;
  },
  errorMessage: string,
): Promise<void> {
  logTranslationFailure({
    jobId: claimed.publicJobId || String(claimed.jobMongoId),
    language: claimed.language,
    attempt: claimed.attempts,
    error: errorMessage,
  });

  if (claimed.attempts >= env.JOB_TRANSLATION_MAX_ATTEMPTS) {
    await JobTranslationTaskModel.updateOne(
      { _id: claimed._id },
      {
        $set: {
          status: "failed",
          lastError: errorMessage,
          lockedAt: null,
          nextAttemptAt: new Date(Date.now() + TRANSLATION_RETRY_COOLDOWN_MS),
        },
      },
    );
    return;
  }

  const delay = translationRetryDelayMs(claimed.attempts);
  await JobTranslationTaskModel.updateOne(
    { _id: claimed._id },
    {
      $set: {
        status: "pending",
        lastError: errorMessage,
        lockedAt: null,
        nextAttemptAt: new Date(Date.now() + delay),
      },
    },
  );
  await pushQueueJob(
    claimed._id.toString(),
    String(claimed.jobMongoId),
    claimed.language,
    claimed.sourceHash,
    claimed.attempts,
    delay,
  );
}

export async function processJobTranslationTask(
  taskId: string,
  fetchImpl?: typeof fetch,
): Promise<void> {
  if (!mongoose.Types.ObjectId.isValid(taskId)) {
    return;
  }
  const claimed = await JobTranslationTaskModel.findOneAndUpdate(
    {
      _id: taskId,
      status: "pending",
      nextAttemptAt: { $lte: new Date() },
    },
    {
      $set: { status: "processing", lockedAt: new Date() },
      $inc: { attempts: 1 },
    },
    { new: true },
  );
  if (!claimed) {
    return;
  }

  const language = claimed.language as JobContentLanguage;
  try {
    const result = await translateJobContentOnDemand({
      jobMongoId: String(claimed.jobMongoId),
      publicJobId: claimed.publicJobId,
      language,
      forceRetry: true,
      fetchImpl,
    });
    if (result.event === "TRANSLATION_FAILED" || result.stillNeedsTranslation) {
      await retryOrFail(
        claimed,
        result.event === "TRANSLATION_FAILED"
          ? "translation_provider_failed"
          : "translation_incomplete",
      );
      return;
    }
    await JobTranslationTaskModel.updateOne(
      { _id: claimed._id },
      { $set: { status: "completed", lastError: "", lockedAt: null } },
    );
    const translatedAwayFromSource =
      result.content.jobTitle !== result.source.jobTitle ||
      result.content.description !== result.source.description ||
      result.content.interviewInstructions !== result.source.interviewInstructions;
    if (
      (result.event === "TRANSLATION_CREATED" && translatedAwayFromSource) ||
      result.event === "CACHE_HIT"
    ) {
      await writeCachedJobTranslation(String(claimed.jobMongoId), language, {
        sourceHash: claimed.sourceHash,
        jobTitle: result.content.jobTitle,
        description: result.content.description,
        interviewInstructions: result.content.interviewInstructions,
      });
    }
  } catch (error) {
    await retryOrFail(claimed, safeTranslationErrorMessage(error));
  }
}

async function drainOnce(): Promise<void> {
  if (draining || mongoose.connection.readyState !== 1) {
    return;
  }
  draining = true;
  try {
    const staleBefore = new Date(Date.now() - STALE_LOCK_MS);
    await JobTranslationTaskModel.updateMany(
      { status: "processing", lockedAt: { $lt: staleBefore } },
      { $set: { status: "pending", lockedAt: null, nextAttemptAt: new Date() } },
    );
    const task = await JobTranslationTaskModel.findOne({
      status: "pending",
      nextAttemptAt: { $lte: new Date() },
    })
      .sort({ nextAttemptAt: 1 })
      .select("_id");
    if (!task) {
      return;
    }
    await processJobTranslationTask(task._id.toString());
  } catch (error) {
    logTranslationFailure({ error: safeTranslationErrorMessage(error) });
  } finally {
    draining = false;
  }
}

export async function stopJobTranslationRuntime(): Promise<void> {
  if (drainTimer) {
    clearInterval(drainTimer);
    drainTimer = null;
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
  await closeJobTranslationCache();
}

export function startJobTranslationRuntime(): () => Promise<void> {
  if (env.NODE_ENV === "test") {
    return async () => undefined;
  }
  if (!drainTimer) {
    drainTimer = setInterval(() => {
      void drainOnce();
    }, DRAIN_INTERVAL_MS);
    drainTimer.unref();
    void JobTranslationTaskModel.updateMany(
      { status: "processing" },
      { $set: { status: "pending", lockedAt: null, nextAttemptAt: new Date() } },
    ).catch((error: unknown) => {
      logTranslationFailure({
        error: `orphan_processing_reset ${safeTranslationErrorMessage(error)}`,
      });
    });
  }
  if (env.REDIS_URL.trim() && !worker) {
    workerConnection = bullConnection();
    if (workerConnection) {
      workerConnection.on("error", (error: Error) => {
        logTranslationFailure({ error: `redis_unavailable ${error.message}` });
      });
      worker = new Worker(
        JOB_TRANSLATION_QUEUE_NAME,
        async (job) => {
          const taskId = String((job.data as { taskId?: string }).taskId ?? "");
          if (taskId) {
            await processJobTranslationTask(taskId);
          }
        },
        {
          connection: workerConnection,
          concurrency: env.JOB_TRANSLATION_WORKER_CONCURRENCY,
        },
      );
      worker.on("error", (error: Error) => {
        logTranslationFailure({ error: `worker_error ${error.message}` });
      });
    }
  }
  return stopJobTranslationRuntime;
}

export async function serveJobDetailTranslation(input: {
  jobMongoId: string;
  job: TranslationSource;
  language: JobContentLanguage | null;
}): Promise<{
  content: TranslationSource;
  language: JobContentLanguage | null;
  sourceLanguage: JobContentLanguage;
  translationStatus: PublicJobTranslationStatus;
  isTranslated: boolean;
}> {
  const source = {
    jobTitle: input.job.jobTitle?.trim() ?? "",
    description: input.job.description?.trim() ?? "",
    interviewInstructions: input.job.interviewInstructions?.trim() ?? "",
  };
  let jobForView: TranslationSource = { ...input.job, ...source };
  const sourceLanguage = resolveJobSourceLanguage(jobForView);
  if (input.language && input.language !== sourceLanguage) {
    const cached = await readCachedJobTranslation(input.jobMongoId, input.language);
    if (cachedTranslationMatchesSource(cached, source)) {
      const overlaid = {
        ...jobForView,
        contentTranslations: {
          ...(input.job.contentTranslations ?? {}),
          [input.language]: {
            jobTitle: cached.jobTitle,
            description: cached.description,
            interviewInstructions: cached.interviewInstructions,
            jobTitleHash: hashJobField(source.jobTitle),
            descriptionHash: hashJobField(source.description),
            interviewInstructionsHash: hashJobField(source.interviewInstructions),
            status: "completed" as const,
          },
        },
      };
      if (!languageNeedsTranslation(overlaid, input.language)) {
        jobForView = overlaid;
      }
    }
  }

  const view = resolvePublicJobTranslationView(jobForView, input.language);
  let translationStatus = view.translationStatus;
  if (view.translationStatus === "ready" && view.isTranslated && input.language) {
    console.info(
      `[JOB-TRANSLATE] event=CACHE_HIT jobId=${input.jobMongoId} language=${input.language} sourceHash=${jobTranslationSourceHash(source)} field=job calls=0`,
    );
  }
  if (view.shouldEnqueue && input.language) {
    const sourceHash = jobTranslationSourceHash(source);
    const existing = mongoose.Types.ObjectId.isValid(input.jobMongoId)
      ? await JobTranslationTaskModel.findOne({
          jobMongoId: input.jobMongoId,
          language: input.language,
          sourceHash,
        }).select("status attempts nextAttemptAt")
      : null;
    const retriesExhausted = Boolean(
      existing
      && existing.status === "failed"
      && !canEnqueueJobTranslation(existing, Date.now(), env.JOB_TRANSLATION_MAX_ATTEMPTS),
    );
    if (retriesExhausted) {
      translationStatus = "failed";
      console.info(
        `[JOB-TRANSLATE] event=TRANSLATION_EXHAUSTED jobId=${input.jobMongoId} language=${input.language} sourceHash=${sourceHash} field=job calls=${existing?.attempts ?? 0}`,
      );
    } else {
      scheduleJobLanguageTranslation(input.jobMongoId, input.language);
    }
  }
  return {
    content: view.content,
    language: view.language,
    sourceLanguage: view.sourceLanguage,
    translationStatus,
    isTranslated: view.isTranslated,
  };
}
