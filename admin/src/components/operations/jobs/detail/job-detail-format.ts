import type { OperationsJobDetail } from "../../../../types/operations-jobs";
import { formatBusinessCategoryLabel } from "../../../../constants/operations-post-job-company-options";

export function formatOperationsDateTime(iso: string | null | undefined): string {
  if (!iso) {
    return "—";
  }

  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).format(date);
}

export function formatOperationsDate(iso: string | null | undefined): string {
  if (!iso) {
    return "—";
  }

  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(date);
}

function formatWalkInDate(value: string | null | undefined): string {
  const trimmed = value?.trim();
  if (!trimmed) {
    return "";
  }

  const date = new Date(`${trimmed}T00:00:00`);
  if (Number.isNaN(date.getTime())) {
    return trimmed;
  }

  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(date);
}

function formatWalkInTime(value: string | null | undefined): string {
  const trimmed = value?.trim();
  if (!trimmed) {
    return "";
  }

  const match = /^(\d{1,2}):(\d{2})$/.exec(trimmed);
  if (!match) {
    return trimmed;
  }

  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  if (
    !Number.isInteger(hours) ||
    !Number.isInteger(minutes) ||
    hours < 0 ||
    hours > 23 ||
    minutes < 0 ||
    minutes > 59
  ) {
    return trimmed;
  }

  const date = new Date();
  date.setHours(hours, minutes, 0, 0);

  return new Intl.DateTimeFormat("en-IN", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).format(date);
}

export function formatWalkInDateRange(
  startDate: string | null | undefined,
  endDate: string | null | undefined,
): string {
  const start = formatWalkInDate(startDate);
  const end = formatWalkInDate(endDate);

  if (start && end) {
    return start === end ? start : `${start} – ${end}`;
  }

  return start || end;
}

export function formatWalkInTimeRange(
  startTime: string | null | undefined,
  endTime: string | null | undefined,
): string {
  const start = formatWalkInTime(startTime);
  const end = formatWalkInTime(endTime);

  if (start && end) {
    return `${start} – ${end}`;
  }

  return start || end;
}

export function descriptionParagraphs(description: string): string[] {
  return description
    .split(/\n+/)
    .map((part) => part.trim())
    .filter(Boolean);
}

export interface ParsedJobDescription {
  intro: string[];
  responsibilities: string[];
  requirements: string[];
}

const RESPONSIBILITY_HEADING =
  /^(key\s+)?responsibilit(?:y|ies)\s*:?\s*$/i;
const REQUIREMENT_HEADING = /^requirements?\s*:?\s*$/i;
const BULLET_LINE = /^(?:[-*•]|\d+[.)])\s+(.*)$/;

function stripBullet(line: string): string {
  const match = line.match(BULLET_LINE);
  return match?.[1]?.trim() ?? line.trim();
}

export function parseJobDescription(description: string): ParsedJobDescription {
  const lines = description
    .split(/\n+/)
    .map((line) => line.trim())
    .filter(Boolean);

  const intro: string[] = [];
  const responsibilities: string[] = [];
  const requirements: string[] = [];
  let section: "intro" | "responsibilities" | "requirements" = "intro";

  for (const line of lines) {
    if (RESPONSIBILITY_HEADING.test(line)) {
      section = "responsibilities";
      continue;
    }

    if (REQUIREMENT_HEADING.test(line)) {
      section = "requirements";
      continue;
    }

    if (BULLET_LINE.test(line)) {
      const item = stripBullet(line);
      if (section === "responsibilities") {
        responsibilities.push(item);
      } else if (section === "requirements") {
        requirements.push(item);
      } else {
        intro.push(item);
      }
      continue;
    }

    if (section === "responsibilities") {
      responsibilities.push(line);
    } else if (section === "requirements") {
      requirements.push(line);
    } else {
      intro.push(line);
    }
  }

  return { intro, responsibilities, requirements };
}

