import mongoose from "mongoose";
import { PENDING_VERIFICATION_FILTER } from "../verifications/operations-verifications-analytics.js";
import {
  upsertEmployerVerificationWork,
  upsertJobModerationWork,
  upsertJoiningPendingWork,
} from "./operations-work-emit.js";
import {
  ensureOperationsWorkDepartments,
  resolveWorkDepartmentId,
} from "./operations-work-department.js";
import { OperationsWorkItemModel } from "./operations-work.model.js";

export type WorkReconcileStats = {
  startedAt: string;
  finishedAt: string;
  employersScanned: number;
  employersCreated: number;
  jobsScanned: number;
  jobsCreated: number;
  placementsScanned: number;
  placementsCreated: number;
  departmentBackfilled: number;
  slaBreachesMarked: number;
  errors: number;
};

const DEFAULT_BATCH = 100;

function resolveCompanyName(doc: Record<string, unknown>): string {
  const company = doc.companyName;
  if (typeof company === "string" && company.trim()) return company.trim();
  const first = typeof doc.firstName === "string" ? doc.firstName : "";
  const last = typeof doc.lastName === "string" ? doc.lastName : "";
  const name = `${first} ${last}`.trim();
  return name || "Employer";
}

function asDate(...values: unknown[]): Date {
  for (const value of values) {
    if (value instanceof Date && !Number.isNaN(value.getTime())) {
      return value;
    }
    if (typeof value === "string" || typeof value === "number") {
      const parsed = new Date(value);
      if (!Number.isNaN(parsed.getTime())) {
        return parsed;
      }
    }
  }
  return new Date();
}

async function backfillNullDepartments(
  batchSize: number,
): Promise<number> {
  const types = [
    "verification",
    "job_operations",
    "placements",
    "support",
    "jobseeker",
    "hiring_operations",
    "employer",
  ] as const;

  let updated = 0;
  for (const type of types) {
    const departmentId = await resolveWorkDepartmentId(type);
    if (!departmentId) continue;

    const result = await OperationsWorkItemModel.updateMany(
      {
        type,
        departmentId: null,
        status: { $in: ["queued", "assigned", "in_progress", "waiting"] },
      },
      { $set: { departmentId } },
    );
    updated += result.modifiedCount;
    if (updated > 0 && result.modifiedCount > 0) {
      console.info("[operations-work-reconcile] department backfill", {
        type,
        modified: result.modifiedCount,
        batchSize,
      });
    }
  }
  return updated;
}

async function markSlaBreaches(now: Date = new Date()): Promise<number> {
  const result = await OperationsWorkItemModel.updateMany(
    {
      status: { $in: ["queued", "assigned", "in_progress", "waiting"] },
      slaTargetAt: { $ne: null, $lt: now },
      $or: [{ breachedAt: null }, { breachedAt: { $exists: false } }],
    },
    {
      $set: { breachedAt: now },
      $inc: { revision: 1 },
      $push: {
        history: {
          action: "work.sla_breached",
          at: now,
          actorUserId: null,
          actorName: "SYSTEM",
          fromStatus: null,
          toStatus: null,
          note: "SLA target breached",
          metadata: {},
        },
      },
    },
  );
  return result.modifiedCount;
}

