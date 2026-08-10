"use client";

import {
  JOB_SEEKER_UPLOADED_RESUME_ACCEPT,
  JOB_SEEKER_UPLOADED_RESUME_MAX_SIZE_BYTES,
  formatResumeFileSize,
  isAcceptedUploadedResumeFile,
} from "@/constants/job-seeker-resume";
import { cn } from "@/utils/cn";
import { showAppToast } from "@/utils/share-job";
import { FileText, Upload, X } from "lucide-react";
import { useCallback, useRef, useState } from "react";

type UploadResumeModalProps = {
  isOpen: boolean;
  isUploading: boolean;
  onClose: () => void;
  onUpload: (file: File) => Promise<void>;
};

export function UploadResumeModal({
  isOpen,
  isUploading,
  onClose,
  onUpload,
}: UploadResumeModalProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const reset = useCallback(() => {
    setFile(null);
    setIsDragging(false);
    if (inputRef.current) {
      inputRef.current.value = "";
    }
  }, []);

  const handleClose = () => {
    if (isUploading) {
      return;
    }
    reset();
    onClose();
  };

  const assignFile = (next: File | null) => {
    if (!next) {
      setFile(null);
      return;
    }
    if (!isAcceptedUploadedResumeFile(next)) {
      showAppToast("Only PDF, DOC, and DOCX files are allowed.", "error");
      return;
    }
    if (next.size > JOB_SEEKER_UPLOADED_RESUME_MAX_SIZE_BYTES) {
      showAppToast("Resume must be 5 MB or smaller.", "error");
      return;
    }
    setFile(next);
  };

  if (!isOpen) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 z-[80] flex items-end justify-center bg-foreground/40 p-4 sm:items-center"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          handleClose();
        }
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="upload-resume-title"
        className="w-full max-w-lg rounded-2xl border border-border-subtle bg-surface p-5 shadow-xl sm:p-6"
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2
              id="upload-resume-title"
              className="text-lg font-bold text-foreground"
            >
              Upload Your Resume
            </h2>
            <p className="mt-1 text-sm text-muted">
              Upload your existing resume to use it when applying for jobs.
            </p>
          </div>
          <button
            type="button"
            onClick={handleClose}
            disabled={isUploading}
            className="inline-flex size-9 items-center justify-center rounded-lg text-muted hover:bg-hero-bg hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 disabled:opacity-50"
            aria-label="Close upload dialog"
          >
            <X className="size-5" aria-hidden="true" />
          </button>
        </div>

        <div
          className={cn(
            "mt-5 rounded-xl border-2 border-dashed px-4 py-8 text-center transition-colors",
            isDragging
              ? "border-primary bg-primary-light/50"
              : "border-border-subtle bg-hero-bg/60",
          )}
          onDragEnter={(event) => {
            event.preventDefault();
            setIsDragging(true);
          }}
          onDragOver={(event) => {
            event.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={(event) => {
            event.preventDefault();
            setIsDragging(false);
          }}
          onDrop={(event) => {
            event.preventDefault();
            setIsDragging(false);
            const dropped = event.dataTransfer.files?.[0] ?? null;
            assignFile(dropped);
          }}
        >
          <button
            type="button"
            className="mx-auto inline-flex size-12 items-center justify-center rounded-full bg-primary-light text-primary transition-colors hover:bg-primary-light/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 disabled:opacity-60"
            onClick={() => inputRef.current?.click()}
            disabled={isUploading}
            aria-label="Browse files to upload resume"
          >
            <Upload className="size-5" aria-hidden="true" />
          </button>
          <p className="mt-3 text-sm font-semibold text-foreground">
            Drag & drop your resume here
          </p>
          <p className="mt-1 text-xs text-muted">or</p>
          <button
            type="button"
            className="mt-2 text-sm font-semibold text-primary underline-offset-2 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
            onClick={() => inputRef.current?.click()}
            disabled={isUploading}
          >
            Browse Files
          </button>
          <p className="mt-3 text-xs text-muted">
            Supported: PDF, DOC, DOCX · Max 5 MB
          </p>
          <input
            ref={inputRef}
            type="file"
            accept={JOB_SEEKER_UPLOADED_RESUME_ACCEPT}
            className="sr-only"
            onChange={(event) => {
              assignFile(event.target.files?.[0] ?? null);
            }}
          />
        </div>

        {file ? (
          <div className="mt-4 flex items-center gap-3 rounded-xl border border-border-subtle bg-surface px-3 py-3">
            <span className="inline-flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary-light text-primary">
              <FileText className="size-5" aria-hidden="true" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-foreground">
                {file.name}
              </p>
              <p className="text-xs text-muted">
                {file.type || "Document"} · {formatResumeFileSize(file.size)}
              </p>
            </div>
            <button
              type="button"
              disabled={isUploading}
              onClick={() => assignFile(null)}
              className="text-xs font-semibold text-pin-state hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pin-state/30 disabled:opacity-50"
            >
              Remove
            </button>
          </div>
        ) : null}

        <div className="mt-5 flex flex-wrap justify-end gap-2">
          <button
            type="button"
            disabled={isUploading}
            onClick={handleClose}
            className="inline-flex min-h-11 items-center justify-center rounded-lg border border-border-subtle bg-surface px-4 text-sm font-semibold text-foreground hover:bg-hero-bg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={!file || isUploading}
            onClick={() => {
              if (!file) {
                return;
              }
              void onUpload(file).then(() => {
                reset();
              });
            }}
            className="inline-flex min-h-11 items-center justify-center rounded-lg bg-primary px-4 text-sm font-semibold text-surface hover:bg-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isUploading ? "Uploading…" : "Upload Resume"}
          </button>
        </div>
      </div>
    </div>
  );
}
