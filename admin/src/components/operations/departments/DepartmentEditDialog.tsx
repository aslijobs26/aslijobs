import { useEffect, useId, useState, type FormEvent } from "react";
import type { OperationsDepartment } from "../../../types/operations-team";
import { getOperationsApiErrorMessage } from "../team/team-format";

interface DepartmentEditDialogProps {
  open: boolean;
  department: OperationsDepartment | null;
  isSubmitting: boolean;
  onClose: () => void;
  onSubmit: (input: {
    name: string;
    description: string;
  }) => Promise<void>;
}

export function DepartmentEditDialog({
  open,
  department,
  isSubmitting,
  onClose,
  onSubmit,
}: DepartmentEditDialogProps) {
  const titleId = useId();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open || !department) return;
    setName(department.name);
    setDescription(department.description ?? "");
    setError("");
  }, [department, open]);

  useEffect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !isSubmitting) onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [isSubmitting, onClose, open]);

  if (!open || !department) return null;

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError("");
    const trimmedName = name.trim();
    if (trimmedName.length < 2) {
      setError("Department name is required (min 2 characters).");
      return;
    }
    try {
      await onSubmit({
        name: trimmedName,
        description: description.trim(),
      });
      onClose();
    } catch (submitError) {
      setError(
        getOperationsApiErrorMessage(submitError, "Unable to update department."),
      );
    }
  };

  return (
    <div className="fixed inset-0 z-[60]" role="presentation">
      <button
        type="button"
        aria-label="Close edit department dialog"
        className="absolute inset-0 bg-foreground/25 backdrop-blur-[3px]"
        disabled={isSubmitting}
        onClick={() => {
          if (!isSubmitting) onClose();
        }}
      />
      <div className="absolute inset-0 flex items-end justify-center p-0 sm:items-center sm:p-6">
        <form
          role="dialog"
          aria-modal="true"
          aria-labelledby={titleId}
          onSubmit={(event) => {
            void handleSubmit(event);
          }}
          className="relative w-full max-w-md space-y-3 rounded-t-2xl border border-border-subtle bg-surface p-5 shadow-lg sm:rounded-2xl"
        >
          <h2 id={titleId} className="text-sm font-bold text-foreground">
            Edit department
          </h2>
          <label className="grid gap-1 text-xs font-semibold text-muted">
            Name *
            <input
              value={name}
              onChange={(event) => setName(event.target.value)}
              required
              minLength={2}
              maxLength={80}
              className="h-10 rounded-lg border border-border-subtle bg-hero-bg/50 px-3 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
            />
          </label>
          <label className="grid gap-1 text-xs font-semibold text-muted">
            Code
            <input
              value={department.slug}
              disabled
              className="h-10 rounded-lg border border-border-subtle bg-hero-bg/40 px-3 text-sm text-muted"
            />
            <span className="font-normal text-[10px] text-muted">
              Code is generated from the name and cannot be edited directly.
            </span>
          </label>
          <label className="grid gap-1 text-xs font-semibold text-muted">
            Description
            <textarea
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              rows={3}
              maxLength={400}
              className="rounded-lg border border-border-subtle bg-hero-bg/50 px-3 py-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
            />
          </label>
          {error ? <p className="text-sm text-danger">{error}</p> : null}
          <div className="flex justify-end gap-2 pt-1">
            <button
              type="button"
              disabled={isSubmitting}
              onClick={onClose}
              className="h-9 rounded-lg border border-border-subtle px-3 text-xs font-semibold text-foreground hover:bg-hero-bg disabled:opacity-60"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || name.trim().length < 2}
              className="h-9 rounded-lg bg-primary px-3 text-xs font-semibold text-surface hover:bg-primary-hover disabled:opacity-60"
            >
              {isSubmitting ? "Saving…" : "Save changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
