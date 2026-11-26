import { z } from "zod";
import { extractYouTubeVideoId } from "./youtube-url.js";

const uploadedVideoSchema = z
  .object({
    url: z.string().trim().min(1).max(2000),
    storagePath: z.string().trim().max(500).optional().default(""),
    storageProvider: z.enum(["local", "cloudinary"]).optional().default("local"),
    publicId: z.string().trim().max(300).optional().default(""),
    mimeType: z.string().trim().max(100).optional().default(""),
    fileSize: z.number().int().min(0).optional().default(0),
  })
  .nullable()
  .optional();

export const videoWriteSchema = z
  .object({
    title: z.string().trim().min(1, "Video title is required.").max(180),
    description: z.string().trim().max(400).optional().default(""),
    source: z.enum(["youtube", "uploaded"]),
    youtubeUrl: z.string().trim().max(2000).optional().default(""),
    youtubeVideoId: z.string().trim().max(20).optional().default(""),
    thumbnailUrl: z.string().trim().max(2000).optional().default(""),
    uploadedVideo: uploadedVideoSchema,
    category: z.string().trim().max(80).optional().default(""),
    status: z.enum(["draft", "published"]).optional().default("draft"),
    isFeatured: z.boolean().optional().default(false),
    displayOrder: z.coerce.number().int().min(0).max(9999).optional().default(0),
  })
  .superRefine((value, ctx) => {
    if (
      value.source === "youtube" &&
      !extractYouTubeVideoId(value.youtubeUrl || value.youtubeVideoId)
    ) {
      ctx.addIssue({ code: "custom", path: ["youtubeUrl"], message: "Enter a valid YouTube URL." });
    }
    if (value.source === "uploaded" && !value.uploadedVideo?.url) {
      ctx.addIssue({ code: "custom", path: ["uploadedVideo"], message: "Upload a video file." });
    }
  });

export const videoListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(50).optional().default(12),
  q: z.string().trim().max(120).optional().default(""),
  status: z.enum(["", "draft", "published"]).optional().default(""),
  source: z.enum(["", "youtube", "uploaded"]).optional().default(""),
});

export const videoIdParamsSchema = z.object({
  id: z.string().trim().regex(/^[a-f\d]{24}$/i, "Invalid id."),
});

export const videoStatusSchema = z.object({
  status: z.enum(["draft", "published"]),
});

export const videoFeatureSchema = z.object({ isFeatured: z.boolean() });

export const videoOrderSchema = z.object({
  displayOrder: z.coerce.number().int().min(0).max(9999),
});
