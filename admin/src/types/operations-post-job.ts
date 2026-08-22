export type OperationsPostJobType = "full-time" | "part-time" | "contract";

export type OperationsPostJobWorkMode = "office" | "field" | "both" | "home";

export type OperationsPostJobPartTimeSchedule =
  | "fixed-timings"
  | "flexible-hours";

export type OperationsPostJobSalaryType = "fixed" | "range";

export type OperationsPostJobSalaryPeriod = "per-month" | "per-year";

export type OperationsPostJobPerkId =
  | "travel_allowance"
  | "food_meals"
  | "accommodation"
  | "petrol_allowance"
  | "mobile_bill_allowance"
  | "internet_allowance"
  | "annual_bonus"
  | "laptop"
  | "pf";

export type OperationsPostJobEducationId =
  | "10th_or_below"
  | "12th_pass"
  | "diploma"
  | "iti"
  | "graduate"
  | "post_graduate";

export type OperationsPostJobExperienceId =
  | "fresher"
  | "6_month"
  | "1_year"
  | "2_year"
  | "3_year"
  | "4_year"
  | "5_year"
  | "6_year"
  | "10_year";

export type OperationsPostJobLanguageId =
  | "telugu"
  | "english"
  | "hindi"
  | "kannada"
  | "tamil"
  | "malayalam";

export type OperationsPostJobGenderId = "female" | "male" | "other";

export type OperationsPostJobActiveStep = 1 | 2 | 3;

export interface OperationsPostJobInformationForm {
  companyDetails: string;
  industry: string;
  businessCategory: string;
  companySize: string;
  jobTitle: string;
  jobType: OperationsPostJobType | "";
  contractPeriodFrom: string;
  contractPeriodTo: string;
  partTimeSchedule: OperationsPostJobPartTimeSchedule | "";
  partTimeStartTime: string;
  partTimeEndTime: string;
  partTimeFlexibleHours: string;
  workMode: OperationsPostJobWorkMode | "";
  vacancies: string;
  jobDescription: string;
}

export interface OperationsPostJobLocationSalaryForm {
  state: string;
  city: string;
  address: string;
  landmark: string;
  salaryType: OperationsPostJobSalaryType | "";
  salaryPeriod: OperationsPostJobSalaryPeriod | "";
  salaryMin: string;
  salaryMax: string;
  incentives: string;
  perks: OperationsPostJobPerkId[];
}

export interface OperationsPostJobCandidateInterviewForm {
  education: OperationsPostJobEducationId[];
  experienceRequired: OperationsPostJobExperienceId | "";
  additionalRequirements: {
    language: boolean;
    gender: boolean;
    age: boolean;
  };
  languages: OperationsPostJobLanguageId[];
  gender: OperationsPostJobGenderId[];
  ageMin: string;
  ageMax: string;
  walkIn: "yes" | "no";
  walkInAddress: string;
  walkInStartDate: string;
  walkInEndDate: string;
  walkInStartTime: string;
  walkInEndTime: string;
  otherInstructions: string;
  contactName: string;
  contactEmail: string;
  contactMobile: string;
}

export interface OperationsPostJobWizardFormData {
  jobInformation: OperationsPostJobInformationForm;
  locationAndSalary: OperationsPostJobLocationSalaryForm;
  candidateAndInterview: OperationsPostJobCandidateInterviewForm;
}

export interface OperationsEmployerOption {
  id: string;
  accountType: string;
  displayName: string;
  companyName: string;
  establishmentName: string;
  whatsappNumber: string;
  emailAddress: string;
  city: string;
  state: string;
  registrationCompleted: boolean;
  isWhatsappVerified: boolean;
  logoUrl: string;
}

export interface OperationsEmployersSearchResult {
  employers: OperationsEmployerOption[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
}

export interface SaveOperationsJobDraftPayload {
  completedStep: OperationsPostJobActiveStep;
  wizardSnapshot: OperationsPostJobWizardFormData;
  employerId?: string | null;
}

export interface OperationsPostJobWorkflowState {
  id: "draft" | "employer_assigned" | "ready_to_publish" | "live";
  label: string;
}
