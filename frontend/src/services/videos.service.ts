import { resolveApiUrl } from "@/constants/env";

export type PublicVideo = {
  id: string;
  title: string;
  description: string;
  source: "youtube" | "uploaded";
  youtubeVideoId: string;
  thumbnailUrl: string;
  uploadedVideo: { url: string; mimeType?: string } | null;
};

export async function fetchPublishedVideos(limit = 12): Promise<PublicVideo[]> {
  const apiUrl = resolveApiUrl(process.env.NEXT_PUBLIC_API_URL);
  const response = await fetch(`${apiUrl}/videos/published?limit=${limit}`, {
    headers: { Accept: "application/json" },
    cache: "no-store",
  });
  if (!response.ok) throw new Error(`Video request failed (${response.status})`);
  const body = (await response.json()) as { data: PublicVideo[] };
  return body.data;
}
