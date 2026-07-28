import { Router } from "express";
import { requireEmployerAuth } from "../../middleware/auth.middleware.js";
import { requireJobSeekerAuth } from "../../middleware/job-seeker-auth.middleware.js";
import { validate } from "../../middleware/validate.middleware.js";
import { asyncHandler } from "../../utils/async-handler.js";
import { applicationController } from "./application.controller.js";
import {
  applicationIdParamsSchema,
  applyToJobSchema,
  cancelApplicationInterviewSchema,
  employerLocationSuggestionsQuerySchema,
  listEmployerApplicationStatsQuerySchema,
  listEmployerApplicationsQuerySchema,
  listEmployerInterviewStatsQuerySchema,
  listEmployerInterviewsQuerySchema,
  listSeekerApplicationsQuerySchema,
  updateApplicationHiringSchema,
  updateApplicationInterviewSchema,
  updateApplicationNotesSchema,
  updateApplicationStatusSchema,
} from "./application.validation.js";
import { employerExportBodySchema } from "./employer-export.validation.js";
import { resumeAccessTokenParamsSchema } from "./employer-resume-access.validation.js";

const applicationRouter = Router();

applicationRouter.post(
  "/apply",
  asyncHandler(requireJobSeekerAuth),
  validate(applyToJobSchema, "body"),
  asyncHandler(applicationController.apply),
);

applicationRouter.get(
  "/me/stats",
  asyncHandler(requireJobSeekerAuth),
  asyncHandler(applicationController.getStatsForSeeker),
);

applicationRouter.get(
  "/me",
  asyncHandler(requireJobSeekerAuth),
  validate(listSeekerApplicationsQuerySchema, "query"),
  asyncHandler(applicationController.listForSeeker),
);

applicationRouter.get(
  "/me/:applicationId",
  asyncHandler(requireJobSeekerAuth),
  validate(applicationIdParamsSchema, "params"),
  asyncHandler(applicationController.getForSeeker),
);

applicationRouter.post(
  "/me/:applicationId/withdraw",
  asyncHandler(requireJobSeekerAuth),
  validate(applicationIdParamsSchema, "params"),
  asyncHandler(applicationController.withdrawForSeeker),
);

applicationRouter.get(
  "/employer/stats",
  asyncHandler(requireEmployerAuth),
  validate(listEmployerApplicationStatsQuerySchema, "query"),
  asyncHandler(applicationController.getStatsForEmployer),
);

applicationRouter.post(
  "/employer/export/preview",
  asyncHandler(requireEmployerAuth),
  validate(employerExportBodySchema, "body"),
  asyncHandler(applicationController.previewExportForEmployer),
);

applicationRouter.post(
  "/employer/export",
  asyncHandler(requireEmployerAuth),
  validate(employerExportBodySchema, "body"),
  asyncHandler(applicationController.exportForEmployer),
);

applicationRouter.get(
  "/employer/resume-access/:token/pdf",
  validate(resumeAccessTokenParamsSchema, "params"),
  asyncHandler(applicationController.openResumePdfFromAccessToken),
);

applicationRouter.get(
  "/employer/location-suggestions",
  asyncHandler(requireEmployerAuth),
  validate(employerLocationSuggestionsQuerySchema, "query"),
  asyncHandler(applicationController.suggestLocationsForEmployer),
);

applicationRouter.get(
  "/employer/interviews/stats",
  asyncHandler(requireEmployerAuth),
  validate(listEmployerInterviewStatsQuerySchema, "query"),
  asyncHandler(applicationController.getInterviewStatsForEmployer),
);

applicationRouter.get(
  "/employer/interviews",
  asyncHandler(requireEmployerAuth),
  validate(listEmployerInterviewsQuerySchema, "query"),
  asyncHandler(applicationController.listInterviewsForEmployer),
);

applicationRouter.get(
  "/employer",
  asyncHandler(requireEmployerAuth),
  validate(listEmployerApplicationsQuerySchema, "query"),
  asyncHandler(applicationController.listForEmployer),
);

applicationRouter.get(
  "/employer/:applicationId",
  asyncHandler(requireEmployerAuth),
  validate(applicationIdParamsSchema, "params"),
  asyncHandler(applicationController.getForEmployer),
);

applicationRouter.get(
  "/employer/:applicationId/pdf",
  asyncHandler(requireEmployerAuth),
  validate(applicationIdParamsSchema, "params"),
  asyncHandler(applicationController.downloadPdfForEmployer),
);

applicationRouter.patch(
  "/employer/:applicationId/status",
  asyncHandler(requireEmployerAuth),
  validate(applicationIdParamsSchema, "params"),
  validate(updateApplicationStatusSchema, "body"),
  asyncHandler(applicationController.updateStatusForEmployer),
);

applicationRouter.patch(
  "/employer/:applicationId/notes",
  asyncHandler(requireEmployerAuth),
  validate(applicationIdParamsSchema, "params"),
  validate(updateApplicationNotesSchema, "body"),
  asyncHandler(applicationController.updateNotesForEmployer),
);

applicationRouter.patch(
  "/employer/:applicationId/interview",
  asyncHandler(requireEmployerAuth),
  validate(applicationIdParamsSchema, "params"),
  validate(updateApplicationInterviewSchema, "body"),
  asyncHandler(applicationController.updateInterviewForEmployer),
);

applicationRouter.patch(
  "/employer/:applicationId/interview/cancel",
  asyncHandler(requireEmployerAuth),
  validate(applicationIdParamsSchema, "params"),
  validate(cancelApplicationInterviewSchema, "body"),
  asyncHandler(applicationController.cancelInterviewForEmployer),
);

applicationRouter.patch(
  "/employer/:applicationId/hiring",
  asyncHandler(requireEmployerAuth),
  validate(applicationIdParamsSchema, "params"),
  validate(updateApplicationHiringSchema, "body"),
  asyncHandler(applicationController.updateHiringForEmployer),
);

export default applicationRouter;
