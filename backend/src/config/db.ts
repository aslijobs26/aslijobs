import dns from "node:dns";
import mongoose from "mongoose";
import {
  assertDatabaseIsolation,
  readDatabaseIsolationFlagsFromEnv,
} from "./database-isolation.js";
import { describeMongoUriTarget } from "./mongo-database-name.js";
import { env } from "./env.js";

dns.setServers(["8.8.8.8", "1.1.1.1"]);

let connectedDatabaseName: string | null = null;

/** Resolved MongoDB database name after a successful connect (never credentials). */
export function getConnectedDatabaseName(): string | null {
  return connectedDatabaseName;
}

export async function connectDB(): Promise<void> {
  if (!env.MONGO_URI) {
    if (env.NODE_ENV === "production") {
      console.error(
        "Production database safety check failed. MONGO_URI is required.",
      );
      process.exit(1);
    }
    console.warn("MONGO_URI is not set. Skipping MongoDB connection.");
    return;
  }

  const isolation = assertDatabaseIsolation({
    nodeEnv: env.NODE_ENV,
    mongoUri: env.MONGO_URI,
    ...readDatabaseIsolationFlagsFromEnv(),
  });

  for (const warning of isolation.warnings) {
    console.warn(`[database-isolation] ${warning}`);
  }

  if (!isolation.ok) {
    console.error(isolation.error);
    process.exit(1);
  }

  const target = describeMongoUriTarget(env.MONGO_URI);
  console.log(`Environment: ${env.NODE_ENV}`);
  console.log(`Database (URI target): ${target.databaseName}`);
  console.log(`MongoDB host: ${target.hostHint}`);

  try {
    await mongoose.connect(env.MONGO_URI, {
      family: 4,
      serverSelectionTimeoutMS: 10_000,
    });

    const databaseName = mongoose.connection.db?.databaseName ?? "unknown";
    connectedDatabaseName = databaseName;

    if (databaseName !== isolation.databaseName) {
      console.error(
        `Production database safety check failed. URI resolved to ${isolation.databaseName} but mongoose connected to ${databaseName}.`,
      );
      await mongoose.connection.close().catch(() => undefined);
      process.exit(1);
    }

    // Log database name only (never URI/credentials).
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

    // Application uniqueness: active (non-withdrawn) only — enables re-apply after withdraw.
    // Uses `$in` of active statuses because MongoDB rejects `$ne` in partialFilterExpression.
    try {
      const { ApplicationModel } = await import(
        "../modules/applications/application.model.js"
      );
      await dropLegacyApplicationUniqueIndexes(ApplicationModel.collection);
      await ApplicationModel.syncIndexes();
    } catch (indexError) {
      const indexMessage =
        indexError instanceof Error ? indexError.message : String(indexError);
      console.error("Failed to sync applications indexes:", indexMessage);
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

    // Production must never fall back to another database or in-memory store.
    process.exit(1);
  }
}

/**
 * Drop obsolete unique indexes that used unsupported `$ne` partial filters
 * (or the old unscoped unique) so syncIndexes can create the `$in`-based index.
 */
async function dropLegacyApplicationUniqueIndexes(
  collection: mongoose.Collection,
): Promise<void> {
  let indexes: Array<{ name?: string; partialFilterExpression?: unknown; unique?: boolean; key?: Record<string, unknown> }> = [];
  try {
    indexes = await collection.indexes();
  } catch {
    return;
  }

  for (const index of indexes) {
    const name = index.name;
    if (!name || name === "_id_") {
      continue;
    }

    const partial = index.partialFilterExpression as
      | { status?: { $ne?: unknown; $in?: unknown } }
      | undefined;
    const usesUnsupportedNe =
      partial?.status != null &&
      Object.prototype.hasOwnProperty.call(partial.status, "$ne");

    const key = index.key ?? {};
    const isJobSeekerJobUnique =
      Boolean(index.unique) &&
      key.jobSeekerId === 1 &&
      key.jobId === 1 &&
      Object.keys(key).length === 2;

    const isLegacyName =
      name === "jobSeekerId_1_jobId_1" ||
      name.includes("jobSeekerId_1_jobId_1");

    if (usesUnsupportedNe || (isJobSeekerJobUnique && isLegacyName && name !== "jobSeekerId_1_jobId_1_active")) {
      try {
        await collection.dropIndex(name);
        console.warn(`[applications] dropped legacy index: ${name}`);
      } catch (dropError) {
        const dropMessage =
          dropError instanceof Error ? dropError.message : String(dropError);
        // Index may already be gone between restarts.
        if (!dropMessage.includes("index not found")) {
          console.warn(
            `[applications] could not drop legacy index ${name}: ${dropMessage}`,
          );
        }
      }
    }
  }
}
