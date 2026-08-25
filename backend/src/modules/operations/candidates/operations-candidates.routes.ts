import { Router } from "express";
import { requireOperationsAuth } from "../../../middleware/operations-auth.middleware.js";
import { validate } from "../../../middleware/validate.middleware.js";
import { asyncHandler } from "../../../utils/async-handler.js";
import { operationsCandidatesController } from "./operations-candidates.controller.js";
import {
  listOperationsCandidatesQuerySchema,
  operationsCandidateApplicationIdParamsSchema,
  operationsCandidateSeekerIdParamsSchema,
} from "./operations-candidates.validation.js";

export const operationsCandidatesRouter = Router();

operationsCandidatesRouter.use(asyncHandler(requireOperationsAuth));

operationsCandidatesRouter.get(
  "/",
  validate(listOperationsCandidatesQuerySchema, "query"),
  asyncHandler(operationsCandidatesController.list),
);

operationsCandidatesRouter.get(
  "/seekers/:jobSeekerId",
  validate(operationsCandidateSeekerIdParamsSchema, "params"),
  asyncHandler(operationsCandidatesController.getBySeekerId),
);

operationsCandidatesRouter.get(
  "/applications/:applicationId",
  validate(operationsCandidateApplicationIdParamsSchema, "params"),
  asyncHandler(operationsCandidatesController.getByApplicationId),
);

export default operationsCandidatesRouter;
