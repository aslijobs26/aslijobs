import { resolveApiUrl } from "@/constants/env";

export type BlogCategory = {
  id: string;
  name: string;
  slug: string;
  description: string;
  imageUrl: string;
};

export type BlogCard = {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  coverImageUrl: string;
  coverImageAlt: string;
  category: { name: string; slug: string } | null;
  tags: { name: string; slug: string }[];
  authorName: string;
  readingTimeMinutes: number;
  publishedAt: string | null;
  updatedAt: string | null;
  isFeatured: boolean;
  youtubeVideoId: string;
  associatedVideo: {
    source: "youtube" | "uploaded";
    title: string;
    description: string;
    youtubeUrl: string;
    youtubeVideoId: string;
    thumbnailUrl: string;
    videoFile: { url: string } | null;
  } | null;
};

export type BlogFaq = {
  question: string;
  answer: string;
};

export type BlogArticle = BlogCard & {
  content: string;
  faqs: BlogFaq[];
  headings: { id: string; text: string; level: 2 | 3 }[];
  authorImageUrl: string;
  allowIndexing: boolean;
  seo: {
    title: string;
    description: string;
    canonicalUrl: string;
    ogTitle: string;
    ogDescription: string;
    ogImageUrl: string;
    keywords: string[];
  };
};

export type BlogList = {
  items: BlogCard[];
  pagination: { page: number; limit: number; total: number; totalPages: number };
};

async function publicGet<T>(path: string): Promise<T> {
  const apiUrl = resolveApiUrl(process.env.NEXT_PUBLIC_API_URL);
  const response = await fetch(`${apiUrl}${path}`, {
    headers: { Accept: "application/json" },
    cache: "no-store",
  });
  if (response.status === 404) {
    throw new BlogNotFoundError();
  }
  if (!response.ok) {
    throw new Error(`Blog request failed (${response.status})`);
  }
  const body = (await response.json()) as { data: T };
  return body.data;
}

export class BlogNotFoundError extends Error {
  constructor() {
    super("Article not found");
    this.name = "BlogNotFoundError";
  }
}

export function fetchPublishedBlogs(params: {
  page?: number;
  limit?: number;
  q?: string;
  category?: string;
}): Promise<BlogList> {
  const query = new URLSearchParams();
  query.set("page", String(params.page ?? 1));
  query.set("limit", String(params.limit ?? 9));
  if (params.q) query.set("q", params.q);
  if (params.category) query.set("category", params.category);
  return publicGet<BlogList>(`/blogs?${query.toString()}`);
}

export function fetchBlogCategories(): Promise<BlogCategory[]> {
  return publicGet<BlogCategory[]>("/blogs/categories");
}

export function fetchFeaturedBlog(): Promise<BlogCard | null> {
  return publicGet<BlogCard | null>("/blogs/featured");
}

export function fetchBlogsByCategory(slug: string, limit = 3): Promise<BlogList> {
  return publicGet<BlogList>(`/blogs/category/${encodeURIComponent(slug)}?limit=${limit}`);
}

export function fetchBlogArticle(slug: string): Promise<BlogArticle> {
  return publicGet<BlogArticle>(`/blogs/${encodeURIComponent(slug)}`);
}

export function fetchRelatedBlogs(slug: string): Promise<BlogCard[]> {
  return publicGet<BlogCard[]>(`/blogs/${encodeURIComponent(slug)}/related`);
}

export type BlogPreviewPage = {
  article: BlogArticle;
  related: BlogCard[];
  popular: BlogCard[];
  status: "draft" | "published" | "scheduled";
};

export function fetchBlogPreview(token: string): Promise<BlogPreviewPage> {
  return publicGet<BlogPreviewPage>(`/blogs/preview/${encodeURIComponent(token)}`);
}

export type BlogSitemapItem = { slug: string; updatedAt: string | null };

export function fetchBlogSitemap(): Promise<BlogSitemapItem[]> {
  return publicGet<BlogSitemapItem[]>("/blogs/sitemap");
}
