import { Router } from "express";
import { requireOperationsAuth } from "../../../middleware/operations-auth.middleware.js";
import { validate } from "../../../middleware/validate.middleware.js";
import { asyncHandler } from "../../../utils/async-handler.js";
import { operationsJobsController } from "./operations-jobs.controller.js";
import { listOperationsJobsQuerySchema } from "./operations-jobs.validation.js";

export const operationsJobsRouter = Router();

operationsJobsRouter.use(asyncHandler(requireOperationsAuth));

operationsJobsRouter.get(
  "/",
  validate(listOperationsJobsQuerySchema, "query"),
  asyncHandler(operationsJobsController.list),
);

export default operationsJobsRouter;