async function reconcileEmployers(
  db: NonNullable<typeof mongoose.connection.db>,
  batchSize: number,
  stats: WorkReconcileStats,
): Promise<void> {
  const filter = {
    $or: [PENDING_VERIFICATION_FILTER, { verificationStatus: "under_review" }],
  };

  let lastId: mongoose.Types.ObjectId | null = null;
  for (;;) {
    const pageFilter: Record<string, unknown> = { ...filter };
    if (lastId) {
      pageFilter._id = { $gt: lastId };
    }

    const employers = await db
      .collection("employers")
      .find(pageFilter)
      .project({
        companyName: 1,
        firstName: 1,
        lastName: 1,
        city: 1,
        state: 1,
        verificationSubmittedAt: 1,
        verificationStatus: 1,
        updatedAt: 1,
        createdAt: 1,
      })
      .sort({ _id: 1 })
      .limit(batchSize)
      .toArray();

    if (employers.length === 0) break;

    for (const emp of employers) {
      stats.employersScanned += 1;
      lastId = emp._id as mongoose.Types.ObjectId;
      try {
        const submittedAt = asDate(
          emp.verificationSubmittedAt,
          emp.updatedAt,
          emp.createdAt,
        );
        const locationLabel = [emp.city, emp.state].filter(Boolean).join(", ");
        const result = await upsertEmployerVerificationWork({
          employerId: String(emp._id),
          companyName: resolveCompanyName(emp as Record<string, unknown>),
          locationLabel,
          submittedAt,
          kind: "reconciled",
        });
        if (result.created) stats.employersCreated += 1;
      } catch (error) {
        stats.errors += 1;
        console.error("[operations-work-reconcile] employer failed", {
          employerId: String(emp._id),
          errorCategory: error instanceof Error ? error.name : "unknown",
        });
      }
    }

    if (employers.length < batchSize) break;
  }
}

async function reconcileJobs(
  db: NonNullable<typeof mongoose.connection.db>,
  batchSize: number,
  stats: WorkReconcileStats,
): Promise<void> {
  const filter = {
    $or: [
      { status: "pending_approval" },
      { liveChangeReviewStatus: "pending_approval" },
    ],
  };

  let lastId: mongoose.Types.ObjectId | null = null;
  for (;;) {
    const pageFilter: Record<string, unknown> = { ...filter };
    if (lastId) {
      pageFilter._id = { $gt: lastId };
    }

    const jobs = await db
      .collection("jobs")
      .find(pageFilter)
      .project({
        jobId: 1,
        publicJobId: 1,
        title: 1,
        jobTitle: 1,
        companyName: 1,
        submittedAt: 1,
        createdAt: 1,
        updatedAt: 1,
        status: 1,
        liveChangeReviewStatus: 1,
      })
      .sort({ _id: 1 })
      .limit(batchSize)
      .toArray();

    if (jobs.length === 0) break;

    for (const job of jobs) {
      stats.jobsScanned += 1;
      lastId = job._id as mongoose.Types.ObjectId;
      try {
        const publicJobId = String(job.jobId ?? job.publicJobId ?? "")
          .trim()
          .toUpperCase();
        if (!publicJobId) continue;

        const submittedAt = asDate(
          job.submittedAt,
          job.updatedAt,
          job.createdAt,
        );
        const kind =
          job.liveChangeReviewStatus === "pending_approval" &&
          job.status !== "pending_approval"
            ? "live_revision"
            : "reconciled";

        const result = await upsertJobModerationWork({
          publicJobId,
          jobMongoId: String(job._id),
          jobTitle: String(job.title ?? job.jobTitle ?? "Job"),
          companyName: String(job.companyName ?? "Employer"),
          kind,
          submittedAt,
        });
        if (result.created) stats.jobsCreated += 1;
      } catch (error) {
        stats.errors += 1;
        console.error("[operations-work-reconcile] job failed", {
          jobId: String(job._id),
          errorCategory: error instanceof Error ? error.name : "unknown",
        });
      }
    }

    if (jobs.length < batchSize) break;
  }
}

