"use client";

import {
  isEmployerTerminalStatus,
  type EmployerApplicationDetail,
} from "@/types/employer-applications";
import type { ApplicationInterview } from "@/types/job-seeker-applications";
import { cn } from "@/utils/cn";
import { useEffect, useState } from "react";

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
    errors.venue = "Venue is required for offline interviews.";
  }

  if (draft.mode === "phone" && !draft.interviewerPhone.trim()) {
    errors.interviewerPhone = "Recruiter phone is required for phone interviews.";
  }

  return errors;
}

function normalizePayload(draft: ApplicationInterview): ApplicationInterview {
  const next = normalizeInterview(draft);
  if (next.mode === "online") {
    next.venue = "";
  } else if (next.mode === "offline") {
    next.meetingLink = "";
  } else if (next.mode === "phone") {
    next.meetingLink = "";
    next.venue = "";
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
  const timeSelectClassName =
    "w-full min-w-0 rounded-lg border border-border-subtle bg-surface px-2 py-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 disabled:cursor-not-allowed disabled:opacity-60";

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
          <input
            id={`interview-date-${application.id}`}
            type="date"
            min={todayDateString()}
            value={draft.date}
            disabled={isLocked || isSaving}
            onChange={(event) => updateField("date", event.target.value)}
            className={inputClassName}
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
              <select
                id={`interview-time-hour-${application.id}`}
                value={parseTwelveHourTime(draft.time).hour}
                disabled={isLocked || isSaving}
                onChange={(event) => {
                  const current = parseTwelveHourTime(draft.time);
                  updateField(
                    "time",
                    toTwentyFourHourTime(
                      event.target.value,
                      current.minute || "00",
                      current.period,
                    ),
                  );
                }}
                className={timeSelectClassName}
              >
                <option value="">Hour</option>
                {HOUR_OPTIONS.map((hour) => (
                  <option key={hour} value={hour}>
                    {hour}
                  </option>
                ))}
              </select>
            </div>
            <div className="min-w-0">
              <label
                htmlFor={`interview-time-minute-${application.id}`}
                className="sr-only"
              >
                Minute
              </label>
              <select
                id={`interview-time-minute-${application.id}`}
                value={parseTwelveHourTime(draft.time).minute}
                disabled={isLocked || isSaving}
                onChange={(event) => {
                  const current = parseTwelveHourTime(draft.time);
                  if (!current.hour) {
                    return;
                  }
                  updateField(
                    "time",
                    toTwentyFourHourTime(
                      current.hour,
                      event.target.value,
                      current.period,
                    ),
                  );
                }}
                className={timeSelectClassName}
              >
                <option value="">Min</option>
                {MINUTE_OPTIONS.map((minute) => (
                  <option key={minute} value={minute}>
                    {minute}
                  </option>
                ))}
              </select>
            </div>
            <div className="min-w-0">
              <label
                htmlFor={`interview-time-period-${application.id}`}
                className="sr-only"
              >
                AM or PM
              </label>
              <select
                id={`interview-time-period-${application.id}`}
                value={parseTwelveHourTime(draft.time).period}
                disabled={isLocked || isSaving}
                onChange={(event) => {
                  const current = parseTwelveHourTime(draft.time);
                  if (!current.hour) {
                    return;
                  }
                  updateField(
                    "time",
                    toTwentyFourHourTime(
                      current.hour,
                      current.minute || "00",
                      event.target.value as TimePeriod,
                    ),
                  );
                }}
                className={timeSelectClassName}
              >
                <option value="AM">AM</option>
                <option value="PM">PM</option>
              </select>
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
        <select
          id={`interview-mode-${application.id}`}
          value={draft.mode}
          disabled={isLocked || isSaving}
          onChange={(event) =>
            updateField(
              "mode",
              event.target.value as ApplicationInterview["mode"],
            )
          }
          className={inputClassName}
        >
          <option value="">Select</option>
          <option value="online">Online</option>
          <option value="offline">Offline</option>
          <option value="phone">Phone</option>
        </select>
        {fieldErrors.mode ? (
          <p className="mt-1 text-xs font-medium text-red-600">
            {fieldErrors.mode}
          </p>
        ) : null}
      </div>

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

      {draft.mode === "offline" ? (
        <div>
          <label
            htmlFor={`interview-venue-${application.id}`}
            className="block text-xs font-medium text-muted"
          >
            Venue
          </label>
          <input
            id={`interview-venue-${application.id}`}
            type="text"
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
