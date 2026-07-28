"use client";

import { EmployerRegisterSearchableSelect } from "@/components/employer-register/EmployerRegisterSearchableSelect";
import type { EmployerRegisterSelectOption } from "@/types/employer-register";
import { cn } from "@/utils/cn";
import { Filter, X } from "lucide-react";

export type InterviewsQuickDateFilter =
  | ""
  | "today"
  | "tomorrow"
  | "this_week"
  | "this_month";

export type InterviewsStatusFilter =
  | ""
  | "interview_scheduled"
  | "interview_completed"
  | "rescheduled"
  | "cancelled";

export type InterviewsModeFilter = "" | "online" | "offline" | "phone";

type InterviewsFilterPanelProps = {
  quickDate: InterviewsQuickDateFilter;
  status: InterviewsStatusFilter;
  mode: InterviewsModeFilter;
  interviewer: string;
  interviewFrom: string;
  interviewTo: string;
  onQuickDateChange: (value: InterviewsQuickDateFilter) => void;
  onStatusChange: (value: InterviewsStatusFilter) => void;
  onModeChange: (value: InterviewsModeFilter) => void;
  onInterviewerChange: (value: string) => void;
  onInterviewFromChange: (value: string) => void;
  onInterviewToChange: (value: string) => void;
  onClear: () => void;
};

const QUICK_DATE_OPTIONS: EmployerRegisterSelectOption[] = [
  { value: "", label: "Any date" },
  { value: "today", label: "Today" },
  { value: "tomorrow", label: "Tomorrow" },
  { value: "this_week", label: "This Week" },
  { value: "this_month", label: "This Month" },
];

const STATUS_OPTIONS: EmployerRegisterSelectOption[] = [
  { value: "", label: "All statuses" },
  { value: "interview_scheduled", label: "Scheduled" },
  { value: "interview_completed", label: "Completed" },
  { value: "rescheduled", label: "Rescheduled" },
  { value: "cancelled", label: "Cancelled" },
];

const MODE_OPTIONS: EmployerRegisterSelectOption[] = [
  { value: "", label: "All modes" },
  { value: "online", label: "Online" },
  { value: "offline", label: "Offline" },
  { value: "phone", label: "Phone" },
];

const fieldClassName =
  "mt-1 h-8 w-full rounded-lg border border-border-subtle bg-surface px-2.5 text-sm font-normal text-foreground shadow-[0_1px_2px_rgba(15,23,42,0.04)] transition-[border-color,box-shadow] placeholder:text-muted hover:border-primary/25 focus-visible:outline-none focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/30";

const filterSelectTriggerClassName =
  "!h-8 lg:!h-8 !font-medium !shadow-[0_1px_2px_rgba(15,23,42,0.04)] hover:!shadow-[0_1px_2px_rgba(15,23,42,0.06)] h-9 w-full rounded-lg border border-border-subtle bg-surface px-3 text-sm text-foreground transition-[border-color,box-shadow] hover:border-primary/25 focus-visible:outline-none focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/30";

const labelClassName = "text-xs font-medium text-muted";

export function InterviewsFilterPanel({
  quickDate,
  status,
  mode,
  interviewer,
  interviewFrom,
  interviewTo,
  onQuickDateChange,
  onStatusChange,
  onModeChange,
  onInterviewerChange,
  onInterviewFromChange,
  onInterviewToChange,
  onClear,
}: InterviewsFilterPanelProps) {
  const hasActiveFilters =
    Boolean(quickDate) ||
    Boolean(status) ||
    Boolean(mode) ||
    Boolean(interviewer.trim()) ||
    Boolean(interviewFrom) ||
    Boolean(interviewTo);

  return (
    <section className="rounded-xl border border-border-subtle bg-surface p-3 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
      <div className="flex items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2">
          <span className="inline-flex size-7 shrink-0 items-center justify-center rounded-md bg-primary-light text-primary">
            <Filter className="size-3.5" aria-hidden="true" />
          </span>
          <h2 className="text-sm font-semibold text-foreground">Filters</h2>
        </div>
        <button
          type="button"
          onClick={onClear}
          disabled={!hasActiveFilters}
          className={cn(
            "inline-flex shrink-0 items-center gap-1 rounded-md px-1.5 py-1 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30",
            hasActiveFilters
              ? "text-primary hover:bg-primary-light"
              : "cursor-not-allowed text-muted/50",
          )}
        >
          <X className="size-3.5" aria-hidden="true" />
          Clear
        </button>
      </div>

      <div className="mt-3 space-y-2.5">
        <div>
          <label htmlFor="interview-filter-quick-date" className={labelClassName}>
            Quick date
          </label>
          <div className="mt-1">
            <EmployerRegisterSearchableSelect
              id="interview-filter-quick-date"
              label="Quick date"
              hideLabel
              value={quickDate}
              placeholder="Any date"
              options={QUICK_DATE_OPTIONS}
              onChange={(value) =>
                onQuickDateChange(value as InterviewsQuickDateFilter)
              }
              hideSearch
              triggerClassName={filterSelectTriggerClassName}
            />
          </div>
        </div>

        <div>
          <label htmlFor="interview-filter-status" className={labelClassName}>
            Status
          </label>
          <div className="mt-1">
            <EmployerRegisterSearchableSelect
              id="interview-filter-status"
              label="Status"
              hideLabel
              value={status}
              placeholder="All statuses"
              options={STATUS_OPTIONS}
              onChange={(value) =>
                onStatusChange(value as InterviewsStatusFilter)
              }
              hideSearch
              triggerClassName={filterSelectTriggerClassName}
            />
          </div>
        </div>

        <div>
          <label htmlFor="interview-filter-mode" className={labelClassName}>
            Interview mode
          </label>
          <div className="mt-1">
            <EmployerRegisterSearchableSelect
              id="interview-filter-mode"
              label="Interview mode"
              hideLabel
              value={mode}
              placeholder="All modes"
              options={MODE_OPTIONS}
              onChange={(value) => onModeChange(value as InterviewsModeFilter)}
              hideSearch
              triggerClassName={filterSelectTriggerClassName}
            />
          </div>
        </div>

        <div>
          <label
            htmlFor="interview-filter-interviewer"
            className={labelClassName}
          >
            Interviewer
          </label>
          <input
            id="interview-filter-interviewer"
            type="search"
            value={interviewer}
            onChange={(event) => onInterviewerChange(event.target.value)}
            placeholder="Search by name…"
            className={fieldClassName}
          />
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div>
            <label htmlFor="interview-filter-from" className={labelClassName}>
              From
            </label>
            <input
              id="interview-filter-from"
              type="date"
              value={interviewFrom}
              onChange={(event) => onInterviewFromChange(event.target.value)}
              className={fieldClassName}
            />
          </div>
          <div>
            <label htmlFor="interview-filter-to" className={labelClassName}>
              To
            </label>
            <input
              id="interview-filter-to"
              type="date"
              value={interviewTo}
              onChange={(event) => onInterviewToChange(event.target.value)}
              className={fieldClassName}
            />
          </div>
        </div>
      </div>
    </section>
  );
}
