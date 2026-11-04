import { Router } from "express";
import {
  requireFineOrCoarsePermission,
  requireOperationsAuth,
} from "../../../middleware/operations-auth.middleware.js";
import { asyncHandler } from "../../../utils/async-handler.js";
import { operationsWebsiteKnowledgeController } from "./operations-website-knowledge.controller.js";

export const operationsWebsiteKnowledgeRouter = Router();

operationsWebsiteKnowledgeRouter.use(asyncHandler(requireOperationsAuth));

operationsWebsiteKnowledgeRouter.get(
  "/status",
  requireFineOrCoarsePermission("whatsapp.view", "whatsapp", "read"),
  asyncHandler(operationsWebsiteKnowledgeController.status),
);

operationsWebsiteKnowledgeRouter.get(
  "/documents",
  requireFineOrCoarsePermission("whatsapp.view", "whatsapp", "read"),
  asyncHandler(operationsWebsiteKnowledgeController.documents),
);

operationsWebsiteKnowledgeRouter.get(
  "/ops",
  requireFineOrCoarsePermission("whatsapp.view", "whatsapp", "read"),
  asyncHandler(operationsWebsiteKnowledgeController.ops),
);

operationsWebsiteKnowledgeRouter.post(
  "/refresh",
  requireFineOrCoarsePermission("whatsapp.create", "whatsapp", "create"),
  asyncHandler(operationsWebsiteKnowledgeController.refresh),
);

operationsWebsiteKnowledgeRouter.post(
  "/refresh-page",
  requireFineOrCoarsePermission("whatsapp.create", "whatsapp", "create"),
  asyncHandler(operationsWebsiteKnowledgeController.refreshPage),
);

operationsWebsiteKnowledgeRouter.post(
  "/reindex",
  requireFineOrCoarsePermission("whatsapp.create", "whatsapp", "create"),
  asyncHandler(operationsWebsiteKnowledgeController.reindex),
);

operationsWebsiteKnowledgeRouter.post(
  "/diagnose",
  requireFineOrCoarsePermission("whatsapp.view", "whatsapp", "read"),
  asyncHandler(operationsWebsiteKnowledgeController.diagnose),
);

operationsWebsiteKnowledgeRouter.post(
  "/diagnose-send",
  requireFineOrCoarsePermission("whatsapp.create", "whatsapp", "create"),
  asyncHandler(operationsWebsiteKnowledgeController.diagnoseSend),
);

export default operationsWebsiteKnowledgeRouter;
