import type { Request, Response } from "express";
import { HTTP_STATUS } from "../../constants/http-status.js";
import { AppError } from "../../middleware/error.middleware.js";
import { storageService } from "../storage/storage.service.js";
import { sendSuccess } from "../../utils/api-response.js";
import { BlogAssetModel } from "./blog-asset.model.js";
import { blogService } from "./blog.service.js";
import type {
  BlogListQuery,
  BlogWriteBody,
  CategoryWriteBody,
  PublicBlogListQuery,
  TagWriteBody,
} from "./blog.validation.js";

function userId(req: Request): string | undefined {
  return req.operationsUserId;
}

export const blogController = {
  async listPublic(req: Request, res: Response) {
    const query = req.query as unknown as PublicBlogListQuery;
    const data = await blogService.listPublic(query);
    sendSuccess(res, HTTP_STATUS.OK, { data });
  },

  async featured(_req: Request, res: Response) {
    const data = await blogService.featured();
    sendSuccess(res, HTTP_STATUS.OK, { data });
  },

  async categories(_req: Request, res: Response) {
    const data = await blogService.categoriesPublic();
    sendSuccess(res, HTTP_STATUS.OK, { data });
  },

  async byCategory(req: Request, res: Response) {
    const slug = String(req.params.slug ?? "");
    const limit = Math.min(12, Math.max(1, Number(req.query.limit) || 3));
    const data = await blogService.byCategory(slug, limit);
    sendSuccess(res, HTTP_STATUS.OK, { data });
  },

  async bySlug(req: Request, res: Response) {
    const data = await blogService.bySlug(String(req.params.slug ?? ""));
    sendSuccess(res, HTTP_STATUS.OK, { data });
  },

  async related(req: Request, res: Response) {
    const data = await blogService.related(String(req.params.slug ?? ""));
    sendSuccess(res, HTTP_STATUS.OK, { data });
  },

  async sitemap(_req: Request, res: Response) {
    const data = await blogService.sitemapEntries();
    sendSuccess(res, HTTP_STATUS.OK, { data });
  },

  async adminList(req: Request, res: Response) {
    const query = req.query as unknown as BlogListQuery;
    const data = await blogService.adminList(query);
    sendSuccess(res, HTTP_STATUS.OK, { data });
  },

  async adminGet(req: Request, res: Response) {
    const data = await blogService.adminGet(String(req.params.id));
    sendSuccess(res, HTTP_STATUS.OK, { data });
  },

  async create(req: Request, res: Response) {
    const data = await blogService.create(req.body as BlogWriteBody, userId(req));
    sendSuccess(res, HTTP_STATUS.CREATED, { message: "Blog saved.", data });
  },

  async update(req: Request, res: Response) {
    const data = await blogService.update(
      String(req.params.id),
      req.body as BlogWriteBody,
      userId(req),
    );
    sendSuccess(res, HTTP_STATUS.OK, { message: "Blog updated.", data });
  },

  async remove(req: Request, res: Response) {
    await blogService.remove(String(req.params.id));
    sendSuccess(res, HTTP_STATUS.OK, { message: "Blog deleted.", data: null });
  },

  async setStatus(req: Request, res: Response) {
    const body = req.body as { status: "draft" | "published" | "scheduled"; scheduledAt?: string | null };
    const data = await blogService.setStatus(
      String(req.params.id),
      body.status,
      body.scheduledAt,
      userId(req),
    );
    sendSuccess(res, HTTP_STATUS.OK, { message: "Blog status updated.", data });
  },

  async setFeatured(req: Request, res: Response) {
    const body = req.body as { isFeatured: boolean };
    const data = await blogService.setFeatured(
      String(req.params.id),
      body.isFeatured,
      userId(req),
    );
    sendSuccess(res, HTTP_STATUS.OK, { data });
  },

  async preview(req: Request, res: Response) {
    const data = blogService.preview(req.body as Partial<BlogWriteBody>);
    sendSuccess(res, HTTP_STATUS.OK, { data });
  },

  async listCategories(_req: Request, res: Response) {
    const data = await blogService.listCategories();
    sendSuccess(res, HTTP_STATUS.OK, { data });
  },

  async createCategory(req: Request, res: Response) {
    const data = await blogService.createCategory(req.body as CategoryWriteBody);
    sendSuccess(res, HTTP_STATUS.CREATED, { message: "Category created.", data });
  },

  async updateCategory(req: Request, res: Response) {
    const data = await blogService.updateCategory(String(req.params.id), req.body as CategoryWriteBody);
    sendSuccess(res, HTTP_STATUS.OK, { message: "Category updated.", data });
  },

  async deleteCategory(req: Request, res: Response) {
    await blogService.deleteCategory(String(req.params.id));
    sendSuccess(res, HTTP_STATUS.OK, { message: "Category deleted.", data: null });
  },

  async listTags(_req: Request, res: Response) {
    const data = await blogService.listTags();
    sendSuccess(res, HTTP_STATUS.OK, { data });
  },

  async createTag(req: Request, res: Response) {
    const data = await blogService.createTag(req.body as TagWriteBody);
    sendSuccess(res, HTTP_STATUS.CREATED, { message: "Tag created.", data });
  },

  async updateTag(req: Request, res: Response) {
    const data = await blogService.updateTag(String(req.params.id), req.body as TagWriteBody);
    sendSuccess(res, HTTP_STATUS.OK, { message: "Tag updated.", data });
  },

  async deleteTag(req: Request, res: Response) {
    await blogService.deleteTag(String(req.params.id));
    sendSuccess(res, HTTP_STATUS.OK, { message: "Tag deleted.", data: null });
  },

  async uploadImage(req: Request, res: Response) {
    const file = req.file;
    if (!file) {
      throw new AppError("Choose an image to upload.", HTTP_STATUS.BAD_REQUEST);
    }
    const purpose = String(req.query.purpose ?? "inline");
    const stored = await storageService.upload({
      buffer: file.buffer,
      originalName: file.originalname,
      mimeType: file.mimetype,
      folder: `blogs/${purpose}`,
      fileBaseName: purpose,
    });
    const url = stored.url || storageService.getPublicUrl(stored);
    await BlogAssetModel.create({
      url,
      storagePath: stored.storagePath,
      storageProvider: stored.storageProvider,
      publicId: stored.publicId ?? "",
      purpose,
      createdBy: userId(req) || null,
    });
    sendSuccess(res, HTTP_STATUS.CREATED, {
      data: {
        url,
        storagePath: stored.storagePath,
        storageProvider: stored.storageProvider,
        publicId: stored.publicId ?? "",
        alt: "",
      },
    });
  },
};
