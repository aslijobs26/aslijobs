import { Schema, model } from "mongoose";

export const EMPLOYER_PROFILE_COMPLETION_REMINDER_STATUSES = [
  "scheduled",
  "processing",
  "sent",
  "skipped_complete",
  "failed",
] as const;

export type EmployerProfileCompletionReminderStatus =
  (typeof EMPLOYER_PROFILE_COMPLETION_REMINDER_STATUSES)[number];

const employerProfileCompletionReminderSchema = new Schema(
  {
    employerId: {
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
      enum: EMPLOYER_PROFILE_COMPLETION_REMINDER_STATUSES,
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

employerProfileCompletionReminderSchema.index({ status: 1, dueAt: 1 });

export const EmployerProfileCompletionReminderModel = model(
  "EmployerProfileCompletionReminder",
  employerProfileCompletionReminderSchema,
);

export async function scheduleEmployerProfileCompletionReminderRecord(input: {
  employerId: string;
  dueAt: Date;
}): Promise<"scheduled" | "already_scheduled"> {
  try {
    const result = await EmployerProfileCompletionReminderModel.updateOne(
      { employerId: input.employerId },
      {
        $setOnInsert: {
          employerId: input.employerId,
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

export async function claimEmployerProfileCompletionReminder(
  employerId: string,
): Promise<boolean> {
  const claimed = await EmployerProfileCompletionReminderModel.findOneAndUpdate(
    {
      employerId,
      status: { $in: ["scheduled", "failed"] },
    },
    { $set: { status: "processing", lastError: "" } },
    { new: true },
  );
  return Boolean(claimed);
}

export async function findDueEmployerProfileCompletionReminderIds(
  now: Date,
  limit = 50,
): Promise<string[]> {
  const rows = await EmployerProfileCompletionReminderModel.find({
    status: { $in: ["scheduled", "failed"] },
    dueAt: { $lte: now },
  })
    .select("employerId")
    .limit(limit)
    .lean();
  return rows.map((row) => row.employerId);
}

export async function markEmployerProfileCompletionReminderStatus(input: {
  employerId: string;
  status: Exclude<EmployerProfileCompletionReminderStatus, "scheduled">;
  lastError?: string;
}): Promise<void> {
  await EmployerProfileCompletionReminderModel.updateOne(
    { employerId: input.employerId },
    {
      $set: {
        status: input.status,
        lastError: (input.lastError ?? "").slice(0, 300),
      },
    },
  );
}
