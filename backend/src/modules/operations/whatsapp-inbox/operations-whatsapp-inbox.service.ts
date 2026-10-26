import { Types } from "mongoose";
import { HTTP_STATUS } from "../../../constants/http-status.js";
import { AppError } from "../../../middleware/error.middleware.js";
import { ApplicationModel } from "../../applications/application.model.js";
import { EmployerModel } from "../../employers/employer.model.js";
import { JobModel } from "../../jobs/job.model.js";
import { JobSeekerModel } from "../../job-seekers/job-seeker.model.js";
import { resolveEmployerPosterImageUrl } from "../../employers/employer-poster-image.js";
import { buildOperationsCandidatePhotoPath } from "../candidates/operations-candidates.service.js";
import {
  employerInboxName,
  registeredAccountStatusLabel,
} from "../../whatsapp/inbox/whatsapp-inbox-identity.js";
import { ensureWhatsAppInboxBackfill } from "../../whatsapp/inbox/whatsapp-inbox-backfill.js";
import {
  customerServiceWindowState,
  ensureInboxConversation,
  hydrateInboxConversations,
  isInsideCustomerServiceWindow,
  normalizeInboxPhone,
  pauseBotForAdmin,
  recordOutboundMessage,
} from "../../whatsapp/inbox/whatsapp-inbox-store.js";
import {
  WhatsAppInboxConversationModel,
  WhatsAppInboxMessageModel,
  type WhatsAppInboxParticipantType,
} from "../../whatsapp/inbox/whatsapp-inbox.model.js";
import {
  sanitizeWhatsAppErrorDetail,
  WhatsAppService,
  WhatsAppTemplateDeliveryError,
} from "../../whatsapp/whatsapp.service.js";
import {
  safeMediaFileName,
  validateWhatsAppMedia,
  type WhatsAppMediaKind,
} from "../../whatsapp/whatsapp-media.js";

const whatsAppService = new WhatsAppService();

function mediaLabel(kind: WhatsAppMediaKind, fileName: string): string {
  if (kind === "image") return "[Image]";
  if (kind === "audio") return "[Audio]";
  if (kind === "video") return "[Video]";
  return `[Document] ${fileName}`;
}

const OUTSIDE_WINDOW_MESSAGE =
  "Free-form WhatsApp replies are only allowed within 24 hours of the customer's last message. Ask the customer to message AsliJobs on WhatsApp first.";

function formatDisplayPhone(national: string): string {
  const digits = national.replace(/\D/g, "");
  if (digits.length === 10) {
    return `+91 ${digits.slice(0, 5)} ${digits.slice(5)}`;
  }
  return national;
}

function roleLabel(type: WhatsAppInboxParticipantType): string {
  if (type === "employer") return "Employer";
  if (type === "job_seeker") return "Job Seeker";
  if (type === "both") return "Job Seeker & Employer";
  return "Unregistered";
}

function primaryFilterType(
  type: WhatsAppInboxParticipantType,
): "job_seeker" | "employer" | "unknown" {
  if (type === "employer" || type === "both") return "employer";
  if (type === "job_seeker") return "job_seeker";
  return "unknown";
}

