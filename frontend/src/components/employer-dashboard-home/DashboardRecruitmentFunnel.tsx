"use client";

import { EmployerRegisterSearchableSelect } from "@/components/employer-register/EmployerRegisterSearchableSelect";
import {
  EMPLOYER_DASHBOARD_FUNNEL_PERIOD_OPTIONS,
  EMPLOYER_DASHBOARD_FUNNEL_STAGES,
  type EmployerDashboardFunnelPeriod,
} from "@/constants/employer-dashboard-home";
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
  const maxCount = Math.max(...stages.map((stage) => stage.count), 1);

  return (
    <section className="flex h-full flex-col overflow-hidden rounded-xl border border-border-subtle bg-surface shadow-sm">
      <div className="flex items-center justify-between gap-3 px-4 pt-4 sm:px-5 sm:pt-5">
        <h2 className="text-base font-bold text-foreground">
          Recruitment Funnel
        </h2>
        <div className="min-w-[7.5rem] shrink-0">
          <EmployerRegisterSearchableSelect
            id="dashboard-funnel-period"
            label="Funnel period"
            hideLabel
            hideSearch
            value={period}
            placeholder="This Month"
            options={EMPLOYER_DASHBOARD_FUNNEL_PERIOD_OPTIONS}
            onChange={(value) =>
              onPeriodChange(value as EmployerDashboardFunnelPeriod)
            }
            triggerClassName={FUNNEL_PERIOD_TRIGGER_CLASS_NAME}
            optionClassName="!py-2 !text-xs"
          />
        </div>
      </div>

      <div className="flex flex-1 flex-col px-4 pb-4 pt-5 sm:px-5 sm:pb-5">
        <ul
          className="flex flex-1 flex-col justify-center gap-2.5"
          aria-label="Funnel stages"
        >
          {isLoading
            ? Array.from({ length: 6 }).map((_, index) => (
                <li
                  key={index}
                  className="flex items-center gap-2.5"
                  aria-hidden="true"
                >
                  <div className="flex min-w-0 flex-1 justify-center">
                    <div
                      className="h-9 animate-pulse rounded-lg bg-hero-bg"
                      style={{
                        width: `${EMPLOYER_DASHBOARD_FUNNEL_STAGES[index]?.widthPercent ?? 70}%`,
                      }}
                    />
                  </div>
                  <span className="inline-block h-4 w-8 shrink-0 animate-pulse rounded bg-hero-bg" />
                </li>
              ))
            : EMPLOYER_DASHBOARD_FUNNEL_STAGES.map((stageMeta) => {
                const stage =
                  stages.find((item) => item.id === stageMeta.id) ?? {
                    id: stageMeta.id,
                    label: stageMeta.label,
                    count: 0,
                  };
                const fillPercent = Math.max(
                  0,
                  Math.min(100, (stage.count / maxCount) * 100),
                );

                return (
                  <li key={stage.id} className="flex items-center gap-2.5">
                    <div className="flex min-w-0 flex-1 justify-center">
                      <div
                        className={cn(
                          "relative flex h-9 w-full items-center justify-center overflow-hidden rounded-lg px-3 text-center text-xs font-semibold sm:text-[0.8125rem]",
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
                    <span className="w-9 shrink-0 text-right text-sm font-bold tabular-nums text-foreground">
                      {stage.count.toLocaleString("en-IN")}
                    </span>
                  </li>
                );
              })}
        </ul>

        <div className="mt-5 flex items-center justify-between gap-3 border-t border-border-subtle pt-4">
          <p className="text-sm font-medium text-muted">Conversion Rate</p>
          <p className="text-xl font-bold tabular-nums text-primary sm:text-2xl">
            {isLoading ? "…" : `${conversionRate}%`}
          </p>
        </div>
      </div>
    </section>
  );
}
