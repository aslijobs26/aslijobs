import { useId } from "react";
import { OperationsDatePicker } from "../../ui/OperationsDatePicker";
import { OperationsFilterSelect } from "../jobs/OperationsFilterSelect";
import type { WorkItemPriority } from "../../../types/operations-work";
import { cn } from "../../../utils/cn";

export type DueMeridiem = "AM" | "PM";

export interface MyWorkDueParts {
  date: string;
  hour12: string;
  minute: string;
  meridiem: DueMeridiem;
}

const HOUR_OPTIONS = Array.from({ length: 12 }, (_, index) => {
  const hour = index + 1;
  const value = String(hour);
  return { value, label: value.padStart(2, "0") };
});

const MINUTE_OPTIONS = Array.from({ length: 12 }, (_, index) => {
  const minute = index * 5;
  const value = String(minute).padStart(2, "0");
  return { value, label: value };
});

const MERIDIEM_OPTIONS: { value: DueMeridiem; label: string }[] = [
  { value: "AM", label: "AM" },
  { value: "PM", label: "PM" },
];

const triggerClassName =
  "!h-9 !min-w-0 !rounded-md !px-2 !text-[12px] border-border-subtle";

function padTwo(value: number): string {
  return String(value).padStart(2, "0");
}

function toHour12(hours24: number): { hour12: string; meridiem: DueMeridiem } {
  const meridiem: DueMeridiem = hours24 >= 12 ? "PM" : "AM";
  const hour12 = hours24 % 12 === 0 ? 12 : hours24 % 12;
  return { hour12: String(hour12), meridiem };
}

function toHour24(hour12: string, meridiem: DueMeridiem): number {
  const parsed = Number.parseInt(hour12, 10);
  const safe = Number.isFinite(parsed) ? Math.min(12, Math.max(1, parsed)) : 12;
  if (meridiem === "AM") {
    return safe === 12 ? 0 : safe;
  }
  return safe === 12 ? 12 : safe + 12;
}

/** Snap minutes to nearest 5-minute step used by the picker. */
function snapMinute(minute: number): string {
  const snapped = Math.round(minute / 5) * 5;
  const normalized = snapped === 60 ? 55 : snapped;
  return padTwo(normalized);
}

export function emptyDueParts(now = new Date()): MyWorkDueParts {
  const { hour12, meridiem } = toHour12(now.getHours());
  return {
    date: `${now.getFullYear()}-${padTwo(now.getMonth() + 1)}-${padTwo(now.getDate())}`,
    hour12,
    minute: snapMinute(now.getMinutes()),
    meridiem,
  };
}

export function duePartsFromIso(iso: string | null | undefined): MyWorkDueParts {
  if (!iso) {
    return emptyDueParts();
  }
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) {
    return emptyDueParts();
  }
  const { hour12, meridiem } = toHour12(date.getHours());
  return {
    date: `${date.getFullYear()}-${padTwo(date.getMonth() + 1)}-${padTwo(date.getDate())}`,
    hour12,
    minute: snapMinute(date.getMinutes()),
    meridiem,
  };
}

export function duePartsToIso(parts: MyWorkDueParts): string | null {
  if (!parts.date) return null;
  const hour24 = toHour24(parts.hour12, parts.meridiem);
  const minute = Number.parseInt(parts.minute, 10);
  const safeMinute = Number.isFinite(minute) ? minute : 0;
  const local = new Date(
    `${parts.date}T${padTwo(hour24)}:${padTwo(safeMinute)}:00`,
  );
  if (Number.isNaN(local.getTime())) return null;
  return local.toISOString();
}

/**
 * Suggest priority from due urgency:
 * - P1: overdue or due within 4 hours
 * - P2: due within 24 hours
 * - P3: later
 */
export function suggestPriorityFromDueAt(
  dueAtIso: string | null,
  now = new Date(),
): WorkItemPriority {
  if (!dueAtIso) return "P3";
  const due = new Date(dueAtIso);
  if (Number.isNaN(due.getTime())) return "P3";
  const diffMs = due.getTime() - now.getTime();
  if (diffMs <= 4 * 60 * 60 * 1000) return "P1";
  if (diffMs <= 24 * 60 * 60 * 1000) return "P2";
  return "P3";
}

export function dueUrgencyCaption(dueAtIso: string | null): string {
  if (!dueAtIso) return "No due time — priority defaults to P3.";
  const due = new Date(dueAtIso);
  if (Number.isNaN(due.getTime())) return "";
  const diffMs = due.getTime() - Date.now();
  if (diffMs < 0) return "Overdue — suggested priority P1.";
  const hours = Math.floor(diffMs / 3_600_000);
  const mins = Math.floor((diffMs % 3_600_000) / 60_000);
  if (hours < 4) {
    return `Due in ${hours > 0 ? `${hours}h ` : ""}${mins}m — suggested priority P1.`;
  }
  if (hours < 24) {
    return `Due in ${hours}h — suggested priority P2.`;
  }
  return `Due in ${Math.ceil(hours / 24)} day(s) — suggested priority P3.`;
}

interface MyWorkDueDateTimeFieldProps {
  value: MyWorkDueParts;
  onChange: (next: MyWorkDueParts) => void;
  className?: string;
  hint?: string;
}

export function MyWorkDueDateTimeField({
  value,
  onChange,
  className,
  hint,
}: MyWorkDueDateTimeFieldProps) {
  const dateId = useId();

  return (
    <fieldset className={cn("min-w-0", className)}>
      <legend className="mb-1 text-[11px] font-medium text-foreground">
        Due date & time
      </legend>
      <div className="flex min-w-0 flex-col gap-2">
        <OperationsDatePicker
          id={dateId}
          value={value.date}
          placeholder="Select date"
          compact
          aria-label="Due date"
          onChange={(date) => onChange({ ...value, date })}
        />
        <div className="grid min-w-0 grid-cols-[1fr_1fr_auto] gap-1.5">
          <OperationsFilterSelect
            label="Hour"
            value={value.hour12}
            options={HOUR_OPTIONS}
            hideSearch
            triggerClassName={triggerClassName}
            onChange={(hour12) => onChange({ ...value, hour12 })}
          />
          <OperationsFilterSelect
            label="Minute"
            value={value.minute}
            options={MINUTE_OPTIONS}
            hideSearch
            triggerClassName={triggerClassName}
            onChange={(minute) => onChange({ ...value, minute })}
          />
          <div
            role="group"
            aria-label="AM or PM"
            className="inline-flex h-9 overflow-hidden rounded-md border border-border-subtle bg-surface shadow-[0_1px_2px_rgba(15,23,42,0.04)]"
          >
            {MERIDIEM_OPTIONS.map((option) => {
              const selected = value.meridiem === option.value;
              return (
                <button
                  key={option.value}
                  type="button"
                  aria-pressed={selected}
                  onClick={() =>
                    onChange({ ...value, meridiem: option.value })
                  }
                  className={cn(
                    "min-w-[2.75rem] px-2 text-[11px] font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary/30",
                    selected
                      ? "bg-primary text-white"
                      : "text-muted hover:bg-hero-bg hover:text-foreground",
                  )}
                >
                  {option.label}
                </button>
              );
            })}
          </div>
        </div>
        {hint ? <p className="text-[10px] text-muted">{hint}</p> : null}
      </div>
    </fieldset>
  );
}
