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

operationsDepartmentsRouter.post(
  "/",
  requireOperationsPermission("departments", "create"),
  validate(createOperationsDepartmentBodySchema, "body"),
  asyncHandler(operationsDepartmentsController.create),
);

operationsDepartmentsRouter.patch(
  "/:departmentId",
  requireOperationsPermission("departments", "update"),
  validate(operationsDepartmentIdParamsSchema, "params"),
  validate(updateOperationsDepartmentBodySchema, "body"),
  asyncHandler(operationsDepartmentsController.update),
);

export default operationsDepartmentsRouter;
