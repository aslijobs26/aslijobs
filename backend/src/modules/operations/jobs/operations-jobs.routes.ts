import { Router } from "express";

import {

  requireOperationsAuth,

  requireOperationsJobWriteAccess,

} from "../../../middleware/operations-auth.middleware.js";

import { validate } from "../../../middleware/validate.middleware.js";

import { asyncHandler } from "../../../utils/async-handler.js";

import { operationsJobsController } from "./operations-jobs.controller.js";

import {

  assignOperationsJobEmployerBodySchema,

  listOperationsJobApplicationsQuerySchema,

  listOperationsJobsQuerySchema,

  operationsJobPublicIdParamsSchema,

  publishOperationsJobBodySchema,

  saveOperationsJobDraftBodySchema,

  updateOperationsJobStatusBodySchema,

} from "./operations-jobs.validation.js";



export const operationsJobsRouter = Router();



operationsJobsRouter.use(asyncHandler(requireOperationsAuth));



operationsJobsRouter.get(

  "/",

  validate(listOperationsJobsQuerySchema, "query"),

  asyncHandler(operationsJobsController.list),

);



operationsJobsRouter.post(

  "/draft",

  requireOperationsJobWriteAccess,

  validate(saveOperationsJobDraftBodySchema, "body"),

  asyncHandler(operationsJobsController.createDraft),

);



operationsJobsRouter.get(

  "/:jobId",

  validate(operationsJobPublicIdParamsSchema, "params"),

  asyncHandler(operationsJobsController.getByJobId),

);



operationsJobsRouter.get(

  "/:jobId/applications",

  validate(operationsJobPublicIdParamsSchema, "params"),

  validate(listOperationsJobApplicationsQuerySchema, "query"),

  asyncHandler(operationsJobsController.listApplications),

);



operationsJobsRouter.patch(

  "/:jobId/draft",

  requireOperationsJobWriteAccess,

  validate(operationsJobPublicIdParamsSchema, "params"),

  validate(saveOperationsJobDraftBodySchema, "body"),

  asyncHandler(operationsJobsController.updateDraft),

);



operationsJobsRouter.put(

  "/:jobId/assign-employer",

  requireOperationsJobWriteAccess,

  validate(operationsJobPublicIdParamsSchema, "params"),

  validate(assignOperationsJobEmployerBodySchema, "body"),

  asyncHandler(operationsJobsController.assignEmployer),

);



operationsJobsRouter.put(

  "/:jobId/publish",

  requireOperationsJobWriteAccess,

  validate(operationsJobPublicIdParamsSchema, "params"),

  validate(publishOperationsJobBodySchema, "body"),

  asyncHandler(operationsJobsController.publishDraft),

);



operationsJobsRouter.patch(

  "/:jobId/status",

  requireOperationsJobWriteAccess,

  validate(operationsJobPublicIdParamsSchema, "params"),

  validate(updateOperationsJobStatusBodySchema, "body"),

  asyncHandler(operationsJobsController.updateStatus),

);



export default operationsJobsRouter;

