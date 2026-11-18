import { Router } from "express";
import {
  requireOperationsAuth,
  requireOperationsPermission,
} from "../../middleware/operations-auth.middleware.js";
import { validate } from "../../middleware/validate.middleware.js";
import { asyncHandler } from "../../utils/async-handler.js";
import { blogImageUpload } from "./blog-upload.middleware.js";
import { blogController } from "./blog.controller.js";
import {
  blogFeatureSchema,
  blogListQuerySchema,
  blogPreviewSchema,
  blogStatusSchema,
  blogWriteSchema,
  categoryWriteSchema,
  idParamsSchema,
  tagWriteSchema,
} from "./blog.validation.js";

export const blogAdminRouter = Router();

blogAdminRouter.use(requireOperationsAuth);

blogAdminRouter.get(
  "/",
  requireOperationsPermission("content", "read"),
  validate(blogListQuerySchema, "query"),
  asyncHandler(blogController.adminList),
);
blogAdminRouter.post(
  "/images",
  requireOperationsPermission("content", "create"),
  blogImageUpload,
  asyncHandler(blogController.uploadImage),
);
blogAdminRouter.post(
  "/preview",
  requireOperationsPermission("content", "read"),
  validate(blogPreviewSchema, "body"),
  asyncHandler(blogController.preview),
);
blogAdminRouter.get(
  "/:id",
  requireOperationsPermission("content", "read"),
  validate(idParamsSchema, "params"),
  asyncHandler(blogController.adminGet),
);
blogAdminRouter.post(
  "/",
  requireOperationsPermission("content", "create"),
  validate(blogWriteSchema, "body"),
  asyncHandler(blogController.create),
);
blogAdminRouter.put(
  "/:id",
  requireOperationsPermission("content", "update"),
  validate(idParamsSchema, "params"),
  validate(blogWriteSchema, "body"),
  asyncHandler(blogController.update),
);
blogAdminRouter.delete(
  "/:id",
  requireOperationsPermission("content", "delete"),
  validate(idParamsSchema, "params"),
  asyncHandler(blogController.remove),
);
blogAdminRouter.patch(
  "/:id/status",
  requireOperationsPermission("content", "update"),
  validate(idParamsSchema, "params"),
  validate(blogStatusSchema, "body"),
  asyncHandler(blogController.setStatus),
);
blogAdminRouter.patch(
  "/:id/feature",
  requireOperationsPermission("content", "update"),
  validate(idParamsSchema, "params"),
  validate(blogFeatureSchema, "body"),
  asyncHandler(blogController.setFeatured),
);
blogAdminRouter.post(
  "/:id/preview",
  requireOperationsPermission("content", "read"),
  validate(idParamsSchema, "params"),
  asyncHandler(blogController.adminGet),
);

export const blogCategoryAdminRouter = Router();
blogCategoryAdminRouter.use(requireOperationsAuth);
blogCategoryAdminRouter.get(
  "/",
  requireOperationsPermission("content", "read"),
  asyncHandler(blogController.listCategories),
);
blogCategoryAdminRouter.post(
  "/",
  requireOperationsPermission("content", "create"),
  validate(categoryWriteSchema, "body"),
  asyncHandler(blogController.createCategory),
);
blogCategoryAdminRouter.put(
  "/:id",
  requireOperationsPermission("content", "update"),
  validate(idParamsSchema, "params"),
  validate(categoryWriteSchema, "body"),
  asyncHandler(blogController.updateCategory),
);
blogCategoryAdminRouter.delete(
  "/:id",
  requireOperationsPermission("content", "delete"),
  validate(idParamsSchema, "params"),
  asyncHandler(blogController.deleteCategory),
);

export const blogTagAdminRouter = Router();
blogTagAdminRouter.use(requireOperationsAuth);
blogTagAdminRouter.get(
  "/",
  requireOperationsPermission("content", "read"),
  asyncHandler(blogController.listTags),
);
blogTagAdminRouter.post(
  "/",
  requireOperationsPermission("content", "create"),
  validate(tagWriteSchema, "body"),
  asyncHandler(blogController.createTag),
);
blogTagAdminRouter.put(
  "/:id",
  requireOperationsPermission("content", "update"),
  validate(idParamsSchema, "params"),
  validate(tagWriteSchema, "body"),
  asyncHandler(blogController.updateTag),
);
blogTagAdminRouter.delete(
  "/:id",
  requireOperationsPermission("content", "delete"),
  validate(idParamsSchema, "params"),
  asyncHandler(blogController.deleteTag),
);
