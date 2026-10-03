import mongoose from "mongoose";
import { connectDB } from "../src/config/db.js";
import { JobModel } from "../src/modules/jobs/job.model.js";
import { enqueueConfiguredJobTranslations } from "../src/modules/jobs/job-translation.queue.js";

/**
 * Queues background translations for existing active jobs.
 * Does not call the translation provider itself.
 *
 * Resume after a stop:
 *   npx tsx scripts/backfill-job-content-translations.ts --after=<mongoId>
 */
const BATCH_SIZE = 25;

function readArg(name: string): string {
  const prefix = `--${name}=`;
  const match = process.argv.find((arg) => arg.startsWith(prefix));
  return match ? match.slice(prefix.length).trim() : "";
}

async function main(): Promise<void> {
  const afterArg = readArg("after");
  const limitArg = Number(readArg("limit") || "0");
  let afterId =
    afterArg && mongoose.Types.ObjectId.isValid(afterArg)
      ? new mongoose.Types.ObjectId(afterArg)
      : null;
  let seen = 0;
  let queued = 0;

  await connectDB();
  console.info("[JOB-TRANSLATE] backfill_started", {
    after: afterId?.toString() ?? "",
    limit: Number.isFinite(limitArg) ? limitArg : 0,
    timestamp: new Date().toISOString(),
  });

  while (true) {
    if (limitArg > 0 && seen >= limitArg) {
      break;
    }
    const batchLimit =
      limitArg > 0 ? Math.min(BATCH_SIZE, limitArg - seen) : BATCH_SIZE;
    const jobs = await JobModel.find({
      status: "active",
      ...(afterId ? { _id: { $gt: afterId } } : {}),
    })
      .sort({ _id: 1 })
      .limit(batchLimit)
      .select("_id jobId");

    if (jobs.length === 0) {
      break;
    }

    for (const job of jobs) {
      const count = await enqueueConfiguredJobTranslations(job._id.toString());
      seen += 1;
      queued += count;
      afterId = job._id;
      console.info("[JOB-TRANSLATE] backfill_progress", {
        seen,
        queued,
        publicJobId: job.jobId,
        jobMongoId: job._id.toString(),
        timestamp: new Date().toISOString(),
      });
    }
  }

  console.info("[JOB-TRANSLATE] backfill_finished", {
    seen,
    queued,
    resumeAfter: afterId?.toString() ?? "",
    timestamp: new Date().toISOString(),
  });
  await mongoose.connection.close();
}

main().catch((error: unknown) => {
  console.error("[JOB-TRANSLATE] backfill_failed", {
    error: error instanceof Error ? error.message : "backfill_failed",
    timestamp: new Date().toISOString(),
  });
  process.exit(1);
});
