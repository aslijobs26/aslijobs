"use client";

import {
  EMPLOYER_JOBS_BULK_DELETE_CONFIRM_LABEL,
  EMPLOYER_JOBS_BULK_DELETE_DESCRIPTION,
  EMPLOYER_JOBS_BULK_DELETE_TITLE,
  EMPLOYER_JOBS_BULK_DELETE_WARNING,
  EMPLOYER_JOBS_CASCADE_DELETE_ITEMS,
  EMPLOYER_JOBS_DELETE_ALL_CONFIRM_HINT,
  EMPLOYER_JOBS_DELETE_ALL_CONFIRM_LABEL,
  EMPLOYER_JOBS_DELETE_ALL_DESCRIPTION,
  EMPLOYER_JOBS_DELETE_ALL_TITLE,
} from "@/constants/employer-jobs";
import { X } from "lucide-react";
import { useEffect, useId, useState } from "react";

type EmployerJobsBulkDeleteModalProps = {
  variant: "selected" | "all";
  jobCount: number;
  applicationCount?: number;
  isSubmitting: boolean;
  onClose: () => void;
  onConfirm: (confirmText?: string) => void;
};

export function EmployerJobsBulkDeleteModal({
  variant,
  jobCount,
  applicationCount = 0,
  isSubmitting,
  onClose,
  onConfirm,
}: EmployerJobsBulkDeleteModalProps) {
  const titleId = useId();
  const confirmId = useId();
  const [confirmText, setConfirmText] = useState("");
  const isAll = variant === "all";
  const canSubmit = isAll ? confirmText.trim() === "DELETE" : jobCount > 0;

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !isSubmitting) {
        onClose();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [isSubmitting, onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-4">
      <button
        type="button"
        aria-label="Close dialog backdrop"
        className="absolute inset-0 bg-foreground/40"
        onClick={() => {
          if (!isSubmitting) {
            onClose();
          }
        }}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="relative z-10 w-full max-w-md overflow-hidden rounded-t-2xl border border-border-subtle bg-surface shadow-xl sm:rounded-2xl"
      >
        <div className="flex items-start justify-between gap-3 border-b border-border-subtle px-4 py-3 sm:px-5">
          <div>
            <h2
              id={titleId}
              className="text-base font-semibold text-foreground"
            >
              {isAll
                ? EMPLOYER_JOBS_DELETE_ALL_TITLE
                : EMPLOYER_JOBS_BULK_DELETE_TITLE}
            </h2>
            <p className="mt-1 text-sm text-muted">
              {isAll
                ? EMPLOYER_JOBS_DELETE_ALL_DESCRIPTION
                : EMPLOYER_JOBS_BULK_DELETE_DESCRIPTION}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="inline-flex size-9 shrink-0 items-center justify-center rounded-lg text-muted transition-colors hover:bg-primary-light hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 disabled:opacity-60"
            aria-label="Close"
          >
            <X className="size-5" aria-hidden="true" />
          </button>
        </div>

        <div className="space-y-3 px-4 py-4 sm:px-5">
          <div className="rounded-xl border border-border-subtle bg-hero-bg/60 px-3 py-3">
            <p className="text-sm font-semibold text-foreground">
              {jobCount.toLocaleString("en-IN")}{" "}
              {jobCount === 1 ? "Job" : "Jobs"}
            </p>
            {isAll ? (
              <p className="mt-1 text-xs text-muted">
                Applications attached:{" "}
                <span className="font-semibold text-foreground">
                  {applicationCount.toLocaleString("en-IN")}
                </span>
              </p>
            ) : null}
            <p className="mt-2 text-xs font-semibold text-foreground">
              Permanently removes:
            </p>
            <ul className="mt-1 list-disc space-y-0.5 pl-4 text-xs text-muted">
              {EMPLOYER_JOBS_CASCADE_DELETE_ITEMS.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>

          <p className="text-xs font-semibold text-pin-state">
            {EMPLOYER_JOBS_BULK_DELETE_WARNING}
          </p>

          {isAll ? (
            <label className="block" htmlFor={confirmId}>
              <span className="mb-1.5 block text-xs font-semibold text-foreground">
                {EMPLOYER_JOBS_DELETE_ALL_CONFIRM_HINT}
              </span>
              <input
                id={confirmId}
                value={confirmText}
                onChange={(event) => setConfirmText(event.target.value)}
                autoComplete="off"
                spellCheck={false}
                placeholder="DELETE"
                className="h-11 w-full rounded-xl border border-border bg-surface px-3 text-sm text-foreground outline-none transition-[border-color,box-shadow] placeholder:text-muted/80 focus:border-primary-soft focus:ring-2 focus:ring-primary-soft/20"
              />
            </label>
          ) : null}
        </div>

        <div className="flex flex-wrap justify-end gap-2 border-t border-border-subtle px-4 py-3 sm:px-5">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="inline-flex min-h-10 items-center justify-center rounded-lg border border-border-subtle px-4 text-sm font-semibold text-foreground hover:bg-primary-light/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 disabled:opacity-60"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={!canSubmit || isSubmitting}
            onClick={() => onConfirm(isAll ? confirmText.trim() : undefined)}
            className="inline-flex min-h-10 items-center justify-center rounded-lg bg-pin-state px-4 text-sm font-semibold text-surface hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pin-state/30 disabled:opacity-60"
          >
            {isSubmitting
              ? "Deleting…"
              : isAll
                ? EMPLOYER_JOBS_DELETE_ALL_CONFIRM_LABEL
                : EMPLOYER_JOBS_BULK_DELETE_CONFIRM_LABEL}
          </button>
        </div>
      </div>
    </div>
  );
}
