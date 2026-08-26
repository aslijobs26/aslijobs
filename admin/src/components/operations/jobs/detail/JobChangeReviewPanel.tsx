import { JobDescriptionContent } from "../../../ui/JobDescriptionContent";
import type { OperationsJobDetail } from "../../../../types/operations-jobs";
import { cn } from "../../../../utils/cn";

type PendingLiveRevision = {
  jobTitle?: string;
  description?: string;
  jobType?: string;
  workMode?: string;
  vacancies?: number;
  stateName?: string;
  cityName?: string;
  state?: string;
  city?: string;
  address?: string;
  landmark?: string;
  salaryType?: string;
  salaryPeriod?: string;
  fixedSalary?: number | null;
  minimumSalary?: number | null;
  maximumSalary?: number | null;
  education?: string[];
  experience?: string;
  languages?: string[];
  gender?: string[];
  minimumAge?: number | null;
  maximumAge?: number | null;
  walkInEnabled?: boolean;
  interviewAddress?: string;
  walkInStartDate?: string;
  walkInEndDate?: string;
  walkInStartTime?: string;
  walkInEndTime?: string;
  interviewInstructions?: string;
  perks?: string[];
};

type ChangeRow = {
  id: string;
  label: string;
  before: string;
  after: string;
  richText?: boolean;
};

function formatCurrencyAmount(amount: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
}

