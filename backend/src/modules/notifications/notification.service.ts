import mongoose from "mongoose";
import { HTTP_STATUS } from "../../constants/http-status.js";
import { AppError } from "../../middleware/error.middleware.js";
import { APPLICATION_EVENT_NAMES } from "../applications/application.constants.js";
import { NOTIFICATION_CHANNEL_DEFAULTS } from "./notification.constants.js";
import { NotificationModel } from "./notification.model.js";
import {
  buildActiveInboxFilter,
  computeReadExpiresAt,
  computeUnreadExpiresAt,
} from "./notification.retention.js";
import type {
  ApplicationNotificationContext,
  CreateNotificationInput,
  NotificationCategory,
  NotificationConversationDirection,
  NotificationConversationListItem,
  NotificationConversationListResult,
  NotificationConversationTimelineItem,
  NotificationConversationTimelineResult,
  NotificationListItem,
  NotificationListResult,
  NotificationRecipientType,
  NotificationType,
} from "./notification.types.js";
import { ApplicationModel } from "../applications/application.model.js";

type ListNotificationsInput = {
  recipientType: NotificationRecipientType;
  recipientId: string;
  page: number;
  limit: number;
  search: string;
  readStatus: "all" | "unread" | "read";
  category: "all" | NotificationCategory;
  referenceId?: string;
};

function buildInterviewNotificationBody(input: {
  prefix: string;
  interview?: ApplicationNotificationContext["interview"];
}): string {
  const interview = input.interview;
  if (!interview) {
    return `${input.prefix}.`;
  }

  const parts: string[] = [];
  if (interview.date) {
    parts.push(`Date: ${interview.date}`);
  }
  if (interview.time) {
    parts.push(`Time: ${interview.time}`);
  }
  if (interview.mode) {
    parts.push(`Mode: ${interview.mode}`);
  }
  if (interview.mode === "online" && interview.meetingLink) {
    parts.push(`Meeting link: ${interview.meetingLink}`);
  } else if (interview.mode === "offline" && interview.venue) {
    parts.push(`Venue: ${interview.venue}`);
  }

  if (parts.length === 0) {
    return `${input.prefix}.`;
  }

  return `${input.prefix}. ${parts.join(" · ")}.`;
}

function toListItem(doc: {
  _id: mongoose.Types.ObjectId | string;
  type: NotificationType;
  category: NotificationCategory;
  title: string;
  body: string;
  priority: NotificationListItem["priority"];
  referenceType?: string;
  referenceId?: string;
  actionPath?: string;
  readAt?: Date | null;
  createdAt?: Date;
}): NotificationListItem {
  return {
    id: String(doc._id),
    type: doc.type,
    category: doc.category,
    title: doc.title,
    body: doc.body,
    priority: doc.priority,
    referenceType: doc.referenceType ?? "",
    referenceId: doc.referenceId ?? "",
    actionPath: doc.actionPath ?? "",
    isRead: Boolean(doc.readAt),
    readAt: doc.readAt ? doc.readAt.toISOString() : null,
    createdAt: doc.createdAt ? doc.createdAt.toISOString() : new Date().toISOString(),
  };
}

/** Candidate-originated events → incoming. Employer workflow events → outgoing. */
function conversationDirectionForType(
  type: NotificationType,
): NotificationConversationDirection {
  switch (type) {
    case "application_received":
    case "application_submitted":
    case "candidate_withdrawn":
    case "application_withdrawn":
      return "incoming";
    default:
      return "outgoing";
  }
}

/**
 * Paired seeker/employer notifications for the same hiring event.
 * Canonical key collapses mirrors so the timeline shows one bubble.
 */
function conversationEventKey(type: NotificationType): string {
  switch (type) {
    case "application_submitted":
    case "application_received":
      return "application_received";
    case "application_withdrawn":
    case "candidate_withdrawn":
      return "candidate_withdrawn";
    default:
      return type;
  }
}

type LeanNotificationRow = {
  _id: mongoose.Types.ObjectId;
  recipientType: NotificationRecipientType;
  type: NotificationType;
  category: NotificationCategory;
  title: string;
  body: string;
  priority: NotificationListItem["priority"];
  referenceType?: string;
  referenceId?: string;
  actionPath?: string;
  readAt?: Date | null;
  createdAt?: Date;
};

function preferConversationRow(
  current: LeanNotificationRow,
  candidate: LeanNotificationRow,
): LeanNotificationRow {
  if (
    candidate.recipientType === "employer" &&
    current.recipientType !== "employer"
  ) {
    return candidate;
  }
  return current;
}

/**
 * Seeker-facing copy adapted for the employer conversation viewer
 * when no employer mirror notification exists.
 */
