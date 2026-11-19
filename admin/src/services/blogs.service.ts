import { env } from "../constants/env";
import { apiClient } from "./api-client";

export type BlogImage = {
  url: string;
  storagePath: string;
  storageProvider: "local" | "cloudinary";
  publicId: string;
  alt: string;
};

export type AdminBlog = {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  coverImage: BlogImage;
  category: { id: string; name: string; slug: string };
  tags: { id: string; name: string; slug: string }[];
  tagIds: string[];
  authorName: string;
  authorImage: BlogImage | null;
  seo: {
    title?: string;
    description?: string;
    focusKeyword?: string;
    keywords?: string[];
    canonicalUrl?: string;
    ogTitle?: string;
    ogDescription?: string;
    ogImage?: BlogImage | null;
  };
  readingTimeMinutes: number;
  status: "draft" | "published" | "scheduled";
  isFeatured: boolean;
  allowIndexing: boolean;
  faqs: { question: string; answer: string }[];
  scheduledAt: string | null;
  publishedAt: string | null;
  relatedBlogIds: string[];
  createdAt: string | null;
  updatedAt: string | null;
};

export type AdminBlogList = {
  items: AdminBlog[];
  pagination: { page: number; limit: number; total: number; totalPages: number };
  stats: { total: number; published: number; draft: number; scheduled: number };
};

export type BlogCategoryRecord = {
  id: string;
  name: string;
  slug: string;
  description: string;
  imageUrl: string;
  displayOrder: number;
  isActive: boolean;
  blogCount: number;
};

export type BlogTagRecord = {
  id: string;
  name: string;
  slug: string;
  blogCount: number;
};

export async function fetchAdminBlogs(params: Record<string, string | number>): Promise<AdminBlogList> {
  const response = await apiClient.get<{ data: AdminBlogList }>("/operations/blogs", { params });
  return response.data.data;
}

export async function fetchAdminBlog(id: string): Promise<AdminBlog> {
  const response = await apiClient.get<{ data: AdminBlog }>(`/operations/blogs/${id}`);
  return response.data.data;
}

export async function saveAdminBlog(id: string | null, body: unknown): Promise<AdminBlog> {
  const response = id
    ? await apiClient.put<{ data: AdminBlog }>(`/operations/blogs/${id}`, body)
    : await apiClient.post<{ data: AdminBlog }>("/operations/blogs", body);
  return response.data.data;
}

export async function deleteAdminBlog(id: string): Promise<void> {
  await apiClient.delete(`/operations/blogs/${id}`);
}

export async function updateAdminBlogStatus(
  id: string,
  body: { status: string; scheduledAt?: string | null },
): Promise<AdminBlog> {
  const response = await apiClient.patch<{ data: AdminBlog }>(`/operations/blogs/${id}/status`, body);
  return response.data.data;
}

export async function uploadBlogImage(file: File, purpose: string): Promise<BlogImage> {
  const form = new FormData();
  form.append("image", file);
  const response = await apiClient.post<{ data: BlogImage }>("/operations/blogs/images", form, {
    params: { purpose },
  });
  return response.data.data;
}

export type BlogPreview = {
  title: string;
  excerpt: string;
  content: string;
  headings: { id: string; text: string; level: 2 | 3 }[];
  readingTimeMinutes: number;
  coverImageUrl: string;
  authorName: string;
};

export async function previewAdminBlog(body: unknown): Promise<BlogPreview> {
  const response = await apiClient.post<{ data: BlogPreview }>("/operations/blogs/preview", body);
  return response.data.data;
}

export async function openSiteBlogPreview(id: string): Promise<void> {
  if (!env.publicSiteUrl) {
    throw new Error("The public website address is not configured.");
  }
  const response = await apiClient.post<{ data: { token: string; expiresAt: string } }>(
    `/operations/blogs/${id}/preview-token`,
  );
  const returnTo = `${window.location.origin}/operations/blogs`;
  const url = `${env.publicSiteUrl}/blogs/preview/${encodeURIComponent(response.data.data.token)}?return=${encodeURIComponent(returnTo)}`;
  const opened = window.open(url, "_blank", "noopener,noreferrer");
  if (!opened) {
    window.location.assign(url);
  }
}

export async function fetchBlogCategoriesAdmin(): Promise<BlogCategoryRecord[]> {
  const response = await apiClient.get<{ data: BlogCategoryRecord[] }>("/operations/blog-categories");
  return response.data.data;
}

export async function saveBlogCategory(id: string | null, body: unknown): Promise<unknown> {
  if (id) return (await apiClient.put(`/operations/blog-categories/${id}`, body)).data.data;
  return (await apiClient.post("/operations/blog-categories", body)).data.data;
}

export async function deleteBlogCategory(id: string): Promise<void> {
  await apiClient.delete(`/operations/blog-categories/${id}`);
}

export async function fetchBlogTagsAdmin(): Promise<BlogTagRecord[]> {
  const response = await apiClient.get<{ data: BlogTagRecord[] }>("/operations/blog-tags");
  return response.data.data;
}

export async function saveBlogTag(id: string | null, body: unknown): Promise<unknown> {
  if (id) return (await apiClient.put(`/operations/blog-tags/${id}`, body)).data.data;
  return (await apiClient.post("/operations/blog-tags", body)).data.data;
}

export async function deleteBlogTag(id: string): Promise<void> {
  await apiClient.delete(`/operations/blog-tags/${id}`);
}
