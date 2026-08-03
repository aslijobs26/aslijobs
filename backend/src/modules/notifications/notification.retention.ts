import { env } from "../../config/env.js";
import { NotificationModel } from "./notification.model.js";

const MS_PER_DAY = 24 * 60 * 60 * 1000;

/** Conversation/message history rows — never hard-deleted by retention. */
export const NOTIFICATION_CONVERSATION_REFERENCE_TYPE = "application";

export function unreadRetentionMs(): number {
  return env.NOTIFICATION_UNREAD_RETENTION_DAYS * MS_PER_DAY;
}

export function readRetentionMs(): number {
  return env.NOTIFICATION_READ_RETENTION_DAYS * MS_PER_DAY;
}

export function computeUnreadExpiresAt(from: Date = new Date()): Date {
  return new Date(from.getTime() + unreadRetentionMs());
}

export function computeReadExpiresAt(from: Date = new Date()): Date {
  return new Date(from.getTime() + readRetentionMs());
}

/**
 * Active inbox filter: not soft-deleted and not past expiresAt.
 * Legacy rows without expiresAt are treated as active until backfill runs.
 */
export function buildActiveInboxFilter(
  now: Date = new Date(),
): Record<string, unknown> {
  return {
    deletedAt: null,
    $or: [{ expiresAt: { $gt: now } }, { expiresAt: null }],
  };
}

export function computeExpiresAtForDocument(input: {
  createdAt?: Date | null;
  readAt?: Date | null;
}): Date {
  if (input.readAt) {
    return computeReadExpiresAt(input.readAt);
  }
  return computeUnreadExpiresAt(input.createdAt ?? new Date());
}

/**
 * Backfill expiresAt for legacy documents (created before retention shipped).
 * Batched to avoid long locks on large collections.
 */
export async function backfillNotificationExpiresAt(
  limit: number = env.NOTIFICATION_BATCH_DELETE_LIMIT,
): Promise<number> {
  const rows = await NotificationModel.find({
    $or: [{ expiresAt: null }, { expiresAt: { $exists: false } }],
  })
    .select("_id createdAt readAt")
    .limit(limit)
    .lean();

  if (rows.length === 0) {
    return 0;
  }

  const ops = rows.map((row) => ({
    updateOne: {
      filter: { _id: row._id },
      update: {
        $set: {
          expiresAt: computeExpiresAtForDocument({
            createdAt: row.createdAt,
            readAt: row.readAt,
          }),
        },
      },
    },
  }));

  const result = await NotificationModel.bulkWrite(ops, { ordered: false });
  return result.modifiedCount + result.upsertedCount;
}

/**
 * Hard-delete expired / soft-deleted rows that are NOT conversation history.
 * Application-referenced notifications stay in Mongo so Messages timeline works.
 */
export async function purgeEligibleNotifications(
  limit: number = env.NOTIFICATION_BATCH_DELETE_LIMIT,
): Promise<number> {
  const now = new Date();
  const eligible = await NotificationModel.find({
    $and: [
      {
        $or: [
          { expiresAt: { $lte: now } },
          { deletedAt: { $ne: null } },
        ],
      },
      {
        $or: [
          { referenceType: { $exists: false } },
          { referenceType: "" },
          { referenceType: { $ne: NOTIFICATION_CONVERSATION_REFERENCE_TYPE } },
        ],
      },
    ],
  })
    .select("_id")
    .limit(limit)
    .lean();

  if (eligible.length === 0) {
    return 0;
  }

  const ids = eligible.map((row) => row._id);
  const result = await NotificationModel.deleteMany({ _id: { $in: ids } });
  return result.deletedCount;
}

export async function runNotificationRetentionCleanup(): Promise<{
  backfilled: number;
  purged: number;
}> {
  const backfilled = await backfillNotificationExpiresAt();
  const purged = await purgeEligibleNotifications();
  return { backfilled, purged };
}

let cleanupTimer: ReturnType<typeof setInterval> | null = null;
let cleanupRunning = false;

async function safeCleanupTick(): Promise<void> {
  if (cleanupRunning) {
    return;
  }
  cleanupRunning = true;
  try {
    const result = await runNotificationRetentionCleanup();
    if (result.backfilled > 0 || result.purged > 0) {
      console.info(
        `[notifications] retention cleanup backfilled=${result.backfilled} purged=${result.purged}`,
      );
    }
  } catch (error) {
    console.error("[notifications] retention cleanup failed", error);
  } finally {
    cleanupRunning = false;
  }
}

/**
 * Starts periodic retention cleanup. Survives across requests; call once after DB connect.
 * Returns a stop function for graceful shutdown.
 */
export function startNotificationRetentionScheduler(): () => void {
  void safeCleanupTick();

  if (cleanupTimer) {
    clearInterval(cleanupTimer);
  }

  cleanupTimer = setInterval(() => {
    void safeCleanupTick();
  }, env.NOTIFICATION_CLEANUP_INTERVAL_MS);
  cleanupTimer.unref?.();

  return () => {
    if (cleanupTimer) {
      clearInterval(cleanupTimer);
      cleanupTimer = null;
    }
  };
}
