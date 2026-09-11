import { Router } from "express";
import {
  requireOperationsAuth,
  requireOperationsPermission,
} from "../../../middleware/operations-auth.middleware.js";
import { validate } from "../../../middleware/validate.middleware.js";
import { asyncHandler } from "../../../utils/async-handler.js";
import { operationsWorkController } from "./operations-work.controller.js";
import {
  assignOperationsWorkBodySchema,
  claimOperationsWorkBodySchema,
  createOperationsWorkBodySchema,
  exportOperationsWorkQuerySchema,
  listOperationsWorkQuerySchema,
  operationsWorkIdParamsSchema,
  updateWorkDueBodySchema,
  updateWorkPriorityBodySchema,
  updateWorkStatusBodySchema,
} from "./operations-work.validation.js";

export const operationsWorkRouter = Router();

operationsWorkRouter.use(asyncHandler(requireOperationsAuth));

operationsWorkRouter.get(
  "/analytics",
  requireOperationsPermission("my_work", "read"),
  asyncHandler(operationsWorkController.analytics),
);

operationsWorkRouter.get(
  "/performance",
  requireOperationsPermission("my_work", "read"),
  asyncHandler(operationsWorkController.performance),
);

operationsWorkRouter.get(
  "/export",
  requireOperationsPermission("my_work", "read"),
  validate(exportOperationsWorkQuerySchema, "query"),
  asyncHandler(operationsWorkController.export),
);

operationsWorkRouter.get(
  "/eligible-assignees",
  requireOperationsPermission("my_work", "update"),
  asyncHandler(operationsWorkController.eligibleAssignees),
);

operationsWorkRouter.get(
  "/",
  requireOperationsPermission("my_work", "read"),
  validate(listOperationsWorkQuerySchema, "query"),
  asyncHandler(operationsWorkController.list),
);

operationsWorkRouter.post(
  "/",
  requireOperationsPermission("my_work", "create"),
  validate(createOperationsWorkBodySchema, "body"),
  asyncHandler(operationsWorkController.create),
);

operationsWorkRouter.get(
  "/:id",
  requireOperationsPermission("my_work", "read"),
  validate(operationsWorkIdParamsSchema, "params"),
  asyncHandler(operationsWorkController.getById),
);

operationsWorkRouter.patch(
  "/:id/assign",
  requireOperationsPermission("my_work", "update"),
  validate(operationsWorkIdParamsSchema, "params"),
  validate(assignOperationsWorkBodySchema, "body"),
  asyncHandler(operationsWorkController.assign),
);

operationsWorkRouter.patch(
  "/:id/claim",
  requireOperationsPermission("my_work", "update"),
  validate(operationsWorkIdParamsSchema, "params"),
  validate(claimOperationsWorkBodySchema, "body"),
  asyncHandler(operationsWorkController.claim),
);

operationsWorkRouter.patch(
  "/:id/status",
  requireOperationsPermission("my_work", "update"),
  validate(operationsWorkIdParamsSchema, "params"),
  validate(updateWorkStatusBodySchema, "body"),
  asyncHandler(operationsWorkController.updateStatus),
);

operationsWorkRouter.patch(
  "/:id/priority",
  requireOperationsPermission("my_work", "update"),
  validate(operationsWorkIdParamsSchema, "params"),
  validate(updateWorkPriorityBodySchema, "body"),
  asyncHandler(operationsWorkController.updatePriority),
);

operationsWorkRouter.patch(
  "/:id/due",
  requireOperationsPermission("my_work", "update"),
  validate(operationsWorkIdParamsSchema, "params"),
  validate(updateWorkDueBodySchema, "body"),
  asyncHandler(operationsWorkController.updateDue),
);

export default operationsWorkRouter;
