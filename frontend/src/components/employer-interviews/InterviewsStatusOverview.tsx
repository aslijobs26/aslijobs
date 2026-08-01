"use client";

import { EmployerRegisterSearchableSelect } from "@/components/employer-register/EmployerRegisterSearchableSelect";
import { fetchEmployerInterviewStats } from "@/services/employer-interviews.service";
import type {
  EmployerInterviewStatsPeriod,
  EmployerInterviewStatusOverviewKey,
} from "@/types/employer-interviews";
import type { EmployerRegisterSelectOption } from "@/types/employer-register";
import { cn } from "@/utils/cn";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";

const PERIOD_OPTIONS: EmployerRegisterSelectOption[] = [
  { value: "today", label: "Today" },
  { value: "this_week", label: "This Week" },
  { value: "this_month", label: "This Month" },
  { value: "last_month", label: "Last Month" },
  { value: "all_time", label: "All Time" },
];

const STATUS_BAR_CLASS: Record<EmployerInterviewStatusOverviewKey, string> = {
  scheduled: "bg-primary",
  completed: "bg-benefit-whatsapp-icon",
  rescheduled: "bg-resource-interview-icon",
  cancelled: "bg-pin-state",
};

const periodSelectTriggerClassName =
  "!h-8 lg:!h-8 !min-w-[7.5rem] !w-auto !font-medium !shadow-[0_1px_2px_rgba(15,23,42,0.04)] hover:!shadow-[0_1px_2px_rgba(15,23,42,0.06)] rounded-lg border border-border-subtle bg-surface px-2.5 text-xs text-foreground transition-[border-color,box-shadow] hover:border-primary/25 focus-visible:outline-none focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/30";

const FALLBACK_STATUSES: {
  key: EmployerInterviewStatusOverviewKey;
  label: string;
}[] = [
  { key: "scheduled", label: "Scheduled" },
  { key: "completed", label: "Completed" },
  { key: "rescheduled", label: "Rescheduled" },
  { key: "cancelled", label: "Cancelled" },
];

export function InterviewsStatusOverview() {
  const [period, setPeriod] =
    useState<EmployerInterviewStatsPeriod>("all_time");

  const overviewQuery = useQuery({
    queryKey: ["employer", "interview-stats", "overview", period],
    queryFn: () => fetchEmployerInterviewStats({ period }),
    staleTime: 60_000,
    refetchOnWindowFocus: false,
  });

  const overview = overviewQuery.data?.statusOverview;
  const statuses =
    overview?.statuses ??
    FALLBACK_STATUSES.map((item) => ({
      ...item,
      count: 0,
      percentage: 0,
    }));
  const isEmpty =
    !overviewQuery.isLoading &&
    !overviewQuery.isError &&
    (overview?.total ?? 0) === 0;

  return (
    <section className="rounded-xl border border-border-subtle bg-surface p-3 shadow-[0_1px_2px_rgba(15,23,42,0.04)] sm:p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-sm font-semibold text-foreground">
          Interview Status Overview
        </h2>
        <div className="min-w-[7.5rem] shrink-0">
          <EmployerRegisterSearchableSelect
            id="interview-status-overview-period"
            label="Time filter"
            hideLabel
            value={period}
            placeholder="All Time"
            options={PERIOD_OPTIONS}
            onChange={(value) =>
              setPeriod(value as EmployerInterviewStatsPeriod)
            }
            hideSearch
            triggerClassName={periodSelectTriggerClassName}
          />
        </div>
      </div>

      <div className="mt-3 space-y-3">
        {overviewQuery.isLoading ? (
          FALLBACK_STATUSES.map((item) => (
            <div key={item.key} className="space-y-1.5">
              <div className="flex items-center justify-between gap-2">
                <div className="h-3.5 w-20 animate-pulse rounded bg-primary-light/50" />
                <div className="h-3.5 w-14 animate-pulse rounded bg-primary-light/50" />
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-hero-bg">
                <div className="h-full w-2/5 animate-pulse rounded-full bg-primary-light" />
              </div>
            </div>
          ))
        ) : overviewQuery.isError ? (
          <div className="rounded-lg border border-border-subtle bg-hero-bg px-3 py-4 text-center">
            <p className="text-sm font-medium text-foreground">
              Unable to load interview statistics.
            </p>
            <button
              type="button"
              onClick={() => void overviewQuery.refetch()}
              className="mt-2 inline-flex rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-surface hover:bg-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
            >
              Retry
            </button>
          </div>
        ) : (
          <>
            {isEmpty ? (
              <p className="text-sm text-muted">
                No interview statistics available.
              </p>
            ) : null}
            {statuses.map((item) => (
              <div key={item.key}>
                <div className="flex items-center justify-between gap-3 text-xs">
                  <span className="font-medium text-foreground">
                    {item.label}
                  </span>
                  <span className="shrink-0 tabular-nums text-muted">
                    <span className="font-semibold text-foreground">
                      {item.count}
                    </span>
                    <span className="mx-1 text-border">·</span>
                    <span>{item.percentage}%</span>
                  </span>
                </div>
                <div
                  className="mt-1.5 h-2 overflow-hidden rounded-full bg-hero-bg"
                  role="progressbar"
                  aria-label={`${item.label} ${item.percentage}%`}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-valuenow={item.percentage}
                >
                  <div
                    className={cn(
                      "h-full rounded-full transition-[width] duration-300",
                      STATUS_BAR_CLASS[item.key],
                      item.percentage === 0 && "opacity-0",
                    )}
                    style={{ width: `${item.percentage}%` }}
                  />
                </div>
              </div>
            ))}
          </>
        )}
      </div>
    </section>
  );
}