function employerConversationCopy(row: LeanNotificationRow): {
  title: string;
  body: string;
} {
  if (row.recipientType === "employer") {
    return { title: row.title, body: row.body };
  }

  switch (row.type) {
    case "application_viewed":
      return {
        title: "Application Viewed",
        body: "You viewed this application.",
      };
    case "application_under_review":
      return {
        title: "Under Review",
        body: "You moved this application to Under Review.",
      };
    case "application_shortlisted":
      return {
        title: "Candidate Shortlisted",
        body: "You shortlisted this candidate.",
      };
    case "interview_scheduled":
      return {
        title: "Interview Scheduled",
        body: row.body.replace(
          /^An interview was scheduled/,
          "Interview scheduled",
        ),
      };
    case "interview_updated":
      return {
        title: "Interview Updated",
        body: row.body.replace(
          /^Interview details were updated/,
          "Interview details updated",
        ),
      };
    case "interview_completed":
      return {
        title: "Interview Completed",
        body: "You marked this interview as completed.",
      };
    case "interview_cancelled":
      return {
        title: "Interview Cancelled",
        body: row.body.replace(/^Your interview/, "Interview"),
      };
    case "offer_sent":
      return {
        title: "Offer Sent",
        body: row.body.replace(/^You received an offer/, "Offer sent"),
      };
    case "application_selected":
      return {
        title: "Candidate Selected",
        body: "You marked this candidate as selected.",
      };
    case "application_joined":
      return {
        title: "Candidate Joined",
        body: "You marked this candidate as joined.",
      };
    case "application_rejected":
      return {
        title: "Application Rejected",
        body: "You rejected this application.",
      };
    case "application_submitted":
      return {
        title: "Application Submitted",
        body: "Candidate submitted an application.",
      };
    case "application_withdrawn":
      return {
        title: "Candidate Withdrawn",
        body: "Candidate withdrew this application.",
      };
    default:
      return { title: row.title, body: row.body };
  }
}

/**
 * Deduplicate mirrored seeker/employer notifications for one application
 * into a single chronological conversation timeline.
 */
function buildUnifiedConversationTimeline(
  rows: LeanNotificationRow[],
): NotificationConversationTimelineItem[] {
  const sorted = [...rows].sort((left, right) => {
    const leftTime = left.createdAt?.getTime() ?? 0;
    const rightTime = right.createdAt?.getTime() ?? 0;
    return leftTime - rightTime;
  });

  const clusters: LeanNotificationRow[][] = [];
  const WINDOW_MS = 5_000;

  for (const row of sorted) {
    const key = conversationEventKey(row.type);
    const createdAt = row.createdAt?.getTime() ?? 0;
    const lastCluster = clusters[clusters.length - 1];
    const lastRow = lastCluster?.[0];
    const lastKey = lastRow ? conversationEventKey(lastRow.type) : null;
    const lastTime = lastRow?.createdAt?.getTime() ?? 0;

    if (
      lastCluster &&
      lastKey === key &&
      Math.abs(createdAt - lastTime) <= WINDOW_MS
    ) {
      lastCluster.push(row);
    } else {
      clusters.push([row]);
    }
  }

  return clusters.map((cluster) => {
    const chosen = cluster.reduce(preferConversationRow);
    const copy = employerConversationCopy(chosen);
    const base = toListItem(chosen);
    return {
      ...base,
      title: copy.title,
      body: copy.body,
      direction: conversationDirectionForType(chosen.type),
    };
  });
}

function resolveConversationDateRange(input: {
  quickDate: string;
  dateFrom: string;
  dateTo: string;
}): { from: Date; to: Date } | null {
  const now = new Date();
  const startOfDay = (date: Date) => {
    const next = new Date(date);
    next.setHours(0, 0, 0, 0);
    return next;
  };
  const endOfDay = (date: Date) => {
    const next = new Date(date);
    next.setHours(23, 59, 59, 999);
    return next;
  };

  switch (input.quickDate) {
    case "today":
      return { from: startOfDay(now), to: endOfDay(now) };
    case "yesterday": {
      const yesterday = new Date(now);
      yesterday.setDate(now.getDate() - 1);
      return { from: startOfDay(yesterday), to: endOfDay(yesterday) };
    }
    case "last_7_days": {
      const from = startOfDay(now);
      from.setDate(from.getDate() - 6);
      return { from, to: endOfDay(now) };
    }
    case "last_30_days": {
      const from = startOfDay(now);
      from.setDate(from.getDate() - 29);
      return { from, to: endOfDay(now) };
    }
    case "this_month": {
      const from = startOfDay(new Date(now.getFullYear(), now.getMonth(), 1));
      return { from, to: endOfDay(now) };
    }
    case "last_month": {
      const from = startOfDay(
        new Date(now.getFullYear(), now.getMonth() - 1, 1),
      );
      const to = endOfDay(new Date(now.getFullYear(), now.getMonth(), 0));
      return { from, to };
    }
    case "custom": {
      const fromRaw = input.dateFrom.trim();
      const toRaw = input.dateTo.trim();
      if (!fromRaw && !toRaw) {
        return null;
      }
      const from = fromRaw
        ? startOfDay(new Date(`${fromRaw}T00:00:00`))
        : new Date(0);
      const to = toRaw ? endOfDay(new Date(`${toRaw}T00:00:00`)) : endOfDay(now);
      if (Number.isNaN(from.getTime()) || Number.isNaN(to.getTime())) {
        return null;
      }
      return { from, to };
    }
    default:
      return null;
  }
}

/**
 * Future channel adapters (WhatsApp / email / push) should plug in here
 * without changing domain callers.
 */
async function deliverChannels(
  _notificationId: string,
  channels: CreateNotificationInput["channels"],
): Promise<void> {
  const resolved = {
    ...NOTIFICATION_CHANNEL_DEFAULTS,
    ...channels,
  };

  if (resolved.whatsapp || resolved.email || resolved.push) {
    // Channel providers are not wired in Phase 7.
  }
}

