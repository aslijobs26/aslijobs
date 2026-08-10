"use client";

import {
  formatResumeFileSize,
} from "@/constants/job-seeker-resume";
import { ROUTES } from "@/constants/routes";
import type {
  ApplicationResumeSource,
  PublicUploadedResume,
} from "@/types/job-seeker-resume";
import { cn } from "@/utils/cn";
import { resolveMediaUrl } from "@/utils/resolve-media-url";
import {
  Download,
  Eye,
  FileText,
  FileUp,
  Replace,
  Trash2,
} from "lucide-react";
import Link from "next/link";

type UploadedResumePanelProps = {
  uploadedResume: PublicUploadedResume | null;
  defaultResumeSource: ApplicationResumeSource;
  isBusy: boolean;
  onUploadClick: () => void;
  onReplaceClick: () => void;
  onDelete: () => void;
  onSetDefault: (source: ApplicationResumeSource) => void;
};

function formatDate(value: string | null): string {
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

function fileTypeLabel(mimeType: string, fileName: string): string {
  const lower = fileName.toLowerCase();
  if (mimeType.includes("pdf") || lower.endsWith(".pdf")) {
    return "PDF";
  }
  if (lower.endsWith(".docx") || mimeType.includes("wordprocessingml")) {
    return "DOCX";
  }
  if (lower.endsWith(".doc") || mimeType.includes("msword")) {
    return "DOC";
  }
  return "File";
}

const actionClassName =
  "inline-flex min-h-10 w-full items-center justify-center gap-1.5 rounded-lg px-2.5 text-xs font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 sm:px-3";

export function UploadedResumePanel({
  uploadedResume,
  defaultResumeSource,
  isBusy,
  onUploadClick,
  onReplaceClick,
  onDelete,
  onSetDefault,
}: UploadedResumePanelProps) {
  const isDefault = defaultResumeSource === "uploaded";
  const resolvedFileUrl = resolveMediaUrl(uploadedResume?.fileUrl);
  const isPdf =
    Boolean(uploadedResume) &&
    (uploadedResume!.mimeType.includes("pdf") ||
      uploadedResume!.fileName.toLowerCase().endsWith(".pdf"));

  return (
    <section className="resume-no-print rounded-2xl border border-border-subtle bg-surface p-3.5 shadow-sm sm:p-5">
      <div className="flex items-start gap-3">
        <span className="inline-flex size-9 shrink-0 items-center justify-center rounded-xl bg-resource-salary-surface text-resource-salary-icon sm:size-10 sm:rounded-full">
          <FileUp className="size-4 sm:size-5" aria-hidden="true" />
        </span>
        <div className="min-w-0 flex-1">
          <h2 className="text-sm font-bold text-foreground sm:text-base">
            My Uploaded Resume
          </h2>
          <p className="mt-0.5 text-xs leading-snug text-muted sm:text-sm sm:leading-relaxed">
            Use your own CV when applying for jobs.
          </p>
        </div>
      </div>

      {!uploadedResume ? (
        <div className="mt-3.5 rounded-xl border border-dashed border-border-subtle bg-hero-bg/50 px-3 py-5 text-center sm:mt-4 sm:px-4 sm:py-6">
          <p className="text-xs font-semibold text-foreground sm:text-sm">
            No resume uploaded
          </p>
          <p className="mx-auto mt-1 max-w-[16rem] text-[11px] leading-relaxed text-muted sm:max-w-sm sm:text-xs">
            Upload a PDF, DOC, or DOCX to use it for applications.
          </p>
          <button
            type="button"
            disabled={isBusy}
            onClick={onUploadClick}
            className="mt-3.5 inline-flex min-h-9 w-full max-w-xs items-center justify-center rounded-lg bg-primary px-4 text-xs font-semibold text-surface hover:bg-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 disabled:opacity-60 sm:mt-4 sm:min-h-10 sm:w-auto sm:text-sm"
          >
            Upload Resume
          </button>
        </div>
      ) : (
        <div className="mt-3.5 space-y-3 sm:mt-4">
          <div className="flex items-start gap-2.5 rounded-xl border border-border-subtle bg-hero-bg/50 px-2.5 py-2.5 sm:gap-3 sm:px-3 sm:py-3">
            <span className="inline-flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary-light text-primary">
              <FileText className="size-4" aria-hidden="true" />
            </span>
            <div className="min-w-0 flex-1">
              <p
                className="truncate text-xs font-semibold text-foreground sm:text-sm"
                title={uploadedResume.fileName}
              >
                {uploadedResume.fileName}
              </p>
              <ul className="mt-1.5 flex flex-wrap gap-1.5">
                <li className="rounded-md bg-surface px-1.5 py-0.5 text-[11px] font-semibold text-foreground ring-1 ring-inset ring-border-subtle">
                  {fileTypeLabel(
                    uploadedResume.mimeType,
                    uploadedResume.fileName,
                  )}
                </li>
                <li className="rounded-md bg-surface px-1.5 py-0.5 text-[11px] font-medium text-muted ring-1 ring-inset ring-border-subtle">
                  {formatResumeFileSize(uploadedResume.fileSize)}
                </li>
                <li className="rounded-md bg-surface px-1.5 py-0.5 text-[11px] font-medium text-muted ring-1 ring-inset ring-border-subtle">
                  {formatDate(uploadedResume.uploadedAt)}
                </li>
              </ul>
            </div>
          </div>

          <label
            className={cn(
              "flex cursor-pointer items-center gap-2.5 rounded-xl border px-2.5 py-2.5 transition-colors sm:px-3",
              isDefault
                ? "border-primary/40 bg-primary-light/50"
                : "border-border-subtle bg-surface hover:bg-hero-bg/60",
            )}
          >
            <input
              type="radio"
              name="default-resume-source"
              className="size-4 shrink-0 accent-[var(--color-primary)]"
              checked={isDefault}
              disabled={isBusy}
              onChange={() => onSetDefault("uploaded")}
            />
            <span className="min-w-0 flex-1 text-xs font-semibold text-foreground sm:text-sm">
              Use for applications
            </span>
            {isDefault ? (
              <span className="shrink-0 rounded-full bg-primary-light px-2 py-0.5 text-[10px] font-bold tracking-wide text-primary uppercase ring-1 ring-inset ring-primary/25">
                Default
              </span>
            ) : null}
          </label>

          <div
            className={cn(
              "grid gap-2",
              isPdf ? "grid-cols-2" : "grid-cols-1 sm:grid-cols-3",
            )}
          >
            {resolvedFileUrl && isPdf ? (
              <Link
                href={ROUTES.JOB_SEEKER_UPLOADED_RESUME_PREVIEW}
                target="_blank"
                rel="noopener noreferrer"
                className={cn(
                  actionClassName,
                  "border border-border-subtle bg-surface text-foreground hover:bg-hero-bg",
                )}
              >
                <Eye className="size-3.5 shrink-0" aria-hidden="true" />
                Preview
              </Link>
            ) : null}
            {resolvedFileUrl ? (
              <a
                href={resolvedFileUrl}
                download={uploadedResume.fileName}
                target="_blank"
                rel="noopener noreferrer"
                className={cn(
                  actionClassName,
                  "bg-primary text-surface hover:bg-primary-hover",
                  !isPdf && "sm:col-span-1",
                )}
              >
                <Download className="size-3.5 shrink-0" aria-hidden="true" />
                Download
              </a>
            ) : null}
            <button
              type="button"
              disabled={isBusy}
              onClick={onReplaceClick}
              className={cn(
                actionClassName,
                "border border-border-subtle bg-surface text-foreground hover:bg-hero-bg disabled:cursor-not-allowed disabled:opacity-50",
              )}
            >
              <Replace className="size-3.5 shrink-0" aria-hidden="true" />
              Replace
            </button>
            <button
              type="button"
              disabled={isBusy}
              onClick={onDelete}
              className={cn(
                actionClassName,
                "border border-pin-state/40 bg-surface text-pin-state hover:bg-primary-light/40 disabled:cursor-not-allowed disabled:opacity-50",
              )}
            >
              <Trash2 className="size-3.5 shrink-0" aria-hidden="true" />
              Delete
            </button>
          </div>
        </div>
      )}

      <p className="mt-3 text-[11px] leading-snug text-muted sm:leading-relaxed">
        Separate from your AsliJobs resume. Past applications stay unchanged.
      </p>
    </section>
  );
}
