import { resolveApiUrl } from "@/constants/env";
import {
  normalizePublicJobId,
  parsePublicJobSeoResponse,
  type PublicJobSeo,
} from "@/utils/seo/public-job-seo";
import { cache } from "react";

/** A job that closes, expires or is deleted loses its structured data within a minute. */
const PUBLIC_JOB_SEO_REVALIDATE_SECONDS = 60;

/** Metadata blocks the response, so never wait long on the API. */
const PUBLIC_JOB_SEO_TIMEOUT_MS = 4_000;

export type PublicJobSeoResult =
  | { status: "available"; job: PublicJobSeo }
  | { status: "unavailable"; publicJobId: string | null }
  | { status: "error"; publicJobId: string | null };

/**
 * Server-only, per-request memoized: shared by `generateMetadata` and the page.
 * Uses the side-effect-free SEO endpoint, so rendering never counts a job view.
 */
export const loadPublicJobSeo = cache(
  async (rawJobId: string): Promise<PublicJobSeoResult> => {
    const publicJobId = normalizePublicJobId(rawJobId);
    if (!publicJobId) {
      return { status: "unavailable", publicJobId: null };
    }

    try {
      const apiUrl = resolveApiUrl(process.env.NEXT_PUBLIC_API_URL);
      const response = await fetch(
        `${apiUrl}/jobs/public/${encodeURIComponent(publicJobId)}/seo`,
        {
          headers: { Accept: "application/json" },
          next: { revalidate: PUBLIC_JOB_SEO_REVALIDATE_SECONDS },
          signal: AbortSignal.timeout(PUBLIC_JOB_SEO_TIMEOUT_MS),
        },
      );

      if (response.status === 404 || response.status === 400) {
        return { status: "unavailable", publicJobId };
      }
      if (!response.ok) {
        throw new Error(`Public job SEO request failed with ${response.status}`);
      }

      const job = parsePublicJobSeoResponse(await response.json());
      return job
        ? { status: "available", job }
        : { status: "error", publicJobId };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error(`[job-seo] ${publicJobId}: ${message}`);
      return { status: "error", publicJobId };
    }
  },
);
