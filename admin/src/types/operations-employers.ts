export type OperationsEmployerVerificationStatus =
  | "verified"
  | "pending"
  | "rejected";

export type OperationsEmployerStatus = "active" | "suspended" | "inactive";

export type OperationsEmployerDatePreset =
  | "all"
  | "today"
  | "yesterday"
  | "last_7_days"
  | "last_30_days"
  | "custom";

export interface OperationsEmployerKpis {
  totalEmployers: number;
  newEmployersToday: number;
  newThisWeek: number;
  activeEmployers: number;
  activeEmployersPercent: number | null;
  verifiedEmployers: number;
  verifiedEmployersPercent: number | null;
  pendingVerification: number;
  pendingVerificationPercent: number | null;
  suspended: number;
  suspendedPercent: number | null;
  rejected: number;
  rejectedPercent: number | null;
}

export interface OperationsEmployersPeriodStats {
  registered: number;
  verified: number;
  pendingVerification: number;
  suspended: number;
  rejected: number;
}

export interface OperationsEmployerListItem {
  id: string;
  displayId: string;
  accountType: string;
  displayName: string;
  companyName: string;
  establishmentName: string;
  organizationType: string;
  phone: string;
  email: string;
  location: string;
  city: string;
  state: string;
  registeredAt: string | null;
  registeredAtDate: string;
  registeredAtTime: string;
  verificationStatus: OperationsEmployerVerificationStatus;
  verificationStatusLabel: string;
  verifiedAt: string | null;
  verifiedAtDate: string;
  status: OperationsEmployerStatus;
  statusLabel: string;
  activeJobsCount: number;
  totalJobsCount: number;
  logoUrl: string;
  isWhatsappVerified: boolean;
  isProfileComplete: boolean;
  registrationStatus: string;
}

export interface OperationsEmployersFilterOptions {
  verificationStatuses: Array<{ value: string; label: string }>;
  employerTypes: Array<{ value: string; label: string }>;
  locations: string[];
  statuses: Array<{ value: string; label: string }>;
}

export interface OperationsEmployersPagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export interface OperationsEmployersListResult {
  kpis: OperationsEmployerKpis;
  periodStats: OperationsEmployersPeriodStats;
  filterOptions: OperationsEmployersFilterOptions;
  employers: OperationsEmployerListItem[];
  pagination: OperationsEmployersPagination;
}

export interface OperationsEmployersListParams {
  page: number;
  limit: number;
  search?: string;
  verificationStatus?: string;
  employerType?: string;
  location?: string;
  status?: string;
  datePreset?: OperationsEmployerDatePreset;
  dateFrom?: string;
  dateTo?: string;
  analyticsPreset?: OperationsEmployerDatePreset;
  analyticsFrom?: string;
  analyticsTo?: string;
}

export interface OperationsEmployerDocumentItem {
  id: string;
  documentType: string;
  documentTypeLabel: string;
  originalName: string;
  url: string;
  mimeType: string;
  fileSize: number;
  verificationStatus: string;
  uploadedAt: string;
}

export interface OperationsEmployerJobItem {
  id: string;
  jobId: string;
  jobTitle: string;
  businessCategory: string;
  jobType: string;
  workMode: string;
  city: string;
  state: string;
  salary: string;
  status: string;
  statusLabel: string;
  applicationsCount: number;
  createdAt: string;
}

export interface OperationsEmployerJobsResult {
  jobs: OperationsEmployerJobItem[];
  pagination: OperationsEmployersPagination;
}

export interface OperationsEmployerDetail extends OperationsEmployerListItem {
  industry: string;
  businessCategory: string;
  companyDescription: string;
  website: string;
  foundedYear: number | null;
  companyType: string;
  gstNumber: string;
  panNumber: string;
  registrationNumber: string;
  minimumEmployees: number | null;
  maximumEmployees: number | null;
  companyAddress: string;
  pincode: string;
  contactPersonName: string;
  contactDesignation: string;
  alternatePhone: string;
  aboutUs: string;
  culture: string;
  benefits: string;
  vision: string;
  mission: string;
  values: string;
  socialLinks: {
    linkedin: string;
    facebook: string;
    instagram: string;
    twitter: string;
    youtube: string;
  };
  lastLoginAt: string | null;
  documents: OperationsEmployerDocumentItem[];
  analytics: {
    totalJobs: number;
    activeJobs: number;
    pendingJobs: number;
    draftJobs: number;
    closedJobs: number;
    totalApplications: number;
    shortlistedApplications: number;
    hiredApplications: number;
  };
  verificationRemarks: string;
  suspensionReason: string;
}

export interface UpdateOperationsEmployerVerificationInput {
  verificationStatus: "verified" | "pending" | "rejected";
  remarks?: string;
}

export interface UpdateOperationsEmployerStatusInput {
  status: "active" | "suspended" | "inactive";
  reason?: string;
}
