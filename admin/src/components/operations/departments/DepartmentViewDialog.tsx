import { useEffect, useId, useRef } from "react";
import type { OperationsDepartment } from "../../../types/operations-team";
import { formatOperationsTimestamp } from "../team/team-format";
import { cn } from "../../../utils/cn";

interface DepartmentViewDialogProps {
  open: boolean;
  department: OperationsDepartment | null;
  onClose: () => void;
}

export function DepartmentViewDialog({
  open,
  department,
  onClose,
}: DepartmentViewDialogProps) {
  const titleId = useId();
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    const timer = window.setTimeout(() => closeRef.current?.focus(), 20);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
      window.clearTimeout(timer);
    };
  }, [onClose, open]);

  if (!open || !department) return null;

  const isActive = department.status === "active";

  return (
    <div className="fixed inset-0 z-[60]" role="presentation">
      <button
        type="button"
        aria-label="Close department details"
        className="absolute inset-0 bg-foreground/25 backdrop-blur-[3px]"
        onClick={onClose}
      />
      <div className="absolute inset-0 flex items-end justify-center p-0 sm:items-center sm:p-6">
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby={titleId}
          className="relative w-full max-w-md space-y-3 rounded-t-2xl border border-border-subtle bg-surface p-5 shadow-lg sm:rounded-2xl"
        >
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 id={titleId} className="text-sm font-bold text-foreground">
                {department.name}
              </h2>
              <p className="mt-0.5 text-[11px] text-muted">{department.slug}</p>
            </div>
            <span
              className={cn(
                "inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold capitalize",
                isActive
                  ? "bg-success/10 text-success"
                  : "bg-danger/10 text-danger",
              )}
            >
              {isActive ? "Active" : "Inactive"}
            </span>
          </div>
          <p className="text-[12px] text-muted">
            {department.description || "No description provided."}
          </p>
          <dl className="grid grid-cols-2 gap-2 text-[12px]">
            <div className="rounded-lg border border-border-subtle px-3 py-2">
              <dt className="text-[10px] font-semibold uppercase tracking-wide text-muted">
                Teams
              </dt>
              <dd className="mt-0.5 font-semibold tabular-nums text-foreground">
                {department.teamCount.toLocaleString("en-IN")}
              </dd>
            </div>
            <div className="rounded-lg border border-border-subtle px-3 py-2">
              <dt className="text-[10px] font-semibold uppercase tracking-wide text-muted">
                Members
              </dt>
              <dd className="mt-0.5 font-semibold tabular-nums text-foreground">
                {department.memberCount.toLocaleString("en-IN")}
              </dd>
            </div>
            <div className="col-span-2 rounded-lg border border-border-subtle px-3 py-2">
              <dt className="text-[10px] font-semibold uppercase tracking-wide text-muted">
                Created on
              </dt>
              <dd className="mt-0.5 font-medium text-foreground">
                {formatOperationsTimestamp(department.createdAt)}
              </dd>
            </div>
          </dl>
          <div className="flex justify-end">
            <button
              ref={closeRef}
              type="button"
              onClick={onClose}
              className="h-9 rounded-lg border border-border-subtle px-3 text-xs font-semibold text-foreground hover:bg-hero-bg"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
