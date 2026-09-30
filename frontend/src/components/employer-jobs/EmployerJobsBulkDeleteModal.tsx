"use client";

import { useTranslate } from "@/i18n/translate";
import { X } from "lucide-react";
import { useEffect, useId, useState } from "react";

const CASCADE_DELETE_ITEM_KEYS = [
  "employer.jobs.cascade.jobDetails",
  "employer.jobs.cascade.applications",
  "employer.jobs.cascade.savedCandidates",
  "employer.jobs.cascade.shortlistedCandidates",
  "employer.jobs.cascade.interviewRecords",
  "employer.jobs.cascade.calendarEvents",
  "employer.jobs.cascade.notifications",
  "employer.jobs.cascade.analytics",
] as const;

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
  const t = useTranslate();
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
        aria-label={t("employer.common.closeDialog")}
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
          <div className="min-w-0">
            <h2
              id={titleId}
              className="break-words text-base font-semibold text-foreground"
            >
              {isAll
                ? t("employer.jobs.deleteAllJobs")
                : t("employer.jobs.bulkDeleteTitle")}
            </h2>
            <p className="mt-1 break-words text-sm text-muted">
              {isAll
                ? t("employer.jobs.deleteAllDescription")
                : t("employer.jobs.bulkDeleteDescription")}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="inline-flex size-9 shrink-0 items-center justify-center rounded-lg text-muted transition-colors hover:bg-primary-light hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 disabled:opacity-60"
            aria-label={t("common.close")}
          >
            <X className="size-5" aria-hidden="true" />
          </button>
        </div>

        <div className="space-y-3 px-4 py-4 sm:px-5">
          <div className="rounded-xl border border-border-subtle bg-hero-bg/60 px-3 py-3">
            <p className="text-sm font-semibold text-foreground">
              {t(jobCount === 1 ? "employer.jobs.jobCountOne" : "employer.jobs.jobCountMany", {
                count: jobCount.toLocaleString("en-IN"),
              })}
            </p>
            {isAll ? (
              <p className="mt-1 text-xs text-muted">
                {t("employer.jobs.applicationsAttached")}{" "}
                <span className="font-semibold text-foreground">
                  {applicationCount.toLocaleString("en-IN")}
                </span>
              </p>
            ) : null}
            <p className="mt-2 text-xs font-semibold text-foreground">
              {t("employer.jobs.permanentlyRemoves")}
            </p>
            <ul className="mt-1 list-disc space-y-0.5 pl-4 text-xs text-muted">
              {CASCADE_DELETE_ITEM_KEYS.map((itemKey) => (
                <li key={itemKey}>{t(itemKey)}</li>
              ))}
            </ul>
          </div>

          <p className="break-words text-xs font-semibold text-pin-state">
            {t("employer.jobs.bulkDeleteWarning")}
          </p>

          {isAll ? (
            <label className="block" htmlFor={confirmId}>
              <span className="mb-1.5 block text-xs font-semibold text-foreground">
                {t("employer.jobs.deleteAllConfirmHint")}
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
            {t("common.cancel")}
          </button>
          <button
            type="button"
            disabled={!canSubmit || isSubmitting}
            onClick={() => onConfirm(isAll ? confirmText.trim() : undefined)}
            className="inline-flex min-h-10 items-center justify-center rounded-lg bg-pin-state px-4 text-sm font-semibold text-surface hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pin-state/30 disabled:opacity-60"
          >
            {isSubmitting
              ? t("employer.common.deleting")
              : isAll
                ? t("employer.jobs.deleteAllJobs")
                : t("employer.jobs.bulkDeleteTitle")}
          </button>
        </div>
      </div>
    </div>
  );
}
