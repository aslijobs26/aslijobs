import { Router } from "express";
import {
  requireOperationsAuth,
  requireOperationsJobWriteAccess,
} from "../../../middleware/operations-auth.middleware.js";
import { validate } from "../../../middleware/validate.middleware.js";
import { asyncHandler } from "../../../utils/async-handler.js";
import { operationsEmployersController } from "./operations-employers.controller.js";
import {
  listOperationsEmployersQuerySchema,
  operationsEmployerIdParamsSchema,
} from "./operations-employers.validation.js";

export const operationsEmployersRouter = Router();

operationsEmployersRouter.use(asyncHandler(requireOperationsAuth));
operationsEmployersRouter.use(requireOperationsJobWriteAccess);

operationsEmployersRouter.get(
  "/",
  validate(listOperationsEmployersQuerySchema, "query"),
  asyncHandler(operationsEmployersController.list),
);

operationsEmployersRouter.get(
  "/:employerId",
  validate(operationsEmployerIdParamsSchema, "params"),
  asyncHandler(operationsEmployersController.getById),
);

export default operationsEmployersRouter;
