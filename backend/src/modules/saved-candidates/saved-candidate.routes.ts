import { Router } from "express";
import { requireEmployerAuth } from "../../middleware/auth.middleware.js";
import { requirePermission } from "../../middleware/permission.middleware.js";
import { validate } from "../../middleware/validate.middleware.js";
import { asyncHandler } from "../../utils/async-handler.js";
import { savedCandidateController } from "./saved-candidate.controller.js";
import { savedCandidateExportBodySchema } from "./saved-candidate-export.validation.js";
import {
  listSavedCandidatesQuerySchema,
  saveCandidateBodySchema,
  savedCandidateApplicationIdParamsSchema,
  savedCandidateIdParamsSchema,
  updateSavedCandidateBodySchema,
} from "./saved-candidate.validation.js";

const savedCandidateRouter = Router();

savedCandidateRouter.get(
  "/stats",
  asyncHandler(requireEmployerAuth),
  asyncHandler(requirePermission("candidates", "read")),
  asyncHandler(savedCandidateController.getStats),
);

savedCandidateRouter.get(
  "/ids",
  asyncHandler(requireEmployerAuth),
  asyncHandler(requirePermission("candidates", "read")),
  asyncHandler(savedCandidateController.listIds),
);

savedCandidateRouter.post(
  "/export/preview",
  asyncHandler(requireEmployerAuth),
  asyncHandler(requirePermission("candidates", "export")),
  validate(savedCandidateExportBodySchema, "body"),
  asyncHandler(savedCandidateController.previewExport),
);

savedCandidateRouter.post(
  "/export",
  asyncHandler(requireEmployerAuth),
  asyncHandler(requirePermission("candidates", "export")),
  validate(savedCandidateExportBodySchema, "body"),
  asyncHandler(savedCandidateController.export),
);

savedCandidateRouter.get(
  "/",
  asyncHandler(requireEmployerAuth),
  asyncHandler(requirePermission("candidates", "read")),
  validate(listSavedCandidatesQuerySchema, "query"),
  asyncHandler(savedCandidateController.list),
);

savedCandidateRouter.post(
  "/",
  asyncHandler(requireEmployerAuth),
  asyncHandler(requirePermission("candidates", "update")),
  validate(saveCandidateBodySchema, "body"),
  asyncHandler(savedCandidateController.save),
);

savedCandidateRouter.patch(
  "/:savedCandidateId",
  asyncHandler(requireEmployerAuth),
  asyncHandler(requirePermission("candidates", "update")),
  validate(savedCandidateIdParamsSchema, "params"),
  validate(updateSavedCandidateBodySchema, "body"),
  asyncHandler(savedCandidateController.update),
);

savedCandidateRouter.delete(
  "/by-application/:applicationId",
  asyncHandler(requireEmployerAuth),
  asyncHandler(requirePermission("candidates", "update")),
  validate(savedCandidateApplicationIdParamsSchema, "params"),
  asyncHandler(savedCandidateController.removeByApplication),
);

savedCandidateRouter.delete(
  "/:savedCandidateId",
  asyncHandler(requireEmployerAuth),
  asyncHandler(requirePermission("candidates", "update")),
  validate(savedCandidateIdParamsSchema, "params"),
  asyncHandler(savedCandidateController.remove),
);

export default savedCandidateRouter;
