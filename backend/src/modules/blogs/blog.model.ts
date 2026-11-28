import { Schema, model } from "mongoose";

const storedImageSchema = new Schema(
  {
    url: { type: String, required: true, trim: true },
    storagePath: { type: String, default: "" },
    storageProvider: { type: String, enum: ["local", "cloudinary"], default: "local" },
    publicId: { type: String, default: "" },
    alt: { type: String, default: "" },
  },
  { _id: false },
);

const associatedVideoSchema = new Schema(
  {
    source: { type: String, enum: ["youtube", "uploaded"], required: true },
    title: { type: String, trim: true, default: "", maxlength: 180 },
    description: { type: String, trim: true, default: "", maxlength: 400 },
    youtubeUrl: { type: String, trim: true, default: "" },
    youtubeVideoId: { type: String, trim: true, default: "" },
    thumbnailUrl: { type: String, trim: true, default: "" },
    videoFile: {
      url: { type: String, trim: true, default: "" },
      storagePath: { type: String, trim: true, default: "" },
      storageProvider: { type: String, enum: ["local", "cloudinary"], default: "local" },
      publicId: { type: String, trim: true, default: "" },
      mimeType: { type: String, trim: true, default: "" },
      fileSize: { type: Number, default: 0 },
    },
  },
  { _id: false },
);

const blogSchema = new Schema(
  {
    title: { type: String, required: true, trim: true, maxlength: 180 },
    slug: { type: String, required: true, unique: true, trim: true, lowercase: true },
    excerpt: { type: String, required: true, trim: true, maxlength: 400 },
    content: { type: String, required: true, default: "" },
    contentFormat: { type: String, enum: ["html"], default: "html" },
    coverImage: { type: storedImageSchema, required: true },
    categoryId: {
      type: Schema.Types.ObjectId,
      ref: "BlogCategory",
      required: true,
      index: true,
    },
    tagIds: {
      type: [{ type: Schema.Types.ObjectId, ref: "BlogTag" }],
      default: [],
      index: true,
    },
    authorName: { type: String, trim: true, default: "AsliJobs", maxlength: 80 },
    authorImage: { type: storedImageSchema, default: null },
    seo: {
      title: { type: String, trim: true, default: "", maxlength: 70 },
      description: { type: String, trim: true, default: "", maxlength: 180 },
      focusKeyword: { type: String, trim: true, default: "", maxlength: 80 },
      keywords: { type: [String], default: [] },
      canonicalUrl: { type: String, trim: true, default: "" },
      ogTitle: { type: String, trim: true, default: "", maxlength: 90 },
      ogDescription: { type: String, trim: true, default: "", maxlength: 200 },
      ogImage: { type: storedImageSchema, default: null },
    },
    readingTimeMinutes: { type: Number, default: 1, min: 1 },
    views: { type: Number, default: 0, min: 0 },
    likes: { type: Number, default: 0, min: 0 },
    status: {
      type: String,
      enum: ["draft", "published", "scheduled"],
      default: "draft",
      index: true,
    },
    isFeatured: { type: Boolean, default: false, index: true },
    allowIndexing: { type: Boolean, default: true },
    scheduledAt: { type: Date, default: null },
    publishedAt: { type: Date, default: null, index: true },
    faqs: {
      type: [
        new Schema(
          {
            question: { type: String, required: true, trim: true, maxlength: 180 },
            answer: { type: String, required: true, trim: true, maxlength: 800 },
          },
          { _id: false },
        ),
      ],
      default: [],
    },
    relatedBlogIds: {
      type: [{ type: Schema.Types.ObjectId, ref: "Blog" }],
      default: [],
    },
    associatedVideo: { type: associatedVideoSchema, default: null },
    createdBy: { type: Schema.Types.ObjectId, ref: "OperationsTeamUser", default: null },
    updatedBy: { type: Schema.Types.ObjectId, ref: "OperationsTeamUser", default: null },
  },
  { timestamps: true },
);

blogSchema.index({ status: 1, publishedAt: -1 });
blogSchema.index({ status: 1, isFeatured: 1, publishedAt: -1 });
blogSchema.index({ categoryId: 1, status: 1, publishedAt: -1 });
blogSchema.index({ title: "text", excerpt: "text" });

export const BlogModel = model("Blog", blogSchema);
