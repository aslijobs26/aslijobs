import { Router } from "express";
import { validate } from "../../middleware/validate.middleware.js";
import { asyncHandler } from "../../utils/async-handler.js";
import { blogController } from "./blog.controller.js";
import { publicBlogListQuerySchema, slugParamsSchema } from "./blog.validation.js";

const blogPublicRouter = Router();

blogPublicRouter.get(
  "/featured",
  asyncHandler(blogController.featured),
);
blogPublicRouter.get(
  "/categories",
  asyncHandler(blogController.categories),
);
blogPublicRouter.get(
  "/sitemap",
  asyncHandler(blogController.sitemap),
);
blogPublicRouter.get(
  "/category/:slug",
  validate(slugParamsSchema, "params"),
  asyncHandler(blogController.byCategory),
);
blogPublicRouter.get(
  "/",
  validate(publicBlogListQuerySchema, "query"),
  asyncHandler(blogController.listPublic),
);
blogPublicRouter.get(
  "/:slug/related",
  validate(slugParamsSchema, "params"),
  asyncHandler(blogController.related),
);
blogPublicRouter.get(
  "/:slug",
  validate(slugParamsSchema, "params"),
  asyncHandler(blogController.bySlug),
);

export default blogPublicRouter;
