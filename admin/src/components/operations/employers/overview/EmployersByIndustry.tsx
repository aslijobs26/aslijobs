import type { OperationsEmployersAnalyticsNamedCount } from "../../../../types/operations-employers";
import { OperationsCard } from "../../../ui/OperationsCard";
import { EMPLOYERS_OVERVIEW_BAR_COLORS } from "./employers-overview-theme";

interface EmployersByIndustryProps {
  items: OperationsEmployersAnalyticsNamedCount[];
}

export function EmployersByIndustry({ items }: EmployersByIndustryProps) {
  const maxCount = Math.max(...items.map((item) => item.count), 1);
  const topItems = items.slice(0, 8);

  return (
    <OperationsCard
      title="By Industry"
      subtitle="Employer distribution across industries"
      className="min-w-0"
    >
      {topItems.length === 0 ? (
        <p className="flex min-h-44 items-center justify-center text-center text-xs text-muted">
          No industry data available.
        </p>
      ) : (
        <ul className="flex min-h-44 flex-col justify-center gap-2.5">
          {topItems.map((item, index) => {
            const widthPercent = Math.max(
              8,
              Math.round((item.count / maxCount) * 100),
            );
            const color =
              EMPLOYERS_OVERVIEW_BAR_COLORS[
                index % EMPLOYERS_OVERVIEW_BAR_COLORS.length
              ];

            return (
              <li key={item.id} className="min-w-0">
                <div className="mb-1 flex items-center justify-between gap-2 text-[11px]">
                  <span className="truncate font-medium text-foreground">
                    {item.label}
                  </span>
                  <span className="shrink-0 tabular-nums text-muted">
                    <span className="font-semibold text-foreground">
                      {item.count.toLocaleString("en-IN")}
                    </span>
                    {item.percent != null ? (
                      <span className="ml-1">{item.percent}%</span>
                    ) : null}
                  </span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-hero-bg">
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${widthPercent}%`,
                      backgroundColor: color,
                    }}
                  />
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </OperationsCard>
  );
}
