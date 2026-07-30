"use client";

import type { EmployerInterviewListItem } from "@/types/employer-interviews";
import {
  formatInterviewTime12h,
  interviewDisplayStatus,
  resolveInterviewTypeDisplay,
} from "@/types/employer-interviews";
import { cn } from "@/utils/cn";
import { Building2, CalendarPlus, Phone, Video } from "lucide-react";
import { useMemo } from "react";

type InterviewsTodayScheduleProps = {
  items: EmployerInterviewListItem[];
  isLoading: boolean;
  onSelect: (applicationId: string) => void;
  onScheduleInterview: () => void;
  onViewAll: () => void;
};

type ScheduleStatusKey =
  | "scheduled"
  | "completed"
  | "rescheduled"
  | "cancelled";

function compareInterviewTime(left: string, right: string): number {
  const leftMatch = /^(\d{1,2}):(\d{2})/.exec(left.trim());
  const rightMatch = /^(\d{1,2}):(\d{2})/.exec(right.trim());
  if (!leftMatch && !rightMatch) {
    return left.localeCompare(right);
  }
  if (!leftMatch) {
    return 1;
  }
  if (!rightMatch) {
    return -1;
  }
  return (
    Number(leftMatch[1]) * 60 +
    Number(leftMatch[2]) -
    (Number(rightMatch[1]) * 60 + Number(rightMatch[2]))
  );
}

