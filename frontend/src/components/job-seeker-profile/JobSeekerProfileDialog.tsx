"use client";

import { cn } from "@/utils/cn";
import { X } from "lucide-react";
import { useEffect, useId, useRef, type ReactNode } from "react";

type JobSeekerProfileDialogProps = {
  title: string;
  description?: string;
  children: ReactNode;
  footer?: ReactNode;
  onClose: () => void;
  wide?: boolean;
};

export function JobSeekerProfileDialog({
  title,
  description,
  children,
  footer,
  onClose,
  wide = false,
}: JobSeekerProfileDialogProps) {
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
        aria-label={`Close ${title}`}
        className="absolute inset-0 bg-foreground/40"
        onClick={onClose}
      />
      <div className="absolute inset-0 flex items-end justify-center sm:items-center sm:p-5">
        <div
          ref={panelRef}
          role="dialog"
          aria-modal="true"
          aria-labelledby={titleId}
          aria-describedby={description ? descriptionId : undefined}
          tabIndex={-1}
          className={cn(
            "flex max-h-[92dvh] w-full flex-col overflow-hidden rounded-t-2xl border border-border-subtle bg-surface shadow-lg outline-none sm:rounded-2xl",
            wide ? "sm:max-w-4xl" : "sm:max-w-2xl",
          )}
        >
          <header className="flex shrink-0 items-start justify-between gap-4 border-b border-border-subtle px-4 py-4 sm:px-5">
            <div className="min-w-0">
              <h2
                id={titleId}
                className="text-lg font-bold tracking-tight text-foreground"
              >
                {title}
              </h2>
              {description ? (
                <p id={descriptionId} className="mt-1 text-sm text-muted">
                  {description}
                </p>
              ) : null}
            </div>
            <button
              type="button"
              onClick={onClose}
              className="inline-flex size-11 shrink-0 items-center justify-center rounded-lg text-muted hover:bg-primary-light hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
              aria-label={`Close ${title}`}
            >
              <X className="size-5" aria-hidden="true" />
            </button>
          </header>

          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-5 scrollbar-hidden sm:px-5">
            {children}
          </div>

          {footer ? (
            <footer className="shrink-0 border-t border-border-subtle px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:px-5 sm:pb-3">
              {footer}
            </footer>
          ) : null}
        </div>
      </div>
    </div>
  );
}
