import { Router } from "express";
import {
  requireOperationsAuth,
  requireOperationsPermission,
} from "../../../middleware/operations-auth.middleware.js";
import { asyncHandler } from "../../../utils/async-handler.js";
import { operationsRolesController } from "../roles/operations-roles.controller.js";

export const operationsPermissionsRouter = Router();

operationsPermissionsRouter.use(asyncHandler(requireOperationsAuth));

operationsPermissionsRouter.get(
  "/",
  requireOperationsPermission("roles", "read"),
  asyncHandler(operationsRolesController.catalog),
);

export default operationsPermissionsRouter;
