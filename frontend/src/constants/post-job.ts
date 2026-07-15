import type {
  CandidateInterviewFormData,
  JobType,
  LocationAndSalaryFormData,
  PostJobActiveStep,
  ContractPeriodUnit,
  PostJobEducationId,
  PostJobExperienceId,
  PostJobFormData,
  PostJobGenderId,
  PostJobLanguageId,
  PostJobOption,
  PostJobPerkId,
  PostJobStep,
  PostJobWizardFormData,
  SalaryType,
  WorkMode,
} from "@/types/post-job";
import { JOB_CITIES, JOB_STATES } from "@/constants/job-locations";

export const POST_JOB_STEPS: PostJobStep[] = [
  {
    id: "job-information",
    stepNumber: 1,
    title: "Job Information",
    description: "Add the basic details about the job.",
    icon: "job-information",
  },
  {
    id: "location-salary",
    stepNumber: 2,
    title: "Location & Salary",
    description: "Add the job location and Salary details.",
    icon: "location",
  },
  {
    id: "candidate-interview",
    stepNumber: 3,
    title: "Candidate & Interview",
    description: "Add candidate requirements and Interview details.",
    icon: "candidate",
  },
];

export const POST_JOB_INITIAL_STEP = 1 satisfies PostJobActiveStep;

export const POST_JOB_INITIAL_FORM_DATA: PostJobFormData = {
  companyDetails: "",
  jobTitle: "",
  jobType: "",
  contractPeriodFrom: "",
  contractPeriodTo: "",
  workMode: "",
  vacancies: "",
  jobDescription: "",
};

export const POST_JOB_INITIAL_LOCATION_SALARY_DATA: LocationAndSalaryFormData = {
  state: "",
  city: "",
  address: "",
  landmark: "",
  salaryType: "",
  salaryMin: "",
  salaryMax: "",
  incentives: "",
  perks: [],
};

export const POST_JOB_SALARY_TYPE_OPTIONS: PostJobOption<SalaryType>[] = [
  { value: "fixed", label: "Fixed" },
  { value: "range", label: "Range" },
];

export const POST_JOB_INITIAL_CANDIDATE_INTERVIEW_DATA: CandidateInterviewFormData =
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

export const POST_JOB_INITIAL_WIZARD_DATA: PostJobWizardFormData = {
  jobInformation: POST_JOB_INITIAL_FORM_DATA,
  locationAndSalary: POST_JOB_INITIAL_LOCATION_SALARY_DATA,
  candidateAndInterview: POST_JOB_INITIAL_CANDIDATE_INTERVIEW_DATA,
};

export const POST_JOB_STATE_OPTIONS = JOB_STATES.map((state) => ({
  value: state.id,
  label: state.name,
}));

export const POST_JOB_CITY_OPTIONS = JOB_CITIES.map((city) => ({
  value: city.id,
  label: city.name,
}));

export const POST_JOB_PERK_OPTIONS: PostJobOption<PostJobPerkId>[] = [
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

export const JOB_TYPE_OPTIONS: PostJobOption<JobType>[] = [
  { value: "full-time", label: "Full-time" },
  { value: "part-time", label: "Part-time" },
  { value: "contract", label: "Contract" },
];

export const POST_JOB_CONTRACT_PERIOD_UNITS: PostJobOption<ContractPeriodUnit>[] =
  [
    { value: "days", label: "Days" },
    { value: "months", label: "Months" },
    { value: "years", label: "Years" },
  ];

const LEGACY_CONTRACT_PERIOD_VALUES: Record<
  string,
  { amount: string; unit: ContractPeriodUnit }
> = {
  "1_month": { amount: "1", unit: "months" },
  "3_months": { amount: "3", unit: "months" },
  "6_months": { amount: "6", unit: "months" },
  "12_months": { amount: "12", unit: "months" },
  "24_months": { amount: "24", unit: "months" },
};

export function parseContractPeriodStoredValue(value: string): {
  amount: string;
  unit: ContractPeriodUnit;
} {
  if (!value) {
    return { amount: "", unit: "months" };
  }

  const legacyValue = LEGACY_CONTRACT_PERIOD_VALUES[value];

  if (legacyValue) {
    return legacyValue;
  }

  const match = value.match(/^(\d+)_(days|months|years)$/);

  if (match) {
    return {
      amount: match[1],
      unit: match[2] as ContractPeriodUnit,
    };
  }

  return { amount: "", unit: "months" };
}

export function buildContractPeriodStoredValue(
  amount: string,
  unit: ContractPeriodUnit,
) {
  const sanitizedAmount = amount.replace(/\D/g, "");

  if (!sanitizedAmount || Number(sanitizedAmount) <= 0) {
    return "";
  }

  return `${sanitizedAmount}_${unit}`;
}

export const WORK_MODE_OPTIONS: PostJobOption<WorkMode>[] = [
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
];

export const POST_JOB_EDUCATION_OPTIONS: PostJobOption<PostJobEducationId>[] = [
  { value: "10th_or_below", label: "Below 10th" },
  { value: "12th_pass", label: "12th Pass" },
  { value: "iti", label: "ITI" },
  { value: "diploma", label: "Diploma" },
  { value: "graduate", label: "Graduate" },
  { value: "post_graduate", label: "Postgraduate" },
];

export const POST_JOB_EXPERIENCE_OPTIONS: PostJobOption<PostJobExperienceId>[] =
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

export const POST_JOB_LANGUAGE_OPTIONS: PostJobOption<PostJobLanguageId>[] = [
  { value: "telugu", label: "తెలుగు" },
  { value: "english", label: "English" },
  { value: "hindi", label: "हिन्दी" },
  { value: "kannada", label: "ಕನ್ನಡ" },
  { value: "tamil", label: "தமிழ்" },
  { value: "malayalam", label: "മലയാളം" },
];

export const POST_JOB_GENDER_OPTIONS: PostJobOption<PostJobGenderId>[] = [
  { value: "female", label: "Female" },
  { value: "male", label: "Male" },
  { value: "other", label: "Other" },
];

export const POST_JOB_ADDITIONAL_REQUIREMENT_TOGGLES = [
  { key: "language" as const, label: "Language" },
  { key: "gender" as const, label: "Gender" },
  { key: "age" as const, label: "Age" },
];

export const POST_JOB_WALK_IN_TIME_OPTIONS = [
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
