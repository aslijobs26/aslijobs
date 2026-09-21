import {
  ArrowDown,
  ArrowUp,
  CheckCircle2,
  Eye,
  Globe2,
  Layers,
  Minus,
  MousePointerClick,
  Users,
  type LucideIcon,
} from "lucide-react";
import type { OperationsAnalyticsKpiCard } from "../../../types/operations-analytics";
import { cn } from "../../../utils/cn";

function formatCount(value: number): string {
  return value.toLocaleString("en-IN");
}

function formatChange(value: number | null): string {
  if (value == null) return "";
  const abs = Math.abs(value);
  const rounded = abs >= 10 ? Math.round(abs) : Math.round(abs * 10) / 10;
  return `${rounded}%`;
}

type KpiTone = {
  card: string;
  iconWrap: string;
  iconColor: string;
  icon: LucideIcon;
};

const KPI_TONES: Record<string, KpiTone> = {
  "unique-visitors": {
    card: "border-violet-200/80 bg-gradient-to-br from-violet-50 to-white dark:border-violet-500/25 dark:from-violet-500/10 dark:to-surface",
    iconWrap: "bg-violet-500/20",
    iconColor: "text-violet-600 dark:text-violet-400",
    icon: Globe2,
  },
  "page-views": {
    card: "border-indigo-200/80 bg-gradient-to-br from-indigo-50 to-white dark:border-indigo-500/25 dark:from-indigo-500/10 dark:to-surface",
    iconWrap: "bg-indigo-500/20",
    iconColor: "text-indigo-600 dark:text-indigo-400",
    icon: Eye,
  },
  sessions: {
    card: "border-orange-200/80 bg-gradient-to-br from-orange-50 to-white dark:border-orange-500/25 dark:from-orange-500/10 dark:to-surface",
    iconWrap: "bg-orange-500/20",
    iconColor: "text-orange-600 dark:text-orange-400",
    icon: MousePointerClick,
  },
  "jobseeker-registrations": {
    card: "border-blue-200/80 bg-gradient-to-br from-blue-50 to-white dark:border-blue-500/25 dark:from-blue-500/10 dark:to-surface",
    iconWrap: "bg-blue-500/20",
    iconColor: "text-blue-600 dark:text-blue-400",
    icon: Users,
  },
  "verified-employers": {
    card: "border-teal-200/80 bg-gradient-to-br from-teal-50 to-white dark:border-teal-500/25 dark:from-teal-500/10 dark:to-surface",
    iconWrap: "bg-teal-500/20",
    iconColor: "text-teal-600 dark:text-teal-400",
    icon: CheckCircle2,
  },
};

const FALLBACK_TONE: KpiTone = {
  card: "border-border-subtle bg-gradient-to-br from-hero-bg to-white dark:from-surface dark:to-surface",
  iconWrap: "bg-primary/15",
  iconColor: "text-primary",
  icon: Layers,
};

interface PlatformKpisStripProps {
  kpis: OperationsAnalyticsKpiCard[];
  rangeLabel: string;
}

export function PlatformKpisStrip({ kpis, rangeLabel }: PlatformKpisStripProps) {
  if (!kpis.length) {
    return (
      <p className="rounded-lg border border-border-subtle bg-surface px-3 py-4 text-center text-sm text-muted">
        No platform KPIs available for {rangeLabel}.
      </p>
    );
  }

  return (
    <section aria-label="Platform KPIs" className="min-w-0">
      <div className="mb-2 flex items-baseline justify-between gap-2">
        <h3 className="text-[13px] font-semibold text-foreground">
          Platform overview
        </h3>
        <p className="text-[11px] text-muted">{rangeLabel}</p>
      </div>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5 xl:grid-cols-5">
        {kpis.map((kpi) => {
          const tone = KPI_TONES[kpi.id] ?? FALLBACK_TONE;
          const Icon = tone.icon;
          const TrendIcon =
            kpi.trendDirection === "up"
              ? ArrowUp
              : kpi.trendDirection === "down"
                ? ArrowDown
                : Minus;
          const trendPositive = kpi.trendDirection === "up";
          const trendNegative = kpi.trendDirection === "down";

          return (
            <article
              key={kpi.id}
              className={cn(
                "min-w-0 rounded-xl border p-2.5 shadow-sm sm:p-3",
                tone.card,
              )}
            >
              <div className="flex items-start justify-between gap-2">
                <p className="min-w-0 truncate text-[10px] font-medium uppercase tracking-wide text-muted sm:text-[11px]">
                  {kpi.label}
                </p>
                <span
                  className={cn(
                    "inline-flex size-7 shrink-0 items-center justify-center rounded-lg sm:size-8",
                    tone.iconWrap,
                    tone.iconColor,
                  )}
                  aria-hidden
                >
                  <Icon className="size-3.5 sm:size-4" strokeWidth={2} />
                </span>
              </div>
              <p className="mt-1.5 text-[18px] font-semibold tabular-nums tracking-tight text-foreground sm:text-[20px]">
                {formatCount(kpi.value)}
              </p>
              {kpi.changePercent != null ? (
                <p
                  className={cn(
                    "mt-1 inline-flex items-center gap-0.5 text-[10px] font-medium sm:text-[11px]",
                    trendPositive && "text-emerald-700",
                    trendNegative && "text-rose-600",
                    !trendPositive && !trendNegative && "text-muted",
                  )}
                >
                  <TrendIcon className="h-3 w-3" aria-hidden />
                  <span>
                    {kpi.changePercent > 0
                      ? "+"
                      : kpi.changePercent < 0
                        ? "−"
                        : ""}
                    {formatChange(kpi.changePercent)} vs prior
                  </span>
                </p>
              ) : (
                <p className="mt-1 text-[10px] text-muted sm:text-[11px]">
                  vs prior period —
                </p>
              )}
            </article>
          );
        })}
      </div>
    </section>
  );
}
