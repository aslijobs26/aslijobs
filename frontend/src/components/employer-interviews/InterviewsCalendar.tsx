"use client";

import {
  formatDayHeading,
  formatMonthYear,
  formatWeekRangeLabel,
  getMonthGridDays,
  getWeekDays,
  isSameDay,
  shiftCalendarAnchor,
  startOfDay,
  toIsoDate,
  type InterviewsCalendarMode,
} from "@/components/employer-interviews/interviews-calendar-utils";
import type { EmployerInterviewListItem } from "@/types/employer-interviews";
import {
  formatInterviewTime12h,
  interviewDisplayStatus,
  resolveInterviewTypeDisplay,
} from "@/types/employer-interviews";
import { cn } from "@/utils/cn";
import {
  Building2,
  CalendarPlus,
  ChevronLeft,
  ChevronRight,
  Phone,
  Video,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";

type InterviewsCalendarProps = {
  interviews: EmployerInterviewListItem[];
  isLoading: boolean;
  isError: boolean;
  onRetry: () => void;
  onSelect: (applicationId: string) => void;
  onScheduleInterview: () => void;
  onRangeChange: (range: {
    from: string;
    to: string;
    mode: InterviewsCalendarMode;
  }) => void;
};

const WEEKDAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] as const;

type ScheduleStatusKey =
  | "scheduled"
  | "completed"
  | "rescheduled"
  | "cancelled";

function resolveStatusKey(item: EmployerInterviewListItem): ScheduleStatusKey {
  if (item.isCancelled) {
    return "cancelled";
  }
  if (item.status === "interview_completed") {
    return "completed";
  }
  if (item.wasRescheduled) {
    return "rescheduled";
  }
  return "scheduled";
}

const EVENT_ACCENT: Record<ScheduleStatusKey, string> = {
  scheduled: "border-l-primary bg-primary-light/50",
  completed: "border-l-benefit-whatsapp-icon bg-benefit-whatsapp-surface",
  rescheduled: "border-l-resource-interview-icon bg-resource-interview-surface",
  cancelled: "border-l-pin-state bg-red-50",
};

function ModeIcon({ mode }: { mode: string }) {
  if (mode === "online") {
    return <Video className="size-3" aria-hidden="true" />;
  }
  if (mode === "phone") {
    return <Phone className="size-3" aria-hidden="true" />;
  }
  return <Building2 className="size-3" aria-hidden="true" />;
}

function compareTime(left: string, right: string): number {
  const leftMatch = /^(\d{1,2}):(\d{2})/.exec(left.trim());
  const rightMatch = /^(\d{1,2}):(\d{2})/.exec(right.trim());
  if (!leftMatch || !rightMatch) {
    return left.localeCompare(right);
  }
  return (
    Number(leftMatch[1]) * 60 +
    Number(leftMatch[2]) -
    (Number(rightMatch[1]) * 60 + Number(rightMatch[2]))
  );
}

function groupByDate(
  interviews: EmployerInterviewListItem[],
): Map<string, EmployerInterviewListItem[]> {
  const map = new Map<string, EmployerInterviewListItem[]>();
  for (const item of interviews) {
    const key = item.interviewDate;
    const list = map.get(key) ?? [];
    list.push(item);
    map.set(key, list);
  }
  for (const list of map.values()) {
    list.sort((a, b) => compareTime(a.interviewTime, b.interviewTime));
  }
  return map;
}

function daysInMonth(anchor: Date): number {
  return new Date(anchor.getFullYear(), anchor.getMonth() + 1, 0).getDate();
}

function EventChip({
  item,
  dense,
  onSelect,
}: {
  item: EmployerInterviewListItem;
  dense?: boolean;
  onSelect: (id: string) => void;
}) {
  const statusKey = resolveStatusKey(item);
  const status = interviewDisplayStatus(item);
  const type = resolveInterviewTypeDisplay({
    mode: item.interviewMode,
    meetingLink: item.meetingLink,
  });
  const time = formatInterviewTime12h(item.interviewTime);

  return (
    <button
      type="button"
      onClick={(event) => {
        event.stopPropagation();
        onSelect(item.id);
      }}
      className={cn(
        "w-full rounded border-l-[3px] px-1.5 py-1 text-left transition-colors hover:brightness-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30",
        EVENT_ACCENT[statusKey],
      )}
      aria-label={`${time}, ${item.candidateName}, ${item.jobTitle}, ${type.label}, ${status.label}`}
    >
      <span className="flex items-center gap-1">
        <span className="truncate text-[0.625rem] font-bold tabular-nums text-foreground">
          {time}
        </span>
        <span className="text-muted">
          <ModeIcon mode={item.interviewMode} />
        </span>
      </span>
      <span className="block truncate text-[0.6875rem] font-semibold text-foreground">
        {item.candidateName}
      </span>
      {!dense ? (
        <span className="block truncate text-[0.625rem] text-muted">
          {item.jobTitle}
        </span>
      ) : null}
    </button>
  );
}

