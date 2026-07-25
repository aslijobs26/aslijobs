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
  NotificationListItem,
  NotificationListResult,
  NotificationRecipientType,
  NotificationType,
} from "./notification.types.js";

type ListNotificationsInput = {
  recipientType: NotificationRecipientType;
  recipientId: string;
  page: number;
  limit: number;
  search: string;
  readStatus: "all" | "unread" | "read";
  category: "all" | NotificationCategory;
};

function toListItem(doc: {
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
}): NotificationListItem {
  return {
    id: doc._id.toString(),
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
        jobs.push({
          recipientType: "job_seeker",
          recipientId: context.jobSeekerId,
          type: "interview_scheduled",
          category: "interview",
          title: "Interview Scheduled",
          body: `An interview was scheduled for ${jobTitle} at ${company}.`,
          priority: "high",
          referenceType: "application",
          referenceId: context.applicationId,
          actionPath: seekerPath,
        });
        break;
      case APPLICATION_EVENT_NAMES.INTERVIEW_UPDATED:
        jobs.push({
          recipientType: "job_seeker",
          recipientId: context.jobSeekerId,
          type: "interview_updated",
          category: "interview",
          title: "Interview Updated",
          body: `Interview details were updated for ${jobTitle}.`,
          priority: "high",
          referenceType: "application",
          referenceId: context.applicationId,
          actionPath: seekerPath,
        });
        break;
      case APPLICATION_EVENT_NAMES.INTERVIEW_COMPLETED:
        jobs.push({
          recipientType: "job_seeker",
          recipientId: context.jobSeekerId,
          type: "interview_completed",
          category: "interview",
          title: "Interview Completed",
          body: `Your interview for ${jobTitle} was marked as completed.`,
          referenceType: "application",
          referenceId: context.applicationId,
          actionPath: seekerPath,
        });
        break;
      case APPLICATION_EVENT_NAMES.OFFER_SENT:
        jobs.push({
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
        });
        break;
      case APPLICATION_EVENT_NAMES.SELECTED:
        jobs.push({
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
        });
        break;
      case APPLICATION_EVENT_NAMES.JOINED:
        jobs.push({
          recipientType: "job_seeker",
          recipientId: context.jobSeekerId,
          type: "application_joined",
          category: "system",
          title: "Joined",
          body: `Your status for ${jobTitle} was updated to Joined.`,
          referenceType: "application",
          referenceId: context.applicationId,
          actionPath: seekerPath,
        });
        break;
      case APPLICATION_EVENT_NAMES.REJECTED:
        jobs.push({
          recipientType: "job_seeker",
          recipientId: context.jobSeekerId,
          type: "application_rejected",
          category: "application",
          title: "Application Rejected",
          body: `Your application for ${jobTitle} was not selected this time.`,
          referenceType: "application",
          referenceId: context.applicationId,
          actionPath: seekerPath,
        });
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
