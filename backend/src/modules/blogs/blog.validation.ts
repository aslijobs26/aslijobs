import { z } from "zod";
import { BLOG_IMAGE_PURPOSES, BLOG_STATUSES } from "./blog.constants.js";

const objectId = z.string().trim().regex(/^[a-f\d]{24}$/i, "Invalid id.");

const imageSchema = z.object({
  url: z.string().trim().min(1, "Image is required.").max(2000),
  storagePath: z.string().trim().max(500).optional().default(""),
  storageProvider: z.enum(["local", "cloudinary"]).optional().default("local"),
  publicId: z.string().trim().max(300).optional().default(""),
  alt: z.string().trim().max(180).optional().default(""),
});

const seoSchema = z
  .object({
    title: z.string().trim().max(70).optional().default(""),
    description: z.string().trim().max(180).optional().default(""),
    focusKeyword: z.string().trim().max(80).optional().default(""),
    keywords: z
      .array(z.string().trim().min(1).max(40, "Each keyword must be 40 characters or fewer."))
      .max(12, "Use up to 12 keywords.")
      .optional()
      .default([]),
    canonicalUrl: z.string().trim().max(500).optional().default(""),
    ogTitle: z.string().trim().max(90).optional().default(""),
    ogDescription: z.string().trim().max(200).optional().default(""),
    ogImage: imageSchema.nullable().optional().default(null),
  })
  .optional();

const blogVideoSchema = z
  .object({
    source: z.enum(["youtube", "uploaded"]),
    title: z.string().trim().max(180).optional().default(""),
    description: z.string().trim().max(400).optional().default(""),
    youtubeUrl: z.string().trim().max(2000).optional().default(""),
    youtubeVideoId: z.string().trim().max(20).optional().default(""),
    thumbnailUrl: z.string().trim().max(2000).optional().default(""),
    videoFile: z
      .object({
        url: z.string().trim().max(2000).optional().default(""),
        storagePath: z.string().trim().max(500).optional().default(""),
        storageProvider: z.enum(["local", "cloudinary"]).optional().default("local"),
        publicId: z.string().trim().max(300).optional().default(""),
        mimeType: z.string().trim().max(100).optional().default(""),
        fileSize: z.number().int().min(0).optional().default(0),
      })
      .nullable()
      .optional()
      .default(null),
  })
  .nullable()
  .optional();

export const blogWriteSchema = z
  .object({
    title: z.string().trim().min(1, "Blog title is required.").max(180),
    excerpt: z.string().trim().min(1, "Description is required.").max(400),
    content: z.string().trim().min(1, "Article content is required.").max(200_000),
    coverImage: imageSchema,
    coverImageAlt: z.string().trim().max(180).optional().default(""),
    categoryId: objectId,
    tagIds: z.array(objectId).max(12).optional().default([]),
    authorName: z.string().trim().max(80).optional().default("AsliJobs"),
    authorImage: imageSchema.nullable().optional().default(null),
    seo: seoSchema,
    status: z.enum(BLOG_STATUSES).optional().default("draft"),
    isFeatured: z.boolean().optional().default(false),
    allowIndexing: z.boolean().optional().default(true),
    scheduledAt: z.string().datetime().nullable().optional(),
    faqs: z
      .array(
        z.object({
          question: z.string().trim().min(1, "Question is required.").max(180),
          answer: z.string().trim().min(1, "Answer is required.").max(800),
        }),
      )
      .max(8)
      .optional()
      .default([]),
    relatedBlogIds: z.array(objectId).max(6).optional().default([]),
    associatedVideo: blogVideoSchema,
    slug: z
      .string()
      .trim()
      .max(80)
      .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Use a lowercase slug with hyphens.")
      .optional(),
  })
  .superRefine((value, ctx) => {
    if (value.status === "scheduled" && !value.scheduledAt) {
      ctx.addIssue({
        code: "custom",
        path: ["scheduledAt"],
        message: "Choose a publish date and time.",
      });
    }
    if (value.associatedVideo?.source === "youtube") {
      const url = value.associatedVideo.youtubeUrl;
      if (!/(?:youtube\.com\/(?:watch\?.*v=|embed\/|shorts\/)|youtu\.be\/)/i.test(url)) {
        ctx.addIssue({ code: "custom", path: ["associatedVideo", "youtubeUrl"], message: "Enter a valid YouTube URL." });
      }
    }
    if (value.associatedVideo?.source === "uploaded" && !value.associatedVideo.videoFile?.url) {
      ctx.addIssue({ code: "custom", path: ["associatedVideo", "videoFile"], message: "Upload a video file." });
    }
  });

export const blogStatusSchema = z
  .object({
    status: z.enum(BLOG_STATUSES),
    scheduledAt: z.string().datetime().nullable().optional(),
  })
  .superRefine((value, ctx) => {
    if (value.status === "scheduled" && !value.scheduledAt) {
      ctx.addIssue({
        code: "custom",
        path: ["scheduledAt"],
        message: "Choose a publish date and time.",
      });
    }
  });

export const blogFeatureSchema = z.object({
  isFeatured: z.boolean(),
});

export const blogListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(50).optional().default(12),
  q: z.string().trim().max(120).optional().default(""),
  category: z.string().trim().max(80).optional().default(""),
  status: z.enum(["", ...BLOG_STATUSES]).optional().default(""),
  from: z.string().datetime().optional(),
  to: z.string().datetime().optional(),
});

export const publicBlogListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(24).optional().default(9),
  q: z.string().trim().max(120).optional().default(""),
  category: z.string().trim().max(80).optional().default(""),
});

export const slugParamsSchema = z.object({
  slug: z.string().trim().min(1).max(80),
});

export const previewTokenParamsSchema = z.object({
  token: z
    .string()
    .trim()
    .min(20)
    .max(800)
    .regex(/^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/, "Preview link is invalid or expired."),
});

export const idParamsSchema = z.object({
  id: objectId,
});

export const categoryWriteSchema = z.object({
  name: z.string().trim().min(1, "Category name is required.").max(80),
  description: z.string().trim().max(400).optional().default(""),
  imageUrl: z.string().trim().max(2000).optional().default(""),
  slug: z
    .string()
    .trim()
    .max(80)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Use a lowercase slug with hyphens.")
    .optional(),
  displayOrder: z.coerce.number().int().min(0).max(999).optional().default(0),
  isActive: z.boolean().optional().default(true),
});

export const tagWriteSchema = z.object({
  name: z.string().trim().min(1, "Tag name is required.").max(40),
  slug: z
    .string()
    .trim()
    .max(80)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Use a lowercase slug with hyphens.")
    .optional(),
});

export const imagePurposeQuerySchema = z.object({
  purpose: z.enum(BLOG_IMAGE_PURPOSES).optional().default("inline"),
});

export const blogPreviewSchema = z
  .object({
    title: z.string().trim().max(180).optional(),
    excerpt: z.string().trim().max(400).optional(),
    content: z.string().max(200_000).optional(),
    coverImage: imageSchema.optional(),
    authorName: z.string().trim().max(80).optional(),
  })
  .passthrough();

export type BlogWriteBody = z.infer<typeof blogWriteSchema>;
export type BlogListQuery = z.infer<typeof blogListQuerySchema>;
export type PublicBlogListQuery = z.infer<typeof publicBlogListQuerySchema>;
export type CategoryWriteBody = z.infer<typeof categoryWriteSchema>;
export type TagWriteBody = z.infer<typeof tagWriteSchema>;
