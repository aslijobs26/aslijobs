import { X } from "lucide-react";
import { useEffect, useId, useState, type FormEvent } from "react";
import {
  useCreateOperationsWork,
  useEligibleWorkAssignees,
  useEligibleWorkDepartments,
} from "../../../hooks/use-operations-work";
import { useOperationsPermissions } from "../../../hooks/use-operations-permissions";
import type { WorkItemPriority, WorkItemType } from "../../../types/operations-work";
import { OperationsFilterSelect } from "../jobs/OperationsFilterSelect";
import { workMutationErrorMessage } from "./my-work-errors";
import {
  duePartsToIso,
  dueUrgencyCaption,
  emptyDueParts,
  MyWorkDueDateTimeField,
  suggestPriorityFromDueAt,
  type MyWorkDueParts,
} from "./MyWorkDueDateTimeField";

interface MyWorkCreateDialogProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const TYPE_OPTIONS = [
  { value: "verification", label: "Verification" },
  { value: "support", label: "Support" },
  { value: "job_operations", label: "Job Operations" },
  { value: "jobseeker", label: "Jobseeker" },
  { value: "hiring_operations", label: "Hiring Operations" },
  { value: "placements", label: "Placements" },
  { value: "employer", label: "Employer" },
] as const;

const PRIORITY_OPTIONS = [
  { value: "P1", label: "P1" },
  { value: "P2", label: "P2" },
  { value: "P3", label: "P3" },
] as const;

type AssignMode = "none" | "team_queue" | "user";

