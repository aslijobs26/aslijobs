import { Briefcase, FileCheck, ShieldCheck, TrendingDown, TrendingUp, UserPlus, Users, type LucideIcon } from "lucide-react";
import { CANDIDATE_OVERVIEW_KPI_VIEWS } from "../../../../constants/operations-candidates-overview";
import type {
  OperationsCandidateOverviewKpi,
  OperationsCandidatesOverviewKpis,
} from "../../../../types/operations-candidates";
import { cn } from "../../../../utils/cn";

interface Props {
  kpis: OperationsCandidatesOverviewKpis;
  /** Card whose jobseekers are shown below; null while the analytics overview is shown. */
  selectedKpi?: OperationsCandidateOverviewKpi | null;
  /** When provided, cards become toggle buttons that open the matching jobseeker list. */
  onSelect?: (kpi: OperationsCandidateOverviewKpi) => void;
}

const CARDS: Array<{
  kpi: OperationsCandidateOverviewKpi;
  icon: LucideIcon;
  tone: string;
  wrap: string;
  card: string;
}> = [
  {
    kpi: "total",
    icon: Users,
    tone: "text-primary",
    wrap: "bg-primary/20",
    card: "border-primary/20 bg-gradient-to-br from-primary/10 to-white dark:from-primary/15 dark:to-surface",
  },
  {
    kpi: "new",
    icon: UserPlus,
    tone: "text-sky-600",
    wrap: "bg-sky-500/20",
    card: "border-sky-200/80 bg-gradient-to-br from-sky-50 to-white dark:border-sky-500/25 dark:from-sky-500/10 dark:to-surface",
  },
  {
    kpi: "complete",
    icon: FileCheck,
    tone: "text-success",
    wrap: "bg-success/20",
    card: "border-success/20 bg-gradient-to-br from-success/10 to-white dark:from-success/15 dark:to-surface",
  },
  {
    kpi: "verified",
    icon: ShieldCheck,
    tone: "text-warning",
    wrap: "bg-warning/20",
    card: "border-warning/25 bg-gradient-to-br from-warning/10 to-white dark:from-warning/15 dark:to-surface",
  },
  {
    kpi: "active",
    icon: Briefcase,
    tone: "text-violet-600",
    wrap: "bg-violet-500/20",
    card: "border-violet-200/80 bg-gradient-to-br from-violet-50 to-white dark:border-violet-500/25 dark:from-violet-500/10 dark:to-surface",
  },
];

export function CandidatesOverviewKpiStrip({
  kpis,
  selectedKpi = null,
  onSelect,
}: Props) {
  return (
    <section
      aria-label="Jobseeker overview KPIs"
      className="grid grid-cols-2 gap-2.5 max-lg:gap-2 max-sm:gap-1.5 lg:grid-cols-5"
    >
      {CARDS.map((card) => {
        const Icon = card.icon;
        const view = CANDIDATE_OVERVIEW_KPI_VIEWS[card.kpi];
        const formattedValue = kpis[view.valueKey].toLocaleString("en-IN");
        const trend = kpis[view.trendKey];
        const isUp = trend != null && trend >= 0;
        const TrendIcon = isUp ? TrendingUp : TrendingDown;
        const selected = selectedKpi === card.kpi;
        const cardClassName = cn(
          "ops-brand-border-glow flex min-w-0 flex-col justify-between rounded-xl border p-3.5 text-left shadow-sm max-lg:p-3 max-sm:p-2.5 max-lg:last:col-span-2 lg:last:col-span-1",
          card.card,
          onSelect &&
            "cursor-pointer transition-shadow hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40",
          selected && "ring-2 ring-primary/50",
        );

        const content = (
          <>
            <div className="flex items-start justify-between gap-2 max-sm:gap-1.5">
              <div className="min-w-0">
                <p className="text-[11px] font-medium text-muted max-sm:text-[10px]">
                  {view.label}
                </p>
                <p className="mt-1.5 text-2xl font-bold leading-none tracking-tight tabular-nums text-foreground max-lg:text-xl max-sm:mt-1 max-sm:text-lg">
                  {formattedValue}
                </p>
              </div>
              <span
                className={cn(
                  "inline-flex size-9 shrink-0 items-center justify-center rounded-lg max-lg:size-8 max-sm:size-7",
                  card.wrap,
                  card.tone,
                )}
              >
                <Icon className="size-4 max-sm:size-3.5" aria-hidden="true" />
              </span>
            </div>
            <div className="mt-3 flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] max-sm:mt-2 max-sm:text-[10px]">
              {trend != null ? (
                <span
                  className={cn(
                    "inline-flex items-center gap-0.5 font-semibold",
                    isUp ? "text-success" : "text-danger",
                  )}
                >
                  <TrendIcon className="size-3" aria-hidden="true" />
                  {Math.abs(trend)}%
                </span>
              ) : null}
              <span className="truncate font-medium text-muted">
                {kpis[view.captionKey]}
              </span>
            </div>
          </>
        );

        return onSelect ? (
          <button
            key={card.kpi}
            type="button"
            aria-pressed={selected}
            aria-label={`${view.label}: ${formattedValue}. ${selected ? "Back to overview analytics" : "Show these jobseekers"}`}
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
