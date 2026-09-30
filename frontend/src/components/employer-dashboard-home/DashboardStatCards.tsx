"use client";

import {
  EMPLOYER_DASHBOARD_STAT_CARDS,
  type EmployerDashboardStatKey,
} from "@/constants/employer-dashboard-home";
import { useTranslate } from "@/i18n/translate";
import { cn } from "@/utils/cn";
import type { EmployerDashboardGrowth } from "@/utils/employer-dashboard-home";
import { formatEmployerJobCount } from "@/utils/employer-jobs-format";

type DashboardStatCardsProps = {
  values: Record<string, number>;
  growth: Partial<Record<string, EmployerDashboardGrowth>>;
  isLoading?: boolean;
  isGrowthLoading?: boolean;
};

type Translate = ReturnType<typeof useTranslate>;

function formatGrowthLabel(
  t: Translate,
  cardKey: EmployerDashboardStatKey,
  trend: EmployerDashboardGrowth,
): string {
  if (cardKey === "activeJobs") {
    return t("employer.dashboard.updatedLive");
  }
  switch (trend.direction) {
    case "up":
      return t("employer.dashboard.growthUp", { percent: trend.percent ?? 0 });
    case "down":
      return t("employer.dashboard.growthDown", {
        percent: trend.percent ?? 0,
      });
    case "new":
      return t("employer.dashboard.growthNew");
    case "flat":
      return t("employer.dashboard.growthFlat");
  }
}

export function DashboardStatCards({
  values,
  growth,
  isLoading = false,
  isGrowthLoading = false,
}: DashboardStatCardsProps) {
  const t = useTranslate();

  return (
    <section
      aria-label={t("employer.dashboard.statsAria")}
      className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-5"
    >
      {EMPLOYER_DASHBOARD_STAT_CARDS.map((card) => {
        const Icon = card.icon;
        const value = values[card.key] ?? 0;
        const trend = growth[card.key];

        return (
          <article
            key={card.key}
            className="flex min-h-[7.5rem] min-w-0 flex-col rounded-xl border border-border-subtle bg-surface p-3.5 shadow-sm transition-shadow hover:shadow-md sm:p-4"
          >
            <div className="flex items-start justify-between gap-2">
              <span
                className={cn(
                  "inline-flex size-9 items-center justify-center rounded-lg",
                  card.iconWrapClassName,
                )}
                aria-hidden="true"
              >
                <Icon className={cn("size-4", card.iconClassName)} strokeWidth={2} />
              </span>
            </div>

            <p className="mt-3 break-words text-xs font-medium text-muted">
              {t(`employer.stats.${card.key}`)}
            </p>

            {isLoading ? (
              <div className="mt-2 h-7 w-16 animate-pulse rounded bg-border-subtle" />
            ) : (
              <p className="mt-1 text-2xl font-bold tabular-nums tracking-tight text-foreground">
                {formatEmployerJobCount(value)}
              </p>
            )}

            {isGrowthLoading ? (
              <div className="mt-auto h-3 w-20 animate-pulse rounded bg-border-subtle pt-2" />
            ) : !isLoading && trend ? (
              <p
                className={cn(
                  "mt-auto break-words pt-2 text-[0.6875rem] font-medium",
                  trend.direction === "up" && "text-primary",
                  trend.direction === "down" && "text-pin-state",
                  (trend.direction === "flat" || trend.direction === "new") &&
                    "text-muted",
                )}
              >
                {formatGrowthLabel(t, card.key, trend)}
              </p>
            ) : (
              <p className="mt-auto pt-2 text-[0.6875rem] font-medium text-muted">
                {isLoading ? null : t("employer.dashboard.updatedLive")}
              </p>
            )}
          </article>
        );
      })}
    </section>
  );
}
