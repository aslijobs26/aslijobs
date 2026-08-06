import { Router } from "express";
import { requireJobSeekerAuth } from "../../middleware/job-seeker-auth.middleware.js";
import { validate } from "../../middleware/validate.middleware.js";
import { asyncHandler } from "../../utils/async-handler.js";
import { savedJobController } from "./saved-job.controller.js";
import {
  listSavedJobsQuerySchema,
  saveJobBodySchema,
  savedJobPublicIdParamsSchema,
} from "./saved-job.validation.js";

const savedJobRouter = Router();

savedJobRouter.get(
  "/me/stats",
  asyncHandler(requireJobSeekerAuth),
  asyncHandler(savedJobController.getStats),
);

savedJobRouter.get(
  "/me/ids",
  asyncHandler(requireJobSeekerAuth),
  asyncHandler(savedJobController.listIds),
);

savedJobRouter.get(
  "/me",
  asyncHandler(requireJobSeekerAuth),
  validate(listSavedJobsQuerySchema, "query"),
  asyncHandler(savedJobController.list),
);

savedJobRouter.post(
  "/me",
  asyncHandler(requireJobSeekerAuth),
  validate(saveJobBodySchema, "body"),
  asyncHandler(savedJobController.save),
);

savedJobRouter.delete(
  "/me/:publicJobId",
  asyncHandler(requireJobSeekerAuth),
  validate(savedJobPublicIdParamsSchema, "params"),
  asyncHandler(savedJobController.remove),
);

export default savedJobRouter;
