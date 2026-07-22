export const JOB_TYPES = ["full-time", "part-time", "contract"] as const;

export const WORK_MODES = ["office", "field", "both", "home"] as const;

export const PART_TIME_SCHEDULES = ["fixed-timings", "flexible-hours"] as const;

export const SALARY_TYPES = ["fixed", "range"] as const;

export const JOB_STATUSES = [
  "draft",
  "active",
  "paused",
  "closed",
  "expired",
] as const;

export const JOB_PERKS = [
  "travel_allowance",
  "food_meals",
  "accommodation",
  "petrol_allowance",
  "mobile_bill_allowance",
  "internet_allowance",
  "annual_bonus",
  "laptop",
  "pf",
] as const;

export const JOB_EDUCATION_LEVELS = [
  "10th_or_below",
  "12th_pass",
  "diploma",
  "iti",
  "graduate",
  "post_graduate",
] as const;

export const JOB_EXPERIENCE_LEVELS = [
  "fresher",
  "6_month",
  "1_year",
  "2_year",
  "3_year",
  "4_year",
  "5_year",
  "6_year",
  "10_year",
] as const;

export const JOB_LANGUAGES = [
  "telugu",
  "english",
  "hindi",
  "kannada",
  "tamil",
  "malayalam",
] as const;

export const JOB_GENDERS = ["female", "male", "other"] as const;

export const JOB_STATUS_ACTIONS = [
  "publish",
  "pause",
  "resume",
  "close",
  "expire",
  "reactivate",
] as const;

export type JobType = (typeof JOB_TYPES)[number];
export type WorkMode = (typeof WORK_MODES)[number];
export type PartTimeSchedule = (typeof PART_TIME_SCHEDULES)[number];
export type SalaryType = (typeof SALARY_TYPES)[number];
export type JobStatus = (typeof JOB_STATUSES)[number];
export type JobStatusAction = (typeof JOB_STATUS_ACTIONS)[number];
