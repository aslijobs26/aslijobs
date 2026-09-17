import { Router } from "express";
import {
  requireOperationsAuth,
  requireOperationsPermission,
} from "../../../middleware/operations-auth.middleware.js";
import { validate } from "../../../middleware/validate.middleware.js";
import { asyncHandler } from "../../../utils/async-handler.js";
import { operationsOrganizationController } from "./operations-organization.controller.js";
import {
  createOrgUnitBodySchema,
  listOrgTreeQuerySchema,
  orgUnitIdParamsSchema,
  orgUnitPeopleQuerySchema,
  updateOrgUnitBodySchema,
} from "./operations-organization.validation.js";

export const operationsOrganizationRouter = Router();

operationsOrganizationRouter.use(asyncHandler(requireOperationsAuth));

operationsOrganizationRouter.get(
  "/tree",
  requireOperationsPermission("team", "read"),
  validate(listOrgTreeQuerySchema, "query"),
  asyncHandler(operationsOrganizationController.tree),
);

operationsOrganizationRouter.post(
  "/",
  requireOperationsPermission("team", "create"),
  validate(createOrgUnitBodySchema, "body"),
  asyncHandler(operationsOrganizationController.create),
);

operationsOrganizationRouter.get(
  "/:unitId",
  requireOperationsPermission("team", "read"),
  validate(orgUnitIdParamsSchema, "params"),
  asyncHandler(operationsOrganizationController.getUnit),
);

operationsOrganizationRouter.get(
  "/:unitId/overview",
  requireOperationsPermission("team", "read"),
  validate(orgUnitIdParamsSchema, "params"),
  asyncHandler(operationsOrganizationController.overview),
);

operationsOrganizationRouter.get(
  "/:unitId/people",
  requireOperationsPermission("team", "read"),
  validate(orgUnitIdParamsSchema, "params"),
  validate(orgUnitPeopleQuerySchema, "query"),
  asyncHandler(operationsOrganizationController.people),
);

operationsOrganizationRouter.post(
  "/:unitId/sub-units",
  requireOperationsPermission("team", "create"),
  validate(orgUnitIdParamsSchema, "params"),
  validate(createOrgUnitBodySchema, "body"),
  asyncHandler(operationsOrganizationController.createSubUnit),
);

operationsOrganizationRouter.patch(
  "/:unitId",
  requireOperationsPermission("team", "update"),
  validate(orgUnitIdParamsSchema, "params"),
  validate(updateOrgUnitBodySchema, "body"),
  asyncHandler(operationsOrganizationController.update),
);

export default operationsOrganizationRouter;
