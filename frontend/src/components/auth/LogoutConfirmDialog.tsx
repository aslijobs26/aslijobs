"use client";

import {
  LOGOUT_CONFIRM_CANCEL_LABEL,
  LOGOUT_CONFIRM_DESCRIPTION,
  LOGOUT_CONFIRM_SUBMIT_LABEL,
  LOGOUT_CONFIRM_SUBMITTING_LABEL,
  LOGOUT_CONFIRM_TITLE,
} from "@/constants/logout";
import { cn } from "@/utils/cn";
import { LogOut, X } from "lucide-react";
import { useEffect, useId, useRef } from "react";

type LogoutConfirmDialogProps = {
  open: boolean;
  isSubmitting?: boolean;
  description?: string;
  onClose: () => void;
  onConfirm: () => void;
};

export function LogoutConfirmDialog({
  open,
  isSubmitting = false,
  description = LOGOUT_CONFIRM_DESCRIPTION,
  onClose,
  onConfirm,
}: LogoutConfirmDialogProps) {
  const titleId = useId();
  const descriptionId = useId();
  const panelRef = useRef<HTMLDivElement>(null);
  const confirmButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !isSubmitting) {
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    const focusTimer = window.setTimeout(() => {
      confirmButtonRef.current?.focus();
    }, 20);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
      window.clearTimeout(focusTimer);
    };
  }, [isSubmitting, onClose, open]);

  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[60]" role="presentation">
      <button
        type="button"
        aria-label="Close logout confirmation"
        className="absolute inset-0 bg-foreground/25 backdrop-blur-[3px] transition-[backdrop-filter,background-color] sm:bg-foreground/20 sm:backdrop-blur-sm"
        disabled={isSubmitting}
        onClick={() => {
          if (!isSubmitting) {
            onClose();
          }
        }}
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
            "relative w-full max-w-md overflow-hidden rounded-t-2xl border border-border-subtle bg-surface outline-none sm:rounded-2xl",
            "px-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-4 shadow-[0_24px_64px_rgba(26,43,60,0.22)] sm:px-6 sm:pb-6 sm:pt-5",
            "ring-1 ring-black/5",
          )}
        >
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="absolute top-3 right-3 inline-flex size-9 items-center justify-center rounded-lg text-muted transition-colors hover:bg-hero-bg hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 disabled:opacity-60"
            aria-label="Close logout confirmation"
          >
            <X className="size-4" strokeWidth={2.25} aria-hidden="true" />
          </button>

          <div className="flex flex-col items-center px-1 pt-3 text-center sm:pt-4">
            <span className="inline-flex size-14 items-center justify-center rounded-full bg-benefit-ai-matching-surface text-pin-state ring-1 ring-pin-state/15">
              <LogOut className="size-7" strokeWidth={2} aria-hidden="true" />
            </span>

            <h2
              id={titleId}
              className="mt-4 text-lg font-bold tracking-tight text-foreground sm:text-xl"
            >
              {LOGOUT_CONFIRM_TITLE}
            </h2>
            <p
              id={descriptionId}
              className="mt-2 max-w-[22rem] text-sm leading-relaxed text-muted"
            >
              {description}
            </p>
          </div>

          <div className="mt-5 flex flex-col gap-2.5 sm:mt-6">
            <button
              ref={confirmButtonRef}
              type="button"
              onClick={onConfirm}
              disabled={isSubmitting}
              className="inline-flex h-11 w-full items-center justify-center rounded-xl border border-pin-state/30 bg-pin-state px-4 text-sm font-semibold text-surface transition-colors hover:bg-pin-state/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pin-state/30 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSubmitting
                ? LOGOUT_CONFIRM_SUBMITTING_LABEL
                : LOGOUT_CONFIRM_SUBMIT_LABEL}
            </button>
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="inline-flex h-11 w-full items-center justify-center rounded-xl border border-border-subtle bg-surface px-4 text-sm font-semibold text-foreground transition-colors hover:bg-hero-bg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {LOGOUT_CONFIRM_CANCEL_LABEL}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
