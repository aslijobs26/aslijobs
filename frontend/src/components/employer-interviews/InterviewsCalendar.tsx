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
  Eye,
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

function MobileInterviewList({
  day,
  items,
  onSelect,
  onScheduleInterview,
}: {
  day: Date;
  items: EmployerInterviewListItem[];
  onSelect: (id: string) => void;
  onScheduleInterview: () => void;
}) {
  if (items.length === 0) {
    return (
      <div className="rounded-xl border border-border-subtle bg-hero-bg/60 px-4 py-6 text-center">
        <p className="text-sm font-semibold text-foreground">
          No interviews scheduled.
        </p>
        <p className="mt-1 text-xs text-muted">
          There are no interviews for {formatDayHeading(day)}.
        </p>
        <button
          type="button"
          onClick={onScheduleInterview}
          className="mt-4 inline-flex min-h-11 items-center justify-center gap-1.5 rounded-lg bg-primary px-4 text-sm font-semibold text-surface hover:bg-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
        >
          <CalendarPlus className="size-4" aria-hidden="true" />
          Schedule Interview
        </button>
      </div>
    );
  }

  return (
    <section aria-labelledby="mobile-selected-day-heading">
      <h3
        id="mobile-selected-day-heading"
        className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted"
      >
        {formatDayHeading(day)}
      </h3>
      <ol className="space-y-3">
        {items.map((item) => {
          const status = interviewDisplayStatus(item);
          const type = resolveInterviewTypeDisplay({
            mode: item.interviewMode,
            meetingLink: item.meetingLink,
          });

          return (
            <li
              key={item.id}
              className="rounded-xl border border-border-subtle bg-surface p-3 shadow-sm"
            >
              <div className="flex min-w-0 items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-bold text-foreground">
                    {item.candidateName}
                  </p>
                  <p className="mt-0.5 truncate text-xs text-muted">
                    {item.jobTitle || "Untitled job"}
                  </p>
                </div>
                <span
                  className={cn(
                    "inline-flex shrink-0 rounded-md px-2 py-1 text-[0.6875rem] font-semibold ring-1 ring-inset",
                    status.className,
                  )}
                >
                  {status.label}
                </span>
              </div>

              <dl className="mt-3 grid grid-cols-2 gap-x-3 gap-y-2 border-t border-border-subtle pt-3 text-xs">
                <div className="min-w-0">
                  <dt className="text-muted">Time</dt>
                  <dd className="mt-0.5 truncate font-semibold tabular-nums text-foreground">
                    {formatInterviewTime12h(item.interviewTime)}
                  </dd>
                </div>
                <div className="min-w-0">
                  <dt className="text-muted">Interview type</dt>
                  <dd className="mt-0.5 flex min-w-0 items-center gap-1 font-semibold text-foreground">
                    <ModeIcon mode={item.interviewMode} />
                    <span className="truncate">{type.label}</span>
                  </dd>
                </div>
                <div className="col-span-2 min-w-0">
                  <dt className="text-muted">Interviewer</dt>
                  <dd className="mt-0.5 truncate font-semibold text-foreground">
                    {item.interviewerName || "Not assigned"}
                    {item.interviewerDesignation
                      ? ` · ${item.interviewerDesignation}`
                      : ""}
                  </dd>
                </div>
              </dl>

              <button
                type="button"
                onClick={() => onSelect(item.id)}
                className="mt-3 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-lg border border-primary bg-primary-light px-3 text-sm font-semibold text-primary hover:bg-primary hover:text-surface focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
                aria-label={`View interview details for ${item.candidateName}`}
              >
                <Eye className="size-4" aria-hidden="true" />
                View details
              </button>
            </li>
          );
        })}
      </ol>
    </section>
  );
}

