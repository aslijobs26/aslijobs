import {
  JOB_SEARCH_EDUCATION_LABELS,
  JOB_SEARCH_EXPERIENCE_LABELS,
  JOB_SEARCH_GENDER_LABELS,
  JOB_SEARCH_JOB_TYPE_LABELS,
  JOB_SEARCH_LANGUAGE_LABELS,
  JOB_SEARCH_PERK_LABELS,
  JOB_SEARCH_WORK_MODE_LABELS,
} from "@/constants/job-search";
import type { PublicJobListItem } from "@/services/public-jobs.service";
import { getIndianStateAbbreviation } from "@/utils/employer-jobs-format";

type SalaryPeriodValue = "per-month" | "per-year" | string | null | undefined;

function resolveSalaryPeriodSuffix(
  period: SalaryPeriodValue,
  style: "long" | "short",
): string {
  const isYear = period === "per-year";
  if (style === "short") {
    return isYear ? "/yr" : "/mo";
  }
  return isYear ? " /year" : " /month";
}

export function formatJobSearchSalary(job: {
  salaryType: "fixed" | "range";
  salaryPeriod?: SalaryPeriodValue;
  fixedSalary: number | null;
  minimumSalary: number | null;
  maximumSalary: number | null;
}): string {
  const formatAmount = (value: number) =>
    `₹${value.toLocaleString("en-IN")}`;
  const period = resolveSalaryPeriodSuffix(job.salaryPeriod, "long");

  if (job.salaryType === "fixed" && job.fixedSalary != null) {
    return `${formatAmount(job.fixedSalary)}${period}`;
  }

  if (
    job.salaryType === "range" &&
    job.minimumSalary != null &&
    job.maximumSalary != null
  ) {
    return `${formatAmount(job.minimumSalary)} - ${formatAmount(job.maximumSalary)}${period}`;
  }

  if (job.minimumSalary != null) {
    return `From ${formatAmount(job.minimumSalary)}${period}`;
  }

  if (job.maximumSalary != null) {
    return `Up to ${formatAmount(job.maximumSalary)}${period}`;
  }

  return "Salary not disclosed";
}

/** Compact amount for job cards: 18K, 1L, 1.5L */
export function formatJobSearchSalaryAmountShort(value: number): string {
  if (value >= 100_000) {
    const lakhs = value / 100_000;
    const rounded =
      lakhs >= 10 ? Math.round(lakhs) : Math.round(lakhs * 10) / 10;
    return `${rounded}L`;
  }

  if (value >= 1_000) {
    const thousands = value / 1_000;
    const rounded =
      thousands >= 10 ? Math.round(thousands) : Math.round(thousands * 10) / 10;
    return `${rounded}K`;
  }

  return String(Math.round(value));
}

/**
 * Compact card salary: 18K/mo, 1L/yr, 1.5L-2L/mo.
 */
export function formatJobSearchSalaryCompact(job: {
  salaryType: "fixed" | "range";
  salaryPeriod?: SalaryPeriodValue;
  fixedSalary: number | null;
  minimumSalary: number | null;
  maximumSalary: number | null;
}): string {
  const period = resolveSalaryPeriodSuffix(job.salaryPeriod, "short");

  if (job.salaryType === "fixed" && job.fixedSalary != null) {
    return `${formatJobSearchSalaryAmountShort(job.fixedSalary)}${period}`;
  }

  if (
    job.salaryType === "range" &&
    job.minimumSalary != null &&
    job.maximumSalary != null
  ) {
    return `${formatJobSearchSalaryAmountShort(job.minimumSalary)}-${formatJobSearchSalaryAmountShort(job.maximumSalary)}${period}`;
  }

  if (job.minimumSalary != null) {
    return `${formatJobSearchSalaryAmountShort(job.minimumSalary)}+${period}`;
  }

  if (job.maximumSalary != null) {
    return `≤${formatJobSearchSalaryAmountShort(job.maximumSalary)}${period}`;
  }

  return "—";
}

export function formatJobSearchLocation(
  cityName: string,
  stateName: string,
  city?: string,
  state?: string,
): string {
  const cityLabel = cityName || city || "";
  const stateLabel = stateName || state || "";

  if (cityLabel && stateLabel) {
    return `${cityLabel}, ${stateLabel}`;
  }

  return cityLabel || stateLabel || "Location not specified";
}

