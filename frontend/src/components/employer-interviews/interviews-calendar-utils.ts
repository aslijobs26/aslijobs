/** Date helpers for Employer Interviews calendar views. */

export type InterviewsCalendarMode = "month" | "week" | "day";

export function padTwo(value: number): string {
  return String(value).padStart(2, "0");
}

export function toIsoDate(date: Date): string {
  return `${date.getFullYear()}-${padTwo(date.getMonth() + 1)}-${padTwo(date.getDate())}`;
}

export function parseIsoDate(iso: string): Date | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso.trim());
  if (!match) {
    return null;
  }
  const year = Number(match[1]);
  const month = Number(match[2]) - 1;
  const day = Number(match[3]);
  const date = new Date(year, month, day);
  if (
    date.getFullYear() !== year ||
    date.getMonth() !== month ||
    date.getDate() !== day
  ) {
    return null;
  }
  return date;
}

export function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

export function addDays(date: Date, days: number): Date {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

/** Monday-start week (ATS schedule convention). */
export function startOfWeekMonday(date: Date): Date {
  const day = date.getDay();
  const offset = day === 0 ? -6 : 1 - day;
  return startOfDay(addDays(date, offset));
}

export function endOfWeekSunday(date: Date): Date {
  return addDays(startOfWeekMonday(date), 6);
}

export function startOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

export function endOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0);
}

export function isSameDay(left: Date, right: Date): boolean {
  return (
    left.getFullYear() === right.getFullYear() &&
    left.getMonth() === right.getMonth() &&
    left.getDate() === right.getDate()
  );
}

export function formatMonthYear(date: Date): string {
  return new Intl.DateTimeFormat("en-IN", {
    month: "long",
    year: "numeric",
  }).format(date);
}

export function formatDayHeading(date: Date): string {
  return new Intl.DateTimeFormat("en-IN", {
    weekday: "short",
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

export function formatWeekRangeLabel(anchor: Date): string {
  const from = startOfWeekMonday(anchor);
  const to = endOfWeekSunday(anchor);
  const fmt = new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
  });
  return `${fmt.format(from)} – ${fmt.format(to)} ${to.getFullYear()}`;
}

/** Month grid cells including leading/trailing days (Mon–Sun). */
export function getMonthGridDays(anchor: Date): Date[] {
  const monthStart = startOfMonth(anchor);
  const gridStart = startOfWeekMonday(monthStart);
  return Array.from({ length: 42 }, (_, index) => addDays(gridStart, index));
}

export function getWeekDays(anchor: Date): Date[] {
  const weekStart = startOfWeekMonday(anchor);
  return Array.from({ length: 7 }, (_, index) => addDays(weekStart, index));
}

export function resolveCalendarRange(
  mode: InterviewsCalendarMode,
  anchor: Date,
): { from: string; to: string } {
  if (mode === "day") {
    const day = toIsoDate(anchor);
    return { from: day, to: day };
  }
  if (mode === "week") {
    return {
      from: toIsoDate(startOfWeekMonday(anchor)),
      to: toIsoDate(endOfWeekSunday(anchor)),
    };
  }
  // Month: include adjacent grid days so events on edge weeks load.
  const days = getMonthGridDays(anchor);
  return {
    from: toIsoDate(days[0]!),
    to: toIsoDate(days[days.length - 1]!),
  };
}

export function shiftCalendarAnchor(
  mode: InterviewsCalendarMode,
  anchor: Date,
  direction: -1 | 1,
): Date {
  if (mode === "day") {
    return addDays(anchor, direction);
  }
  if (mode === "week") {
    return addDays(anchor, direction * 7);
  }
  return new Date(
    anchor.getFullYear(),
    anchor.getMonth() + direction,
    Math.min(anchor.getDate(), 28),
  );
}
