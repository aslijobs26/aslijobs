import { OPERATIONS_BUSINESS_TIMEZONE } from "./operations-registration-awareness.constants.js";

/** Format a Date as YYYY-MM-DD in Asia/Kolkata. */
export function toKolkataIsoDate(date: Date): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: OPERATIONS_BUSINESS_TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

/**
 * Instant corresponding to 00:00:00.000 Asia/Kolkata for the given calendar day.
 * Used for Mongo range queries against stored UTC timestamps.
 */
export function startOfKolkataDay(date: Date = new Date()): Date {
  const iso = toKolkataIsoDate(date);
  const [year, month, day] = iso.split("-").map(Number);
  // IST is UTC+5:30 year-round (no DST).
  return new Date(Date.UTC(year, month - 1, day, 0, 0, 0, 0) - 5.5 * 60 * 60 * 1000);
}

/** Exclusive end: start of next Kolkata calendar day. */
export function startOfNextKolkataDay(date: Date = new Date()): Date {
  const start = startOfKolkataDay(date);
  return new Date(start.getTime() + 24 * 60 * 60 * 1000);
}

/** Monday 00:00 Asia/Kolkata of the week containing `date`. */
export function startOfKolkataWeek(date: Date = new Date()): Date {
  const iso = toKolkataIsoDate(date);
  const [year, month, day] = iso.split("-").map(Number);
  const noonUtc = new Date(Date.UTC(year, month - 1, day, 12, 0, 0));
  const weekday = noonUtc.getUTCDay(); // 0=Sun … 6=Sat
  const offset = weekday === 0 ? -6 : 1 - weekday;
  const monday = new Date(Date.UTC(year, month - 1, day + offset, 12, 0, 0));
  return startOfKolkataDay(monday);
}

export function formatRelativeTime(
  date: Date | string | null | undefined,
  now: Date = new Date(),
): string {
  if (!date) {
    return "";
  }
  const d = date instanceof Date ? date : new Date(date);
  if (Number.isNaN(d.getTime())) {
    return "";
  }

  const diffMs = now.getTime() - d.getTime();
  if (diffMs < 0) {
    return "just now";
  }

  const seconds = Math.floor(diffMs / 1000);
  if (seconds < 45) {
    return "just now";
  }
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) {
    return `${minutes} min ago`;
  }
  const hours = Math.floor(minutes / 60);
  if (hours < 24) {
    return `${hours} hr ago`;
  }
  const days = Math.floor(hours / 24);
  if (days < 7) {
    return `${days} day${days === 1 ? "" : "s"} ago`;
  }

  return new Intl.DateTimeFormat("en-IN", {
    timeZone: OPERATIONS_BUSINESS_TIMEZONE,
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(d);
}
