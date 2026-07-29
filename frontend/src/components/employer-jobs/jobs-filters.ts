import {
  JOB_TYPE_OPTIONS,
  POST_JOB_EXPERIENCE_OPTIONS,
} from "@/constants/post-job";
import type { ListEmployerJobsParams } from "@/services/employer-jobs.service";
import type { EmployerRegisterSelectOption } from "@/types/employer-register";
import type { JobType, PostJobExperienceId, WorkMode } from "@/types/post-job";
import { toJobSearchLocationSlug } from "@/utils/job-search-url";

export const EMPLOYER_JOBS_FILTERS_STORAGE_KEY = "employer-jobs:filters:v1";

export type EmployerJobsPostedQuickFilter =
  | ""
  | "today"
  | "last_7_days"
  | "last_30_days"
  | "last_90_days"
  | "custom";

export type EmployerJobsApplicationBand =
  | "0"
  | "1-10"
  | "11-25"
  | "26-50"
  | "51+";

export type EmployerJobsFiltersState = {
  jobTypes: JobType[];
  workModes: WorkMode[];
  experience: PostJobExperienceId[];
  minSalary: string;
  maxSalary: string;
  city: string;
  cityLabel: string;
  state: string;
  stateLabel: string;
  locationLabel: string;
  postedJobId: string;
  postedJobTitle: string;
  postedQuick: EmployerJobsPostedQuickFilter;
  postedFrom: string;
  postedTo: string;
  applications: EmployerJobsApplicationBand[];
  minVacancies: string;
  maxVacancies: string;
};

export const DEFAULT_EMPLOYER_JOBS_FILTERS: EmployerJobsFiltersState = {
  jobTypes: [],
  workModes: [],
  experience: [],
  minSalary: "",
  maxSalary: "",
  city: "",
  cityLabel: "",
  state: "",
  stateLabel: "",
  locationLabel: "",
  postedJobId: "",
  postedJobTitle: "",
  postedQuick: "",
  postedFrom: "",
  postedTo: "",
  applications: [],
  minVacancies: "",
  maxVacancies: "",
};

export const EMPLOYER_JOBS_WORK_MODE_FILTER_OPTIONS: {
  value: WorkMode;
  label: string;
}[] = [
  { value: "office", label: "On-site" },
  { value: "home", label: "Remote" },
  { value: "both", label: "Hybrid" },
  { value: "field", label: "Field" },
];

export const EMPLOYER_JOBS_JOB_TYPE_FILTER_OPTIONS = JOB_TYPE_OPTIONS.map(
  (option) => ({
    value: option.value,
    label: option.label,
  }),
);

export const EMPLOYER_JOBS_EXPERIENCE_FILTER_OPTIONS =
  POST_JOB_EXPERIENCE_OPTIONS.map((option) => ({
    value: option.value,
    label: option.label,
  }));

export const EMPLOYER_JOBS_POSTED_QUICK_OPTIONS: EmployerRegisterSelectOption[] =
  [
    { value: "", label: "Any Time" },
    { value: "today", label: "Today" },
    { value: "last_7_days", label: "Last 7 Days" },
    { value: "last_30_days", label: "Last 30 Days" },
    { value: "last_90_days", label: "Last 90 Days" },
    { value: "custom", label: "Custom Date Range" },
  ];

export const EMPLOYER_JOBS_APPLICATION_BAND_OPTIONS: {
  value: EmployerJobsApplicationBand;
  label: string;
}[] = [
  { value: "0", label: "No Applications" },
  { value: "1-10", label: "1–10" },
  { value: "11-25", label: "11–25" },
  { value: "26-50", label: "26–50" },
  { value: "51+", label: "51+" },
];

const JOB_TYPE_LABELS = Object.fromEntries(
  EMPLOYER_JOBS_JOB_TYPE_FILTER_OPTIONS.map((option) => [
    option.value,
    option.label,
  ]),
) as Record<JobType, string>;

const WORK_MODE_LABELS = Object.fromEntries(
  EMPLOYER_JOBS_WORK_MODE_FILTER_OPTIONS.map((option) => [
    option.value,
    option.label,
  ]),
) as Record<WorkMode, string>;

const EXPERIENCE_LABELS = Object.fromEntries(
  EMPLOYER_JOBS_EXPERIENCE_FILTER_OPTIONS.map((option) => [
    option.value,
    option.label,
  ]),
) as Record<PostJobExperienceId, string>;