function resolveScheduleStatusKey(
  item: EmployerInterviewListItem,
): ScheduleStatusKey {
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

/** Semantic status dots — same tokens as Interview Status Overview. */
const STATUS_DOT_CLASS: Record<ScheduleStatusKey, string> = {
  scheduled: "bg-primary",
  completed: "bg-benefit-whatsapp-icon",
  rescheduled: "bg-resource-interview-icon",
  cancelled: "bg-pin-state",
};

const TIMELINE_ACCENT_CLASS: Record<ScheduleStatusKey, string> = {
  scheduled: "bg-primary",
  completed: "bg-benefit-whatsapp-icon",
  rescheduled: "bg-resource-interview-icon",
  cancelled: "bg-pin-state",
};

function ModeIcon({
  mode,
  className,
}: {
  mode: string;
  className?: string;
}) {
  if (mode === "online") {
    return <Video className={className} aria-hidden="true" />;
  }
  if (mode === "phone") {
    return <Phone className={className} aria-hidden="true" />;
  }
  return <Building2 className={className} aria-hidden="true" />;
}

function modeIconSurfaceClass(mode: string): string {
  if (mode === "online") {
    return "bg-primary-light text-primary";
  }
  if (mode === "phone") {
    return "bg-benefit-whatsapp-surface text-benefit-whatsapp-icon";
  }
  return "bg-resource-interview-surface text-resource-interview-icon";
}

function formatTodayHeaderDate(date = new Date()): string {
  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

/** Pads hour for schedule scanning (e.g. 09:00 AM). */
function formatScheduleTime(time: string): string {
  const formatted = formatInterviewTime12h(time);
  const match = /^(\d{1,2}):(\d{2})\s*(AM|PM)$/i.exec(formatted.trim());
  if (!match) {
    return formatted;
  }
  return `${match[1].padStart(2, "0")}:${match[2]} ${match[3].toUpperCase()}`;
}

function scheduleBadgeLabel(item: EmployerInterviewListItem): string {
  return interviewDisplayStatus(item).label;
}

export function InterviewsTodaySchedule({
  items,
  isLoading,
  onSelect,
  onScheduleInterview,
  onViewAll,
}: InterviewsTodayScheduleProps) {
  const sortedItems = useMemo(
    () =>
      [...items].sort((left, right) =>
        compareInterviewTime(left.interviewTime, right.interviewTime),
      ),
    [items],
  );

  const todayLabel = formatTodayHeaderDate();
  const hasItems = !isLoading && sortedItems.length > 0;

  return (
    <section className="flex flex-col overflow-hidden rounded-xl border border-border-subtle bg-surface shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
      <header className="flex shrink-0 items-center justify-between gap-3 border-b border-border-subtle px-3 py-3 sm:px-4">
        <h2 className="text-sm font-semibold text-foreground">
          Today&apos;s Schedule
        </h2>
        <time
          dateTime={new Date().toISOString().slice(0, 10)}
          className="shrink-0 text-xs font-medium tabular-nums text-muted"
        >
          {todayLabel}
        </time>
      </header>

      <div
        className={cn(
          "min-h-0",
          /* Exactly 3 rows visible; 4th+ scrolls (hidden scrollbar). */
          hasItems &&
            "lg:max-h-[calc(3*5.5rem)] lg:overflow-y-auto lg:overscroll-contain lg:scrollbar-hidden",
        )}
      >
        {isLoading ? (
          <div className="space-y-0 px-3 py-1 sm:px-4" aria-hidden="true">
            {Array.from({ length: 4 }).map((_, index) => (
              <div
                key={index}
                className="flex items-center gap-3 border-b border-border-subtle py-3 last:border-b-0"
              >
                <div className="h-4 w-16 shrink-0 animate-pulse rounded bg-primary-light/50" />
                <div className="h-8 w-0.5 shrink-0 animate-pulse rounded-full bg-primary-light/60" />
                <div className="min-w-0 flex-1 space-y-2">
                  <div className="h-3.5 w-28 animate-pulse rounded bg-primary-light/50" />
                  <div className="h-3 w-20 animate-pulse rounded bg-primary-light/40" />
                </div>
                <div className="size-7 shrink-0 animate-pulse rounded-full bg-primary-light/50" />
              </div>
            ))}
          </div>
        ) : sortedItems.length === 0 ? (
          <div className="px-3 py-6 text-center sm:px-4">
            <p className="text-sm font-medium text-foreground">
              No interviews scheduled today.
            </p>
            <p className="mt-1 text-xs text-muted">
              Schedule a candidate to see them here.
            </p>
            <button
              type="button"
              onClick={onScheduleInterview}
              className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-surface hover:bg-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
            >
              <CalendarPlus className="size-3.5" aria-hidden="true" />
              Schedule Interview
            </button>
          </div>
        ) : (
          <ol className="px-2 sm:px-3">
            {sortedItems.map((item, index) => {
              const statusKey = resolveScheduleStatusKey(item);
              const status = interviewDisplayStatus(item);
              const badgeLabel = scheduleBadgeLabel(item);
              const typeDisplay = resolveInterviewTypeDisplay({
                mode: item.interviewMode,
                meetingLink: item.meetingLink,
              });
              const isLast = index === sortedItems.length - 1;
              const timeLabel = formatScheduleTime(item.interviewTime);

              return (
                <li key={item.id} className="relative h-[5.5rem]">
                  <button
                    type="button"
                    onClick={() => onSelect(item.id)}
                    className={cn(
                      "group grid h-full w-full grid-cols-[4.25rem_0.75rem_minmax(0,1fr)_auto] items-center gap-x-2 rounded-lg px-1.5 py-2.5 text-left transition-[background-color,box-shadow] sm:gap-x-2.5 sm:px-2",
                      "hover:bg-primary-light/30 hover:shadow-[0_1px_3px_rgba(15,23,42,0.05)]",
                      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30",
                      "cursor-pointer",
                      !isLast && "border-b border-border-subtle",
                    )}
                    aria-label={`${timeLabel}, ${item.candidateName}, ${item.jobTitle}, ${typeDisplay.label}, ${badgeLabel}`}
                  >
                    <span className="text-sm font-semibold tabular-nums text-muted group-hover:text-foreground">
                      {timeLabel}
                    </span>

                    {/* Status-colored timeline accent + connector */}
                    <span
                      className="relative flex h-full min-h-11 items-stretch justify-center self-stretch"
                      aria-hidden="true"
                    >
                      <span
                        className={cn(
                          "my-1 w-0.5 rounded-full",
                          TIMELINE_ACCENT_CLASS[statusKey],
                        )}
                      />
                      {!isLast ? (
                        <span className="absolute left-1/2 top-[calc(50%+1.1rem)] bottom-[-0.75rem] w-px -translate-x-1/2 bg-border" />
                      ) : null}
                    </span>

                    <span className="min-w-0">
                      <span className="block truncate text-sm font-semibold text-foreground">
                        {item.candidateName}
                      </span>
                      <span className="mt-0.5 block truncate text-xs text-muted">
                        {item.jobTitle || "Untitled job"}
                      </span>
                      <span className="mt-1.5 flex flex-wrap items-center gap-1.5">
                        <span className="truncate text-[0.6875rem] font-medium text-muted">
                          {typeDisplay.label}
                        </span>
                        <span
                          className={cn(
                            "inline-flex shrink-0 rounded-md px-1.5 py-0.5 text-[0.625rem] font-semibold ring-1 ring-inset",
                            status.className,
                          )}
                        >
                          {badgeLabel}
                        </span>
                      </span>
                    </span>

                    <span className="flex shrink-0 items-center gap-2">
                      <span
                        className={cn(
                          "inline-flex size-8 items-center justify-center rounded-full",
                          modeIconSurfaceClass(item.interviewMode),
                        )}
                        title={typeDisplay.label}
                        aria-hidden="true"
                      >
                        <ModeIcon
                          mode={item.interviewMode}
                          className="size-3.5"
                        />
                      </span>
                      <span
                        className={cn(
                          "size-2.5 shrink-0 rounded-full",
                          STATUS_DOT_CLASS[statusKey],
                        )}
                        title={badgeLabel}
                        aria-hidden="true"
                      />
                    </span>
                  </button>
                </li>
              );
            })}
          </ol>
        )}
      </div>

      {hasItems ? (
        <footer className="shrink-0 border-t border-border-subtle px-3 py-2.5 text-center sm:px-4">
          <button
            type="button"
            onClick={onViewAll}
            className="text-xs font-semibold text-primary hover:text-primary-hover hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
          >
            View All Interviews
          </button>
        </footer>
      ) : null}
    </section>
  );
}
