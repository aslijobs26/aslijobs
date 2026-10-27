import { Types } from "mongoose";
import { HTTP_STATUS } from "../../../constants/http-status.js";
import { AppError } from "../../../middleware/error.middleware.js";
import { resolveJobSeekerNotificationLanguage } from "../../whatsapp/job-seeker-whatsapp-language.js";
import {
  WhatsAppInboxConversationModel,
  WhatsAppInboxMessageModel,
} from "../../whatsapp/inbox/whatsapp-inbox.model.js";
import type { BotLanguage } from "../../whatsapp/whatsapp-bot.logic.js";
import {
  INBOX_TRANSLATE_DRAFT_MAX,
  INBOX_TRANSLATE_MESSAGE_BATCH_MAX,
  INBOX_TRANSLATION_PIPELINE_VERSION,
  INBOX_TRANSLATION_PROVIDER,
  type InboxTranslationLanguage,
  type InboxViewLanguage,
  isInboxTranslationLanguage,
  isInboxViewLanguage,
} from "./inbox-translation.constants.js";
import {
  detectInboxSourceLanguage,
  hashInboxSourceText,
  isTranslatableInboxMessage,
  translateInboxText,
} from "./inbox-translation.helpers.js";
import { InboxMessageTranslationModel } from "./inbox-message-translation.model.js";
import { InboxViewLanguageModel } from "./inbox-view-language.model.js";

type TranslationItemStatus =
  | "ready"
  | "same_language"
  | "skipped"
  | "failed";

export type InboxMessageTranslationItem = {
  messageId: string;
  targetLanguage: InboxTranslationLanguage;
  status: TranslationItemStatus;
  translatedText: string | null;
  sourceLanguage: BotLanguage | null;
  cached: boolean;
  errorCode?: string;
};

const inFlightTranslations = new Map<string, Promise<InboxMessageTranslationItem>>();

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

function flightKey(input: {
  messageId: string;
  targetLanguage: string;
  sourceHash: string;
}): string {
  return `${input.messageId}:${input.targetLanguage}:${input.sourceHash}:${INBOX_TRANSLATION_PIPELINE_VERSION}`;
}

