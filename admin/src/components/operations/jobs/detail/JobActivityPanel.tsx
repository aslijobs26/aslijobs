import { OperationsCard } from "../../../ui/OperationsCard";
import type { OperationsJobActivityItem } from "../../../../types/operations-jobs";
import { formatOperationsDateTime } from "./job-detail-format";

interface JobActivityPanelProps {
  activity: OperationsJobActivityItem[];
}

export function JobActivityPanel({ activity }: JobActivityPanelProps) {
  return (
    <OperationsCard title="Job Activity">
      {activity.length === 0 ? (
        <p className="text-xs text-muted">No activity recorded for this job.</p>
      ) : (
        <ol className="space-y-3">
          {activity.map((item, index) => (
            <li key={item.id} className="relative flex gap-3">
              <div className="flex flex-col items-center">
                <span className="mt-1 size-2.5 shrink-0 rounded-full bg-primary-soft" />
                {index < activity.length - 1 ? (
                  <span className="mt-1 w-px flex-1 bg-border-subtle" aria-hidden="true" />
                ) : null}
              </div>
              <div className="min-w-0 pb-2">
                <p className="text-xs font-semibold text-foreground">{item.label}</p>
                <p className="mt-0.5 text-[11px] text-muted">
                  {formatOperationsDateTime(item.at)}
                </p>
              </div>
            </li>
          ))}
        </ol>
      )}
    </OperationsCard>
  );
}
