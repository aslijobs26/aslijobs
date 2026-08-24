import type {
  OperationsPostJobActiveStep,
  OperationsPostJobEducationId,
  OperationsPostJobExperienceId,
  OperationsPostJobGenderId,
  OperationsPostJobInformationForm,
  OperationsPostJobLanguageId,
  OperationsPostJobLocationSalaryForm,
  OperationsPostJobCandidateInterviewForm,
  OperationsPostJobPerkId,
  OperationsPostJobType,
  OperationsPostJobWizardFormData,
  OperationsPostJobWorkMode,
} from "../types/operations-post-job";

export const OPERATIONS_POST_JOB_LONG_TEXT_MAX_LENGTH = 3000;

export const OPERATIONS_POST_JOB_STEPS = [
  { step: 1 as const, title: "Job Information" },
  { step: 2 as const, title: "Location & Salary" },
  { step: 3 as const, title: "Candidate & Interview" },
];

export const OPERATIONS_POST_JOB_INITIAL_INFORMATION: OperationsPostJobInformationForm =
  {
    companyDetails: "",
    industry: "",
    businessCategory: "",
    companySize: "",
    jobTitle: "",
    jobType: "",
    contractPeriodFrom: "",
    contractPeriodTo: "",
    partTimeSchedule: "",
    partTimeStartTime: "",
    partTimeEndTime: "",
    partTimeFlexibleHours: "",
    workMode: "",
    vacancies: "",
    jobDescription: "",
  };

export const OPERATIONS_POST_JOB_INITIAL_LOCATION_SALARY: OperationsPostJobLocationSalaryForm =
  {
    state: "",
    city: "",
    address: "",
    landmark: "",
    salaryType: "",
    salaryPeriod: "",
    salaryMin: "",
    salaryMax: "",
    incentives: "",
    perks: [],
  };

export const OPERATIONS_POST_JOB_INITIAL_CANDIDATE_INTERVIEW: OperationsPostJobCandidateInterviewForm =
  {
    education: [],
    experienceRequired: "",
    additionalRequirements: {
      language: true,
      gender: true,
      age: true,
    },
    languages: [],
    gender: [],
    ageMin: "",
    ageMax: "",
    walkIn: "yes",
    walkInAddress: "",
    walkInStartDate: "",
    walkInEndDate: "",
    walkInStartTime: "",
    walkInEndTime: "",
    otherInstructions: "",
    contactName: "",
    contactEmail: "",
    contactMobile: "",
  };

export const OPERATIONS_POST_JOB_INITIAL_WIZARD_DATA: OperationsPostJobWizardFormData =
  {
    jobInformation: OPERATIONS_POST_JOB_INITIAL_INFORMATION,
    locationAndSalary: OPERATIONS_POST_JOB_INITIAL_LOCATION_SALARY,
    candidateAndInterview: OPERATIONS_POST_JOB_INITIAL_CANDIDATE_INTERVIEW,
  };

export const OPERATIONS_POST_JOB_INITIAL_STEP = 1 satisfies OperationsPostJobActiveStep;

export interface OperationsPostJobOption<T extends string = string> {
  value: T;
  label: string;
  description?: string;
}

export const OPERATIONS_POST_JOB_TYPE_OPTIONS: OperationsPostJobOption<OperationsPostJobType>[] =
  [
    { value: "full-time", label: "Full-time" },
    { value: "part-time", label: "Part-time" },
    { value: "contract", label: "Contract" },
  ];

export const OPERATIONS_POST_JOB_WORK_MODE_OPTIONS: OperationsPostJobOption<OperationsPostJobWorkMode>[] =
  [
    {
      value: "office",
      label: "Work From Office",
      description: "Employee works from the office.",
    },
    {
      value: "field",
      label: "Field Work",
      description: "Employee works at different field locations.",
    },
    {
      value: "both",
      label: "Office & Field Work",
      description: "Employee works from both the office & field locations.",
    },
    {
      value: "home",
      label: "Work From Home",
      description: "Employee works remotely from home.",
    },
  ];

export const OPERATIONS_POST_JOB_SALARY_TYPE_OPTIONS = [
  { value: "fixed", label: "Fixed" },
  { value: "range", label: "Range" },
] as const;

export const OPERATIONS_POST_JOB_SALARY_PERIOD_OPTIONS = [
  { value: "per-month", label: "Per Month" },
  { value: "per-year", label: "Per Year" },
] as const;

export const OPERATIONS_POST_JOB_PERK_OPTIONS: OperationsPostJobOption<OperationsPostJobPerkId>[] =
  [
    { value: "travel_allowance", label: "Travel Allowance" },
    { value: "food_meals", label: "Food/Meal Allowance" },
    { value: "annual_bonus", label: "Annual Bonus" },
    { value: "accommodation", label: "Accommodation Provided" },
    { value: "petrol_allowance", label: "Petrol Allowance" },
    { value: "mobile_bill_allowance", label: "Mobile Allowance" },
    { value: "internet_allowance", label: "Internet Allowance" },
    { value: "laptop", label: "Laptop Provided" },
    { value: "pf", label: "PF" },
  ];

