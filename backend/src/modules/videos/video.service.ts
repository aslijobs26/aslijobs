import { Types, type FilterQuery } from "mongoose";
import { HTTP_STATUS } from "../../constants/http-status.js";
import { AppError } from "../../middleware/error.middleware.js";
import { storageService } from "../storage/storage.service.js";
import { toPublicMediaUrl } from "../storage/public-media-url.js";
import { BlogModel } from "../blogs/blog.model.js";
import { publishDueBlogs } from "../blogs/blog.service.js";
import { VideoModel } from "./video.model.js";
import { extractYouTubeVideoId } from "./youtube-url.js";
import type { videoWriteSchema } from "./video.validation.js";
import type { z } from "zod";

type VideoWrite = z.infer<typeof videoWriteSchema>;

function mediaUrl(value: string | undefined): string {
  return toPublicMediaUrl(value);
}

function thumbnailUrl(
  source: string,
  value: string | undefined,
  youtubeVideoId: string,
  uploadedVideoUrl: string | undefined,
): string {
  if (source === "youtube") {
    return value || (youtubeVideoId ? `https://i.ytimg.com/vi/${youtubeVideoId}/hqdefault.jpg` : "");
  }

  const thumbnail = mediaUrl(value);
  return thumbnail && thumbnail !== mediaUrl(uploadedVideoUrl) ? thumbnail : "";
}

function output(row: any) {
  const uploaded = row.uploadedVideo;
  return {
    id: String(row._id),
    title: row.title,
    description: row.description || "",
    source: row.source,
    youtubeUrl: row.youtubeUrl || "",
    youtubeVideoId: row.youtubeVideoId || "",
    thumbnailUrl: thumbnailUrl(row.source, row.thumbnailUrl, row.youtubeVideoId || "", uploaded?.url),
    uploadedVideo: uploaded
      ? {
          ...uploaded,
          url: mediaUrl(uploaded.url),
        }
      : null,
    category: row.category || "",
    status: row.status,
    isFeatured: Boolean(row.isFeatured),
    displayOrder: row.displayOrder ?? 0,
    publishedAt: row.publishedAt ? new Date(row.publishedAt).toISOString() : null,
    createdAt: row.createdAt ? new Date(row.createdAt).toISOString() : null,
    updatedAt: row.updatedAt ? new Date(row.updatedAt).toISOString() : null,
  };
}

