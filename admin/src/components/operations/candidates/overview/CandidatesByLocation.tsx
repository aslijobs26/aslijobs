import type { OperationsCandidatesAnalyticsNamedCount } from "../../../../types/operations-candidates";
import { OperationsCard } from "../../../ui/OperationsCard";

export function CandidatesByLocation({ items }: { items: OperationsCandidatesAnalyticsNamedCount[] }) {
  const topItems = items.slice(0, 8);
  const maxCount = Math.max(...topItems.map((item) => item.count), 1);
  return (
    <OperationsCard
      title="By Location"
      subtitle="Top jobseeker locations"
      className="candidates-analytics-card min-w-0"
    >
      {topItems.length === 0 ? (
        <p className="flex min-h-44 items-center justify-center text-center text-xs text-muted xl:min-h-36">
          No location data available.
        </p>
      ) : (
        <ul className="flex min-h-44 flex-col justify-center gap-2.5 xl:min-h-36 xl:gap-2">
          {topItems.map((item) => (
            <li key={item.id} className="min-w-0">
              <div className="mb-1 flex items-center justify-between gap-2 text-[11px] xl:mb-0.5 xl:text-[10px]">
                <span className="truncate font-medium text-foreground">{item.label}</span>
                <span className="shrink-0 font-semibold tabular-nums text-foreground">
                  {item.count.toLocaleString("en-IN")}
                </span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-hero-bg xl:h-1.5">
                <div
                  className="h-full rounded-full bg-primary"
                  style={{
                    width: `${Math.max(8, Math.round((item.count / maxCount) * 100))}%`,
                  }}
                />
              </div>
            </li>
          ))}
        </ul>
      )}
    </OperationsCard>
  );
}
