import { Router } from "express";
import {
  requireOperationsAuth,
  requireOperationsPermission,
} from "../../../middleware/operations-auth.middleware.js";
import { validate } from "../../../middleware/validate.middleware.js";
import { asyncHandler } from "../../../utils/async-handler.js";
import { operationsCandidatesController } from "./operations-candidates.controller.js";
import {
  listOperationsCandidateApplicationsQuerySchema,
  listOperationsCandidatesQuerySchema,
  operationsCandidateApplicationIdParamsSchema,
  operationsCandidateSeekerIdParamsSchema,
} from "./operations-candidates.validation.js";

export const operationsCandidatesRouter = Router();

operationsCandidatesRouter.use(asyncHandler(requireOperationsAuth));

operationsCandidatesRouter.get(
  "/",
  requireOperationsPermission("candidates", "read"),
  validate(listOperationsCandidatesQuerySchema, "query"),
  asyncHandler(operationsCandidatesController.list),
);

operationsCandidatesRouter.get(
  "/seekers/:jobSeekerId/applications",
  requireOperationsPermission("candidates", "read"),
  validate(operationsCandidateSeekerIdParamsSchema, "params"),
  validate(listOperationsCandidateApplicationsQuerySchema, "query"),
  asyncHandler(operationsCandidatesController.listSeekerApplications),
);

operationsCandidatesRouter.get(
  "/seekers/:jobSeekerId",
  requireOperationsPermission("candidates", "read"),
  validate(operationsCandidateSeekerIdParamsSchema, "params"),
  asyncHandler(operationsCandidatesController.getBySeekerId),
);

operationsCandidatesRouter.get(
  "/applications/:applicationId",
  requireOperationsPermission("candidates", "read"),
  validate(operationsCandidateApplicationIdParamsSchema, "params"),
  asyncHandler(operationsCandidatesController.getByApplicationId),
);

export default operationsCandidatesRouter;