export const operationsWhatsAppInboxService = {
  async listConversations(input: {
    page: number;
    limit: number;
    search: string;
    participantType: "all" | "job_seeker" | "employer";
  }) {
    await ensureWhatsAppInboxBackfill();
    const filter: Record<string, unknown> = {
      lastMessageAt: { $ne: null },
    };

    if (input.participantType === "job_seeker") {
      filter.participantType = { $in: ["job_seeker", "both"] };
    } else if (input.participantType === "employer") {
      filter.participantType = { $in: ["employer", "both"] };
    }

    const search = input.search.trim();
    if (search) {
      const digits = search.replace(/\D/g, "");
      const accountPhones = await matchingAccountPhones(
        search,
        input.participantType,
      );
      const or: Record<string, unknown>[] = [
        { displayName: { $regex: escapeRegex(search), $options: "i" } },
      ];
      if (digits.length >= 4) {
        or.push({ phoneNational: { $regex: `${escapeRegex(digits)}$` } });
      }
      if (accountPhones.length > 0) {
        or.push({ phoneNational: { $in: accountPhones } });
      }
      filter.$or = or;
    }

    const skip = (input.page - 1) * input.limit;
    const [total, rows] = await Promise.all([
      WhatsAppInboxConversationModel.countDocuments(filter),
      WhatsAppInboxConversationModel.find(filter)
        .sort({ lastMessageAt: -1, _id: -1 })
        .skip(skip)
        .limit(input.limit)
        .select("phoneNational")
        .lean(),
    ]);
    const hydrated = await hydrateInboxConversations(
      rows.map((row) => row.phoneNational),
    );
    const avatars = await avatarUrlsForConversations(hydrated);

    return {
      items: hydrated.map((row) =>
        serializeConversation(row, {
          avatarUrl: avatars.get(String(row._id)) ?? "",
        }),
      ),
      page: input.page,
      limit: input.limit,
      total,
      totalPages: Math.max(1, Math.ceil(total / input.limit)),
    };
  },

  async listContacts(input: {
    page: number;
    limit: number;
    search: string;
    participantType: "all" | "job_seeker" | "employer";
  }) {
    const search = input.search.trim();
    const digits = search.replace(/\D/g, "");
    const namePattern = search ? new RegExp(escapeRegex(search), "i") : null;
    const includeSeekers = input.participantType !== "employer";
    const includeEmployers = input.participantType !== "job_seeker";
    const seekerFilter = contactFilter(namePattern, digits, ["fullName"]);
    const employerFilter = contactFilter(namePattern, digits, [
      "companyName",
      "establishmentName",
      "firstName",
      "lastName",
    ]);
    const skip = (input.page - 1) * input.limit;

    const [seekerCount, employerCount, rows] = await Promise.all([
      includeSeekers ? JobSeekerModel.countDocuments(seekerFilter) : Promise.resolve(0),
      includeEmployers
        ? EmployerModel.countDocuments(employerFilter)
        : Promise.resolve(0),
      queryContactRows({
        includeSeekers,
        includeEmployers,
        seekerFilter,
        employerFilter,
        skip,
        limit: input.limit,
      }),
    ]);

    const items = rows.flatMap((row) => {
      const phone = normalizeInboxPhone(row.whatsappNumber ?? "");
      if (!/^\d{10}$/.test(phone)) return [];
      const participantType = row.participantType;
      const displayName =
        participantType === "employer"
          ? employerInboxName(row) || phone
          : row.fullName?.trim() || phone;
      return [
        {
          accountId: String(row.accountId),
          participantType,
          displayName,
          phoneNational: phone,
          phoneDisplay: formatDisplayPhone(phone),
          location: [row.city, row.state]
            .map((part) => part?.trim())
            .filter(Boolean)
            .join(", "),
          statusLabel: registeredAccountStatusLabel({
            participantType,
            registrationStatus: row.registrationStatus,
            verificationStatus: row.verificationStatus,
          }),
          avatarUrl:
            participantType === "employer"
              ? resolveEmployerPosterImageUrl(row)
              : seekerPhotoPath(String(row.accountId), row.profilePhoto),
          lastMessagePreview: "",
          lastMessageAt: null as string | null,
          unreadCount: 0,
        },
      ];
    });

    const phones = [...new Set(items.map((item) => item.phoneNational))];
    if (phones.length > 0) {
      const conversations = await WhatsAppInboxConversationModel.find({
        phoneNational: { $in: phones },
      })
        .select("phoneNational lastMessagePreview lastMessageAt unreadCount")
        .lean();
      const byPhone = new Map(
        conversations.map((conversation) => [conversation.phoneNational, conversation]),
      );
      for (const item of items) {
        const conversation = byPhone.get(item.phoneNational);
        if (!conversation) continue;
        item.lastMessagePreview = conversation.lastMessagePreview || "";
        item.lastMessageAt = conversation.lastMessageAt?.toISOString() ?? null;
        item.unreadCount = conversation.unreadCount ?? 0;
      }
    }

    const total = seekerCount + employerCount;
    return {
      items,
      page: input.page,
      limit: input.limit,
      total,
      totalPages: Math.max(1, Math.ceil(total / input.limit)),
    };
  },

  async openConversation(input: {
    participantType: "job_seeker" | "employer";
    accountId: string;
  }) {
    const phone =
      input.participantType === "employer"
        ? await employerPhone(input.accountId)
        : await seekerPhone(input.accountId);
    if (!phone) {
      throw new AppError(
        "This account does not have a WhatsApp number.",
        HTTP_STATUS.NOT_FOUND,
      );
    }
    const conversation = await ensureInboxConversation(phone);
    return serializeConversation(conversation);
  },

  async getConversation(conversationId: string) {
    const conversation = await loadConversationOrThrow(conversationId);
    return serializeConversation(conversation);
  },

  async listMessages(input: {
    conversationId: string;
    limit: number;
    before?: string;
  }) {
    await loadConversationOrThrow(input.conversationId);

    const filter: Record<string, unknown> = {
      conversationId: new Types.ObjectId(input.conversationId),
    };

    if (input.before?.trim()) {
      const beforeMessage = await WhatsAppInboxMessageModel.findById(
        input.before.trim(),
      )
        .select("createdAt _id conversationId")
        .lean();
      if (
        !beforeMessage ||
        String(beforeMessage.conversationId) !== input.conversationId
      ) {
        throw new AppError("Invalid message cursor.", HTTP_STATUS.BAD_REQUEST);
      }
      filter.$or = [
        { createdAt: { $lt: beforeMessage.createdAt } },
        {
          createdAt: beforeMessage.createdAt,
          _id: { $lt: beforeMessage._id },
        },
      ];
    }

    const rows = await WhatsAppInboxMessageModel.find(filter)
      .sort({ createdAt: -1, _id: -1 })
      .limit(input.limit)
      .lean();

    const items = rows
      .slice()
      .reverse()
      .map((row) => ({
        id: String(row._id),
        direction: row.direction,
        senderType: row.senderType,
        body: row.body,
        messageType: row.messageType,
        hasMedia: Boolean(row.mediaProviderId),
        mediaMimeType: row.mediaMimeType || "",
        mediaFileName: row.mediaFileName || "",
        status: row.status,
        failureReason: row.failureReason || "",
        createdAt: row.createdAt?.toISOString?.() ?? new Date().toISOString(),
        statusAt: row.statusAt?.toISOString?.() ?? null,
      }));

    return {
      items,
      hasMore: rows.length === input.limit,
      nextBefore: rows.length ? String(rows[rows.length - 1]?._id) : null,
    };
  },

  async setBotPaused(input: {
    conversationId: string;
    adminUserId: string;
    paused: boolean;
  }) {
    const conversation = await loadConversationOrThrow(input.conversationId);
    conversation.botPausedUntil = input.paused
      ? new Date(Date.now() + 24 * 60 * 60 * 1000)
      : null;
    conversation.botPausedByAdminUserId =
      input.paused && Types.ObjectId.isValid(input.adminUserId)
        ? new Types.ObjectId(input.adminUserId)
        : null;
    await conversation.save();
    return serializeConversation(conversation);
  },

  async markRead(conversationId: string) {
    await WhatsAppInboxConversationModel.updateOne(
      { _id: conversationId },
      { $set: { unreadCount: 0 } },
    );
    return { ok: true as const };
  },

  async getContactDetails(conversationId: string) {
    const conversation = await loadConversationOrThrow(conversationId);
    const phoneDisplay = formatDisplayPhone(conversation.phoneNational);
    const seeker = conversation.jobSeekerId
      ? await JobSeekerModel.findById(conversation.jobSeekerId)
          .select(
            "fullName whatsappNumber city state jobRole education experienceType registrationStatus profilePhoto",
          )
          .lean()
      : null;
    const employer = conversation.employerId
      ? await EmployerModel.findById(conversation.employerId)
          .select(
            "accountType companyName establishmentName firstName lastName whatsappNumber city state verificationStatus registrationStatus isProfileComplete companyLogo profilePhoto",
          )
          .lean()
      : null;

    const applications = seeker
      ? await ApplicationModel.find({ jobSeekerId: seeker._id })
          .sort({ appliedAt: -1 })
          .limit(5)
          .select("status appliedAt jobId")
          .lean()
      : [];
    const applicationJobIds = applications.map((row) => row.jobId).filter(Boolean);
    const applicationJobs = applicationJobIds.length
      ? await JobModel.find({ _id: { $in: applicationJobIds } })
          .select("jobTitle companyName")
          .lean()
      : [];
    const applicationJobMap = new Map(
      applicationJobs.map((job) => [String(job._id), job]),
    );
    const postedJobs = employer
      ? await JobModel.find({ employerId: employer._id })
          .sort({ createdAt: -1 })
          .limit(5)
          .select("jobTitle status cityName createdAt")
          .lean()
      : [];

    const seekerName = seeker?.fullName?.trim() || "";
    const employerName = employer ? employerInboxName(employer) : "";
    const displayName =
      conversation.displayName ||
      [employerName, seekerName].filter(Boolean).join(" · ") ||
      conversation.phoneNational;
    const seekerAvatar = seeker
      ? seekerPhotoPath(String(seeker._id), seeker.profilePhoto)
      : "";
    const employerAvatar = employer ? resolveEmployerPosterImageUrl(employer) : "";
    const location = [
      seeker?.city,
      seeker?.state,
      employer?.city,
      employer?.state,
    ]
      .map((part) => part?.trim())
      .filter((part, index, all): part is string =>
        Boolean(part) && all.indexOf(part) === index,
      )
      .join(", ");
    const contactPerson = [employer?.firstName, employer?.lastName]
      .map((part) => part?.trim())
      .filter(Boolean)
      .join(" ");

    const kind = seeker && employer
      ? ("both" as const)
      : seeker
        ? ("job_seeker" as const)
        : employer
          ? ("employer" as const)
          : ("unknown" as const);

    return {
      kind,
      displayName,
      phoneDisplay,
      phoneNational: conversation.phoneNational,
      profileId: seeker
        ? String(seeker._id)
        : employer
          ? String(employer._id)
          : null,
      jobSeekerId: seeker ? String(seeker._id) : null,
      employerId: employer ? String(employer._id) : null,
      avatarUrl: employerAvatar || seekerAvatar,
      location,
      contactPerson,
      jobRole: seeker?.jobRole?.trim() || "",
      education: formatEducation(seeker?.education),
      experience: seeker?.experienceType?.trim() || "",
      verificationStatus: employer?.verificationStatus || "",
      profileStatus: profileStatusLabel({
        seekerStatus: seeker?.registrationStatus,
        employerComplete: employer?.isProfileComplete,
        employerRegistration: employer?.registrationStatus,
      }),
      recentApplications: applications.map((row) => ({
        id: String(row._id),
        title: applicationJobMap.get(String(row.jobId))?.jobTitle || "Job",
        companyName: applicationJobMap.get(String(row.jobId))?.companyName || "",
        status: row.status,
        appliedAt: row.appliedAt?.toISOString?.() ?? null,
      })),
      recentJobs: postedJobs.map((job) => ({
        id: String(job._id),
        title: job.jobTitle || "Job",
        status: job.status || "",
        city: job.cityName || "",
        createdAt: job.createdAt?.toISOString?.() ?? null,
      })),
    };
  },

  async sendMessage(input: {
    conversationId: string;
    adminUserId: string;
    text: string;
    clientMessageId?: string;
  }) {
    const conversation = await loadConversationOrThrow(input.conversationId);
    const text = input.text.trim();
    if (!text) {
      throw new AppError("Message text is required.", HTTP_STATUS.BAD_REQUEST);
    }

    if (!isInsideCustomerServiceWindow(conversation.lastInboundAt)) {
      throw new AppError(OUTSIDE_WINDOW_MESSAGE, HTTP_STATUS.BAD_REQUEST, {
        code: "WHATSAPP_OUTSIDE_SERVICE_WINDOW",
      });
    }

    const clientMessageId = input.clientMessageId?.trim() || "";
    if (clientMessageId) {
      const existing = await WhatsAppInboxMessageModel.findOne({
        clientMessageId,
      }).lean();
      if (existing) {
        if (String(existing.conversationId) !== input.conversationId) {
          throw new AppError(
            "clientMessageId already used.",
            HTTP_STATUS.CONFLICT,
          );
        }
        return {
          message: {
            id: String(existing._id),
            direction: existing.direction,
            senderType: existing.senderType,
            body: existing.body,
            messageType: existing.messageType,
            status: existing.status,
            failureReason: existing.failureReason || "",
            createdAt:
              existing.createdAt?.toISOString?.() ?? new Date().toISOString(),
            statusAt: existing.statusAt?.toISOString?.() ?? null,
          },
          conversation: serializeConversation(conversation),
          duplicated: true,
        };
      }
    }

    let providerMessageId = "";
    try {
      const result = await whatsAppService.sendSessionTextMessage(
        conversation.phoneNational,
        text,
      );
      providerMessageId = result.messageId;
    } catch (error) {
      const failureReason = sanitizeWhatsAppErrorDetail(
        error instanceof WhatsAppTemplateDeliveryError
          ? error.detail || error.message
          : error instanceof Error
            ? error.message
            : "send_failed",
      );
      await recordOutboundMessage({
        phoneNational: conversation.phoneNational,
        body: text,
        senderType: "admin",
        clientMessageId,
        adminUserId: input.adminUserId,
        status: "failed",
        failureReason,
      });

      if (
        error instanceof WhatsAppTemplateDeliveryError &&
        error.metaCode === 131047
      ) {
        throw new AppError(OUTSIDE_WINDOW_MESSAGE, HTTP_STATUS.BAD_REQUEST, {
          code: "WHATSAPP_OUTSIDE_SERVICE_WINDOW",
        });
      }

      throw new AppError(
        "Unable to send WhatsApp message right now. Please try again.",
        HTTP_STATUS.INTERNAL_SERVER_ERROR,
        { code: "WHATSAPP_SEND_FAILED" },
      );
    }

    await pauseBotForAdmin(conversation.phoneNational, input.adminUserId);
    const recorded = await recordOutboundMessage({
      phoneNational: conversation.phoneNational,
      body: text,
      senderType: "admin",
      providerMessageId,
      clientMessageId,
      adminUserId: input.adminUserId,
      status: "accepted",
    });

    const message = await WhatsAppInboxMessageModel.findById(recorded.messageId).lean();
    const refreshed = await loadConversationOrThrow(input.conversationId);

    return {
      message: {
        id: String(message?._id ?? recorded.messageId),
        direction: "outbound" as const,
        senderType: "admin" as const,
        body: text,
        messageType: "text" as const,
        hasMedia: false,
        mediaMimeType: "",
        mediaFileName: "",
        status: message?.status ?? "accepted",
        failureReason: "",
        createdAt:
          message?.createdAt?.toISOString?.() ?? new Date().toISOString(),
        statusAt: message?.statusAt?.toISOString?.() ?? null,
      },
      conversation: serializeConversation(refreshed),
      duplicated: !recorded.created,
    };
  },

  async sendMedia(input: {
    conversationId: string;
    adminUserId: string;
    bytes: Buffer;
    mimeType: string;
    fileName: string;
    caption?: string;
    clientMessageId?: string;
  }) {
    const conversation = await loadConversationOrThrow(input.conversationId);
    if (!isInsideCustomerServiceWindow(conversation.lastInboundAt)) {
      throw new AppError(OUTSIDE_WINDOW_MESSAGE, HTTP_STATUS.BAD_REQUEST, {
        code: "WHATSAPP_OUTSIDE_SERVICE_WINDOW",
      });
    }
    const checked = validateWhatsAppMedia({
      mimeType: input.mimeType,
      sizeBytes: input.bytes.length,
    });
    if ("error" in checked) {
      throw new AppError(checked.error, HTTP_STATUS.BAD_REQUEST, {
        code: "WHATSAPP_MEDIA_REJECTED",
      });
    }
    const fileName = safeMediaFileName(input.fileName);
    const caption = input.caption?.trim().slice(0, 1024) ?? "";
    const body = caption || mediaLabel(checked.kind, fileName);
    const clientMessageId = input.clientMessageId?.trim() || "";

    let acceptedByProvider = false;
    try {
      const mediaId = await whatsAppService.uploadMedia({
        bytes: input.bytes,
        mimeType: input.mimeType,
        fileName,
      });
      const result = await whatsAppService.sendMediaMessage({
        phoneNumber: conversation.phoneNational,
        kind: checked.kind,
        mediaId,
        caption,
        fileName,
      });
      acceptedByProvider = true;
      await pauseBotForAdmin(conversation.phoneNational, input.adminUserId);
      const recorded = await recordOutboundMessage({
        phoneNational: conversation.phoneNational,
        body,
        senderType: "admin",
        providerMessageId: result.messageId,
        clientMessageId,
        adminUserId: input.adminUserId,
        status: "accepted",
        messageType: checked.kind,
        mediaProviderId: mediaId,
        mediaMimeType: input.mimeType,
        mediaFileName: fileName,
      });
      const message = await WhatsAppInboxMessageModel.findById(recorded.messageId).lean();
      const refreshed = await loadConversationOrThrow(input.conversationId);
      return {
        message: {
          id: String(message?._id ?? recorded.messageId),
          direction: "outbound" as const,
          senderType: "admin" as const,
          body,
          messageType: checked.kind,
          hasMedia: true,
          mediaMimeType: input.mimeType,
          mediaFileName: fileName,
          status: message?.status ?? "accepted",
          failureReason: "",
          createdAt: message?.createdAt?.toISOString?.() ?? new Date().toISOString(),
          statusAt: message?.statusAt?.toISOString?.() ?? null,
        },
        conversation: serializeConversation(refreshed),
        duplicated: !recorded.created,
      };
    } catch (error) {
      if (error instanceof AppError) throw error;
      if (acceptedByProvider) {
        throw new AppError(
          "WhatsApp accepted the file, but the inbox could not save it. Refresh before sending again.",
          HTTP_STATUS.INTERNAL_SERVER_ERROR,
          { code: "WHATSAPP_MEDIA_PERSIST_FAILED" },
        );
      }
      const failureReason = sanitizeWhatsAppErrorDetail(
        error instanceof WhatsAppTemplateDeliveryError
          ? error.detail || error.message
          : error instanceof Error
            ? error.message
            : "send_failed",
      );
      await recordOutboundMessage({
        phoneNational: conversation.phoneNational,
        body,
        senderType: "admin",
        clientMessageId,
        adminUserId: input.adminUserId,
        status: "failed",
        failureReason,
        messageType: checked.kind,
        mediaMimeType: input.mimeType,
        mediaFileName: fileName,
      });
      if (
        error instanceof WhatsAppTemplateDeliveryError &&
        error.metaCode === 131047
      ) {
        throw new AppError(OUTSIDE_WINDOW_MESSAGE, HTTP_STATUS.BAD_REQUEST, {
          code: "WHATSAPP_OUTSIDE_SERVICE_WINDOW",
        });
      }
      throw new AppError(
        "Unable to send the WhatsApp attachment right now. Please try again.",
        HTTP_STATUS.INTERNAL_SERVER_ERROR,
        { code: "WHATSAPP_MEDIA_SEND_FAILED" },
      );
    }
  },

  async getMessageMedia(conversationId: string, messageId: string) {
    if (!Types.ObjectId.isValid(messageId)) {
      throw new AppError("Message not found.", HTTP_STATUS.NOT_FOUND);
    }
    const message = await WhatsAppInboxMessageModel.findById(messageId).lean();
    if (!message || String(message.conversationId) !== conversationId) {
      throw new AppError("Message not found.", HTTP_STATUS.NOT_FOUND);
    }
    const mediaId = message.mediaProviderId?.trim() ?? "";
    if (!mediaId) {
      throw new AppError("This message has no file.", HTTP_STATUS.NOT_FOUND);
    }
    try {
      const file = await whatsAppService.downloadMedia(mediaId, {
        maxBytes: 16 * 1024 * 1024,
      });
      return {
        bytes: file.buffer,
        mimeType: message.mediaMimeType || file.mimeType || "application/octet-stream",
        fileName: safeMediaFileName(message.mediaFileName || "file"),
      };
    } catch {
      throw new AppError(
        "The file could not be retrieved from WhatsApp.",
        HTTP_STATUS.INTERNAL_SERVER_ERROR,
      );
    }
  },

  /** Test / ops helper: ensure a conversation exists for a known phone. */
  async ensureConversationForPhone(phone: string) {
    const national = normalizeInboxPhone(phone);
    const conversation = await ensureInboxConversation(national);
    return serializeConversation(conversation);
  },
};

