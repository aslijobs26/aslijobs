import { Router } from "express";
import { operationsTeamWriteRateLimit } from "../../../middleware/operations-team-write-rate-limit.middleware.js";
import {
  requireOperationsAuth,
  requireOperationsPermission,
} from "../../../middleware/operations-auth.middleware.js";
import { validate } from "../../../middleware/validate.middleware.js";
import { asyncHandler } from "../../../utils/async-handler.js";
import { operationsRolesController } from "./operations-roles.controller.js";
import {
  archiveOperationsRoleBodySchema,
  createOperationsRoleBodySchema,
  listOperationsRolesQuerySchema,
  operationsRoleIdParamsSchema,
  updateOperationsRoleBodySchema,
} from "./operations-roles.validation.js";

export const operationsRolesRouter = Router();

operationsRolesRouter.use(asyncHandler(requireOperationsAuth));

operationsRolesRouter.get(
  "/catalog",
  requireOperationsPermission("roles", "read"),
  asyncHandler(operationsRolesController.catalog),
);

operationsRolesRouter.get(
  "/hierarchy",
  requireOperationsPermission("roles", "read"),
  asyncHandler(operationsRolesController.hierarchy),
);

operationsRolesRouter.get(
  "/",
  requireOperationsPermission("roles", "read"),
  validate(listOperationsRolesQuerySchema, "query"),
  asyncHandler(operationsRolesController.list),
);

operationsRolesRouter.post(
  "/",
  operationsTeamWriteRateLimit,
  requireOperationsPermission("roles", "create"),
  validate(createOperationsRoleBodySchema, "body"),
  asyncHandler(operationsRolesController.create),
);

operationsRolesRouter.get(
  "/:roleId",
  requireOperationsPermission("roles", "read"),
  validate(operationsRoleIdParamsSchema, "params"),
  asyncHandler(operationsRolesController.getById),
);

operationsRolesRouter.patch(
  "/:roleId",
  operationsTeamWriteRateLimit,
  requireOperationsPermission("roles", "update"),
  validate(operationsRoleIdParamsSchema, "params"),
  validate(updateOperationsRoleBodySchema, "body"),
  asyncHandler(operationsRolesController.update),
);

operationsRolesRouter.post(
  "/:roleId/archive",
  operationsTeamWriteRateLimit,
  requireOperationsPermission("roles", "delete"),
  validate(operationsRoleIdParamsSchema, "params"),
  validate(archiveOperationsRoleBodySchema, "body"),
  asyncHandler(operationsRolesController.archive),
);

operationsRolesRouter.post(
  "/:roleId/restore",
  operationsTeamWriteRateLimit,
  requireOperationsPermission("roles", "update"),
  validate(operationsRoleIdParamsSchema, "params"),
  asyncHandler(operationsRolesController.restore),
);

export default operationsRolesRouter;