function MobileWeekCalendar({
  days,
  byDate,
  selectedDay,
  today,
  onSelectDay,
}: {
  days: Date[];
  byDate: Map<string, EmployerInterviewListItem[]>;
  selectedDay: Date;
  today: Date;
  onSelectDay: (day: Date) => void;
}) {
  return (
    <div className="grid grid-cols-7 overflow-hidden rounded-xl border border-border-subtle bg-border-subtle">
      {days.map((day) => {
        const key = toIsoDate(day);
        const count = byDate.get(key)?.length ?? 0;
        const selected = isSameDay(day, selectedDay);
        const isToday = isSameDay(day, today);

        return (
          <button
            key={key}
            type="button"
            onClick={() => onSelectDay(day)}
            aria-pressed={selected}
            aria-label={`${formatDayHeading(day)}, ${count} ${count === 1 ? "interview" : "interviews"}`}
            className={cn(
              "flex min-h-16 min-w-0 flex-col items-center justify-center bg-surface px-0.5 py-2 text-center focus-visible:relative focus-visible:z-10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary/30",
              selected && "bg-primary-light",
            )}
          >
            <span className="text-[0.5625rem] font-semibold uppercase text-muted sm:text-[0.625rem]">
              {WEEKDAY_LABELS[(day.getDay() + 6) % 7]}
            </span>
            <span
              className={cn(
                "mt-1 inline-flex size-7 items-center justify-center rounded-full text-xs font-bold",
                isToday
                  ? "bg-primary text-surface"
                  : selected
                    ? "text-primary"
                    : "text-foreground",
              )}
            >
              {day.getDate()}
            </span>
            <span
              className={cn(
                "mt-1 h-1.5 min-w-1.5 rounded-full",
                count > 0 ? "bg-primary px-1" : "bg-transparent",
              )}
              aria-hidden="true"
            />
          </button>
        );
      })}
    </div>
  );
}

