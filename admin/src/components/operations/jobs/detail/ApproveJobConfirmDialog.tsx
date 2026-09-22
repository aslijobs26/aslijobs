import { useEffect, useId } from "react";

interface ApproveJobConfirmDialogProps {
  open: boolean;
  jobTitle: string;
  jobId: string;
  isSubmitting: boolean;
  isLiveChangeReview?: boolean;
  errorMessage?: string | null;
  onCancel: () => void;
  onConfirm: () => void;
}

export function ApproveJobConfirmDialog({
  open,
  jobTitle,
  jobId,
  isSubmitting,
  isLiveChangeReview = false,
  errorMessage,
  onCancel,
  onConfirm,
}: ApproveJobConfirmDialogProps) {
  const titleId = useId();
  const descriptionId = useId();

  useEffect(() => {
    if (!open) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !isSubmitting) {
        onCancel();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isSubmitting, onCancel, open]);

  if (!open) {
    return null;
  }

  const title = isLiveChangeReview
    ? "Approve and publish changes?"
    : "Approve and publish this job?";
  const description = isLiveChangeReview
    ? "The live listing will be updated and the employer will be notified."
    : "This job will become live for candidates and the employer will be notified.";

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-foreground/40 p-3 sm:items-center sm:p-6"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !isSubmitting) {
          onCancel();
        }
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={descriptionId}
        className="w-full max-w-md rounded-xl border border-border-subtle bg-surface p-4 shadow-[0_16px_40px_color-mix(in_srgb,var(--color-foreground)_18%,transparent)] sm:p-5"
      >
        <h2 id={titleId} className="text-sm font-bold text-foreground">
          {title}
        </h2>
        <p
          id={descriptionId}
          className="mt-1 text-xs leading-relaxed text-muted"
        >
          {description}
        </p>

        <dl className="mt-3 space-y-1.5 rounded-lg border border-border-subtle bg-hero-bg/50 px-3 py-2.5">
          <div className="flex min-w-0 items-baseline justify-between gap-3">
            <dt className="shrink-0 text-[10px] font-semibold uppercase tracking-wide text-muted">
              Job title
            </dt>
            <dd className="min-w-0 truncate text-right text-xs font-semibold text-foreground">
              {jobTitle || "Untitled job"}
            </dd>
          </div>
          <div className="flex min-w-0 items-baseline justify-between gap-3">
            <dt className="shrink-0 text-[10px] font-semibold uppercase tracking-wide text-muted">
              Job ID
            </dt>
            <dd className="font-mono text-xs font-medium text-foreground">
              {jobId}
            </dd>
          </div>
        </dl>

        {errorMessage ? (
          <p className="mt-3 text-xs text-danger" role="alert">
            {errorMessage}
          </p>
        ) : null}

        <div className="mt-4 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <button
            type="button"
            disabled={isSubmitting}
            onClick={onCancel}
            className="inline-flex h-9 items-center justify-center rounded-lg border border-border-subtle px-3.5 text-xs font-semibold text-foreground transition-colors hover:bg-hero-bg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 disabled:cursor-not-allowed disabled:opacity-60"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={isSubmitting}
            onClick={onConfirm}
            className="inline-flex h-9 items-center justify-center rounded-lg bg-primary px-3.5 text-xs font-semibold text-surface transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSubmitting
              ? "Approving…"
              : isLiveChangeReview
                ? "Approve Changes"
                : "Approve & Publish"}
          </button>
        </div>
      </div>
    </div>
  );
}
