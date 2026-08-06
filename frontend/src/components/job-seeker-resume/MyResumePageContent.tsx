"use client";

import { ResumeActions } from "@/components/job-seeker-resume/ResumeActions";
import { ResumeMetadataPanel } from "@/components/job-seeker-resume/ResumeMetadataPanel";
import { ResumePreview } from "@/components/job-seeker-resume/ResumePreview";
import { ResumeStatusBadge } from "@/components/job-seeker-resume/ResumeStatusBadge";
import { JOB_SEEKER_RESUME_QUERY_KEY } from "@/constants/job-seeker-profile";
import {
  downloadMyResumePdf,
  fetchMyResume,
  regenerateMyResume,
} from "@/services/job-seeker-resume.service";
import { isResumeJson, type PublicResume } from "@/types/job-seeker-resume";
import { showAppToast } from "@/utils/share-job";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback, useState } from "react";

function formatDate(value: string | null | undefined): string {
  if (!value) {
    return "—";
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "—";
  }
  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

function getErrorMessage(error: unknown): string {
  if (
    typeof error === "object" &&
    error !== null &&
    "response" in error &&
    typeof (error as { response?: { data?: { message?: string } } }).response
      ?.data?.message === "string"
  ) {
    return (error as { response: { data: { message: string } } }).response.data
      .message;
  }

  if (error instanceof Error && error.message) {
    return error.message;
  }

  return "Something went wrong. Please try again.";
}

export function MyResumePageContent() {
  const queryClient = useQueryClient();
  const [isDownloading, setIsDownloading] = useState(false);

  const resumeQuery = useQuery({
    queryKey: JOB_SEEKER_RESUME_QUERY_KEY,
    queryFn: fetchMyResume,
  });

  const regenerateMutation = useMutation({
    mutationFn: regenerateMyResume,
    onSuccess: (resume) => {
      queryClient.setQueryData(JOB_SEEKER_RESUME_QUERY_KEY, resume);
      showAppToast("Resume updated successfully.");
    },
    onError: (error) => {
      showAppToast(getErrorMessage(error));
    },
  });

  const resume = resumeQuery.data ?? null;
  const hasPreviewableContent =
    resume != null &&
    resume.status !== "NOT_GENERATED" &&
    isResumeJson(resume.resumeJson);

  const handlePreview = useCallback(() => {
    document.getElementById("resume-preview")?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  }, []);

  const handlePrint = useCallback(() => {
    window.print();
  }, []);

  const handleDownload = useCallback(async () => {
    setIsDownloading(true);
    try {
      const { blob, fileName } = await downloadMyResumePdf();
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = fileName;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      URL.revokeObjectURL(url);
      showAppToast("PDF download started.");
    } catch (error) {
      showAppToast(getErrorMessage(error));
    } finally {
      setIsDownloading(false);
    }
  }, []);

  const handleRegenerate = useCallback(() => {
    regenerateMutation.mutate();
  }, [regenerateMutation]);

  if (resumeQuery.isLoading) {
    return (
      <div className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 w-48 rounded bg-primary-light/60" />
          <div className="h-4 w-80 max-w-full rounded bg-primary-light/40" />
          <div className="mt-8 grid gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]">
            <div className="h-[28rem] rounded-xl bg-primary-light/30" />
            <div className="h-64 rounded-xl bg-primary-light/30" />
          </div>
        </div>
      </div>
    );
  }

  if (resumeQuery.isError) {
    return (
      <div className="mx-auto w-full max-w-3xl px-4 py-16 text-center sm:px-6">
        <h1 className="text-2xl font-bold text-foreground">My Resume</h1>
        <p className="mt-3 text-sm text-muted">
          {getErrorMessage(resumeQuery.error)}
        </p>
        <button
          type="button"
          className="mt-6 inline-flex rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-surface hover:bg-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
          onClick={() => void resumeQuery.refetch()}
        >
          Try again
        </button>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
      <header className="resume-no-print">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
              My Resume
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted">
              Your ATS-friendly professional resume generated from your profile.
            </p>
          </div>
          {resume ? <ResumeStatusBadge status={resume.status} /> : null}
        </div>

        {resume ? (
          <dl className="mt-4 flex flex-wrap gap-x-6 gap-y-2 text-sm text-muted">
            <div>
              <dt className="inline">Version: </dt>
              <dd className="inline font-semibold text-foreground">
                v{resume.versionNumber}
              </dd>
            </div>
            <div>
              <dt className="inline">Generated: </dt>
              <dd className="inline font-semibold text-foreground">
                {formatDate(resume.lastGeneratedAt)}
              </dd>
            </div>
            <div>
              <dt className="inline">Updated: </dt>
              <dd className="inline font-semibold text-foreground">
                {formatDate(resume.updatedAt)}
              </dd>
            </div>
          </dl>
        ) : null}
      </header>

      {!resume || resume.status === "NOT_GENERATED" ? (
        <EmptyResumeState
          isRegenerating={regenerateMutation.isPending}
          onGenerate={handleRegenerate}
        />
      ) : resume.status === "FAILED" && !hasPreviewableContent ? (
        <FailedResumeState
          failureReason={resume.failureReason}
          isRegenerating={regenerateMutation.isPending}
          onRetry={handleRegenerate}
        />
      ) : (
        <div className="mt-8 grid gap-6 lg:grid-cols-[minmax(0,1fr)_20rem] lg:items-start">
          <div className="order-2 lg:order-1">
            <ResumePreview resume={resume as PublicResume} />
          </div>

          <aside className="order-1 space-y-4 lg:order-2 lg:sticky lg:top-24">
            <ResumeActions
              canDownload={hasPreviewableContent}
              canPrint={hasPreviewableContent}
              isRegenerating={regenerateMutation.isPending}
              isDownloading={isDownloading}
              regenerateLabel={
                resume.status === "FAILED" || resume.status === "OUTDATED"
                  ? "Retry Generation"
                  : "Regenerate Resume"
              }
              onPreview={handlePreview}
              onDownload={() => void handleDownload()}
              onPrint={handlePrint}
              onRegenerate={handleRegenerate}
            />
            <ResumeMetadataPanel resume={resume} />
            {resume.status === "FAILED" ? (
              <p className="resume-no-print rounded-lg bg-red-50 px-3 py-2 text-xs text-red-700">
                {resume.failureReason ||
                  "Generation failed. You can retry using the button above."}
              </p>
            ) : null}
            {resume.status === "OUTDATED" ? (
              <p className="resume-no-print rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-800">
                Your profile may have changed. Regenerate to refresh this
                resume.
              </p>
            ) : null}
          </aside>
        </div>
      )}
    </div>
  );
}

function EmptyResumeState({
  isRegenerating,
  onGenerate,
}: {
  isRegenerating: boolean;
  onGenerate: () => void;
}) {
  return (
    <div className="resume-no-print mt-10 rounded-xl border border-dashed border-border-subtle bg-surface px-6 py-12 text-center">
      <h2 className="text-lg font-semibold text-foreground">
        Resume not available
      </h2>
      <p className="mx-auto mt-2 max-w-md text-sm text-muted">
        Generate an ATS-friendly resume from your saved job seeker profile.
      </p>
      <button
        type="button"
        disabled={isRegenerating}
        onClick={onGenerate}
        className="mt-6 inline-flex rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-surface transition-colors hover:bg-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 disabled:opacity-60"
      >
        {isRegenerating ? "Generating…" : "Generate Resume"}
      </button>
    </div>
  );
}

function FailedResumeState({
  failureReason,
  isRegenerating,
  onRetry,
}: {
  failureReason: string;
  isRegenerating: boolean;
  onRetry: () => void;
}) {
  return (
    <div className="resume-no-print mt-10 rounded-xl border border-red-200 bg-red-50/60 px-6 py-12 text-center">
      <h2 className="text-lg font-semibold text-red-800">Generation failed</h2>
      <p className="mx-auto mt-2 max-w-md text-sm text-red-700">
        {failureReason ||
          "We could not generate your resume. Please try again."}
      </p>
      <button
        type="button"
        disabled={isRegenerating}
        onClick={onRetry}
        className="mt-6 inline-flex rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-surface transition-colors hover:bg-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 disabled:opacity-60"
      >
        {isRegenerating ? "Retrying…" : "Retry Generation"}
      </button>
    </div>
  );
}
