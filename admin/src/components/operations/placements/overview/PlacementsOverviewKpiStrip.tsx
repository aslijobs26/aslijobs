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
import type { OperationsPlacementsOverviewKpis } from "../../../../types/operations-placements";
import { cn } from "../../../../utils/cn";

interface PlacementsOverviewKpiStripProps {
  kpis: OperationsPlacementsOverviewKpis;
}

const KPI_CARDS: {
  valueKey: keyof Pick<
    OperationsPlacementsOverviewKpis,
    | "totalPlacements"
    | "joined"
    | "joiningPending"
    | "didNotJoin"
    | "avgTimeToJoinDays"
  >;
  trendKey: keyof Pick<
    OperationsPlacementsOverviewKpis,
    | "totalPlacementsTrendPercent"
    | "joinedTrendPercent"
    | "joiningPendingTrendPercent"
    | "didNotJoinTrendPercent"
    | "avgTimeToJoinTrendPercent"
  >;
  captionKey: keyof Pick<
    OperationsPlacementsOverviewKpis,
    | "totalPlacementsCaption"
    | "joinedCaption"
    | "joiningPendingCaption"
    | "didNotJoinCaption"
    | "avgTimeToJoinCaption"
  >;
  label: string;
  icon: LucideIcon;
  cardBg: string;
  iconWrap: string;
  iconColor: string;
  isDays?: boolean;
}[] = [
  {
    valueKey: "totalPlacements",
    trendKey: "totalPlacementsTrendPercent",
    captionKey: "totalPlacementsCaption",
    label: "Total Placements",
    icon: UserCheck,
    cardBg:
      "border-primary/20 bg-gradient-to-br from-primary/10 to-white dark:from-primary/15 dark:to-surface",
    iconWrap: "bg-primary/20",
    iconColor: "text-primary",
  },
  {
    valueKey: "joined",
    trendKey: "joinedTrendPercent",
    captionKey: "joinedCaption",
    label: "Joined",
    icon: CheckCircle2,
    cardBg:
      "border-success/20 bg-gradient-to-br from-success/10 to-white dark:from-success/15 dark:to-surface",
    iconWrap: "bg-success/20",
    iconColor: "text-success",
  },
  {
    valueKey: "joiningPending",
    trendKey: "joiningPendingTrendPercent",
    captionKey: "joiningPendingCaption",
    label: "Joining Pending",
    icon: Clock,
    cardBg:
      "border-warning/25 bg-gradient-to-br from-warning/10 to-white dark:from-warning/15 dark:to-surface",
    iconWrap: "bg-warning/20",
    iconColor: "text-warning",
  },
  {
    valueKey: "didNotJoin",
    trendKey: "didNotJoinTrendPercent",
    captionKey: "didNotJoinCaption",
    label: "Did Not Join",
    icon: UserX,
    cardBg:
      "border-danger/20 bg-gradient-to-br from-danger/10 to-white dark:from-danger/15 dark:to-surface",
    iconWrap: "bg-danger/20",
    iconColor: "text-danger",
  },
  {
    valueKey: "avgTimeToJoinDays",
    trendKey: "avgTimeToJoinTrendPercent",
    captionKey: "avgTimeToJoinCaption",
    label: "Avg. Time to Join",
    icon: Timer,
    cardBg:
      "border-violet-200/80 bg-gradient-to-br from-violet-50 to-white dark:border-violet-500/25 dark:from-violet-500/10 dark:to-surface",
    iconWrap: "bg-violet-500/20",
    iconColor: "text-violet-600",
    isDays: true,
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
}: PlacementsOverviewKpiStripProps) {
  return (
    <section
      aria-label="Placement overview KPIs"
      className="grid grid-cols-2 gap-2 max-sm:gap-1.5 sm:grid-cols-3 xl:grid-cols-5"
    >
      {KPI_CARDS.map((card) => {
        const Icon = card.icon;
        const trend = kpis[card.trendKey];
        const isUp = trend != null && trend >= 0;
        const TrendIcon = isUp ? TrendingUp : TrendingDown;
        const rawValue = kpis[card.valueKey];

        return (
          <article
            key={card.valueKey}
            className={cn(
              "flex min-w-0 items-start gap-2.5 rounded-xl border p-2.5 shadow-sm max-sm:gap-2 max-sm:p-2 sm:p-3 max-lg:last:col-span-2 sm:last:col-span-1 xl:last:col-span-1",
              card.cardBg,
            )}
          >
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
                {formatCount(rawValue, card.isDays)}
              </p>
              <p className="mt-1 text-[11px] font-medium text-muted max-sm:text-[10px]">
                {card.label}
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
                  {kpis[card.captionKey]}
                </span>
              </div>
            </div>
          </article>
        );
      })}
    </section>
  );
}