/** Compact card location: City, TS */
export function formatJobSearchLocationCompact(
  cityName: string,
  stateName: string,
  city?: string,
  state?: string,
): string {
  const cityLabel = (cityName || city || "").trim();
  const rawState = (stateName || state || "").trim();
  const stateAbbr = rawState
    ? getIndianStateAbbreviation(rawState)
    : "";

  if (cityLabel && stateAbbr) {
    return `${cityLabel}, ${stateAbbr}`;
  }

  return cityLabel || stateAbbr || "—";
}

export function formatJobSearchJobType(jobType: string): string {
  return JOB_SEARCH_JOB_TYPE_LABELS[jobType] ?? jobType;
}

export function formatJobSearchExperience(experience: string): string {
  return JOB_SEARCH_EXPERIENCE_LABELS[experience] ?? experience;
}

export function formatJobSearchEducation(education: string): string {
  return JOB_SEARCH_EDUCATION_LABELS[education] ?? education;
}

export function formatJobSearchPerk(perk: string): string {
  return JOB_SEARCH_PERK_LABELS[perk] ?? perk;
}

export function formatJobSearchGender(gender: string): string {
  return JOB_SEARCH_GENDER_LABELS[gender] ?? gender;
}

export function formatJobSearchLanguage(language: string): string {
  return JOB_SEARCH_LANGUAGE_LABELS[language] ?? language;
}

export function formatJobSearchWorkMode(workMode: string): string {
  return JOB_SEARCH_WORK_MODE_LABELS[workMode] ?? workMode;
}

export function formatJobSearchWalkInDate(value: string | null | undefined): string {
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

export function formatJobSearchWalkInTime(value: string | null | undefined): string {
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

export function formatJobSearchWalkInDateRange(
  startDate: string | null | undefined,
  endDate: string | null | undefined,
): string {
  const start = formatJobSearchWalkInDate(startDate);
  const end = formatJobSearchWalkInDate(endDate);

  if (start && end) {
    return start === end ? start : `${start} – ${end}`;
  }

  return start || end;
}

export function formatJobSearchWalkInTimeRange(
  startTime: string | null | undefined,
  endTime: string | null | undefined,
): string {
  const start = formatJobSearchWalkInTime(startTime);
  const end = formatJobSearchWalkInTime(endTime);

  if (start && end) {
    return `${start} – ${end}`;
  }

  return start || end;
}

export function formatJobSearchRelativeTime(
  isoDate: string | null | undefined,
): string {
  if (!isoDate) {
    return "";
  }

  const date = new Date(isoDate);
  if (Number.isNaN(date.getTime())) {
    return "";
  }

  const diffMs = Date.now() - date.getTime();
  if (diffMs < 0) {
    return "Just now";
  }

  const minutes = Math.floor(diffMs / 60_000);
  if (minutes < 1) {
    return "Just now";
  }
  if (minutes < 60) {
    return `${minutes}m ago`;
  }

  const hours = Math.floor(minutes / 60);
  if (hours < 24) {
    return `${hours}h ago`;
  }

  const days = Math.floor(hours / 24);
  if (days < 30) {
    return `${days}d ago`;
  }

  const months = Math.floor(days / 30);
  if (months < 12) {
    return `${months}mo ago`;
  }

  const years = Math.floor(months / 12);
  return `${years}y ago`;
}

export function getCompanyInitials(companyName: string): string {
  const parts = companyName
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2);

  if (parts.length === 0) {
    return "AJ";
  }

  return parts.map((part) => part[0]?.toUpperCase() ?? "").join("");
}

export function buildJobSearchCardTags(job: PublicJobListItem): string[] {
  const tags: string[] = [];

  for (const education of job.education.slice(0, 2)) {
    tags.push(formatJobSearchEducation(education));
  }

  if (job.experience === "fresher") {
    tags.push("Freshers can apply");
  }

  for (const perk of job.perks.slice(0, 1)) {
    const label = formatJobSearchPerk(perk);
    if (!tags.includes(label)) {
      tags.push(label);
    }
  }

  return tags.slice(0, 4);
}