function MobileMonthCalendar({
  days,
  anchor,
  byDate,
  selectedDay,
  today,
  onSelectDay,
}: {
  days: Date[];
  anchor: Date;
  byDate: Map<string, EmployerInterviewListItem[]>;
  selectedDay: Date;
  today: Date;
  onSelectDay: (day: Date) => void;
}) {
  return (
    <div>
      <div className="mb-1 grid grid-cols-7">
        {WEEKDAY_LABELS.map((label) => (
          <div
            key={label}
            className="py-1 text-center text-[0.5625rem] font-semibold uppercase text-muted sm:text-[0.625rem]"
          >
            {label}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7 overflow-hidden rounded-xl border border-border-subtle bg-border-subtle">
        {days.map((day) => {
          const key = toIsoDate(day);
          const count = byDate.get(key)?.length ?? 0;
          const inMonth = day.getMonth() === anchor.getMonth();
          const selected = isSameDay(day, selectedDay);
          const isToday = isSameDay(day, today);

          return (
            <button
              key={key}
              type="button"
              onClick={() => onSelectDay(day)}
              aria-pressed={selected}
              aria-label={`${formatDayHeading(day)}, ${count} ${count === 1 ? "interview" : "interviews"}`}
              className={cn(
                "flex min-h-12 min-w-0 flex-col items-center justify-center bg-surface px-0.5 py-1.5 focus-visible:relative focus-visible:z-10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary/30 sm:min-h-14",
                !inMonth && "bg-hero-bg/60",
                selected && "bg-primary-light",
              )}
            >
              <span
                className={cn(
                  "inline-flex size-6 items-center justify-center rounded-full text-xs font-semibold",
                  isToday
                    ? "bg-primary text-surface"
                    : selected
                      ? "text-primary"
                      : inMonth
                        ? "text-foreground"
                        : "text-muted",
                )}
              >
                {day.getDate()}
              </span>
              <span
                className={cn(
                  "mt-0.5 h-1.5 min-w-1.5 rounded-full",
                  count > 0 ? "bg-primary px-1" : "bg-transparent",
                )}
                aria-hidden="true"
              />
            </button>
          );
        })}
      </div>
    </div>
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
  const [mobileMode, setMobileMode] =
    useState<InterviewsCalendarMode>("day");
  const [anchor, setAnchor] = useState(() => startOfDay(new Date()));
  const [selectedDay, setSelectedDay] = useState(() =>
    startOfDay(new Date()),
  );
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const media = window.matchMedia("(max-width: 1023px)");
    const sync = () => setIsMobile(media.matches);
    sync();
    media.addEventListener("change", sync);
    return () => media.removeEventListener("change", sync);
  }, []);

  const effectiveMode: InterviewsCalendarMode = isMobile ? mobileMode : mode;
  const showAgenda = !isMobile && effectiveMode === "day";

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
  const selectedItems = byDate.get(toIsoDate(selectedDay)) ?? [];

  const headerLabel =
    effectiveMode === "week"
      ? formatWeekRangeLabel(anchor)
      : effectiveMode === "day"
        ? formatDayHeading(anchor)
        : formatMonthYear(anchor);

  const goToday = () => {
    const next = startOfDay(new Date());
    setAnchor(next);
    setSelectedDay(next);
  };
  const navigate = (direction: -1 | 1) => {
    const next = shiftCalendarAnchor(effectiveMode, anchor, direction);
    setAnchor(next);
    if (isMobile) {
      setSelectedDay(
        effectiveMode === "week" ? getWeekDays(next)[0]! : next,
      );
    }
  };
  const goPrev = () => navigate(-1);
  const goNext = () => navigate(1);
  const selectMobileMode = (nextMode: InterviewsCalendarMode) => {
    setMobileMode(nextMode);
    setAnchor(selectedDay);
  };

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
    <section className="flex min-w-0 flex-1 flex-col rounded-xl border border-border-subtle bg-surface lg:min-h-[32rem] lg:overflow-hidden">
      <header className="hidden shrink-0 flex-col gap-3 border-b border-border-subtle p-3 sm:p-4 lg:flex lg:flex-row lg:items-center lg:justify-between">
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
      </header>

      <header className="border-b border-border-subtle p-3 lg:hidden">
        <div
          className="grid grid-cols-3 overflow-hidden rounded-lg border border-border-subtle"
          role="tablist"
          aria-label="Calendar view mode"
        >
          {(["day", "week", "month"] as const).map((option) => (
            <button
              key={option}
              type="button"
              role="tab"
              aria-selected={mobileMode === option}
              onClick={() => selectMobileMode(option)}
              className={cn(
                "min-h-11 px-2 text-sm font-semibold",
                mobileMode === option
                  ? "bg-primary text-surface"
                  : "bg-surface text-muted hover:bg-primary-light/40 hover:text-foreground",
              )}
            >
              {option === "day"
                ? "Today"
                : option === "week"
                  ? "Week"
                  : "Month"}
            </button>
          ))}
        </div>

        <div className="mt-3 flex min-w-0 items-center justify-between gap-2">
          <div className="inline-flex shrink-0 overflow-hidden rounded-lg border border-border-subtle">
            <button
              type="button"
              onClick={goPrev}
              className="inline-flex size-11 items-center justify-center text-muted hover:bg-primary-light hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary/30"
              aria-label={`Previous ${mobileMode === "day" ? "day" : mobileMode}`}
            >
              <ChevronLeft className="size-4" aria-hidden="true" />
            </button>
            <button
              type="button"
              onClick={goNext}
              className="inline-flex size-11 items-center justify-center border-l border-border-subtle text-muted hover:bg-primary-light hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary/30"
              aria-label={`Next ${mobileMode === "day" ? "day" : mobileMode}`}
            >
              <ChevronRight className="size-4" aria-hidden="true" />
            </button>
          </div>
          <h2 className="min-w-0 flex-1 truncate text-center text-sm font-bold text-foreground">
            {headerLabel}
          </h2>
          <button
            type="button"
            onClick={goToday}
            className="inline-flex min-h-11 shrink-0 items-center justify-center rounded-lg border border-border-subtle px-3 text-xs font-semibold text-foreground hover:bg-primary-light/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
          >
            Today
          </button>
        </div>
      </header>

      <div className="p-3 sm:p-4 lg:min-h-0 lg:flex-1 lg:overflow-auto">
        {isLoading ? (
          <>
            <div className="space-y-3 lg:hidden" aria-hidden="true">
              <div className="grid grid-cols-7 gap-px overflow-hidden rounded-xl border border-border-subtle">
                {Array.from({ length: mobileMode === "month" ? 42 : 7 }).map(
                  (_, index) => (
                    <div
                      key={index}
                      className="h-12 animate-pulse bg-primary-light/40"
                    />
                  ),
                )}
              </div>
              <div className="h-36 animate-pulse rounded-xl bg-primary-light/40" />
            </div>
            <div className="hidden grid-cols-7 gap-1 lg:grid" aria-hidden="true">
              {Array.from({ length: 28 }).map((_, index) => (
                <div
                  key={index}
                  className="h-20 animate-pulse rounded-lg bg-primary-light/40"
                />
              ))}
            </div>
          </>
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
        ) : isMobile ? (
          <div className="space-y-4">
            {mobileMode === "week" ? (
              <MobileWeekCalendar
                days={weekDays}
                byDate={byDate}
                selectedDay={selectedDay}
                today={today}
                onSelectDay={setSelectedDay}
              />
            ) : mobileMode === "month" ? (
              <MobileMonthCalendar
                days={monthDays}
                anchor={anchor}
                byDate={byDate}
                selectedDay={selectedDay}
                today={today}
                onSelectDay={setSelectedDay}
              />
            ) : null}
            <MobileInterviewList
              day={selectedDay}
              items={selectedItems}
              onSelect={onSelect}
              onScheduleInterview={onScheduleInterview}
            />
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