async function loadConversationOrThrow(conversationId: string) {
  if (!Types.ObjectId.isValid(conversationId)) {
    throw new AppError("Conversation not found.", HTTP_STATUS.NOT_FOUND);
  }
  const conversation = await WhatsAppInboxConversationModel.findById(
    conversationId,
  );
  if (!conversation) {
    throw new AppError("Conversation not found.", HTTP_STATUS.NOT_FOUND);
  }
  return conversation;
}

function serializeConversation(
  conversation: {
    _id: Types.ObjectId;
    phoneNational: string;
    displayName?: string;
    participantType: WhatsAppInboxParticipantType;
    jobSeekerId?: Types.ObjectId | null;
    employerId?: Types.ObjectId | null;
    lastMessageAt?: Date | null;
    lastMessagePreview?: string;
    lastMessageDirection?: string;
    unreadCount?: number;
    lastInboundAt?: Date | null;
    botPausedUntil?: Date | null;
  },
  extras?: { avatarUrl?: string },
) {
  return {
    id: String(conversation._id),
    phoneNational: conversation.phoneNational,
    phoneDisplay: formatDisplayPhone(conversation.phoneNational),
    displayName: conversation.displayName || conversation.phoneNational,
    participantType: conversation.participantType,
    participantLabel: roleLabel(conversation.participantType),
    filterType: primaryFilterType(conversation.participantType),
    jobSeekerId: conversation.jobSeekerId
      ? String(conversation.jobSeekerId)
      : null,
    employerId: conversation.employerId
      ? String(conversation.employerId)
      : null,
    avatarUrl: extras?.avatarUrl ?? "",
    lastMessageAt: conversation.lastMessageAt?.toISOString() ?? null,
    lastMessagePreview: conversation.lastMessagePreview || "",
    lastMessageDirection: conversation.lastMessageDirection || "",
    unreadCount: conversation.unreadCount ?? 0,
    lastInboundAt: conversation.lastInboundAt?.toISOString() ?? null,
    serviceWindow: customerServiceWindowState(conversation.lastInboundAt),
    canSendFreeForm: isInsideCustomerServiceWindow(conversation.lastInboundAt),
    botPaused:
      Boolean(conversation.botPausedUntil) &&
      (conversation.botPausedUntil as Date).getTime() > Date.now(),
  };
}

