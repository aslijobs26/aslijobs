export const SAVED_JOBS_STATS_FILTERS = [
  "all",
  "recent",
  "high_match",
  "applied",
  "expired",
] as const;

export const SAVED_JOBS_SORT_OPTIONS = [
  "recently_saved",
  "newest",
  "oldest",
  "salary_high",
  "salary_low",
  "company_az",
  "highest_match",
] as const;

export const HIGH_MATCH_THRESHOLD = 85;
export const RECENT_SAVED_DAYS = 7;

export type SavedJobsStatsFilter = (typeof SAVED_JOBS_STATS_FILTERS)[number];
export type SavedJobsSort = (typeof SAVED_JOBS_SORT_OPTIONS)[number];
