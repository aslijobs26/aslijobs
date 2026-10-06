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
import type { SiteLanguageCode } from "@/constants/site-language";
import { staticJobLabel } from "@/i18n/job-ui-labels";
import { getSiteLanguageCode } from "@/i18n/site-language";
import { translate, type MessageKey } from "@/i18n/translate";

function formatLanguage(language?: SiteLanguageCode): SiteLanguageCode {
  return language ?? getSiteLanguageCode();
}

const DATE_LOCALES: Record<string, string> = {
  en: "en-IN",
  hi: "hi-IN",
  te: "te-IN",
  ta: "ta-IN",
  kn: "kn-IN",
  ml: "ml-IN",
};

function siteDateLocale(language?: SiteLanguageCode): string {
  return DATE_LOCALES[formatLanguage(language)] ?? "en-IN";
}

type SalaryPeriodValue = "per-month" | "per-year" | string | null | undefined;

function resolveSalaryPeriodSuffix(
  period: SalaryPeriodValue,
  style: "long" | "short",
  language?: SiteLanguageCode,
): string {
  const code = formatLanguage(language);
  const isYear = period === "per-year";
  if (style === "short") {
    return translate(code, isYear ? "jobs.perYearShort" : "jobs.perMonthShort");
  }
  return translate(code, isYear ? "jobs.perYear" : "jobs.perMonth");
}

