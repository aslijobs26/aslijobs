import { Router } from "express";
import {
  requireOperationsAuth,
  requireOperationsPermission,
} from "../../middleware/operations-auth.middleware.js";
import { validate } from "../../middleware/validate.middleware.js";
import { asyncHandler } from "../../utils/async-handler.js";
import { updateWorkStatusBodySchema } from "../operations/work/operations-work.validation.js";
import { hireAssistController } from "./hire-assist.controller.js";
import {
  hireAssistTicketIdParamsSchema,
  listHireAssistTicketsQuerySchema,
} from "./hire-assist.validation.js";

export const hireAssistAdminRouter = Router();

hireAssistAdminRouter.use(asyncHandler(requireOperationsAuth));

hireAssistAdminRouter.get(
  "/",
  requireOperationsPermission("support", "read"),
  validate(listHireAssistTicketsQuerySchema, "query"),
  asyncHandler(hireAssistController.list),
);

hireAssistAdminRouter.get(
  "/:id",
  requireOperationsPermission("support", "read"),
  validate(hireAssistTicketIdParamsSchema, "params"),
  asyncHandler(hireAssistController.detail),
);

hireAssistAdminRouter.patch(
  "/:id/status",
  requireOperationsPermission("support", "update"),
  validate(hireAssistTicketIdParamsSchema, "params"),
  validate(updateWorkStatusBodySchema, "body"),
  asyncHandler(hireAssistController.updateStatus),
);
