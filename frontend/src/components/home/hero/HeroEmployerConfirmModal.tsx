"use client";

import { cn } from "@/utils/cn";
import { Users, X } from "lucide-react";
import { useEffect, useId, useRef } from "react";

type HeroEmployerConfirmModalProps = {
  onClose: () => void;
  onContinue: () => void;
};

export function HeroEmployerConfirmModal({
  onClose,
  onContinue,
}: HeroEmployerConfirmModalProps) {
  const titleId = useId();
  const descriptionId = useId();
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    const focusTimer = window.setTimeout(() => panelRef.current?.focus(), 20);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
      window.clearTimeout(focusTimer);
    };
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50" role="presentation">
      <button
        type="button"
        aria-label="Close dialog"
        className="absolute inset-0 bg-foreground/45"
        onClick={onClose}
      />

      <div className="absolute inset-0 flex items-center justify-center p-4 sm:p-6">
        <div
          ref={panelRef}
          role="dialog"
          aria-modal="true"
          aria-labelledby={titleId}
          aria-describedby={descriptionId}
          tabIndex={-1}
          className={cn(
            "relative w-full max-w-[22.5rem] overflow-hidden rounded-2xl border border-border-subtle bg-surface outline-none",
            "px-5 pb-5 pt-4 shadow-[0_24px_64px_rgba(26,43,60,0.18)] sm:max-w-sm sm:px-6 sm:pb-6 sm:pt-5",
          )}
        >
          <button
            type="button"
            onClick={onClose}
            className="absolute top-3 right-3 inline-flex size-9 items-center justify-center rounded-lg text-muted transition-colors hover:bg-hero-bg hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
            aria-label="Close Are you an Employer?"
          >
            <X className="size-4" strokeWidth={2.25} aria-hidden="true" />
          </button>

          <div className="flex flex-col items-center px-1 pt-3 text-center sm:pt-4">
            <span className="inline-flex size-14 items-center justify-center rounded-full bg-employer-icon-surface text-employer-icon ring-1 ring-employer-button/15">
              <Users
                className="size-7 fill-employer-icon"
                strokeWidth={2}
                aria-hidden="true"
              />
            </span>

            <h2
              id={titleId}
              className="mt-4 text-lg font-bold tracking-tight text-foreground sm:text-xl"
            >
              Are you an Employer?
            </h2>
            <p
              id={descriptionId}
              className="mt-2 max-w-[17.5rem] text-sm leading-relaxed text-muted"
            >
              Post jobs and hire suitable candidates through AsliJobs.
            </p>
          </div>

          <div className="mt-5 flex flex-col gap-2.5 sm:mt-6">
            <button
              type="button"
              onClick={onContinue}
              className="inline-flex h-11 w-full items-center justify-center rounded-xl bg-primary px-4 text-sm font-semibold text-surface transition-colors hover:bg-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
            >
              Continue as Employer
            </button>
            <button
              type="button"
              onClick={onClose}
              className="inline-flex h-11 w-full items-center justify-center rounded-xl border border-border-subtle bg-surface px-4 text-sm font-semibold text-foreground transition-colors hover:bg-hero-bg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
