export const RESUME_STATUSES = [
  "NOT_GENERATED",
  "READY",
  "OUTDATED",
  "REGENERATING",
  "FAILED",
] as const;

export type ResumeStatus = (typeof RESUME_STATUSES)[number];

export type ResumeTemplateId =
  | "ats_professional"
  | "modern"
  | "blue_collar"
  | "grey_collar"
  | "simple";

export type ResumeGenerationSource = "profile" | "manual" | "ai" | "system";

export type ResumeJsonHeader = {
  fullName: string;
  phone: string;
  city: string;
  state: string;
  location: string;
  headline: string;
};

export type ResumeJsonContact = {
  fullName: string;
  phone: string;
  city: string;
  state: string;
};

export type ResumeJsonEducationEntry = {
  level: string;
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
  percentage: string;
  cgpa: string;
};

export type ResumeJsonExperienceEntry = {
  companyName: string;
  jobRole: string;
  industry: string;
  startDate: string;
  endDate: string;
  currentlyWorking: boolean;
  duration: string;
  salary: string;
  location: string;
  responsibilities: string;
};

export type ResumeJsonCareerPreferences = {
  preferredJobRole: string;
  preferredJobLocation: string;
  jobType: string | null;
  workMode: string | null;
  expectedSalary: number | null;
  expectedSalaryPeriod: string | null;
};

export type ResumeJsonSections = {
  professionalHeadline: string;
  professionalSummary: string;
  careerObjective: string;
  skills: string[];
  education: ResumeJsonEducationEntry[];
  experience: ResumeJsonExperienceEntry[];
  isFresher: boolean;
  experienceLabel: string;
  languages: string[];
  careerPreferences: ResumeJsonCareerPreferences;
  availability: string;
  contact: ResumeJsonContact;
};

export type ResumeJsonMeta = {
  dateOfBirth: string | null;
  sourceJobSeekerId: string | null;
  templateId: ResumeTemplateId | string;
  templateVersion: string;
  generatedAt: string | null;
};

export type ResumeJson = {
  header: ResumeJsonHeader;
  sections: ResumeJsonSections;
  meta: ResumeJsonMeta;
};

export type PublicResume = {
  id: string;
  jobSeekerId: string;
  isActive: boolean;
  status: ResumeStatus;
  templateId: ResumeTemplateId;
  templateVersion: string;
  versionNumber: number;
  generationSource: ResumeGenerationSource;
  profileCompletionPercent: number;
  resumeJson: ResumeJson | Record<string, never>;
  resumeHtml: string;
  pdfUrl: string;
  pdfStorageProvider: string;
  pdfPublicId: string;
  pdfStoragePath: string;
  lastGeneratedAt: string | null;
  lastProfileSnapshotAt: string | null;
  failureReason: string;
  createdAt?: string;
  updatedAt?: string;
};

export type ApplicationResumeSource = "generated" | "uploaded";

export type PublicUploadedResume = {
  fileName: string;
  fileUrl: string;
  mimeType: string;
  fileSize: number;
  storageProvider: string;
  uploadedAt: string | null;
};

export type JobSeekerResumeBundle = {
  resume: PublicResume | null;
  uploadedResume: PublicUploadedResume | null;
  defaultResumeSource: ApplicationResumeSource;
};

export function isResumeJson(
  value: PublicResume["resumeJson"],
): value is ResumeJson {
  return (
    typeof value === "object" &&
    value !== null &&
    "header" in value &&
    "sections" in value &&
    "meta" in value
  );
}
