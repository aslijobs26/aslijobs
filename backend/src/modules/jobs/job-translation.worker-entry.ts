import { connectDB } from "../../config/db.js";
import { env } from "../../config/env.js";
import { startJobTranslationRuntime } from "./job-translation.queue.js";
import mongoose from "mongoose";

await connectDB();
const stop = startJobTranslationRuntime();
console.info("[JOB-TRANSLATE] worker_started", {
  redis: Boolean(env.REDIS_URL.trim()),
  timestamp: new Date().toISOString(),
});

async function shutdown(signal: string): Promise<void> {
  console.info("[JOB-TRANSLATE] worker_stopping", {
    signal,
    timestamp: new Date().toISOString(),
  });
  await stop();
  if (mongoose.connection.readyState !== 0) {
    await mongoose.connection.close();
  }
  process.exit(0);
}

process.on("SIGINT", () => {
  void shutdown("SIGINT");
});
process.on("SIGTERM", () => {
  void shutdown("SIGTERM");
});