export const operationsWhatsAppInboxTranslationService = {
  async getViewLanguage(input: {
    conversationId: string;
    operationsUserId: string;
  }): Promise<{ language: InboxViewLanguage }> {
    await loadConversationOrThrow(input.conversationId);
    if (!Types.ObjectId.isValid(input.operationsUserId)) {
      return { language: "original" };
    }
    const row = await InboxViewLanguageModel.findOne({
      operationsUserId: new Types.ObjectId(input.operationsUserId),
      conversationId: new Types.ObjectId(input.conversationId),
    })
      .select("language")
      .lean();
    const language = row?.language;
    if (typeof language === "string" && isInboxViewLanguage(language)) {
      return { language };
    }
    return { language: "original" };
  },

  async setViewLanguage(input: {
    conversationId: string;
    operationsUserId: string;
    language: string;
  }): Promise<{ language: InboxViewLanguage }> {
    await loadConversationOrThrow(input.conversationId);
    if (!isInboxViewLanguage(input.language)) {
      throw new AppError("Unsupported language.", HTTP_STATUS.BAD_REQUEST);
    }
    if (!Types.ObjectId.isValid(input.operationsUserId)) {
      throw new AppError("Unauthorized.", HTTP_STATUS.UNAUTHORIZED);
    }
    await InboxViewLanguageModel.findOneAndUpdate(
      {
        operationsUserId: new Types.ObjectId(input.operationsUserId),
        conversationId: new Types.ObjectId(input.conversationId),
      },
      {
        $set: { language: input.language },
        $setOnInsert: {
          operationsUserId: new Types.ObjectId(input.operationsUserId),
          conversationId: new Types.ObjectId(input.conversationId),
        },
      },
      { upsert: true, new: true },
    );
    return { language: input.language };
  },

  async resolveRecipientLanguage(conversationId: string): Promise<{
    language: InboxTranslationLanguage | null;
    source: "job_seeker" | "session" | "default" | "unknown";
    needsSelection: boolean;
  }> {
    const conversation = await loadConversationOrThrow(conversationId);
    const phone = conversation.phoneNational;
    const seekerId = conversation.jobSeekerId
      ? String(conversation.jobSeekerId)
      : null;

    if (seekerId || conversation.participantType === "job_seeker" || conversation.participantType === "both") {
      const language = await resolveJobSeekerNotificationLanguage({
        phoneNumber: phone,
        jobSeekerId: seekerId,
      });
      if (isInboxTranslationLanguage(language)) {
        return {
          language,
          source: seekerId ? "job_seeker" : "session",
          needsSelection: false,
        };
      }
    }

    const sessionLanguage = await resolveJobSeekerNotificationLanguage({
      phoneNumber: phone,
      jobSeekerId: null,
    });
    if (isInboxTranslationLanguage(sessionLanguage) && sessionLanguage !== "en") {
      return {
        language: sessionLanguage,
        source: "session",
        needsSelection: false,
      };
    }

    if (conversation.participantType === "employer") {
      return { language: null, source: "unknown", needsSelection: true };
    }

    return { language: "en", source: "default", needsSelection: false };
  },

  async translateMessages(input: {
    conversationId: string;
    targetLanguage: string;
    messageIds: string[];
  }): Promise<{ items: InboxMessageTranslationItem[] }> {
    await loadConversationOrThrow(input.conversationId);
    if (!isInboxTranslationLanguage(input.targetLanguage)) {
      throw new AppError("Unsupported language.", HTTP_STATUS.BAD_REQUEST);
    }
    const uniqueIds = [
      ...new Set(
        input.messageIds
          .map((id) => id.trim())
          .filter((id) => Types.ObjectId.isValid(id)),
      ),
    ].slice(0, INBOX_TRANSLATE_MESSAGE_BATCH_MAX);

    if (uniqueIds.length === 0) {
      return { items: [] };
    }

    const messages = await WhatsAppInboxMessageModel.find({
      _id: { $in: uniqueIds.map((id) => new Types.ObjectId(id)) },
      conversationId: new Types.ObjectId(input.conversationId),
    })
      .select("_id body messageType")
      .lean();

    const byId = new Map(messages.map((row) => [String(row._id), row]));
    const items: InboxMessageTranslationItem[] = [];

    for (const messageId of uniqueIds) {
      const message = byId.get(messageId);
      if (!message) {
        items.push({
          messageId,
          targetLanguage: input.targetLanguage,
          status: "skipped",
          translatedText: null,
          sourceLanguage: null,
          cached: false,
          errorCode: "not_found",
        });
        continue;
      }
      items.push(
        await translateOneMessage({
          conversationId: input.conversationId,
          messageId,
          body: message.body,
          messageType: message.messageType || "text",
          targetLanguage: input.targetLanguage,
        }),
      );
    }

    return { items };
  },

  async translateDraft(input: {
    conversationId: string;
    text: string;
    targetLanguage?: string;
  }): Promise<{
    translatedText: string;
    targetLanguage: InboxTranslationLanguage;
    sourceLanguage: BotLanguage;
    skipped: boolean;
    failed: boolean;
    needsSelection: boolean;
    errorCode?: string;
  }> {
    await loadConversationOrThrow(input.conversationId);
    const draft = input.text.trim();
    if (!draft) {
      throw new AppError("Draft text is required.", HTTP_STATUS.BAD_REQUEST);
    }
    if (draft.length > INBOX_TRANSLATE_DRAFT_MAX) {
      throw new AppError("Draft is too long.", HTTP_STATUS.BAD_REQUEST);
    }

    if (!input.targetLanguage || !isInboxTranslationLanguage(input.targetLanguage)) {
      throw new AppError(
        "Choose a supported destination language.",
        HTTP_STATUS.BAD_REQUEST,
      );
    }
    const target = input.targetLanguage;

    const sourceLanguage = detectInboxSourceLanguage(draft);
    const result = await translateInboxText({
      text: draft,
      sourceLanguage,
      targetLanguage: target,
      autoDetectSource: true,
    });

    return {
      translatedText: result.failed ? draft : result.text,
      targetLanguage: target,
      sourceLanguage,
      skipped: result.skipped,
      failed: result.failed,
      needsSelection: false,
      errorCode: result.errorCode,
    };
  },
};

