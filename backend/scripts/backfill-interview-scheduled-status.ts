import mongoose from "mongoose";
import { connectDB } from "../src/config/db.js";
import { ApplicationModel } from "../src/modules/applications/application.model.js";

/**
 * Moves applications that hold an active (non-cancelled) interview but are still
 * in a pre-interview stage to `interview_scheduled`, and relabels their
 * interview history entries so the seeker timeline shows the interview step.
 *
 * Dry run (default):  npx tsx scripts/backfill-interview-scheduled-status.ts
 * Apply changes:      npx tsx scripts/backfill-interview-scheduled-status.ts --apply
 */
const PRE_INTERVIEW_STATUSES = [
  "submitted",
  "viewed",
  "under_review",
  "shortlisted",
] as const;

const INTERVIEW_REMARK_PATTERN = /^Interview (Scheduled|Rescheduled) by /;

async function main(): Promise<void> {
  const apply = process.argv.includes("--apply");
  let matched = 0;
  let updated = 0;

  await connectDB();

  const cursor = ApplicationModel.find({
    status: { $in: PRE_INTERVIEW_STATUSES },
    "interview.date": { $nin: [null, ""] },
    "interview.cancelledAt": null,
  })
    .select("_id status statusHistory")
    .cursor();

  for await (const application of cursor) {
    matched += 1;
    if (!apply) {
      continue;
    }

    for (const entry of application.statusHistory) {
      if (INTERVIEW_REMARK_PATTERN.test(entry.remark ?? "")) {
        entry.status = "interview_scheduled";
      }
    }
    application.status = "interview_scheduled";
    await application.save();
    updated += 1;
  }

  console.info("[APPLICATIONS] interview_status_backfill_finished", {
    mode: apply ? "apply" : "dry_run",
    matched,
    updated,
    timestamp: new Date().toISOString(),
  });
  await mongoose.connection.close();
}

main().catch((error: unknown) => {
  console.error("[APPLICATIONS] interview_status_backfill_failed", {
    error: error instanceof Error ? error.message : "backfill_failed",
    timestamp: new Date().toISOString(),
  });
  process.exit(1);
});
