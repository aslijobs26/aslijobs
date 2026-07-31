import dns from "node:dns";
import mongoose from "mongoose";
import { env } from "./env.js";

dns.setServers(["8.8.8.8", "1.1.1.1"]);

export async function connectDB(): Promise<void> {
  if (!env.MONGO_URI) {
    console.warn("MONGO_URI is not set. Skipping MongoDB connection.");
    return;
  }

  try {
    await mongoose.connect(env.MONGO_URI, {
      family: 4,
      serverSelectionTimeoutMS: 10000,
    });

    const databaseName = mongoose.connection.db?.databaseName ?? "unknown";
    console.log(`MongoDB connected successfully: ${databaseName}`);

    // Keep job_views indexes aligned after schema evolution (drops obsolete uniques).
    try {
      const { JobViewModel } = await import("../modules/jobs/job-view.model.js");
      // Remove legacy one-time-seeker rows that lack visitorId / lastViewedAt.
      await JobViewModel.deleteMany({
        $or: [
          { visitorId: { $exists: false } },
          { lastViewedAt: { $exists: false } },
        ],
      });
      await JobViewModel.syncIndexes();
    } catch (indexError) {
      const indexMessage =
        indexError instanceof Error ? indexError.message : String(indexError);
      console.error("Failed to sync job_views indexes:", indexMessage);
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    const isDnsRelated =
      message.includes("querySrv") ||
      message.includes("ENOTFOUND") ||
      message.includes("ECONNREFUSED");

    if (isDnsRelated) {
      console.error("DNS/MongoDB connection error:", message);
    } else {
      console.error("MongoDB connection error:", message);
    }

    process.exit(1);
  }
}
