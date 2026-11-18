import { Types, type FilterQuery } from "mongoose";
import { HTTP_STATUS } from "../../constants/http-status.js";
import { AppError } from "../../middleware/error.middleware.js";
import { storageService } from "../storage/storage.service.js";
import type { StorageProviderName } from "../storage/storage.types.js";
import { BlogAssetModel } from "./blog-asset.model.js";
import { BlogCategoryModel } from "./blog-category.model.js";
import { DEFAULT_BLOG_CATEGORIES } from "./blog.constants.js";
import {
  estimateReadingMinutes,
  extractBlogHeadings,
  firstYoutubeVideoId,
  sanitizeBlogHtml,
  slugifyBlogText,
} from "./blog.html.js";
import { BlogModel } from "./blog.model.js";
import { BlogTagModel } from "./blog-tag.model.js";
import type {
  BlogWriteBody,
  CategoryWriteBody,
  PublicBlogListQuery,
  TagWriteBody,
} from "./blog.validation.js";

type ImageInput = {
  url: string;
  storagePath?: string;
  storageProvider?: "local" | "cloudinary";
  publicId?: string;
  alt?: string;
};

type LeanCategory = {
  _id: Types.ObjectId;
  name: string;
  slug: string;
  description?: string;
  imageUrl?: string;
  displayOrder?: number;
  isActive?: boolean;
};

type LeanTag = { _id: Types.ObjectId; name: string; slug: string };

type LeanImage = ImageInput | null | undefined;

type LeanBlog = {
  _id: Types.ObjectId;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  coverImage: ImageInput;
  categoryId: Types.ObjectId | LeanCategory;
  tagIds: Array<Types.ObjectId | LeanTag>;
  authorName?: string;
  authorImage?: LeanImage;
  seo?: BlogWriteBody["seo"];
  readingTimeMinutes?: number;
  status: "draft" | "published" | "scheduled";
  isFeatured?: boolean;
  allowIndexing?: boolean;
  scheduledAt?: Date | null;
  publishedAt?: Date | null;
  faqs?: { question: string; answer: string }[];
  relatedBlogIds?: Types.ObjectId[];
  createdAt?: Date;
  updatedAt?: Date;
};

