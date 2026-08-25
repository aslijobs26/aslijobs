import { useEffect, useId, useRef, useState, type FormEvent } from "react";
import {
  OperationsFormField,
  operationsFieldTextareaClassName,
} from "../../../ui/OperationsFormField";
import { cn } from "../../../../utils/cn";

interface CloseJobConfirmDialogProps {
  open: boolean;
  jobTitle: string;
  jobId: string;
  defaultReason?: string;
  isSubmitting: boolean;
  submitLabel?: string;
  errorMessage?: string | null;
  onCancel: () => void;
  onConfirm: (reason: string) => void;
}

export function CloseJobConfirmDialog({
  open,
  jobTitle,
  jobId,
  defaultReason = "",
  isSubmitting,
  submitLabel = "Close Job / Send",
  errorMessage,
  onCancel,
  onConfirm,
}: CloseJobConfirmDialogProps) {
  const titleId = useId();
  const reasonId = useId();
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [reason, setReason] = useState(defaultReason);
  const [validationError, setValidationError] = useState("");

  useEffect(() => {
    if (!open) {
      return;
    }

    setReason(defaultReason);
    setValidationError("");

    const frame = window.requestAnimationFrame(() => {
      textareaRef.current?.focus();
    });

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !isSubmitting) {
        onCancel();
      }
    };

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      window.cancelAnimationFrame(frame);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [defaultReason, isSubmitting, onCancel, open]);

  if (!open) {
    return null;
  }

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmed = reason.trim();
    if (!trimmed) {
      setValidationError("Enter a reason before closing this job.");
      textareaRef.current?.focus();
      return;
    }

    setValidationError("");
    onConfirm(trimmed);
  };

  const fieldError = validationError || errorMessage || "";

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
        className="w-full max-w-md rounded-xl border border-border-subtle bg-surface p-4 shadow-[0_16px_40px_color-mix(in_srgb,var(--color-foreground)_18%,transparent)] sm:p-5"
      >
        <h2 id={titleId} className="text-sm font-bold text-foreground">
          Close this job?
        </h2>
        <p className="mt-1 text-xs leading-relaxed text-muted">
          This listing will be closed and the assigned employer will be notified
          with your reason.
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

        <form className="mt-4" onSubmit={handleSubmit}>
          <OperationsFormField
            label="Reason for closing this job"
            htmlFor={reasonId}
            required
            error={fieldError}
          >
            <textarea
              ref={textareaRef}
              id={reasonId}
              name="closeReason"
              rows={4}
              value={reason}
              disabled={isSubmitting}
              placeholder="Enter why Operations is closing this job. This reason is sent to the employer."
              className={cn(
                operationsFieldTextareaClassName,
                fieldError && "border-danger focus-visible:border-danger",
              )}
              onChange={(event) => {
                setReason(event.target.value);
                if (validationError) {
                  setValidationError("");
                }
              }}
            />
          </OperationsFormField>

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
              type="submit"
              disabled={isSubmitting || !reason.trim()}
              className="inline-flex h-9 items-center justify-center rounded-lg bg-danger px-3.5 text-xs font-semibold text-surface transition-colors hover:bg-danger/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-danger/30 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSubmitting ? "Closing…" : submitLabel}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
