import { Router } from "express";
import { requireJobSeekerAuth } from "../../middleware/job-seeker-auth.middleware.js";
import { asyncHandler } from "../../utils/async-handler.js";
import { resumeController } from "./resume.controller.js";

/**
 * Job Seeker resume routes — owner-scoped via JWT.
 * Mounted at /api/v1/resumes
 */
const resumeRouter = Router();

resumeRouter.get(
  "/me",
  asyncHandler(requireJobSeekerAuth),
  asyncHandler(resumeController.getActive),
);

resumeRouter.post(
  "/me/regenerate",
  asyncHandler(requireJobSeekerAuth),
  asyncHandler(resumeController.regenerate),
);

resumeRouter.get(
  "/me/pdf",
  asyncHandler(requireJobSeekerAuth),
  asyncHandler(resumeController.downloadPdf),
);

export default resumeRouter;
