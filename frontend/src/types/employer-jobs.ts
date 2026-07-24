export type JobStatus =
  | "draft"
  | "active"
  | "paused"
  | "closed"
  | "expired";

export type JobStatusAction =
  | "publish"
  | "pause"
  | "resume"
  | "close"
  | "expire"
  | "reactivate";

export type EmployerJobListItem = {
  id: string;
  jobId: string;
  jobTitle: string;
  jobType: "full-time" | "part-time" | "contract" | "";
  vacancies: number;
  city: string;
  cityName: string;
  state: string;
  stateName: string;
  applications: number;
  shortlisted: number;
  interviews: number;
  hired: number;
  views: number;
  status: JobStatus;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type EmployerJobCounts = {
  all: number;
  draft: number;
  active: number;
  paused: number;
  closed: number;
  expired: number;
};

export type EmployerJobsListResponse = {
  jobs: EmployerJobListItem[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  counts: EmployerJobCounts;
};

export type EmployerJobStatsResponse = {
  stats: {
    activeJobs: number;
    applications: number;
    shortlisted: number;
    interviews: number;
    hired: number;
    views: number;
    totalJobs: number;
    countsByStatus: Record<JobStatus, number>;
  };
  recentJobs: EmployerJobListItem[];
};

export type CreateJobPayload = {
  companyName: string;
  industry?: string;
  businessCategory?: string;
  companySize?: string;
  jobTitle: string;
  jobType: "full-time" | "part-time" | "contract";
  contractPeriodFrom: string;
  contractPeriodTo: string;
  partTimeSchedule: "fixed-timings" | "flexible-hours" | "";
  partTimeStartTime: string;
  partTimeEndTime: string;
  partTimeFlexibleHours: string;
  workMode: "office" | "field" | "both" | "home";
  vacancies: number;
  description: string;
  state: string;
  stateName: string;
  city: string;
  cityName: string;
  address: string;
  landmark: string;
  salaryType: "fixed" | "range";
  salaryPeriod: "per-month" | "per-year";
  fixedSalary: number | null;
  minimumSalary: number | null;
  maximumSalary: number | null;
  perks: string[];
  education: string[];
  experience: string;
  languages: string[];
  gender: string[];
  minimumAge: number | null;
  maximumAge: number | null;
  walkInEnabled: boolean;
  interviewAddress: string;
  walkInStartDate: string;
  walkInEndDate: string;
  walkInStartTime: string;
  walkInEndTime: string;
  interviewInstructions: string;
  contactPersonName: string;
  contactEmail: string;
  contactMobile: string;
  status?: JobStatus;
};

export type PostJobWizardSnapshot = {
  jobInformation: {
    companyDetails: string;
    industry?: string;
    businessCategory?: string;
    companySize?: string;
    jobTitle: string;
    jobType: string;
    contractPeriodFrom: string;
    contractPeriodTo: string;
    partTimeSchedule: string;
    partTimeStartTime: string;
    partTimeEndTime: string;
    partTimeFlexibleHours: string;
    workMode: string;
    vacancies: string;
    jobDescription: string;
  };
  locationAndSalary: {
    state: string;
    city: string;
    address: string;
    landmark: string;
    salaryType: string;
    salaryPeriod?: string;
    salaryMin: string;
    salaryMax: string;
    incentives: string;
    perks: string[];
  };
  candidateAndInterview: {
    education: string[];
    experienceRequired: string;
    additionalRequirements: {
      language: boolean;
      gender: boolean;
      age: boolean;
    };
    languages: string[];
    gender: string[];
    ageMin: string;
    ageMax: string;
    walkIn: string;
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
};

export type SaveDraftJobPayload = {
  completedStep: 1 | 2 | 3;
  wizardSnapshot: PostJobWizardSnapshot;
};

export type EmployerJobDetail = {
  id: string;
  jobId: string;
  employerId: string;
  companyId: string;
  companyName: string;
  industry: string;
  businessCategory: string;
  companySize: string;
  jobTitle: string;
  jobType: string;
  contractPeriodFrom: string;
  contractPeriodTo: string;
  partTimeSchedule: string;
  partTimeStartTime: string;
  partTimeEndTime: string;
  partTimeFlexibleHours: string;
  workMode: string;
  vacancies: number;
  description: string;
  state: string;
  stateName: string;
  city: string;
  cityName: string;
  address: string;
  landmark: string;
  salaryType: string;
  salaryPeriod?: string;
  fixedSalary: number | null;
  minimumSalary: number | null;
  maximumSalary: number | null;
  perks: string[];
  education: string[];
  experience: string;
  languages: string[];
  gender: string[];
  minimumAge: number | null;
  maximumAge: number | null;
  walkInEnabled: boolean;
  interviewAddress: string;
  walkInStartDate: string;
  walkInEndDate: string;
  walkInStartTime: string;
  walkInEndTime: string;
  interviewInstructions: string;
  contactPersonName: string;
  contactEmail: string;
  contactMobile: string;
  status: JobStatus;
  completedStep: 1 | 2 | 3;
  lastEditedAt: string;
  wizardSnapshot: PostJobWizardSnapshot | null;
  applications: number;
  shortlisted: number;
  interviews: number;
  hired: number;
  views: number;
  bookmarks: number;
  shares: number;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
};

export type CreatedJobResponse = {
  job: EmployerJobDetail & {
    publishedAt?: string | null;
  };
};

export type EmployerJobDetailResponse = {
  job: EmployerJobDetail;
};