function iso(value: Date | null | undefined): string | null {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

function imageOut(image: LeanImage, altFallback = "") {
  if (!image?.url) return null;
  return {
    url: image.url,
    alt: image.alt || altFallback,
  };
}

function asCategory(value: LeanBlog["categoryId"]): LeanCategory | null {
  if (value && typeof value === "object" && "slug" in value) {
    return value;
  }
  return null;
}

function asTags(value: LeanBlog["tagIds"]): LeanTag[] {
  return value.filter((tag): tag is LeanTag => typeof tag === "object" && "slug" in tag);
}

export function toPublicCard(blog: LeanBlog) {
  const category = asCategory(blog.categoryId);
  return {
    id: String(blog._id),
    title: blog.title,
    slug: blog.slug,
    excerpt: blog.excerpt,
    coverImageUrl: blog.coverImage?.url ?? "",
    coverImageAlt: blog.coverImage?.alt || blog.title,
    category: category
      ? { name: category.name, slug: category.slug }
      : null,
    tags: asTags(blog.tagIds).map((tag) => ({ name: tag.name, slug: tag.slug })),
    authorName: blog.authorName || "AsliJobs",
    readingTimeMinutes: blog.readingTimeMinutes || 1,
    publishedAt: iso(blog.publishedAt),
    updatedAt: iso(blog.updatedAt),
    isFeatured: Boolean(blog.isFeatured),
    youtubeVideoId: firstYoutubeVideoId(blog.content || ""),
  };
}

export function toPublicArticle(blog: LeanBlog) {
  const content = sanitizeBlogHtml(blog.content);
  return {
    ...toPublicCard(blog),
    content,
    headings: extractBlogHeadings(content),
    authorImageUrl: blog.authorImage?.url ?? "",
    allowIndexing: blog.allowIndexing !== false,
    faqs: (blog.faqs ?? []).filter((item) => item.question && item.answer),
    seo: {
      title: blog.seo?.title || blog.title,
      description: blog.seo?.description || blog.excerpt,
      canonicalUrl: blog.seo?.canonicalUrl || "",
      ogTitle: blog.seo?.ogTitle || blog.seo?.title || blog.title,
      ogDescription: blog.seo?.ogDescription || blog.seo?.description || blog.excerpt,
      ogImageUrl: blog.seo?.ogImage?.url || blog.coverImage?.url || "",
      keywords: blog.seo?.keywords ?? [],
    },
  };
}

function toAdminBlog(blog: LeanBlog) {
  const category = asCategory(blog.categoryId);
  return {
    id: String(blog._id),
    title: blog.title,
    slug: blog.slug,
    excerpt: blog.excerpt,
    content: blog.content,
    coverImage: blog.coverImage,
    category: category
      ? {
          id: String(category._id),
          name: category.name,
          slug: category.slug,
        }
      : { id: String(blog.categoryId), name: "", slug: "" },
    tags: asTags(blog.tagIds).map((tag) => ({
      id: String(tag._id),
      name: tag.name,
      slug: tag.slug,
    })),
    tagIds: asTags(blog.tagIds).map((tag) => String(tag._id)),
    authorName: blog.authorName || "AsliJobs",
    authorImage: imageOut(blog.authorImage),
    seo: blog.seo ?? {},
    readingTimeMinutes: blog.readingTimeMinutes || 1,
    status: blog.status,
    isFeatured: Boolean(blog.isFeatured),
    allowIndexing: blog.allowIndexing !== false,
    faqs: (blog.faqs ?? []).filter((item) => item.question && item.answer),
    scheduledAt: iso(blog.scheduledAt),
    publishedAt: iso(blog.publishedAt),
    relatedBlogIds: (blog.relatedBlogIds ?? []).map(String),
    createdAt: iso(blog.createdAt),
    updatedAt: iso(blog.updatedAt),
  };
}

const publicPopulate = [
  { path: "categoryId", select: "name slug description imageUrl displayOrder isActive" },
  { path: "tagIds", select: "name slug" },
];

const publishedFilter = () => ({
  status: "published" as const,
  publishedAt: { $lte: new Date() },
});

export async function ensureDefaultBlogCategories(): Promise<void> {
  const count = await BlogCategoryModel.countDocuments();
  if (count > 0) return;
  await BlogCategoryModel.insertMany(
    DEFAULT_BLOG_CATEGORIES.map((category) => ({
      ...category,
      description: "",
      imageUrl: "",
      isActive: true,
    })),
  );
}

export async function publishDueBlogs(now = new Date()): Promise<number> {
  const due = await BlogModel.find({
    status: "scheduled",
    scheduledAt: { $ne: null, $lte: now },
  });
  for (const blog of due) {
    blog.status = "published";
    blog.publishedAt = blog.scheduledAt ?? now;
    await blog.save();
  }
  return due.length;
}

const RESERVED_SLUGS = new Set(["featured", "categories", "sitemap", "category"]);

async function uniqueSlug(
  model: { exists: (filter: object) => Promise<unknown> },
  base: string,
  ignoreId?: string,
): Promise<string> {
  let slug = slugifyBlogText(base);
  if (RESERVED_SLUGS.has(slug)) slug = `${slug}-article`;
  let n = 2;
  while (
    await model.exists({
      slug,
      ...(ignoreId ? { _id: { $ne: ignoreId } } : {}),
    })
  ) {
    const suffix = `-${n}`;
    slug = `${slugifyBlogText(base).slice(0, 80 - suffix.length)}${suffix}`;
    n += 1;
    if (n > 50) {
      throw new AppError("Could not create a unique URL slug.", HTTP_STATUS.CONFLICT);
    }
  }
  return slug;
}

function storedImage(image: ImageInput, alt: string) {
  return {
    url: image.url,
    storagePath: image.storagePath ?? "",
    storageProvider: image.storageProvider ?? "local",
    publicId: image.publicId ?? "",
    alt,
  };
}

async function assertCategory(categoryId: string) {
  const category = await BlogCategoryModel.findById(categoryId);
  if (!category || category.isActive === false) {
    throw new AppError("Choose an active category.", HTTP_STATUS.BAD_REQUEST);
  }
  return category;
}

async function assertTags(tagIds: string[]) {
  if (tagIds.length === 0) return;
  const count = await BlogTagModel.countDocuments({ _id: { $in: tagIds } });
  if (count !== tagIds.length) {
    throw new AppError("One or more tags no longer exist.", HTTP_STATUS.BAD_REQUEST);
  }
}

function publishFields(body: BlogWriteBody) {
  const now = new Date();
  if (body.status === "published") {
    return { status: "published" as const, publishedAt: now, scheduledAt: null };
  }
  if (body.status === "scheduled") {
    const scheduledAt = new Date(body.scheduledAt ?? "");
    if (Number.isNaN(scheduledAt.getTime())) {
      throw new AppError("Choose a publish date and time.", HTTP_STATUS.BAD_REQUEST);
    }
    if (scheduledAt.getTime() <= now.getTime()) {
      return { status: "published" as const, publishedAt: scheduledAt, scheduledAt };
    }
    return { status: "scheduled" as const, scheduledAt, publishedAt: null };
  }
  return { status: "draft" as const, scheduledAt: null, publishedAt: null };
}

async function linkAssets(blogId: string, urls: string[]) {
  const unique = [...new Set(urls.filter(Boolean))];
  if (unique.length === 0) return;
  await BlogAssetModel.updateMany(
    { url: { $in: unique } },
    { $set: { blogId } },
  );
}

function collectImageUrls(body: BlogWriteBody, content: string): string[] {
  const urls = [body.coverImage.url, body.authorImage?.url, body.seo?.ogImage?.url];
  const matches = content.match(/https?:\/\/[^"'\\\s>]+|\/uploads\/[^"'\\\s>]+/g) ?? [];
  return [...urls, ...matches].filter((url): url is string => Boolean(url));
}

async function deleteAssetsForBlog(blogId: string) {
  const assets = await BlogAssetModel.find({ blogId });
  for (const asset of assets) {
    if (!asset.storagePath) continue;
    try {
      await storageService.delete({
        storagePath: asset.storagePath,
        storageProvider: asset.storageProvider as StorageProviderName,
        publicId: asset.publicId || undefined,
      });
    } catch (error) {
      console.error("[blogs] failed to delete asset", asset.url, error);
    }
  }
  await BlogAssetModel.deleteMany({ blogId });
}

export const blogService = {
  async listPublic(query: PublicBlogListQuery) {
    await publishDueBlogs();
    const filter: FilterQuery<unknown> = publishedFilter();
    if (query.category) {
      const category = await BlogCategoryModel.findOne({
        slug: query.category,
        isActive: true,
      }).lean();
      if (!category) {
        return { items: [], pagination: emptyPage(query.page, query.limit) };
      }
      filter.categoryId = category._id;
    }
    if (query.q) {
      const pattern = new RegExp(escapeRegex(query.q), "i");
      filter.$or = [{ title: pattern }, { excerpt: pattern }];
    }
    const [total, rows] = await Promise.all([
      BlogModel.countDocuments(filter),
      BlogModel.find(filter)
        .sort({ publishedAt: -1 })
        .skip((query.page - 1) * query.limit)
        .limit(query.limit)
        .populate(publicPopulate)
        .lean(),
    ]);
    return {
      items: (rows as unknown as LeanBlog[]).map(toPublicCard),
      pagination: pageMeta(query.page, query.limit, total),
    };
  },

  async featured() {
    await publishDueBlogs();
    const row = await BlogModel.findOne({ ...publishedFilter(), isFeatured: true })
      .sort({ publishedAt: -1 })
      .populate(publicPopulate)
      .lean();
    return row ? toPublicCard(row as unknown as LeanBlog) : null;
  },

  async bySlug(slug: string) {
    await publishDueBlogs();
    const row = await BlogModel.findOne({ slug, ...publishedFilter() })
      .populate(publicPopulate)
      .lean();
    if (!row) {
      throw new AppError("Article not found.", HTTP_STATUS.NOT_FOUND);
    }
    return toPublicArticle(row as unknown as LeanBlog);
  },

  async related(slug: string) {
    await publishDueBlogs();
    const current = await BlogModel.findOne({ slug, ...publishedFilter() }).lean();
    if (!current) {
      throw new AppError("Article not found.", HTTP_STATUS.NOT_FOUND);
    }
    const preferred = current.relatedBlogIds ?? [];
    const rows = await BlogModel.find({
      _id: { $ne: current._id },
      ...publishedFilter(),
      $or: [
        { _id: { $in: preferred } },
        { categoryId: current.categoryId },
        { tagIds: { $in: current.tagIds ?? [] } },
      ],
    })
      .sort({ publishedAt: -1 })
      .limit(3)
      .populate(publicPopulate)
      .lean();
    return (rows as unknown as LeanBlog[]).map(toPublicCard);
  },

  async categoriesPublic() {
    await ensureDefaultBlogCategories();
    const rows = await BlogCategoryModel.find({ isActive: true })
      .sort({ displayOrder: 1, name: 1 })
      .lean();
    return rows.map((row) => ({
      id: String(row._id),
      name: row.name,
      slug: row.slug,
      description: row.description ?? "",
      imageUrl: row.imageUrl ?? "",
    }));
  },

  async byCategory(slug: string, limit: number) {
    return this.listPublic({ page: 1, limit, q: "", category: slug });
  },

  async sitemapEntries() {
    await publishDueBlogs();
    const rows = await BlogModel.find({
      ...publishedFilter(),
      allowIndexing: { $ne: false },
    })
      .select({ slug: 1, updatedAt: 1 })
      .sort({ updatedAt: -1 })
      .limit(5000)
      .lean();
    return rows.map((row) => ({
      slug: row.slug,
      updatedAt: row.updatedAt ? new Date(row.updatedAt).toISOString() : null,
    }));
  },

  async adminList(query: {
    page: number;
    limit: number;
    q: string;
    category: string;
    status: string;
    from?: string;
    to?: string;
  }) {
    await ensureDefaultBlogCategories();
    const filter: FilterQuery<unknown> = {};
    if (query.status) filter.status = query.status;
    if (query.category && Types.ObjectId.isValid(query.category)) {
      filter.categoryId = query.category;
    }
    if (query.q) {
      const pattern = new RegExp(escapeRegex(query.q), "i");
      filter.$or = [{ title: pattern }, { excerpt: pattern }, { slug: pattern }];
    }
    if (query.from || query.to) {
      const range = {
        ...(query.from ? { $gte: new Date(query.from) } : {}),
        ...(query.to ? { $lte: new Date(query.to) } : {}),
      };
      filter.updatedAt = range;
    }
    const [total, published, draft, scheduled, rows] = await Promise.all([
      BlogModel.countDocuments({}),
      BlogModel.countDocuments({ status: "published" }),
      BlogModel.countDocuments({ status: "draft" }),
      BlogModel.countDocuments({ status: "scheduled" }),
      BlogModel.find(filter)
        .sort({ updatedAt: -1 })
        .skip((query.page - 1) * query.limit)
        .limit(query.limit)
        .populate(publicPopulate)
        .lean(),
    ]);
    const filteredTotal = await BlogModel.countDocuments(filter);
    return {
      items: (rows as unknown as LeanBlog[]).map(toAdminBlog),
      pagination: pageMeta(query.page, query.limit, filteredTotal),
      stats: { total, published, draft, scheduled },
    };
  },

  async adminGet(id: string) {
    const row = await BlogModel.findById(id).populate(publicPopulate).lean();
    if (!row) throw new AppError("Blog not found.", HTTP_STATUS.NOT_FOUND);
    return toAdminBlog(row as unknown as LeanBlog);
  },

  async create(body: BlogWriteBody, userId: string | undefined) {
    await assertCategory(body.categoryId);
    await assertTags(body.tagIds);
    const content = sanitizeBlogHtml(body.content);
    if (!textOf(content)) {
      throw new AppError("Article content is required.", HTTP_STATUS.BAD_REQUEST);
    }
    const slug = await uniqueSlug(BlogModel, body.slug || body.title);
    const timing = publishFields(body);
    const created = await BlogModel.create({
      title: body.title,
      slug,
      excerpt: body.excerpt,
      content,
      contentFormat: "html",
      coverImage: storedImage(body.coverImage, body.coverImageAlt || body.coverImage.alt || body.title),
      categoryId: body.categoryId,
      tagIds: body.tagIds,
      authorName: body.authorName || "AsliJobs",
      authorImage: body.authorImage?.url ? storedImage(body.authorImage, body.authorName) : null,
      seo: {
        title: body.seo?.title || "",
        description: body.seo?.description || "",
        focusKeyword: body.seo?.focusKeyword || "",
        keywords: body.seo?.keywords ?? [],
        canonicalUrl: body.seo?.canonicalUrl || "",
        ogTitle: body.seo?.ogTitle || "",
        ogDescription: body.seo?.ogDescription || "",
        ogImage: body.seo?.ogImage?.url ? storedImage(body.seo.ogImage, body.title) : null,
      },
      readingTimeMinutes: estimateReadingMinutes(content),
      isFeatured: body.isFeatured,
      allowIndexing: body.allowIndexing,
      faqs: body.faqs,
      relatedBlogIds: body.relatedBlogIds,
      createdBy: userId || null,
      updatedBy: userId || null,
      ...timing,
    });
    await linkAssets(String(created._id), collectImageUrls(body, content));
    return this.adminGet(String(created._id));
  },

  async update(id: string, body: BlogWriteBody, userId: string | undefined) {
    const existing = await BlogModel.findById(id);
    if (!existing) throw new AppError("Blog not found.", HTTP_STATUS.NOT_FOUND);
    await assertCategory(body.categoryId);
    await assertTags(body.tagIds);
    const content = sanitizeBlogHtml(body.content);
    if (!textOf(content)) {
      throw new AppError("Article content is required.", HTTP_STATUS.BAD_REQUEST);
    }
    const slug = await uniqueSlug(BlogModel, body.slug || body.title, id);
    const timing = publishFields(body);
    if (body.status === "published" && existing.publishedAt && existing.status === "published") {
      timing.publishedAt = existing.publishedAt;
    }
    existing.set({
      title: body.title,
      slug,
      excerpt: body.excerpt,
      content,
      coverImage: storedImage(body.coverImage, body.coverImageAlt || body.coverImage.alt || body.title),
      categoryId: body.categoryId,
      tagIds: body.tagIds,
      authorName: body.authorName || "AsliJobs",
      authorImage: body.authorImage?.url ? storedImage(body.authorImage, body.authorName) : null,
      seo: {
        title: body.seo?.title || "",
        description: body.seo?.description || "",
        focusKeyword: body.seo?.focusKeyword || "",
        keywords: body.seo?.keywords ?? [],
        canonicalUrl: body.seo?.canonicalUrl || "",
        ogTitle: body.seo?.ogTitle || "",
        ogDescription: body.seo?.ogDescription || "",
        ogImage: body.seo?.ogImage?.url ? storedImage(body.seo.ogImage, body.title) : null,
      },
      readingTimeMinutes: estimateReadingMinutes(content),
      isFeatured: body.isFeatured,
      allowIndexing: body.allowIndexing,
      faqs: body.faqs,
      relatedBlogIds: body.relatedBlogIds,
      updatedBy: userId || null,
      ...timing,
    });
    await existing.save();
    await linkAssets(id, collectImageUrls(body, content));
    return this.adminGet(id);
  },

  async remove(id: string) {
    const existing = await BlogModel.findById(id);
    if (!existing) throw new AppError("Blog not found.", HTTP_STATUS.NOT_FOUND);
    await BlogModel.deleteOne({ _id: id });
    await deleteAssetsForBlog(id);
  },

  async setStatus(
    id: string,
    status: "draft" | "published" | "scheduled",
    scheduledAt: string | null | undefined,
    userId: string | undefined,
  ) {
    const existing = await BlogModel.findById(id);
    if (!existing) throw new AppError("Blog not found.", HTTP_STATUS.NOT_FOUND);
    const timing = publishFields({
      status,
      scheduledAt,
    } as BlogWriteBody);
    if (status === "published" && existing.publishedAt && existing.status === "published") {
      timing.publishedAt = existing.publishedAt;
    }
    existing.set({ ...timing, updatedBy: userId || null });
    await existing.save();
    return this.adminGet(id);
  },

  async setFeatured(id: string, isFeatured: boolean, userId: string | undefined) {
    const existing = await BlogModel.findByIdAndUpdate(
      id,
      { isFeatured, updatedBy: userId || null },
      { new: true },
    );
    if (!existing) throw new AppError("Blog not found.", HTTP_STATUS.NOT_FOUND);
    return this.adminGet(id);
  },

  preview(body: Partial<BlogWriteBody>) {
    const content = sanitizeBlogHtml(body.content ?? "");
    return {
      title: body.title || "Untitled article",
      excerpt: body.excerpt || "",
      content,
      headings: extractBlogHeadings(content),
      readingTimeMinutes: estimateReadingMinutes(content),
      coverImageUrl: body.coverImage?.url || "",
      authorName: body.authorName || "AsliJobs",
    };
  },

  async listCategories() {
    await ensureDefaultBlogCategories();
    const rows = await BlogCategoryModel.find().sort({ displayOrder: 1, name: 1 }).lean();
    const counts = await BlogModel.aggregate<{ _id: Types.ObjectId; count: number }>([
      { $group: { _id: "$categoryId", count: { $sum: 1 } } },
    ]);
    const countById = new Map(counts.map((row) => [String(row._id), row.count]));
    return rows.map((row) => ({
      id: String(row._id),
      name: row.name,
      slug: row.slug,
      description: row.description ?? "",
      imageUrl: row.imageUrl ?? "",
      displayOrder: row.displayOrder ?? 0,
      isActive: row.isActive !== false,
      blogCount: countById.get(String(row._id)) ?? 0,
    }));
  },

  async createCategory(body: CategoryWriteBody) {
    const slug = await uniqueSlug(BlogCategoryModel, body.slug || body.name);
    const created = await BlogCategoryModel.create({ ...body, slug });
    return {
      id: String(created._id),
      name: created.name,
      slug: created.slug,
      description: created.description,
      imageUrl: created.imageUrl,
      displayOrder: created.displayOrder,
      isActive: created.isActive,
      blogCount: 0,
    };
  },

  async updateCategory(id: string, body: CategoryWriteBody) {
    const existing = await BlogCategoryModel.findById(id);
    if (!existing) throw new AppError("Category not found.", HTTP_STATUS.NOT_FOUND);
    const slug = await uniqueSlug(BlogCategoryModel, body.slug || body.name, id);
    existing.set({ ...body, slug });
    await existing.save();
    return this.listCategories().then((rows) => rows.find((row) => row.id === id));
  },

  async deleteCategory(id: string) {
    const inUse = await BlogModel.countDocuments({ categoryId: id });
    if (inUse > 0) {
      throw new AppError(
        "Reassign blogs in this category before deleting it.",
        HTTP_STATUS.CONFLICT,
      );
    }
    const deleted = await BlogCategoryModel.findByIdAndDelete(id);
    if (!deleted) throw new AppError("Category not found.", HTTP_STATUS.NOT_FOUND);
  },

  async listTags() {
    const rows = await BlogTagModel.find().sort({ name: 1 }).lean();
    const counts = await BlogModel.aggregate<{ _id: Types.ObjectId; count: number }>([
      { $unwind: "$tagIds" },
      { $group: { _id: "$tagIds", count: { $sum: 1 } } },
    ]);
    const countById = new Map(counts.map((row) => [String(row._id), row.count]));
    return rows.map((row) => ({
      id: String(row._id),
      name: row.name,
      slug: row.slug,
      blogCount: countById.get(String(row._id)) ?? 0,
    }));
  },

  async createTag(body: TagWriteBody) {
    const slug = await uniqueSlug(BlogTagModel, body.slug || body.name);
    const created = await BlogTagModel.create({ name: body.name, slug });
    return { id: String(created._id), name: created.name, slug: created.slug, blogCount: 0 };
  },

  async updateTag(id: string, body: TagWriteBody) {
    const existing = await BlogTagModel.findById(id);
    if (!existing) throw new AppError("Tag not found.", HTTP_STATUS.NOT_FOUND);
    const slug = await uniqueSlug(BlogTagModel, body.slug || body.name, id);
    existing.set({ name: body.name, slug });
    await existing.save();
    return { id, name: existing.name, slug: existing.slug };
  },

  async deleteTag(id: string) {
    const inUse = await BlogModel.countDocuments({ tagIds: id });
    if (inUse > 0) {
      throw new AppError("Remove this tag from blogs before deleting it.", HTTP_STATUS.CONFLICT);
    }
    const deleted = await BlogTagModel.findByIdAndDelete(id);
    if (!deleted) throw new AppError("Tag not found.", HTTP_STATUS.NOT_FOUND);
  },
};

function emptyPage(page: number, limit: number) {
  return pageMeta(page, limit, 0);
}

function pageMeta(page: number, limit: number, total: number) {
  return {
    page,
    limit,
    total,
    totalPages: Math.max(1, Math.ceil(total / limit)),
  };
}

function escapeRegex(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function textOf(html: string) {
  return html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}