function contactFilter(
  namePattern: RegExp | null,
  digits: string,
  nameFields: string[],
): Record<string, unknown> {
  if (!namePattern && digits.length < 4) {
    return { whatsappNumber: { $exists: true, $ne: "" } };
  }
  const or: Record<string, unknown>[] = [];
  if (namePattern) {
    for (const field of nameFields) {
      or.push({ [field]: namePattern });
    }
  }
  if (digits.length >= 4) {
    const national = digits.length > 10 ? digits.slice(-10) : digits;
    or.push({ whatsappNumber: { $regex: `${escapeRegex(national)}$` } });
  }
  return or.length > 0 ? { $or: or } : { whatsappNumber: { $exists: true, $ne: "" } };
}

async function employerPhone(accountId: string): Promise<string | null> {
  if (!Types.ObjectId.isValid(accountId)) return null;
  const employer = await EmployerModel.findById(accountId)
    .select("whatsappNumber")
    .lean();
  const phone = normalizeInboxPhone(employer?.whatsappNumber ?? "");
  return /^\d{10}$/.test(phone) ? phone : null;
}

async function seekerPhone(accountId: string): Promise<string | null> {
  if (!Types.ObjectId.isValid(accountId)) return null;
  const seeker = await JobSeekerModel.findById(accountId)
    .select("whatsappNumber")
    .lean();
  const phone = normalizeInboxPhone(seeker?.whatsappNumber ?? "");
  return /^\d{10}$/.test(phone) ? phone : null;
}

