import mongoose from "mongoose";
import { connectDB } from "../src/config/db.js";
import { EmployerModel } from "../src/modules/employers/employer.model.js";
import { SubscriptionGrantModel } from "../src/modules/subscriptions/subscription-grant.model.js";
import { subscriptionService } from "../src/modules/subscriptions/subscription.service.js";

/**
 * Gives every existing employer a fresh, unused Free plan grant (1 job,
 * 7 days, 1 city), including employers who already posted jobs.
 * Idempotent: employers that already hold a Free grant are skipped.
 * Silent: sends no notifications.
 *
 * Dry run (default):  npx tsx scripts/backfill-free-subscriptions.ts
 * Apply changes:      npx tsx scripts/backfill-free-subscriptions.ts --apply
 */
async function main(): Promise<void> {
  const apply = process.argv.includes("--apply");
  await connectDB();

  const existing = new Set(
    (await SubscriptionGrantModel.distinct("employerId", { planCode: "free" })).map(String),
  );

  let scanned = 0;
  let missing = 0;
  let granted = 0;

  const cursor = EmployerModel.find({}).select("_id").lean().cursor();
  for await (const employer of cursor) {
    scanned += 1;
    if (existing.has(String(employer._id))) {
      continue;
    }
    missing += 1;
    if (!apply) {
      continue;
    }
    await subscriptionService.ensureFreeGrant(employer._id);
    granted += 1;
  }

  console.log(
    JSON.stringify({ mode: apply ? "apply" : "dry-run", scanned, missingFreeGrant: missing, granted }),
  );
  await mongoose.disconnect();
}

main().catch(async (error) => {
  console.error(error);
  await mongoose.disconnect().catch(() => undefined);
  process.exit(1);
});