export class NotificationService {
  async createNotification(input: CreateNotificationInput) {
    if (!mongoose.Types.ObjectId.isValid(input.recipientId)) {
      throw new AppError("Invalid recipient", HTTP_STATUS.BAD_REQUEST);
    }

    const now = new Date();
    const notification = await NotificationModel.create({
      recipientType: input.recipientType,
      recipientId: input.recipientId,
      type: input.type,
      category: input.category,
      title: input.title.trim(),
      body: input.body.trim(),
      priority: input.priority ?? "normal",
      referenceType: input.referenceType ?? "",
      referenceId: input.referenceId ?? "",
      actionPath: input.actionPath ?? "",
      channels: {
        ...NOTIFICATION_CHANNEL_DEFAULTS,
        ...input.channels,
      },
      metadata: input.metadata ?? {},
      readAt: null,
      deletedAt: null,
      expiresAt: computeUnreadExpiresAt(now),
    });

    await deliverChannels(notification._id.toString(), input.channels);

    return toListItem(notification);
  }

  async listForRecipient(
    input: ListNotificationsInput,
  ): Promise<NotificationListResult> {
    if (!mongoose.Types.ObjectId.isValid(input.recipientId)) {
      throw new AppError("Unauthorized", HTTP_STATUS.UNAUTHORIZED);
    }

    const now = new Date();
    const filterClauses: Record<string, unknown>[] = [
      {
        recipientType: input.recipientType,
        recipientId: input.recipientId,
      },
      buildActiveInboxFilter(now),
    ];

    if (input.readStatus === "unread") {
      filterClauses.push({ readAt: null });
    } else if (input.readStatus === "read") {
      filterClauses.push({ readAt: { $ne: null } });
    }

    if (input.category !== "all") {
      filterClauses.push({ category: input.category });
    }

    const referenceId = input.referenceId?.trim() ?? "";
    if (referenceId) {
      filterClauses.push({
        referenceType: "application",
        referenceId,
      });
    }

    const search = input.search.trim();
    if (search) {
      filterClauses.push({
        $or: [
          { title: { $regex: search, $options: "i" } },
          { body: { $regex: search, $options: "i" } },
        ],
      });
    }

    const filter: Record<string, unknown> =
      filterClauses.length === 1
        ? filterClauses[0]!
        : { $and: filterClauses };

    const unreadFilter: Record<string, unknown> = {
      $and: [
        {
          recipientType: input.recipientType,
          recipientId: input.recipientId,
          readAt: null,
        },
        buildActiveInboxFilter(now),
      ],
    };

    const [total, unreadCount, rows] = await Promise.all([
      NotificationModel.countDocuments(filter),
      NotificationModel.countDocuments(unreadFilter),
      NotificationModel.find(filter)
        .sort({ createdAt: -1 })
        .skip((input.page - 1) * input.limit)
        .limit(input.limit)
        .lean(),
    ]);

    return {
      notifications: rows.map((row) =>
        toListItem({
          ...row,
          type: row.type as NotificationType,
          category: row.category as NotificationCategory,
          priority: row.priority as NotificationListItem["priority"],
        }),
      ),
      pagination: {
        page: input.page,
        limit: input.limit,
        total,
        totalPages: Math.max(1, Math.ceil(total / input.limit)),
      },
      unreadCount,
    };
  }

  async getUnreadCount(input: {
    recipientType: NotificationRecipientType;
    recipientId: string;
  }): Promise<{ unreadCount: number }> {
    if (!mongoose.Types.ObjectId.isValid(input.recipientId)) {
      throw new AppError("Unauthorized", HTTP_STATUS.UNAUTHORIZED);
    }

    const unreadCount = await NotificationModel.countDocuments({
      $and: [
        {
          recipientType: input.recipientType,
          recipientId: input.recipientId,
          readAt: null,
        },
        buildActiveInboxFilter(),
      ],
    });

    return { unreadCount };
  }

  async markAsRead(input: {
    recipientType: NotificationRecipientType;
    recipientId: string;
    notificationId: string;
  }): Promise<{ notification: NotificationListItem }> {
    if (
      !mongoose.Types.ObjectId.isValid(input.recipientId) ||
      !mongoose.Types.ObjectId.isValid(input.notificationId)
    ) {
      throw new AppError("Notification not found", HTTP_STATUS.NOT_FOUND);
    }

    const now = new Date();
    const notification = await NotificationModel.findOne({
      $and: [
        {
          _id: input.notificationId,
          recipientType: input.recipientType,
          recipientId: input.recipientId,
        },
        buildActiveInboxFilter(now),
      ],
    });

    if (!notification) {
      throw new AppError("Notification not found", HTTP_STATUS.NOT_FOUND);
    }

    if (!notification.readAt) {
      const readAt = new Date();
      notification.readAt = readAt;
      notification.expiresAt = computeReadExpiresAt(readAt);
      await notification.save();
    }

    return { notification: toListItem(notification) };
  }

  async markAllAsRead(input: {
    recipientType: NotificationRecipientType;
    recipientId: string;
  }): Promise<{ updatedCount: number }> {
    if (!mongoose.Types.ObjectId.isValid(input.recipientId)) {
      throw new AppError("Unauthorized", HTTP_STATUS.UNAUTHORIZED);
    }

    const readAt = new Date();
    const result = await NotificationModel.updateMany(
      {
        $and: [
          {
            recipientType: input.recipientType,
            recipientId: input.recipientId,
            readAt: null,
          },
          buildActiveInboxFilter(readAt),
        ],
      },
      {
        $set: {
          readAt,
          expiresAt: computeReadExpiresAt(readAt),
        },
      },
    );

    return { updatedCount: result.modifiedCount };
  }

