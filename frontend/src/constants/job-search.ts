import type { PublicJobSort } from "@/services/public-jobs.service";

export const JOB_SEARCH_PAGE_SIZE = 20;

export const JOB_SEARCH_SORT_OPTIONS: {
  value: PublicJobSort;
  label: string;
}[] = [
  { value: "relevant", label: "Most Relevant" },
  { value: "latest", label: "Latest" },
  { value: "salary_desc", label: "Highest Salary" },
  { value: "salary_asc", label: "Lowest Salary" },
];

export const JOB_SEARCH_JOB_TYPE_OPTIONS = [
  { value: "full-time", label: "Full Time" },
  { value: "part-time", label: "Part Time" },
  { value: "contract", label: "Contract" },
] as const;

export const JOB_SEARCH_EXPERIENCE_OPTIONS = [
  { value: "fresher", label: "Fresher" },
  { value: "6_month", label: "6 months" },
  { value: "1_year", label: "1 year" },
  { value: "2_year", label: "2 years" },
  { value: "3_year", label: "3 years" },
  { value: "4_year", label: "4 years" },
  { value: "5_year", label: "5 years" },
  { value: "6_year", label: "6 years" },
  { value: "10_year", label: "10+ years" },
] as const;

export const JOB_SEARCH_GENDER_OPTIONS = [
  { value: "", label: "Any" },
  { value: "male", label: "Male Only" },
  { value: "female", label: "Female Only" },
] as const;

export const JOB_SEARCH_WORK_MODE_OPTIONS = [
  { value: "office", label: "Office" },
  { value: "field", label: "Field" },
  { value: "both", label: "Office + Field" },
  { value: "home", label: "Work from Home" },
] as const;

export const JOB_SEARCH_SALARY_PRESETS = [
  { label: "0-10K", min: 0, max: 10000 },
  { label: "10K-20K", min: 10000, max: 20000 },
  { label: "20K-30K", min: 20000, max: 30000 },
  { label: "30K-50K", min: 30000, max: 50000 },
  { label: "50K+", min: 50000, max: undefined },
] as const;

export const JOB_SEARCH_SALARY_SLIDER_MAX = 50000;
export const JOB_SEARCH_SALARY_MIN_GAP = 1000;
export const JOB_SEARCH_SALARY_DEBOUNCE_MS = 280;

export const JOB_SEARCH_EDUCATION_LABELS: Record<string, string> = {
  "10th_or_below": "10th Pass",
  "12th_pass": "12th Pass",
  diploma: "Diploma",
  iti: "ITI",
  graduate: "Graduate",
  post_graduate: "Post Graduate",
};

export const JOB_SEARCH_PERK_LABELS: Record<string, string> = {
  travel_allowance: "Travel Allowance",
  food_meals: "Food / Meals",
  accommodation: "Accommodation",
  petrol_allowance: "Petrol Allowance",
  mobile_bill_allowance: "Mobile Bill",
  internet_allowance: "Internet",
  annual_bonus: "Annual Bonus",
  laptop: "Laptop",
  pf: "PF",
};

export const JOB_SEARCH_EXPERIENCE_LABELS: Record<string, string> = {
  fresher: "Fresher",
  "6_month": "6 months",
  "1_year": "1 year",
  "2_year": "2 years",
  "3_year": "3 years",
  "4_year": "4 years",
  "5_year": "5 years",
  "6_year": "6 years",
  "10_year": "10+ years",
};

export const JOB_SEARCH_JOB_TYPE_LABELS: Record<string, string> = {
  "full-time": "Full Time",
  "part-time": "Part Time",
  contract: "Contract",
};

export const JOB_SEARCH_GENDER_LABELS: Record<string, string> = {
  male: "Male",
  female: "Female",
  other: "Other",
};

export const JOB_SEARCH_LANGUAGE_LABELS: Record<string, string> = {
  telugu: "Telugu",
  english: "English",
  hindi: "Hindi",
  kannada: "Kannada",
  tamil: "Tamil",
  malayalam: "Malayalam",
};

export const JOB_SEARCH_WORK_MODE_LABELS: Record<string, string> = {
  office: "Office",
  field: "Field",
  both: "Office + Field",
  home: "Work from Home",
};
