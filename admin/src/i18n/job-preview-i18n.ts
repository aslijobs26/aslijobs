import type { OperationsJobPreviewLanguageCode } from "../constants/operations-job-preview-languages";
import en from "./locales/job-preview/en.json";
import hi from "./locales/job-preview/hi.json";
import te from "./locales/job-preview/te.json";
import ta from "./locales/job-preview/ta.json";
import kn from "./locales/job-preview/kn.json";
import ml from "./locales/job-preview/ml.json";

type JobPreviewMessages = typeof en;
type JobPreviewMessageKey = keyof JobPreviewMessages["jobs"];

const BUNDLES: Record<
  OperationsJobPreviewLanguageCode,
  JobPreviewMessages
> = {
  en,
  hi,
  te,
  ta,
  kn,
  ml,
};

const JOB_TYPE_KEYS: Record<string, JobPreviewMessageKey> = {
  "full-time": "fullTime",
  "part-time": "partTime",
  contract: "contract",
};

const WORK_MODE_KEYS: Record<string, JobPreviewMessageKey> = {
  office: "office",
  field: "field",
  both: "officeField",
  home: "workFromHome",
};

const EXPERIENCE_KEYS: Record<string, JobPreviewMessageKey> = {
  fresher: "fresher",
  "6_month": "months6",
  "1_year": "year1",
  "2_year": "years2",
  "3_year": "years3",
  "4_year": "years4",
  "5_year": "years5",
  "6_year": "years6",
  "10_year": "years10",
};

const EDUCATION_KEYS: Record<string, JobPreviewMessageKey> = {
  "10th_or_below": "tenth",
  "12th_pass": "twelfth",
  diploma: "diploma",
  iti: "iti",
  graduate: "graduate",
  post_graduate: "postGraduate",
};

const GENDER_KEYS: Record<string, JobPreviewMessageKey> = {
  male: "male",
  female: "female",
  other: "other",
  any: "any",
};

const LANGUAGE_KEYS: Record<string, JobPreviewMessageKey> = {
  english: "langEnglish",
  telugu: "langTelugu",
  hindi: "langHindi",
  tamil: "langTamil",
  kannada: "langKannada",
  malayalam: "langMalayalam",
};

const PERK_KEYS: Record<string, JobPreviewMessageKey> = {
  travel_allowance: "travelAllowance",
  food_meals: "foodMeals",
  accommodation: "accommodation",
  petrol_allowance: "petrolAllowance",
  mobile_bill_allowance: "mobileBill",
  internet_allowance: "internet",
  annual_bonus: "annualBonus",
  laptop: "laptop",
  pf: "pf",
};

export function translateJobPreview(
  language: OperationsJobPreviewLanguageCode,
  key: JobPreviewMessageKey,
  vars?: Record<string, string | number>,
): string {
  const bundle = BUNDLES[language] ?? BUNDLES.en;
  let message = bundle.jobs[key] ?? BUNDLES.en.jobs[key] ?? String(key);
  if (vars) {
    for (const [name, value] of Object.entries(vars)) {
      message = message.replaceAll(`{${name}}`, String(value));
    }
  }
  return message;
}

function localizeEnum(
  language: OperationsJobPreviewLanguageCode,
  map: Record<string, JobPreviewMessageKey>,
  value: string,
  fallback = "",
): string {
  const trimmed = value.trim();
  if (!trimmed) {
    return fallback;
  }
  const key = map[trimmed];
  if (!key) {
    return fallback || trimmed;
  }
  return translateJobPreview(language, key);
}

export function localizeJobPreviewJobType(
  language: OperationsJobPreviewLanguageCode,
  jobType: string,
  fallbackLabel = "",
): string {
  return localizeEnum(language, JOB_TYPE_KEYS, jobType, fallbackLabel);
}

export function localizeJobPreviewWorkMode(
  language: OperationsJobPreviewLanguageCode,
  workMode: string,
  fallbackLabel = "",
): string {
  return localizeEnum(language, WORK_MODE_KEYS, workMode, fallbackLabel);
}

export function localizeJobPreviewExperience(
  language: OperationsJobPreviewLanguageCode,
  experience: string,
  fallbackLabel = "",
): string {
  return localizeEnum(language, EXPERIENCE_KEYS, experience, fallbackLabel);
}

export function localizeJobPreviewEducation(
  language: OperationsJobPreviewLanguageCode,
  education: string,
  fallbackLabel = "",
): string {
  return localizeEnum(language, EDUCATION_KEYS, education, fallbackLabel);
}

export function localizeJobPreviewGender(
  language: OperationsJobPreviewLanguageCode,
  gender: string,
  fallbackLabel = "",
): string {
  return localizeEnum(language, GENDER_KEYS, gender, fallbackLabel);
}

export function localizeJobPreviewSpokenLanguage(
  language: OperationsJobPreviewLanguageCode,
  spokenLanguage: string,
  fallbackLabel = "",
): string {
  return localizeEnum(language, LANGUAGE_KEYS, spokenLanguage, fallbackLabel);
}

export function localizeJobPreviewPerk(
  language: OperationsJobPreviewLanguageCode,
  perk: string,
  fallbackLabel = "",
): string {
  return localizeEnum(language, PERK_KEYS, perk, fallbackLabel);
}

export function localizeJobPreviewSalary(
  language: OperationsJobPreviewLanguageCode,
  job: {
    salaryType: string;
    salaryPeriod: string;
    fixedSalary: number | null;
    minimumSalary: number | null;
    maximumSalary: number | null;
    salaryLabel?: string;
  },
): string {
  const period =
    job.salaryPeriod === "per-year"
      ? translateJobPreview(language, "perYear")
      : translateJobPreview(language, "perMonth");
  const formatAmount = (value: number) => `₹${value.toLocaleString("en-IN")}`;

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
    return `${formatAmount(job.minimumSalary)}${period}`;
  }

  if (job.maximumSalary != null) {
    return `${formatAmount(job.maximumSalary)}${period}`;
  }

  const existing = job.salaryLabel?.trim() ?? "";
  if (existing) {
    return existing
      .replace(/\s*\/month\b/i, translateJobPreview(language, "perMonth"))
      .replace(/\s*\/year\b/i, translateJobPreview(language, "perYear"));
  }

  return "";
}
