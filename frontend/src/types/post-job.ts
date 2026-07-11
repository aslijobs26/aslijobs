export type JobType = "full-time" | "part-time" | "contract";

export type WorkMode = "office" | "field" | "both";

export type PostJobFormData = {
  companyDetails: string;
  jobTitle: string;
  jobType: JobType | "";
  contractPeriodFrom: string;
  contractPeriodTo: string;
  workMode: WorkMode | "";
  vacancies: string;
  jobDescription: string;
};

export type PostJobPerkId =
  | "travel_allowance"
  | "food_meals"
  | "accommodation"
  | "petrol_allowance"
  | "mobile_bill_allowance"
  | "internet_allowance"
  | "annual_bonus"
  | "laptop"
  | "pf";

export type LocationAndSalaryFormData = {
  state: string;
  city: string;
  address: string;
  landmark: string;
  salaryMin: string;
  salaryMax: string;
  incentives: string;
  perks: PostJobPerkId[];
};

export type PostJobWizardFormData = {
  jobInformation: PostJobFormData;
  locationAndSalary: LocationAndSalaryFormData;
  candidateAndInterview: CandidateInterviewFormData;
};

export type PostJobEducationId =
  | "10th_or_below"
  | "12th_pass"
  | "diploma"
  | "iti"
  | "graduate"
  | "post_graduate";

export type PostJobExperienceId =
  | "fresher"
  | "6_month"
  | "1_year"
  | "2_year"
  | "3_year"
  | "4_year"
  | "5_year"
  | "6_year"
  | "10_year";

export type PostJobLanguageId =
  | "telugu"
  | "english"
  | "hindi"
  | "kannada"
  | "tamil"
  | "malayalam";

export type PostJobGenderId = "female" | "male" | "other";

export type WalkInOption = "yes" | "no";

export type AdditionalRequirementsState = {
  language: boolean;
  gender: boolean;
  age: boolean;
};

export type CandidateInterviewFormData = {
  education: PostJobEducationId[];
  experienceRequired: PostJobExperienceId | "";
  additionalRequirements: AdditionalRequirementsState;
  languages: PostJobLanguageId[];
  gender: PostJobGenderId | "";
  ageMin: string;
  ageMax: string;
  walkIn: WalkInOption;
  walkInAddress: string;
  walkInStartDate: string;
  walkInEndDate: string;
  walkInStartTime: string;
  walkInEndTime: string;
  otherInstructions: string;
  contactName: string;
  contactEmail: string;
  contactMobile: string;
};

export type PostJobActiveStep = 1 | 2 | 3;

export type PostJobStepId =
  | "job-information"
  | "location-salary"
  | "candidate-interview";

export type PostJobStepIcon = "job-information" | "location" | "candidate";

export type PostJobStep = {
  id: PostJobStepId;
  stepNumber: number;
  title: string;
  description: string;
  icon: PostJobStepIcon;
};

export type PostJobOption<T extends string> = {
  value: T;
  label: string;
  description?: string;
};
