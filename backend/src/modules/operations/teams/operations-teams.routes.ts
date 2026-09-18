import { Router } from "express";
import {
  requireOperationsAuth,
} from "../../../middleware/operations-auth.middleware.js";
import { validate } from "../../../middleware/validate.middleware.js";
import { asyncHandler } from "../../../utils/async-handler.js";
import { operationsTeamsController } from "./operations-teams.controller.js";
import {
  addOperationsTeamMemberBodySchema,
  createOperationsTeamBodySchema,
  listOperationsTeamsQuerySchema,
  listTeamMembersQuerySchema,
  operationsTeamIdParamsSchema,
  operationsTeamMemberParamsSchema,
  removeOperationsTeamMemberBodySchema,
  updateOperationsTeamBodySchema,
} from "./operations-teams.validation.js";
import { z } from "zod";

const archiveBodySchema = z.object({
  expectedRevision: z.coerce.number().int().min(1),
});

export const operationsTeamsRouter = Router();

operationsTeamsRouter.use(asyncHandler(requireOperationsAuth));

operationsTeamsRouter.get(
  "/metrics",
  asyncHandler(operationsTeamsController.metrics),
);

operationsTeamsRouter.get(
  "/",
  validate(listOperationsTeamsQuerySchema, "query"),
  asyncHandler(operationsTeamsController.list),
);

operationsTeamsRouter.post(
  "/",
  validate(createOperationsTeamBodySchema, "body"),
  asyncHandler(operationsTeamsController.create),
);

operationsTeamsRouter.get(
  "/:teamId/members",
  validate(operationsTeamIdParamsSchema, "params"),
  validate(listTeamMembersQuerySchema, "query"),
  asyncHandler(operationsTeamsController.listMembers),
);

operationsTeamsRouter.post(
  "/:teamId/members",
  validate(operationsTeamIdParamsSchema, "params"),
  validate(addOperationsTeamMemberBodySchema, "body"),
  asyncHandler(operationsTeamsController.addMember),
);

operationsTeamsRouter.post(
  "/:teamId/members/:memberId/remove",
  validate(operationsTeamMemberParamsSchema, "params"),
  validate(removeOperationsTeamMemberBodySchema, "body"),
  asyncHandler(operationsTeamsController.removeMember),
);

operationsTeamsRouter.get(
  "/:teamId/work-summary",
  validate(operationsTeamIdParamsSchema, "params"),
  asyncHandler(operationsTeamsController.workSummary),
);

operationsTeamsRouter.get(
  "/:teamId",
  validate(operationsTeamIdParamsSchema, "params"),
  asyncHandler(operationsTeamsController.getById),
);

operationsTeamsRouter.patch(
  "/:teamId",
  validate(operationsTeamIdParamsSchema, "params"),
  validate(updateOperationsTeamBodySchema, "body"),
  asyncHandler(operationsTeamsController.update),
);

operationsTeamsRouter.delete(
  "/:teamId",
  validate(operationsTeamIdParamsSchema, "params"),
  validate(archiveBodySchema, "body"),
  asyncHandler(operationsTeamsController.remove),
);

export default operationsTeamsRouter;
