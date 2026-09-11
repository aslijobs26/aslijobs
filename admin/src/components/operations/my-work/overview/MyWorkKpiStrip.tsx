import type { OperationsWorkAnalyticsResult } from "../../../../types/operations-work";
import { cn } from "../../../../utils/cn";

interface MyWorkKpiStripProps {
  kpis: OperationsWorkAnalyticsResult["kpis"] | undefined;
  isLoading?: boolean;
  isError?: boolean;
  onSelect: (key: "doNow" | "dueToday" | "upcoming" | "waiting" | "completed") => void;
}

const CARDS: Array<{
  key: "doNow" | "dueToday" | "upcoming" | "waiting" | "completed";
  label: string;
  valueKey: keyof OperationsWorkAnalyticsResult["kpis"];
  captionKey: keyof OperationsWorkAnalyticsResult["kpis"];
  cardClassName: string;
  accentClassName: string;
}> = [
  {
    key: "doNow",
    label: "Do Now",
    valueKey: "doNow",
    captionKey: "doNowCaption",
    cardClassName:
      "border-danger/20 bg-gradient-to-br from-danger/10 to-white dark:from-danger/15 dark:to-surface",
    accentClassName: "text-danger",
  },
  {
    key: "dueToday",
    label: "Due Today",
    valueKey: "dueToday",
    captionKey: "dueTodayCaption",
    cardClassName:
      "border-warning/25 bg-gradient-to-br from-warning/10 to-white dark:from-warning/15 dark:to-surface",
    accentClassName: "text-warning",
  },
  {
    key: "upcoming",
    label: "Upcoming",
    valueKey: "upcoming",
    captionKey: "upcomingCaption",
    cardClassName:
      "border-primary/20 bg-gradient-to-br from-primary/10 to-white dark:from-primary/15 dark:to-surface",
    accentClassName: "text-primary",
  },
  {
    key: "waiting",
    label: "Waiting",
    valueKey: "waiting",
    captionKey: "waitingCaption",
    cardClassName:
      "border-sky-200/80 bg-gradient-to-br from-sky-50 to-white dark:border-sky-500/25 dark:from-sky-500/10 dark:to-surface",
    accentClassName: "text-sky-600",
  },
  {
    key: "completed",
    label: "Completed",
    valueKey: "completedToday",
    captionKey: "completedTodayCaption",
    cardClassName:
      "border-success/20 bg-gradient-to-br from-success/10 to-white dark:from-success/15 dark:to-surface",
    accentClassName: "text-success",
  },
];

export function MyWorkKpiStrip({
  kpis,
  isLoading,
  isError,
  onSelect,
}: MyWorkKpiStripProps) {
  return (
    <section
      aria-label="My Work KPIs"
      className="grid grid-cols-2 gap-2 max-sm:gap-1.5 sm:grid-cols-3 xl:grid-cols-5"
    >
      {CARDS.map((card) => {
        const value = kpis?.[card.valueKey];
        const caption = kpis?.[card.captionKey];
        return (
          <button
            key={card.key}
            type="button"
            onClick={() => onSelect(card.key)}
            disabled={isError}
            className={cn(
              "rounded-xl border p-2.5 text-left shadow-sm transition-[filter,box-shadow] hover:brightness-[0.99] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 max-sm:p-2",
              card.cardClassName,
              isError && "cursor-not-allowed opacity-70",
            )}
          >
            <p className={cn("text-[11px] font-semibold", card.accentClassName)}>
              {card.label}
            </p>
            <p className="mt-1 text-xl font-bold tabular-nums text-foreground max-sm:text-lg">
              {isLoading
                ? "…"
                : isError
                  ? "—"
                  : Number(value ?? 0).toLocaleString("en-IN")}
            </p>
            <p className="mt-1 text-[10px] text-muted">
              {isError
                ? "Unavailable"
                : typeof caption === "string"
                  ? caption
                  : ""}
            </p>
          </button>
        );
      })}
    </section>
  );
}