const APPLICATION_BAND_LABELS = Object.fromEntries(
  EMPLOYER_JOBS_APPLICATION_BAND_OPTIONS.map((option) => [
    option.value,
    option.label,
  ]),
) as Record<EmployerJobsApplicationBand, string>;

const POSTED_QUICK_LABELS = Object.fromEntries(
  EMPLOYER_JOBS_POSTED_QUICK_OPTIONS.filter((option) => option.value).map(
    (option) => [option.value, option.label],
  ),
) as Record<Exclude<EmployerJobsPostedQuickFilter, "">, string>;

export type EmployerJobsFilterChip = {
  id: string;
  label: string;
};

function parseOptionalNumber(value: string): number | undefined {
  const trimmed = value.trim();
  if (!trimmed) {
    return undefined;
  }
  const parsed = Number(trimmed);
  if (!Number.isFinite(parsed) || parsed < 0) {
    return undefined;
  }
  return parsed;
}

function formatSalaryChipAmount(amount: number): string {
  if (amount >= 100_000) {
    const lakhs = amount / 100_000;
    const formatted =
      Number.isInteger(lakhs) ? String(lakhs) : lakhs.toFixed(1).replace(/\.0$/, "");
    return `₹${formatted}L`;
  }
  if (amount >= 1_000) {
    const thousands = amount / 1_000;
    const formatted =
      Number.isInteger(thousands)
        ? String(thousands)
        : thousands.toFixed(1).replace(/\.0$/, "");
    return `₹${formatted}K`;
  }
  return `₹${amount.toLocaleString("en-IN")}`;
}

export function employerJobsFiltersAreActive(
  filters: EmployerJobsFiltersState,
): boolean {
  return countActiveEmployerJobsFilters(filters) > 0;
}

export function countActiveEmployerJobsFilters(
  filters: EmployerJobsFiltersState,
): number {
  return buildEmployerJobsFilterChips(filters).length;
}

export function buildEmployerJobsFilterChips(
  filters: EmployerJobsFiltersState,
): EmployerJobsFilterChip[] {
  const chips: EmployerJobsFilterChip[] = [];

  for (const jobType of filters.jobTypes) {
    chips.push({
      id: `jobType:${jobType}`,
      label: JOB_TYPE_LABELS[jobType] ?? jobType,
    });
  }

  for (const workMode of filters.workModes) {
    chips.push({
      id: `workMode:${workMode}`,
      label: WORK_MODE_LABELS[workMode] ?? workMode,
    });
  }

  for (const experience of filters.experience) {
    chips.push({
      id: `experience:${experience}`,
      label: EXPERIENCE_LABELS[experience] ?? experience,
    });
  }

  const minSalary = parseOptionalNumber(filters.minSalary);
  const maxSalary = parseOptionalNumber(filters.maxSalary);
  if (minSalary !== undefined || maxSalary !== undefined) {
    let label = "Salary";
    if (minSalary !== undefined && maxSalary !== undefined) {
      label = `Salary ${formatSalaryChipAmount(minSalary)}–${formatSalaryChipAmount(maxSalary)}`;
    } else if (minSalary !== undefined) {
      label = `Salary ${formatSalaryChipAmount(minSalary)}+`;
    } else if (maxSalary !== undefined) {
      label = `Salary up to ${formatSalaryChipAmount(maxSalary)}`;
    }
    chips.push({ id: "salary", label });
  }

  if (filters.city || filters.state) {
    chips.push({
      id: "location",
      label:
        filters.locationLabel ||
        filters.cityLabel ||
        filters.stateLabel ||
        filters.city ||
        filters.state,
    });
  }

  if (filters.postedJobId) {
    chips.push({
      id: "postedJob",
      label: filters.postedJobTitle || filters.postedJobId,
    });
  }

  if (filters.postedQuick && filters.postedQuick !== "custom") {
    chips.push({
      id: "postedQuick",
      label: POSTED_QUICK_LABELS[filters.postedQuick] ?? filters.postedQuick,
    });
  } else if (
    filters.postedQuick === "custom" &&
    (filters.postedFrom || filters.postedTo)
  ) {
    const from = filters.postedFrom || "…";
    const to = filters.postedTo || "…";
    chips.push({
      id: "postedQuick",
      label: `Posted ${from} – ${to}`,
    });
  }

  for (const band of filters.applications) {
    chips.push({
      id: `applications:${band}`,
      label: APPLICATION_BAND_LABELS[band] ?? band,
    });
  }

  const minVacancies = parseOptionalNumber(filters.minVacancies);
  const maxVacancies = parseOptionalNumber(filters.maxVacancies);
  if (minVacancies !== undefined || maxVacancies !== undefined) {
    let label = "Openings";
    if (minVacancies !== undefined && maxVacancies !== undefined) {
      label = `Openings ${minVacancies}–${maxVacancies}`;
    } else if (minVacancies !== undefined) {
      label = `Openings ${minVacancies}+`;
    } else if (maxVacancies !== undefined) {
      label = `Openings up to ${maxVacancies}`;
    }
    chips.push({ id: "vacancies", label });
  }

  return chips;
}

