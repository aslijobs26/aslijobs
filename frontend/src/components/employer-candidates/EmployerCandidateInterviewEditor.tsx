"use client";

import {
  isEmployerTerminalStatus,
  type EmployerApplicationDetail,
} from "@/types/employer-applications";
import type { ApplicationInterview } from "@/types/job-seeker-applications";
import {
  computeAnchoredDropdownPosition,
  readSafeAreaInsets,
  readVisibleViewportSize,
  type AnchoredDropdownPosition,
} from "@/utils/anchored-dropdown-position";
import { cn } from "@/utils/cn";
import { PostJobDatePicker } from "@/components/post-job/PostJobDatePicker";
import { Check, ChevronDown } from "lucide-react";
import { useCallback, useEffect, useId, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

export const EMPLOYER_INTERVIEW_INSTRUCTIONS_MAX_LENGTH = 1000;

export type EmployerInterviewSavePayload = ApplicationInterview;

type FieldErrors = Partial<Record<keyof ApplicationInterview, string>>;

type EmployerCandidateInterviewEditorProps = {
  application: EmployerApplicationDetail;
  isSaving: boolean;
  onSave: (payload: EmployerInterviewSavePayload) => void;
  className?: string;
  compact?: boolean;
};

const EMPTY_INTERVIEW: ApplicationInterview = {
  date: "",
  time: "",
  mode: "",
  meetingLink: "",
  venue: "",
  instructions: "",
  interviewerName: "",
  interviewerDesignation: "",
  interviewerEmail: "",
  interviewerPhone: "",
  cancelledAt: null,
  cancellationReason: "",
  cancelledByName: "",
};

function todayDateString(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

type TimePeriod = "AM" | "PM";

type TwelveHourTimeParts = {
  hour: string;
  minute: string;
  period: TimePeriod;
};

const HOUR_OPTIONS = Array.from({ length: 12 }, (_, index) =>
  String(index + 1),
);
const MINUTE_OPTIONS = Array.from({ length: 60 }, (_, index) =>
  String(index).padStart(2, "0"),
);

const INTERVIEW_OPTION_MENU_EVENT = "aslijobs:interview-option-menu";

const INTERVIEW_MODE_OPTIONS: {
  value: ApplicationInterview["mode"];
  label: string;
}[] = [
  { value: "", label: "Select" },
  { value: "online", label: "Online" },
  { value: "offline", label: "Offline" },
  { value: "phone", label: "Phone" },
];

type InterviewOption<T extends string> = {
  value: T;
  label: string;
};

function InterviewOptionSelect<T extends string>({
  id,
  label,
  value,
  options,
  disabled,
  invalid,
  triggerClassName,
  onChange,
}: {
  id: string;
  label: string;
  value: T;
  options: readonly InterviewOption<T>[];
  disabled: boolean;
  invalid: boolean;
  triggerClassName?: string;
  onChange: (value: T) => void;
}) {
  const listboxId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const didScrollSelectionRef = useRef(false);
  const [isOpen, setIsOpen] = useState(false);
  const [position, setPosition] = useState<AnchoredDropdownPosition | null>(
    null,
  );
  const selected =
    options.find((option) => option.value === value) ?? options[0]!;

  const updatePosition = useCallback(() => {
    const trigger = triggerRef.current;
    const list = listRef.current;
    if (!trigger || !list) {
      return;
    }

    const triggerRect = trigger.getBoundingClientRect();
    const viewport = readVisibleViewportSize();
    const next = computeAnchoredDropdownPosition({
      anchorRect: triggerRect,
      contentWidth: triggerRect.width,
      contentHeight: list.scrollHeight,
      viewportWidth: viewport.width,
      viewportHeight: viewport.height,
      insets: readSafeAreaInsets(),
      gap: 6,
    });
    setPosition({ ...next, left: triggerRect.left });
  }, []);

  useLayoutEffect(() => {
    if (!isOpen) {
      didScrollSelectionRef.current = false;
      return;
    }
    updatePosition();
  }, [isOpen, updatePosition]);

  useLayoutEffect(() => {
    if (!isOpen || !position || didScrollSelectionRef.current) {
      return;
    }
    const list = listRef.current;
    const selectedOption = list?.querySelector<HTMLElement>(
      "[aria-selected='true']",
    );
    if (!list || !selectedOption) {
      return;
    }
    const optionTop = selectedOption.offsetTop;
    const optionHeight = selectedOption.offsetHeight;
    list.scrollTop = Math.max(
      0,
      optionTop - list.clientHeight / 2 + optionHeight / 2,
    );
    didScrollSelectionRef.current = true;
  }, [isOpen, position]);

  useEffect(() => {
    const handleOtherMenu = (event: Event) => {
      const openedId = (event as CustomEvent<string>).detail;
      if (openedId !== listboxId) {
        setIsOpen(false);
      }
    };

    window.addEventListener(INTERVIEW_OPTION_MENU_EVENT, handleOtherMenu);
    return () => {
      window.removeEventListener(INTERVIEW_OPTION_MENU_EVENT, handleOtherMenu);
    };
  }, [listboxId]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const handlePointerDown = (event: MouseEvent) => {
      const target = event.target as Node;
      if (
        !rootRef.current?.contains(target) &&
        !listRef.current?.contains(target)
      ) {
        setIsOpen(false);
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key !== "Escape") {
        return;
      }
      event.preventDefault();
      event.stopPropagation();
      setIsOpen(false);
      triggerRef.current?.focus();
    };

    const handleViewportChange = () => updatePosition();
    const handleScroll = (event: Event) => {
      if (event.target !== listRef.current) {
        updatePosition();
      }
    };
    const visualViewport = window.visualViewport;

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleEscape);
    window.addEventListener("resize", handleViewportChange);
    window.addEventListener("scroll", handleScroll, true);
    visualViewport?.addEventListener("resize", handleViewportChange);
    visualViewport?.addEventListener("scroll", handleViewportChange);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleEscape);
      window.removeEventListener("resize", handleViewportChange);
      window.removeEventListener("scroll", handleScroll, true);
      visualViewport?.removeEventListener("resize", handleViewportChange);
      visualViewport?.removeEventListener("scroll", handleViewportChange);
    };
  }, [isOpen, updatePosition]);

  const triggerWidth = triggerRef.current?.getBoundingClientRect().width;

  return (
    <div ref={rootRef} className="relative">
      <button
        ref={triggerRef}
        id={id}
        type="button"
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-controls={listboxId}
        aria-invalid={invalid || undefined}
        onClick={() => {
          if (disabled) {
            return;
          }
          if (!isOpen) {
            window.dispatchEvent(
              new CustomEvent(INTERVIEW_OPTION_MENU_EVENT, {
                detail: listboxId,
              }),
            );
          }
          setIsOpen((current) => !current);
        }}
        className={cn(
          "flex w-full min-w-0 items-center justify-between gap-2 rounded-lg border bg-surface px-3 py-2 text-left text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 disabled:cursor-not-allowed disabled:opacity-60",
          triggerClassName,
          isOpen
            ? "border-primary ring-2 ring-primary/30"
            : "border-border-subtle",
          value ? "font-medium text-foreground" : "text-muted",
        )}
      >
        <span className="min-w-0 flex-1 truncate">{selected.label}</span>
        <ChevronDown
          className={cn(
            "size-4 shrink-0 text-muted transition-transform",
            isOpen && "rotate-180 text-primary",
          )}
          strokeWidth={2}
          aria-hidden="true"
        />
      </button>

      {isOpen
        ? createPortal(
            <ul
              ref={listRef}
              id={listboxId}
              role="listbox"
              aria-label={label}
              style={
                position
                  ? {
                      top: position.top,
                      left: position.left,
                      width: triggerWidth,
                      maxHeight: position.maxHeight,
                    }
                  : { top: 0, left: 0, visibility: "hidden" }
              }
              className="fixed z-[70] overflow-y-auto overscroll-contain rounded-lg border border-border-subtle bg-surface py-1.5 shadow-[0_10px_28px_rgba(26,43,60,0.14)] scrollbar-hidden"
            >
              {options.map((option) => {
                const isSelected = option.value === value;
                return (
                  <li key={option.label} role="presentation">
                    <button
                      type="button"
                      role="option"
                      aria-selected={isSelected}
                      onClick={() => {
                        onChange(option.value);
                        setIsOpen(false);
                        triggerRef.current?.focus();
                      }}
                      className={cn(
                        "flex w-full items-center justify-between gap-3 px-3 py-2.5 text-left text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary/30",
                        isSelected
                          ? "bg-primary-light font-semibold text-primary"
                          : "font-medium text-foreground hover:bg-primary-light/50",
                      )}
                    >
                      <span className="truncate">{option.label}</span>
                      {isSelected ? (
                        <Check
                          className="size-4 shrink-0 text-primary"
                          strokeWidth={2.5}
                          aria-hidden="true"
                        />
                      ) : null}
                    </button>
                  </li>
                );
              })}
            </ul>,
            document.body,
          )
        : null}
    </div>
  );
}

