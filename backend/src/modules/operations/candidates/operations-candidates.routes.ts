import { Router } from "express";
import {
  requireOperationsAuth,
  requireFineOrCoarsePermission,
  requireOperationsPermissionKey,
} from "../../../middleware/operations-auth.middleware.js";
import { validate } from "../../../middleware/validate.middleware.js";
import { asyncHandler } from "../../../utils/async-handler.js";
import {
  CANDIDATE_EXPORT_PERMISSION_KEY,
  CANDIDATE_LIST_VIEW_PERMISSION_KEY,
  CANDIDATE_PROFILE_VIEW_PERMISSION_KEY,
} from "../rbac/operations-permission-catalog.js";
import { operationsCandidatesController } from "./operations-candidates.controller.js";
import {
  listOperationsCandidateApplicationsQuerySchema,
  listOperationsCandidatesQuerySchema,
  candidatesAnalyticsQuerySchema,
  exportOperationsCandidatesQuerySchema,
  operationsCandidateApplicationIdParamsSchema,
  operationsCandidateSeekerIdParamsSchema,
} from "./operations-candidates.validation.js";

export const operationsCandidatesRouter = Router();

operationsCandidatesRouter.use(asyncHandler(requireOperationsAuth));

operationsCandidatesRouter.get(
  "/",
  requireFineOrCoarsePermission(
    CANDIDATE_LIST_VIEW_PERMISSION_KEY,
    "candidates",
    "read",
  ),
  validate(listOperationsCandidatesQuerySchema, "query"),
  asyncHandler(operationsCandidatesController.list),
);

operationsCandidatesRouter.get(
  "/analytics",
  requireFineOrCoarsePermission(
    CANDIDATE_LIST_VIEW_PERMISSION_KEY,
    "candidates",
    "read",
  ),
  validate(candidatesAnalyticsQuerySchema, "query"),
  asyncHandler(operationsCandidatesController.analytics),
);

operationsCandidatesRouter.get(
  "/export",
  requireOperationsPermissionKey(CANDIDATE_EXPORT_PERMISSION_KEY),
  validate(exportOperationsCandidatesQuerySchema, "query"),
  asyncHandler(operationsCandidatesController.export),
);

operationsCandidatesRouter.get(
  "/seekers/:jobSeekerId/applications",
  requireFineOrCoarsePermission(
    CANDIDATE_PROFILE_VIEW_PERMISSION_KEY,
    "candidates",
    "read",
  ),
  validate(operationsCandidateSeekerIdParamsSchema, "params"),
  validate(listOperationsCandidateApplicationsQuerySchema, "query"),
  asyncHandler(operationsCandidatesController.listSeekerApplications),
);

operationsCandidatesRouter.get(
  "/seekers/:jobSeekerId/resume",
  requireFineOrCoarsePermission(
    CANDIDATE_PROFILE_VIEW_PERMISSION_KEY,
    "candidates",
    "read",
  ),
  validate(operationsCandidateSeekerIdParamsSchema, "params"),
  asyncHandler(operationsCandidatesController.downloadResume),
);

operationsCandidatesRouter.get(
  "/seekers/:jobSeekerId/photo",
  requireFineOrCoarsePermission(
    CANDIDATE_PROFILE_VIEW_PERMISSION_KEY,
    "candidates",
    "read",
  ),
  validate(operationsCandidateSeekerIdParamsSchema, "params"),
  asyncHandler(operationsCandidatesController.downloadPhoto),
);

operationsCandidatesRouter.get(
  "/seekers/:jobSeekerId",
  requireFineOrCoarsePermission(
    CANDIDATE_PROFILE_VIEW_PERMISSION_KEY,
    "candidates",
    "read",
  ),
  validate(operationsCandidateSeekerIdParamsSchema, "params"),
  asyncHandler(operationsCandidatesController.getBySeekerId),
);

operationsCandidatesRouter.get(
  "/applications/:applicationId",
  requireFineOrCoarsePermission(
    CANDIDATE_PROFILE_VIEW_PERMISSION_KEY,
    "candidates",
    "read",
  ),
  validate(operationsCandidateApplicationIdParamsSchema, "params"),
  asyncHandler(operationsCandidatesController.getByApplicationId),
);

export default operationsCandidatesRouter;
