import { Router } from "express";
import {
  requireFineOrCoarsePermission,
  requireOperationsAuth,
} from "../../../middleware/operations-auth.middleware.js";
import { validate } from "../../../middleware/validate.middleware.js";
import { asyncHandler } from "../../../utils/async-handler.js";
import { operationsWhatsAppInboxController } from "./operations-whatsapp-inbox.controller.js";
import { whatsAppInboxMediaUpload } from "./operations-whatsapp-inbox-upload.middleware.js";
import {
  listWhatsAppInboxContactsQuerySchema,
  listWhatsAppInboxConversationsQuerySchema,
  listWhatsAppInboxMessagesQuerySchema,
  openWhatsAppInboxConversationBodySchema,
  sendWhatsAppInboxMessageBodySchema,
  setWhatsAppInboxBotBodySchema,
  setWhatsAppInboxViewLanguageBodySchema,
  translateWhatsAppInboxDraftBodySchema,
  translateWhatsAppInboxMessagesBodySchema,
  whatsAppInboxConversationParamsSchema,
  whatsAppInboxMessageParamsSchema,
} from "./operations-whatsapp-inbox.validation.js";

export const operationsWhatsAppInboxRouter = Router();

operationsWhatsAppInboxRouter.use(asyncHandler(requireOperationsAuth));

operationsWhatsAppInboxRouter.get(
  "/contacts",
  requireFineOrCoarsePermission("whatsapp.view", "whatsapp", "read"),
  validate(listWhatsAppInboxContactsQuerySchema, "query"),
  asyncHandler(operationsWhatsAppInboxController.listContacts),
);

operationsWhatsAppInboxRouter.post(
  "/contacts/open",
  requireFineOrCoarsePermission("whatsapp.view", "whatsapp", "read"),
  validate(openWhatsAppInboxConversationBodySchema, "body"),
  asyncHandler(operationsWhatsAppInboxController.openConversation),
);

operationsWhatsAppInboxRouter.get(
  "/conversations",
  requireFineOrCoarsePermission("whatsapp.view", "whatsapp", "read"),
  validate(listWhatsAppInboxConversationsQuerySchema, "query"),
  asyncHandler(operationsWhatsAppInboxController.listConversations),
);

operationsWhatsAppInboxRouter.get(
  "/conversations/:conversationId",
  requireFineOrCoarsePermission("whatsapp.view", "whatsapp", "read"),
  validate(whatsAppInboxConversationParamsSchema, "params"),
  asyncHandler(operationsWhatsAppInboxController.getConversation),
);

operationsWhatsAppInboxRouter.get(
  "/conversations/:conversationId/messages",
  requireFineOrCoarsePermission("whatsapp.view", "whatsapp", "read"),
  validate(whatsAppInboxConversationParamsSchema, "params"),
  validate(listWhatsAppInboxMessagesQuerySchema, "query"),
  asyncHandler(operationsWhatsAppInboxController.listMessages),
);

operationsWhatsAppInboxRouter.get(
  "/conversations/:conversationId/contact",
  requireFineOrCoarsePermission("whatsapp.view", "whatsapp", "read"),
  validate(whatsAppInboxConversationParamsSchema, "params"),
  asyncHandler(operationsWhatsAppInboxController.getContactDetails),
);

operationsWhatsAppInboxRouter.post(
  "/conversations/:conversationId/bot",
  requireFineOrCoarsePermission("whatsapp.create", "whatsapp", "create"),
  validate(whatsAppInboxConversationParamsSchema, "params"),
  validate(setWhatsAppInboxBotBodySchema, "body"),
  asyncHandler(operationsWhatsAppInboxController.setBotPaused),
);

operationsWhatsAppInboxRouter.post(
  "/conversations/:conversationId/read",
  requireFineOrCoarsePermission("whatsapp.view", "whatsapp", "read"),
  validate(whatsAppInboxConversationParamsSchema, "params"),
  asyncHandler(operationsWhatsAppInboxController.markRead),
);

operationsWhatsAppInboxRouter.get(
  "/conversations/:conversationId/messages/:messageId/media",
  requireFineOrCoarsePermission("whatsapp.view", "whatsapp", "read"),
  validate(whatsAppInboxMessageParamsSchema, "params"),
  asyncHandler(operationsWhatsAppInboxController.getMessageMedia),
);

operationsWhatsAppInboxRouter.post(
  "/conversations/:conversationId/messages/media",
  requireFineOrCoarsePermission("whatsapp.create", "whatsapp", "create"),
  validate(whatsAppInboxConversationParamsSchema, "params"),
  whatsAppInboxMediaUpload,
  asyncHandler(operationsWhatsAppInboxController.sendMedia),
);

operationsWhatsAppInboxRouter.post(
  "/conversations/:conversationId/messages",
  requireFineOrCoarsePermission("whatsapp.create", "whatsapp", "create"),
  validate(whatsAppInboxConversationParamsSchema, "params"),
  validate(sendWhatsAppInboxMessageBodySchema, "body"),
  asyncHandler(operationsWhatsAppInboxController.sendMessage),
);

operationsWhatsAppInboxRouter.get(
  "/conversations/:conversationId/view-language",
  requireFineOrCoarsePermission("whatsapp.view", "whatsapp", "read"),
  validate(whatsAppInboxConversationParamsSchema, "params"),
  asyncHandler(operationsWhatsAppInboxController.getViewLanguage),
);

operationsWhatsAppInboxRouter.put(
  "/conversations/:conversationId/view-language",
  requireFineOrCoarsePermission("whatsapp.view", "whatsapp", "read"),
  validate(whatsAppInboxConversationParamsSchema, "params"),
  validate(setWhatsAppInboxViewLanguageBodySchema, "body"),
  asyncHandler(operationsWhatsAppInboxController.setViewLanguage),
);

operationsWhatsAppInboxRouter.get(
  "/conversations/:conversationId/recipient-language",
  requireFineOrCoarsePermission("whatsapp.view", "whatsapp", "read"),
  validate(whatsAppInboxConversationParamsSchema, "params"),
  asyncHandler(operationsWhatsAppInboxController.getRecipientLanguage),
);

operationsWhatsAppInboxRouter.post(
  "/conversations/:conversationId/translations",
  requireFineOrCoarsePermission("whatsapp.view", "whatsapp", "read"),
  validate(whatsAppInboxConversationParamsSchema, "params"),
  validate(translateWhatsAppInboxMessagesBodySchema, "body"),
  asyncHandler(operationsWhatsAppInboxController.translateMessages),
);

operationsWhatsAppInboxRouter.post(
  "/conversations/:conversationId/draft-translate",
  requireFineOrCoarsePermission("whatsapp.create", "whatsapp", "create"),
  validate(whatsAppInboxConversationParamsSchema, "params"),
  validate(translateWhatsAppInboxDraftBodySchema, "body"),
  asyncHandler(operationsWhatsAppInboxController.translateDraft),
);

export default operationsWhatsAppInboxRouter;