function parseTwelveHourTime(time: string): TwelveHourTimeParts {
  const match = /^(\d{1,2}):(\d{2})/.exec(time.trim());
  if (!match) {
    return { hour: "", minute: "", period: "AM" };
  }

  const hour24 = Number(match[1]);
  const minute = match[2];
  if (
    !Number.isFinite(hour24) ||
    hour24 < 0 ||
    hour24 > 23 ||
    minute.length !== 2
  ) {
    return { hour: "", minute: "", period: "AM" };
  }

  const period: TimePeriod = hour24 >= 12 ? "PM" : "AM";
  const hour12 = hour24 % 12 === 0 ? 12 : hour24 % 12;
  return {
    hour: String(hour12),
    minute,
    period,
  };
}

function toTwentyFourHourTime(
  hour: string,
  minute: string,
  period: TimePeriod,
): string {
  if (!hour || !minute) {
    return "";
  }

  const hour12 = Number(hour);
  if (!Number.isFinite(hour12) || hour12 < 1 || hour12 > 12) {
    return "";
  }

  let hour24 = hour12 % 12;
  if (period === "PM") {
    hour24 += 12;
  }

  return `${String(hour24).padStart(2, "0")}:${minute.padStart(2, "0")}`;
}

function normalizeInterview(
  value: ApplicationInterview | null | undefined,
): ApplicationInterview {
  return {
    ...EMPTY_INTERVIEW,
    ...(value ?? {}),
    date: value?.date?.trim() ?? "",
    time: value?.time?.trim() ?? "",
    mode: value?.mode ?? "",
    meetingLink: value?.meetingLink?.trim() ?? "",
    venue: value?.venue?.trim() ?? "",
    instructions: value?.instructions?.trim() ?? "",
    interviewerName: value?.interviewerName?.trim() ?? "",
    interviewerDesignation: value?.interviewerDesignation?.trim() ?? "",
    interviewerEmail: value?.interviewerEmail?.trim() ?? "",
    interviewerPhone: value?.interviewerPhone?.trim() ?? "",
    cancelledAt: value?.cancelledAt?.trim() || null,
    cancellationReason: value?.cancellationReason?.trim() ?? "",
    cancelledByName: value?.cancelledByName?.trim() ?? "",
  };
}

