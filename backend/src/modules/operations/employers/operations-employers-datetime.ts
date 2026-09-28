import { OPERATIONS_BUSINESS_TIMEZONE } from "../registration-awareness/operations-registration-awareness.constants.js";
import {
  startOfKolkataDay,
  startOfNextKolkataDay,
} from "../registration-awareness/operations-registration-time.js";
import type { OperationsEmployerDatePreset } from "./operations-employers.types.js";

const DATE_FORMAT: Intl.DateTimeFormatOptions = {
  timeZone: OPERATIONS_BUSINESS_TIMEZONE,
  day: "2-digit",
  month: "short",
  year: "numeric",
};

const TIME_FORMAT: Intl.DateTimeFormatOptions = {
  timeZone: OPERATIONS_BUSINESS_TIMEZONE,
  hour: "2-digit",
  minute: "2-digit",
  hour12: true,
};

export function formatEmployerDisplayDate(
  date: Date | string | null | undefined,
): string {
  if (!date) return "—";
  const parsed = date instanceof Date ? date : new Date(date);
  if (Number.isNaN(parsed.getTime())) return "—";
  return new Intl.DateTimeFormat("en-IN", DATE_FORMAT).format(parsed);
}

export function formatEmployerDisplayTime(
  date: Date | string | null | undefined,
): string {
  if (!date) return "";
  const parsed = date instanceof Date ? date : new Date(date);
  if (Number.isNaN(parsed.getTime())) return "";
  return new Intl.DateTimeFormat("en-IN", TIME_FORMAT).format(parsed);
}

export function endOfKolkataDay(date: Date): Date {
  return new Date(startOfNextKolkataDay(date).getTime() - 1);
}

function parseDateOnly(value: string): Date | null {
  const trimmed = value.trim();
  if (!trimmed) {
    return null;
  }

  const isoDay = /^(\d{4})-(\d{2})-(\d{2})$/.exec(trimmed);
  if (isoDay) {
    const year = Number(isoDay[1]);
    const month = Number(isoDay[2]);
    const day = Number(isoDay[3]);
    return startOfKolkataDay(new Date(Date.UTC(year, month - 1, day, 12, 0, 0)));
  }

  const parsed = new Date(`${trimmed}T12:00:00.000Z`);
  return Number.isNaN(parsed.getTime()) ? null : startOfKolkataDay(parsed);
}

export function resolveEmployerDateRange(input: {
  datePreset: OperationsEmployerDatePreset;
  dateFrom: string;
  dateTo: string;
  now?: Date;
}): { from: Date | null; to: Date | null; preset: OperationsEmployerDatePreset } {
  const now = input.now ?? new Date();
  const todayStart = startOfKolkataDay(now);
  const todayEnd = endOfKolkataDay(now);

  switch (input.datePreset) {
    case "today":
      return {
        preset: "today",
        from: todayStart,
        to: todayEnd,
      };
    case "yesterday": {
      const yesterdayStart = new Date(todayStart.getTime() - 24 * 60 * 60 * 1000);
      return {
        preset: "yesterday",
        from: yesterdayStart,
        to: endOfKolkataDay(yesterdayStart),
      };
    }
    case "last_7_days":
      return {
        preset: "last_7_days",
        from: new Date(todayStart.getTime() - 6 * 24 * 60 * 60 * 1000),
        to: todayEnd,
      };
    case "last_30_days":
      return {
        preset: "last_30_days",
        from: new Date(todayStart.getTime() - 29 * 24 * 60 * 60 * 1000),
        to: todayEnd,
      };
    case "custom": {
      const fromRaw = parseDateOnly(input.dateFrom);
      const toRaw = parseDateOnly(input.dateTo);
      return {
        preset: "custom",
        from: fromRaw,
        to: toRaw
          ? endOfKolkataDay(toRaw)
          : fromRaw
            ? endOfKolkataDay(fromRaw)
            : null,
      };
    }
    default:
      return { preset: "all", from: null, to: null };
  }
}