const ACCOUNT_SEARCH_LIMIT = 200;

async function matchingAccountPhones(
  search: string,
  participantType: "all" | "job_seeker" | "employer",
): Promise<string[]> {
  const digits = search.replace(/\D/g, "");
  const namePattern = new RegExp(escapeRegex(search), "i");
  const phones: string[] = [];

  if (participantType !== "employer") {
    const seekers = await JobSeekerModel.find(
      contactFilter(namePattern, digits, ["fullName"]),
    )
      .select("whatsappNumber")
      .limit(ACCOUNT_SEARCH_LIMIT)
      .lean();
    for (const seeker of seekers) {
      const phone = normalizeInboxPhone(seeker.whatsappNumber ?? "");
      if (/^\d{10}$/.test(phone)) phones.push(phone);
    }
  }

  if (participantType !== "job_seeker") {
    const employers = await EmployerModel.find(
      contactFilter(namePattern, digits, [
        "companyName",
        "establishmentName",
        "firstName",
        "lastName",
      ]),
    )
      .select("whatsappNumber")
      .limit(ACCOUNT_SEARCH_LIMIT)
      .lean();
    for (const employer of employers) {
      const phone = normalizeInboxPhone(employer.whatsappNumber ?? "");
      if (/^\d{10}$/.test(phone)) phones.push(phone);
    }
  }

  return [...new Set(phones)];
}

