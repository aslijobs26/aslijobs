import { Link } from "react-router-dom";
import { OPERATIONS_ROUTES } from "../../../constants/operations-routes";
import type {
  TeamWorkloadMember,
  TeamWorkloadStatus,
} from "../../../types/operations-dashboard";
import { OperationsAvatar } from "../../ui/OperationsAvatar";
import { OperationsCard } from "../../ui/OperationsCard";
import { cn } from "../../../utils/cn";

interface TeamWorkloadSectionProps {
  members: TeamWorkloadMember[];
  status?: TeamWorkloadStatus;
}

function capacityTone(assigned: number, capacity: number) {
  const ratio = assigned / capacity;
  if (ratio >= 0.9) return "bg-danger";
  if (ratio >= 0.75) return "bg-warning";
  return "bg-primary";
}

function hasWorkloadCounts(member: TeamWorkloadMember) {
  return (
    member.assigned != null &&
    member.capacity != null &&
    member.capacity > 0
  );
}

export function TeamWorkloadSection({
  members,
  status,
}: TeamWorkloadSectionProps) {
  const isLoading = status?.isLoading ?? false;
  const isError = status?.isError ?? false;
  const isEmpty = status?.isEmpty ?? members.length === 0;

  return (
    <OperationsCard
      title="Team Workload"
      className="min-w-0"
      action={
        <Link
          to={OPERATIONS_ROUTES.TEAM_MANAGEMENT}
          className="text-[12px] font-semibold text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
        >
          View team →
        </Link>
      }
    >
      {isLoading ? (
        <p className="text-[12px] text-muted" role="status">
          Loading team…
        </p>
      ) : isError ? (
        <p className="text-[12px] text-muted" role="alert">
          Unable to load team members.
        </p>
      ) : isEmpty ? (
        <p className="text-[12px] text-muted">No active team members yet.</p>
      ) : (
        <ul className="space-y-3">
          {members.map((member) => {
            const showWorkload = hasWorkloadCounts(member);
            const assigned = member.assigned ?? 0;
            const capacity = member.capacity ?? 0;
            const percentage = showWorkload
              ? Math.min(100, Math.round((assigned / capacity) * 100))
              : 0;

            return (
              <li key={member.id}>
                <div className="flex items-center gap-2.5">
                  <OperationsAvatar
                    initials={member.initials}
                    size="sm"
                    className="size-7 text-[10px]"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <div className="min-w-0">
                        <p className="truncate text-[12px] font-semibold text-foreground">
                          {member.name}
                        </p>
                        <p className="truncate text-[11px] text-muted">
                          {member.role}
                        </p>
                      </div>
                      {showWorkload ? (
                        <span className="shrink-0 text-[11px] font-medium tabular-nums text-muted">
                          {assigned}/{capacity}
                        </span>
                      ) : null}
                    </div>
                    {showWorkload ? (
                      <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-border-subtle">
                        <div
                          className={cn(
                            "h-full rounded-full transition-all",
                            capacityTone(assigned, capacity),
                          )}
                          style={{ width: `${percentage}%` }}
                          aria-hidden
                        />
                      </div>
                    ) : null}
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </OperationsCard>
  );
}
