"use client";

import { postJobDateFieldShellClassName } from "./post-job-form-styles";
import { cn } from "@/utils/cn";
import { Calendar, ChevronLeft, ChevronRight } from "lucide-react";
import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";

const WEEKDAY_LABELS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"] as const;

const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
] as const;

const SHORT_MONTH_NAMES = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
] as const;

const YEAR_PAGE_SIZE = 12;
const VIEWPORT_PADDING_PX = 16;

type PanelView = "days" | "months" | "years";

type PostJobDatePickerProps = {
  id: string;
  value: string;
  placeholder: string;
  minDate?: string;
  maxDate?: string;
  /** Smaller calendar panel — used by Job Seeker registration DOB. */
  compact?: boolean;
  onChange: (value: string) => void;
  "aria-label"?: string;
};

type CalendarPosition = {
  top: number;
  left: number;
  width: number;
};

function padTwo(value: number) {
  return String(value).padStart(2, "0");
}

function toIsoDate(date: Date) {
  return `${date.getFullYear()}-${padTwo(date.getMonth() + 1)}-${padTwo(date.getDate())}`;
}

function parseIsoDate(iso: string) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  if (!match) {
    return null;
  }

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const date = new Date(year, month - 1, day);

  if (
    date.getFullYear() !== year ||
    date.getMonth() !== month - 1 ||
    date.getDate() !== day
  ) {
    return null;
  }

  return date;
}

function formatDisplayDate(iso: string) {
  const date = parseIsoDate(iso);
  if (!date) {
    return "";
  }

  return `${padTwo(date.getDate())}/${padTwo(date.getMonth() + 1)}/${date.getFullYear()}`;
}

function getTodayIso() {
  return toIsoDate(new Date());
}

function getCalendarDays(year: number, month: number) {
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const days: Array<Date | null> = [];

  for (let index = 0; index < firstDay; index += 1) {
    days.push(null);
  }

  for (let day = 1; day <= daysInMonth; day += 1) {
    days.push(new Date(year, month, day));
  }

  return days;
}

function getYearPageStart(year: number) {
  return Math.floor(year / YEAR_PAGE_SIZE) * YEAR_PAGE_SIZE;
}

function getYearPageYears(startYear: number) {
  return Array.from({ length: YEAR_PAGE_SIZE }, (_, index) => startYear + index);
}

function getPopoverWidth(triggerWidth: number, compact = false) {
  const maxAvailableWidth = window.innerWidth - VIEWPORT_PADDING_PX * 2;
  const preferredWidth = compact ? Math.min(triggerWidth, 220) : triggerWidth;

  return Math.min(preferredWidth, maxAvailableWidth);
}

function getCalendarPosition(
  triggerRect: DOMRect,
  popoverHeight: number,
  popoverWidth: number,
): CalendarPosition {
  const gap = 4;

  const spaceBelow =
    window.innerHeight - triggerRect.bottom - VIEWPORT_PADDING_PX;
  const spaceAbove = triggerRect.top - VIEWPORT_PADDING_PX;
  const openAbove =
    spaceBelow < popoverHeight + gap && spaceAbove >= popoverHeight + gap;

  const top = openAbove
    ? triggerRect.top - popoverHeight - gap
    : triggerRect.bottom + gap;

  let left = triggerRect.left;

  if (left + popoverWidth > window.innerWidth - VIEWPORT_PADDING_PX) {
    left = window.innerWidth - VIEWPORT_PADDING_PX - popoverWidth;
  }

  if (left < VIEWPORT_PADDING_PX) {
    left = VIEWPORT_PADDING_PX;
  }

  return { top, left, width: popoverWidth };
}