export function aggregatePublishedVideos(
  standaloneRows: any[],
  blogRows: any[],
  limit: number,
) {
  const items: any[] = [];
  for (const row of standaloneRows) items.push(output(row));
  for (const blog of blogRows) {
    const video = blog.associatedVideo;
    if (!video) continue;
    items.push({
      id: `blog-${String(blog._id)}`,
      title: video.title || blog.title,
      description: video.description || blog.excerpt,
      source: video.source,
      youtubeUrl: video.youtubeUrl || "",
      youtubeVideoId: video.youtubeVideoId || "",
      thumbnailUrl: thumbnailUrl(
        video.source,
        video.thumbnailUrl,
        video.youtubeVideoId || "",
        video.videoFile?.url,
      ),
      uploadedVideo: video.videoFile
        ? { ...video.videoFile, url: mediaUrl(video.videoFile.url) }
        : null,
      category: "",
      status: "published",
      isFeatured: Boolean(blog.isFeatured),
      displayOrder: 0,
      publishedAt: blog.publishedAt ? new Date(blog.publishedAt).toISOString() : null,
      createdAt: blog.createdAt ? new Date(blog.createdAt).toISOString() : null,
      updatedAt: blog.updatedAt ? new Date(blog.updatedAt).toISOString() : null,
      blogId: String(blog._id),
    });
  }

  const seen = new Set<string>();
  const unique = items.filter((item) => {
    const key = item.source === "youtube"
      ? `youtube:${item.youtubeVideoId}`
      : `uploaded:${item.uploadedVideo?.url || item.uploadedVideo?.storagePath || item.id}`;
    if (!item.youtubeVideoId && item.source === "youtube") return false;
    if (item.source === "uploaded" && !item.uploadedVideo?.url) return false;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
  unique.sort((a, b) => {
    if (a.displayOrder !== b.displayOrder) return a.displayOrder - b.displayOrder;
    return (b.publishedAt || "").localeCompare(a.publishedAt || "");
  });
  return unique.slice(0, limit);
}

export const videoService = {
  async list(query: { page: number; limit: number; q: string; status: string; source: string }) {
    const filter: FilterQuery<unknown> = {};
    if (query.q) filter.title = { $regex: query.q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), $options: "i" };
    if (query.status) filter.status = query.status;
    if (query.source) filter.source = query.source;
    const [total, rows] = await Promise.all([
      VideoModel.countDocuments(filter),
      VideoModel.find(filter)
        .sort({ displayOrder: 1, createdAt: -1 })
        .skip((query.page - 1) * query.limit)
        .limit(query.limit)
        .lean(),
    ]);
    return {
      items: rows.map(output),
      pagination: {
        page: query.page,
        limit: query.limit,
        total,
        totalPages: Math.ceil(total / query.limit),
      },
    };
  },

  async get(id: string) {
    const row = await VideoModel.findById(id).lean();
    if (!row) throw new AppError("Video not found.", HTTP_STATUS.NOT_FOUND);
    return output(row);
  },

  async create(body: VideoWrite, userId: string | undefined) {
    const youtubeVideoId = body.source === "youtube" ? extractYouTubeVideoId(body.youtubeUrl || body.youtubeVideoId) : "";
    if (body.source === "youtube" && !youtubeVideoId) {
      throw new AppError("Enter a valid YouTube URL.", HTTP_STATUS.BAD_REQUEST);
    }
    const row = await VideoModel.create({
      ...body,
      youtubeVideoId,
      youtubeUrl: body.source === "youtube" ? body.youtubeUrl : "",
      uploadedVideo: body.source === "uploaded" ? body.uploadedVideo : null,
      publishedAt: body.status === "published" ? new Date() : null,
      createdBy: userId ? new Types.ObjectId(userId) : null,
      updatedBy: userId ? new Types.ObjectId(userId) : null,
    });
    return this.get(String(row._id));
  },

  async update(id: string, body: VideoWrite, userId: string | undefined) {
    const row = await VideoModel.findById(id);
    if (!row) throw new AppError("Video not found.", HTTP_STATUS.NOT_FOUND);
    const youtubeVideoId = body.source === "youtube" ? extractYouTubeVideoId(body.youtubeUrl || body.youtubeVideoId) : "";
    if (body.source === "youtube" && !youtubeVideoId) {
      throw new AppError("Enter a valid YouTube URL.", HTTP_STATUS.BAD_REQUEST);
    }
    row.set({
      ...body,
      youtubeVideoId,
      youtubeUrl: body.source === "youtube" ? body.youtubeUrl : "",
      uploadedVideo: body.source === "uploaded" ? body.uploadedVideo : null,
      publishedAt: body.status === "published" ? (row.publishedAt || new Date()) : null,
      updatedBy: userId ? new Types.ObjectId(userId) : null,
    });
    await row.save();
    return this.get(id);
  },

  async remove(id: string) {
    const row = await VideoModel.findById(id);
    if (!row) throw new AppError("Video not found.", HTTP_STATUS.NOT_FOUND);
    if (row.uploadedVideo?.storagePath) {
      await storageService.delete({
        storagePath: row.uploadedVideo.storagePath,
        storageProvider: row.uploadedVideo.storageProvider,
        publicId: row.uploadedVideo.publicId,
        mimeType: row.uploadedVideo.mimeType,
      }).catch(() => undefined);
    }
    await row.deleteOne();
  },

  async setStatus(id: string, status: "draft" | "published", userId: string | undefined) {
    const row = await VideoModel.findById(id);
    if (!row) throw new AppError("Video not found.", HTTP_STATUS.NOT_FOUND);
    row.status = status;
    row.publishedAt = status === "published" ? (row.publishedAt || new Date()) : null;
    row.updatedBy = userId ? new Types.ObjectId(userId) : null;
    await row.save();
    return this.get(id);
  },

  async setFeatured(id: string, isFeatured: boolean, userId: string | undefined) {
    const row = await VideoModel.findById(id);
    if (!row) throw new AppError("Video not found.", HTTP_STATUS.NOT_FOUND);
    row.isFeatured = isFeatured;
    row.updatedBy = userId ? new Types.ObjectId(userId) : null;
    await row.save();
    return this.get(id);
  },

  async setOrder(id: string, displayOrder: number, userId: string | undefined) {
    const row = await VideoModel.findById(id);
    if (!row) throw new AppError("Video not found.", HTTP_STATUS.NOT_FOUND);
    row.displayOrder = displayOrder;
    row.updatedBy = userId ? new Types.ObjectId(userId) : null;
    await row.save();
    return this.get(id);
  },

  async listPublished(limit = 12) {
    await publishDueBlogs();
    const standalone = await VideoModel.find({
      status: "published",
      publishedAt: { $lte: new Date() },
    }).sort({ displayOrder: 1, publishedAt: -1 }).limit(limit).lean();

    const blogRows = await BlogModel.find({
      status: "published",
      publishedAt: { $lte: new Date() },
      "associatedVideo.source": { $exists: true },
    }).sort({ publishedAt: -1 }).limit(limit).lean();

    return aggregatePublishedVideos(standalone, blogRows as any[], limit);
  },
};
