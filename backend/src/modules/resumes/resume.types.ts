import type {
  APPLICATION_RESUME_SOURCES,
  RESUME_GENERATION_SOURCES,
  RESUME_STATUSES,
  RESUME_TEMPLATE_IDS,
} from "./resume.constants.js";

export type ApplicationResumeSource =
  (typeof APPLICATION_RESUME_SOURCES)[number];

export type PublicUploadedResume = {
  fileName: string;
  fileUrl: string;
  mimeType: string;
  fileSize: number;
  storageProvider: string;
  uploadedAt: string | null;
};

export type UploadedResumeSnapshot = {
  url: string;
  storagePath: string;
  publicId: string;
  storageProvider: string;
  originalName: string;
  mimeType: string;
  fileSize: number;
  uploadedAt: string | null;
};

export type ResumeStatus = (typeof RESUME_STATUSES)[number];

export type ResumeTemplateId = (typeof RESUME_TEMPLATE_IDS)[number];

export type ResumeGenerationSource =
  (typeof RESUME_GENERATION_SOURCES)[number];

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

/**
 * Internal-only metadata. Gender is intentionally omitted from ResumeJson.
 * DOB is stored here for template opt-in in later phases — not in visible sections.
 */
export type ResumeJsonMeta = {
  dateOfBirth: string | null;
  sourceJobSeekerId: string | null;
  templateId: ResumeTemplateId | string;
  templateVersion: string;
  generatedAt: string | null;
};

/**
 * Canonical ATS resume content shape.
 * Phase 2: structured sections generated from profile; HTML/PDF deferred.
 */
export type ResumeJson = {
  header: ResumeJsonHeader;
  sections: ResumeJsonSections;
  meta: ResumeJsonMeta;
};

export type EmptyResumeJson = ResumeJson;

export type JobSeekerProfileForResume = {
  id?: string;
  fullName: string;
  whatsappNumber: string;
  dateOfBirth?: string | Date | null;
  gender?: string | null;
  pincode?: string | null;
  city?: string | null;
  state?: string | null;
  jobRole?: string | null;
  jobType?: string | null;
  workMode?: string | null;
  preferredJobLocation?: string | null;
  expectedSalary?: number | null;
  expectedSalaryPeriod?: string | null;
  education?: ResumeJsonEducationEntry | Record<string, unknown> | null;
  experienceType?: string | null;
  experiences?: ResumeJsonExperienceEntry[] | Record<string, unknown>[];
  languages?: string[];
  professionalSummary?: string | null;
  skills?: string[];
};

export type ProfileCompletenessBreakdown = {
  personal: boolean;
  preferences: boolean;
  education: boolean;
  experience: boolean;
  languages: boolean;
};

export type ProfileCompletenessResult = {
  percent: number;
  breakdown: ProfileCompletenessBreakdown;
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
  lastGeneratedAt: Date | null;
  lastProfileSnapshotAt: Date | null;
  failureReason: string;
  createdAt?: Date;
  updatedAt?: Date;
};