export function PostJobDatePicker({
  id,
  value,
  placeholder,
  minDate,
  maxDate,
  compact = false,
  onChange,
  "aria-label": ariaLabel,
}: PostJobDatePickerProps) {
  const listboxId = useId();
  const triggerRef = useRef<HTMLButtonElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [panelView, setPanelView] = useState<PanelView>("days");
  const [yearRangeStart, setYearRangeStart] = useState(() =>
    getYearPageStart(new Date().getFullYear()),
  );
  const [position, setPosition] = useState<CalendarPosition>({
    top: 0,
    left: 0,
    width: 0,
  });

  const selectedDate = parseIsoDate(value);
  const todayIso = getTodayIso();
  // Post Job default: no past dates. Date of birth: pass maxDate without minDate.
  const minimumIso =
    minDate !== undefined ? minDate : maxDate !== undefined ? null : todayIso;
  const maximumIso = maxDate ?? null;
  const initialMonth =
    selectedDate ??
    (maximumIso ? parseIsoDate(maximumIso) : null) ??
    (minimumIso ? parseIsoDate(minimumIso) : null) ??
    new Date();

  const [visibleMonth, setVisibleMonth] = useState({
    year: initialMonth.getFullYear(),
    month: initialMonth.getMonth(),
  });

  const updatePosition = useCallback(() => {
    if (!triggerRef.current || !popoverRef.current) {
      return;
    }

    const triggerRect = triggerRef.current.getBoundingClientRect();
    const popoverWidth = getPopoverWidth(triggerRect.width, compact);

    setPosition(
      getCalendarPosition(
        triggerRect,
        popoverRef.current.offsetHeight,
        popoverWidth,
      ),
    );
  }, [compact]);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!isOpen) {
      setPanelView("days");
      return;
    }

    const frame = window.requestAnimationFrame(() => updatePosition());

    const handleReposition = () => updatePosition();
    window.addEventListener("resize", handleReposition);
    window.addEventListener("scroll", handleReposition, true);

    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener("resize", handleReposition);
      window.removeEventListener("scroll", handleReposition, true);
    };
  }, [isOpen, updatePosition, visibleMonth, panelView, yearRangeStart]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const handlePointerDown = (event: MouseEvent) => {
      const target = event.target as Node;

      if (
        triggerRef.current?.contains(target) ||
        popoverRef.current?.contains(target)
      ) {
        return;
      }

      setIsOpen(false);
    };

    const handleKeyDown = (event: globalThis.KeyboardEvent) => {
      if (event.key === "Escape") {
        if (panelView !== "days") {
          setPanelView("days");
          return;
        }

        setIsOpen(false);
        triggerRef.current?.focus();
      }
    };

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, panelView]);

  const openCalendar = () => {
    const nextMonth =
      selectedDate ??
      (maximumIso ? parseIsoDate(maximumIso) : null) ??
      (minimumIso ? parseIsoDate(minimumIso) : null) ??
      new Date();
    setVisibleMonth({
      year: nextMonth.getFullYear(),
      month: nextMonth.getMonth(),
    });
    setYearRangeStart(getYearPageStart(nextMonth.getFullYear()));
    setPanelView("days");

    if (triggerRef.current) {
      const triggerRect = triggerRef.current.getBoundingClientRect();
      setPosition({
        top: triggerRect.bottom + 4,
        left: triggerRect.left,
        width: getPopoverWidth(triggerRect.width, compact),
      });
    }

    setIsOpen(true);
  };

  const isDateDisabled = (isoDate: string) => {
    if (minimumIso !== null && isoDate < minimumIso) {
      return true;
    }

    if (maximumIso !== null && isoDate > maximumIso) {
      return true;
    }

    return false;
  };

  const handleSelectDate = (isoDate: string) => {
    if (isDateDisabled(isoDate)) {
      return;
    }

    onChange(isoDate);
    setIsOpen(false);
    setPanelView("days");
    triggerRef.current?.focus();
  };

  const goToPreviousMonth = () => {
    setVisibleMonth((current) => {
      const date = new Date(current.year, current.month - 1, 1);
      return { year: date.getFullYear(), month: date.getMonth() };
    });
  };

  const goToNextMonth = () => {
    setVisibleMonth((current) => {
      const date = new Date(current.year, current.month + 1, 1);
      return { year: date.getFullYear(), month: date.getMonth() };
    });
  };

  const selectMonth = (month: number) => {
    setVisibleMonth((current) => ({ ...current, month }));
    setPanelView("days");
  };

  const selectYear = (year: number) => {
    setVisibleMonth((current) => ({ ...current, year }));
    setPanelView("days");
  };

  const openMonthPanel = () => {
    setPanelView("months");
  };

  const openYearPanel = () => {
    setYearRangeStart(getYearPageStart(visibleMonth.year));
    setPanelView("years");
  };

  const goToPreviousYearRange = () => {
    setYearRangeStart((current) => current - YEAR_PAGE_SIZE);
  };

  const goToNextYearRange = () => {
    setYearRangeStart((current) => current + YEAR_PAGE_SIZE);
  };

  const calendarDays = getCalendarDays(visibleMonth.year, visibleMonth.month);
  const yearPageYears = getYearPageYears(yearRangeStart);
  const yearRangeEnd = yearRangeStart + YEAR_PAGE_SIZE - 1;

  const navButtonClassName = cn(
    "inline-flex shrink-0 items-center justify-center rounded-md border border-border bg-surface text-foreground transition-colors hover:border-primary/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40",
    compact ? "size-6" : "size-7",
  );

  const gridCellClassName = cn(
    "inline-flex h-full w-full items-center justify-center rounded-md font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40",
    compact ? "min-h-6 text-[11px]" : "min-h-7 text-xs",
  );

  const dayCellClassName = cn(
    "inline-flex items-center justify-center rounded-md font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40",
    compact ? "size-6 text-[11px]" : "size-7 text-xs",
  );

  const calendar =
    isOpen && mounted
      ? createPortal(
          <div
            ref={popoverRef}
            id={listboxId}
            role="dialog"
            aria-modal="false"
            aria-label={ariaLabel ? `${ariaLabel} calendar` : "Date calendar"}
            style={{
              top: position.top,
              left: position.left,
              width: position.width || undefined,
              maxWidth: position.width || undefined,
            }}
            className={cn(
              "fixed z-50 box-border min-w-0 overflow-hidden rounded-md border border-border-subtle bg-surface shadow-sm",
              compact ? "p-1.5" : "p-2",
            )}
          >
            <div
              className={cn(
                "flex w-full min-w-0 flex-col overflow-hidden",
                compact ? "h-[11.25rem]" : "h-[14.5rem]",
              )}
            >
              <div
                className={cn(
                  "mb-1 flex shrink-0 items-center gap-1",
                  compact ? "h-7" : "mb-1.5 h-8",
                )}
              >
                {panelView === "days" ? (
                  <>
                    <button
                      type="button"
                      onClick={goToPreviousMonth}
                      className={navButtonClassName}
                      aria-label="Previous month"
                    >
                      <ChevronLeft
                        className="size-3.5"
                        strokeWidth={2}
                        aria-hidden="true"
                      />
                    </button>

                    <div className="flex min-w-0 flex-1 items-center justify-center gap-1">
                      <button
                        type="button"
                        onClick={openMonthPanel}
                        aria-label="Select month"
                        className="inline-flex min-w-0 flex-1 items-center justify-center rounded-md border border-border bg-surface px-1 py-1 text-xs font-semibold text-foreground transition-colors hover:border-primary/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
                      >
                        {SHORT_MONTH_NAMES[visibleMonth.month]}
                      </button>

                      <button
                        type="button"
                        onClick={openYearPanel}
                        aria-label="Select year"
                        className="inline-flex shrink-0 items-center justify-center rounded-md border border-border bg-surface px-1 py-1 text-xs font-semibold tabular-nums text-foreground transition-colors hover:border-primary/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
                      >
                        {visibleMonth.year}
                      </button>
                    </div>

                    <button
                      type="button"
                      onClick={goToNextMonth}
                      className={navButtonClassName}
                      aria-label="Next month"
                    >
                      <ChevronRight
                        className="size-3.5"
                        strokeWidth={2}
                        aria-hidden="true"
                      />
                    </button>
                  </>
                ) : null}

                {panelView === "months" ? (
                  <p className="w-full text-center text-xs font-bold text-foreground">
                    Select Month
                  </p>
                ) : null}

                {panelView === "years" ? (
                  <>
                    <button
                      type="button"
                      onClick={goToPreviousYearRange}
                      className={navButtonClassName}
                      aria-label="Previous years"
                    >
                      <ChevronLeft
                        className="size-3.5"
                        strokeWidth={2}
                        aria-hidden="true"
                      />
                    </button>
                    <p className="min-w-0 flex-1 text-center text-xs font-bold tabular-nums text-foreground">
                      {yearRangeStart} – {yearRangeEnd}
                    </p>
                    <button
                      type="button"
                      onClick={goToNextYearRange}
                      className={navButtonClassName}
                      aria-label="Next years"
                    >
                      <ChevronRight
                        className="size-3.5"
                        strokeWidth={2}
                        aria-hidden="true"
                      />
                    </button>
                  </>
                ) : null}
              </div>

              <div className="mb-0.5 flex h-5 shrink-0 items-center px-1.5">
                {panelView === "days" ? (
                  <div className="grid w-full grid-cols-7 gap-0.5 text-center">
                    {WEEKDAY_LABELS.map((label) => (
                      <span
                        key={label}
                        className="text-[10px] font-semibold text-muted"
                        aria-hidden="true"
                      >
                        {label}
                      </span>
                    ))}
                  </div>
                ) : null}
              </div>

              <div className="min-h-0 flex-1">
                {panelView === "days" ? (
                  <div className="grid h-full grid-cols-7 content-start gap-0.5 px-1.5 text-center">
                    {calendarDays.map((date, index) => {
                      if (!date) {
                        return (
                          <span
                            key={`empty-${index}`}
                            className={compact ? "size-6" : "size-7"}
                            aria-hidden="true"
                          />
                        );
                      }

                      const isoDate = toIsoDate(date);
                      const isSelected = value === isoDate;
                      const isToday = todayIso === isoDate;
                      const isDisabled = isDateDisabled(isoDate);

                      return (
                        <button
                          key={isoDate}
                          type="button"
                          disabled={isDisabled}
                          onClick={() => handleSelectDate(isoDate)}
                          aria-label={formatDisplayDate(isoDate)}
                          aria-pressed={isSelected}
                          className={cn(
                            dayCellClassName,
                            isSelected
                              ? "bg-primary-soft text-surface"
                              : isToday
                                ? "border border-primary/20 text-foreground"
                                : "text-foreground hover:bg-primary-light",
                            isDisabled &&
                              "cursor-not-allowed text-muted opacity-50 hover:bg-transparent",
                          )}
                        >
                          {date.getDate()}
                        </button>
                      );
                    })}
                  </div>
                ) : null}

                {panelView === "months" ? (
                  <div className="grid h-full grid-cols-3 grid-rows-4 gap-0.5">
                    {SHORT_MONTH_NAMES.map((monthName, monthIndex) => (
                      <button
                        key={monthName}
                        type="button"
                        onClick={() => selectMonth(monthIndex)}
                        aria-label={MONTH_NAMES[monthIndex]}
                        aria-pressed={visibleMonth.month === monthIndex}
                        className={cn(
                          gridCellClassName,
                          visibleMonth.month === monthIndex
                            ? "bg-primary-soft text-surface"
                            : "text-foreground hover:bg-primary-light",
                        )}
                      >
                        {monthName}
                      </button>
                    ))}
                  </div>
                ) : null}

                {panelView === "years" ? (
                  <div className="grid h-full grid-cols-3 grid-rows-4 gap-0.5">
                    {yearPageYears.map((year) => (
                      <button
                        key={year}
                        type="button"
                        onClick={() => selectYear(year)}
                        aria-pressed={visibleMonth.year === year}
                        className={cn(
                          gridCellClassName,
                          "tabular-nums",
                          visibleMonth.year === year
                            ? "bg-primary-soft text-surface"
                            : "text-foreground hover:bg-primary-light",
                        )}
                      >
                        {year}
                      </button>
                    ))}
                  </div>
                ) : null}
              </div>
            </div>
          </div>,
          document.body,
        )
      : null;

  return (
    <>
      <button
        ref={triggerRef}
        id={id}
        type="button"
        aria-label={ariaLabel}
        aria-haspopup="dialog"
        aria-expanded={isOpen}
        aria-controls={isOpen ? listboxId : undefined}
        onClick={() => (isOpen ? setIsOpen(false) : openCalendar())}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            openCalendar();
          }
        }}
        className={cn(
          postJobDateFieldShellClassName,
          "pointer-events-auto w-full cursor-pointer text-left transition-colors hover:border-primary/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20",
        )}
      >
        <span className={cn("truncate", !value && "text-muted")}>
          {value ? formatDisplayDate(value) : placeholder}
        </span>
        <Calendar
          className="size-4 shrink-0 text-foreground/70"
          strokeWidth={2}
          aria-hidden="true"
        />
      </button>
      {calendar}
    </>
  );
}