function isInterviewCancelled(
  interview: ApplicationInterview | null | undefined,
): boolean {
  return Boolean(interview?.cancelledAt?.trim());
}

function interviewsEqual(
  left: ApplicationInterview,
  right: ApplicationInterview,
): boolean {
  return (
    left.date === right.date &&
    left.time === right.time &&
    left.mode === right.mode &&
    left.meetingLink === right.meetingLink &&
    left.venue === right.venue &&
    left.instructions === right.instructions &&
    left.interviewerName === right.interviewerName &&
    left.interviewerDesignation === right.interviewerDesignation &&
    left.interviewerEmail === right.interviewerEmail &&
    left.interviewerPhone === right.interviewerPhone
  );
}

function isHttpsUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === "https:";
  } catch {
    return false;
  }
}

function validateInterview(draft: ApplicationInterview): FieldErrors {
  const errors: FieldErrors = {};
  const today = todayDateString();

  if (!draft.date.trim()) {
    errors.date = "Interview date is required.";
  } else if (draft.date < today) {
    errors.date = "Interview date cannot be in the past.";
  }

  if (!draft.time.trim()) {
    errors.time = "Interview time is required.";
  }

  if (!draft.mode) {
    errors.mode = "Select an interview mode.";
  }

  if (!draft.interviewerName.trim()) {
    errors.interviewerName = "Interviewer name is required.";
  }

  if (
    draft.interviewerEmail.trim() &&
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(draft.interviewerEmail.trim())
  ) {
    errors.interviewerEmail = "Enter a valid interviewer email.";
  }

  if (draft.instructions.length > EMPLOYER_INTERVIEW_INSTRUCTIONS_MAX_LENGTH) {
    errors.instructions = "Instructions must be 1000 characters or fewer.";
  }

  if (draft.mode === "online") {
    if (!draft.meetingLink.trim()) {
      errors.meetingLink = "Meeting link is required for online interviews.";
    } else if (!isHttpsUrl(draft.meetingLink.trim())) {
      errors.meetingLink = "Meeting link must be a valid HTTPS URL.";
    }
  }

  if (draft.mode === "offline" && !draft.venue.trim()) {
    errors.venue = "Location is required.";
  }

  if (draft.mode === "phone" && !draft.interviewerPhone.trim()) {
    errors.interviewerPhone = "Recruiter phone is required for phone interviews.";
  }

  return errors;
}

