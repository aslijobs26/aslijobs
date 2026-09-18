import { Router } from "express";
import { requireOperationsAuth } from "../../../middleware/operations-auth.middleware.js";
import { validate } from "../../../middleware/validate.middleware.js";
import { asyncHandler } from "../../../utils/async-handler.js";
import { operationsOrganizationController } from "./operations-organization.controller.js";
import { updateOrganizationSettingsBodySchema } from "./operations-organization.validation.js";

export const operationsSettingsRouter = Router();

operationsSettingsRouter.use(asyncHandler(requireOperationsAuth));

operationsSettingsRouter.get(
  "/",
  asyncHandler(operationsOrganizationController.getSettings),
);

operationsSettingsRouter.patch(
  "/",
  validate(updateOrganizationSettingsBodySchema, "body"),
  asyncHandler(operationsOrganizationController.updateSettings),
);

export default operationsSettingsRouter;
