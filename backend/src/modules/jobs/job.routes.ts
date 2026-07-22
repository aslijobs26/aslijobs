import { Router } from "express";
import { requireEmployerAuth } from "../../middleware/auth.middleware.js";
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
  updateActiveJobSchema,
  updateJobStatusSchema,
} from "./job.validation.js";

const jobRouter = Router();

jobRouter.get(
  "/public",
  validate(publicJobsQuerySchema, "query"),
  asyncHandler(jobController.listPublic),
);

jobRouter.get(
  "/public/:publicJobId",
  validate(publicJobIdParamsSchema, "params"),
  asyncHandler(jobController.getPublicByPublicId),
);

jobRouter.post(
  "/",
  asyncHandler(requireEmployerAuth),
  validate(createJobSchema, "body"),
  asyncHandler(jobController.create),
);

jobRouter.post(
  "/draft",
  asyncHandler(requireEmployerAuth),
  validate(saveDraftJobSchema, "body"),
  asyncHandler(jobController.createDraft),
);

jobRouter.get(
  "/mine",
  asyncHandler(requireEmployerAuth),
  validate(listEmployerJobsQuerySchema, "query"),
  asyncHandler(jobController.listMine),
);

jobRouter.get(
  "/mine/stats",
  asyncHandler(requireEmployerAuth),
  asyncHandler(jobController.stats),
);

jobRouter.get(
  "/:jobId",
  asyncHandler(requireEmployerAuth),
  validate(jobIdParamsSchema, "params"),
  asyncHandler(jobController.getById),
);

jobRouter.put(
  "/:jobId",
  asyncHandler(requireEmployerAuth),
  validate(jobIdParamsSchema, "params"),
  validate(updateActiveJobSchema, "body"),
  asyncHandler(jobController.updateActive),
);

jobRouter.patch(
  "/:jobId/draft",
  asyncHandler(requireEmployerAuth),
  validate(jobIdParamsSchema, "params"),
  validate(saveDraftJobSchema, "body"),
  asyncHandler(jobController.updateDraft),
);

jobRouter.put(
  "/:jobId/publish",
  asyncHandler(requireEmployerAuth),
  validate(jobIdParamsSchema, "params"),
  validate(publishDraftJobSchema, "body"),
  asyncHandler(jobController.publishDraft),
);

jobRouter.patch(
  "/:jobId/status",
  asyncHandler(requireEmployerAuth),
  validate(jobIdParamsSchema, "params"),
  validate(updateJobStatusSchema, "body"),
  asyncHandler(jobController.updateStatus),
);

jobRouter.delete(
  "/:jobId",
  asyncHandler(requireEmployerAuth),
  validate(jobIdParamsSchema, "params"),
  asyncHandler(jobController.remove),
);

export default jobRouter;