type ContactAggregateRow = {
  accountId: Types.ObjectId;
  participantType: "job_seeker" | "employer";
  fullName?: string;
  whatsappNumber?: string;
  city?: string;
  state?: string;
  registrationStatus?: string;
  verificationStatus?: string;
  accountType?: string;
  companyName?: string;
  establishmentName?: string;
  firstName?: string;
  lastName?: string;
  profilePhoto?: { url?: string; storagePath?: string; updatedAt?: Date | null; fileSize?: number } | null;
  companyLogo?: { url?: string; updatedAt?: Date | null; fileSize?: number } | null;
};

function seekerContactProject() {
  return {
    accountId: "$_id",
    participantType: { $literal: "job_seeker" },
    sortName: {
      $cond: [
        {
          $gt: [
            { $strLenCP: { $trim: { input: { $ifNull: ["$fullName", ""] } } } },
            0,
          ],
        },
        { $trim: { input: "$fullName" } },
        "$whatsappNumber",
      ],
    },
    fullName: 1,
    whatsappNumber: 1,
    city: 1,
    state: 1,
    registrationStatus: 1,
    profilePhoto: 1,
  };
}

function employerContactProject() {
  return {
    accountId: "$_id",
    participantType: { $literal: "employer" },
    sortName: {
      $let: {
        vars: {
          business: {
            $cond: [
              { $eq: ["$accountType", "individual"] },
              {
                $cond: [
                  {
                    $gt: [
                      {
                        $strLenCP: {
                          $trim: { input: { $ifNull: ["$establishmentName", ""] } },
                        },
                      },
                      0,
                    ],
                  },
                  "$establishmentName",
                  { $ifNull: ["$companyName", ""] },
                ],
              },
              {
                $cond: [
                  {
                    $gt: [
                      {
                        $strLenCP: {
                          $trim: { input: { $ifNull: ["$companyName", ""] } },
                        },
                      },
                      0,
                    ],
                  },
                  "$companyName",
                  { $ifNull: ["$establishmentName", ""] },
                ],
              },
            ],
          },
          person: {
            $trim: {
              input: {
                $concat: [
                  { $ifNull: ["$firstName", ""] },
                  " ",
                  { $ifNull: ["$lastName", ""] },
                ],
              },
            },
          },
        },
        in: {
          $cond: [
            { $gt: [{ $strLenCP: { $trim: { input: { $ifNull: ["$$business", ""] } } } }, 0] },
            "$$business",
            {
              $cond: [
                { $gt: [{ $strLenCP: "$$person" }, 0] },
                "$$person",
                "$whatsappNumber",
              ],
            },
          ],
        },
      },
    },
    accountType: 1,
    companyName: 1,
    establishmentName: 1,
    firstName: 1,
    lastName: 1,
    whatsappNumber: 1,
    city: 1,
    state: 1,
    registrationStatus: 1,
    verificationStatus: 1,
    profilePhoto: 1,
    companyLogo: 1,
  };
}

