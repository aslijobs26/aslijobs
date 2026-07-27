export type JobSeekerGender =
  | "male"
  | "female"
  | "other"
  | "prefer_not_to_say";

export type JobSeekerJobType = "full-time" | "part-time" | "contract";

export type JobSeekerWorkMode =
  | "on-site"
  | "work-from-home"
  | "hybrid"
  | "field-work"
  | "any";

export type JobSeekerSalaryPeriod = "per-month" | "per-year";

export type JobSeekerEducationLevel =
  | "no_formal_education"
  | "below_10th"
  | "10th_pass"
  | "intermediate"
  | "iti"
  | "diploma"
  | "graduation"
  | "post_graduation";

export type JobSeekerExperienceType = "fresher" | "experienced";

export type JobSeekerLanguage =
  | "telugu"
  | "english"
  | "hindi"
  | "kannada"
  | "tamil"
  | "malayalam";

export type JobSeekerAvailabilityStatus =
  | "immediate"
  | "within_7"
  | "within_15"
  | "within_30"
  | "currently_working";

export type JobSeekerRegistrationStep =
  | "account"
  | "otp"
  | "preferences"
  | "education"
  | "complete";

export type JobSeekerEducation = {
  level: JobSeekerEducationLevel;
  schoolName: string;
  collegeName: string;
  instituteName: string;
  board: string;
  stream: string;
  trade: string;
  branch: string;
  degree: string;
  specialization: string;
  passingYear: string;
};

export type JobSeekerExperienceEntry = {
  companyName: string;
  jobRole: string;
  industry: string;
  startDate: string;
  endDate: string;
  currentlyWorking: boolean;
  duration: string;
  salary: string;
  location: string;
};

export type JobSeekerPublic = {
  id: string;
  fullName: string;
  whatsappNumber: string;
  dateOfBirth: string | null;
  gender: JobSeekerGender | null;
  pincode: string;
  city: string;
  state: string;
  jobRole: string;
  jobType?: JobSeekerJobType | null;
  workMode?: JobSeekerWorkMode | null;
  preferredJobLocation: string;
  expectedSalary?: number | null;
  expectedSalaryPeriod?: JobSeekerSalaryPeriod | null;
  education?: JobSeekerEducation | null;
  experienceType?: JobSeekerExperienceType | null;
  experiences?: JobSeekerExperienceEntry[];
  languages?: JobSeekerLanguage[];
  availabilityStatus?: JobSeekerAvailabilityStatus | null;
  isWhatsappVerified: boolean;
  registrationStatus: "PENDING" | "COMPLETED" | string;
  lastLoginAt?: string | null;
  createdAt?: string;
  updatedAt?: string;
};
