"use client";

import { ROUTES } from "@/constants/routes";
import { useTranslate } from "@/i18n/translate";
import { cn } from "@/utils/cn";
import { Clock3, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useId, useRef } from "react";

type EmployerVerificationUnderReviewModalProps = {
  onClose: () => void;
};

export function EmployerVerificationUnderReviewModal({
  onClose,
}: EmployerVerificationUnderReviewModalProps) {
  const t = useTranslate();
  const router = useRouter();
  const titleId = useId();
  const descriptionId = useId();
  const primaryButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    const focusTimer = window.setTimeout(
      () => primaryButtonRef.current?.focus(),
      20,
    );

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
      window.clearTimeout(focusTimer);
    };
  }, [onClose]);

  const title = t("employer.verification.underReviewTitle");

  const handleViewAccountStatus = () => {
    router.push(ROUTES.EMPLOYER_COMPANY_PROFILE);
  };

  return (
    <div className="fixed inset-0 z-50" role="presentation">
      <button
        type="button"
        aria-label={t("employer.verification.closeDialogAria")}
        className="absolute inset-0 bg-foreground/45"
        onClick={onClose}
      />

      <div className="absolute inset-0 flex items-end justify-center p-0 sm:items-center sm:p-6">
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby={titleId}
          aria-describedby={descriptionId}
          tabIndex={-1}
          className={cn(
            "relative w-full max-w-[26rem] overflow-hidden rounded-t-2xl border border-border-subtle bg-surface outline-none sm:rounded-2xl",
            "px-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-4 shadow-[0_24px_64px_rgba(26,43,60,0.18)] sm:px-6 sm:pb-6 sm:pt-5",
          )}
        >
          <button
            type="button"
            onClick={onClose}
            className="absolute top-3 right-3 inline-flex size-11 items-center justify-center rounded-lg text-muted transition-colors hover:bg-hero-bg hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
            aria-label={t("employer.verification.closeNamedAria", { title })}
          >
            <X className="size-4" strokeWidth={2.25} aria-hidden="true" />
          </button>

          <div className="flex flex-col items-center px-1 pt-3 text-center sm:pt-4">
            <span className="inline-flex size-14 items-center justify-center rounded-full bg-amber-50 text-amber-700 ring-1 ring-amber-200">
              <Clock3 className="size-7" strokeWidth={2} aria-hidden="true" />
            </span>

            <h2
              id={titleId}
              className="mt-4 text-lg font-bold tracking-tight break-words text-foreground sm:text-xl"
            >
              {title}
            </h2>
            <p
              id={descriptionId}
              className="mt-2 max-w-[22rem] text-sm leading-relaxed text-muted"
            >
              {t("employer.verification.underReviewBody")}
            </p>
          </div>

          <p className="mt-5 rounded-xl border border-border-subtle bg-hero-bg/70 px-4 py-3.5 text-center text-sm leading-relaxed break-words text-foreground sm:mt-6">
            {t("employer.verification.underReviewSupport")}
          </p>

          <div className="mt-5 flex flex-col gap-2.5 sm:mt-6">
            <button
              ref={primaryButtonRef}
              type="button"
              onClick={handleViewAccountStatus}
              className="inline-flex h-11 w-full items-center justify-center rounded-xl bg-primary-soft px-4 text-sm font-semibold text-white transition-colors hover:bg-primary-soft-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
            >
              {t("employer.verification.pendingProfileCta")}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="inline-flex h-11 w-full items-center justify-center rounded-xl border border-border-subtle bg-surface px-4 text-sm font-semibold text-foreground transition-colors hover:bg-hero-bg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
            >
              {t("common.close")}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
