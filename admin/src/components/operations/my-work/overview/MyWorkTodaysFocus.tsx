import { CheckCircle2, Circle } from "lucide-react";
import type { OperationsWorkAnalyticsResult } from "../../../../types/operations-work";
import { OperationsCard } from "../../../ui/OperationsCard";
import { cn } from "../../../../utils/cn";

interface MyWorkTodaysFocusProps {
  focus: OperationsWorkAnalyticsResult["focus"] | undefined;
  onViewAll: () => void;
}

export function MyWorkTodaysFocus({ focus, onViewAll }: MyWorkTodaysFocusProps) {
  const items = focus ?? [];

  return (
    <OperationsCard
      title="Today's Focus"
      action={
        <button
          type="button"
          onClick={onViewAll}
          className="text-[11px] font-semibold text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
        >
          View all
        </button>
      }
    >
      {items.length === 0 ? (
        <p className="text-xs text-muted">No focus goals for today.</p>
      ) : (
        <ul className="flex flex-col gap-3">
          {items.map((item) => {
            const pct =
              item.target > 0
                ? Math.min(100, Math.round((item.current / item.target) * 100))
                : 0;
            const done = item.status === "done";
            return (
              <li key={item.id} className="min-w-0">
                <div className="flex items-start gap-2">
                  {done ? (
                    <CheckCircle2
                      className="mt-0.5 size-4 shrink-0 text-success"
                      aria-hidden
                    />
                  ) : (
                    <Circle
                      className="mt-0.5 size-4 shrink-0 text-muted"
                      aria-hidden
                    />
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="text-[12px] font-medium text-foreground">
                      {item.title}
                    </p>
                    {item.id === "response_time" ? (
                      <p
                        className={cn(
                          "mt-1 text-[11px] font-semibold",
                          item.status === "on_track"
                            ? "text-success"
                            : "text-warning",
                        )}
                      >
                        {item.progressLabel}
                      </p>
                    ) : (
                      <>
                        <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-border-subtle">
                          <div
                            className="h-full rounded-full bg-primary"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                        <p className="mt-1 text-[10px] text-muted">
                          {item.progressLabel}
                        </p>
                      </>
                    )}
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