async function queryContactRows(input: {
  includeSeekers: boolean;
  includeEmployers: boolean;
  seekerFilter: Record<string, unknown>;
  employerFilter: Record<string, unknown>;
  skip: number;
  limit: number;
}): Promise<ContactAggregateRow[]> {
  const sort = { sortName: 1 as const, accountId: 1 as const };
  if (input.includeSeekers && input.includeEmployers) {
    return JobSeekerModel.aggregate<ContactAggregateRow>([
      { $match: input.seekerFilter },
      { $project: seekerContactProject() },
      {
        $unionWith: {
          coll: "employers",
          pipeline: [
            { $match: input.employerFilter },
            { $project: employerContactProject() },
          ],
        },
      },
      { $sort: sort },
      { $skip: input.skip },
      { $limit: input.limit },
    ]).collation({ locale: "en", strength: 2 });
  }

  if (input.includeSeekers) {
    return JobSeekerModel.aggregate<ContactAggregateRow>([
      { $match: input.seekerFilter },
      { $project: seekerContactProject() },
      { $sort: sort },
      { $skip: input.skip },
      { $limit: input.limit },
    ]).collation({ locale: "en", strength: 2 });
  }

  return EmployerModel.aggregate<ContactAggregateRow>([
    { $match: input.employerFilter },
    { $project: employerContactProject() },
    { $sort: sort },
    { $skip: input.skip },
    { $limit: input.limit },
  ]).collation({ locale: "en", strength: 2 });
}

