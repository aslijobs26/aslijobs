"use client";

import { useTranslate } from "@/i18n/translate";
import { X } from "lucide-react";
import { useEffect, useId } from "react";
import { createPortal } from "react-dom";

type EmployerDraftJobDeleteModalProps = {
  jobTitle: string;
  isDeleting: boolean;
  onClose: () => void;
  onConfirm: () => void;
};

export function EmployerDraftJobDeleteModal({
  jobTitle,
  isDeleting,
  onClose,
  onConfirm,
}: EmployerDraftJobDeleteModalProps) {
  const t = useTranslate();
  const titleId = useId();
  const descriptionId = useId();
  const title = jobTitle.trim();

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !isDeleting) {
        onClose();
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [isDeleting, onClose]);

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-end justify-center p-3 sm:items-center sm:p-6">
      <button
        type="button"
        aria-label={t("employer.common.closeDialog")}
        className="absolute inset-0 bg-foreground/40"
        disabled={isDeleting}
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={descriptionId}
        className="relative z-10 w-full max-w-sm overflow-hidden rounded-2xl border border-border-subtle bg-surface shadow-xl"
      >
        <div className="flex items-start justify-between gap-3 px-5 pt-5">
          <div className="min-w-0">
            <h2 id={titleId} className="text-base font-semibold text-foreground">
              {t("employer.jobs.deleteDraftTitle")}
            </h2>
            {title ? (
              <p className="mt-1 truncate text-sm font-medium text-foreground">
                {title}
              </p>
            ) : null}
            <p id={descriptionId} className="mt-2 text-sm leading-6 text-muted">
              {t("employer.jobs.deleteDraftBody")}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isDeleting}
            className="inline-flex size-8 shrink-0 items-center justify-center rounded-lg text-muted transition-colors hover:bg-primary-light hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 disabled:opacity-60"
            aria-label={t("common.close")}
          >
            <X className="size-4" aria-hidden="true" />
          </button>
        </div>
        <div className="flex justify-end gap-2 px-5 py-4">
          <button
            type="button"
            onClick={onClose}
            disabled={isDeleting}
            className="inline-flex h-10 items-center justify-center rounded-lg border border-border-subtle px-4 text-sm font-semibold text-foreground transition-colors hover:bg-primary-light/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 disabled:opacity-60"
          >
            {t("common.cancel")}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isDeleting}
            className="inline-flex h-10 items-center justify-center rounded-lg bg-pin-state px-4 text-sm font-semibold text-surface transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pin-state/30 disabled:opacity-60"
          >
            {isDeleting ? t("employer.common.deleting") : t("common.delete")}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
