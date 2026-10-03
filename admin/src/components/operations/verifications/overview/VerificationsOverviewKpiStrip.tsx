import {
  AlertTriangle,
  Clock,
  ShieldCheck,
  TrendingDown,
  TrendingUp,
  Users,
  XCircle,
  type LucideIcon,
} from "lucide-react";
import { VERIFICATION_OVERVIEW_KPI_VIEWS } from "../../../../constants/operations-verifications-overview";
import type {
  OperationsVerificationOverviewKpi,
  OperationsVerificationsOverviewKpis,
} from "../../../../types/operations-verifications";
import { cn } from "../../../../utils/cn";

interface VerificationsOverviewKpiStripProps {
  kpis: OperationsVerificationsOverviewKpis;
  /** Card whose verifications are shown below; null while the analytics overview is shown. */
  selectedKpi?: OperationsVerificationOverviewKpi | null;
  /** When provided, cards become toggle buttons that open the matching verification list. */
  onSelect?: (kpi: OperationsVerificationOverviewKpi) => void;
}

const KPI_CARDS: {
  kpi: OperationsVerificationOverviewKpi;
  icon: LucideIcon;
  cardBg: string;
  iconWrap: string;
  iconColor: string;
}[] = [
  {
    kpi: "total",
    icon: ShieldCheck,
    cardBg:
      "border-primary/20 bg-gradient-to-br from-primary/10 to-white dark:from-primary/15 dark:to-surface",
    iconWrap: "bg-primary/20",
    iconColor: "text-primary",
  },
  {
    kpi: "pending",
    icon: Clock,
    cardBg:
      "border-sky-200/80 bg-gradient-to-br from-sky-50 to-white dark:border-sky-500/25 dark:from-sky-500/10 dark:to-surface",
    iconWrap: "bg-sky-500/20",
    iconColor: "text-sky-600",
  },
  {
    kpi: "verified",
    icon: Users,
    cardBg:
      "border-success/20 bg-gradient-to-br from-success/10 to-white dark:from-success/15 dark:to-surface",
    iconWrap: "bg-success/20",
    iconColor: "text-success",
  },
  {
    kpi: "needs_attention",
    icon: AlertTriangle,
    cardBg:
      "border-warning/25 bg-gradient-to-br from-warning/10 to-white dark:from-warning/15 dark:to-surface",
    iconWrap: "bg-warning/20",
    iconColor: "text-warning",
  },
  {
    kpi: "rejected",
    icon: XCircle,
    cardBg:
      "border-danger/20 bg-gradient-to-br from-danger/10 to-white dark:from-danger/15 dark:to-surface",
    iconWrap: "bg-danger/20",
    iconColor: "text-danger",
  },
];

function formatCount(value: number): string {
  return value.toLocaleString("en-IN");
}

export function VerificationsOverviewKpiStrip({
  kpis,
  selectedKpi = null,
  onSelect,
}: VerificationsOverviewKpiStripProps) {
  return (
    <section
      aria-label="Verification overview KPIs"
      className="grid grid-cols-2 gap-2 max-sm:gap-1.5 sm:grid-cols-3 xl:grid-cols-5"
    >
      {KPI_CARDS.map((card) => {
        const Icon = card.icon;
        const view = VERIFICATION_OVERVIEW_KPI_VIEWS[card.kpi];
        const formattedValue = formatCount(kpis[view.valueKey]);
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
            aria-label={`${view.label}: ${formattedValue}. ${selected ? "Back to overview analytics" : "Show these verifications"}`}
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
