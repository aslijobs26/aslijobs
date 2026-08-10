"use client";

import { JOB_SEEKER_RESUME_BUNDLE_QUERY_KEY } from "@/constants/job-seeker-profile";
import { ROUTES } from "@/constants/routes";
import { fetchMyResumeBundle } from "@/services/job-seeker-resume.service";
import { resolveMediaUrl } from "@/utils/resolve-media-url";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { useEffect, useState } from "react";

export function UploadedResumePreviewPageContent() {
  const resumeQuery = useQuery({
    queryKey: JOB_SEEKER_RESUME_BUNDLE_QUERY_KEY,
    queryFn: fetchMyResumeBundle,
  });

  const uploadedResume = resumeQuery.data?.uploadedResume ?? null;
  const resolvedFileUrl = resolveMediaUrl(uploadedResume?.fileUrl);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isLoadingPreview, setIsLoadingPreview] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!resolvedFileUrl) {
      setPreviewUrl(null);
      setErrorMessage(null);
      setIsLoadingPreview(false);
      return;
    }

    let cancelled = false;
    let objectUrl: string | null = null;

    const loadPreview = async () => {
      setIsLoadingPreview(true);
      setErrorMessage(null);
      setPreviewUrl(null);

      try {
        const response = await fetch(resolvedFileUrl);
        if (!response.ok) {
          throw new Error("Unable to load resume preview.");
        }
        const blob = await response.blob();
        if (cancelled) {
          return;
        }
        objectUrl = URL.createObjectURL(blob);
        setPreviewUrl(objectUrl);
      } catch {
        if (!cancelled) {
          setErrorMessage("Unable to load resume preview.");
        }
      } finally {
        if (!cancelled) {
          setIsLoadingPreview(false);
        }
      }
    };

    void loadPreview();

    return () => {
      cancelled = true;
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
      }
    };
  }, [resolvedFileUrl]);

  if (resumeQuery.isLoading || isLoadingPreview) {
    return (
      <div className="flex min-h-dvh w-full items-center justify-center bg-black">
        <p className="text-sm text-white/70">Loading preview…</p>
      </div>
    );
  }

  if (!uploadedResume || !resolvedFileUrl) {
    return (
      <div className="flex min-h-dvh w-full flex-col items-center justify-center gap-4 bg-black px-4 text-center">
        <p className="text-sm text-white/80">No uploaded resume to preview.</p>
        <Link
          href={ROUTES.JOB_SEEKER_MY_RESUME}
          className="text-sm font-semibold text-white underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40"
        >
          Back to My Resume
        </Link>
      </div>
    );
  }

  if (errorMessage) {
    return (
      <div className="flex min-h-dvh w-full flex-col items-center justify-center gap-4 bg-black px-4 text-center">
        <p className="text-sm text-white/80">{errorMessage}</p>
        <Link
          href={ROUTES.JOB_SEEKER_MY_RESUME}
          className="text-sm font-semibold text-white underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40"
        >
          Back to My Resume
        </Link>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[100] bg-black">
      <h1 className="sr-only">
        Resume preview: {uploadedResume.fileName}
      </h1>
      {previewUrl ? (
        <iframe
          title={`Preview of ${uploadedResume.fileName}`}
          src={previewUrl}
          className="h-full w-full border-0 bg-black"
        />
      ) : null}
    </div>
  );
}
