import {
  CheckCircle2,
  Clock,
  Timer,
  TrendingDown,
  TrendingUp,
  UserCheck,
  UserX,
  type LucideIcon,
} from "lucide-react";
import {
  PLACEMENT_OVERVIEW_KPI_VIEWS,
  type PlacementOverviewKpi,
} from "../../../../constants/operations-placements-overview";
import type { OperationsPlacementsOverviewKpis } from "../../../../types/operations-placements";
import { cn } from "../../../../utils/cn";

interface PlacementsOverviewKpiStripProps {
  kpis: OperationsPlacementsOverviewKpis;
  /** Card whose placements are shown below; null while the analytics overview is shown. */
  selectedKpi?: PlacementOverviewKpi | null;
  /** When provided, cards become toggle buttons that open the matching placement list. */
  onSelect?: (kpi: PlacementOverviewKpi) => void;
}

const KPI_CARDS: {
  kpi: PlacementOverviewKpi;
  icon: LucideIcon;
  cardBg: string;
  iconWrap: string;
  iconColor: string;
}[] = [
  {
    kpi: "total",
    icon: UserCheck,
    cardBg:
      "border-primary/20 bg-gradient-to-br from-primary/10 to-white dark:from-primary/15 dark:to-surface",
    iconWrap: "bg-primary/20",
    iconColor: "text-primary",
  },
  {
    kpi: "joined",
    icon: CheckCircle2,
    cardBg:
      "border-success/20 bg-gradient-to-br from-success/10 to-white dark:from-success/15 dark:to-surface",
    iconWrap: "bg-success/20",
    iconColor: "text-success",
  },
  {
    kpi: "joining_pending",
    icon: Clock,
    cardBg:
      "border-warning/25 bg-gradient-to-br from-warning/10 to-white dark:from-warning/15 dark:to-surface",
    iconWrap: "bg-warning/20",
    iconColor: "text-warning",
  },
  {
    kpi: "did_not_join",
    icon: UserX,
    cardBg:
      "border-danger/20 bg-gradient-to-br from-danger/10 to-white dark:from-danger/15 dark:to-surface",
    iconWrap: "bg-danger/20",
    iconColor: "text-danger",
  },
  {
    kpi: "avg_time_to_join",
    icon: Timer,
    cardBg:
      "border-violet-200/80 bg-gradient-to-br from-violet-50 to-white dark:border-violet-500/25 dark:from-violet-500/10 dark:to-surface",
    iconWrap: "bg-violet-500/20",
    iconColor: "text-violet-600",
  },
];

function formatCount(value: number | null, isDays?: boolean): string {
  const resolved = value ?? 0;
  if (isDays) {
    return `${resolved.toLocaleString("en-IN", { maximumFractionDigits: 1 })}d`;
  }
  return resolved.toLocaleString("en-IN");
}

export function PlacementsOverviewKpiStrip({
  kpis,
  selectedKpi = null,
  onSelect,
}: PlacementsOverviewKpiStripProps) {
  return (
    <section
      aria-label="Placement overview KPIs"
      className="grid grid-cols-2 gap-2 max-sm:gap-1.5 sm:grid-cols-3 xl:grid-cols-5"
    >
      {KPI_CARDS.map((card) => {
        const Icon = card.icon;
        const view = PLACEMENT_OVERVIEW_KPI_VIEWS[card.kpi];
        const formattedValue = formatCount(kpis[view.valueKey], view.isDays);
        const trend = kpis[view.trendKey];
        const isUp = trend != null && trend >= 0;
        const TrendIcon = isUp ? TrendingUp : TrendingDown;
        const selected = selectedKpi === card.kpi;
        const cardClassName = cn(
          "flex min-w-0 items-start gap-2.5 rounded-xl border p-2.5 text-left shadow-sm max-sm:gap-2 max-sm:p-2 sm:p-3 max-lg:last:col-span-2 sm:last:col-span-1 xl:last:col-span-1",
          card.cardBg,
          onSelect &&
            "cursor-pointer transition-shadow hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40",
          selected && "ring-2 ring-primary/50",
        );

        const content = (
          <>
            <span
              className={cn(
                "inline-flex size-8 shrink-0 items-center justify-center rounded-lg max-sm:size-7",
                card.iconWrap,
                card.iconColor,
              )}
            >
              <Icon className="size-3.5 max-sm:size-3" aria-hidden="true" />
            </span>

            <div className="min-w-0 flex-1">
              <p className="text-lg font-bold leading-none tracking-tight tabular-nums text-foreground max-sm:text-base sm:text-xl">
                {formattedValue}
              </p>
              <p className="mt-1 text-[11px] font-medium text-muted max-sm:text-[10px]">
                {view.label}
              </p>
              <div className="mt-1.5 flex flex-wrap items-center gap-x-1.5 gap-y-0.5 text-[10px] max-sm:mt-1 max-sm:text-[9px]">
                {trend != null ? (
                  <span
                    className={cn(
                      "inline-flex items-center gap-0.5 font-semibold",
                      isUp ? "text-success" : "text-danger",
                    )}
                  >
                    <TrendIcon className="size-2.5" aria-hidden="true" />
                    {Math.abs(trend)}%
                  </span>
                ) : null}
                <span className="truncate font-medium text-muted">
                  {kpis[view.captionKey]}
                </span>
              </div>
            </div>
          </>
        );

        return onSelect ? (
          <button
            key={card.kpi}
            type="button"
            aria-pressed={selected}
            aria-label={`${view.label}: ${formattedValue}. ${selected ? "Back to overview analytics" : "Show these placements"}`}
            onClick={() => onSelect(card.kpi)}
            className={cardClassName}
          >
            {content}
          </button>
        ) : (
          <article key={card.kpi} className={cardClassName}>
            {content}
          </article>
        );
      })}
    </section>
  );
}