function humanizeToken(value: string): string {
  return value
    .split(/[_-]/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function formatPerkLabels(perks: string[]): string[] {
  return perks.map((perk) => humanizeToken(perk));
}

function asRevision(value: unknown): PendingLiveRevision | null {
  if (!value || typeof value !== "object") {
    return null;
  }
  return value as PendingLiveRevision;
}

function text(value: unknown): string {
  if (typeof value === "number" && Number.isFinite(value)) {
    return String(value);
  }
  if (typeof value === "string") {
    return value.trim();
  }
  if (Array.isArray(value)) {
    return value.map(String).filter(Boolean).join(", ");
  }
  if (typeof value === "boolean") {
    return value ? "Yes" : "No";
  }
  return "";
}

function locationLabel(input: {
  cityName?: string;
  stateName?: string;
  city?: string;
  state?: string;
  address?: string;
}): string {
  const city = input.cityName?.trim() || input.city?.trim() || "";
  const state = input.stateName?.trim() || input.state?.trim() || "";
  const place = [city, state].filter(Boolean).join(", ");
  const address = input.address?.trim() || "";
  return [place, address].filter(Boolean).join(" · ") || "—";
}

function salaryLabel(input: {
  salaryType?: string;
  salaryPeriod?: string;
  fixedSalary?: number | null;
  minimumSalary?: number | null;
  maximumSalary?: number | null;
}): string {
  const period = input.salaryPeriod === "per-year" ? "/year" : "/month";
  if (input.salaryType === "fixed" && typeof input.fixedSalary === "number") {
    return `${formatCurrencyAmount(input.fixedSalary)} ${period}`;
  }
  if (
    typeof input.minimumSalary === "number" &&
    typeof input.maximumSalary === "number"
  ) {
    return `${formatCurrencyAmount(input.minimumSalary)} - ${formatCurrencyAmount(input.maximumSalary)} ${period}`;
  }
  return "—";
}

function requirementsLabel(input: {
  education?: string[];
  experience?: string;
  languages?: string[];
  gender?: string[];
  minimumAge?: number | null;
  maximumAge?: number | null;
}): string {
  const parts = [
    text(input.education),
    text(input.experience),
    text(input.languages),
    text(input.gender),
  ].filter(Boolean);

  if (input.minimumAge != null || input.maximumAge != null) {
    parts.push(
      `Age ${input.minimumAge ?? "—"}–${input.maximumAge ?? "—"}`,
    );
  }

  return parts.join(" · ") || "—";
}

function walkInLabel(input: {
  walkInEnabled?: boolean;
  interviewAddress?: string;
  walkInStartDate?: string;
  walkInEndDate?: string;
  walkInStartTime?: string;
  walkInEndTime?: string;
  interviewInstructions?: string;
}): string {
  if (!input.walkInEnabled) {
    return "Walk-in disabled";
  }

  const schedule = [
    [input.walkInStartDate, input.walkInEndDate].filter(Boolean).join(" → "),
    [input.walkInStartTime, input.walkInEndTime].filter(Boolean).join(" – "),
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    [
      input.interviewAddress?.trim() || "",
      schedule,
      input.interviewInstructions?.trim() || "",
    ]
      .filter(Boolean)
      .join(" · ") || "Walk-in enabled"
  );
}

function buildChangeRows(
  job: OperationsJobDetail,
  revision: PendingLiveRevision,
): ChangeRow[] {
  const rows: ChangeRow[] = [
    {
      id: "jobTitle",
      label: "Job title",
      before: job.jobTitle || "—",
      after: text(revision.jobTitle) || "—",
    },
    {
      id: "description",
      label: "Description",
      before: job.description || "—",
      after: text(revision.description) || "—",
      richText: true,
    },
    {
      id: "jobType",
      label: "Job type",
      before: job.jobTypeLabel || job.jobType || "—",
      after: text(revision.jobType) || "—",
    },
    {
      id: "workMode",
      label: "Work mode",
      before: job.workModeLabel || job.workMode || "—",
      after: text(revision.workMode) || "—",
    },
    {
      id: "vacancies",
      label: "Vacancies",
      before: String(job.vacancies ?? "—"),
      after: text(revision.vacancies) || "—",
    },
    {
      id: "location",
      label: "Location",
      before: locationLabel(job),
      after: locationLabel(revision),
    },
    {
      id: "salary",
      label: "Salary",
      before: job.salaryLabel || salaryLabel(job),
      after: salaryLabel(revision),
    },
    {
      id: "requirements",
      label: "Candidate requirements",
      before: requirementsLabel(job),
      after: requirementsLabel(revision),
    },
    {
      id: "walkIn",
      label: "Interview / walk-in",
      before: walkInLabel(job),
      after: walkInLabel(revision),
    },
    {
      id: "benefits",
      label: "Benefits",
      before: formatPerkLabels(job.perks).join(", ") || "—",
      after: formatPerkLabels(
        Array.isArray(revision.perks) ? revision.perks.map(String) : [],
      ).join(", ") || "—",
    },
  ];

  return rows.filter((row) => row.before !== row.after);
}

type JobChangeReviewPanelProps = {
  job: OperationsJobDetail;
};

export function JobChangeReviewPanel({ job }: JobChangeReviewPanelProps) {
  const revision = asRevision(job.pendingLiveRevision);
  if (!revision) {
    return null;
  }

  const rows = buildChangeRows(job, revision);
  if (rows.length === 0) {
    return (
      <section className="rounded-xl border border-border-subtle bg-surface p-3 shadow-sm sm:p-4">
        <h2 className="text-sm font-semibold text-foreground">
          Proposed changes
        </h2>
        <p className="mt-2 text-xs text-muted">
          No field-level differences were detected in the pending revision.
        </p>
      </section>
    );
  }

  return (
    <section className="rounded-xl border border-warning/30 bg-warning/5 p-3 shadow-sm sm:p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-sm font-semibold text-foreground">
          Edited live job — before / after
        </h2>
        <span className="inline-flex rounded-full bg-warning/15 px-2 py-0.5 text-[10px] font-semibold text-warning">
          Changes pending approval
        </span>
      </div>
      <p className="mt-1 text-[11px] text-muted">
        Live listing stays public until these changes are approved.
      </p>

      <div className="mt-3 overflow-hidden rounded-lg border border-border-subtle bg-surface">
        <div className="grid grid-cols-[minmax(0,7rem)_minmax(0,1fr)_minmax(0,1fr)] gap-px bg-border-subtle text-[10px] font-semibold uppercase tracking-wide text-muted">
          <div className="bg-hero-bg/60 px-2.5 py-2">Field</div>
          <div className="bg-hero-bg/60 px-2.5 py-2">Current live</div>
          <div className="bg-hero-bg/60 px-2.5 py-2">Proposed</div>
        </div>
        <ul className="divide-y divide-border-subtle">
          {rows.map((row) => (
            <li
              key={row.id}
              className="grid grid-cols-[minmax(0,7rem)_minmax(0,1fr)_minmax(0,1fr)] gap-px bg-border-subtle text-xs"
            >
              <div className="bg-surface px-2.5 py-2.5 font-medium text-foreground">
                {row.label}
              </div>
              <div className="min-w-0 bg-surface px-2.5 py-2.5 text-muted">
                {row.richText ? (
                  <JobDescriptionContent
                    html={row.before}
                    className="text-xs leading-relaxed"
                  />
                ) : (
                  <p className="break-words whitespace-pre-wrap">{row.before}</p>
                )}
              </div>
              <div
                className={cn(
                  "min-w-0 bg-surface px-2.5 py-2.5 text-foreground",
                  "ring-1 ring-inset ring-primary/15",
                )}
              >
                {row.richText ? (
                  <JobDescriptionContent
                    html={row.after}
                    className="text-xs leading-relaxed"
                  />
                ) : (
                  <p className="break-words whitespace-pre-wrap">{row.after}</p>
                )}
              </div>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