function humanizeToken(value: string): string {
  return value
    .split(/[_-]/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export interface JobInformationRow {
  label: string;
  value: string;
}

function partTimeScheduleLabel(schedule: string): string {
  switch (schedule) {
    case "fixed-timings":
      return "Fixed Timings";
    case "flexible-hours":
      return "Flexible Hours";
    default:
      return schedule ? humanizeToken(schedule) : "";
  }
}

function formatContractPeriod(from: string, to: string): string {
  const parts = [from.trim(), to.trim()].filter(Boolean);
  return parts.join(" – ");
}

function formatPartTimeTimings(start: string, end: string): string {
  const parts = [start.trim(), end.trim()].filter(Boolean);
  return parts.join(" – ");
}

const POST_JOB_PERK_LABELS: Record<string, string> = {
  travel_allowance: "Travel Allowance",
  food_meals: "Food/Meal Allowance",
  annual_bonus: "Annual Bonus",
  accommodation: "Accommodation Provided",
  petrol_allowance: "Petrol Allowance",
  mobile_bill_allowance: "Mobile Allowance",
  internet_allowance: "Internet Allowance",
  laptop: "Laptop Provided",
  pf: "PF",
};

function formatPerkList(perks: string[]): string {
  if (!perks.length) {
    return "";
  }

  return perks
    .map((perk) => POST_JOB_PERK_LABELS[perk] ?? humanizeToken(perk))
    .join(", ");
}

function pushRow(
  rows: JobInformationRow[],
  label: string,
  value: string | null | undefined,
  options?: { always?: boolean },
): void {
  const trimmed = value?.trim() ?? "";
  if (trimmed || options?.always) {
    rows.push({ label, value: trimmed || "—" });
  }
}

/** Rows for fields collected in employer registration and the post-job wizard. */
export function jobPostingInformationRows(
  job: OperationsJobDetail,
): JobInformationRow[] {
  const rows: JobInformationRow[] = [];

  pushRow(rows, "Job Type", job.jobTypeLabel, { always: true });
  pushRow(rows, "Work Mode", job.workModeLabel, { always: true });
  pushRow(rows, "Vacancies", String(job.vacancies ?? 0), { always: true });
  pushRow(rows, "Posted On", formatOperationsDateTime(job.publishedAt), {
    always: true,
  });
  pushRow(
    rows,
    "Application Deadline",
    formatOperationsDate(job.listingValidUntil ?? job.analytics.autoExpiryAt),
    { always: true },
  );

  if (job.jobType === "contract") {
    pushRow(
      rows,
      "Contract Period",
      formatContractPeriod(job.contractPeriodFrom, job.contractPeriodTo),
    );
  }

  if (job.jobType === "part-time") {
    if (job.partTimeSchedule) {
      pushRow(rows, "Part Time Schedule", partTimeScheduleLabel(job.partTimeSchedule));
    }

    if (job.partTimeSchedule === "fixed-timings") {
      pushRow(
        rows,
        "Part Time Timings",
        formatPartTimeTimings(job.partTimeStartTime, job.partTimeEndTime),
      );
    }

    if (job.partTimeSchedule === "flexible-hours" && job.partTimeFlexibleHours) {
      const hours = Number(job.partTimeFlexibleHours);
      pushRow(
        rows,
        "Flexible Hours",
        Number.isFinite(hours) && hours > 0
          ? hours === 1
            ? "1 hour"
            : `${hours} hours`
          : humanizeToken(job.partTimeFlexibleHours),
      );
    }
  }

  pushRow(rows, "Industry", job.industry);
  pushRow(
    rows,
    "Business Category",
    formatBusinessCategoryLabel(job.businessCategory),
  );
  pushRow(
    rows,
    "Company Size",
    job.companySize ? humanizeToken(job.companySize) : "",
  );

  pushRow(rows, "Location", job.locationLabel, { always: true });
  pushRow(rows, "Perks", formatPerkList(job.perks));
  pushRow(rows, "Education", job.educationLabel, { always: true });

  return rows;
}

export function formatMetricCount(value: number | null | undefined): string {
  if (value == null) {
    return "—";
  }

  return value.toLocaleString("en-IN");
}

export function jobDetailStatusTone(
  status: OperationsJobDetail["status"],
): "default" | "high" | "medium" | "low" | "job" {
  switch (status) {
    case "active":
      return "default";
    case "expired":
    case "closed":
      return "high";
    case "paused":
      return "medium";
    case "draft":
      return "low";
    default:
      return "job";
  }
}

export function candidateInitials(name: string): string {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}
