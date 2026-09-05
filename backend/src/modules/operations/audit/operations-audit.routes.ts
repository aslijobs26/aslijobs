import { Router } from "express";
import {
  requireOperationsAuth,
  requireOperationsPermission,
} from "../../../middleware/operations-auth.middleware.js";
import { validate } from "../../../middleware/validate.middleware.js";
import { asyncHandler } from "../../../utils/async-handler.js";
import { listOperationsAuditController } from "./operations-audit.controller.js";
import { listOperationsAuditQuerySchema } from "./operations-audit.list.js";

export const operationsAuditRouter = Router();

operationsAuditRouter.use(asyncHandler(requireOperationsAuth));

operationsAuditRouter.get(
  "/",
  requireOperationsPermission("activity_logs", "read"),
  validate(listOperationsAuditQuerySchema, "query"),
  asyncHandler(listOperationsAuditController),
);

export default operationsAuditRouter;
