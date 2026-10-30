"use client";

import {
  EMPLOYER_DASHBOARD_RECRUITER_PERFORMANCE_PLACEHOLDER,
  EMPLOYER_DASHBOARD_RECRUITER_PERFORMANCE_Y_MAX,
  EMPLOYER_DASHBOARD_RECRUITER_PERFORMANCE_Y_STEP,
} from "@/constants/employer-dashboard-home";
import { ROUTES } from "@/constants/routes";
import { useTranslate } from "@/i18n/translate";
import Link from "next/link";

type RecruiterPerformanceBar = {
  id: string;
  name: string;
  interviewed: number;
};

type DashboardRecruiterPerformanceProps = {
  /** Optional override; defaults to UI placeholder data. */
  bars?: readonly RecruiterPerformanceBar[];
};

function buildYAxisTicks(max: number, step: number): number[] {
  const ticks: number[] = [];
  for (let value = max; value >= 0; value -= step) {
    ticks.push(value);
  }
  return ticks;
}

export function DashboardRecruiterPerformance({
  bars = EMPLOYER_DASHBOARD_RECRUITER_PERFORMANCE_PLACEHOLDER,
}: DashboardRecruiterPerformanceProps) {
  const t = useTranslate();
  const yTicks = buildYAxisTicks(
    EMPLOYER_DASHBOARD_RECRUITER_PERFORMANCE_Y_MAX,
    EMPLOYER_DASHBOARD_RECRUITER_PERFORMANCE_Y_STEP,
  );
  const yMax = EMPLOYER_DASHBOARD_RECRUITER_PERFORMANCE_Y_MAX;

  return (
    <section
      className="employer-analytics-card employer-recruiter-card flex h-full min-h-0 flex-col overflow-hidden rounded-xl border border-border-subtle bg-surface shadow-sm sm:min-h-[22rem]"
      aria-labelledby="dashboard-recruiter-performance-title"
    >
      <div className="employer-analytics-card__header flex items-center justify-between gap-2 px-3 pt-3 sm:gap-3 sm:px-5 sm:pt-5">
        <h2
          id="dashboard-recruiter-performance-title"
          className="employer-analytics-card__title employer-section-title min-w-0 break-words text-sm font-bold text-foreground sm:text-base"
        >
          {t("employer.dashboard.recruiterPerformance")}
        </h2>
        <Link
          href={ROUTES.EMPLOYER_INTERVIEWS}
          className="employer-analytics-card__link shrink-0 text-xs font-semibold text-primary transition-colors hover:text-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 sm:text-sm"
        >
          {t("employer.common.viewAll")}
        </Link>
      </div>

      <div className="employer-analytics-card__body flex min-h-0 flex-1 flex-col px-2.5 pb-3 pt-2 sm:px-4 sm:pb-5 sm:pt-5">
        <div
          className="employer-recruiter-chart relative flex min-h-[11rem] flex-1 gap-1.5 sm:min-h-[16rem] sm:gap-3"
          role="img"
          aria-label={t("employer.dashboard.recruiterChartAria")}
        >
          {/* Y-axis labels + grid */}
          <div
            className="employer-recruiter-axis relative flex w-6 shrink-0 flex-col justify-between pb-7 text-right text-[0.625rem] tabular-nums text-muted sm:w-7 sm:text-[0.6875rem]"
            aria-hidden="true"
          >
            {yTicks.map((tick) => (
              <span key={tick} className="leading-none">
                {tick}
              </span>
            ))}
          </div>

          <div className="relative min-w-0 flex-1">
            {/* Horizontal grid lines */}
            <div
              className="pointer-events-none absolute inset-x-0 top-0 bottom-7 flex flex-col justify-between"
              aria-hidden="true"
            >
              {yTicks.map((tick) => (
                <div
                  key={tick}
                  className="border-t border-border-subtle/80"
                />
              ))}
            </div>

            {/* Bars */}
            <ul className="absolute inset-x-0 top-0 bottom-7 flex items-end justify-between gap-1.5 px-0.5 sm:gap-2.5 sm:px-1 lg:gap-1.5">
              {bars.map((bar) => {
                const heightPercent = Math.max(
                  0,
                  Math.min(100, (bar.interviewed / yMax) * 100),
                );

                return (
                  <li
                    key={bar.id}
                    className="flex h-full min-w-0 flex-1 flex-col items-center justify-end"
                  >
                    <div
                      className="employer-recruiter-bar w-full max-w-[2.25rem] rounded-t-md bg-primary transition-[height] duration-500 ease-out sm:max-w-[2.75rem]"
                      style={{ height: `${heightPercent}%` }}
                      title={t("employer.dashboard.recruiterBarLabel", {
                        name: bar.name,
                        count: bar.interviewed,
                      })}
                    >
                      <span className="sr-only">
                        {t("employer.dashboard.recruiterBarLabel", {
                          name: bar.name,
                          count: bar.interviewed,
                        })}
                      </span>
                    </div>
                  </li>
                );
              })}
            </ul>

            {/* X-axis labels */}
            <ul
              className="absolute inset-x-0 bottom-0 flex items-start justify-between gap-1.5 px-0.5 pt-2 sm:gap-2.5 sm:px-1 lg:gap-1.5 lg:pt-1.5"
              aria-hidden="true"
            >
              {bars.map((bar) => (
                <li
                  key={bar.id}
                  className="employer-recruiter-axis min-w-0 flex-1 truncate text-center text-[0.625rem] font-medium text-muted sm:text-[0.6875rem]"
                >
                  {bar.name}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}
