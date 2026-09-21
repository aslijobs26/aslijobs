import { Router } from "express";
import {
  requireOperationsAuth,
  requireOperationsPermission,
} from "../../../middleware/operations-auth.middleware.js";
import { validate } from "../../../middleware/validate.middleware.js";
import { asyncHandler } from "../../../utils/async-handler.js";
import { operationsDepartmentsController } from "./operations-departments.controller.js";
import {
  createOperationsDepartmentBodySchema,
  listOperationsDepartmentsQuerySchema,
  operationsDepartmentIdParamsSchema,
  archiveOperationsDepartmentBodySchema,
  updateOperationsDepartmentBodySchema,
} from "./operations-departments.validation.js";

export const operationsDepartmentsRouter = Router();

operationsDepartmentsRouter.use(asyncHandler(requireOperationsAuth));

operationsDepartmentsRouter.get(
  "/",
  requireOperationsPermission("departments", "read"),
  validate(listOperationsDepartmentsQuerySchema, "query"),
  asyncHandler(operationsDepartmentsController.list),
);

operationsDepartmentsRouter.get(
  "/metrics",
  requireOperationsPermission("departments", "read"),
  asyncHandler(operationsDepartmentsController.metrics),
);

operationsDepartmentsRouter.post(
  "/",
  requireOperationsPermission("departments", "create"),
  validate(createOperationsDepartmentBodySchema, "body"),
  asyncHandler(operationsDepartmentsController.create),
);

operationsDepartmentsRouter.get(
  "/:departmentId/dependencies",
  requireOperationsPermission("departments", "read"),
  validate(operationsDepartmentIdParamsSchema, "params"),
  asyncHandler(operationsDepartmentsController.getDependencies),
);

operationsDepartmentsRouter.get(
  "/:departmentId",
  requireOperationsPermission("departments", "read"),
  validate(operationsDepartmentIdParamsSchema, "params"),
  asyncHandler(operationsDepartmentsController.getById),
);

operationsDepartmentsRouter.patch(
  "/:departmentId",
  requireOperationsPermission("departments", "update"),
  validate(operationsDepartmentIdParamsSchema, "params"),
  validate(updateOperationsDepartmentBodySchema, "body"),
  asyncHandler(operationsDepartmentsController.update),
);

/** Soft-delete (archive) with authoritative dependency checks. */
operationsDepartmentsRouter.delete(
  "/:departmentId",
  requireOperationsPermission("departments", "delete"),
  validate(operationsDepartmentIdParamsSchema, "params"),
  validate(archiveOperationsDepartmentBodySchema, "body"),
  asyncHandler(operationsDepartmentsController.remove),
);

export default operationsDepartmentsRouter;
