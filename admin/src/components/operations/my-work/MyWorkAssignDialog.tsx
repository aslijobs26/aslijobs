import { X } from "lucide-react";
import { useEffect, useId, useState, type FormEvent } from "react";
import {
  useAssignOperationsWork,
  useEligibleWorkAssignees,
} from "../../../hooks/use-operations-work";
import type {
  OperationsWorkListItem,
  WorkItemPriority,
} from "../../../types/operations-work";
import { OperationsFilterSelect } from "../jobs/OperationsFilterSelect";
import { workMutationErrorMessage } from "./my-work-errors";
import {
  duePartsFromIso,
  duePartsToIso,
  dueUrgencyCaption,
  emptyDueParts,
  MyWorkDueDateTimeField,
  suggestPriorityFromDueAt,
  type MyWorkDueParts,
} from "./MyWorkDueDateTimeField";

interface MyWorkAssignDialogProps {
  open: boolean;
  mode: "assign" | "reassign";
  item: OperationsWorkListItem | null;
  onClose: () => void;
  onSuccess: () => void;
}

const PRIORITY_OPTIONS = [
  { value: "P1", label: "P1 — Urgent" },
  { value: "P2", label: "P2 — Important" },
  { value: "P3", label: "P3 — Normal" },
] as const;

export function MyWorkAssignDialog({
  open,
  mode,
  item,
  onClose,
  onSuccess,
}: MyWorkAssignDialogProps) {
  const titleId = useId();
  const assigneesQuery = useEligibleWorkAssignees({ enabled: open });
  const assignMutation = useAssignOperationsWork();
  const [assigneeId, setAssigneeId] = useState("");
  const [priority, setPriority] = useState<WorkItemPriority>("P2");
  const [priorityManual, setPriorityManual] = useState(false);
  const [dueParts, setDueParts] = useState<MyWorkDueParts>(() => emptyDueParts());
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open || !item) return;
    setAssigneeId(item.assignedToUserId ?? "");
    setPriority(item.priority);
    setPriorityManual(false);
    setDueParts(duePartsFromIso(item.dueAt));
    setError(null);
  }, [open, item]);

  if (!open || !item) return null;

  const dueAtIso = duePartsToIso(dueParts);
  const suggestedPriority = suggestPriorityFromDueAt(dueAtIso);

  const assigneeOptions = [
    { value: "", label: "Select assignee" },
    ...(assigneesQuery.data ?? []).map((user) => ({
      value: user.id,
      label: user.fullName,
    })),
  ];

  const handleDueChange = (next: MyWorkDueParts) => {
    setDueParts(next);
    if (!priorityManual) {
      setPriority(suggestPriorityFromDueAt(duePartsToIso(next)));
    }
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);
    if (!assigneeId) {
      setError("Select an eligible assignee.");
      return;
    }
    try {
      await assignMutation.mutateAsync({
        id: item.id,
        input: {
          assignedToUserId: assigneeId,
          priority,
          dueAt: dueAtIso,
          expectedRevision: item.revision,
        },
      });
      onSuccess();
      onClose();
    } catch (err) {
      setError(
        workMutationErrorMessage(
          err,
          mode === "reassign"
            ? "Failed to reassign work item."
            : "Failed to assign work item.",
        ),
      );
    }
  };

  return (
    <div
      className="fixed inset-0 z-[70] flex items-end justify-center bg-foreground/40 p-3 sm:items-center"
      role="presentation"
      onClick={onClose}
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
              {mode === "reassign" ? "Reassign Work" : "Assign Work"}
            </h2>
            <p className="mt-0.5 text-[11px] text-muted">{item.title}</p>
          </div>
          <button
            type="button"
            aria-label="Close"
            onClick={onClose}
            className="rounded-md p-1 text-muted hover:bg-hero-bg hover:text-foreground"
          >
            <X className="size-4" aria-hidden />
          </button>
        </div>

        <form className="mt-4 flex flex-col gap-3" onSubmit={handleSubmit}>
          <OperationsFilterSelect
            label="Assign To"
            value={assigneeId}
            options={assigneeOptions}
            onChange={setAssigneeId}
            mobileSheet
          />

          <MyWorkDueDateTimeField
            value={dueParts}
            onChange={handleDueChange}
            hint={dueUrgencyCaption(dueAtIso)}
          />

          <div className="flex min-w-0 flex-col gap-1">
            <OperationsFilterSelect
              label="Priority"
              value={priority}
              options={PRIORITY_OPTIONS}
              onChange={(value) => {
                setPriorityManual(true);
                setPriority(value as WorkItemPriority);
              }}
              hideSearch
              mobileSheet
            />
            {!priorityManual && priority === suggestedPriority ? (
              <p className="text-[10px] text-muted">
                Priority updates automatically from the due date and time (AM/PM).
              </p>
            ) : (
              <button
                type="button"
                className="self-start text-[10px] font-semibold text-primary hover:underline"
                onClick={() => {
                  setPriorityManual(false);
                  setPriority(suggestedPriority);
                }}
              >
                Use suggested {suggestedPriority}
              </button>
            )}
          </div>

          {assigneesQuery.isError ? (
            <p className="text-[11px] text-danger">
              Could not load eligible assignees.
            </p>
          ) : null}
          {error ? <p className="text-[11px] text-danger">{error}</p> : null}

          <div className="mt-1 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="h-8 rounded-lg px-3 text-[11px] font-semibold text-muted hover:bg-hero-bg"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={assignMutation.isPending}
              className="h-8 rounded-lg bg-primary px-3 text-[11px] font-semibold text-white hover:bg-primary-hover disabled:opacity-60"
            >
              {assignMutation.isPending ? "Saving…" : "Save"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
