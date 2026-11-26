import { apiClient } from "./api-client";

export type AdminVideo = {
  id: string;
  title: string;
  description: string;
  source: "youtube" | "uploaded";
  youtubeUrl: string;
  youtubeVideoId: string;
  thumbnailUrl: string;
  uploadedVideo: {
    url: string;
    storagePath: string;
    storageProvider: "local" | "cloudinary";
    publicId: string;
    mimeType: string;
    fileSize: number;
  } | null;
  category: string;
  status: "draft" | "published";
  isFeatured: boolean;
  displayOrder: number;
  publishedAt: string | null;
  createdAt: string | null;
  updatedAt: string | null;
};

export type AdminVideoList = {
  items: AdminVideo[];
  pagination: { page: number; limit: number; total: number; totalPages: number };
};

export async function fetchAdminVideos(params: Record<string, string | number>) {
  const response = await apiClient.get<{ data: AdminVideoList }>("/operations/videos", { params });
  return response.data.data;
}

export async function fetchAdminVideo(id: string) {
  const response = await apiClient.get<{ data: AdminVideo }>(`/operations/videos/${id}`);
  return response.data.data;
}

export async function saveAdminVideo(id: string | null, body: unknown) {
  const response = id
    ? await apiClient.put<{ data: AdminVideo }>(`/operations/videos/${id}`, body)
    : await apiClient.post<{ data: AdminVideo }>("/operations/videos", body);
  return response.data.data;
}

export async function deleteAdminVideo(id: string) {
  await apiClient.delete(`/operations/videos/${id}`);
}

export async function updateAdminVideoStatus(id: string, status: "draft" | "published") {
  const response = await apiClient.patch<{ data: AdminVideo }>(`/operations/videos/${id}/status`, { status });
  return response.data.data;
}

export async function updateAdminVideoOrder(id: string, displayOrder: number) {
  const response = await apiClient.patch<{ data: AdminVideo }>(`/operations/videos/${id}/order`, { displayOrder });
  return response.data.data;
}

export async function uploadAdminVideo(
  file: File,
  onProgress?: (percentage: number) => void,
) {
  const form = new FormData();
  form.append("video", file);
  const response = await apiClient.post<{ data: AdminVideo["uploadedVideo"] }>(
    "/operations/videos/upload",
    form,
    {
      timeout: 10 * 60 * 1000,
      onUploadProgress: (event) => {
        if (event.total) {
          onProgress?.(Math.round((event.loaded / event.total) * 100));
        }
      },
    },
  );
  return response.data.data;
}