async function reconcilePlacements(
  db: NonNullable<typeof mongoose.connection.db>,
  batchSize: number,
  stats: WorkReconcileStats,
): Promise<void> {
  const filter = { status: "selected" };

  let lastId: mongoose.Types.ObjectId | null = null;
  for (;;) {
    const pageFilter: Record<string, unknown> = { ...filter };
    if (lastId) {
      pageFilter._id = { $gt: lastId };
    }

    const apps = await db
      .collection("applications")
      .find(pageFilter)
      .project({
        candidateName: 1,
        jobseekerName: 1,
        companyName: 1,
        jobTitle: 1,
        city: 1,
        state: 1,
        selectedAt: 1,
        statusUpdatedAt: 1,
        updatedAt: 1,
        createdAt: 1,
      })
      .sort({ _id: 1 })
      .limit(batchSize)
      .toArray();

    if (apps.length === 0) break;

    for (const app of apps) {
      stats.placementsScanned += 1;
      lastId = app._id as mongoose.Types.ObjectId;
      try {
        const selectedAt = asDate(
          app.selectedAt,
          app.statusUpdatedAt,
          app.updatedAt,
          app.createdAt,
        );
        const locationLabel = [app.city, app.state].filter(Boolean).join(", ");
        const result = await upsertJoiningPendingWork({
          applicationId: String(app._id),
          candidateName: String(
            app.candidateName ?? app.jobseekerName ?? "",
          ),
          companyName: String(app.companyName ?? ""),
          jobTitle: String(app.jobTitle ?? ""),
          locationLabel,
          selectedAt,
        });
        if (result.created) stats.placementsCreated += 1;
      } catch (error) {
        stats.errors += 1;
        console.error("[operations-work-reconcile] placement failed", {
          applicationId: String(app._id),
          errorCategory: error instanceof Error ? error.name : "unknown",
        });
      }
    }

    if (apps.length < batchSize) break;
  }
}

/**
 * Production-safe, idempotent reconciliation of actionable Ops work.
 * Safe to run repeatedly; uses cursored batches; never resets assignments.
 */
export async function reconcileOpenOperationsWork(options?: {
  batchSize?: number;
}): Promise<WorkReconcileStats> {
  const batchSize = Math.max(1, Math.min(options?.batchSize ?? DEFAULT_BATCH, 500));
  const started = new Date();
  const stats: WorkReconcileStats = {
    startedAt: started.toISOString(),
    finishedAt: "",
    employersScanned: 0,
    employersCreated: 0,
    jobsScanned: 0,
    jobsCreated: 0,
    placementsScanned: 0,
    placementsCreated: 0,
    departmentBackfilled: 0,
    slaBreachesMarked: 0,
    errors: 0,
  };

  await ensureOperationsWorkDepartments();

  const db = mongoose.connection.db;
  if (!db) {
    throw new Error("MongoDB is not connected.");
  }

  stats.departmentBackfilled = await backfillNullDepartments(batchSize);
  await reconcileEmployers(db, batchSize, stats);
  await reconcileJobs(db, batchSize, stats);
  await reconcilePlacements(db, batchSize, stats);
  stats.slaBreachesMarked = await markSlaBreaches();

  stats.finishedAt = new Date().toISOString();
  console.info("[operations-work-reconcile] completed", stats);
  return stats;
}

let reconcileTimer: NodeJS.Timeout | null = null;
let reconcileRunning = false;

/**
 * Periodic reconciliation (same pattern as notification retention).
 * Runs once shortly after boot, then on an interval.
 */
export function startOperationsWorkReconcileScheduler(options?: {
  intervalMs?: number;
  initialDelayMs?: number;
}): () => void {
  const intervalMs = options?.intervalMs ?? 15 * 60 * 1000;
  const initialDelayMs = options?.initialDelayMs ?? 20_000;

  const tick = async () => {
    if (reconcileRunning) return;
    reconcileRunning = true;
    try {
      await reconcileOpenOperationsWork();
    } catch (error) {
      console.error("[operations-work-reconcile] scheduler tick failed", {
        errorCategory: error instanceof Error ? error.name : "unknown",
      });
    } finally {
      reconcileRunning = false;
    }
  };

  const initial = setTimeout(() => {
    void tick();
  }, initialDelayMs);
  initial.unref?.();

  reconcileTimer = setInterval(() => {
    void tick();
  }, intervalMs);
  reconcileTimer.unref?.();

  return () => {
    clearTimeout(initial);
    if (reconcileTimer) {
      clearInterval(reconcileTimer);
      reconcileTimer = null;
    }
  };
}
