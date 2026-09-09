"use client";

import { JOB_SEEKER_RESUME_BUNDLE_QUERY_KEY } from "@/constants/job-seeker-profile";
import { ROUTES } from "@/constants/routes";
import { useAuthenticatedMediaUrl } from "@/hooks/use-authenticated-media-url";
import { fetchMyResumeBundle } from "@/services/job-seeker-resume.service";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";

export function UploadedResumePreviewPageContent() {
  const resumeQuery = useQuery({
    queryKey: JOB_SEEKER_RESUME_BUNDLE_QUERY_KEY,
    queryFn: fetchMyResumeBundle,
  });

  const uploadedResume = resumeQuery.data?.uploadedResume ?? null;
  const {
    url: previewUrl,
    isLoading: isLoadingPreview,
    error: previewError,
  } = useAuthenticatedMediaUrl(uploadedResume?.fileUrl);

  if (resumeQuery.isLoading || isLoadingPreview) {
    return (
      <div className="flex min-h-dvh w-full items-center justify-center bg-black">
        <p className="text-sm text-white/70">Loading preview…</p>
      </div>
    );
  }

  if (!uploadedResume) {
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

  if (previewError || !previewUrl) {
    return (
      <div className="flex min-h-dvh w-full flex-col items-center justify-center gap-4 bg-black px-4 text-center">
        <p className="text-sm text-white/80">
          {previewError ?? "Unable to load resume preview."}
        </p>
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
      <iframe
        title={`Preview of ${uploadedResume.fileName}`}
        src={previewUrl}
        className="h-full w-full border-0 bg-black"
      />
    </div>
  );
}
