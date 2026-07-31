"use client";

import {
  EMPLOYER_DASHBOARD_RECRUITER_PERFORMANCE_PLACEHOLDER,
  EMPLOYER_DASHBOARD_RECRUITER_PERFORMANCE_TITLE,
  EMPLOYER_DASHBOARD_RECRUITER_PERFORMANCE_Y_MAX,
  EMPLOYER_DASHBOARD_RECRUITER_PERFORMANCE_Y_STEP,
} from "@/constants/employer-dashboard-home";
import { ROUTES } from "@/constants/routes";
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
  const yTicks = buildYAxisTicks(
    EMPLOYER_DASHBOARD_RECRUITER_PERFORMANCE_Y_MAX,
    EMPLOYER_DASHBOARD_RECRUITER_PERFORMANCE_Y_STEP,
  );
  const yMax = EMPLOYER_DASHBOARD_RECRUITER_PERFORMANCE_Y_MAX;

  return (
    <section
      className="flex h-full min-h-[22rem] flex-col overflow-hidden rounded-xl border border-border-subtle bg-surface shadow-sm"
      aria-labelledby="dashboard-recruiter-performance-title"
    >
      <div className="flex items-center justify-between gap-3 px-4 pt-4 sm:px-5 sm:pt-5">
        <h2
          id="dashboard-recruiter-performance-title"
          className="text-base font-bold text-foreground"
        >
          {EMPLOYER_DASHBOARD_RECRUITER_PERFORMANCE_TITLE}
        </h2>
        <Link
          href={ROUTES.EMPLOYER_INTERVIEWS}
          className="shrink-0 text-sm font-semibold text-primary transition-colors hover:text-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
        >
          View All
        </Link>
      </div>

      <div className="flex min-h-0 flex-1 flex-col px-3 pb-4 pt-4 sm:px-4 sm:pb-5 sm:pt-5">
        <div
          className="relative flex min-h-[16rem] flex-1 gap-2 sm:gap-3"
          role="img"
          aria-label="Bar chart of interviews completed by recruiter"
        >
          {/* Y-axis labels + grid */}
          <div
            className="relative flex w-6 shrink-0 flex-col justify-between pb-7 text-right text-[0.625rem] tabular-nums text-muted sm:w-7 sm:text-[0.6875rem]"
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
            <ul className="absolute inset-x-0 top-0 bottom-7 flex items-end justify-between gap-1.5 px-0.5 sm:gap-2.5 sm:px-1">
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
                      className="w-full max-w-[2.25rem] rounded-t-md bg-primary transition-[height] duration-500 ease-out sm:max-w-[2.75rem]"
                      style={{ height: `${heightPercent}%` }}
                      title={`${bar.name}: ${bar.interviewed} interviewed`}
                    >
                      <span className="sr-only">
                        {bar.name}: {bar.interviewed} interviewed
                      </span>
                    </div>
                  </li>
                );
              })}
            </ul>

            {/* X-axis labels */}
            <ul
              className="absolute inset-x-0 bottom-0 flex items-start justify-between gap-1.5 px-0.5 pt-2 sm:gap-2.5 sm:px-1"
              aria-hidden="true"
            >
              {bars.map((bar) => (
                <li
                  key={bar.id}
                  className="min-w-0 flex-1 truncate text-center text-[0.625rem] font-medium text-muted sm:text-[0.6875rem]"
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
