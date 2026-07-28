import type { ApplicationInterview } from "@/types/job-seeker-applications";
import { cn } from "@/utils/cn";

type InterviewDetailRow = {
  label: string;
  value: string;
};

type ApplicationInterviewDetailsProps = {
  interview: ApplicationInterview;
  candidatePhone?: string | null;
  className?: string;
};

function textValue(value: string | null | undefined): string {
  return typeof value === "string" ? value.trim() : "";
}

function formatInterviewMode(mode: ApplicationInterview["mode"]): string {
  switch (mode) {
    case "online":
      return "Online";
    case "offline":
      return "Offline";
    case "phone":
      return "Phone";
    default:
      return mode || "—";
  }
}

function formatInterviewTime(time: string): string {
  const match = /^(\d{1,2}):(\d{2})/.exec(time.trim());
  if (!match) {
    return time.trim() || "—";
  }

  const hour24 = Number(match[1]);
  const minute = match[2];
  if (!Number.isFinite(hour24) || hour24 < 0 || hour24 > 23) {
    return time.trim() || "—";
  }

  const period = hour24 >= 12 ? "PM" : "AM";
  const hour12 = hour24 % 12 === 0 ? 12 : hour24 % 12;
  return `${hour12}:${minute} ${period}`;
}

function formatCancelledAt(value: string | null | undefined): string {
  if (!value) {
    return "—";
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }
  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

/**
 * Builds mode-aware interview detail rows for read-only display.
 * Hides mode-irrelevant fields and omits empty optional values.
 */
export function buildInterviewDetailRows(input: {
  interview: ApplicationInterview;
  candidatePhone?: string | null;
}): InterviewDetailRow[] {
  const interview = input.interview;
  const isCancelled = Boolean(textValue(interview.cancelledAt ?? ""));
  const mode = interview.mode;
  const rows: InterviewDetailRow[] = [
    { label: "Status", value: isCancelled ? "Cancelled" : "Scheduled" },
    { label: "Date", value: textValue(interview.date) || "—" },
    {
      label: "Time",
      value: textValue(interview.time)
        ? formatInterviewTime(interview.time)
        : "—",
    },
    { label: "Mode", value: formatInterviewMode(mode) },
    {
      label: "Interviewer",
      value: textValue(interview.interviewerName) || "—",
    },
  ];

  const designation = textValue(interview.interviewerDesignation);
  if (designation) {
    rows.push({ label: "Designation", value: designation });
  }

  if (isCancelled) {
    const reason = textValue(interview.cancellationReason);
    if (reason) {
      rows.push({ label: "Cancellation reason", value: reason });
    }
    rows.push({
      label: "Cancelled on",
      value: formatCancelledAt(interview.cancelledAt),
    });
    return rows;
  }

  const interviewerEmail = textValue(interview.interviewerEmail);
  if (interviewerEmail) {
    rows.push({ label: "Interviewer email", value: interviewerEmail });
  }

  const interviewerPhone = textValue(interview.interviewerPhone);
  if (interviewerPhone) {
    rows.push({ label: "Interviewer phone", value: interviewerPhone });
  }

  if (mode === "online") {
    const meetingLink = textValue(interview.meetingLink);
    if (meetingLink) {
      rows.push({ label: "Meeting link", value: meetingLink });
    }
  } else if (mode === "offline") {
    const venue = textValue(interview.venue);
    if (venue) {
      rows.push({ label: "Venue", value: venue });
    }
  } else if (mode === "phone") {
    const candidatePhone = textValue(input.candidatePhone);
    if (candidatePhone) {
      rows.push({ label: "Candidate phone", value: candidatePhone });
    }
  } else {
    const meetingLink = textValue(interview.meetingLink);
    if (meetingLink) {
      rows.push({ label: "Meeting link", value: meetingLink });
    }
    const venue = textValue(interview.venue);
    if (venue) {
      rows.push({ label: "Venue", value: venue });
    }
  }

  const instructions = textValue(interview.instructions);
  if (instructions) {
    rows.push({ label: "Instructions", value: instructions });
  }

  return rows;
}

export function ApplicationInterviewDetails({
  interview,
  candidatePhone,
  className,
}: ApplicationInterviewDetailsProps) {
  const isCancelled = Boolean(textValue(interview.cancelledAt ?? ""));
  const rows = buildInterviewDetailRows({ interview, candidatePhone });

  return (
    <div className={cn("space-y-3", className)}>
      {isCancelled ? (
        <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm font-semibold text-pin-state">
          Interview Cancelled
        </p>
      ) : null}
      <dl className="space-y-2 text-sm">
        {rows.map((row) => (
          <div
            key={row.label}
            className="flex items-start justify-between gap-3"
          >
            <dt className="text-muted">{row.label}</dt>
            <dd className="max-w-[60%] break-words text-right font-medium text-foreground">
              {row.label === "Mode" || row.label === "Date" ? (
                <span className="capitalize">{row.value}</span>
              ) : row.label === "Meeting link" &&
                /^https?:\/\//i.test(row.value) ? (
                <a
                  href={row.value}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary underline-offset-2 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
                >
                  {row.value}
                </a>
              ) : (
                row.value
              )}
            </dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