export function formatJobSearchSalary(
  job: {
    salaryType: "fixed" | "range";
    salaryPeriod?: SalaryPeriodValue;
    fixedSalary: number | null;
    minimumSalary: number | null;
    maximumSalary: number | null;
  },
  language?: SiteLanguageCode,
): string {
  const formatAmount = (value: number) =>
    `₹${value.toLocaleString("en-IN")}`;
  const period = resolveSalaryPeriodSuffix(job.salaryPeriod, "long", language);

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
    return translate(formatLanguage(language), "jobs.salaryFrom", {
      amount: `${formatAmount(job.minimumSalary)}${period}`,
    });
  }

  if (job.maximumSalary != null) {
    return translate(formatLanguage(language), "jobs.salaryUpTo", {
      amount: `${formatAmount(job.maximumSalary)}${period}`,
    });
  }

  return translate(formatLanguage(language), "jobs.salaryNotDisclosed");
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
export function formatJobSearchSalaryCompact(
  job: {
    salaryType: "fixed" | "range";
    salaryPeriod?: SalaryPeriodValue;
    fixedSalary: number | null;
    minimumSalary: number | null;
    maximumSalary: number | null;
  },
  language?: SiteLanguageCode,
): string {
  const period = resolveSalaryPeriodSuffix(job.salaryPeriod, "short", language);

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
  language?: SiteLanguageCode,
): string {
  const cityLabel = cityName || city || "";
  const stateLabel = stateName || state || "";

  if (cityLabel && stateLabel) {
    return `${cityLabel}, ${stateLabel}`;
  }

  return (
    cityLabel ||
    stateLabel ||
    translate(formatLanguage(language), "jobs.locationNotSpecified")
  );
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

const EXPERIENCE_KEYS: Record<string, MessageKey> = {
  fresher: "jobs.fresher",
  "6_month": "jobs.months6",
  "1_year": "jobs.year1",
  "2_year": "jobs.years2",
  "3_year": "jobs.years3",
  "4_year": "jobs.years4",
  "5_year": "jobs.years5",
  "6_year": "jobs.years6",
  "10_year": "jobs.years10",
};

const EDUCATION_KEYS: Record<string, MessageKey> = {
  "10th_or_below": "jobs.tenth",
  "12th_pass": "jobs.twelfth",
  diploma: "jobs.diploma",
  iti: "jobs.iti",
  graduate: "jobs.graduate",
  post_graduate: "jobs.postGraduate",
};

const PERK_KEYS: Record<string, MessageKey> = {
  travel_allowance: "jobs.travelAllowance",
  food_meals: "jobs.foodMeals",
  accommodation: "jobs.accommodation",
  petrol_allowance: "jobs.petrolAllowance",
  mobile_bill_allowance: "jobs.mobileBill",
  internet_allowance: "jobs.internet",
  annual_bonus: "jobs.annualBonus",
  laptop: "jobs.laptop",
  pf: "jobs.pf",
};

const GENDER_KEYS: Record<string, MessageKey> = {
  male: "jobs.male",
  female: "jobs.female",
  other: "jobs.other",
  any: "jobs.any",
};

const SPOKEN_LANGUAGE_KEYS: Record<string, MessageKey> = {
  english: "jobs.langEnglish",
  telugu: "jobs.langTelugu",
  hindi: "jobs.langHindi",
  tamil: "jobs.langTamil",
  kannada: "jobs.langKannada",
  malayalam: "jobs.langMalayalam",
};

function localizedEnum(
  key: MessageKey | undefined,
  englishFallback: string | undefined,
  raw: string,
  language?: SiteLanguageCode,
): string {
  if (!key) return englishFallback ?? raw;
  return translate(formatLanguage(language), key);
}

const SORT_KEYS: Record<string, MessageKey> = {
  relevant: "jobs.sortRelevant",
  latest: "jobs.sortLatest",
  salary_desc: "jobs.sortSalaryDesc",
  salary_asc: "jobs.sortSalaryAsc",
};

const MOBILE_SORT_KEYS: Record<string, MessageKey> = {
  relevant: "jobs.sortRelevant",
  latest: "jobs.newest",
  salary_desc: "jobs.salaryHighToLow",
  salary_asc: "jobs.salaryLowToHigh",
};

export function formatJobSearchSort(
  sort: string,
  language?: SiteLanguageCode,
): string {
  return localizedEnum(SORT_KEYS[sort], undefined, sort, language);
}

export function formatJobSearchSortMobile(
  sort: string,
  language?: SiteLanguageCode,
): string {
  return localizedEnum(MOBILE_SORT_KEYS[sort], undefined, sort, language);
}

export function formatJobSearchJobType(
  jobType: string,
  language?: SiteLanguageCode,
): string {
  return (
    staticJobLabel("jobType", jobType, formatLanguage(language)) ??
    JOB_SEARCH_JOB_TYPE_LABELS[jobType] ??
    jobType
  );
}

export function formatJobSearchExperience(
  experience: string,
  language?: SiteLanguageCode,
): string {
  return localizedEnum(
    EXPERIENCE_KEYS[experience],
    JOB_SEARCH_EXPERIENCE_LABELS[experience],
    experience,
    language,
  );
}

export function formatJobSearchEducation(
  education: string,
  language?: SiteLanguageCode,
): string {
  return localizedEnum(
    EDUCATION_KEYS[education],
    JOB_SEARCH_EDUCATION_LABELS[education],
    education,
    language,
  );
}

export function formatJobSearchPerk(perk: string, language?: SiteLanguageCode): string {
  return localizedEnum(PERK_KEYS[perk], JOB_SEARCH_PERK_LABELS[perk], perk, language);
}

export function formatJobSearchGender(
  gender: string,
  language?: SiteLanguageCode,
): string {
  return localizedEnum(
    GENDER_KEYS[gender],
    JOB_SEARCH_GENDER_LABELS[gender],
    gender,
    language,
  );
}

export function formatJobSearchLanguage(
  spokenLanguage: string,
  language?: SiteLanguageCode,
): string {
  return localizedEnum(
    SPOKEN_LANGUAGE_KEYS[spokenLanguage],
    JOB_SEARCH_LANGUAGE_LABELS[spokenLanguage],
    spokenLanguage,
    language,
  );
}

export function formatJobSearchWorkMode(
  workMode: string,
  language?: SiteLanguageCode,
): string {
  return (
    staticJobLabel("workMode", workMode, formatLanguage(language)) ??
    JOB_SEARCH_WORK_MODE_LABELS[workMode] ??
    workMode
  );
}

export function formatJobSearchWalkInDate(
  value: string | null | undefined,
  language?: SiteLanguageCode,
): string {
  const trimmed = value?.trim();
  if (!trimmed) {
    return "";
  }

  const date = new Date(`${trimmed}T00:00:00`);
  if (Number.isNaN(date.getTime())) {
    return trimmed;
  }

  return new Intl.DateTimeFormat(siteDateLocale(language), {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(date);
}

export function formatJobSearchWalkInTime(
  value: string | null | undefined,
  language?: SiteLanguageCode,
): string {
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

  return new Intl.DateTimeFormat(siteDateLocale(language), {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).format(date);
}

export function formatJobSearchWalkInDateRange(
  startDate: string | null | undefined,
  endDate: string | null | undefined,
  language?: SiteLanguageCode,
): string {
  const start = formatJobSearchWalkInDate(startDate, language);
  const end = formatJobSearchWalkInDate(endDate, language);

  if (start && end) {
    return start === end ? start : `${start} – ${end}`;
  }

  return start || end;
}

export function formatJobSearchWalkInTimeRange(
  startTime: string | null | undefined,
  endTime: string | null | undefined,
  language?: SiteLanguageCode,
): string {
  const start = formatJobSearchWalkInTime(startTime, language);
  const end = formatJobSearchWalkInTime(endTime, language);

  if (start && end) {
    return `${start} – ${end}`;
  }

  return start || end;
}

export function formatJobSearchRelativeTime(
  isoDate: string | null | undefined,
  language?: SiteLanguageCode,
): string {
  if (!isoDate) {
    return "";
  }

  const date = new Date(isoDate);
  if (Number.isNaN(date.getTime())) {
    return "";
  }

  const diffMs = Date.now() - date.getTime();
  const code = formatLanguage(language);
  if (diffMs < 0) {
    return translate(code, "jobs.justNow");
  }

  const minutes = Math.floor(diffMs / 60_000);
  if (minutes < 1) {
    return translate(code, "jobs.justNow");
  }
  if (minutes < 60) {
    return translate(code, "jobs.minutesAgo", { count: minutes });
  }

  const hours = Math.floor(minutes / 60);
  if (hours < 24) {
    return translate(code, "jobs.hoursAgo", { count: hours });
  }

  const days = Math.floor(hours / 24);
  if (days < 30) {
    return translate(code, "jobs.daysAgo", { count: days });
  }

  const months = Math.floor(days / 30);
  if (months < 12) {
    return translate(code, "jobs.monthsAgo", { count: months });
  }

  const years = Math.floor(months / 12);
  return translate(code, "jobs.yearsAgo", { count: years });
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

export function buildJobSearchCardTags(
  job: PublicJobListItem,
  language?: SiteLanguageCode,
): string[] {
  const tags: string[] = [];

  for (const education of job.education.slice(0, 2)) {
    tags.push(formatJobSearchEducation(education, language));
  }

  if (job.experience === "fresher") {
    tags.push(translate(formatLanguage(language), "jobs.freshersCanApply"));
  }

  for (const perk of job.perks.slice(0, 1)) {
    const label = formatJobSearchPerk(perk, language);
    if (!tags.includes(label)) {
      tags.push(label);
    }
  }

  return tags.slice(0, 4);
}
