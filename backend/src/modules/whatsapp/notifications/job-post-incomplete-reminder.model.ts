import { Schema, model } from "mongoose";

export const JOB_POST_INCOMPLETE_REMINDER_STATUSES = [
  "scheduled",
  "processing",
  "sent",
  "skipped_complete",
  "skipped_ineligible",
  "failed",
] as const;

export type JobPostIncompleteReminderStatus =
  (typeof JOB_POST_INCOMPLETE_REMINDER_STATUSES)[number];

const jobPostIncompleteReminderSchema = new Schema(
  {
    jobMongoId: {
      type: String,
      required: true,
      trim: true,
      unique: true,
      index: true,
    },
    publicJobId: {
      type: String,
      required: true,
      trim: true,
      default: "",
    },
    employerId: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    generation: {
      type: Number,
      required: true,
      default: 0,
    },
    dueAt: {
      type: Date,
      required: true,
      index: true,
    },
    status: {
      type: String,
      enum: JOB_POST_INCOMPLETE_REMINDER_STATUSES,
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

jobPostIncompleteReminderSchema.index({ status: 1, dueAt: 1 });

export const JobPostIncompleteReminderModel = model(
  "JobPostIncompleteReminder",
  jobPostIncompleteReminderSchema,
);

export type JobPostIncompleteReminderRecord = {
  jobMongoId: string;
  publicJobId: string;
  employerId: string;
  generation: number;
  dueAt: Date;
  status: JobPostIncompleteReminderStatus;
};

export async function refreshJobPostIncompleteReminderRecord(input: {
  jobMongoId: string;
  publicJobId: string;
  employerId: string;
  dueAt: Date;
}): Promise<{ generation: number; rescheduled: boolean }> {
  const existing = await JobPostIncompleteReminderModel.findOne({
    jobMongoId: input.jobMongoId,
  })
    .select("generation")
    .lean();
  const updated = await JobPostIncompleteReminderModel.findOneAndUpdate(
    { jobMongoId: input.jobMongoId },
    {
      $set: {
        publicJobId: input.publicJobId,
        employerId: input.employerId,
        dueAt: input.dueAt,
        status: "scheduled",
        lastError: "",
      },
      $inc: { generation: 1 },
      $setOnInsert: { jobMongoId: input.jobMongoId },
    },
    { upsert: true, new: true, setDefaultsOnInsert: false },
  ).lean();
  return {
    generation: updated?.generation ?? (existing?.generation ?? 0) + 1,
    rescheduled: Boolean(existing),
  };
}

export async function invalidateJobPostIncompleteReminderRecord(input: {
  jobMongoId: string;
  status: "skipped_complete" | "skipped_ineligible";
}): Promise<number | null> {
  const updated = await JobPostIncompleteReminderModel.findOneAndUpdate(
    {
      jobMongoId: input.jobMongoId,
      status: { $in: ["scheduled", "failed", "processing"] },
    },
    {
      $inc: { generation: 1 },
      $set: { status: input.status, lastError: "" },
    },
    { new: true },
  ).lean();
  return updated?.generation ?? null;
}

export async function findJobPostIncompleteReminder(
  jobMongoId: string,
): Promise<JobPostIncompleteReminderRecord | null> {
  const row = await JobPostIncompleteReminderModel.findOne({ jobMongoId }).lean();
  if (!row) {
    return null;
  }
  return {
    jobMongoId: row.jobMongoId,
    publicJobId: row.publicJobId,
    employerId: row.employerId,
    generation: row.generation,
    dueAt: row.dueAt,
    status: row.status,
  };
}

export async function claimJobPostIncompleteReminder(input: {
  jobMongoId: string;
  generation: number;
}): Promise<boolean> {
  const claimed = await JobPostIncompleteReminderModel.findOneAndUpdate(
    {
      jobMongoId: input.jobMongoId,
      generation: input.generation,
      status: { $in: ["scheduled", "failed"] },
    },
    { $set: { status: "processing", lastError: "" } },
    { new: true },
  );
  return Boolean(claimed);
}

export async function findDueJobPostIncompleteReminders(
  now: Date,
  limit = 50,
): Promise<Array<{ jobMongoId: string; generation: number }>> {
  const rows = await JobPostIncompleteReminderModel.find({
    status: { $in: ["scheduled", "failed"] },
    dueAt: { $lte: now },
  })
    .select("jobMongoId generation")
    .limit(limit)
    .lean();
  return rows.map((row) => ({
    jobMongoId: row.jobMongoId,
    generation: row.generation,
  }));
}

export async function markJobPostIncompleteReminderStatus(input: {
  jobMongoId: string;
  generation: number;
  status: Exclude<JobPostIncompleteReminderStatus, "scheduled" | "processing">;
  lastError?: string;
}): Promise<void> {
  await JobPostIncompleteReminderModel.updateOne(
    { jobMongoId: input.jobMongoId, generation: input.generation },
    {
      $set: {
        status: input.status,
        lastError: (input.lastError ?? "").slice(0, 300),
      },
    },
  );
}
