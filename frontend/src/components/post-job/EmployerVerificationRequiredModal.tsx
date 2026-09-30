"use client";

import { useTranslate, type MessageKey } from "@/i18n/translate";
import type { EmployerVerificationGateStatus } from "@/utils/employer-verification-required";
import { cn } from "@/utils/cn";
import { Check, Lock, X } from "lucide-react";
import { useEffect, useId, useRef } from "react";

type EmployerVerificationRequiredModalProps = {
  verificationStatus?: EmployerVerificationGateStatus | null;
  showViewDraft?: boolean;
  onCompleteVerification: () => void;
  onContinueLater: () => void;
  onViewDraft?: () => void;
  onClose: () => void;
};

function modalBodyKey(
  verificationStatus: EmployerVerificationGateStatus | null | undefined,
): MessageKey {
  if (verificationStatus === "rejected") {
    return "employer.verification.rejectedBody";
  }
  if (verificationStatus === "pending") {
    return "employer.verification.pendingBody";
  }
  return "employer.verification.body";
}

export function EmployerVerificationRequiredModal({
  verificationStatus,
  showViewDraft = false,
  onCompleteVerification,
  onContinueLater,
  onViewDraft,
  onClose,
}: EmployerVerificationRequiredModalProps) {
  const t = useTranslate();
  const titleId = useId();
  const descriptionId = useId();
  const panelRef = useRef<HTMLDivElement>(null);
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

  const title = t("employer.verification.title");
  const description = t(modalBodyKey(verificationStatus));

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
          ref={panelRef}
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
            <span className="inline-flex size-14 items-center justify-center rounded-full bg-primary-light text-primary ring-1 ring-primary/15">
              <Lock className="size-7" strokeWidth={2} aria-hidden="true" />
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
              {description}
            </p>
          </div>

          <ul className="mt-5 space-y-2.5 rounded-xl border border-border-subtle bg-hero-bg/70 px-4 py-3.5 text-left sm:mt-6">
            <li className="flex items-start gap-2.5 text-sm leading-relaxed text-foreground">
              <Check
                className="mt-0.5 size-4 shrink-0 text-primary-soft"
                strokeWidth={2.5}
                aria-hidden="true"
              />
              <span className="min-w-0 break-words">
                {t("employer.verification.draftPoint")}
              </span>
            </li>
            <li className="flex items-start gap-2.5 text-sm leading-relaxed text-foreground">
              <Check
                className="mt-0.5 size-4 shrink-0 text-primary-soft"
                strokeWidth={2.5}
                aria-hidden="true"
              />
              <span className="min-w-0 break-words">
                {t("employer.verification.verifyPoint")}
              </span>
            </li>
          </ul>

          <p className="mt-3 text-center text-xs leading-relaxed text-muted sm:text-sm">
            {t("employer.verification.draftNote")}
          </p>

          <div className="mt-5 flex flex-col gap-2.5 sm:mt-6">
            <button
              ref={primaryButtonRef}
              type="button"
              onClick={onCompleteVerification}
              className="inline-flex h-11 w-full items-center justify-center rounded-xl bg-primary-soft px-4 text-sm font-semibold text-white transition-colors hover:bg-primary-soft-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
            >
              {t("employer.verification.completeCta")}
            </button>
            <button
              type="button"
              onClick={onContinueLater}
              className="inline-flex h-11 w-full items-center justify-center rounded-xl border border-border-subtle bg-surface px-4 text-sm font-semibold text-foreground transition-colors hover:bg-hero-bg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
            >
              {t("employer.verification.laterCta")}
            </button>
            {showViewDraft && onViewDraft ? (
              <button
                type="button"
                onClick={onViewDraft}
                className="inline-flex h-11 w-full items-center justify-center rounded-xl px-4 text-sm font-semibold text-primary transition-colors hover:bg-primary-light focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
              >
                {t("employer.verification.viewDraftCta")}
              </button>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
