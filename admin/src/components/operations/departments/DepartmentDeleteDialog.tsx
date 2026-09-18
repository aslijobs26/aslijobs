import { useEffect, useId, useRef } from "react";
import { Link } from "react-router-dom";
import { OPERATIONS_ROUTES } from "../../../constants/operations-routes";
import type { OperationsDepartmentDependencies } from "../../../services/operations-departments.service";
import { cn } from "../../../utils/cn";

interface DepartmentDeleteDialogProps {
  open: boolean;
  departmentName: string;
  departmentId?: string;
  isLoadingDependencies: boolean;
  dependencies: OperationsDepartmentDependencies | null;
  isBlocking: boolean;
  isSubmitting: boolean;
  errorMessage?: string | null;
  onCancel: () => void;
  onConfirmDelete: () => void;
}

export function DepartmentDeleteDialog({
  open,
  departmentName,
  departmentId,
  isLoadingDependencies,
  dependencies,
  isBlocking,
  isSubmitting,
  errorMessage,
  onCancel,
  onConfirmDelete,
}: DepartmentDeleteDialogProps) {
  const titleId = useId();
  const descriptionId = useId();
  const confirmRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !isSubmitting) {
        onCancel();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    const focusTimer = window.setTimeout(() => {
      confirmRef.current?.focus();
    }, 20);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
      window.clearTimeout(focusTimer);
    };
  }, [isSubmitting, onCancel, open]);

  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[60]" role="presentation">
      <button
        type="button"
        aria-label="Close delete confirmation"
        className="absolute inset-0 bg-foreground/25 backdrop-blur-[3px] sm:bg-foreground/20 sm:backdrop-blur-sm"
        disabled={isSubmitting}
        onClick={() => {
          if (!isSubmitting) onCancel();
        }}
      />

      <div className="absolute inset-0 flex items-end justify-center p-0 sm:items-center sm:p-6">
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby={titleId}
          aria-describedby={descriptionId}
          className="relative w-full max-w-md overflow-hidden rounded-t-2xl border border-border-subtle bg-surface px-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-4 shadow-[0_24px_64px_rgba(26,43,60,0.18)] sm:rounded-2xl sm:px-6 sm:pb-6 sm:pt-5"
        >
          <h2
            id={titleId}
            className="text-[15px] font-semibold tracking-tight text-foreground"
          >
            Delete Department?
          </h2>

          {isLoadingDependencies ? (
            <p id={descriptionId} className="mt-2 text-[12px] text-muted">
              Checking dependencies for {departmentName}…
            </p>
          ) : isBlocking && dependencies ? (
            <div id={descriptionId} className="mt-2 space-y-3">
              <p className="text-[12px] leading-relaxed text-muted">
                <span className="font-semibold text-foreground">
                  {departmentName}
                </span>{" "}
                cannot be deleted yet. Remove or reassign the dependencies
                below, then try again.
              </p>
              <ul className="space-y-1.5 rounded-lg border border-border-subtle bg-hero-bg/60 px-3 py-2.5 text-[12px] text-foreground">
                <li>
                  Active members:{" "}
                  <strong>{dependencies.activeMembers}</strong>
                </li>
                <li>
                  Scoped roles: <strong>{dependencies.scopedRoles}</strong>
                </li>
                <li>
                  Open My Work items:{" "}
                  <strong>{dependencies.openWorkItems}</strong>
                </li>
                <li>
                  Active teams:{" "}
                  <strong>{dependencies.activeTeams ?? 0}</strong>
                </li>
              </ul>
              <p className="text-[11px] text-muted">
                Removing a member from a department does not delete their
                account — reassign them in People. Archive operational teams
                first if they still belong to this department.
              </p>
            </div>
          ) : (
            <p
              id={descriptionId}
              className="mt-2 text-[12px] leading-relaxed text-muted"
            >
              This archives the department (soft delete). Department:{" "}
              <span className="font-semibold text-foreground">
                {departmentName}
              </span>
              .
            </p>
          )}

          {errorMessage ? (
            <p className="mt-3 text-[12px] text-danger" role="alert">
              {errorMessage}
            </p>
          ) : null}

          <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <button
              type="button"
              disabled={isSubmitting}
              onClick={onCancel}
              className="h-9 rounded-lg border border-border-subtle px-3 text-[12px] font-semibold text-foreground hover:bg-hero-bg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 disabled:opacity-60"
            >
              Cancel
            </button>
            {isBlocking ? (
              <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
                <Link
                  to={
                    departmentId
                      ? `${OPERATIONS_ROUTES.TEAM_MANAGEMENT}?departmentId=${encodeURIComponent(departmentId)}`
                      : OPERATIONS_ROUTES.TEAM_MANAGEMENT
                  }
                  className={cn(
                    "inline-flex h-9 items-center justify-center rounded-lg border border-border-subtle px-3 text-[12px] font-semibold text-foreground hover:bg-hero-bg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30",
                  )}
                  onClick={onCancel}
                >
                  Manage Members
                </Link>
                <Link
                  to={
                    departmentId
                      ? `${OPERATIONS_ROUTES.TEAM_MANAGEMENT}?departmentId=${encodeURIComponent(departmentId)}`
                      : OPERATIONS_ROUTES.TEAM_MANAGEMENT
                  }
                  className={cn(
                    "inline-flex h-9 items-center justify-center rounded-lg bg-primary px-3 text-[12px] font-semibold text-surface hover:bg-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30",
                  )}
                  onClick={onCancel}
                >
                  View Members
                </Link>
              </div>
            ) : (
              <button
                ref={confirmRef}
                type="button"
                disabled={isSubmitting || isLoadingDependencies}
                onClick={onConfirmDelete}
                className="h-9 rounded-lg bg-danger px-3 text-[12px] font-semibold text-surface hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-danger/40 disabled:opacity-60"
              >
                {isSubmitting ? "Deleting…" : "Delete Department"}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
