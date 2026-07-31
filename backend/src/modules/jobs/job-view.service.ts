import mongoose from "mongoose";
import { env } from "../../config/env.js";
import { JobModel } from "./job.model.js";
import { JobViewModel } from "./job-view.model.js";
import type { JobViewVisitorType } from "./job-view.visitor.js";

function isDuplicateKeyError(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { code?: number }).code === 11000
  );
}

export type RecordJobViewInput = {
  jobMongoId: string;
  publicJobId: string;
  visitorType: JobViewVisitorType;
  visitorId: string;
};

function getCooldownThreshold(now: Date): Date {
  const cooldownMs = env.JOB_VIEW_COOLDOWN_MINUTES * 60 * 1000;
  return new Date(now.getTime() - cooldownMs);
}

async function incrementJobViews(jobObjectId: mongoose.Types.ObjectId) {
  await JobModel.updateOne({ _id: jobObjectId }, { $inc: { views: 1 } });
}

/**
 * Attempt to count a returning visitor whose cooldown has elapsed.
 * The `lastViewedAt <= threshold` predicate makes the update atomic under concurrency.
 */
async function tryCountReturningView(input: {
  jobObjectId: mongoose.Types.ObjectId;
  visitorId: string;
  visitorType: JobViewVisitorType;
  publicJobId: string;
  now: Date;
  threshold: Date;
}): Promise<boolean> {
  const updateResult = await JobViewModel.updateOne(
    {
      jobId: input.jobObjectId,
      visitorId: input.visitorId,
      lastViewedAt: { $lte: input.threshold },
    },
    {
      $set: {
        lastViewedAt: input.now,
        visitorType: input.visitorType,
        publicJobId: input.publicJobId,
      },
    },
  );

  if (updateResult.modifiedCount !== 1) {
    return false;
  }

  await incrementJobViews(input.jobObjectId);
  return true;
}

/**
 * Records a job view for a guest or authenticated job seeker.
 *
 * - First visit for (visitorId, jobId): insert + increment Job.views
 * - Revisit within JOB_VIEW_COOLDOWN_MINUTES: no-op
 * - Revisit after cooldown: update lastViewedAt + increment Job.views
 *
 * Concurrent requests cannot double-increment: unique index + conditional
 * `lastViewedAt` update are both atomic.
 *
 * @returns true when Job.views was incremented.
 */
export async function recordJobView(
  input: RecordJobViewInput,
): Promise<boolean> {
  if (!mongoose.isValidObjectId(input.jobMongoId)) {
    return false;
  }

  const visitorId = input.visitorId.trim();
  const publicJobId = input.publicJobId.trim().toUpperCase();

  if (!visitorId || !publicJobId) {
    return false;
  }

  if (
    input.visitorType === "jobSeeker" &&
    !mongoose.isValidObjectId(visitorId)
  ) {
    return false;
  }

  const jobObjectId = new mongoose.Types.ObjectId(input.jobMongoId);
  const now = new Date();
  const threshold = getCooldownThreshold(now);

  try {
    const insertResult = await JobViewModel.updateOne(
      {
        jobId: jobObjectId,
        visitorId,
      },
      {
        $setOnInsert: {
          jobId: jobObjectId,
          visitorId,
          visitorType: input.visitorType,
          publicJobId,
          lastViewedAt: now,
        },
      },
      { upsert: true },
    );

    if (insertResult.upsertedCount === 1) {
      await incrementJobViews(jobObjectId);
      return true;
    }

    return tryCountReturningView({
      jobObjectId,
      visitorId,
      visitorType: input.visitorType,
      publicJobId,
      now,
      threshold,
    });
  } catch (error) {
    // Concurrent first-time inserts collide on the unique index.
    // Fall through to the cooldown-gated update path.
    if (isDuplicateKeyError(error)) {
      return tryCountReturningView({
        jobObjectId,
        visitorId,
        visitorType: input.visitorType,
        publicJobId,
        now,
        threshold,
      });
    }

    throw error;
  }
}

export const jobViewService = {
  recordJobView,
};
