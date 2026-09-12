import { X } from "lucide-react";
import { useEffect, useId, useState, type FormEvent } from "react";
import {
  useBulkAssignOperationsWork,
  useEligibleWorkAssignees,
  useEligibleWorkDepartments,
} from "../../../hooks/use-operations-work";
import type {
  OperationsWorkBulkAssignResult,
  OperationsWorkListItem,
} from "../../../types/operations-work";
import { OperationsFilterSelect } from "../jobs/OperationsFilterSelect";
import { workMutationErrorMessage } from "./my-work-errors";

interface MyWorkBulkAssignDialogProps {
  open: boolean;
  items: OperationsWorkListItem[];
  onClose: () => void;
  onComplete: (result: OperationsWorkBulkAssignResult) => void;
}

export function MyWorkBulkAssignDialog({
  open,
  items,
  onClose,
  onComplete,
}: MyWorkBulkAssignDialogProps) {
  const titleId = useId();
  const confirmId = useId();
  const [targetType, setTargetType] = useState<"department" | "user">(
    "department",
  );
  const [targetId, setTargetId] = useState("");
  const [confirmed, setConfirmed] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<OperationsWorkBulkAssignResult | null>(
    null,
  );

  const canQuery = open && items.length > 0;
  const departmentsQuery = useEligibleWorkDepartments({ enabled: canQuery });
  const assigneesQuery = useEligibleWorkAssignees({ enabled: canQuery });
  const bulkMutation = useBulkAssignOperationsWork();

  useEffect(() => {
    if (!open) return;
    setTargetType("department");
    setTargetId("");
    setConfirmed(false);
    setError(null);
    setResult(null);
  }, [open, items]);

  if (!open) return null;

  const departmentOptions = [
    { value: "", label: "Select department" },
    ...(departmentsQuery.data ?? []).map((dept) => ({
      value: dept.id,
      label: dept.name,
    })),
  ];
  const userOptions = [
    { value: "", label: "Select team member" },
    ...(assigneesQuery.data ?? []).map((user) => ({
      value: user.id,
      label: user.fullName,
    })),
  ];

  const targetLabel =
    targetType === "department"
      ? departmentsQuery.data?.find((d) => d.id === targetId)?.name
      : assigneesQuery.data?.find((u) => u.id === targetId)?.fullName;

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);
    if (!targetId) {
      setError(
        targetType === "department"
          ? "Select a department."
          : "Select a team member.",
      );
      return;
    }
    if (!confirmed) {
      setError("Confirm the bulk assignment before submitting.");
      return;
    }
    try {
      const expectedRevisions = Object.fromEntries(
        items.map((item) => [item.id, item.revision]),
      );
      const response = await bulkMutation.mutateAsync({
        workItemIds: items.map((item) => item.id),
        targetType,
        targetId,
        expectedRevisions,
      });
      setResult(response);
      onComplete(response);
    } catch (err) {
      setError(workMutationErrorMessage(err, "Bulk assignment failed."));
    }
  };

  return (
    <div
      className="fixed inset-0 z-[70] flex items-end justify-center bg-foreground/40 p-3 sm:items-center"
      role="presentation"
      onClick={bulkMutation.isPending ? undefined : onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="max-h-[90dvh] w-full max-w-lg overflow-y-auto rounded-xl border border-border-subtle bg-surface p-4 shadow-xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-2">
          <div>
            <h2 id={titleId} className="text-sm font-semibold text-foreground">
              Bulk Assign Work
            </h2>
            <p className="mt-0.5 text-[11px] text-muted">
              {items.length} selected work item{items.length === 1 ? "" : "s"}
            </p>
          </div>
          <button
            type="button"
            aria-label="Close"
            onClick={onClose}
            disabled={bulkMutation.isPending}
            className="rounded-md p-1 text-muted hover:bg-hero-bg hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
          >
            <X className="size-4" aria-hidden />
          </button>
        </div>

        {result ? (
          <div className="mt-4 flex flex-col gap-3">
            <p className="text-[12px] font-semibold text-foreground">
              {result.succeeded} of {result.requested} assigned
              {result.failed > 0
                ? `. ${result.failed} could not be assigned.`
                : " successfully."}
            </p>
            {result.failures.length > 0 ? (
              <ul className="max-h-40 overflow-y-auto rounded-md border border-border-subtle bg-hero-bg/40 p-2 text-[11px]">
                {result.failures.map((failure) => (
                  <li
                    key={failure.workItemId}
                    className="border-b border-border-subtle py-1.5 last:border-b-0"
                  >
                    <span className="font-semibold">
                      {failure.displayId ?? failure.workItemId}
                    </span>
                    <span className="text-muted"> · {failure.code}</span>
                    <p className="text-danger">{failure.reason}</p>
                  </li>
                ))}
              </ul>
            ) : null}
            <div className="flex justify-end">
              <button
                type="button"
                onClick={onClose}
                className="h-8 rounded-lg bg-primary px-3 text-[11px] font-semibold text-white"
              >
                Done
              </button>
            </div>
          </div>
        ) : (
          <form className="mt-4 flex flex-col gap-3" onSubmit={handleSubmit}>
            <fieldset className="flex flex-col gap-2">
              <legend className="text-[11px] font-semibold text-foreground">
                Assign to
              </legend>
              <label className="flex items-center gap-2 text-[12px]">
                <input
                  type="radio"
                  name="bulk-target-type"
                  checked={targetType === "department"}
                  onChange={() => {
                    setTargetType("department");
                    setTargetId("");
                    setConfirmed(false);
                  }}
                />
                Department (Team Queue)
              </label>
              <label className="flex items-center gap-2 text-[12px]">
                <input
                  type="radio"
                  name="bulk-target-type"
                  checked={targetType === "user"}
                  onChange={() => {
                    setTargetType("user");
                    setTargetId("");
                    setConfirmed(false);
                  }}
                />
                Team member
              </label>
            </fieldset>

            {targetType === "department" ? (
              <OperationsFilterSelect
                label="Department"
                value={targetId}
                options={departmentOptions}
                onChange={(value) => {
                  setTargetId(value);
                  setConfirmed(false);
                }}
                mobileSheet
              />
            ) : (
              <OperationsFilterSelect
                label="Team member"
                value={targetId}
                options={userOptions}
                onChange={(value) => {
                  setTargetId(value);
                  setConfirmed(false);
                }}
                mobileSheet
              />
            )}

            {targetId && targetLabel ? (
              <p className="rounded-md border border-border-subtle bg-hero-bg/50 px-3 py-2 text-[11px] text-foreground">
                Assign {items.length} work item{items.length === 1 ? "" : "s"}{" "}
                to <strong>{targetLabel}</strong>
                {targetType === "department"
                  ? " Team Queue (unassigned)."
                  : "."}
              </p>
            ) : null}

            <label
              htmlFor={confirmId}
              className="flex items-start gap-2 text-[11px] text-foreground"
            >
              <input
                id={confirmId}
                type="checkbox"
                checked={confirmed}
                onChange={(event) => setConfirmed(event.target.checked)}
                className="mt-0.5"
              />
              <span>
                I confirm this bulk assignment of {items.length} item
                {items.length === 1 ? "" : "s"}.
              </span>
            </label>

            {error ? (
              <p className="text-[11px] text-danger" role="alert">
                {error}
              </p>
            ) : null}

            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={onClose}
                disabled={bulkMutation.isPending}
                className="h-8 rounded-lg px-3 text-[11px] font-semibold text-muted hover:bg-hero-bg"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={bulkMutation.isPending || !confirmed || !targetId}
                className="h-8 rounded-lg bg-primary px-3 text-[11px] font-semibold text-white disabled:opacity-60"
              >
                {bulkMutation.isPending ? "Assigning…" : "Confirm assign"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