function normalizePayload(draft: ApplicationInterview): ApplicationInterview {
  const next = normalizeInterview(draft);
  if (next.mode !== "offline") {
    next.venue = "";
  }
  if (next.mode === "offline" || next.mode === "phone") {
    next.meetingLink = "";
  }
  return next;
}

export function EmployerCandidateInterviewEditor({
  application,
  isSaving,
  onSave,
  className,
  compact = false,
}: EmployerCandidateInterviewEditorProps) {
  const [draft, setDraft] = useState<ApplicationInterview>(() =>
    normalizeInterview(application.interview),
  );
  const [errors, setErrors] = useState<FieldErrors>({});
  const [showErrors, setShowErrors] = useState(false);

  useEffect(() => {
    setDraft(normalizeInterview(application.interview));
    setErrors({});
    setShowErrors(false);
  }, [
    application.id,
    application.interview?.date,
    application.interview?.time,
    application.interview?.mode,
    application.interview?.meetingLink,
    application.interview?.venue,
    application.interview?.instructions,
    application.interview?.interviewerName,
    application.interview?.interviewerDesignation,
    application.interview?.interviewerEmail,
    application.interview?.interviewerPhone,
  ]);

  const saved = normalizeInterview(application.interview);
  const isTerminal = isEmployerTerminalStatus(application.status);
  const isCancelled = isInterviewCancelled(application.interview);
  const isLocked = isTerminal || isCancelled;
  const hasExistingInterview = Boolean(
    saved.date || saved.time || saved.mode || saved.interviewerName,
  );
  const isDirty = !interviewsEqual(normalizePayload(draft), saved);
  const fieldErrors = showErrors ? errors : {};
  const canSubmit = !isLocked && !isSaving && isDirty;

  const updateField = <K extends keyof ApplicationInterview>(
    key: K,
    value: ApplicationInterview[K],
  ) => {
    setDraft((current) => ({ ...current, [key]: value }));
  };

  const handleSubmit = () => {
    if (isLocked || isSaving) {
      return;
    }

    const payload = normalizePayload(draft);
    const nextErrors = validateInterview(payload);
    setErrors(nextErrors);
    setShowErrors(true);

    if (Object.keys(nextErrors).length > 0 || !isDirty) {
      return;
    }

    onSave(payload);
  };

  const inputClassName =
    "mt-1 w-full min-w-0 rounded-lg border border-border-subtle bg-surface px-3 py-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 disabled:cursor-not-allowed disabled:opacity-60";
  const timeParts = parseTwelveHourTime(draft.time);
  const hourOptions: InterviewOption<string>[] = [
    { value: "", label: "Hour" },
    ...HOUR_OPTIONS.map((hour) => ({ value: hour, label: hour })),
  ];
  const minuteOptions: InterviewOption<string>[] = [
    { value: "", label: "Min" },
    ...MINUTE_OPTIONS.map((minute) => ({ value: minute, label: minute })),
  ];
  const periodOptions: InterviewOption<TimePeriod>[] = [
    { value: "AM", label: "AM" },
    { value: "PM", label: "PM" },
  ];

  return (
    <div className={cn("space-y-3", className)}>
      {isCancelled ? (
        <p className="text-xs font-medium text-pin-state">
          This interview has been cancelled
          {saved.cancellationReason
            ? ` (${saved.cancellationReason})`
            : ""}
          . Edit / Reschedule is disabled.
        </p>
      ) : isTerminal ? (
        <p className="text-xs text-muted">
          This application is in a terminal hiring status.
        </p>
      ) : (
        <p className="text-xs text-muted">
          Scheduling an interview automatically sets hiring status to Interview
          Scheduled when the candidate is still in an earlier stage.
        </p>
      )}

      <div className="grid grid-cols-1 gap-3">
        <div className="min-w-0">
          <label
            htmlFor={`interview-date-${application.id}`}
            className="block text-xs font-medium text-muted"
          >
            Interview date
          </label>
          <PostJobDatePicker
            id={`interview-date-${application.id}`}
            value={draft.date}
            placeholder="dd/mm/yyyy"
            minDate={todayDateString()}
            popoverWidth={280}
            disabled={isLocked || isSaving}
            aria-label="Interview date"
            aria-invalid={Boolean(fieldErrors.date)}
            triggerClassName="mt-1 h-auto rounded-lg border-border-subtle px-3 py-2 text-sm focus-visible:ring-primary/30"
            onChange={(value) => updateField("date", value)}
          />
          {fieldErrors.date ? (
            <p className="mt-1 text-xs font-medium text-red-600">
              {fieldErrors.date}
            </p>
          ) : null}
        </div>

        <div className="min-w-0">
          <span
            id={`interview-time-label-${application.id}`}
            className="block text-xs font-medium text-muted"
          >
            Interview time
          </span>
          <div
            className="mt-1 grid grid-cols-3 gap-2"
            role="group"
            aria-labelledby={`interview-time-label-${application.id}`}
          >
            <div className="min-w-0">
              <label
                htmlFor={`interview-time-hour-${application.id}`}
                className="sr-only"
              >
                Hour
              </label>
              <InterviewOptionSelect
                id={`interview-time-hour-${application.id}`}
                label="Hour"
                value={timeParts.hour}
                options={hourOptions}
                disabled={isLocked || isSaving}
                invalid={Boolean(fieldErrors.time)}
                triggerClassName="px-2"
                onChange={(hour) => {
                  updateField(
                    "time",
                    toTwentyFourHourTime(
                      hour,
                      timeParts.minute || "00",
                      timeParts.period,
                    ),
                  );
                }}
              />
            </div>
            <div className="min-w-0">
              <label
                htmlFor={`interview-time-minute-${application.id}`}
                className="sr-only"
              >
                Minute
              </label>
              <InterviewOptionSelect
                id={`interview-time-minute-${application.id}`}
                label="Minute"
                value={timeParts.minute}
                options={minuteOptions}
                disabled={isLocked || isSaving}
                invalid={Boolean(fieldErrors.time)}
                triggerClassName="px-2"
                onChange={(minute) => {
                  if (!timeParts.hour) {
                    return;
                  }
                  updateField(
                    "time",
                    toTwentyFourHourTime(
                      timeParts.hour,
                      minute,
                      timeParts.period,
                    ),
                  );
                }}
              />
            </div>
            <div className="min-w-0">
              <label
                htmlFor={`interview-time-period-${application.id}`}
                className="sr-only"
              >
                AM or PM
              </label>
              <InterviewOptionSelect
                id={`interview-time-period-${application.id}`}
                label="AM or PM"
                value={timeParts.period}
                options={periodOptions}
                disabled={isLocked || isSaving}
                invalid={Boolean(fieldErrors.time)}
                triggerClassName="px-2"
                onChange={(period) => {
                  if (!timeParts.hour) {
                    return;
                  }
                  updateField(
                    "time",
                    toTwentyFourHourTime(
                      timeParts.hour,
                      timeParts.minute || "00",
                      period,
                    ),
                  );
                }}
              />
            </div>
          </div>
          {fieldErrors.time ? (
            <p className="mt-1 text-xs font-medium text-red-600">
              {fieldErrors.time}
            </p>
          ) : null}
        </div>
      </div>

      <div>
        <label
          htmlFor={`interview-mode-${application.id}`}
          className="block text-xs font-medium text-muted"
        >
          Interview mode
        </label>
        <InterviewOptionSelect
          id={`interview-mode-${application.id}`}
          label="Interview mode"
          value={draft.mode}
          options={INTERVIEW_MODE_OPTIONS}
          disabled={isLocked || isSaving}
          invalid={Boolean(fieldErrors.mode)}
          triggerClassName="mt-1"
          onChange={(mode) => {
            setDraft((current) => ({
              ...current,
              mode,
              venue: mode === "offline" ? current.venue : "",
            }));
          }}
        />
        {fieldErrors.mode ? (
          <p className="mt-1 text-xs font-medium text-red-600">
            {fieldErrors.mode}
          </p>
        ) : null}
      </div>

      {draft.mode === "offline" ? (
        <div className="min-w-0">
          <label
            htmlFor={`interview-location-${application.id}`}
            className="block text-xs font-medium text-muted"
          >
            Location
          </label>
          <input
            id={`interview-location-${application.id}`}
            type="text"
            maxLength={200}
            placeholder="Area, city"
            value={draft.venue}
            disabled={isLocked || isSaving}
            onChange={(event) => updateField("venue", event.target.value)}
            className={inputClassName}
          />
          {fieldErrors.venue ? (
            <p className="mt-1 text-xs font-medium text-red-600">
              {fieldErrors.venue}
            </p>
          ) : null}
        </div>
      ) : null}

      {draft.mode === "online" ? (
        <div>
          <label
            htmlFor={`interview-link-${application.id}`}
            className="block text-xs font-medium text-muted"
          >
            Meeting link
          </label>
          <input
            id={`interview-link-${application.id}`}
            type="url"
            inputMode="url"
            placeholder="https://meet.google.com/…"
            value={draft.meetingLink}
            disabled={isLocked || isSaving}
            onChange={(event) => updateField("meetingLink", event.target.value)}
            className={inputClassName}
          />
          {fieldErrors.meetingLink ? (
            <p className="mt-1 text-xs font-medium text-red-600">
              {fieldErrors.meetingLink}
            </p>
          ) : null}
        </div>
      ) : null}

      {draft.mode === "phone" ? (
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label
              htmlFor={`interview-recruiter-phone-${application.id}`}
              className="block text-xs font-medium text-muted"
            >
              Recruiter phone
            </label>
            <input
              id={`interview-recruiter-phone-${application.id}`}
              type="tel"
              value={draft.interviewerPhone}
              disabled={isLocked || isSaving}
              onChange={(event) =>
                updateField("interviewerPhone", event.target.value)
              }
              className={inputClassName}
            />
            {fieldErrors.interviewerPhone ? (
              <p className="mt-1 text-xs font-medium text-red-600">
                {fieldErrors.interviewerPhone}
              </p>
            ) : null}
          </div>
          <div>
            <p className="block text-xs font-medium text-muted">
              Candidate phone
            </p>
            <p className="mt-1 rounded-lg border border-border-subtle bg-hero-bg px-3 py-2 text-sm font-semibold text-foreground">
              {application.candidate.phone?.trim() || "—"}
            </p>
          </div>
        </div>
      ) : null}

      <div className={cn("grid gap-3", compact ? "grid-cols-1" : "sm:grid-cols-2")}>
        <div>
          <label
            htmlFor={`interview-interviewer-${application.id}`}
            className="block text-xs font-medium text-muted"
          >
            Interviewer name
          </label>
          <input
            id={`interview-interviewer-${application.id}`}
            type="text"
            value={draft.interviewerName}
            disabled={isLocked || isSaving}
            onChange={(event) =>
              updateField("interviewerName", event.target.value)
            }
            className={inputClassName}
          />
          {fieldErrors.interviewerName ? (
            <p className="mt-1 text-xs font-medium text-red-600">
              {fieldErrors.interviewerName}
            </p>
          ) : null}
        </div>
        <div>
          <label
            htmlFor={`interview-designation-${application.id}`}
            className="block text-xs font-medium text-muted"
          >
            Interviewer designation
          </label>
          <input
            id={`interview-designation-${application.id}`}
            type="text"
            value={draft.interviewerDesignation}
            disabled={isLocked || isSaving}
            onChange={(event) =>
              updateField("interviewerDesignation", event.target.value)
            }
            className={inputClassName}
          />
        </div>
        <div>
          <label
            htmlFor={`interview-email-${application.id}`}
            className="block text-xs font-medium text-muted"
          >
            Interviewer email
          </label>
          <input
            id={`interview-email-${application.id}`}
            type="email"
            value={draft.interviewerEmail}
            disabled={isLocked || isSaving}
            onChange={(event) =>
              updateField("interviewerEmail", event.target.value)
            }
            className={inputClassName}
          />
          {fieldErrors.interviewerEmail ? (
            <p className="mt-1 text-xs font-medium text-red-600">
              {fieldErrors.interviewerEmail}
            </p>
          ) : null}
        </div>
        {draft.mode !== "phone" ? (
          <div>
            <label
              htmlFor={`interview-phone-${application.id}`}
              className="block text-xs font-medium text-muted"
            >
              Interviewer phone
            </label>
            <input
              id={`interview-phone-${application.id}`}
              type="tel"
              value={draft.interviewerPhone}
              disabled={isLocked || isSaving}
              onChange={(event) =>
                updateField("interviewerPhone", event.target.value)
              }
              className={inputClassName}
            />
          </div>
        ) : null}
      </div>

      <div>
        <label
          htmlFor={`interview-instructions-${application.id}`}
          className="block text-xs font-medium text-muted"
        >
          Instructions
        </label>
        <textarea
          id={`interview-instructions-${application.id}`}
          rows={compact ? 3 : 4}
          maxLength={EMPLOYER_INTERVIEW_INSTRUCTIONS_MAX_LENGTH}
          value={draft.instructions}
          disabled={isLocked || isSaving}
          onChange={(event) =>
            updateField(
              "instructions",
              event.target.value.slice(
                0,
                EMPLOYER_INTERVIEW_INSTRUCTIONS_MAX_LENGTH,
              ),
            )
          }
          className={inputClassName}
          placeholder="Bring laptop, carry government ID, join 10 minutes early…"
        />
        <div className="mt-1 flex flex-wrap items-center justify-between gap-2">
          <p
            className={cn(
              "text-xs",
              draft.instructions.length >
                EMPLOYER_INTERVIEW_INSTRUCTIONS_MAX_LENGTH
                ? "font-medium text-red-600"
                : "text-muted",
            )}
          >
            {draft.instructions.length} /{" "}
            {EMPLOYER_INTERVIEW_INSTRUCTIONS_MAX_LENGTH}
          </p>
          {fieldErrors.instructions ? (
            <p className="text-xs font-medium text-red-600">
              {fieldErrors.instructions}
            </p>
          ) : null}
        </div>
      </div>

      <button
        type="button"
        disabled={!canSubmit}
        onClick={handleSubmit}
        className={cn(
          "inline-flex min-h-9 items-center justify-center rounded-lg bg-primary px-3 text-xs font-semibold text-surface hover:bg-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 disabled:cursor-not-allowed disabled:opacity-60",
          !compact && "min-h-10 w-full text-sm",
        )}
      >
        {isSaving
          ? hasExistingInterview
            ? "Updating…"
            : "Scheduling…"
          : hasExistingInterview
            ? "Update Interview"
            : "Schedule Interview"}
      </button>
    </div>
  );
}