export function removeEmployerJobsFilterChip(
  filters: EmployerJobsFiltersState,
  chipId: string,
): EmployerJobsFiltersState {
  if (chipId.startsWith("jobType:")) {
    const value = chipId.slice("jobType:".length) as JobType;
    return {
      ...filters,
      jobTypes: filters.jobTypes.filter((item) => item !== value),
    };
  }

  if (chipId.startsWith("workMode:")) {
    const value = chipId.slice("workMode:".length) as WorkMode;
    return {
      ...filters,
      workModes: filters.workModes.filter((item) => item !== value),
    };
  }

  if (chipId.startsWith("experience:")) {
    const value = chipId.slice("experience:".length) as PostJobExperienceId;
    return {
      ...filters,
      experience: filters.experience.filter((item) => item !== value),
    };
  }

  if (chipId === "salary") {
    return {
      ...filters,
      minSalary: "",
      maxSalary: "",
    };
  }

  if (chipId === "location") {
    return {
      ...filters,
      city: "",
      cityLabel: "",
      state: "",
      stateLabel: "",
      locationLabel: "",
    };
  }

  if (chipId === "postedJob") {
    return {
      ...filters,
      postedJobId: "",
      postedJobTitle: "",
    };
  }

  if (chipId === "postedQuick") {
    return {
      ...filters,
      postedQuick: "",
      postedFrom: "",
      postedTo: "",
    };
  }

  if (chipId.startsWith("applications:")) {
    const value = chipId.slice(
      "applications:".length,
    ) as EmployerJobsApplicationBand;
    return {
      ...filters,
      applications: filters.applications.filter((item) => item !== value),
    };
  }

  if (chipId === "vacancies") {
    return {
      ...filters,
      minVacancies: "",
      maxVacancies: "",
    };
  }

  return filters;
}

export function toListEmployerJobsFilterParams(
  filters: EmployerJobsFiltersState,
): Pick<
  ListEmployerJobsParams,
  | "jobType"
  | "workMode"
  | "experience"
  | "minSalary"
  | "maxSalary"
  | "city"
  | "state"
  | "jobId"
  | "postedQuick"
  | "postedFrom"
  | "postedTo"
  | "applications"
  | "minVacancies"
  | "maxVacancies"
> {
  const minSalary = parseOptionalNumber(filters.minSalary);
  const maxSalary = parseOptionalNumber(filters.maxSalary);
  const minVacancies = parseOptionalNumber(filters.minVacancies);
  const maxVacancies = parseOptionalNumber(filters.maxVacancies);

  return {
    jobType:
      filters.jobTypes.length > 0 ? filters.jobTypes.join(",") : undefined,
    workMode:
      filters.workModes.length > 0 ? filters.workModes.join(",") : undefined,
    experience:
      filters.experience.length > 0 ? filters.experience.join(",") : undefined,
    minSalary,
    maxSalary,
    city: filters.city || undefined,
    state: filters.state || undefined,
    jobId: filters.postedJobId || undefined,
    postedQuick: filters.postedQuick || undefined,
    postedFrom:
      filters.postedQuick === "custom" && filters.postedFrom
        ? filters.postedFrom
        : undefined,
    postedTo:
      filters.postedQuick === "custom" && filters.postedTo
        ? filters.postedTo
        : undefined,
    applications:
      filters.applications.length > 0
        ? filters.applications.join(",")
        : undefined,
    minVacancies,
    maxVacancies,
  };
}

export function createLocationSelection(suggestion: {
  kind: "state" | "city";
  state: string;
  city: string;
  label: string;
}): Pick<
  EmployerJobsFiltersState,
  "city" | "cityLabel" | "state" | "stateLabel" | "locationLabel"
> {
  const stateSlug = toJobSearchLocationSlug(suggestion.state) || suggestion.state;
  const citySlug = toJobSearchLocationSlug(suggestion.city) || suggestion.city;

  if (suggestion.kind === "state") {
    return {
      city: "",
      cityLabel: "",
      state: stateSlug,
      stateLabel: suggestion.state,
      locationLabel: suggestion.label || suggestion.state,
    };
  }

  return {
    city: citySlug,
    cityLabel: suggestion.city,
    state: stateSlug,
    stateLabel: suggestion.state,
    locationLabel: suggestion.label,
  };
}

