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

operationsWebsiteKnowledgeRouter.post(
  "/refresh",
  requireFineOrCoarsePermission("whatsapp.create", "whatsapp", "create"),
  asyncHandler(operationsWebsiteKnowledgeController.refresh),
);

export default operationsWebsiteKnowledgeRouter;