function AgendaList({
  days,
  byDate,
  onSelect,
  emptyLabel,
}: {
  days: Date[];
  byDate: Map<string, EmployerInterviewListItem[]>;
  onSelect: (id: string) => void;
  emptyLabel: string;
}) {
  const rows = days
    .map((day) => {
      const key = toIsoDate(day);
      return { day, key, items: byDate.get(key) ?? [] };
    })
    .filter((row) => row.items.length > 0);

  if (rows.length === 0) {
    return (
      <p className="px-1 py-6 text-center text-sm text-muted">{emptyLabel}</p>
    );
  }

  return (
    <ol className="space-y-4">
      {rows.map(({ day, key, items }) => (
        <li key={key}>
          <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted">
            {formatDayHeading(day)}
          </h3>
          <ul className="space-y-2">
            {items.map((item) => (
              <li key={item.id}>
                <EventChip item={item} onSelect={onSelect} />
              </li>
            ))}
          </ul>
        </li>
      ))}
    </ol>
  );
}

export function InterviewsCalendar({
  interviews,
  isLoading,
  isError,
  onRetry,
  onSelect,
  onScheduleInterview,
  onRangeChange,
}: InterviewsCalendarProps) {
  const [mode, setMode] = useState<InterviewsCalendarMode>("month");
  const [anchor, setAnchor] = useState(() => startOfDay(new Date()));
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const media = window.matchMedia("(max-width: 767px)");
    const sync = () => setIsMobile(media.matches);
    sync();
    media.addEventListener("change", sync);
    return () => media.removeEventListener("change", sync);
  }, []);

  const effectiveMode: InterviewsCalendarMode = isMobile ? "day" : mode;
  const showAgenda = isMobile || effectiveMode === "day";

  useEffect(() => {
    const rangeMode = isMobile ? "month" : mode;
    let from: string;
    let to: string;
    if (isMobile || mode === "month") {
      const days = getMonthGridDays(anchor);
      from = toIsoDate(days[0]!);
      to = toIsoDate(days[days.length - 1]!);
    } else if (mode === "week") {
      const week = getWeekDays(anchor);
      from = toIsoDate(week[0]!);
      to = toIsoDate(week[6]!);
    } else {
      from = toIsoDate(anchor);
      to = from;
    }
    onRangeChange({ from, to, mode: rangeMode });
  }, [anchor, mode, isMobile, onRangeChange]);

  const byDate = useMemo(() => groupByDate(interviews), [interviews]);
  const today = startOfDay(new Date());
  const monthDays = useMemo(() => getMonthGridDays(anchor), [anchor]);
  const weekDays = useMemo(() => getWeekDays(anchor), [anchor]);

  const headerLabel =
    effectiveMode === "week"
      ? formatWeekRangeLabel(anchor)
      : effectiveMode === "day"
        ? formatDayHeading(anchor)
        : formatMonthYear(anchor);

  const goToday = () => setAnchor(startOfDay(new Date()));
  const goPrev = () =>
    setAnchor((current) =>
      shiftCalendarAnchor(isMobile ? "month" : mode, current, -1),
    );
  const goNext = () =>
    setAnchor((current) =>
      shiftCalendarAnchor(isMobile ? "month" : mode, current, 1),
    );

  const emptyState = (
    <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
      <p className="text-sm font-medium text-foreground">
        No interviews scheduled.
      </p>
      <button
        type="button"
        onClick={onScheduleInterview}
        className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-surface hover:bg-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
      >
        <CalendarPlus className="size-3.5" aria-hidden="true" />
        Schedule Interview
      </button>
    </div>
  );

  return (
    <section className="flex min-h-[32rem] flex-1 flex-col overflow-hidden rounded-xl border border-border-subtle bg-surface">
      <header className="flex shrink-0 flex-col gap-3 border-b border-border-subtle p-3 sm:flex-row sm:items-center sm:justify-between sm:p-4">
        <div className="flex flex-wrap items-center gap-2">
          <div className="inline-flex overflow-hidden rounded-lg border border-border-subtle">
            <button
              type="button"
              onClick={goPrev}
              className="inline-flex size-8 items-center justify-center text-muted hover:bg-primary-light hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
              aria-label="Previous"
            >
              <ChevronLeft className="size-4" aria-hidden="true" />
            </button>
            <button
              type="button"
              onClick={goNext}
              className="inline-flex size-8 items-center justify-center border-l border-border-subtle text-muted hover:bg-primary-light hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
              aria-label="Next"
            >
              <ChevronRight className="size-4" aria-hidden="true" />
            </button>
          </div>
          <button
            type="button"
            onClick={goToday}
            className="rounded-lg border border-border-subtle px-2.5 py-1.5 text-xs font-semibold text-foreground hover:bg-primary-light/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
          >
            Today
          </button>
          <h2 className="text-sm font-bold text-foreground sm:text-base">
            {headerLabel}
          </h2>
        </div>

        {!isMobile ? (
          <div
            className="inline-flex overflow-hidden rounded-lg border border-border-subtle"
            role="tablist"
            aria-label="Calendar view mode"
          >
            {(["month", "week", "day"] as const).map((option) => (
              <button
                key={option}
                type="button"
                role="tab"
                aria-selected={mode === option}
                onClick={() => setMode(option)}
                className={cn(
                  "px-3 py-1.5 text-xs font-semibold capitalize",
                  mode === option
                    ? "bg-primary text-surface"
                    : "bg-surface text-muted hover:bg-primary-light/40 hover:text-foreground",
                )}
              >
                {option}
              </button>
            ))}
          </div>
        ) : null}
      </header>

      <div className="min-h-0 flex-1 overflow-auto p-3 sm:p-4">
        {isLoading ? (
          <div className="grid grid-cols-7 gap-1" aria-hidden="true">
            {Array.from({ length: 28 }).map((_, index) => (
              <div
                key={index}
                className="h-20 animate-pulse rounded-lg bg-primary-light/40"
              />
            ))}
          </div>
        ) : isError ? (
          <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
            <p className="text-sm font-medium text-foreground">
              Unable to load calendar interviews.
            </p>
            <button
              type="button"
              onClick={onRetry}
              className="rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-surface hover:bg-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
            >
              Retry
            </button>
          </div>
        ) : showAgenda ? (
          interviews.length === 0 ? (
            emptyState
          ) : (
            <AgendaList
              days={
                isMobile
                  ? Array.from({ length: daysInMonth(anchor) }, (_, index) =>
                      new Date(
                        anchor.getFullYear(),
                        anchor.getMonth(),
                        index + 1,
                      ),
                    )
                  : [anchor]
              }
              byDate={byDate}
              onSelect={onSelect}
              emptyLabel="No interviews scheduled."
            />
          )
        ) : effectiveMode === "week" ? (
          <div className="grid min-h-[28rem] grid-cols-7 gap-px overflow-hidden rounded-lg border border-border-subtle bg-border-subtle">
            {weekDays.map((day) => {
              const key = toIsoDate(day);
              const items = byDate.get(key) ?? [];
              const isToday = isSameDay(day, today);
              return (
                <div
                  key={key}
                  className={cn(
                    "flex min-h-0 flex-col bg-surface p-1.5",
                    isToday && "bg-primary-light/20",
                  )}
                >
                  <div className="mb-1 flex items-center justify-between gap-1">
                    <span className="text-[0.625rem] font-semibold uppercase text-muted">
                      {WEEKDAY_LABELS[(day.getDay() + 6) % 7]}
                    </span>
                    <span
                      className={cn(
                        "inline-flex size-6 items-center justify-center rounded-full text-xs font-bold",
                        isToday
                          ? "bg-primary text-surface"
                          : "text-foreground",
                      )}
                    >
                      {day.getDate()}
                    </span>
                  </div>
                  <div className="min-h-0 flex-1 space-y-1 overflow-y-auto">
                    {items.map((item) => (
                      <EventChip
                        key={item.id}
                        item={item}
                        dense
                        onSelect={onSelect}
                      />
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div>
            <div className="mb-1 grid grid-cols-7 gap-1">
              {WEEKDAY_LABELS.map((label) => (
                <div
                  key={label}
                  className="px-1 py-1 text-center text-[0.6875rem] font-semibold uppercase text-muted"
                >
                  {label}
                </div>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-1">
              {monthDays.map((day) => {
                const key = toIsoDate(day);
                const items = byDate.get(key) ?? [];
                const inMonth = day.getMonth() === anchor.getMonth();
                const isToday = isSameDay(day, today);
                const overflow = Math.max(0, items.length - 3);
                const visible = items.slice(0, 3);

                return (
                  <div
                    key={key}
                    className={cn(
                      "flex min-h-[5.5rem] flex-col rounded-lg border border-border-subtle p-1 sm:min-h-[6.5rem]",
                      inMonth ? "bg-surface" : "bg-hero-bg/60",
                      isToday && "border-primary ring-1 ring-primary/30",
                    )}
                  >
                    <span
                      className={cn(
                        "mb-1 inline-flex size-6 items-center justify-center self-end rounded-full text-xs font-semibold",
                        isToday
                          ? "bg-primary text-surface"
                          : inMonth
                            ? "text-foreground"
                            : "text-muted",
                      )}
                    >
                      {day.getDate()}
                    </span>
                    <div className="min-h-0 flex-1 space-y-0.5 overflow-hidden">
                      {visible.map((item) => (
                        <EventChip
                          key={item.id}
                          item={item}
                          dense
                          onSelect={onSelect}
                        />
                      ))}
                      {overflow > 0 ? (
                        <p className="px-0.5 text-[0.625rem] font-semibold text-muted">
                          +{overflow} more
                        </p>
                      ) : null}
                    </div>
                  </div>
                );
              })}
            </div>
            {interviews.length === 0 ? emptyState : null}
          </div>
        )}
      </div>
    </section>
  );
}
