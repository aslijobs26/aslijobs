import { Router } from "express";
import { requireEmployerAuth } from "../../middleware/auth.middleware.js";
import { requirePermission } from "../../middleware/permission.middleware.js";
import { optionalJobSeekerAuth } from "../../middleware/job-seeker-auth.middleware.js";
import { validate } from "../../middleware/validate.middleware.js";
import { asyncHandler } from "../../utils/async-handler.js";
import { jobController } from "./job.controller.js";
import {
  createJobSchema,
  jobIdParamsSchema,
  listEmployerJobsQuerySchema,
  publicJobIdParamsSchema,
  publicJobsQuerySchema,
  publishDraftJobSchema,
  saveDraftJobSchema,
  similarPublicJobsQuerySchema,
  updateActiveJobSchema,
  updateJobStatusSchema,
} from "./job.validation.js";

const jobRouter = Router();

jobRouter.get(
  "/public",
  asyncHandler(optionalJobSeekerAuth),
  validate(publicJobsQuerySchema, "query"),
  asyncHandler(jobController.listPublic),
);

jobRouter.get(
  "/public/:publicJobId/similar",
  asyncHandler(optionalJobSeekerAuth),
  validate(publicJobIdParamsSchema, "params"),
  validate(similarPublicJobsQuerySchema, "query"),
  asyncHandler(jobController.listSimilarPublic),
);

jobRouter.get(
  "/public/:publicJobId",
  asyncHandler(optionalJobSeekerAuth),
  validate(publicJobIdParamsSchema, "params"),
  asyncHandler(jobController.getPublicByPublicId),
);

jobRouter.post(
  "/",
  asyncHandler(requireEmployerAuth),
  asyncHandler(requirePermission("jobs", "create")),
  validate(createJobSchema, "body"),
  asyncHandler(jobController.create),
);

jobRouter.post(
  "/draft",
  asyncHandler(requireEmployerAuth),
  asyncHandler(requirePermission("jobs", "create")),
  validate(saveDraftJobSchema, "body"),
  asyncHandler(jobController.createDraft),
);

jobRouter.get(
  "/mine",
  asyncHandler(requireEmployerAuth),
  asyncHandler(requirePermission("jobs", "read")),
  validate(listEmployerJobsQuerySchema, "query"),
  asyncHandler(jobController.listMine),
);

jobRouter.get(
  "/mine/stats",
  asyncHandler(requireEmployerAuth),
  asyncHandler(requirePermission("jobs", "read")),
  asyncHandler(jobController.stats),
);

jobRouter.get(
  "/:jobId",
  asyncHandler(requireEmployerAuth),
  asyncHandler(requirePermission("jobs", "read")),
  validate(jobIdParamsSchema, "params"),
  asyncHandler(jobController.getById),
);

jobRouter.put(
  "/:jobId",
  asyncHandler(requireEmployerAuth),
  asyncHandler(requirePermission("jobs", "update")),
  validate(jobIdParamsSchema, "params"),
  validate(updateActiveJobSchema, "body"),
  asyncHandler(jobController.updateActive),
);

jobRouter.patch(
  "/:jobId/draft",
  asyncHandler(requireEmployerAuth),
  asyncHandler(requirePermission("jobs", "update")),
  validate(jobIdParamsSchema, "params"),
  validate(saveDraftJobSchema, "body"),
  asyncHandler(jobController.updateDraft),
);

jobRouter.put(
  "/:jobId/publish",
  asyncHandler(requireEmployerAuth),
  asyncHandler(requirePermission("jobs", "update")),
  validate(jobIdParamsSchema, "params"),
  validate(publishDraftJobSchema, "body"),
  asyncHandler(jobController.publishDraft),
);

jobRouter.patch(
  "/:jobId/status",
  asyncHandler(requireEmployerAuth),
  asyncHandler(requirePermission("jobs", "update")),
  validate(jobIdParamsSchema, "params"),
  validate(updateJobStatusSchema, "body"),
  asyncHandler(jobController.updateStatus),
);

jobRouter.delete(
  "/:jobId",
  asyncHandler(requireEmployerAuth),
  asyncHandler(requirePermission("jobs", "delete")),
  validate(jobIdParamsSchema, "params"),
  asyncHandler(jobController.remove),
);

export default jobRouter;
