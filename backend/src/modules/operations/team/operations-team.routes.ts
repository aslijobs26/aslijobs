import { Router } from "express";
import { operationsTeamWriteRateLimit } from "../../../middleware/operations-team-write-rate-limit.middleware.js";
import {
  requireOperationsAuth,
  requireOperationsPermission,
} from "../../../middleware/operations-auth.middleware.js";
import { validate } from "../../../middleware/validate.middleware.js";
import { asyncHandler } from "../../../utils/async-handler.js";
import { operationsTeamController } from "./operations-team.controller.js";
import {
  createOperationsTeamMemberBodySchema,
  listOperationsTeamQuerySchema,
  operationsTeamMemberIdParamsSchema,
  updateOperationsTeamMemberBodySchema,
  updateOperationsTeamMemberStatusBodySchema,
} from "./operations-team.validation.js";

export const operationsTeamRouter = Router();

operationsTeamRouter.use(asyncHandler(requireOperationsAuth));

operationsTeamRouter.get(
  "/overview",
  requireOperationsPermission("team", "read"),
  asyncHandler(operationsTeamController.overview),
);

operationsTeamRouter.get(
  "/",
  requireOperationsPermission("team", "read"),
  validate(listOperationsTeamQuerySchema, "query"),
  asyncHandler(operationsTeamController.list),
);

operationsTeamRouter.post(
  "/",
  operationsTeamWriteRateLimit,
  requireOperationsPermission("team", "create"),
  validate(createOperationsTeamMemberBodySchema, "body"),
  asyncHandler(operationsTeamController.create),
);

operationsTeamRouter.patch(
  "/:memberId",
  operationsTeamWriteRateLimit,
  requireOperationsPermission("team", "update"),
  validate(operationsTeamMemberIdParamsSchema, "params"),
  validate(updateOperationsTeamMemberBodySchema, "body"),
  asyncHandler(operationsTeamController.update),
);

operationsTeamRouter.patch(
  "/:memberId/status",
  operationsTeamWriteRateLimit,
  requireOperationsPermission("team", "update"),
  validate(operationsTeamMemberIdParamsSchema, "params"),
  validate(updateOperationsTeamMemberStatusBodySchema, "body"),
  asyncHandler(operationsTeamController.updateStatus),
);

export default operationsTeamRouter;
