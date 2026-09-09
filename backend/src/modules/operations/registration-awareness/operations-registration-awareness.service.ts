import mongoose from "mongoose";
import { HTTP_STATUS } from "../../../constants/http-status.js";
import { AppError } from "../../../middleware/error.middleware.js";
import { EmployerModel } from "../../employers/employer.model.js";
import { JobSeekerModel } from "../../job-seekers/job-seeker.model.js";
import { JobModel } from "../../jobs/job.model.js";
import {
  canOperationsPermission,
  type OperationsPermissionMap,
} from "../auth/operations-rbac.js";
import { PENDING_VERIFICATION_FILTER } from "../verifications/operations-verifications-analytics.js";
import {
  OPERATIONS_REGISTRATION_RECENT_LIMIT,
  type OperationsRegistrationEntityType,
} from "./operations-registration-awareness.constants.js";
import { OperationsNotificationModel } from "./operations-notification.model.js";
import {
  formatRelativeTime,
  startOfKolkataDay,
  startOfKolkataWeek,
  startOfNextKolkataDay,
} from "./operations-registration-time.js";
import type {
  OperationsNavBadgeCounts,
  OperationsNotificationListItem,
  OperationsNotificationListResult,
  OperationsRecentCandidateRegistration,
  OperationsRecentEmployerRegistration,
  OperationsRegistrationMetricBlock,
  OperationsRegistrationMetricsResult,
} from "./operations-registration-awareness.types.js";

