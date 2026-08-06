import type {
  SavedJobsAdvancedFilters,
  SavedJobsSort,
  SavedJobsStats,
  SavedJobsStatsFilter,
} from "@/types/saved-jobs";

export const SAVED_JOBS_PAGE_SIZE = 20;

export const EMPTY_SAVED_JOBS_FILTERS: SavedJobsAdvancedFilters = {
  location: "",
  minSalary: "",
  maxSalary: "",
  jobType: "",
  workMode: "",
  schedule: "",
  experience: "",
  company: "",
  perk: "",
};

export const SAVED_JOBS_STATS_TABS: {
  key: SavedJobsStatsFilter;
  label: string;
  statsKey: keyof SavedJobsStats;
  tone: "primary" | "neutral" | "success" | "warning" | "danger";
}[] = [
  { key: "all", label: "All Saved", statsKey: "total", tone: "primary" },
  { key: "recent", label: "Recent", statsKey: "recent", tone: "neutral" },
  {
    key: "high_match",
    label: "High Match",
    statsKey: "highMatch",
    tone: "success",
  },
  { key: "applied", label: "Applied", statsKey: "applied", tone: "warning" },
  { key: "expired", label: "Expired", statsKey: "expired", tone: "danger" },
];

export const SAVED_JOBS_SORT_OPTIONS: {
  value: SavedJobsSort;
  label: string;
}[] = [
  { value: "recently_saved", label: "Recently Saved" },
  { value: "newest", label: "Newest" },
  { value: "oldest", label: "Oldest" },
  { value: "salary_high", label: "Salary High" },
  { value: "salary_low", label: "Salary Low" },
  { value: "company_az", label: "Company A-Z" },
  { value: "highest_match", label: "Highest Match" },
];

/** Real Job.partTimeSchedule values from Job Posting. */
export const SAVED_JOBS_SCHEDULE_OPTIONS = [
  { value: "fixed-timings", label: "Fixed timings" },
  { value: "flexible-hours", label: "Flexible hours" },
] as const;

export const SAVED_JOBS_SALARY_OPTIONS = [
  { value: "", label: "Any" },
  { value: "10000", label: "₹10,000" },
  { value: "15000", label: "₹15,000" },
  { value: "20000", label: "₹20,000" },
  { value: "30000", label: "₹30,000" },
  { value: "50000", label: "₹50,000" },
  { value: "75000", label: "₹75,000" },
] as const;

export function parseSavedJobsTab(
  value: string | null,
): SavedJobsStatsFilter {
  const match = SAVED_JOBS_STATS_TABS.find((tab) => tab.key === value);
  return match?.key ?? "all";
}

export function parseSavedJobsSort(value: string | null): SavedJobsSort {
  const match = SAVED_JOBS_SORT_OPTIONS.find((option) => option.value === value);
  return match?.value ?? "recently_saved";
}

export function countSavedJobsFilters(
  filters: SavedJobsAdvancedFilters,
): number {
  return Object.values(filters).filter((value) => value.trim().length > 0)
    .length;
}

export function statsTabToneClasses(
  tone: (typeof SAVED_JOBS_STATS_TABS)[number]["tone"],
  isActive: boolean,
): string {
  if (tone === "primary") {
    return isActive
      ? "bg-primary-light text-primary ring-primary"
      : "bg-surface text-primary ring-primary/30 hover:bg-primary-light/50";
  }
  if (tone === "success") {
    return isActive
      ? "bg-resource-guide-surface text-resource-guide-icon ring-resource-guide-icon"
      : "bg-surface text-resource-guide-icon ring-resource-guide-icon/35 hover:bg-resource-guide-surface";
  }
  if (tone === "warning") {
    return isActive
      ? "bg-resource-interview-surface text-resource-interview-icon ring-resource-interview-icon"
      : "bg-surface text-muted ring-border-subtle hover:bg-resource-interview-surface/70";
  }
  if (tone === "danger") {
    return isActive
      ? "bg-primary-light text-pin-state ring-pin-state"
      : "bg-surface text-muted ring-border-subtle hover:bg-primary-light/40";
  }
  return isActive
    ? "bg-primary-light text-foreground ring-primary"
    : "bg-surface text-muted ring-border-subtle hover:bg-primary-light/40";
}

export function matchBadgeClasses(matchPercent: number): string {
  if (matchPercent >= 90) {
    return "bg-resource-guide-surface text-resource-guide-icon";
  }
  if (matchPercent >= 80) {
    return "bg-primary-light text-primary";
  }
  return "bg-resource-interview-surface text-resource-interview-icon";
}

export function perkToneClasses(index: number): string {
  const tones = [
    "bg-resource-guide-surface text-resource-guide-icon",
    "bg-resource-interview-surface text-resource-interview-icon",
    "bg-resource-salary-surface text-resource-salary-icon",
  ] as const;
  return tones[index % tones.length]!;
}

export function formatSavedOnDate(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) {
    return "";
  }
  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(date);
}
