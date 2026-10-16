import { Schema, model } from "mongoose";

export const JOBSEEKER_PROFILE_COMPLETION_REMINDER_STATUSES = [
  "scheduled",
  "processing",
  "queued",
  "accepted",
  "sent",
  "skipped_complete",
  "skipped_ineligible",
  "failed",
] as const;

export type JobSeekerProfileCompletionReminderStatus =
  (typeof JOBSEEKER_PROFILE_COMPLETION_REMINDER_STATUSES)[number];

const jobSeekerProfileCompletionReminderSchema = new Schema(
  {
    jobSeekerId: {
      type: String,
      required: true,
      trim: true,
      unique: true,
      index: true,
    },
    dueAt: {
      type: Date,
      required: true,
      index: true,
    },
    status: {
      type: String,
      enum: JOBSEEKER_PROFILE_COMPLETION_REMINDER_STATUSES,
      required: true,
      default: "scheduled",
      index: true,
    },
    lastError: {
      type: String,
      trim: true,
      default: "",
    },
  },
  { timestamps: true },
);

jobSeekerProfileCompletionReminderSchema.index({ status: 1, dueAt: 1 });

/** A processing reminder with no outcome can be reclaimed after this. */
export const JOBSEEKER_PROFILE_COMPLETION_REMINDER_STALE_PROCESSING_MS =
  15 * 60 * 1000;

const SKIPPED_REMINDER_STATUSES = [
  "skipped_complete",
  "skipped_ineligible",
] as const;

export function isSkippedJobSeekerProfileCompletionReminderStatus(
  status: string | null | undefined,
): boolean {
  return (
    status === "skipped_complete" || status === "skipped_ineligible"
  );
}

export const JobSeekerProfileCompletionReminderModel = model(
  "JobSeekerProfileCompletionReminder",
  jobSeekerProfileCompletionReminderSchema,
);

export async function scheduleJobSeekerProfileCompletionReminderRecord(input: {
  jobSeekerId: string;
  dueAt: Date;
}): Promise<"scheduled" | "already_scheduled"> {
  try {
    const result = await JobSeekerProfileCompletionReminderModel.updateOne(
      { jobSeekerId: input.jobSeekerId },
      {
        $setOnInsert: {
          jobSeekerId: input.jobSeekerId,
          dueAt: input.dueAt,
          status: "scheduled",
        },
      },
      { upsert: true },
    );
    return result.upsertedCount === 1 ? "scheduled" : "already_scheduled";
  } catch {
    return "already_scheduled";
  }
}

export async function claimJobSeekerProfileCompletionReminder(
  jobSeekerId: string,
  now = new Date(),
): Promise<boolean> {
  const staleBefore = new Date(
    now.getTime() - JOBSEEKER_PROFILE_COMPLETION_REMINDER_STALE_PROCESSING_MS,
  );
  const claimed = await JobSeekerProfileCompletionReminderModel.findOneAndUpdate(
    {
      jobSeekerId,
      $or: [
        { status: { $in: ["scheduled", "failed", "queued"] } },
        {
          status: "processing",
          updatedAt: { $lte: staleBefore },
        },
      ],
    },
    { $set: { status: "processing", lastError: "" } },
    { new: true },
  );
  return Boolean(claimed);
}

export async function findJobSeekerProfileCompletionReminder(
  jobSeekerId: string,
): Promise<{ dueAt: Date; status: JobSeekerProfileCompletionReminderStatus } | null> {
  const row = await JobSeekerProfileCompletionReminderModel.findOne({
    jobSeekerId,
  })
    .select("dueAt status")
    .lean();
  if (!row?.dueAt) {
    return null;
  }
  return {
    dueAt: row.dueAt,
    status: row.status,
  };
}

export async function findDueJobSeekerProfileCompletionReminderIds(
  now: Date,
  limit = 50,
): Promise<string[]> {
  const staleBefore = new Date(
    now.getTime() - JOBSEEKER_PROFILE_COMPLETION_REMINDER_STALE_PROCESSING_MS,
  );
  const rows = await JobSeekerProfileCompletionReminderModel.find({
    dueAt: { $lte: now },
    $or: [
      { status: { $in: ["scheduled", "failed", "queued"] } },
      {
        status: "processing",
        updatedAt: { $lte: staleBefore },
      },
    ],
  })
    .select("jobSeekerId")
    .limit(limit)
    .lean();
  return rows.map((row) => row.jobSeekerId);
}

export async function markJobSeekerProfileCompletionReminderStatus(input: {
  jobSeekerId: string;
  status: Exclude<
    JobSeekerProfileCompletionReminderStatus,
    "scheduled" | "processing"
  >;
  lastError?: string;
}): Promise<boolean> {
  const result = await JobSeekerProfileCompletionReminderModel.updateOne(
    {
      jobSeekerId: input.jobSeekerId,
      status: {
        $nin: [...SKIPPED_REMINDER_STATUSES, "accepted", "sent"],
      },
    },
    {
      $set: {
        status: input.status,
        lastError: (input.lastError ?? "").slice(0, 300),
      },
    },
  );
  return result.modifiedCount === 1;
}

export async function skipPendingJobSeekerProfileCompletionReminder(
  jobSeekerId: string,
): Promise<boolean> {
  const result = await JobSeekerProfileCompletionReminderModel.updateOne(
    {
      jobSeekerId,
      status: { $in: ["scheduled", "failed", "processing", "queued"] },
    },
    { $set: { status: "skipped_complete", lastError: "" } },
  );
  return result.modifiedCount === 1;
}
