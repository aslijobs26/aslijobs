import { OperationsAvatar } from "../../ui/OperationsAvatar";

import { OperationsCard } from "../../ui/OperationsCard";

import type { TeamWorkloadMember } from "../../../types/operations-dashboard";

import { cn } from "../../../utils/cn";



interface TeamWorkloadSectionProps {

  members: TeamWorkloadMember[];

}



function capacityTone(assigned: number, capacity: number) {

  const ratio = assigned / capacity;

  if (ratio >= 0.9) return "bg-danger";

  if (ratio >= 0.75) return "bg-warning";

  return "bg-primary-soft";

}



export function TeamWorkloadSection({ members }: TeamWorkloadSectionProps) {

  return (

    <OperationsCard title="Team Workload" className="min-w-0">

      <ul className="space-y-3">

        {members.map((member) => {

          const percentage = Math.round((member.assigned / member.capacity) * 100);

          return (

            <li key={member.id}>

              <div className="flex items-center gap-2.5">

                <OperationsAvatar initials={member.initials} size="md" />

                <div className="min-w-0 flex-1">

                  <div className="flex items-center justify-between gap-2">

                    <div className="min-w-0">

                      <p className="truncate text-xs font-medium text-foreground">

                        {member.name}

                      </p>

                      <p className="truncate text-[11px] text-muted">{member.role}</p>

                    </div>

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

