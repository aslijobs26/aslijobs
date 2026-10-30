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
      className="employer-kpi-grid"
    >
      {EMPLOYER_DASHBOARD_STAT_CARDS.map((card) => {
        const Icon = card.icon;
        const value = values[card.key] ?? 0;
        const trend = growth[card.key];

        return (
          <article
            key={card.key}
            className={cn(
              "employer-kpi-card flex min-h-[5.5rem] min-w-0 flex-col rounded-lg border p-2.5 shadow-sm transition-[box-shadow,border-color] hover:shadow-md sm:min-h-[7.5rem] sm:rounded-xl sm:p-4",
              card.cardClassName,
            )}
          >
            <div className="flex items-start justify-between gap-2">
              <span
                className={cn(
                  "employer-kpi-card__icon inline-flex size-7 items-center justify-center rounded-md sm:size-9 sm:rounded-lg",
                  card.iconWrapClassName,
                )}
                aria-hidden="true"
              >
                <Icon
                  className={cn(
                    "size-3.5 sm:size-4",
                    card.iconClassName,
                  )}
                  strokeWidth={2}
                />
              </span>
            </div>

            <p className="employer-kpi-card__label mt-1.5 break-words text-[0.6875rem] font-medium leading-tight text-muted sm:mt-3 sm:text-xs sm:leading-normal">
              {t(`employer.stats.${card.key}`)}
            </p>

            {isLoading ? (
              <div className="mt-1.5 h-6 w-12 animate-pulse rounded bg-border-subtle/80 sm:mt-2 sm:h-7 sm:w-16" />
            ) : (
              <p
                className={cn(
                  "employer-kpi-card__value mt-0.5 text-xl font-bold tabular-nums leading-none tracking-tight sm:mt-1 sm:text-2xl sm:leading-normal",
                  card.valueClassName,
                )}
              >
                {formatEmployerJobCount(value)}
              </p>
            )}

            {isGrowthLoading ? (
              <div className="mt-auto h-2.5 w-16 animate-pulse rounded bg-border-subtle pt-1 sm:h-3 sm:w-20 sm:pt-2" />
            ) : !isLoading && trend ? (
              <p
                className={cn(
                  "employer-kpi-card__meta mt-auto break-words pt-1 text-[0.625rem] font-medium leading-tight sm:pt-2 sm:text-[0.6875rem] sm:leading-normal",
                  trend.direction === "up" && "text-primary",
                  trend.direction === "down" && "text-pin-state",
                  (trend.direction === "flat" || trend.direction === "new") &&
                    "text-muted",
                )}
              >
                {formatGrowthLabel(t, card.key, trend)}
              </p>
            ) : (
              <p className="employer-kpi-card__meta mt-auto pt-1 text-[0.625rem] font-medium leading-tight text-muted sm:pt-2 sm:text-[0.6875rem] sm:leading-normal">
                {isLoading ? null : t("employer.dashboard.updatedLive")}
              </p>
            )}
          </article>
        );
      })}
    </section>
  );
}