  async deleteForRecipient(input: {
    recipientType: NotificationRecipientType;
    recipientId: string;
    notificationId: string;
  }): Promise<{ deleted: true }> {
    if (
      !mongoose.Types.ObjectId.isValid(input.recipientId) ||
      !mongoose.Types.ObjectId.isValid(input.notificationId)
    ) {
      throw new AppError("Notification not found", HTTP_STATUS.NOT_FOUND);
    }

    const result = await NotificationModel.updateOne(
      {
        _id: input.notificationId,
        recipientType: input.recipientType,
        recipientId: input.recipientId,
        deletedAt: null,
      },
      { $set: { deletedAt: new Date() } },
    );

    if (result.matchedCount === 0) {
      throw new AppError("Notification not found", HTTP_STATUS.NOT_FOUND);
    }

    return { deleted: true };
  }

  async clearAllForRecipient(input: {
    recipientType: NotificationRecipientType;
    recipientId: string;
  }): Promise<{ clearedCount: number }> {
    if (!mongoose.Types.ObjectId.isValid(input.recipientId)) {
      throw new AppError("Unauthorized", HTTP_STATUS.UNAUTHORIZED);
    }

    const now = new Date();
    const result = await NotificationModel.updateMany(
      {
        $and: [
          {
            recipientType: input.recipientType,
            recipientId: input.recipientId,
          },
          buildActiveInboxFilter(now),
        ],
      },
      { $set: { deletedAt: now } },
    );

    return { clearedCount: result.modifiedCount };
  }

