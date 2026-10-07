import { CircleAlert, X } from "lucide-react";
import { useEffect, useId, useRef } from "react";

interface OperationsAlertDialogProps {
  open: boolean;
  title?: string;
  message: string;
  onClose: () => void;
}

export function OperationsAlertDialog({
  open,
  title = "Unable to continue",
  message,
  onClose,
}: OperationsAlertDialogProps) {
  const titleId = useId();
  const descriptionId = useId();
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const focusTimer = window.setTimeout(() => {
      closeButtonRef.current?.focus();
    }, 20);

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
      }
    };
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.clearTimeout(focusTimer);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [onClose, open]);

  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[80]" role="presentation">
      <button
        type="button"
        aria-label="Dismiss message"
        className="absolute inset-0 bg-foreground/25 backdrop-blur-[3px] sm:bg-foreground/20 sm:backdrop-blur-sm"
        onClick={onClose}
      />

      <div className="absolute inset-0 flex items-end justify-center p-0 sm:items-center sm:p-6">
        <div
          role="alertdialog"
          aria-modal="true"
          aria-labelledby={titleId}
          aria-describedby={descriptionId}
          className="relative w-full max-w-[26rem] overflow-hidden rounded-t-2xl border border-border-subtle bg-surface px-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-4 shadow-[0_24px_64px_rgba(26,43,60,0.18)] sm:rounded-2xl sm:px-6 sm:pb-5 sm:pt-5"
        >
          <div className="flex items-start gap-3">
            <span
              className="mt-0.5 inline-flex size-9 shrink-0 items-center justify-center rounded-full bg-danger/10 text-danger"
              aria-hidden="true"
            >
              <CircleAlert className="size-[18px]" strokeWidth={2} />
            </span>
            <div className="min-w-0 flex-1 pt-0.5">
              <h2
                id={titleId}
                className="pr-8 text-[15px] font-semibold tracking-tight text-foreground"
              >
                {title}
              </h2>
              <p
                id={descriptionId}
                className="mt-1.5 text-[12px] leading-relaxed text-muted"
              >
                {message}
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="absolute right-3.5 top-3.5 inline-flex size-8 items-center justify-center rounded-lg text-muted transition-colors hover:bg-hero-bg hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 sm:right-4 sm:top-4"
              aria-label="Close"
            >
              <X className="size-4" aria-hidden="true" />
            </button>
          </div>

          <div className="mt-5 flex justify-end">
            <button
              ref={closeButtonRef}
              type="button"
              onClick={onClose}
              className="inline-flex h-9 min-w-[5.75rem] items-center justify-center rounded-lg bg-primary px-4 text-[12px] font-semibold text-surface transition-colors hover:bg-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
            >
              OK
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
