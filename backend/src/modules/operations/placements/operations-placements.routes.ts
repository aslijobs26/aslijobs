import { Router } from "express";
import {
  requireOperationsAuth,
  requireOperationsPermission,
  requireOperationsPermissionKey,
} from "../../../middleware/operations-auth.middleware.js";
import { validate } from "../../../middleware/validate.middleware.js";
import { asyncHandler } from "../../../utils/async-handler.js";
import { PLACEMENTS_LIST_EXPORT_KEY } from "../rbac/operations-permission-catalog.js";
import { operationsPlacementsController } from "./operations-placements.controller.js";
import {
  exportOperationsPlacementsQuerySchema,
  listOperationsPlacementsQuerySchema,
  operationsPlacementIdParamsSchema,
  placementsAnalyticsQuerySchema,
  updatePlacementJoiningStatusBodySchema,
} from "./operations-placements.validation.js";

export const operationsPlacementsRouter = Router();

operationsPlacementsRouter.use(asyncHandler(requireOperationsAuth));

operationsPlacementsRouter.get(
  "/analytics",
  requireOperationsPermission("placements", "read"),
  validate(placementsAnalyticsQuerySchema, "query"),
  asyncHandler(operationsPlacementsController.analytics),
);

operationsPlacementsRouter.get(
  "/export",
  requireOperationsPermissionKey(PLACEMENTS_LIST_EXPORT_KEY),
  validate(exportOperationsPlacementsQuerySchema, "query"),
  asyncHandler(operationsPlacementsController.export),
);

operationsPlacementsRouter.get(
  "/",
  requireOperationsPermission("placements", "read"),
  validate(listOperationsPlacementsQuerySchema, "query"),
  asyncHandler(operationsPlacementsController.list),
);

operationsPlacementsRouter.patch(
  "/:id/joining-status",
  requireOperationsPermission("placements", "update"),
  validate(operationsPlacementIdParamsSchema, "params"),
  validate(updatePlacementJoiningStatusBodySchema, "body"),
  asyncHandler(operationsPlacementsController.updateJoiningStatus),
);

operationsPlacementsRouter.get(
  "/:id",
  requireOperationsPermission("placements", "read"),
  validate(operationsPlacementIdParamsSchema, "params"),
  asyncHandler(operationsPlacementsController.getById),
);

export default operationsPlacementsRouter;
