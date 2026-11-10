import mongoose from "mongoose";
import { HTTP_STATUS } from "../../constants/http-status.js";
import { AppError } from "../../middleware/error.middleware.js";
import {
  APPLICATION_EVENT_NAMES,
  APPLICATION_STATUS_LABELS,
} from "../applications/application.constants.js";
import { recordTeamActivity } from "../team/team-activity.service.js";
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
  NotificationConversationFilters,
  NotificationConversationFlag,
  NotificationConversationListItem,
  NotificationConversationListResult,
  NotificationConversationState,
  NotificationConversationStats,
  NotificationConversationTimelineItem,
  NotificationConversationTimelineResult,
  NotificationConversationViewCounts,
  NotificationListItem,
  NotificationListResult,
  NotificationRecipientType,
  NotificationSummary,
  NotificationType,
} from "./notification.types.js";
import {
  conversationThreadMatches,
  dedupeConversationIds,
  INTERVIEW_EVENT_TYPES,
  planConversationTypeFilters,
  sliceConversationTimelinePage,
  TERMINAL_APPLICATION_STATUSES,
} from "./notification-conversation.helpers.js";
import {
  buildTemplateParams,
  interviewTemplateParams,
  NOTIFICATION_TEMPLATE_PARAMS_KEY,
  resolveMirrorTemplate,
  resolveNotificationTemplate,
} from "./notification-templates.js";
import {
  EMPLOYER_MESSAGE_THREAD_STATE_COLLECTION,
  EmployerMessageThreadStateModel,
} from "./employer-message-thread-state.model.js";
import {
  buildMessagesExportCsv,
  buildMessagesExportFileName,
  MESSAGES_EXPORT_MAX_ROWS,
  MESSAGES_EXPORT_MAX_THREADS,
  type MessagesExportRow,
} from "./notification-export.js";
import { ApplicationModel } from "../applications/application.model.js";
import { JobModel } from "../jobs/job.model.js";
import { ensureEmployerJobRelationsConsistent } from "../jobs/job-cascade-delete.js";

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
  recipientType?: NotificationRecipientType;
  type: NotificationType;
  category: NotificationCategory;
  title: string;
  body: string;
  priority: NotificationListItem["priority"];
  referenceType?: string;
  referenceId?: string;
  actionPath?: string;
  metadata?: unknown;
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
    template: resolveNotificationTemplate({
      recipientType: doc.recipientType,
      type: doc.type,
      metadata: doc.metadata,
    }),
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
    case "offer_accepted":
    case "offer_declined":
    case "job_closed":
    case "job_approved":
    case "job_rejected":
    case "job_live_changes_approved":
    case "job_live_changes_rejected":
    case "employer_verification_approved":
    case "employer_verification_rejected":
    case "employer_verification_documents_requested":
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
  metadata?: unknown;
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
    case "offer_accepted":
      return {
        title: "Offer Accepted",
        body: "Candidate accepted the offer.",
      };
    case "offer_declined":
      return {
        title: "Offer Declined",
        body: "Candidate declined the offer.",
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
    case "application_did_not_join":
      return {
        title: "Did Not Join",
        body: "You marked this candidate as did not join.",
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
      template:
        chosen.recipientType === "employer"
          ? base.template
          : resolveMirrorTemplate({
              type: chosen.type,
              metadata: chosen.metadata,
            }),
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

const INTERVIEW_EVENT_NAMES: ReadonlySet<string> = new Set([
  APPLICATION_EVENT_NAMES.INTERVIEW_SCHEDULED,
  APPLICATION_EVENT_NAMES.INTERVIEW_UPDATED,
  APPLICATION_EVENT_NAMES.INTERVIEW_CANCELLED,
]);

/** Raw dynamic values (no English fallbacks) for translated rendering. */
export function applicationTemplateParams(
  eventName: string,
  context: ApplicationNotificationContext,
): Record<string, string> {
  return {
    ...buildTemplateParams({
      candidate: context.candidateName,
      jobTitle: context.jobTitle,
      company: context.companyName,
      publicJobId: context.publicJobId,
      reason:
        eventName === APPLICATION_EVENT_NAMES.INTERVIEW_CANCELLED
          ? context.cancellationReason
          : "",
    }),
    ...(INTERVIEW_EVENT_NAMES.has(eventName)
      ? interviewTemplateParams(context.interview)
      : {}),
  };
}

const MESSAGES_THREAD_REFERENCE_TYPES = ["application", "job"] as const;

/**
 * Muted threads keep in-app history and unread state; only out-of-app
 * delivery channels are switched off for new notifications.
 */
export function applyMutedThreadChannels(
  channels: CreateNotificationInput["channels"],
): CreateNotificationInput["channels"] {
  return { ...channels, whatsapp: false, email: false, push: false };
}

async function isEmployerThreadMuted(
  input: CreateNotificationInput,
): Promise<boolean> {
  const referenceId = input.referenceId?.trim() ?? "";
  if (
    input.recipientType !== "employer" ||
    !referenceId ||
    !(MESSAGES_THREAD_REFERENCE_TYPES as readonly string[]).includes(
      input.referenceType ?? "",
    )
  ) {
    return false;
  }
  const state = await EmployerMessageThreadStateModel.exists({
    employerId: input.recipientId,
    referenceId,
    mutedAt: { $ne: null },
  });
  return Boolean(state);
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
    const muted = await isEmployerThreadMuted(input);
    const channels = muted
      ? applyMutedThreadChannels(input.channels)
      : input.channels;
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
        ...channels,
      },
      metadata: muted
        ? { ...input.metadata, mutedThread: true }
        : (input.metadata ?? {}),
      readAt: null,
      deletedAt: null,
      expiresAt: computeUnreadExpiresAt(now),
    });

    await deliverChannels(notification._id.toString(), channels);

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

  async getSummaryForRecipient(input: {
    recipientType: NotificationRecipientType;
    recipientId: string;
  }): Promise<NotificationSummary> {
    if (!mongoose.Types.ObjectId.isValid(input.recipientId)) {
      throw new AppError("Unauthorized", HTTP_STATUS.UNAUTHORIZED);
    }

    const now = new Date();
    const baseFilter = {
      $and: [
        {
          recipientType: input.recipientType,
          recipientId: input.recipientId,
        },
        buildActiveInboxFilter(now),
      ],
    };

    const [all, unread, categoryRows] = await Promise.all([
      NotificationModel.countDocuments(baseFilter),
      NotificationModel.countDocuments({
        $and: [...baseFilter.$and, { readAt: null }],
      }),
      NotificationModel.aggregate<{ _id: NotificationCategory; count: number }>([
        { $match: baseFilter },
        { $group: { _id: "$category", count: { $sum: 1 } } },
      ]),
    ]);

    const byCategory: Record<NotificationCategory, number> = {
      application: 0,
      interview: 0,
      offer: 0,
      system: 0,
    };

    for (const row of categoryRows) {
      if (row._id in byCategory) {
        byCategory[row._id] = row.count;
      }
    }

    return {
      all,
      unread,
      application: byCategory.application,
      interview: byCategory.interview,
      offer: byCategory.offer,
      system: byCategory.system,
    };
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
   * Shared thread pipeline for the Messages list, tab counts and CSV export.
   * Groups the employer's own notifications by thread, joins the employer's
   * thread state, application and job, then applies the list filters.
   * `threadMatches` (read status / view / mute) run right after the state join.
   */
  private buildConversationThreadPipeline(
    input: NotificationConversationFilters,
    threadMatches: Record<string, unknown>[],
  ): mongoose.PipelineStage[] {
    const employerObjectId = new mongoose.Types.ObjectId(input.employerId);
    const inboxNow = new Date();
    const match: Record<string, unknown> = {
      recipientType: "employer",
      recipientId: employerObjectId,
      referenceType: { $in: [...MESSAGES_THREAD_REFERENCE_TYPES] },
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
    const typeFilterPlan = planConversationTypeFilters([
      input.hasType,
      input.employerAction,
      input.candidateAction,
    ]);
    const typeFilters = typeFilterPlan.notificationTypes;

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

    if (typeFilters.length === 1) {
      pipeline.push({ $match: { types: typeFilters[0] } });
    } else if (typeFilters.length > 1) {
      pipeline.push({ $match: { types: { $all: typeFilters } } });
    }

    pipeline.push(
      {
        $lookup: {
          from: EMPLOYER_MESSAGE_THREAD_STATE_COLLECTION,
          let: { threadRef: "$_id" },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ["$employerId", employerObjectId] },
                    { $eq: ["$referenceId", "$$threadRef"] },
                  ],
                },
              },
            },
            { $project: { _id: 0, starredAt: 1, archivedAt: 1, mutedAt: 1 } },
          ],
          as: "threadState",
        },
      },
      {
        $addFields: {
          threadState: {
            $ifNull: [{ $arrayElemAt: ["$threadState", 0] }, {}],
          },
        },
      },
    );

    for (const clause of threadMatches) {
      pipeline.push({ $match: clause });
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
      {
        $lookup: {
          from: "jobs",
          localField: "applicationObjectId",
          foreignField: "_id",
          as: "directJob",
        },
      },
      {
        $addFields: {
          job: {
            $ifNull: ["$job", { $arrayElemAt: ["$directJob", 0] }],
          },
        },
      },
    );

    const postClauses: Record<string, unknown>[] = [];
    if (publicJobId) {
      postClauses.push({ "application.publicJobId": publicJobId });
    }
    if (applicationStatus !== "all") {
      postClauses.push({ "application.status": applicationStatus });
    }
    if (conversationType === "active") {
      postClauses.push({
        "application.status": {
          $exists: true,
          $nin: [...TERMINAL_APPLICATION_STATUSES],
        },
      });
    } else if (conversationType === "completed") {
      postClauses.push({ "application.status": "joined" });
    } else if (conversationType === "rejected") {
      postClauses.push({ "application.status": "rejected" });
    } else if (conversationType === "withdrawn") {
      postClauses.push({ "application.status": "withdrawn" });
    }
    if (typeFilterPlan.statusHistoryStatuses.length > 0) {
      postClauses.push({
        "application.employerId": employerObjectId,
        "application.statusHistory.status": {
          $all: typeFilterPlan.statusHistoryStatuses,
        },
      });
    }

    if (search) {
      const escaped = search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      postClauses.push({
        $or: [
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
          { "job.jobId": { $regex: escaped, $options: "i" } },
          { "application.publicJobId": { $regex: escaped, $options: "i" } },
          { "latest.title": { $regex: escaped, $options: "i" } },
          { "latest.body": { $regex: escaped, $options: "i" } },
        ],
      });
    }

    if (postClauses.length === 1) {
      pipeline.push({ $match: postClauses[0]! });
    } else if (postClauses.length > 1) {
      pipeline.push({ $match: { $and: postClauses } });
    }

    return pipeline;
  }

  /**
   * Groups employer notifications by application into conversation threads.
   * Joins application + job for candidate/job labels. Does not duplicate notifications.
   */
  async listConversationsForEmployer(
    input: NotificationConversationFilters & {
      page: number;
      limit: number;
      sort?: string;
      includeStats?: boolean;
    },
  ): Promise<NotificationConversationListResult> {
    if (!mongoose.Types.ObjectId.isValid(input.employerId)) {
      throw new AppError("Unauthorized", HTTP_STATUS.UNAUTHORIZED);
    }

    await ensureEmployerJobRelationsConsistent(input.employerId);

    const employerObjectId = new mongoose.Types.ObjectId(input.employerId);
    const sort = input.sort?.trim() || "newest";
    const pipeline = this.buildConversationThreadPipeline(
      input,
      conversationThreadMatches(input),
    );

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
          { $sort: { ...sortStage, _id: 1 } },
          { $skip: (input.page - 1) * input.limit },
          { $limit: input.limit },
          {
            $lookup: {
              from: "jobseekers",
              let: { seekerId: "$application.jobSeekerId" },
              pipeline: [
                { $match: { $expr: { $eq: ["$_id", "$$seekerId"] } } },
                { $project: { _id: 0, isWhatsappVerified: 1 } },
              ],
              as: "seeker",
            },
          },
        ],
        totalCount: [{ $count: "count" }],
      },
    });

    const [facet] = await NotificationModel.aggregate<{
      items: Array<{
        _id: string;
        latest: {
          _id: mongoose.Types.ObjectId;
          recipientType?: NotificationRecipientType;
          type: NotificationType;
          category: NotificationCategory;
          title: string;
          body: string;
          priority: NotificationListItem["priority"];
          referenceType?: string;
          referenceId?: string;
          actionPath?: string;
          metadata?: unknown;
          readAt?: Date | null;
          createdAt?: Date;
        };
        unreadCount: number;
        messageCount: number;
        threadState?: {
          starredAt?: Date | null;
          archivedAt?: Date | null;
          mutedAt?: Date | null;
        };
        application?: {
          publicJobId?: string;
          status?: string;
          resumeSnapshot?: {
            resumeJson?: {
              header?: { fullName?: string; phone?: string };
            };
          };
        };
        job?: { jobTitle?: string; jobId?: string };
        seeker?: Array<{ isWhatsappVerified?: boolean }>;
      }>;
      totalCount: Array<{ count: number }>;
    }>(pipeline);

    const total = facet?.totalCount?.[0]?.count ?? 0;
    const conversations: NotificationConversationListItem[] = (
      facet?.items ?? []
    ).map((row) => {
      const header = row.application?.resumeSnapshot?.resumeJson?.header;
      const isOperationsJobThread =
        row.latest.referenceType === "job" || !row.application?.status;
      const candidateName = isOperationsJobThread
        ? "Operations"
        : typeof header?.fullName === "string" && header.fullName.trim()
          ? header.fullName.trim()
          : "Candidate";
      const candidatePhone =
        !isOperationsJobThread && typeof header?.phone === "string"
          ? header.phone.trim()
          : "";

      return {
        applicationId: String(row._id),
        referenceType: isOperationsJobThread ? "job" : "application",
        candidateVerified:
          !isOperationsJobThread &&
          row.seeker?.[0]?.isWhatsappVerified === true,
        publicJobId:
          row.application?.publicJobId?.trim() ||
          row.job?.jobId?.trim() ||
          "",
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
        starred: Boolean(row.threadState?.starredAt),
        archived: Boolean(row.threadState?.archivedAt),
        muted: Boolean(row.threadState?.mutedAt),
      };
    });

    const pagination = {
      page: input.page,
      limit: input.limit,
      total,
      totalPages: Math.max(1, Math.ceil(total / input.limit)),
    };

    if (input.includeStats === false) {
      return {
        conversations,
        pagination,
        stats: null,
        viewCounts: null,
        jobFacets: [],
      };
    }

    const [stats, viewCounts, jobFacets] = await Promise.all([
      this.computeConversationStats(employerObjectId),
      this.computeConversationViewCounts(input),
      this.computeConversationJobFacets(employerObjectId),
    ]);

    return { conversations, pagination, stats, viewCounts, jobFacets };
  }

  /** Tab counts under the current filters; read status and view are ignored. */
  private async computeConversationViewCounts(
    input: NotificationConversationFilters,
  ): Promise<NotificationConversationViewCounts> {
    const pipeline = this.buildConversationThreadPipeline(
      input,
      input.excludeMuted ? [{ "threadState.mutedAt": null }] : [],
    );
    const inbox = { "threadState.archivedAt": null };
    pipeline.push({
      $facet: {
        inbox: [{ $match: inbox }, { $count: "count" }],
        unread: [
          { $match: { ...inbox, unreadCount: { $gt: 0 } } },
          { $count: "count" },
        ],
        starred: [
          { $match: { "threadState.starredAt": { $ne: null } } },
          { $count: "count" },
        ],
        archived: [
          { $match: { "threadState.archivedAt": { $ne: null } } },
          { $count: "count" },
        ],
      },
    });

    const [facet] = await NotificationModel.aggregate<
      Record<keyof NotificationConversationViewCounts, Array<{ count: number }>>
    >(pipeline);

    return {
      inbox: facet?.inbox?.[0]?.count ?? 0,
      unread: facet?.unread?.[0]?.count ?? 0,
      starred: facet?.starred?.[0]?.count ?? 0,
      archived: facet?.archived?.[0]?.count ?? 0,
    };
  }

  /** Unfiltered KPIs. Inbox numbers exclude archived threads. */
  private async computeConversationStats(
    employerObjectId: mongoose.Types.ObjectId,
  ): Promise<NotificationConversationStats> {
    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const flagged = await EmployerMessageThreadStateModel.find({
      employerId: employerObjectId,
      $or: [{ starredAt: { $ne: null } }, { archivedAt: { $ne: null } }],
    })
      .select("referenceId starredAt archivedAt")
      .lean();
    const archivedIds = flagged
      .filter((row) => row.archivedAt)
      .map((row) => row.referenceId);
    const starredIds = flagged
      .filter((row) => row.starredAt)
      .map((row) => row.referenceId);

    const threadMatch = {
      recipientType: "employer",
      recipientId: employerObjectId,
      referenceType: { $in: [...MESSAGES_THREAD_REFERENCE_TYPES] },
    };
    const inboxReference = { $nin: ["", null, ...archivedIds] };

    const countThreads = async (
      filter: Record<string, unknown>,
    ): Promise<number> => {
      const [row] = await NotificationModel.aggregate<{ count: number }>([
        { $match: filter },
        { $group: { _id: "$referenceId" } },
        { $count: "count" },
      ]);
      return row?.count ?? 0;
    };

    const [
      totalConversations,
      unreadConversations,
      starredConversations,
      archivedConversations,
      activeHiringRows,
      interviewEventsLast7Days,
    ] = await Promise.all([
      countThreads({ ...threadMatch, referenceId: inboxReference }),
      countThreads({
        $and: [
          { ...threadMatch, referenceId: inboxReference },
          { readAt: null },
          buildActiveInboxFilter(now),
        ],
      }),
      starredIds.length > 0
        ? countThreads({ ...threadMatch, referenceId: { $in: starredIds } })
        : Promise.resolve(0),
      archivedIds.length > 0
        ? countThreads({ ...threadMatch, referenceId: { $in: archivedIds } })
        : Promise.resolve(0),
      NotificationModel.aggregate<{ count: number }>([
        {
          $match: {
            recipientType: "employer",
            recipientId: employerObjectId,
            referenceType: "application",
            referenceId: inboxReference,
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
            "application.status": {
              $exists: true,
              $nin: [...TERMINAL_APPLICATION_STATUSES],
            },
          },
        },
        { $count: "count" },
      ]),
      NotificationModel.countDocuments({
        recipientType: "employer",
        recipientId: employerObjectId,
        referenceType: "application",
        referenceId: inboxReference,
        type: { $in: [...INTERVIEW_EVENT_TYPES] },
        createdAt: { $gte: weekAgo },
      }),
    ]);

    return {
      totalConversations,
      unreadConversations,
      starredConversations,
      archivedConversations,
      activeHiringConversations: activeHiringRows[0]?.count ?? 0,
      interviewEventsLast7Days,
    };
  }

  /** Job filter options across every application thread (archived included). */
  private async computeConversationJobFacets(
    employerObjectId: mongoose.Types.ObjectId,
  ): Promise<NotificationConversationListResult["jobFacets"]> {
    return NotificationModel.aggregate<{
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
    ]);
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
        referenceType: { $in: ["application", "job"] },
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
   * Flags the newest active employer notification in a thread as unread.
   * Only read state and inbox retention change; history is never removed.
   */
  async markConversationAsUnread(input: {
    employerId: string;
    applicationId: string;
  }): Promise<{ notificationId: string; unreadCount: number }> {
    if (
      !mongoose.Types.ObjectId.isValid(input.employerId) ||
      !mongoose.Types.ObjectId.isValid(input.applicationId)
    ) {
      throw new AppError("Unauthorized", HTTP_STATUS.UNAUTHORIZED);
    }

    const now = new Date();
    const threadFilter = {
      recipientType: "employer",
      recipientId: input.employerId,
      referenceType: { $in: ["application", "job"] },
      referenceId: input.applicationId,
    };

    const latest = await NotificationModel.findOne({
      $and: [threadFilter, buildActiveInboxFilter(now)],
    })
      .sort({ createdAt: -1, _id: -1 })
      .select("_id readAt")
      .lean();

    if (!latest) {
      throw new AppError(
        "This conversation has no notifications that can be marked as unread.",
        HTTP_STATUS.NOT_FOUND,
      );
    }

    if (latest.readAt) {
      await NotificationModel.updateOne(
        { _id: latest._id },
        { $set: { readAt: null, expiresAt: computeUnreadExpiresAt(now) } },
      );
    }

    const unreadCount = await NotificationModel.countDocuments({
      $and: [threadFilter, { readAt: null }, buildActiveInboxFilter(now)],
    });

    return { notificationId: String(latest._id), unreadCount };
  }

  /** Subset of `ids` that are Messages threads holding this employer's notifications. */
  private async findOwnedThreadIds(
    employerId: string,
    ids: string[],
  ): Promise<Set<string>> {
    if (ids.length === 0) {
      return new Set();
    }
    const owned = await NotificationModel.distinct("referenceId", {
      recipientType: "employer",
      recipientId: new mongoose.Types.ObjectId(employerId),
      referenceType: { $in: [...MESSAGES_THREAD_REFERENCE_TYPES] },
      referenceId: { $in: ids },
    });
    return new Set(owned.map((value) => String(value)));
  }

  async getConversationState(input: {
    employerId: string;
    applicationId: string;
  }): Promise<NotificationConversationState> {
    const state = await EmployerMessageThreadStateModel.findOne({
      employerId: new mongoose.Types.ObjectId(input.employerId),
      referenceId: input.applicationId,
    })
      .select("starredAt archivedAt mutedAt")
      .lean();
    return {
      applicationId: input.applicationId,
      starred: Boolean(state?.starredAt),
      archived: Boolean(state?.archivedAt),
      muted: Boolean(state?.mutedAt),
    };
  }

  /**
   * Star / archive / mute one thread for this employer workspace only.
   * Notifications are never modified, so history and read state are untouched.
   */
  async setConversationFlag(input: {
    employerId: string;
    applicationId: string;
    flag: NotificationConversationFlag;
    value: boolean;
  }): Promise<NotificationConversationState> {
    if (
      !mongoose.Types.ObjectId.isValid(input.employerId) ||
      !mongoose.Types.ObjectId.isValid(input.applicationId)
    ) {
      throw new AppError("Unauthorized", HTTP_STATUS.UNAUTHORIZED);
    }

    const applicationId = input.applicationId.trim().toLowerCase();
    const owned = await this.findOwnedThreadIds(input.employerId, [
      applicationId,
    ]);
    if (!owned.has(applicationId)) {
      throw new AppError("Conversation not found", HTTP_STATUS.NOT_FOUND);
    }

    const employerObjectId = new mongoose.Types.ObjectId(input.employerId);
    const filter = { employerId: employerObjectId, referenceId: applicationId };
    const field =
      input.flag === "starred"
        ? "starredAt"
        : input.flag === "archived"
          ? "archivedAt"
          : "mutedAt";

    try {
      await EmployerMessageThreadStateModel.updateOne(
        filter,
        { $setOnInsert: { starredAt: null, archivedAt: null, mutedAt: null } },
        { upsert: true },
      );
    } catch (error) {
      // A concurrent request created the row first; it is safe to continue.
      if ((error as { code?: number }).code !== 11000) {
        throw error;
      }
    }

    if (input.value) {
      // Keep the first timestamp when the flag is already on.
      await EmployerMessageThreadStateModel.updateOne(
        { ...filter, [field]: null },
        { $set: { [field]: new Date() } },
      );
    } else {
      await EmployerMessageThreadStateModel.updateOne(filter, {
        $set: { [field]: null },
      });
    }

    return this.getConversationState({
      employerId: input.employerId,
      applicationId,
    });
  }

  /**
   * Bulk Mark as Read / Unread. Ownership is checked per thread; ids that are
   * not this employer's threads are reported back and never touched.
   */
  async bulkUpdateConversationReadState(input: {
    employerId: string;
    applicationIds: string[];
    action: "read" | "unread";
  }): Promise<{
    action: "read" | "unread";
    updated: Array<{ applicationId: string; unreadCount: number }>;
    notFound: string[];
    skipped: string[];
    updatedNotificationCount: number;
  }> {
    if (!mongoose.Types.ObjectId.isValid(input.employerId)) {
      throw new AppError("Unauthorized", HTTP_STATUS.UNAUTHORIZED);
    }

    const ids = dedupeConversationIds(input.applicationIds).filter((id) =>
      /^[a-f0-9]{24}$/.test(id),
    );
    const owned = await this.findOwnedThreadIds(input.employerId, ids);
    const ownedIds = ids.filter((id) => owned.has(id));
    const notFound = ids.filter((id) => !owned.has(id));
    const skipped: string[] = [];
    let updatedNotificationCount = 0;

    if (ownedIds.length === 0) {
      return {
        action: input.action,
        updated: [],
        notFound,
        skipped,
        updatedNotificationCount,
      };
    }

    const employerObjectId = new mongoose.Types.ObjectId(input.employerId);

    if (input.action === "read") {
      const readAt = new Date();
      const result = await NotificationModel.updateMany(
        {
          recipientType: "employer",
          recipientId: employerObjectId,
          referenceType: { $in: [...MESSAGES_THREAD_REFERENCE_TYPES] },
          referenceId: { $in: ownedIds },
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
      updatedNotificationCount = result.modifiedCount;
    } else {
      for (const applicationId of ownedIds) {
        try {
          await this.markConversationAsUnread({
            employerId: input.employerId,
            applicationId,
          });
          updatedNotificationCount += 1;
        } catch (error) {
          if (
            error instanceof AppError &&
            error.statusCode === HTTP_STATUS.NOT_FOUND
          ) {
            skipped.push(applicationId);
            continue;
          }
          throw error;
        }
      }
    }

    const now = new Date();
    const unreadRows = await NotificationModel.aggregate<{
      _id: string;
      count: number;
    }>([
      {
        $match: {
          $and: [
            {
              recipientType: "employer",
              recipientId: employerObjectId,
              referenceType: { $in: [...MESSAGES_THREAD_REFERENCE_TYPES] },
              referenceId: { $in: ownedIds },
              readAt: null,
            },
            buildActiveInboxFilter(now),
          ],
        },
      },
      { $group: { _id: "$referenceId", count: { $sum: 1 } } },
    ]);
    const unreadById = new Map(
      unreadRows.map((row) => [String(row._id), row.count]),
    );
    const skippedSet = new Set(skipped);

    return {
      action: input.action,
      updated: ownedIds
        .filter((id) => !skippedSet.has(id))
        .map((applicationId) => ({
          applicationId,
          unreadCount: unreadById.get(applicationId) ?? 0,
        })),
      notFound,
      skipped,
      updatedNotificationCount,
    };
  }

  /**
   * CSV of this employer's own Messages notifications (seeker-side rows and
   * candidate phone numbers are never included). Every export is audit logged.
   */
  async exportConversationsCsv(
    input: NotificationConversationFilters & {
      actor: { teamMemberId: string | null; ip: string | null };
    },
  ): Promise<{ buffer: Buffer; fileName: string; rowCount: number }> {
    if (!mongoose.Types.ObjectId.isValid(input.employerId)) {
      throw new AppError("Unauthorized", HTTP_STATUS.UNAUTHORIZED);
    }

    await ensureEmployerJobRelationsConsistent(input.employerId);

    const employerObjectId = new mongoose.Types.ObjectId(input.employerId);
    const pipeline = this.buildConversationThreadPipeline(
      input,
      conversationThreadMatches(input),
    );
    pipeline.push(
      { $sort: { "latest.createdAt": -1, _id: 1 } },
      { $limit: MESSAGES_EXPORT_MAX_THREADS + 1 },
      {
        $project: {
          _id: 1,
          latestReferenceType: "$latest.referenceType",
          candidateName: "$application.resumeSnapshot.resumeJson.header.fullName",
          applicationStatus: "$application.status",
          applicationPublicJobId: "$application.publicJobId",
          jobTitle: "$job.jobTitle",
          jobPublicId: "$job.jobId",
        },
      },
    );

    const threads = await NotificationModel.aggregate<{
      _id: string;
      latestReferenceType?: string;
      candidateName?: string;
      applicationStatus?: string;
      applicationPublicJobId?: string;
      jobTitle?: string;
      jobPublicId?: string;
    }>(pipeline);

    if (threads.length > MESSAGES_EXPORT_MAX_THREADS) {
      throw new AppError(
        `Export is limited to ${MESSAGES_EXPORT_MAX_THREADS} conversations. Narrow your filters and try again.`,
        HTTP_STATUS.BAD_REQUEST,
      );
    }
    if (threads.length === 0) {
      throw new AppError(
        "No notifications found for the selected filters.",
        HTTP_STATUS.BAD_REQUEST,
      );
    }

    const threadById = new Map(threads.map((thread) => [String(thread._id), thread]));
    const notificationFilter: Record<string, unknown> = {
      recipientType: "employer",
      recipientId: employerObjectId,
      referenceType: { $in: [...MESSAGES_THREAD_REFERENCE_TYPES] },
      referenceId: { $in: [...threadById.keys()] },
    };
    if (input.category !== "all") {
      notificationFilter.category = input.category;
    }
    const dateRange = resolveConversationDateRange({
      quickDate: input.quickDate ?? "all",
      dateFrom: input.dateFrom ?? "",
      dateTo: input.dateTo ?? "",
    });
    if (dateRange) {
      notificationFilter.createdAt = {
        $gte: dateRange.from,
        $lte: dateRange.to,
      };
    }

    const notifications = await NotificationModel.find(notificationFilter)
      .sort({ createdAt: -1, _id: -1 })
      .limit(MESSAGES_EXPORT_MAX_ROWS + 1)
      .select("referenceId category type title body readAt createdAt")
      .lean();

    if (notifications.length > MESSAGES_EXPORT_MAX_ROWS) {
      throw new AppError(
        `Export is limited to ${MESSAGES_EXPORT_MAX_ROWS} notifications. Narrow your filters and try again.`,
        HTTP_STATUS.BAD_REQUEST,
      );
    }

    const rows: MessagesExportRow[] = notifications.map((row) => {
      const thread = threadById.get(String(row.referenceId));
      const threadType =
        thread?.latestReferenceType === "job" || !thread?.applicationStatus
          ? "job"
          : "application";
      return {
        createdAt: row.createdAt ?? new Date(0),
        threadType,
        candidateName: thread?.candidateName?.trim() || "Candidate",
        jobTitle: thread?.jobTitle?.trim() || "Job",
        publicJobId:
          thread?.applicationPublicJobId?.trim() ||
          thread?.jobPublicId?.trim() ||
          "",
        applicationStatus: thread?.applicationStatus ?? "",
        category: row.category,
        type: row.type,
        title: row.title,
        body: row.body,
        isRead: Boolean(row.readAt),
      };
    });

    const csv = buildMessagesExportCsv(rows, (status) =>
      status in APPLICATION_STATUS_LABELS
        ? APPLICATION_STATUS_LABELS[
            status as keyof typeof APPLICATION_STATUS_LABELS
          ]
        : status,
    );
    const fileName = buildMessagesExportFileName();

    try {
      await recordTeamActivity({
        employerId: input.employerId,
        type: "messages_exported",
        message: `Exported ${rows.length} Messages notification(s) from ${threads.length} conversation(s) as CSV.`,
        memberId: input.actor.teamMemberId,
        actorEmployerId: input.actor.teamMemberId ? null : input.employerId,
        metadata: {
          exportType: "csv",
          rowCount: rows.length,
          conversationCount: threads.length,
          filters: {
            view: input.view ?? "inbox",
            readStatus: input.readStatus,
            category: input.category,
            search: input.search || null,
            publicJobId: input.publicJobId || null,
            applicationStatus: input.applicationStatus ?? "all",
            hasType: input.hasType ?? "all",
            employerAction: input.employerAction ?? "all",
            candidateAction: input.candidateAction ?? "all",
            conversationType: input.conversationType ?? "all",
            quickDate: input.quickDate ?? "all",
            dateFrom: input.dateFrom || null,
            dateTo: input.dateTo || null,
          },
          ip: input.actor.ip,
          fileName,
          exportedAt: new Date().toISOString(),
        },
      });
    } catch {
      // Audit failure must not block the download.
    }

    return {
      buffer: Buffer.from(csv, "utf8"),
      fileName,
      rowCount: rows.length,
    };
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
    before?: string;
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

    const job = application
      ? null
      : await JobModel.findOne({
          _id: input.applicationId,
          $or: [
            { employerId: new mongoose.Types.ObjectId(input.employerId) },
            { companyId: new mongoose.Types.ObjectId(input.employerId) },
          ],
        })
          .select("_id")
          .lean();

    if (!application && !job) {
      throw new AppError("Conversation not found", HTTP_STATUS.NOT_FOUND);
    }

    const referenceType = application ? "application" : "job";

    // Cap scan size — conversation threads are typically small; unbounded
    // load would degrade under long-running hiring threads. Newest rows win
    // so the latest activity is never cut off.
    const TIMELINE_SCAN_CAP = 1_000;
    const rows = await NotificationModel.find({
      referenceType,
      referenceId: input.applicationId,
      $or: [
        { recipientType: "employer", recipientId: input.employerId },
        ...(application ? [{ recipientType: "job_seeker" }] : []),
      ],
    })
      .sort({ createdAt: -1, _id: -1 })
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
        metadata: row.metadata,
        readAt: row.readAt,
        createdAt: row.createdAt,
      })),
    );

    const total = unified.length;
    const page = sliceConversationTimelinePage(unified, {
      limit: input.limit,
      before: input.before,
      page: input.page,
    });

    return {
      notifications: page.items,
      pagination: {
        page: input.page,
        limit: input.limit,
        total,
        totalPages: Math.max(1, Math.ceil(total / input.limit)),
        hasOlder: page.hasOlder,
        olderCursor: page.olderCursor,
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
      case APPLICATION_EVENT_NAMES.OFFER_ACCEPTED:
        jobs.push(
          {
            recipientType: "job_seeker",
            recipientId: context.jobSeekerId,
            type: "offer_accepted",
            category: "offer",
            title: "Offer Accepted",
            body: `You accepted the offer for ${jobTitle} at ${company}.`,
            referenceType: "application",
            referenceId: context.applicationId,
            actionPath: seekerPath,
          },
          {
            recipientType: "employer",
            recipientId: context.employerId,
            type: "offer_accepted",
            category: "offer",
            title: "Offer Accepted",
            body: `${candidate} accepted the offer for ${jobTitle}.`,
            priority: "high",
            referenceType: "application",
            referenceId: context.applicationId,
            actionPath: employerPath,
            metadata: { publicJobId: context.publicJobId },
          },
        );
        break;
      case APPLICATION_EVENT_NAMES.OFFER_DECLINED:
        jobs.push(
          {
            recipientType: "job_seeker",
            recipientId: context.jobSeekerId,
            type: "offer_declined",
            category: "offer",
            title: "Offer Declined",
            body: `You declined the offer for ${jobTitle} at ${company}.`,
            referenceType: "application",
            referenceId: context.applicationId,
            actionPath: seekerPath,
          },
          {
            recipientType: "employer",
            recipientId: context.employerId,
            type: "offer_declined",
            category: "offer",
            title: "Offer Declined",
            body: `${candidate} declined the offer for ${jobTitle}.`,
            priority: "high",
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
      case APPLICATION_EVENT_NAMES.DID_NOT_JOIN:
        jobs.push(
          {
            recipientType: "job_seeker",
            recipientId: context.jobSeekerId,
            type: "application_did_not_join",
            category: "system",
            title: "Did Not Join",
            body: `Your status for ${jobTitle} was updated to Did Not Join.`,
            referenceType: "application",
            referenceId: context.applicationId,
            actionPath: seekerPath,
          },
          {
            recipientType: "employer",
            recipientId: context.employerId,
            type: "application_did_not_join",
            category: "system",
            title: "Did Not Join",
            body: `${candidate} was marked as did not join for ${jobTitle}.`,
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

    const templateParams = applicationTemplateParams(eventName, context);
    for (const job of jobs) {
      await this.createNotification({
        ...job,
        metadata: {
          ...job.metadata,
          [NOTIFICATION_TEMPLATE_PARAMS_KEY]: templateParams,
        },
      });
    }
  }

  /**
   * One employer-owned inbox message for an Operations job close.
   * Idempotent on employer + job so retries do not duplicate the thread.
   */
  async notifyEmployerJobClosed(input: {
    employerId: string;
    jobMongoId: string;
    publicJobId: string;
    jobTitle: string;
    reason: string;
    closedByLabel: string;
  }): Promise<{ created: boolean; alreadySent: boolean }> {
    if (
      !mongoose.Types.ObjectId.isValid(input.employerId) ||
      !mongoose.Types.ObjectId.isValid(input.jobMongoId)
    ) {
      throw new AppError("Invalid employer or job.", HTTP_STATUS.BAD_REQUEST);
    }

    const existing = await NotificationModel.findOne({
      recipientType: "employer",
      recipientId: input.employerId,
      type: "job_closed",
      referenceType: "job",
      referenceId: input.jobMongoId,
    })
      .select("_id")
      .lean();

    if (existing) {
      return { created: false, alreadySent: true };
    }

    const title = "Job closed notification";
    const jobTitle = input.jobTitle.trim() || "Untitled job";
    const body = [
      `Job Title: ${jobTitle}`,
      `Job ID: ${input.publicJobId}`,
      `Closure reason: ${input.reason.trim()}`,
      `Closed by: ${input.closedByLabel.trim() || "Operations"}`,
    ].join("\n");

    await this.createNotification({
      recipientType: "employer",
      recipientId: input.employerId,
      type: "job_closed",
      category: "system",
      title,
      body,
      priority: "high",
      referenceType: "job",
      referenceId: input.jobMongoId,
      actionPath: "/employer/jobs",
      metadata: {
        publicJobId: input.publicJobId,
        jobTitle,
        closedBy: input.closedByLabel,
        [NOTIFICATION_TEMPLATE_PARAMS_KEY]: buildTemplateParams({
          jobTitle: input.jobTitle,
          publicJobId: input.publicJobId,
          reason: input.reason,
          actor: input.closedByLabel,
        }),
      },
    });

    return { created: true, alreadySent: false };
  }

  /**
   * Employer inbox notice when Operations approves a job listing.
   * Idempotent on employer + job + type so retries do not duplicate.
   */
  async notifyEmployerJobApproved(input: {
    employerId: string;
    jobMongoId: string;
    publicJobId: string;
    jobTitle: string;
    reviewedByLabel: string;
  }): Promise<{ created: boolean; alreadySent: boolean }> {
    if (
      !mongoose.Types.ObjectId.isValid(input.employerId) ||
      !mongoose.Types.ObjectId.isValid(input.jobMongoId)
    ) {
      throw new AppError("Invalid employer or job.", HTTP_STATUS.BAD_REQUEST);
    }

    const existing = await NotificationModel.findOne({
      recipientType: "employer",
      recipientId: input.employerId,
      type: "job_approved",
      referenceType: "job",
      referenceId: input.jobMongoId,
    })
      .select("_id")
      .lean();

    if (existing) {
      await NotificationModel.deleteOne({ _id: existing._id });
    }

    const jobTitle = input.jobTitle.trim() || "Untitled job";
    const body = [
      `Job Title: ${jobTitle}`,
      `Job ID: ${input.publicJobId}`,
      `Status: Live`,
      `Approved by: ${input.reviewedByLabel.trim() || "Operations"}`,
      "Your job is now visible to candidates on AsliJobs.",
    ].join("\n");

    await this.createNotification({
      recipientType: "employer",
      recipientId: input.employerId,
      type: "job_approved",
      category: "system",
      title: "Job approved and published",
      body,
      priority: "high",
      referenceType: "job",
      referenceId: input.jobMongoId,
      actionPath: "/employer/jobs",
      metadata: {
        publicJobId: input.publicJobId,
        jobTitle,
        reviewedBy: input.reviewedByLabel,
        [NOTIFICATION_TEMPLATE_PARAMS_KEY]: buildTemplateParams({
          jobTitle: input.jobTitle,
          publicJobId: input.publicJobId,
          actor: input.reviewedByLabel,
        }),
      },
    });

    return { created: true, alreadySent: false };
  }

  /**
   * Employer inbox notice when Operations rejects a job listing.
   */
  async notifyEmployerJobRejected(input: {
    employerId: string;
    jobMongoId: string;
    publicJobId: string;
    jobTitle: string;
    reason: string;
    reviewedByLabel: string;
  }): Promise<{ created: boolean; alreadySent: boolean }> {
    if (
      !mongoose.Types.ObjectId.isValid(input.employerId) ||
      !mongoose.Types.ObjectId.isValid(input.jobMongoId)
    ) {
      throw new AppError("Invalid employer or job.", HTTP_STATUS.BAD_REQUEST);
    }

    const existing = await NotificationModel.findOne({
      recipientType: "employer",
      recipientId: input.employerId,
      type: "job_rejected",
      referenceType: "job",
      referenceId: input.jobMongoId,
    })
      .select("_id")
      .lean();

    if (existing) {
      await NotificationModel.deleteOne({ _id: existing._id });
    }

    const jobTitle = input.jobTitle.trim() || "Untitled job";
    const body = [
      `Job Title: ${jobTitle}`,
      `Job ID: ${input.publicJobId}`,
      `Status: Rejected`,
      `Rejection reason: ${input.reason.trim()}`,
      `Reviewed by: ${input.reviewedByLabel.trim() || "Operations"}`,
      "Update the job and resubmit it for Operations review.",
    ].join("\n");

    await this.createNotification({
      recipientType: "employer",
      recipientId: input.employerId,
      type: "job_rejected",
      category: "system",
      title: "Job rejected",
      body,
      priority: "high",
      referenceType: "job",
      referenceId: input.jobMongoId,
      actionPath: "/employer/jobs",
      metadata: {
        publicJobId: input.publicJobId,
        jobTitle,
        rejectionReason: input.reason.trim(),
        reviewedBy: input.reviewedByLabel,
        [NOTIFICATION_TEMPLATE_PARAMS_KEY]: buildTemplateParams({
          jobTitle: input.jobTitle,
          publicJobId: input.publicJobId,
          reason: input.reason,
          actor: input.reviewedByLabel,
        }),
      },
    });

    return { created: true, alreadySent: false };
  }

  /**
   * Employer inbox notice when Operations approves edits to a live job.
   */
  async notifyEmployerLiveJobChangesApproved(input: {
    employerId: string;
    jobMongoId: string;
    publicJobId: string;
    jobTitle: string;
    reviewedByLabel: string;
  }): Promise<{ created: boolean; alreadySent: boolean }> {
    if (
      !mongoose.Types.ObjectId.isValid(input.employerId) ||
      !mongoose.Types.ObjectId.isValid(input.jobMongoId)
    ) {
      throw new AppError("Invalid employer or job.", HTTP_STATUS.BAD_REQUEST);
    }

    const existing = await NotificationModel.findOne({
      recipientType: "employer",
      recipientId: input.employerId,
      type: "job_live_changes_approved",
      referenceType: "job",
      referenceId: input.jobMongoId,
    })
      .select("_id")
      .lean();

    if (existing) {
      await NotificationModel.deleteOne({ _id: existing._id });
    }

    const jobTitle = input.jobTitle.trim() || "Untitled job";
    const body = [
      `Job Title: ${jobTitle}`,
      `Job ID: ${input.publicJobId}`,
      `Status: Live`,
      `Approved by: ${input.reviewedByLabel.trim() || "Operations"}`,
      "Your job changes are now visible to candidates on AsliJobs.",
    ].join("\n");

    await this.createNotification({
      recipientType: "employer",
      recipientId: input.employerId,
      type: "job_live_changes_approved",
      category: "system",
      title: "Job changes approved and published",
      body,
      priority: "high",
      referenceType: "job",
      referenceId: input.jobMongoId,
      actionPath: "/employer/jobs",
      metadata: {
        publicJobId: input.publicJobId,
        jobTitle,
        reviewedBy: input.reviewedByLabel,
        reviewKind: "live_change",
        [NOTIFICATION_TEMPLATE_PARAMS_KEY]: buildTemplateParams({
          jobTitle: input.jobTitle,
          publicJobId: input.publicJobId,
          actor: input.reviewedByLabel,
        }),
      },
    });

    return { created: true, alreadySent: false };
  }

  /**
   * Employer inbox notice when Operations rejects edits to a live job.
   */
  async notifyEmployerLiveJobChangesRejected(input: {
    employerId: string;
    jobMongoId: string;
    publicJobId: string;
    jobTitle: string;
    reason: string;
    reviewedByLabel: string;
  }): Promise<{ created: boolean; alreadySent: boolean }> {
    if (
      !mongoose.Types.ObjectId.isValid(input.employerId) ||
      !mongoose.Types.ObjectId.isValid(input.jobMongoId)
    ) {
      throw new AppError("Invalid employer or job.", HTTP_STATUS.BAD_REQUEST);
    }

    const existing = await NotificationModel.findOne({
      recipientType: "employer",
      recipientId: input.employerId,
      type: "job_live_changes_rejected",
      referenceType: "job",
      referenceId: input.jobMongoId,
    })
      .select("_id")
      .lean();

    if (existing) {
      await NotificationModel.deleteOne({ _id: existing._id });
    }

    const jobTitle = input.jobTitle.trim() || "Untitled job";
    const body = [
      `Job Title: ${jobTitle}`,
      `Job ID: ${input.publicJobId}`,
      `Status: Live (previous version unchanged)`,
      `Rejection reason: ${input.reason.trim()}`,
      `Reviewed by: ${input.reviewedByLabel.trim() || "Operations"}`,
      "Your live job is unchanged. Edit and resubmit the changes for Operations review.",
    ].join("\n");

    await this.createNotification({
      recipientType: "employer",
      recipientId: input.employerId,
      type: "job_live_changes_rejected",
      category: "system",
      title: "Job changes rejected",
      body,
      priority: "high",
      referenceType: "job",
      referenceId: input.jobMongoId,
      actionPath: "/employer/jobs",
      metadata: {
        publicJobId: input.publicJobId,
        jobTitle,
        rejectionReason: input.reason.trim(),
        reviewedBy: input.reviewedByLabel,
        reviewKind: "live_change",
        [NOTIFICATION_TEMPLATE_PARAMS_KEY]: buildTemplateParams({
          jobTitle: input.jobTitle,
          publicJobId: input.publicJobId,
          reason: input.reason,
          actor: input.reviewedByLabel,
        }),
      },
    });

    return { created: true, alreadySent: false };
  }

  /**
   * Employer inbox notice when Operations verifies the employer account.
   * Idempotent on employer + type so retries do not duplicate.
   */
  async notifyEmployerVerificationApproved(input: {
    employerId: string;
    reviewedByLabel: string;
  }): Promise<{ created: boolean; alreadySent: boolean }> {
    if (!mongoose.Types.ObjectId.isValid(input.employerId)) {
      throw new AppError("Invalid employer.", HTTP_STATUS.BAD_REQUEST);
    }

    const existing = await NotificationModel.findOne({
      recipientType: "employer",
      recipientId: input.employerId,
      type: "employer_verification_approved",
      referenceType: "employer",
      referenceId: input.employerId,
    })
      .select("_id")
      .lean();

    if (existing) {
      return { created: false, alreadySent: true };
    }

    const reviewedBy = input.reviewedByLabel.trim() || "Operations";
    const body = [
      "Your employer account has been verified.",
      "You can now post jobs and hire on AsliJobs.",
      `Verified by: ${reviewedBy}`,
    ].join("\n");

    await this.createNotification({
      recipientType: "employer",
      recipientId: input.employerId,
      type: "employer_verification_approved",
      category: "system",
      title: "Employer account verified",
      body,
      priority: "high",
      referenceType: "employer",
      referenceId: input.employerId,
      actionPath: "/employer/company-profile",
      metadata: {
        reviewedBy,
      },
    });

    return { created: true, alreadySent: false };
  }

  /**
   * Employer inbox notice when Operations rejects employer verification.
   * Replaces any prior rejection notice for a new rejection cycle.
   */
  async notifyEmployerVerificationRejected(input: {
    employerId: string;
    reason: string;
    reviewedByLabel: string;
  }): Promise<{ created: boolean; alreadySent: boolean }> {
    if (!mongoose.Types.ObjectId.isValid(input.employerId)) {
      throw new AppError("Invalid employer.", HTTP_STATUS.BAD_REQUEST);
    }

    const existing = await NotificationModel.findOne({
      recipientType: "employer",
      recipientId: input.employerId,
      type: "employer_verification_rejected",
      referenceType: "employer",
      referenceId: input.employerId,
    })
      .select("_id")
      .lean();

    if (existing) {
      await NotificationModel.deleteOne({ _id: existing._id });
    }

    const reviewedBy = input.reviewedByLabel.trim() || "Operations";
    const reason = input.reason.trim();
    const body = [
      "Your employer verification was rejected.",
      `Rejection reason: ${reason}`,
      `Reviewed by: ${reviewedBy}`,
      "Update your documents and resubmit for verification.",
    ].join("\n");

    await this.createNotification({
      recipientType: "employer",
      recipientId: input.employerId,
      type: "employer_verification_rejected",
      category: "system",
      title: "Employer verification rejected",
      body,
      priority: "high",
      referenceType: "employer",
      referenceId: input.employerId,
      actionPath: "/employer/company-profile",
      metadata: {
        rejectionReason: reason,
        reviewedBy,
      },
    });

    return { created: true, alreadySent: false };
  }

  /**
   * Employer inbox notice when Operations requests additional verification documents.
   * Replaces any prior request notice for the same employer cycle.
   */
  async notifyEmployerVerificationDocumentsRequested(input: {
    employerId: string;
    message: string;
    documentTypes: string[];
    reviewedByLabel: string;
  }): Promise<{ created: boolean; alreadySent: boolean }> {
    if (!mongoose.Types.ObjectId.isValid(input.employerId)) {
      throw new AppError("Invalid employer.", HTTP_STATUS.BAD_REQUEST);
    }

    const existing = await NotificationModel.findOne({
      recipientType: "employer",
      recipientId: input.employerId,
      type: "employer_verification_documents_requested",
      referenceType: "employer",
      referenceId: input.employerId,
    })
      .select("_id")
      .lean();

    if (existing) {
      await NotificationModel.deleteOne({ _id: existing._id });
    }

    const reviewedBy = input.reviewedByLabel.trim() || "Operations";
    const message = input.message.trim();
    const requestedTypes = input.documentTypes
      .map((value) => value.trim())
      .filter(Boolean);
    const typesLine =
      requestedTypes.length > 0
        ? `Requested documents: ${requestedTypes.join(", ")}`
        : "Please upload the additional documents requested by Operations.";

    const body = [
      "Additional documents are required to complete employer verification.",
      message,
      typesLine,
      `Requested by: ${reviewedBy}`,
    ].join("\n");

    await this.createNotification({
      recipientType: "employer",
      recipientId: input.employerId,
      type: "employer_verification_documents_requested",
      category: "system",
      title: "Additional documents requested",
      body,
      priority: "high",
      referenceType: "employer",
      referenceId: input.employerId,
      actionPath: "/employer/company-profile",
      metadata: {
        requestMessage: message,
        documentTypes: requestedTypes,
        reviewedBy,
      },
    });

    return { created: true, alreadySent: false };
  }
}

export const notificationService = new NotificationService();