function text(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function formatEmployerDisplayId(id: string): string {
  const cleaned = id.replace(/[^a-fA-F0-9]/g, "");
  const segment =
    cleaned.length >= 8 ? cleaned.slice(-8).toUpperCase() : cleaned.toUpperCase();
  return `EMP-${segment || "00000000"}`;
}

function formatCandidateDisplayId(id: string): string {
  const cleaned = id.replace(/[^a-fA-F0-9]/g, "");
  const segment =
    cleaned.length >= 8 ? cleaned.slice(-8).toUpperCase() : cleaned.toUpperCase();
  return `AJ-CAN-${segment || "00000000"}`;
}

function resolveEmployerDisplayName(employer: {
  companyName?: string | null;
  establishmentName?: string | null;
  firstName?: string | null;
  lastName?: string | null;
}): string {
  const companyName = text(employer.companyName);
  const establishmentName = text(employer.establishmentName);
  const personName = [text(employer.firstName), text(employer.lastName)]
    .filter(Boolean)
    .join(" ")
    .trim();

  return companyName || establishmentName || personName || "Employer";
}

function verificationLabel(status: string): string {
  switch (status) {
    case "verified":
      return "Verified";
    case "rejected":
      return "Rejected";
    case "pending":
    default:
      return "Pending Verification";
  }
}

function profileStatusFromRegistration(
  registrationStatus: string | undefined,
): { status: string; label: string } {
  if (registrationStatus === "COMPLETED") {
    return { status: "complete", label: "Profile complete" };
  }
  return { status: "incomplete", label: "Profile incomplete" };
}

async function countPendingApprovalJobs(): Promise<number> {
  const [pendingStatus, pendingLiveChange] = await Promise.all([
    JobModel.countDocuments({ status: "pending_approval" }),
    JobModel.countDocuments({ liveChangeReviewStatus: "pending_approval" }),
  ]);
  return pendingStatus + pendingLiveChange;
}

/**
 * Nav badge: employers still awaiting a verification decision.
 * Uses the same PENDING_VERIFICATION_FILTER as Verifications analytics
 * (excludes WhatsApp+completed verified heuristic; includes pending + under review).
 */
async function countPendingVerifications(): Promise<number> {
  return EmployerModel.countDocuments(PENDING_VERIFICATION_FILTER);
}

async function buildEmployerMetrics(
  now: Date,
): Promise<OperationsRegistrationMetricBlock> {
  const todayStart = startOfKolkataDay(now);
  const todayEnd = startOfNextKolkataDay(now);
  const weekStart = startOfKolkataWeek(now);

  const completedFilter = { registrationStatus: "completed" as const };

  const [newCount, today, thisWeek] = await Promise.all([
    EmployerModel.countDocuments({
      ...completedFilter,
      "operationsRegistrationAwareness.state": "new",
    }),
    EmployerModel.countDocuments({
      ...completedFilter,
      "operationsRegistrationAwareness.registeredAt": {
        $gte: todayStart,
        $lt: todayEnd,
      },
    }),
    EmployerModel.countDocuments({
      ...completedFilter,
      "operationsRegistrationAwareness.registeredAt": {
        $gte: weekStart,
        $lt: todayEnd,
      },
    }),
  ]);

  return { newCount, today, thisWeek };
}

async function buildCandidateMetrics(
  now: Date,
): Promise<OperationsRegistrationMetricBlock> {
  const todayStart = startOfKolkataDay(now);
  const todayEnd = startOfNextKolkataDay(now);
  const weekStart = startOfKolkataWeek(now);

  const completedFilter = { registrationStatus: "COMPLETED" as const };

  const [newCount, today, thisWeek] = await Promise.all([
    JobSeekerModel.countDocuments({
      ...completedFilter,
      "operationsRegistrationAwareness.state": "new",
    }),
    JobSeekerModel.countDocuments({
      ...completedFilter,
      "operationsRegistrationAwareness.registeredAt": {
        $gte: todayStart,
        $lt: todayEnd,
      },
    }),
    JobSeekerModel.countDocuments({
      ...completedFilter,
      "operationsRegistrationAwareness.registeredAt": {
        $gte: weekStart,
        $lt: todayEnd,
      },
    }),
  ]);

  return { newCount, today, thisWeek };
}

async function loadRecentEmployers(
  now: Date,
  limit: number,
): Promise<OperationsRecentEmployerRegistration[]> {
  const docs = await EmployerModel.find({
    registrationStatus: "completed",
    "operationsRegistrationAwareness.registeredAt": { $exists: true },
  })
    .select(
      "companyName establishmentName firstName lastName verificationStatus operationsRegistrationAwareness",
    )
    .sort({ "operationsRegistrationAwareness.registeredAt": -1 })
    .limit(limit)
    .lean();

  return docs.map((doc) => {
    const id = String(doc._id);
    const registeredAt =
      doc.operationsRegistrationAwareness?.registeredAt ?? null;
    const registeredIso = registeredAt
      ? new Date(registeredAt).toISOString()
      : new Date().toISOString();
    const vStatus = text(doc.verificationStatus) || "pending";
    const awarenessState =
      doc.operationsRegistrationAwareness?.state === "seen" ? "seen" : "new";

    return {
      id,
      displayId: formatEmployerDisplayId(id),
      displayName: resolveEmployerDisplayName(doc),
      registeredAt: registeredIso,
      registeredRelative: formatRelativeTime(registeredAt, now),
      verificationStatus: vStatus,
      verificationStatusLabel: verificationLabel(vStatus),
      awarenessState,
      actionPath: `/operations/employers/${id}`,
    };
  });
}

async function loadRecentCandidates(
  now: Date,
  limit: number,
): Promise<OperationsRecentCandidateRegistration[]> {
  const docs = await JobSeekerModel.find({
    registrationStatus: "COMPLETED",
    "operationsRegistrationAwareness.registeredAt": { $exists: true },
  })
    .select("fullName registrationStatus operationsRegistrationAwareness")
    .sort({ "operationsRegistrationAwareness.registeredAt": -1 })
    .limit(limit)
    .lean();

  return docs.map((doc) => {
    const id = String(doc._id);
    const registeredAt =
      doc.operationsRegistrationAwareness?.registeredAt ?? null;
    const registeredIso = registeredAt
      ? new Date(registeredAt).toISOString()
      : new Date().toISOString();
    const profile = profileStatusFromRegistration(doc.registrationStatus);
    const awarenessState =
      doc.operationsRegistrationAwareness?.state === "seen" ? "seen" : "new";

    return {
      id,
      displayId: formatCandidateDisplayId(id),
      displayName: text(doc.fullName) || "Candidate",
      registeredAt: registeredIso,
      registeredRelative: formatRelativeTime(registeredAt, now),
      profileStatus: profile.status,
      profileStatusLabel: profile.label,
      awarenessState,
      actionPath: `/operations/candidates/${id}`,
    };
  });
}

async function countUnreadNotifications(userId: string): Promise<number> {
  if (!mongoose.Types.ObjectId.isValid(userId)) {
    return 0;
  }
  const userObjectId = new mongoose.Types.ObjectId(userId);
  return OperationsNotificationModel.countDocuments({
    "reads.userId": { $ne: userObjectId },
  });
}

export const operationsRegistrationAwarenessService = {
  async getMetrics(input: {
    permissions: OperationsPermissionMap | undefined;
    userId: string;
    recentLimit?: number;
  }): Promise<OperationsRegistrationMetricsResult> {
    const now = new Date();
    const canEmployers = canOperationsPermission(
      input.permissions,
      "employers",
      "read",
    );
    const canCandidates = canOperationsPermission(
      input.permissions,
      "candidates",
      "read",
    );
    const canJobs = canOperationsPermission(input.permissions, "jobs", "read");
    const canVerifications = canOperationsPermission(
      input.permissions,
      "verifications",
      "read",
    );

    const recentLimit = Math.min(
      Math.max(input.recentLimit ?? OPERATIONS_REGISTRATION_RECENT_LIMIT, 1),
      20,
    );

    const [
      employers,
      candidates,
      pendingJobs,
      pendingVerifications,
      recentEmployers,
      recentCandidates,
      unreadNotifications,
    ] = await Promise.all([
      canEmployers ? buildEmployerMetrics(now) : Promise.resolve(null),
      canCandidates ? buildCandidateMetrics(now) : Promise.resolve(null),
      canJobs ? countPendingApprovalJobs() : Promise.resolve(null),
      canVerifications ? countPendingVerifications() : Promise.resolve(null),
      canEmployers
        ? loadRecentEmployers(now, recentLimit)
        : Promise.resolve([]),
      canCandidates
        ? loadRecentCandidates(now, recentLimit)
        : Promise.resolve([]),
      countUnreadNotifications(input.userId),
    ]);

    const badges: OperationsNavBadgeCounts = {
      newEmployers: employers?.newCount ?? null,
      newCandidates: candidates?.newCount ?? null,
      pendingJobs,
      pendingVerifications,
      unreadNotifications,
    };

    return {
      employers,
      candidates,
      badges,
      recent: {
        employers: recentEmployers,
        candidates: recentCandidates,
      },
    };
  },

  async getBadgeCounts(input: {
    permissions: OperationsPermissionMap | undefined;
    userId: string;
  }): Promise<OperationsNavBadgeCounts> {
    const metrics = await this.getMetrics({
      ...input,
      recentLimit: 1,
    });
    return metrics.badges;
  },

  async markEntitySeen(input: {
    entityType: OperationsRegistrationEntityType;
    entityId: string;
    userId: string;
  }): Promise<{ state: "seen"; alreadySeen: boolean }> {
    if (!mongoose.Types.ObjectId.isValid(input.entityId)) {
      throw new AppError("Registration entity not found.", HTTP_STATUS.NOT_FOUND);
    }

    const userObjectId = mongoose.Types.ObjectId.isValid(input.userId)
      ? new mongoose.Types.ObjectId(input.userId)
      : null;

    const filter = {
      _id: input.entityId,
      "operationsRegistrationAwareness.state": "new",
    };

    const update = {
      $set: {
        "operationsRegistrationAwareness.state": "seen",
        "operationsRegistrationAwareness.firstSeenAt": new Date(),
        "operationsRegistrationAwareness.firstSeenBy": userObjectId,
      },
    };

    if (input.entityType === "employer") {
      const result = await EmployerModel.updateOne(filter, update);
      if (result.matchedCount === 0) {
        const exists = await EmployerModel.exists({ _id: input.entityId });
        if (!exists) {
          throw new AppError("Employer not found.", HTTP_STATUS.NOT_FOUND);
        }
        return { state: "seen", alreadySeen: true };
      }
      return { state: "seen", alreadySeen: false };
    }

    const result = await JobSeekerModel.updateOne(filter, update);
    if (result.matchedCount === 0) {
      const exists = await JobSeekerModel.exists({ _id: input.entityId });
      if (!exists) {
        throw new AppError("Candidate not found.", HTTP_STATUS.NOT_FOUND);
      }
      return { state: "seen", alreadySeen: true };
    }
    return { state: "seen", alreadySeen: false };
  },

  async markEntitiesSeen(input: {
    entityType: OperationsRegistrationEntityType;
    entityIds: string[];
    userId: string;
  }): Promise<{ updatedCount: number }> {
    const validIds = input.entityIds.filter((id) =>
      mongoose.Types.ObjectId.isValid(id),
    );
    if (validIds.length === 0) {
      return { updatedCount: 0 };
    }

    const userObjectId = mongoose.Types.ObjectId.isValid(input.userId)
      ? new mongoose.Types.ObjectId(input.userId)
      : null;

    const filter = {
      _id: { $in: validIds },
      "operationsRegistrationAwareness.state": "new",
    };
    const update = {
      $set: {
        "operationsRegistrationAwareness.state": "seen",
        "operationsRegistrationAwareness.firstSeenAt": new Date(),
        "operationsRegistrationAwareness.firstSeenBy": userObjectId,
      },
    };

    if (input.entityType === "employer") {
      const result = await EmployerModel.updateMany(filter, update);
      return { updatedCount: result.modifiedCount };
    }

    const result = await JobSeekerModel.updateMany(filter, update);
    return { updatedCount: result.modifiedCount };
  },

  async listNotifications(input: {
    userId: string;
    limit?: number;
  }): Promise<OperationsNotificationListResult> {
    const limit = Math.min(Math.max(input.limit ?? 30, 1), 100);
    const userObjectId = mongoose.Types.ObjectId.isValid(input.userId)
      ? new mongoose.Types.ObjectId(input.userId)
      : null;

    const [docs, unreadCount] = await Promise.all([
      OperationsNotificationModel.find({})
        .sort({ createdAt: -1 })
        .limit(limit)
        .lean(),
      countUnreadNotifications(input.userId),
    ]);

    const items: OperationsNotificationListItem[] = docs.map((doc) => {
      const isRead = userObjectId
        ? (doc.reads ?? []).some(
            (read) => String(read.userId) === String(userObjectId),
          )
        : false;

      return {
        id: String(doc._id),
        type: doc.type,
        title: doc.title,
        body: doc.body,
        entityType: doc.entityType,
        entityId: doc.entityId,
        actionPath: doc.actionPath,
        actorName: doc.actorName || "SYSTEM",
        createdAt: doc.createdAt
          ? new Date(doc.createdAt).toISOString()
          : new Date().toISOString(),
        isRead,
      };
    });

    return { items, unreadCount };
  },

  async markNotificationRead(input: {
    notificationId: string;
    userId: string;
  }): Promise<{ isRead: boolean }> {
    if (!mongoose.Types.ObjectId.isValid(input.notificationId)) {
      throw new AppError("Notification not found.", HTTP_STATUS.NOT_FOUND);
    }
    if (!mongoose.Types.ObjectId.isValid(input.userId)) {
      throw new AppError("Unauthorized", HTTP_STATUS.UNAUTHORIZED);
    }

    const userObjectId = new mongoose.Types.ObjectId(input.userId);
    const result = await OperationsNotificationModel.updateOne(
      {
        _id: input.notificationId,
        "reads.userId": { $ne: userObjectId },
      },
      {
        $push: {
          reads: {
            userId: userObjectId,
            readAt: new Date(),
          },
        },
      },
    );

    if (result.matchedCount === 0) {
      const exists = await OperationsNotificationModel.exists({
        _id: input.notificationId,
      });
      if (!exists) {
        throw new AppError("Notification not found.", HTTP_STATUS.NOT_FOUND);
      }
    }

    return { isRead: true };
  },
};

/** Payload applied on the entity document at successful registration completion. */
export function buildNewRegistrationAwarenessPayload(registeredAt: Date = new Date()) {
  return {
    state: "new" as const,
    registeredAt,
    firstSeenAt: null,
    firstSeenBy: null,
  };
}

export function formatEmployerRegistrationDisplayId(id: string): string {
  return formatEmployerDisplayId(id);
}

export function formatCandidateRegistrationDisplayId(id: string): string {
  return formatCandidateDisplayId(id);
}

export function resolveEmployerRegistrationDisplayName(employer: {
  companyName?: string | null;
  establishmentName?: string | null;
  firstName?: string | null;
  lastName?: string | null;
}): string {
  return resolveEmployerDisplayName(employer);
}