async function translateOneMessage(input: {
  conversationId: string;
  messageId: string;
  body: string;
  messageType: string;
  targetLanguage: InboxTranslationLanguage;
}): Promise<InboxMessageTranslationItem> {
  if (
    !isTranslatableInboxMessage({
      messageType: input.messageType,
      body: input.body,
    })
  ) {
    return {
      messageId: input.messageId,
      targetLanguage: input.targetLanguage,
      status: "skipped",
      translatedText: null,
      sourceLanguage: null,
      cached: false,
    };
  }

  const sourceLanguage = detectInboxSourceLanguage(input.body);
  if (sourceLanguage === input.targetLanguage) {
    return {
      messageId: input.messageId,
      targetLanguage: input.targetLanguage,
      status: "same_language",
      translatedText: input.body,
      sourceLanguage,
      cached: false,
    };
  }

  const sourceHash = hashInboxSourceText(input.body);
  const key = flightKey({
    messageId: input.messageId,
    targetLanguage: input.targetLanguage,
    sourceHash,
  });

  const existingFlight = inFlightTranslations.get(key);
  if (existingFlight) {
    return existingFlight;
  }

  const promise = (async (): Promise<InboxMessageTranslationItem> => {
    const cached = await InboxMessageTranslationModel.findOne({
      messageId: new Types.ObjectId(input.messageId),
      targetLanguage: input.targetLanguage,
      sourceHash,
      pipelineVersion: INBOX_TRANSLATION_PIPELINE_VERSION,
      status: "ready",
    })
      .select("translatedText sourceLanguage")
      .lean();

    if (cached?.translatedText) {
      return {
        messageId: input.messageId,
        targetLanguage: input.targetLanguage,
        status: "ready",
        translatedText: cached.translatedText,
        sourceLanguage:
          (cached.sourceLanguage as BotLanguage | undefined) ?? sourceLanguage,
        cached: true,
      };
    }

    const result = await translateInboxText({
      text: input.body,
      sourceLanguage,
      targetLanguage: input.targetLanguage,
    });

    if (result.failed || !result.translated) {
      return {
        messageId: input.messageId,
        targetLanguage: input.targetLanguage,
        status: result.skipped ? "same_language" : "failed",
        translatedText: result.skipped ? input.body : null,
        sourceLanguage,
        cached: false,
        errorCode: result.errorCode,
      };
    }

    try {
      await InboxMessageTranslationModel.findOneAndUpdate(
        {
          messageId: new Types.ObjectId(input.messageId),
          targetLanguage: input.targetLanguage,
          sourceHash,
          pipelineVersion: INBOX_TRANSLATION_PIPELINE_VERSION,
        },
        {
          $set: {
            conversationId: new Types.ObjectId(input.conversationId),
            sourceLanguage,
            translatedText: result.text,
            provider: INBOX_TRANSLATION_PROVIDER,
            status: "ready",
          },
          $setOnInsert: {
            messageId: new Types.ObjectId(input.messageId),
            targetLanguage: input.targetLanguage,
            sourceHash,
            pipelineVersion: INBOX_TRANSLATION_PIPELINE_VERSION,
          },
        },
        { upsert: true, new: true },
      );
    } catch (error) {
      // Unique race: another writer won; re-read cache.
      const raced = await InboxMessageTranslationModel.findOne({
        messageId: new Types.ObjectId(input.messageId),
        targetLanguage: input.targetLanguage,
        sourceHash,
        pipelineVersion: INBOX_TRANSLATION_PIPELINE_VERSION,
        status: "ready",
      })
        .select("translatedText sourceLanguage")
        .lean();
      if (raced?.translatedText) {
        return {
          messageId: input.messageId,
          targetLanguage: input.targetLanguage,
          status: "ready",
          translatedText: raced.translatedText,
          sourceLanguage:
            (raced.sourceLanguage as BotLanguage | undefined) ?? sourceLanguage,
          cached: true,
        };
      }
      console.error("[InboxTranslate] cache upsert failed", {
        errorCategory: error instanceof Error ? error.name : "unknown",
      });
    }

    return {
      messageId: input.messageId,
      targetLanguage: input.targetLanguage,
      status: "ready",
      translatedText: result.text,
      sourceLanguage,
      cached: false,
    };
  })();

  inFlightTranslations.set(key, promise);
  try {
    return await promise;
  } finally {
    inFlightTranslations.delete(key);
  }
}
