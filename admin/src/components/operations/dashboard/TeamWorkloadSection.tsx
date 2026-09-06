import { Link } from "react-router-dom";
import { OPERATIONS_ROUTES } from "../../../constants/operations-routes";
import type { TeamWorkloadMember } from "../../../types/operations-dashboard";
import { OperationsAvatar } from "../../ui/OperationsAvatar";
import { OperationsCard } from "../../ui/OperationsCard";
import { cn } from "../../../utils/cn";

interface TeamWorkloadSectionProps {
  members: TeamWorkloadMember[];
}

function capacityTone(assigned: number, capacity: number) {
  const ratio = assigned / capacity;
  if (ratio >= 0.9) return "bg-danger";
  if (ratio >= 0.75) return "bg-warning";
  return "bg-primary";
}

export function TeamWorkloadSection({ members }: TeamWorkloadSectionProps) {
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
      <ul className="space-y-3">
        {members.map((member) => {
          const percentage = Math.min(
            100,
            Math.round((member.assigned / member.capacity) * 100),
          );
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
                    <p className="truncate text-[12px] font-semibold text-foreground">
                      {member.name}
                    </p>
                    <span className="shrink-0 text-[11px] font-medium tabular-nums text-muted">
                      {member.assigned}/{member.capacity}
                    </span>
                  </div>
                  <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-border-subtle">
                    <div
                      className={cn(
                        "h-full rounded-full transition-all",
                        capacityTone(member.assigned, member.capacity),
                      )}
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </OperationsCard>
  );
}
