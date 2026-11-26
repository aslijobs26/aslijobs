import { Router } from "express";
import { validate } from "../../middleware/validate.middleware.js";
import { requireOperationsAuth, requireOperationsPermission } from "../../middleware/operations-auth.middleware.js";
import { asyncHandler } from "../../utils/async-handler.js";
import { videoUpload } from "./video-upload.middleware.js";
import { videoController } from "./video.controller.js";
import {
  videoFeatureSchema,
  videoIdParamsSchema,
  videoListQuerySchema,
  videoOrderSchema,
  videoStatusSchema,
  videoWriteSchema,
} from "./video.validation.js";

export const videoAdminRouter = Router();
videoAdminRouter.use(requireOperationsAuth);

videoAdminRouter.get("/", requireOperationsPermission("content", "read"), validate(videoListQuerySchema, "query"), asyncHandler(videoController.list));
videoAdminRouter.get("/youtube/parse", requireOperationsPermission("content", "read"), asyncHandler(videoController.parseYouTube));
videoAdminRouter.post("/upload", requireOperationsPermission("content", "create"), videoUpload, asyncHandler(videoController.upload));
videoAdminRouter.get("/:id", requireOperationsPermission("content", "read"), validate(videoIdParamsSchema, "params"), asyncHandler(videoController.get));
videoAdminRouter.post("/", requireOperationsPermission("content", "create"), validate(videoWriteSchema, "body"), asyncHandler(videoController.create));
videoAdminRouter.put("/:id", requireOperationsPermission("content", "update"), validate(videoIdParamsSchema, "params"), validate(videoWriteSchema, "body"), asyncHandler(videoController.update));
videoAdminRouter.delete("/:id", requireOperationsPermission("content", "delete"), validate(videoIdParamsSchema, "params"), asyncHandler(videoController.remove));
videoAdminRouter.patch("/:id/status", requireOperationsPermission("content", "update"), validate(videoIdParamsSchema, "params"), validate(videoStatusSchema, "body"), asyncHandler(videoController.setStatus));
videoAdminRouter.patch("/:id/feature", requireOperationsPermission("content", "update"), validate(videoIdParamsSchema, "params"), validate(videoFeatureSchema, "body"), asyncHandler(videoController.setFeatured));
videoAdminRouter.patch("/:id/order", requireOperationsPermission("content", "update"), validate(videoIdParamsSchema, "params"), validate(videoOrderSchema, "body"), asyncHandler(videoController.setOrder));

export const videoPublicRouter = Router();
videoPublicRouter.get("/published", asyncHandler(videoController.published));
