import { env } from "../../config/env.js";
import { JobModel } from "../jobs/job.model.js";
import { clearPublicLocationCountsCache } from "../jobs/public-location-counts.js";
import { scheduleJobModerationAudit } from "../operations/jobs/operations-job-audit.js";
import { OPERATIONS_JOB_AUDIT_ACTIONS } from "../operations/jobs/operations-job-moderation.constants.js";
import { isCashfreeConfigured } from "../payments/cashfree.client.js";
import { paymentService } from "../payments/payment.service.js";
import { invalidateWhatsAppSearchCatalog } from "../whatsapp/whatsapp-search-catalog.js";

const EXPIRE_BATCH_LIMIT = 500;

let sweepTimer: ReturnType<typeof setInterval> | null = null;
let sweepRunning = false;

/**
 * Expires plan-backed listings whose validity has passed.
 * Only jobs paid for by a grant are touched; legacy and complimentary
 * (Operations) jobs never auto-expire.
 */
export async function expirePlanListings(now: Date = new Date()): Promise<number> {
  const due = await JobModel.find({
    subscriptionGrantId: { $ne: null },
    status: { $in: ["active", "paused"] },
    listingValidUntil: { $ne: null, $lte: now },
  })
    .select("_id jobId jobTitle status")
    .limit(EXPIRE_BATCH_LIMIT)
    .lean();

  let expired = 0;
  for (const job of due) {
    const result = await JobModel.updateOne(
      { _id: job._id, status: job.status },
      { $set: { status: "expired", lastStatusChangedAt: now } },
    );
    if (result.modifiedCount === 0) {
      continue;
    }
    expired += 1;
    scheduleJobModerationAudit({
      actorUserId: null,
      actorName: "System",
      action: OPERATIONS_JOB_AUDIT_ACTIONS.EXPIRED,
      publicJobId: job.jobId,
      jobTitle: job.jobTitle?.trim() || "Untitled job",
      previousStatus: job.status,
      nextStatus: "expired",
      metadata: { actorType: "system", source: "subscription_listing_validity" },
    });
  }

  if (expired > 0) {
    clearPublicLocationCountsCache();
    invalidateWhatsAppSearchCatalog("job_status");
  }
  return expired;
}

async function sweepTick(): Promise<void> {
  if (sweepRunning) {
    return;
  }
  sweepRunning = true;
  try {
    const expired = await expirePlanListings();
    const reconciled = isCashfreeConfigured() ? await paymentService.reconcileStaleOrders() : 0;
    if (expired > 0 || reconciled > 0) {
      console.info("[subscriptions] sweep", { expired, reconciled });
    }
  } catch (error) {
    console.error("[subscriptions] sweep failed", {
      errorCategory: error instanceof Error ? error.name : "unknown",
      message: error instanceof Error ? error.message : String(error),
    });
  } finally {
    sweepRunning = false;
  }
}

export function startSubscriptionSweepScheduler(): () => void {
  void sweepTick();
  if (sweepTimer) {
    clearInterval(sweepTimer);
  }
  sweepTimer = setInterval(() => {
    void sweepTick();
  }, env.SUBSCRIPTION_SWEEP_INTERVAL_MS);
  sweepTimer.unref?.();

  return () => {
    if (sweepTimer) {
      clearInterval(sweepTimer);
      sweepTimer = null;
    }
  };
}
