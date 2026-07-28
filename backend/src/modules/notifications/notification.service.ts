import mongoose from "mongoose";
import { HTTP_STATUS } from "../../constants/http-status.js";
import { AppError } from "../../middleware/error.middleware.js";
import { APPLICATION_EVENT_NAMES } from "../applications/application.constants.js";
import { NOTIFICATION_CHANNEL_DEFAULTS } from "./notification.constants.js";
import { NotificationModel } from "./notification.model.js";
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

    const filter: Record<string, unknown> = {
      recipientType: input.recipientType,
      recipientId: input.recipientId,
    };

    if (input.readStatus === "unread") {
      filter.readAt = null;
    } else if (input.readStatus === "read") {
      filter.readAt = { $ne: null };
    }

    if (input.category !== "all") {
      filter.category = input.category;
    }

    const referenceId = input.referenceId?.trim() ?? "";
    if (referenceId) {
      filter.referenceType = "application";
      filter.referenceId = referenceId;
    }

    const search = input.search.trim();
    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: "i" } },
        { body: { $regex: search, $options: "i" } },
      ];
    }

    const [total, unreadCount, rows] = await Promise.all([
      NotificationModel.countDocuments(filter),
      NotificationModel.countDocuments({
        recipientType: input.recipientType,
        recipientId: input.recipientId,
        readAt: null,
      }),
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
      recipientType: input.recipientType,
      recipientId: input.recipientId,
      readAt: null,
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

    const notification = await NotificationModel.findOne({
      _id: input.notificationId,
      recipientType: input.recipientType,
      recipientId: input.recipientId,
    });

    if (!notification) {
      throw new AppError("Notification not found", HTTP_STATUS.NOT_FOUND);
    }

    if (!notification.readAt) {
      notification.readAt = new Date();
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

    const result = await NotificationModel.updateMany(
      {
        recipientType: input.recipientType,
        recipientId: input.recipientId,
        readAt: null,
      },
      { $set: { readAt: new Date() } },
    );

    return { updatedCount: result.modifiedCount };
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
  }): Promise<NotificationConversationListResult> {
    if (!mongoose.Types.ObjectId.isValid(input.employerId)) {
      throw new AppError("Unauthorized", HTTP_STATUS.UNAUTHORIZED);
    }

    const employerObjectId = new mongoose.Types.ObjectId(input.employerId);
    const match: Record<string, unknown> = {
      recipientType: "employer",
      recipientId: employerObjectId,
      referenceType: "application",
      referenceId: { $nin: ["", null] },
    };

    if (input.category !== "all") {
      match.category = input.category;
    }

    const search = input.search.trim();

    const pipeline: mongoose.PipelineStage[] = [
      { $match: match },
      { $sort: { createdAt: -1 } },
      {
        $group: {
          _id: "$referenceId",
          latest: { $first: "$$ROOT" },
          unreadCount: {
            $sum: {
              $cond: [{ $eq: ["$readAt", null] }, 1, 0],
            },
          },
          messageCount: { $sum: 1 },
        },
      },
    ];

    if (input.readStatus === "unread") {
      pipeline.push({ $match: { unreadCount: { $gt: 0 } } });
    } else if (input.readStatus === "read") {
      pipeline.push({ $match: { unreadCount: 0 } });
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

    if (search) {
      const escaped = search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      pipeline.push({
        $match: {
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
            { "application.publicJobId": { $regex: escaped, $options: "i" } },
            { "latest.title": { $regex: escaped, $options: "i" } },
            { "latest.body": { $regex: escaped, $options: "i" } },
          ],
        },
      });
    }

    pipeline.push({
      $facet: {
        items: [
          { $sort: { "latest.createdAt": -1 } },
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

    const unreadCount = await NotificationModel.countDocuments({
      recipientType: "employer",
      recipientId: employerObjectId,
      readAt: null,
    });

    return {
      conversations,
      pagination: {
        page: input.page,
        limit: input.limit,
        total,
        totalPages: Math.max(1, Math.ceil(total / input.limit)),
      },
      unreadCount,
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

    const result = await NotificationModel.updateMany(
      {
        recipientType: input.recipientType,
        recipientId: input.recipientId,
        referenceType: "application",
        referenceId: input.applicationId,
        readAt: null,
      },
      { $set: { readAt: new Date() } },
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

    const rows = await NotificationModel.find({
      referenceType: "application",
      referenceId: input.applicationId,
    })
      .sort({ createdAt: 1 })
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
