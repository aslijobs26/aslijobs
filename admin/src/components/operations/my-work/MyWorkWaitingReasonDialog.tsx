import { X } from "lucide-react";
import { useEffect, useId, useState, type FormEvent } from "react";

interface MyWorkWaitingReasonDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: (reason: string) => void | Promise<void>;
  isSubmitting?: boolean;
  workTitle?: string;
}

export function MyWorkWaitingReasonDialog({
  open,
  onClose,
  onConfirm,
  isSubmitting = false,
  workTitle,
}: MyWorkWaitingReasonDialogProps) {
  const titleId = useId();
  const reasonId = useId();
  const errorId = useId();
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setReason("");
      setError(null);
    }
  }, [open]);

  if (!open) return null;

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    const trimmed = reason.trim();
    if (trimmed.length < 3) {
      setError("Enter a waiting reason (at least 3 characters).");
      return;
    }
    if (trimmed.length > 500) {
      setError("Waiting reason must be 500 characters or fewer.");
      return;
    }
    setError(null);
    await onConfirm(trimmed);
  };

  return (
    <div
      className="fixed inset-0 z-[70] flex items-end justify-center bg-foreground/40 p-3 sm:items-center"
      role="presentation"
      onClick={isSubmitting ? undefined : onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="max-h-[90dvh] w-full max-w-md overflow-y-auto rounded-xl border border-border-subtle bg-surface p-4 shadow-xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-2">
          <div>
            <h2 id={titleId} className="text-sm font-semibold text-foreground">
              Put work on waiting
            </h2>
            {workTitle ? (
              <p className="mt-0.5 text-[11px] text-muted">{workTitle}</p>
            ) : null}
          </div>
          <button
            type="button"
            aria-label="Close"
            onClick={onClose}
            disabled={isSubmitting}
            className="rounded-md p-1 text-muted hover:bg-hero-bg hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
          >
            <X className="size-4" aria-hidden />
          </button>
        </div>

        <form className="mt-4 flex flex-col gap-3" onSubmit={handleSubmit}>
          <div className="flex flex-col gap-1.5">
            <label
              htmlFor={reasonId}
              className="text-[11px] font-semibold text-foreground"
            >
              Waiting reason
            </label>
            <textarea
              id={reasonId}
              value={reason}
              onChange={(event) => {
                setReason(event.target.value);
                if (error) setError(null);
              }}
              rows={4}
              maxLength={500}
              aria-invalid={Boolean(error)}
              aria-describedby={error ? errorId : undefined}
              className="w-full resize-y rounded-md border border-border-subtle bg-surface px-3 py-2 text-[12px] text-foreground placeholder:text-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
              placeholder="e.g. Waiting for employer to upload GST certificate"
              disabled={isSubmitting}
              required
            />
            {error ? (
              <p id={errorId} className="text-[11px] text-danger" role="alert">
                {error}
              </p>
            ) : (
              <p className="text-[10px] text-muted">
                {reason.trim().length}/500
              </p>
            )}
          </div>

          <div className="flex justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="rounded-md border border-border-subtle px-3 py-1.5 text-[12px] font-semibold text-foreground hover:bg-hero-bg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="rounded-md bg-primary px-3 py-1.5 text-[12px] font-semibold text-primary-foreground hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 disabled:opacity-60"
            >
              {isSubmitting ? "Saving…" : "Mark waiting"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
