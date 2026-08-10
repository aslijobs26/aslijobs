import { Router } from "express";
import { requireJobSeekerAuth } from "../../middleware/job-seeker-auth.middleware.js";
import { jobSeekerResumeUpload } from "../../middleware/job-seeker-resume-upload.middleware.js";
import { validate } from "../../middleware/validate.middleware.js";
import { asyncHandler } from "../../utils/async-handler.js";
import { resumeController } from "./resume.controller.js";
import { setDefaultResumeSourceSchema } from "./resume.validation.js";

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

resumeRouter.post(
  "/me/upload",
  asyncHandler(requireJobSeekerAuth),
  jobSeekerResumeUpload,
  asyncHandler(resumeController.uploadOwn),
);

resumeRouter.delete(
  "/me/uploaded",
  asyncHandler(requireJobSeekerAuth),
  asyncHandler(resumeController.deleteUploaded),
);

resumeRouter.patch(
  "/me/default-source",
  asyncHandler(requireJobSeekerAuth),
  validate(setDefaultResumeSourceSchema, "body"),
  asyncHandler(resumeController.setDefaultSource),
);

export default resumeRouter;
