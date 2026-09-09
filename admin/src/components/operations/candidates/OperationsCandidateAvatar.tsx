"use client";

import { useEffect, useState } from "react";
import { apiClient } from "../../../services/api-client";
import { candidateAvatarInitials } from "./candidates-format";

type OperationsCandidateAvatarProps = {
  name: string;
  /** Preferred: seeker id — builds `/operations/candidates/seekers/:id/photo`. */
  jobSeekerId?: string | null;
  /** Secure API path, or legacy `/uploads/job-seekers/:id/...` (mapped to photo API). */
  photoUrl?: string | null;
  className?: string;
  textClassName?: string;
};

const blobUrlCache = new Map<string, string>();

const OBJECT_ID_RE = /^[a-f0-9]{24}$/i;

function buildPhotoApiPath(jobSeekerId: string): string {
  return `/operations/candidates/seekers/${encodeURIComponent(jobSeekerId)}/photo`;
}

function toApiRelativePath(
  photoUrl: string,
  jobSeekerId?: string | null,
): string | null {
  const id = jobSeekerId?.trim() ?? "";
  if (id && OBJECT_ID_RE.test(id)) {
    return buildPhotoApiPath(id);
  }

  const trimmed = photoUrl.trim();
  if (!trimmed) {
    return null;
  }

  // Legacy public uploads — map to authenticated Ops photo when seeker id is in path.
  const uploadsMatch = trimmed.match(
    /\/uploads\/job-seekers\/([a-f0-9]{24})\//i,
  );
  if (uploadsMatch?.[1]) {
    return buildPhotoApiPath(uploadsMatch[1]);
  }
  if (trimmed.includes("/uploads/")) {
    return null;
  }

  if (trimmed.startsWith("/operations/")) {
    return trimmed;
  }
  if (trimmed.startsWith("/api/v1/operations/")) {
    return trimmed.slice("/api/v1".length);
  }
  if (
    trimmed.includes("/operations/candidates/seekers/") &&
    trimmed.includes("/photo")
  ) {
    const index = trimmed.indexOf("/operations/");
    return index >= 0 ? trimmed.slice(index) : null;
  }
  return null;
}

/**
 * Loads private candidate photos via authenticated Ops API (blob URL).
 * Falls back to initials when missing or unauthorized.
 */
export function OperationsCandidateAvatar({
  name,
  jobSeekerId,
  photoUrl,
  className = "inline-flex size-9 shrink-0 items-center justify-center overflow-hidden rounded-full bg-primary-light text-[11px] font-semibold text-primary",
  textClassName,
}: OperationsCandidateAvatarProps) {
  const [src, setSrc] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function load() {
      const apiPath = toApiRelativePath(photoUrl ?? "", jobSeekerId);
      if (!apiPath) {
        setSrc("");
        return;
      }

      const cached = blobUrlCache.get(apiPath);
      if (cached) {
        setSrc(cached);
        return;
      }

      try {
        const response = await apiClient.get<Blob>(apiPath, {
          responseType: "blob",
        });
        if (cancelled) {
          return;
        }
        // Axios may still parse error JSON bodies as Blob when status is non-2xx;
        // only cache successful image responses.
        const contentType = String(response.headers["content-type"] ?? "");
        if (contentType.includes("application/json")) {
          setSrc("");
          return;
        }
        const createdObjectUrl = URL.createObjectURL(response.data);
        blobUrlCache.set(apiPath, createdObjectUrl);
        setSrc(createdObjectUrl);
      } catch {
        if (!cancelled) {
          setSrc("");
        }
      }
    }

    void load();

    return () => {
      cancelled = true;
    };
  }, [photoUrl, jobSeekerId]);

  return (
    <span className={className}>
      {src ? (
        <img src={src} alt="" className="size-full object-cover" />
      ) : (
        <span className={textClassName}>
          {candidateAvatarInitials(name || "Candidate")}
        </span>
      )}
    </span>
  );
}
