"use client";

import { JobSeekerResumePageSkeleton } from "@/components/job-seeker-dashboard/skeletons/JobSeekerPageSkeletons";
import { useJobSeekerProfileMutations } from "@/components/job-seeker-profile/useJobSeekerProfileMutations";
import { EditResumeModal } from "@/components/job-seeker-resume/EditResumeModal";
import { ResumeActions } from "@/components/job-seeker-resume/ResumeActions";
import { ResumeMetadataPanel } from "@/components/job-seeker-resume/ResumeMetadataPanel";
import { ResumePreview } from "@/components/job-seeker-resume/ResumePreview";
import { ResumeStatusBadge } from "@/components/job-seeker-resume/ResumeStatusBadge";
import { UploadResumeModal } from "@/components/job-seeker-resume/UploadResumeModal";
import { UploadedResumePanel } from "@/components/job-seeker-resume/UploadedResumePanel";
import {
  JOB_SEEKER_RESUME_BUNDLE_QUERY_KEY,
  JOB_SEEKER_RESUME_QUERY_KEY,
} from "@/constants/job-seeker-profile";
import { useJobSeekerProfile } from "@/hooks/useJobSeekerProfile";
import {
  deleteMyUploadedResume,
  downloadMyResumePdf,
  fetchMyResumeBundle,
  regenerateMyResume,
  setDefaultResumeSource,
  uploadMyResume,
} from "@/services/job-seeker-resume.service";
import type { ApplicationResumeSource } from "@/types/job-seeker-resume";
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
  const [uploadOpen, setUploadOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);

  const profileQuery = useJobSeekerProfile();
  const { updateProfile, isSaving: isSavingProfile } =
    useJobSeekerProfileMutations({
      successMessage: "Changes saved successfully.",
    });

  const resumeQuery = useQuery({
    queryKey: JOB_SEEKER_RESUME_BUNDLE_QUERY_KEY,
    queryFn: fetchMyResumeBundle,
  });

  const invalidateResumeQueries = async () => {
    await Promise.all([
      queryClient.invalidateQueries({
        queryKey: JOB_SEEKER_RESUME_BUNDLE_QUERY_KEY,
      }),
      queryClient.invalidateQueries({
        queryKey: JOB_SEEKER_RESUME_QUERY_KEY,
      }),
    ]);
  };

  const regenerateMutation = useMutation({
    mutationFn: regenerateMyResume,
    onSuccess: async () => {
      await invalidateResumeQueries();
      showAppToast("Resume updated successfully.", "success");
    },
    onError: (error) => {
      showAppToast(getErrorMessage(error), "error");
    },
  });

  const uploadMutation = useMutation({
    mutationFn: uploadMyResume,
    onSuccess: async () => {
      await invalidateResumeQueries();
      setUploadOpen(false);
      showAppToast("Resume uploaded successfully.", "success");
    },
    onError: (error) => {
      showAppToast(getErrorMessage(error), "error");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteMyUploadedResume,
    onSuccess: async () => {
      await invalidateResumeQueries();
      showAppToast("Uploaded resume deleted. AsliJobs Resume is now default.", "success");
    },
    onError: (error) => {
      showAppToast(getErrorMessage(error), "error");
    },
  });

  const defaultMutation = useMutation({
    mutationFn: setDefaultResumeSource,
    onSuccess: async (data) => {
      queryClient.setQueryData(JOB_SEEKER_RESUME_BUNDLE_QUERY_KEY, (current) => {
        if (!current || typeof current !== "object") {
          return current;
        }
        return {
          ...current,
          uploadedResume: data.uploadedResume,
          defaultResumeSource: data.defaultResumeSource,
        };
      });
      showAppToast("Default resume updated.", "success");
    },
    onError: (error) => {
      showAppToast(getErrorMessage(error), "error");
    },
  });

  const resume = resumeQuery.data?.resume ?? null;
  const uploadedResume = resumeQuery.data?.uploadedResume ?? null;
  const defaultResumeSource: ApplicationResumeSource =
    resumeQuery.data?.defaultResumeSource === "uploaded"
      ? "uploaded"
      : "generated";

  const hasPreviewableContent =
    resume != null &&
    resume.status !== "NOT_GENERATED" &&
    isResumeJson(resume.resumeJson);

  const isBusy =
    regenerateMutation.isPending ||
    uploadMutation.isPending ||
    deleteMutation.isPending ||
    defaultMutation.isPending;

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
      showAppToast("PDF download started.", "success");
    } catch (error) {
      showAppToast(getErrorMessage(error), "error");
    } finally {
      setIsDownloading(false);
    }
  }, []);

  const handleRegenerate = useCallback(() => {
    regenerateMutation.mutate();
  }, [regenerateMutation]);

  const handleDeleteUploaded = () => {
    if (
      !window.confirm(
        "Are you sure you want to delete this uploaded resume? AsliJobs Resume will be used for applications.",
      )
    ) {
      return;
    }
    deleteMutation.mutate();
  };

  if (resumeQuery.isLoading) {
    return <JobSeekerResumePageSkeleton />;
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
            <h1 className="text-xl font-bold tracking-tight text-foreground sm:text-3xl">
              My Resume
            </h1>
            <p className="mt-2 max-w-2xl text-xs leading-relaxed text-muted sm:text-sm">
              Your ATS-friendly professional resume generated from your profile.
              You can also upload your own resume for applications.
            </p>
          </div>
          {resume ? <ResumeStatusBadge status={resume.status} /> : null}
        </div>

        {resume ? (
          <dl className="mt-4 flex flex-wrap gap-x-6 gap-y-2 text-xs text-muted sm:text-sm">
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
            <section className="resume-no-print rounded-2xl border border-border-subtle bg-surface p-4 shadow-sm">
              <h2 className="text-sm font-bold text-foreground sm:text-base">
                AsliJobs Resume
              </h2>
              <p className="mt-1 text-xs text-muted sm:text-sm">
                Generated from your AsliJobs profile
              </p>
              <label className="mt-3 flex cursor-pointer items-center gap-2.5 rounded-xl border border-border-subtle px-3 py-2.5">
                <input
                  type="radio"
                  name="default-resume-source"
                  className="size-4 accent-[var(--color-primary)]"
                  checked={defaultResumeSource === "generated"}
                  disabled={isBusy}
                  onChange={() => defaultMutation.mutate("generated")}
                />
                <span className="text-xs font-semibold text-foreground sm:text-sm">
                  Use for Applications
                </span>
                {defaultResumeSource === "generated" ? (
                  <span className="ml-auto rounded-full bg-primary-light px-2 py-0.5 text-[10px] font-bold text-primary sm:text-[11px]">
                    Default
                  </span>
                ) : null}
              </label>
            </section>

            <ResumeActions
              canDownload={hasPreviewableContent}
              canPrint={hasPreviewableContent}
              canEdit={Boolean(profileQuery.data) && hasPreviewableContent}
              isRegenerating={regenerateMutation.isPending}
              isDownloading={isDownloading}
              regenerateLabel={
                resume.status === "FAILED" || resume.status === "OUTDATED"
                  ? "Retry Generation"
                  : "Regenerate Resume"
              }
              onPreview={handlePreview}
              onEdit={() => setEditOpen(true)}
              onDownload={() => void handleDownload()}
              onPrint={handlePrint}
              onRegenerate={handleRegenerate}
            />
            <ResumeMetadataPanel resume={resume} />

            <UploadedResumePanel
              uploadedResume={uploadedResume}
              defaultResumeSource={defaultResumeSource}
              isBusy={isBusy || isSavingProfile}
              onUploadClick={() => setUploadOpen(true)}
              onReplaceClick={() => setUploadOpen(true)}
              onDelete={handleDeleteUploaded}
              onSetDefault={(source) => defaultMutation.mutate(source)}
            />

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

      {/* When generated resume is empty but upload still needed */}
      {(!resume || resume.status === "NOT_GENERATED" || (resume.status === "FAILED" && !hasPreviewableContent)) ? (
        <div className="resume-no-print mt-6 max-w-xl">
          <UploadedResumePanel
            uploadedResume={uploadedResume}
            defaultResumeSource={defaultResumeSource}
            isBusy={isBusy}
            onUploadClick={() => setUploadOpen(true)}
            onReplaceClick={() => setUploadOpen(true)}
            onDelete={handleDeleteUploaded}
            onSetDefault={(source) => defaultMutation.mutate(source)}
          />
        </div>
      ) : null}

      <UploadResumeModal
        isOpen={uploadOpen}
        isUploading={uploadMutation.isPending}
        onClose={() => setUploadOpen(false)}
        onUpload={async (file) => {
          await uploadMutation.mutateAsync(file);
        }}
      />

      {profileQuery.data ? (
        <EditResumeModal
          isOpen={editOpen}
          jobSeeker={profileQuery.data}
          resume={resume}
          isSaving={isSavingProfile}
          onClose={() => setEditOpen(false)}
          onSave={async (input) => {
            await updateProfile(input);
            await invalidateResumeQueries();
          }}
        />
      ) : null}
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
      <h2 className="text-base font-semibold text-foreground sm:text-lg">
        Resume not available
      </h2>
      <p className="mx-auto mt-2 max-w-md text-xs text-muted sm:text-sm">
        Generate an ATS-friendly resume from your saved job seeker profile.
      </p>
      <button
        type="button"
        disabled={isRegenerating}
        onClick={onGenerate}
        className="mt-6 inline-flex rounded-lg bg-primary px-4 py-2.5 text-xs font-semibold text-surface transition-colors hover:bg-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 disabled:opacity-60 sm:text-sm"
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
      <h2 className="text-base font-semibold text-red-800 sm:text-lg">
        Generation failed
      </h2>
      <p className="mx-auto mt-2 max-w-md text-xs text-red-700 sm:text-sm">
        {failureReason ||
          "We could not generate your resume. Please try again."}
      </p>
      <button
        type="button"
        disabled={isRegenerating}
        onClick={onRetry}
        className="mt-6 inline-flex rounded-lg bg-primary px-4 py-2.5 text-xs font-semibold text-surface transition-colors hover:bg-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 disabled:opacity-60 sm:text-sm"
      >
        {isRegenerating ? "Retrying…" : "Retry Generation"}
      </button>
    </div>
  );
}