function seekerPhotoPath(
  jobSeekerId: string,
  photo?: { url?: string; storagePath?: string } | null,
): string {
  if (!photo?.url?.trim() && !photo?.storagePath?.trim()) return "";
  return buildOperationsCandidatePhotoPath(jobSeekerId);
}

async function avatarUrlsForConversations(
  conversations: Array<{
    _id: Types.ObjectId;
    jobSeekerId?: Types.ObjectId | null;
    employerId?: Types.ObjectId | null;
  }>,
): Promise<Map<string, string>> {
  const seekerIds = conversations
    .map((conversation) => conversation.jobSeekerId)
    .filter((id): id is Types.ObjectId => Boolean(id));
  const employerIds = conversations
    .map((conversation) => conversation.employerId)
    .filter((id): id is Types.ObjectId => Boolean(id));
  const [seekers, employers] = await Promise.all([
    seekerIds.length
      ? JobSeekerModel.find({ _id: { $in: seekerIds } })
          .select("profilePhoto")
          .lean()
      : [],
    employerIds.length
      ? EmployerModel.find({ _id: { $in: employerIds } })
          .select("accountType companyLogo profilePhoto")
          .lean()
      : [],
  ]);
  const seekerAvatar = new Map(
    seekers.map((seeker) => [
      String(seeker._id),
      seekerPhotoPath(String(seeker._id), seeker.profilePhoto),
    ]),
  );
  const employerAvatar = new Map(
    employers.map((employer) => [
      String(employer._id),
      resolveEmployerPosterImageUrl(employer),
    ]),
  );
  const avatars = new Map<string, string>();
  for (const conversation of conversations) {
    const employerUrl = conversation.employerId
      ? employerAvatar.get(String(conversation.employerId)) ?? ""
      : "";
    const seekerUrl = conversation.jobSeekerId
      ? seekerAvatar.get(String(conversation.jobSeekerId)) ?? ""
      : "";
    avatars.set(String(conversation._id), employerUrl || seekerUrl);
  }
  return avatars;
}

function profileStatusLabel(input: {
  seekerStatus?: string;
  employerComplete?: boolean;
  employerRegistration?: string;
}): string {
  if (input.seekerStatus && !input.employerRegistration && input.employerComplete === undefined) {
    return input.seekerStatus === "COMPLETED"
      ? "Profile complete"
      : "Profile incomplete";
  }
  if (input.employerComplete !== undefined && !input.seekerStatus) {
    return input.employerComplete ? "Profile complete" : "Profile incomplete";
  }
  const parts = [
    input.seekerStatus
      ? input.seekerStatus === "COMPLETED"
        ? "Job seeker profile complete"
        : "Job seeker profile incomplete"
      : "",
    input.employerComplete === undefined
      ? ""
      : input.employerComplete
        ? "Employer profile complete"
        : "Employer profile incomplete",
  ].filter(Boolean);
  return parts.join(" · ");
}

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function formatEducation(education: unknown): string {
  if (!education || typeof education !== "object") {
    return "";
  }
  const value = education as { level?: string; degree?: string };
  return value.degree?.trim() || value.level?.trim() || "";
}