export function MyWorkCreateDialog({
  open,
  onClose,
  onSuccess,
}: MyWorkCreateDialogProps) {
  const titleId = useId();
  const { canKey, user } = useOperationsPermissions();
  const canAssign = canKey("my_work.assign");
  const departmentId = user?.departmentId ?? null;
  const assigneesQuery = useEligibleWorkAssignees({
    enabled: open && canAssign,
  });
  const departmentsQuery = useEligibleWorkDepartments({
    enabled: open && canAssign,
  });
  const createMutation = useCreateOperationsWork();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [type, setType] = useState<WorkItemType>("support");
  const [priority, setPriority] = useState<WorkItemPriority>("P2");
  const [priorityManual, setPriorityManual] = useState(false);
  const [assignMode, setAssignMode] = useState<AssignMode>("none");
  const [assigneeId, setAssigneeId] = useState("");
  const [teamDepartmentId, setTeamDepartmentId] = useState("");
  const [dueParts, setDueParts] = useState<MyWorkDueParts>(() => emptyDueParts());
  const [relatedLabel, setRelatedLabel] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setTitle("");
    setDescription("");
    setType("support");
    setPriority("P2");
    setPriorityManual(false);
    setAssignMode(canAssign ? "team_queue" : "none");
    setAssigneeId("");
    setTeamDepartmentId(departmentId ?? "");
    setDueParts(emptyDueParts());
    setRelatedLabel("");
    setError(null);
  }, [open, canAssign, departmentId]);

  useEffect(() => {
    if (!open || !canAssign) return;
    if (teamDepartmentId) return;
    const first = departmentsQuery.data?.[0]?.id;
    if (first) setTeamDepartmentId(first);
  }, [open, canAssign, departmentsQuery.data, teamDepartmentId]);

  if (!open) return null;

  const dueAtIso = duePartsToIso(dueParts);
  const suggestedPriority = suggestPriorityFromDueAt(dueAtIso);

  const handleDueChange = (next: MyWorkDueParts) => {
    setDueParts(next);
    if (!priorityManual) {
      setPriority(suggestPriorityFromDueAt(duePartsToIso(next)));
    }
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);
    if (title.trim().length < 3) {
      setError("Title must be at least 3 characters.");
      return;
    }
    if (canAssign && assignMode === "user" && !assigneeId) {
      setError("Select a team member.");
      return;
    }
    if (canAssign && assignMode === "team_queue" && !teamDepartmentId) {
      setError("Select a department for Team Queue.");
      return;
    }
    try {
      await createMutation.mutateAsync({
        title: title.trim(),
        description: description.trim(),
        type,
        priority,
        relatedLabel: relatedLabel.trim(),
        assignTo: canAssign ? assignMode : "none",
        assignedToUserId:
          canAssign && assignMode === "user" ? assigneeId : null,
        departmentId:
          canAssign && assignMode === "team_queue"
            ? teamDepartmentId
            : departmentId ?? null,
        dueAt: dueAtIso,
      });
      onSuccess();
      onClose();
    } catch (err) {
      setError(workMutationErrorMessage(err, "Failed to create work item."));
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
        className="max-h-[90dvh] w-full max-w-lg overflow-y-auto rounded-xl border border-border-subtle bg-surface p-4 shadow-xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-2">
          <h2 id={titleId} className="text-sm font-semibold text-foreground">
            Create Work Item
          </h2>
          <button
            type="button"
            aria-label="Close"
            onClick={onClose}
            className="rounded-md p-1 text-muted hover:bg-hero-bg"
          >
            <X className="size-4" aria-hidden />
          </button>
        </div>

        <form className="mt-4 flex flex-col gap-3" onSubmit={handleSubmit}>
          <label className="flex flex-col gap-1 text-[11px] font-medium">
            Title
            <input
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="h-9 rounded-md border border-border-subtle px-2.5 text-[12px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
            />
          </label>
          <label className="flex flex-col gap-1 text-[11px] font-medium">
            Description
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="rounded-md border border-border-subtle px-2.5 py-2 text-[12px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
            />
          </label>
          <OperationsFilterSelect
            label="Type"
            value={type}
            options={TYPE_OPTIONS}
            onChange={(value) => setType(value as WorkItemType)}
            hideSearch
            mobileSheet
          />
          <label className="flex flex-col gap-1 text-[11px] font-medium">
            Related label
            <input
              value={relatedLabel}
              onChange={(e) => setRelatedLabel(e.target.value)}
              className="h-9 rounded-md border border-border-subtle px-2.5 text-[12px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
            />
          </label>

          {canAssign ? (
            <fieldset className="flex flex-col gap-2 rounded-md border border-border-subtle p-3">
              <legend className="px-1 text-[11px] font-semibold text-foreground">
                Assignment
              </legend>
              <label className="flex items-center gap-2 text-[12px]">
                <input
                  type="radio"
                  name="create-assign-mode"
                  checked={assignMode === "team_queue"}
                  onChange={() => setAssignMode("team_queue")}
                />
                My Team Queue
              </label>
              <label className="flex items-center gap-2 text-[12px]">
                <input
                  type="radio"
                  name="create-assign-mode"
                  checked={assignMode === "user"}
                  onChange={() => setAssignMode("user")}
                />
                Specific team member
              </label>
              <label className="flex items-center gap-2 text-[12px]">
                <input
                  type="radio"
                  name="create-assign-mode"
                  checked={assignMode === "none"}
                  onChange={() => setAssignMode("none")}
                />
                Unassigned (creator queue)
              </label>

              {assignMode === "team_queue" ? (
                <OperationsFilterSelect
                  label="Department"
                  value={teamDepartmentId}
                  options={[
                    { value: "", label: "Select department" },
                    ...(departmentsQuery.data ?? []).map((dept) => ({
                      value: dept.id,
                      label: dept.name,
                    })),
                  ]}
                  onChange={setTeamDepartmentId}
                  mobileSheet
                />
              ) : null}

              {assignMode === "user" ? (
                <OperationsFilterSelect
                  label="Team member"
                  value={assigneeId}
                  options={[
                    { value: "", label: "Select team member" },
                    ...(assigneesQuery.data ?? []).map((user) => ({
                      value: user.id,
                      label: user.fullName,
                    })),
                  ]}
                  onChange={setAssigneeId}
                  mobileSheet
                />
              ) : null}
            </fieldset>
          ) : (
            <p className="text-[11px] text-muted">
              Without assign permission, work is created without a team
              assignment target.
            </p>
          )}

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
          {error ? <p className="text-[11px] text-danger">{error}</p> : null}
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="h-8 rounded-lg px-3 text-[11px] font-semibold text-muted hover:bg-hero-bg"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={createMutation.isPending}
              className="h-8 rounded-lg bg-primary px-3 text-[11px] font-semibold text-white disabled:opacity-60"
            >
              {createMutation.isPending ? "Creating…" : "Create"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
