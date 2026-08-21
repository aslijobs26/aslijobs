import { TrendingDown, TrendingUp } from "lucide-react";
import { OperationsCard } from "../../ui/OperationsCard";
import type { JourneyAlertItem } from "../../../types/operations-dashboard";
import { cn } from "../../../utils/cn";

interface JourneyAlertsSectionProps {
  alerts: JourneyAlertItem[];
}

export function JourneyAlertsSection({ alerts }: JourneyAlertsSectionProps) {
  return (
    <OperationsCard title="Journey Alerts" className="min-w-0">
      <ul className="space-y-1.5">
        {alerts.map((alert) => {
          const TrendIcon = alert.trendDirection === "up" ? TrendingUp : TrendingDown;
          return (
            <li
              key={alert.id}
              className="flex items-center justify-between gap-2 rounded-md border border-border-subtle px-2 py-1.5"
            >
              <div className="min-w-0">
                <p className="truncate text-[11px] text-foreground">{alert.label}</p>
                <p
                  className={cn(
                    "mt-0.5 flex items-center gap-0.5 text-[10px]",
                    alert.trendDirection === "up" ? "text-danger" : "text-success",
                  )}
                >
                  <TrendIcon className="size-2.5" aria-hidden="true" />
                  {alert.trendValue}
                </p>
              </div>
              <span className="shrink-0 text-sm font-bold text-foreground">
                {alert.count.toLocaleString("en-IN")}
              </span>
            </li>
          );
        })}
      </ul>
    </OperationsCard>
  );
}
