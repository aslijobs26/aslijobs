import type { MessageKey } from "@/i18n/translate";
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
  labelKey: MessageKey;
  statsKey: keyof SavedJobsStats;
  tone: "primary" | "neutral" | "success" | "warning" | "danger";
}[] = [
  { key: "all", labelKey: "seeker.saved.tabAll", statsKey: "total", tone: "primary" },
  { key: "recent", labelKey: "seeker.saved.tabRecent", statsKey: "recent", tone: "neutral" },
  {
    key: "high_match",
    labelKey: "seeker.saved.tabHighMatch",
    statsKey: "highMatch",
    tone: "success",
  },
  { key: "applied", labelKey: "seeker.saved.tabApplied", statsKey: "applied", tone: "warning" },
  { key: "expired", labelKey: "seeker.saved.tabExpired", statsKey: "expired", tone: "danger" },
];

export const SAVED_JOBS_SORT_OPTIONS: {
  value: SavedJobsSort;
  labelKey: MessageKey;
}[] = [
  { value: "recently_saved", labelKey: "seeker.saved.sortRecentlySaved" },
  { value: "newest", labelKey: "seeker.saved.sortNewest" },
  { value: "oldest", labelKey: "seeker.saved.sortOldest" },
  { value: "salary_high", labelKey: "seeker.saved.sortSalaryHigh" },
  { value: "salary_low", labelKey: "seeker.saved.sortSalaryLow" },
  { value: "company_az", labelKey: "seeker.saved.sortCompany" },
  { value: "highest_match", labelKey: "seeker.saved.sortHighestMatch" },
];

/** Real Job.partTimeSchedule values from Job Posting. */
export const SAVED_JOBS_SCHEDULE_OPTIONS: {
  value: string;
  labelKey: MessageKey;
}[] = [
  { value: "fixed-timings", labelKey: "seeker.savedFilters.fixedTimings" },
  { value: "flexible-hours", labelKey: "seeker.savedFilters.flexibleHours" },
];

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