function isJobType(value: string): value is JobType {
  return EMPLOYER_JOBS_JOB_TYPE_FILTER_OPTIONS.some(
    (option) => option.value === value,
  );
}

function isWorkMode(value: string): value is WorkMode {
  return EMPLOYER_JOBS_WORK_MODE_FILTER_OPTIONS.some(
    (option) => option.value === value,
  );
}

function isExperience(value: string): value is PostJobExperienceId {
  return EMPLOYER_JOBS_EXPERIENCE_FILTER_OPTIONS.some(
    (option) => option.value === value,
  );
}

function isApplicationBand(value: string): value is EmployerJobsApplicationBand {
  return EMPLOYER_JOBS_APPLICATION_BAND_OPTIONS.some(
    (option) => option.value === value,
  );
}

function isPostedQuick(value: string): value is EmployerJobsPostedQuickFilter {
  return (
    value === "" ||
    value === "today" ||
    value === "last_7_days" ||
    value === "last_30_days" ||
    value === "last_90_days" ||
    value === "custom"
  );
}

export function loadEmployerJobsFiltersFromSession(): EmployerJobsFiltersState {
  if (typeof window === "undefined") {
    return { ...DEFAULT_EMPLOYER_JOBS_FILTERS };
  }

  try {
    const raw = window.sessionStorage.getItem(EMPLOYER_JOBS_FILTERS_STORAGE_KEY);
    if (!raw) {
      return { ...DEFAULT_EMPLOYER_JOBS_FILTERS };
    }

    const parsed = JSON.parse(raw) as Partial<EmployerJobsFiltersState>;
    return {
      ...DEFAULT_EMPLOYER_JOBS_FILTERS,
      jobTypes: Array.isArray(parsed.jobTypes)
        ? parsed.jobTypes.filter(isJobType)
        : [],
      workModes: Array.isArray(parsed.workModes)
        ? parsed.workModes.filter(isWorkMode)
        : [],
      experience: Array.isArray(parsed.experience)
        ? parsed.experience.filter(isExperience)
        : [],
      minSalary:
        typeof parsed.minSalary === "string" ? parsed.minSalary : "",
      maxSalary:
        typeof parsed.maxSalary === "string" ? parsed.maxSalary : "",
      city: typeof parsed.city === "string" ? parsed.city : "",
      cityLabel:
        typeof parsed.cityLabel === "string" ? parsed.cityLabel : "",
      state: typeof parsed.state === "string" ? parsed.state : "",
      stateLabel:
        typeof parsed.stateLabel === "string" ? parsed.stateLabel : "",
      locationLabel:
        typeof parsed.locationLabel === "string" ? parsed.locationLabel : "",
      postedJobId:
        typeof parsed.postedJobId === "string" ? parsed.postedJobId : "",
      postedJobTitle:
        typeof parsed.postedJobTitle === "string" ? parsed.postedJobTitle : "",
      postedQuick:
        typeof parsed.postedQuick === "string" && isPostedQuick(parsed.postedQuick)
          ? parsed.postedQuick
          : "",
      postedFrom:
        typeof parsed.postedFrom === "string" ? parsed.postedFrom : "",
      postedTo: typeof parsed.postedTo === "string" ? parsed.postedTo : "",
      applications: Array.isArray(parsed.applications)
        ? parsed.applications.filter(isApplicationBand)
        : [],
      minVacancies:
        typeof parsed.minVacancies === "string" ? parsed.minVacancies : "",
      maxVacancies:
        typeof parsed.maxVacancies === "string" ? parsed.maxVacancies : "",
    };
  } catch {
    return { ...DEFAULT_EMPLOYER_JOBS_FILTERS };
  }
}

export function saveEmployerJobsFiltersToSession(
  filters: EmployerJobsFiltersState,
): void {
  if (typeof window === "undefined") {
    return;
  }

  try {
    if (!employerJobsFiltersAreActive(filters)) {
      window.sessionStorage.removeItem(EMPLOYER_JOBS_FILTERS_STORAGE_KEY);
      return;
    }
    window.sessionStorage.setItem(
      EMPLOYER_JOBS_FILTERS_STORAGE_KEY,
      JSON.stringify(filters),
    );
  } catch {
    // Ignore quota / private-mode failures.
  }
}