export const OPERATIONS_POST_JOB_EDUCATION_OPTIONS: OperationsPostJobOption<OperationsPostJobEducationId>[] =
  [
    { value: "10th_or_below", label: "Below 10th" },
    { value: "12th_pass", label: "12th Pass" },
    { value: "iti", label: "ITI" },
    { value: "diploma", label: "Diploma" },
    { value: "graduate", label: "Graduate" },
    { value: "post_graduate", label: "Postgraduate" },
  ];

export const OPERATIONS_POST_JOB_EXPERIENCE_OPTIONS: OperationsPostJobOption<OperationsPostJobExperienceId>[] =
  [
    { value: "fresher", label: "Fresher" },
    { value: "6_month", label: "Less than 6 Months" },
    { value: "1_year", label: "6 Months to 1 Year" },
    { value: "2_year", label: "1 to 2 Years" },
    { value: "3_year", label: "2 to 3 Years" },
    { value: "4_year", label: "3 to 5 Years" },
    { value: "5_year", label: "5 to 10 Years" },
    { value: "6_year", label: "6 Years" },
    { value: "10_year", label: "10+ Years" },
  ];

export const OPERATIONS_POST_JOB_LANGUAGE_OPTIONS: OperationsPostJobOption<OperationsPostJobLanguageId>[] =
  [
    { value: "telugu", label: "Telugu" },
    { value: "english", label: "English" },
    { value: "hindi", label: "Hindi" },
    { value: "kannada", label: "Kannada" },
    { value: "tamil", label: "Tamil" },
    { value: "malayalam", label: "Malayalam" },
  ];

export const OPERATIONS_POST_JOB_GENDER_OPTIONS: OperationsPostJobOption<OperationsPostJobGenderId>[] =
  [
    { value: "female", label: "Female" },
    { value: "male", label: "Male" },
    { value: "other", label: "Other" },
  ];

export const OPERATIONS_POST_JOB_ADDITIONAL_REQUIREMENT_TOGGLES = [
  { key: "language" as const, label: "Language" },
  { key: "gender" as const, label: "Gender" },
  { key: "age" as const, label: "Age" },
];

export const OPERATIONS_POST_JOB_WALK_IN_TIME_OPTIONS = [
  { value: "09:00", label: "9:00 AM" },
  { value: "10:00", label: "10:00 AM" },
  { value: "11:00", label: "11:00 AM" },
  { value: "12:00", label: "12:00 PM" },
  { value: "13:00", label: "1:00 PM" },
  { value: "14:00", label: "2:00 PM" },
  { value: "15:00", label: "3:00 PM" },
  { value: "16:00", label: "4:00 PM" },
  { value: "17:00", label: "5:00 PM" },
  { value: "18:00", label: "6:00 PM" },
];

export const OPERATIONS_POST_JOB_PART_TIME_SCHEDULE_OPTIONS = [
  { value: "fixed-timings", label: "Fixed Timings" },
  { value: "flexible-hours", label: "Flexible hours" },
] as const;

export const OPERATIONS_POST_JOB_FLEXIBLE_HOURS_OPTIONS = Array.from(
  { length: 9 },
  (_, index) => {
    const hours = index + 1;
    return {
      value: String(hours),
      label: hours === 1 ? "1 hour" : `${hours} hours`,
    };
  },
);

export const OPERATIONS_POST_JOB_CONTRACT_PERIOD_UNITS = [
  { value: "days", label: "Days" },
  { value: "months", label: "Months" },
  { value: "years", label: "Years" },
] as const;

export function buildContractPeriodStoredValue(
  amount: string,
  unit: (typeof OPERATIONS_POST_JOB_CONTRACT_PERIOD_UNITS)[number]["value"],
): string {
  const sanitizedAmount = amount.replace(/\D/g, "");
  if (!sanitizedAmount || Number(sanitizedAmount) <= 0) {
    return "";
  }
  return `${sanitizedAmount}_${unit}`;
}

export function parseContractPeriodStoredValue(value: string): {
  amount: string;
  unit: (typeof OPERATIONS_POST_JOB_CONTRACT_PERIOD_UNITS)[number]["value"];
} {
  if (!value) {
    return { amount: "", unit: "months" };
  }
  const legacyValue: Record<
    string,
    { amount: string; unit: (typeof OPERATIONS_POST_JOB_CONTRACT_PERIOD_UNITS)[number]["value"] }
  > = {
    "1_month": { amount: "1", unit: "months" },
    "3_months": { amount: "3", unit: "months" },
    "6_months": { amount: "6", unit: "months" },
    "12_months": { amount: "12", unit: "months" },
    "24_months": { amount: "24", unit: "months" },
  };
  if (legacyValue[value]) {
    return legacyValue[value];
  }
  const match = value.match(/^(\d+)_(days|months|years)$/);
  if (match) {
    return {
      amount: match[1],
      unit: match[2] as (typeof OPERATIONS_POST_JOB_CONTRACT_PERIOD_UNITS)[number]["value"],
    };
  }
  return { amount: "", unit: "months" };
}