  /**
   * Groups employer notifications by application into conversation threads.
   * Joins application + job for candidate/job labels. Does not duplicate notifications.
   */
  async listConversationsForEmployer(input: {
    employerId: string;
    page: number;
    limit: number;
    search: string;
    readStatus: "all" | "unread" | "read";
    category: "all" | NotificationCategory;
    publicJobId?: string;
    applicationStatus?: string;
    hasType?: string;
    employerAction?: string;
    candidateAction?: string;
    conversationType?: string;
    quickDate?: string;
    dateFrom?: string;
    dateTo?: string;
    sort?: string;
  }): Promise<NotificationConversationListResult> {
    if (!mongoose.Types.ObjectId.isValid(input.employerId)) {
      throw new AppError("Unauthorized", HTTP_STATUS.UNAUTHORIZED);
    }

    const employerObjectId = new mongoose.Types.ObjectId(input.employerId);
    const inboxNow = new Date();
    const match: Record<string, unknown> = {
      recipientType: "employer",
      recipientId: employerObjectId,
      referenceType: "application",
      referenceId: { $nin: ["", null] },
    };

    if (input.category !== "all") {
      match.category = input.category;
    }

    const dateRange = resolveConversationDateRange({
      quickDate: input.quickDate ?? "all",
      dateFrom: input.dateFrom ?? "",
      dateTo: input.dateTo ?? "",
    });
    if (dateRange) {
      match.createdAt = {
        $gte: dateRange.from,
        $lte: dateRange.to,
      };
    }

    const search = input.search.trim();
    const publicJobId = input.publicJobId?.trim() ?? "";
    const applicationStatus = input.applicationStatus?.trim() ?? "all";
    const conversationType = input.conversationType?.trim() ?? "all";
    const sort = input.sort?.trim() || "newest";
    const typeFilters = [
      input.hasType,
      input.employerAction,
      input.candidateAction,
    ].filter((value): value is string => Boolean(value && value !== "all"));

    // Messages history keeps all application notifications (including expired /
    // soft-deleted). Unread badges only count active inbox rows.
    const pipeline: mongoose.PipelineStage[] = [
      { $match: match },
      { $sort: { createdAt: -1 } },
      {
        $group: {
          _id: "$referenceId",
          latest: { $first: "$$ROOT" },
          unreadCount: {
            $sum: {
              $cond: [
                {
                  $and: [
                    { $eq: ["$readAt", null] },
                    {
                      $or: [
                        { $eq: ["$deletedAt", null] },
                        { $not: ["$deletedAt"] },
                      ],
                    },
                    {
                      $or: [
                        { $gt: ["$expiresAt", inboxNow] },
                        { $eq: ["$expiresAt", null] },
                        { $not: ["$expiresAt"] },
                      ],
                    },
                  ],
                },
                1,
                0,
              ],
            },
          },
          messageCount: { $sum: 1 },
          types: { $addToSet: "$type" },
        },
      },
    ];

    if (input.readStatus === "unread") {
      pipeline.push({ $match: { unreadCount: { $gt: 0 } } });
    } else if (input.readStatus === "read") {
      pipeline.push({ $match: { unreadCount: 0 } });
    }

    if (typeFilters.length === 1) {
      pipeline.push({ $match: { types: typeFilters[0] } });
    } else if (typeFilters.length > 1) {
      pipeline.push({ $match: { types: { $all: typeFilters } } });
    }

    pipeline.push(
      {
        $addFields: {
          applicationObjectId: {
            $convert: {
              input: "$_id",
              to: "objectId",
              onError: null,
              onNull: null,
            },
          },
        },
      },
      {
        $lookup: {
          from: "applications",
          localField: "applicationObjectId",
          foreignField: "_id",
          as: "application",
        },
      },
      {
        $unwind: {
          path: "$application",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $lookup: {
          from: "jobs",
          localField: "application.jobId",
          foreignField: "_id",
          as: "job",
        },
      },
      {
        $unwind: {
          path: "$job",
          preserveNullAndEmptyArrays: true,
        },
      },
    );

    const postMatch: Record<string, unknown> = {};
    if (publicJobId) {
      postMatch["application.publicJobId"] = publicJobId;
    }
    if (applicationStatus !== "all") {
      postMatch["application.status"] = applicationStatus;
    }
    if (conversationType === "active") {
      postMatch["application.status"] = {
        $nin: ["joined", "rejected", "withdrawn"],
      };
    } else if (conversationType === "completed") {
      postMatch["application.status"] = "joined";
    } else if (conversationType === "rejected") {
      postMatch["application.status"] = "rejected";
    } else if (conversationType === "withdrawn") {
      postMatch["application.status"] = "withdrawn";
    }

    if (search) {
      const escaped = search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      postMatch.$or = [
        {
          "application.resumeSnapshot.resumeJson.header.fullName": {
            $regex: escaped,
            $options: "i",
          },
        },
        {
          "application.resumeSnapshot.resumeJson.header.phone": {
            $regex: escaped,
            $options: "i",
          },
        },
        { "job.jobTitle": { $regex: escaped, $options: "i" } },
        { "application.publicJobId": { $regex: escaped, $options: "i" } },
        { "latest.title": { $regex: escaped, $options: "i" } },
        { "latest.body": { $regex: escaped, $options: "i" } },
      ];
    }

    if (Object.keys(postMatch).length > 0) {
      pipeline.push({ $match: postMatch });
    }

    let sortStage: Record<string, 1 | -1> = { "latest.createdAt": -1 };
    if (sort === "oldest") {
      sortStage = { "latest.createdAt": 1 };
    } else if (sort === "most_notifications") {
      sortStage = { messageCount: -1, "latest.createdAt": -1 };
    } else if (sort === "unread_first") {
      sortStage = { unreadCount: -1, "latest.createdAt": -1 };
    }

    pipeline.push({
      $facet: {
        items: [
          { $sort: sortStage },
          { $skip: (input.page - 1) * input.limit },
          { $limit: input.limit },
        ],
        totalCount: [{ $count: "count" }],
      },
    });

    const [facet] = await NotificationModel.aggregate<{
      items: Array<{
        _id: string;
        latest: {
          _id: mongoose.Types.ObjectId;
          type: NotificationType;
          category: NotificationCategory;
          title: string;
          body: string;
          priority: NotificationListItem["priority"];
          referenceType?: string;
          referenceId?: string;
          actionPath?: string;
          readAt?: Date | null;
          createdAt?: Date;
        };
        unreadCount: number;
        messageCount: number;
        application?: {
          publicJobId?: string;
          status?: string;
          resumeSnapshot?: {
            resumeJson?: {
              header?: { fullName?: string; phone?: string };
            };
          };
        };
        job?: { jobTitle?: string };
      }>;
      totalCount: Array<{ count: number }>;
    }>(pipeline);

    const total = facet?.totalCount?.[0]?.count ?? 0;
    const conversations: NotificationConversationListItem[] = (
      facet?.items ?? []
    ).map((row) => {
      const header = row.application?.resumeSnapshot?.resumeJson?.header;
      const candidateName =
        typeof header?.fullName === "string" && header.fullName.trim()
          ? header.fullName.trim()
          : "Candidate";
      const candidatePhone =
        typeof header?.phone === "string" ? header.phone.trim() : "";

      return {
        applicationId: String(row._id),
        publicJobId: row.application?.publicJobId?.trim() || "",
        jobTitle: row.job?.jobTitle?.trim() || "Job",
        candidateName,
        candidatePhone,
        applicationStatus: String(row.application?.status ?? ""),
        latestNotification: toListItem(row.latest),
        unreadCount: row.unreadCount,
        messageCount: row.messageCount,
        lastActivityAt: row.latest.createdAt
          ? row.latest.createdAt.toISOString()
          : new Date().toISOString(),
      };
    });

    const weekAgo = new Date(inboxNow.getTime() - 7 * 24 * 60 * 60 * 1000);
    const terminalStatuses = ["joined", "rejected", "withdrawn"] as const;

    const [unreadCount, jobFacetRows, activeHiringRows, interviewWeekRows] =
      await Promise.all([
        NotificationModel.countDocuments({
          $and: [
            {
              recipientType: "employer",
              recipientId: employerObjectId,
              readAt: null,
            },
            buildActiveInboxFilter(inboxNow),
          ],
        }),
        NotificationModel.aggregate<{
          publicJobId: string;
          jobTitle: string;
          count: number;
        }>([
          {
            $match: {
              recipientType: "employer",
              recipientId: employerObjectId,
              referenceType: "application",
              referenceId: { $nin: ["", null] },
            },
          },
          {
            $group: {
              _id: "$referenceId",
            },
          },
          {
            $addFields: {
              applicationObjectId: {
                $convert: {
                  input: "$_id",
                  to: "objectId",
                  onError: null,
                  onNull: null,
                },
              },
            },
          },
          {
            $lookup: {
              from: "applications",
              localField: "applicationObjectId",
              foreignField: "_id",
              as: "application",
            },
          },
          { $unwind: { path: "$application", preserveNullAndEmptyArrays: true } },
          {
            $lookup: {
              from: "jobs",
              localField: "application.jobId",
              foreignField: "_id",
              as: "job",
            },
          },
          { $unwind: { path: "$job", preserveNullAndEmptyArrays: true } },
          {
            $group: {
              _id: {
                publicJobId: { $ifNull: ["$application.publicJobId", ""] },
                jobTitle: { $ifNull: ["$job.jobTitle", "Job"] },
              },
              count: { $sum: 1 },
            },
          },
          { $match: { "_id.publicJobId": { $ne: "" } } },
          { $sort: { count: -1 } },
          {
            $project: {
              _id: 0,
              publicJobId: "$_id.publicJobId",
              jobTitle: "$_id.jobTitle",
              count: 1,
            },
          },
        ]),
        NotificationModel.aggregate<{ count: number }>([
          {
            $match: {
              recipientType: "employer",
              recipientId: employerObjectId,
              referenceType: "application",
              referenceId: { $nin: ["", null] },
            },
          },
          { $group: { _id: "$referenceId" } },
          {
            $addFields: {
              applicationObjectId: {
                $convert: {
                  input: "$_id",
                  to: "objectId",
                  onError: null,
                  onNull: null,
                },
              },
            },
          },
          {
            $lookup: {
              from: "applications",
              localField: "applicationObjectId",
              foreignField: "_id",
              as: "application",
            },
          },
          { $unwind: { path: "$application", preserveNullAndEmptyArrays: false } },
          {
            $match: {
              "application.employerId": employerObjectId,
              "application.status": { $nin: [...terminalStatuses] },
            },
          },
          { $count: "count" },
        ]),
        NotificationModel.aggregate<{ count: number }>([
          {
            $match: {
              recipientType: "employer",
              recipientId: employerObjectId,
              referenceType: "application",
              category: "interview",
              createdAt: { $gte: weekAgo },
              referenceId: { $nin: ["", null] },
            },
          },
          { $group: { _id: "$referenceId" } },
          { $count: "count" },
        ]),
      ]);

    return {
      conversations,
      pagination: {
        page: input.page,
        limit: input.limit,
        total,
        totalPages: Math.max(1, Math.ceil(total / input.limit)),
      },
      unreadCount,
      activeHiringCount: activeHiringRows[0]?.count ?? 0,
      interviewWeekCount: interviewWeekRows[0]?.count ?? 0,
      jobFacets: jobFacetRows,
    };
  }

  async markConversationAsRead(input: {
    recipientType: NotificationRecipientType;
    recipientId: string;
    applicationId: string;
  }): Promise<{ updatedCount: number }> {
    if (
      !mongoose.Types.ObjectId.isValid(input.recipientId) ||
      !mongoose.Types.ObjectId.isValid(input.applicationId)
    ) {
      throw new AppError("Unauthorized", HTTP_STATUS.UNAUTHORIZED);
    }

    const readAt = new Date();
    const result = await NotificationModel.updateMany(
      {
        recipientType: input.recipientType,
        recipientId: input.recipientId,
        referenceType: "application",
        referenceId: input.applicationId,
        readAt: null,
        deletedAt: null,
      },
      {
        $set: {
          readAt,
          expiresAt: computeReadExpiresAt(readAt),
        },
      },
    );

    return { updatedCount: result.modifiedCount };
  }

  /**
   * Unified application conversation for Employer Messages.
   * Aggregates employer + job-seeker notifications for one application,
   * dedupes mirrored pairs, and does not create new records.
   */
  async listConversationTimelineForEmployer(input: {
    employerId: string;
    applicationId: string;
    page: number;
    limit: number;
  }): Promise<NotificationConversationTimelineResult> {
    if (
      !mongoose.Types.ObjectId.isValid(input.employerId) ||
      !mongoose.Types.ObjectId.isValid(input.applicationId)
    ) {
      throw new AppError("Unauthorized", HTTP_STATUS.UNAUTHORIZED);
    }

    const application = await ApplicationModel.findOne({
      _id: input.applicationId,
      employerId: input.employerId,
    })
      .select("_id")
      .lean();

    if (!application) {
      throw new AppError("Application not found", HTTP_STATUS.NOT_FOUND);
    }

    // Cap scan size — conversation threads are typically small; unbounded
    // load would degrade under long-running hiring threads.
    const TIMELINE_SCAN_CAP = 1_000;
    const rows = await NotificationModel.find({
      referenceType: "application",
      referenceId: input.applicationId,
    })
      .sort({ createdAt: 1 })
      .limit(TIMELINE_SCAN_CAP)
      .lean();

    const unified = buildUnifiedConversationTimeline(
      rows.map((row) => ({
        _id: row._id as mongoose.Types.ObjectId,
        recipientType: row.recipientType as NotificationRecipientType,
        type: row.type as NotificationType,
        category: row.category as NotificationCategory,
        title: row.title,
        body: row.body,
        priority: row.priority as NotificationListItem["priority"],
        referenceType: row.referenceType,
        referenceId: row.referenceId,
        actionPath: row.actionPath,
        readAt: row.readAt,
        createdAt: row.createdAt,
      })),
    );

    const total = unified.length;
    const start = (input.page - 1) * input.limit;
    const pageItems = unified.slice(start, start + input.limit);

    return {
      notifications: pageItems,
      pagination: {
        page: input.page,
        limit: input.limit,
        total,
        totalPages: Math.max(1, Math.ceil(total / input.limit)),
      },
    };
  }

  /**
   * Maps application domain events to in-app notifications.
   * Safe to call fire-and-forget; never throws to callers.
   */
  async handleApplicationEvent(input: {
    eventName: string;
    context: ApplicationNotificationContext;
  }): Promise<void> {
    const { eventName, context } = input;
    const company = context.companyName.trim() || "the employer";
    const jobTitle = context.jobTitle.trim() || "a job";
    const candidate = context.candidateName?.trim() || "A candidate";
    const seekerPath = `/job-seeker/applied-jobs/${context.applicationId}`;
    const employerPath = `/employer/candidates/${context.applicationId}`;

    const jobs: CreateNotificationInput[] = [];

    switch (eventName) {
      case APPLICATION_EVENT_NAMES.SUBMITTED:
        jobs.push(
          {
            recipientType: "job_seeker",
            recipientId: context.jobSeekerId,
            type: "application_submitted",
            category: "application",
            title: "Application Submitted",
            body: `Your application for ${jobTitle} at ${company} was submitted successfully.`,
            priority: "normal",
            referenceType: "application",
            referenceId: context.applicationId,
            actionPath: seekerPath,
            metadata: { publicJobId: context.publicJobId },
          },
          {
            recipientType: "employer",
            recipientId: context.employerId,
            type: "application_received",
            category: "application",
            title: "New Application Received",
            body: `${candidate} applied for ${jobTitle}.`,
            priority: "high",
            referenceType: "application",
            referenceId: context.applicationId,
            actionPath: employerPath,
            metadata: { publicJobId: context.publicJobId },
          },
        );
        break;
      case APPLICATION_EVENT_NAMES.VIEWED:
        jobs.push({
          recipientType: "job_seeker",
          recipientId: context.jobSeekerId,
          type: "application_viewed",
          category: "application",
          title: "Employer Viewed Application",
          body: `${company} viewed your application for ${jobTitle}.`,
          referenceType: "application",
          referenceId: context.applicationId,
          actionPath: seekerPath,
        });
        break;
      case APPLICATION_EVENT_NAMES.UNDER_REVIEW:
        jobs.push({
          recipientType: "job_seeker",
          recipientId: context.jobSeekerId,
          type: "application_under_review",
          category: "application",
          title: "Under Review",
          body: `Your application for ${jobTitle} is now under review.`,
          referenceType: "application",
          referenceId: context.applicationId,
          actionPath: seekerPath,
        });
        break;
      case APPLICATION_EVENT_NAMES.SHORTLISTED:
        jobs.push({
          recipientType: "job_seeker",
          recipientId: context.jobSeekerId,
          type: "application_shortlisted",
          category: "application",
          title: "Shortlisted",
          body: `You were shortlisted for ${jobTitle} at ${company}.`,
          priority: "high",
          referenceType: "application",
          referenceId: context.applicationId,
          actionPath: seekerPath,
        });
        break;
      case APPLICATION_EVENT_NAMES.INTERVIEW_SCHEDULED:
        jobs.push(
          {
            recipientType: "job_seeker",
            recipientId: context.jobSeekerId,
            type: "interview_scheduled",
            category: "interview",
            title: "Interview Scheduled",
            body: buildInterviewNotificationBody({
              prefix: `An interview was scheduled for ${jobTitle} at ${company}`,
              interview: context.interview,
            }),
            priority: "high",
            referenceType: "application",
            referenceId: context.applicationId,
            actionPath: seekerPath,
          },
          {
            recipientType: "employer",
            recipientId: context.employerId,
            type: "interview_scheduled",
            category: "interview",
            title: "Interview Scheduled",
            body: buildInterviewNotificationBody({
              prefix: `Interview scheduled with ${candidate} for ${jobTitle}`,
              interview: context.interview,
            }),
            priority: "normal",
            referenceType: "application",
            referenceId: context.applicationId,
            actionPath: employerPath,
            metadata: { publicJobId: context.publicJobId },
          },
        );
        break;
      case APPLICATION_EVENT_NAMES.INTERVIEW_UPDATED:
        jobs.push(
          {
            recipientType: "job_seeker",
            recipientId: context.jobSeekerId,
            type: "interview_updated",
            category: "interview",
            title: "Interview Updated",
            body: buildInterviewNotificationBody({
              prefix: `Interview details were updated for ${jobTitle}`,
              interview: context.interview,
            }),
            priority: "high",
            referenceType: "application",
            referenceId: context.applicationId,
            actionPath: seekerPath,
          },
          {
            recipientType: "employer",
            recipientId: context.employerId,
            type: "interview_updated",
            category: "interview",
            title: "Interview Updated",
            body: buildInterviewNotificationBody({
              prefix: `Interview with ${candidate} for ${jobTitle} was updated`,
              interview: context.interview,
            }),
            priority: "normal",
            referenceType: "application",
            referenceId: context.applicationId,
            actionPath: employerPath,
            metadata: { publicJobId: context.publicJobId },
          },
        );
        break;
      case APPLICATION_EVENT_NAMES.INTERVIEW_COMPLETED:
        jobs.push(
          {
            recipientType: "job_seeker",
            recipientId: context.jobSeekerId,
            type: "interview_completed",
            category: "interview",
            title: "Interview Completed",
            body: `Your interview for ${jobTitle} was marked as completed.`,
            referenceType: "application",
            referenceId: context.applicationId,
            actionPath: seekerPath,
          },
          {
            recipientType: "employer",
            recipientId: context.employerId,
            type: "interview_completed",
            category: "interview",
            title: "Interview Completed",
            body: `Interview with ${candidate} for ${jobTitle} was marked as completed.`,
            priority: "normal",
            referenceType: "application",
            referenceId: context.applicationId,
            actionPath: employerPath,
            metadata: { publicJobId: context.publicJobId },
          },
        );
        break;
      case APPLICATION_EVENT_NAMES.INTERVIEW_CANCELLED: {
        const reason = context.cancellationReason?.trim() || "Not specified";
        const scheduledDate = context.interview?.date?.trim();
        let when = "";
        if (scheduledDate) {
          const parsed = new Date(`${scheduledDate}T00:00:00`);
          const formatted = Number.isNaN(parsed.getTime())
            ? scheduledDate
            : new Intl.DateTimeFormat("en-IN", {
                day: "2-digit",
                month: "short",
                year: "numeric",
              }).format(parsed);
          when = ` scheduled on ${formatted}`;
        }
        jobs.push(
          {
            recipientType: "job_seeker",
            recipientId: context.jobSeekerId,
            type: "interview_cancelled",
            category: "interview",
            title: "Interview Cancelled",
            body: `Your interview for ${jobTitle}${when} has been cancelled. Reason: ${reason}. We will contact you if a new interview is scheduled.`,
            priority: "high",
            referenceType: "application",
            referenceId: context.applicationId,
            actionPath: seekerPath,
          },
          {
            recipientType: "employer",
            recipientId: context.employerId,
            type: "interview_cancelled",
            category: "interview",
            title: "Interview Cancelled",
            body: `Interview with ${candidate} for ${jobTitle}${when} was cancelled. Reason: ${reason}.`,
            priority: "normal",
            referenceType: "application",
            referenceId: context.applicationId,
            actionPath: employerPath,
            metadata: { publicJobId: context.publicJobId },
          },
        );
        break;
      }
      case APPLICATION_EVENT_NAMES.OFFER_SENT:
        jobs.push(
          {
            recipientType: "job_seeker",
            recipientId: context.jobSeekerId,
            type: "offer_sent",
            category: "offer",
            title: "Offer Sent",
            body: `You received an offer for ${jobTitle} at ${company}.`,
            priority: "high",
            referenceType: "application",
            referenceId: context.applicationId,
            actionPath: seekerPath,
          },
          {
            recipientType: "employer",
            recipientId: context.employerId,
            type: "offer_sent",
            category: "offer",
            title: "Offer Sent",
            body: `Offer sent to ${candidate} for ${jobTitle}.`,
            priority: "normal",
            referenceType: "application",
            referenceId: context.applicationId,
            actionPath: employerPath,
            metadata: { publicJobId: context.publicJobId },
          },
        );
        break;
      case APPLICATION_EVENT_NAMES.SELECTED:
        jobs.push(
          {
            recipientType: "job_seeker",
            recipientId: context.jobSeekerId,
            type: "application_selected",
            category: "offer",
            title: "Selected",
            body: `Congratulations! You were selected for ${jobTitle}.`,
            priority: "high",
            referenceType: "application",
            referenceId: context.applicationId,
            actionPath: seekerPath,
          },
          {
            recipientType: "employer",
            recipientId: context.employerId,
            type: "application_selected",
            category: "offer",
            title: "Candidate Selected",
            body: `${candidate} was marked as selected for ${jobTitle}.`,
            priority: "normal",
            referenceType: "application",
            referenceId: context.applicationId,
            actionPath: employerPath,
            metadata: { publicJobId: context.publicJobId },
          },
        );
        break;
      case APPLICATION_EVENT_NAMES.JOINED:
        jobs.push(
          {
            recipientType: "job_seeker",
            recipientId: context.jobSeekerId,
            type: "application_joined",
            category: "system",
            title: "Joined",
            body: `Your status for ${jobTitle} was updated to Joined.`,
            referenceType: "application",
            referenceId: context.applicationId,
            actionPath: seekerPath,
          },
          {
            recipientType: "employer",
            recipientId: context.employerId,
            type: "application_joined",
            category: "system",
            title: "Candidate Joined",
            body: `${candidate} was marked as joined for ${jobTitle}.`,
            priority: "normal",
            referenceType: "application",
            referenceId: context.applicationId,
            actionPath: employerPath,
            metadata: { publicJobId: context.publicJobId },
          },
        );
        break;
      case APPLICATION_EVENT_NAMES.REJECTED:
        jobs.push(
          {
            recipientType: "job_seeker",
            recipientId: context.jobSeekerId,
            type: "application_rejected",
            category: "application",
            title: "Application Rejected",
            body: `Your application for ${jobTitle} was not selected this time.`,
            referenceType: "application",
            referenceId: context.applicationId,
            actionPath: seekerPath,
          },
          {
            recipientType: "employer",
            recipientId: context.employerId,
            type: "application_rejected",
            category: "application",
            title: "Application Rejected",
            body: `${candidate}'s application for ${jobTitle} was rejected.`,
            priority: "normal",
            referenceType: "application",
            referenceId: context.applicationId,
            actionPath: employerPath,
            metadata: { publicJobId: context.publicJobId },
          },
        );
        break;
      case APPLICATION_EVENT_NAMES.WITHDRAWN:
        jobs.push(
          {
            recipientType: "job_seeker",
            recipientId: context.jobSeekerId,
            type: "application_withdrawn",
            category: "application",
            title: "Application Withdrawn",
            body: `You withdrew your application for ${jobTitle}.`,
            referenceType: "application",
            referenceId: context.applicationId,
            actionPath: seekerPath,
          },
          {
            recipientType: "employer",
            recipientId: context.employerId,
            type: "candidate_withdrawn",
            category: "application",
            title: "Candidate Withdrawn",
            body: `${candidate} withdrew their application for ${jobTitle}.`,
            priority: "normal",
            referenceType: "application",
            referenceId: context.applicationId,
            actionPath: employerPath,
          },
        );
        break;
      default:
        return;
    }

    for (const job of jobs) {
      await this.createNotification(job);
    }
  }
}

export const notificationService = new NotificationService();
