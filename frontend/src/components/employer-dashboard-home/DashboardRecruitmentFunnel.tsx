"use client";

import { EmployerRegisterSearchableSelect } from "@/components/employer-register/EmployerRegisterSearchableSelect";
import {
  EMPLOYER_DASHBOARD_FUNNEL_PERIOD_OPTIONS,
  EMPLOYER_DASHBOARD_FUNNEL_STAGES,
  type EmployerDashboardFunnelPeriod,
} from "@/constants/employer-dashboard-home";
import { useTranslate } from "@/i18n/translate";
import { cn } from "@/utils/cn";
import type { EmployerDashboardFunnelStage } from "@/utils/employer-dashboard-home";

/** Matches the Interviews status-overview period dropdown. */
const FUNNEL_PERIOD_TRIGGER_CLASS_NAME =
  "!h-8 lg:!h-8 !min-w-[7.5rem] !w-auto !font-medium !shadow-[0_1px_2px_rgba(15,23,42,0.04)] hover:!shadow-[0_1px_2px_rgba(15,23,42,0.06)] rounded-lg border border-border-subtle bg-surface px-2.5 text-xs text-foreground transition-[border-color,box-shadow] hover:border-primary/25 focus-visible:outline-none focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/30";

type DashboardRecruitmentFunnelProps = {
  stages: EmployerDashboardFunnelStage[];
  conversionRate: number;
  period: EmployerDashboardFunnelPeriod;
  onPeriodChange: (period: EmployerDashboardFunnelPeriod) => void;
  isLoading?: boolean;
};

export function DashboardRecruitmentFunnel({
  stages,
  conversionRate,
  period,
  onPeriodChange,
  isLoading = false,
}: DashboardRecruitmentFunnelProps) {
  const t = useTranslate();
  const maxCount = Math.max(...stages.map((stage) => stage.count), 1);
  const periodOptions = EMPLOYER_DASHBOARD_FUNNEL_PERIOD_OPTIONS.map(
    (option) => ({
      value: option.value,
      label: t(`employer.dashboard.funnelPeriod.${option.value}`),
    }),
  );

  return (
    <section className="flex h-full flex-col overflow-hidden rounded-xl border border-border-subtle bg-surface shadow-sm">
      <div className="flex items-center justify-between gap-2 px-3 pt-3 sm:gap-3 sm:px-5 sm:pt-5 lg:px-4 lg:pt-3">
        <h2 className="min-w-0 break-words text-sm font-bold text-foreground sm:text-base lg:text-sm">
          {t("employer.dashboard.recruitmentFunnel")}
        </h2>
        <div className="min-w-[7.5rem] shrink-0">
          <EmployerRegisterSearchableSelect
            id="dashboard-funnel-period"
            label={t("employer.dashboard.funnelPeriodLabel")}
            hideLabel
            hideSearch
            value={period}
            placeholder={t("employer.dashboard.funnelPeriod.this_month")}
            options={periodOptions}
            onChange={(value) =>
              onPeriodChange(value as EmployerDashboardFunnelPeriod)
            }
            triggerClassName={FUNNEL_PERIOD_TRIGGER_CLASS_NAME}
            optionClassName="!py-2 !text-xs"
          />
        </div>
      </div>

      <div className="flex flex-1 flex-col px-3 pb-3 pt-3 sm:px-5 sm:pb-5 sm:pt-5 lg:px-4 lg:pb-3 lg:pt-3">
        <ul
          className="flex flex-1 flex-col justify-center gap-1.5 sm:gap-2.5 lg:gap-1.5"
          aria-label={t("employer.dashboard.funnelStagesAria")}
        >
          {isLoading
            ? Array.from({ length: 6 }).map((_, index) => (
                  <li
                  key={index}
                  className="flex items-center gap-2 sm:gap-2.5"
                  aria-hidden="true"
                >
                  <div className="flex min-w-0 flex-1 justify-center">
                    <div
                      className="h-7 animate-pulse rounded-lg bg-hero-bg sm:h-9 lg:h-8"
                      style={{
                        width: `${EMPLOYER_DASHBOARD_FUNNEL_STAGES[index]?.widthPercent ?? 70}%`,
                      }}
                    />
                  </div>
                  <span className="inline-block h-4 w-8 shrink-0 animate-pulse rounded bg-hero-bg" />
                </li>
              ))
            : EMPLOYER_DASHBOARD_FUNNEL_STAGES.map((stageMeta) => {
                const stageCount =
                  stages.find((item) => item.id === stageMeta.id)?.count ?? 0;
                const stage = {
                  id: stageMeta.id,
                  label: t(`employer.dashboard.funnelStage.${stageMeta.id}`),
                  count: stageCount,
                };
                const fillPercent = Math.max(
                  0,
                  Math.min(100, (stage.count / maxCount) * 100),
                );

                return (
                  <li key={stage.id} className="flex items-center gap-2 sm:gap-2.5">
                    <div className="flex min-w-0 flex-1 justify-center">
                      <div
                        className={cn(
                          "relative flex h-7 w-full items-center justify-center overflow-hidden rounded-lg px-2 text-center text-[0.6875rem] font-semibold sm:h-9 sm:px-3 sm:text-[0.8125rem] lg:h-8 lg:px-2.5 lg:text-[0.75rem]",
                          stageMeta.trackClassName,
                        )}
                        style={{ width: `${stageMeta.widthPercent}%` }}
                        aria-valuemin={0}
                        aria-valuemax={maxCount}
                        aria-valuenow={stage.count}
                        role="meter"
                        aria-label={`${stage.label}: ${stage.count}`}
                      >
                        <span className="absolute inset-0 flex items-center justify-center truncate px-3">
                          {stage.label}
                        </span>

                        <div
                          className={cn(
                            "absolute inset-y-0 left-0 transition-[width] duration-500 ease-out",
                            stageMeta.fillClassName,
                          )}
                          style={{ width: `${fillPercent}%` }}
                          aria-hidden="true"
                        />

                        {/* Same label clipped to the fill so it stays readable over it. */}
                        <span
                          className={cn(
                            "absolute inset-0 flex items-center justify-center truncate px-3 transition-[clip-path] duration-500 ease-out",
                            stageMeta.fillTextClassName,
                          )}
                          style={{
                            clipPath: `inset(0 ${100 - fillPercent}% 0 0)`,
                          }}
                          aria-hidden="true"
                        >
                          {stage.label}
                        </span>
                      </div>
                    </div>
                    <span className="w-8 shrink-0 text-right text-xs font-bold tabular-nums text-foreground sm:w-9 sm:text-sm lg:w-8 lg:text-xs">
                      {stage.count.toLocaleString("en-IN")}
                    </span>
                  </li>
                );
              })}
        </ul>

        <div className="mt-3 flex items-center justify-between gap-2 border-t border-border-subtle pt-2.5 sm:mt-5 sm:gap-3 sm:pt-4 lg:mt-3 lg:pt-2.5">
          <p className="min-w-0 text-xs font-medium text-muted sm:text-sm lg:text-xs">
            {t("employer.dashboard.conversionRate")}
          </p>
          <p className="text-lg font-bold tabular-nums text-primary sm:text-2xl lg:text-xl">
            {isLoading ? "…" : `${conversionRate}%`}
          </p>
        </div>
      </div>
    </section>
  );
}
