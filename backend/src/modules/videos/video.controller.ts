import type { Request, Response } from "express";
import { HTTP_STATUS } from "../../constants/http-status.js";
import { AppError } from "../../middleware/error.middleware.js";
import { storageService } from "../storage/storage.service.js";
import { toPublicMediaUrl } from "../storage/public-media-url.js";
import { sendSuccess } from "../../utils/api-response.js";
import { videoService } from "./video.service.js";
import { extractYouTubeVideoId } from "./youtube-url.js";

function userId(req: Request): string | undefined {
  return req.operationsUserId;
}

export const videoController = {
  async list(req: Request, res: Response) {
    const data = await videoService.list(req.query as any);
    sendSuccess(res, HTTP_STATUS.OK, { data });
  },
  async get(req: Request, res: Response) {
    const data = await videoService.get(String(req.params.id));
    sendSuccess(res, HTTP_STATUS.OK, { data });
  },
  async create(req: Request, res: Response) {
    const data = await videoService.create(req.body, userId(req));
    sendSuccess(res, HTTP_STATUS.CREATED, { message: "Video saved.", data });
  },
  async update(req: Request, res: Response) {
    const data = await videoService.update(String(req.params.id), req.body, userId(req));
    sendSuccess(res, HTTP_STATUS.OK, { message: "Video updated.", data });
  },
  async remove(req: Request, res: Response) {
    await videoService.remove(String(req.params.id));
    sendSuccess(res, HTTP_STATUS.OK, { message: "Video deleted.", data: null });
  },
  async setStatus(req: Request, res: Response) {
    const data = await videoService.setStatus(String(req.params.id), req.body.status, userId(req));
    sendSuccess(res, HTTP_STATUS.OK, { message: "Video status updated.", data });
  },
  async setFeatured(req: Request, res: Response) {
    const data = await videoService.setFeatured(String(req.params.id), req.body.isFeatured, userId(req));
    sendSuccess(res, HTTP_STATUS.OK, { data });
  },
  async setOrder(req: Request, res: Response) {
    const data = await videoService.setOrder(String(req.params.id), req.body.displayOrder, userId(req));
    sendSuccess(res, HTTP_STATUS.OK, { data });
  },
  async upload(req: Request, res: Response) {
    const file = req.file;
    if (!file) throw new AppError("Choose a video to upload.", HTTP_STATUS.BAD_REQUEST);
    const stored = await storageService.upload({
      buffer: file.buffer,
      originalName: file.originalname,
      mimeType: file.mimetype,
      folder: "videos",
      fileBaseName: "video",
    });
    sendSuccess(res, HTTP_STATUS.CREATED, {
      data: {
        url: toPublicMediaUrl(stored.url || storageService.getPublicUrl(stored)),
        storagePath: stored.storagePath,
        storageProvider: stored.storageProvider,
        publicId: stored.publicId || "",
        mimeType: stored.mimeType,
        fileSize: stored.fileSize,
      },
    });
  },
  async parseYouTube(req: Request, res: Response) {
    const id = extractYouTubeVideoId(String(req.query.url || ""));
    if (!id) throw new AppError("Enter a valid YouTube URL.", HTTP_STATUS.BAD_REQUEST);
    sendSuccess(res, HTTP_STATUS.OK, {
      data: {
        youtubeVideoId: id,
        thumbnailUrl: `https://i.ytimg.com/vi/${id}/hqdefault.jpg`,
      },
    });
  },
  async published(req: Request, res: Response) {
    const limit = Math.min(24, Math.max(1, Number(req.query.limit) || 12));
    const data = await videoService.listPublished(limit);
    sendSuccess(res, HTTP_STATUS.OK, { data });
  },
};
