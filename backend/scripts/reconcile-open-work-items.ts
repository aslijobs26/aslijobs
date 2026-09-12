/**
 * Production reconciliation entrypoint (no arbitrary 20-row limit).
 * Idempotent — safe to re-run.
 *
 * Usage: npx tsx scripts/reconcile-open-work-items.ts
 */
import dns from "dns";
dns.setServers(["8.8.8.8", "1.1.1.1"]);

import "dotenv/config";
import mongoose from "mongoose";
import { reconcileOpenOperationsWork } from "../src/modules/operations/work/operations-work-reconcile.js";

async function main() {
  const uri = process.env.MONGO_URI;
  if (!uri) throw new Error("MONGO_URI missing");
  await mongoose.connect(uri);
  console.log("db=", mongoose.connection.db?.databaseName);
  const stats = await reconcileOpenOperationsWork({ batchSize: 100 });
  console.log(JSON.stringify(stats, null, 2));
  await mongoose.disconnect();
}

main().catch(async (error) => {
  console.error(error);
  try {
    await mongoose.disconnect();
  } catch {
    /* ignore */
  }
  process.exit(1);
});
