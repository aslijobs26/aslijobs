import type { ApplicationStatus } from "./application.types.js";
import type {
  EMPLOYER_EXPORT_FIELDS,
  EMPLOYER_EXPORT_FORMATS,
} from "./employer-export.constants.js";

export type EmployerExportFormat =
  (typeof EMPLOYER_EXPORT_FORMATS)[number];

export type EmployerExportField =
  (typeof EMPLOYER_EXPORT_FIELDS)[number];

export type EmployerExportFilters = {
  employerId: string;
  format: EmployerExportFormat;
  fields: EmployerExportField[];
  publicJobId?: string;
  status?: ApplicationStatus;
  search?: string;
  location?: string;
  experience?: string;
  skills?: string;
  availability?: string;
  quickDateFilter?: string;
  appliedFrom?: string;
  appliedTo?: string;
};

export type EmployerExportRow = {
  candidateName: string;
  phone: string;
  appliedJob: string;
  appliedDate: string;
  status: string;
  location: string;
  experience: string;
  /** Signed resume access URL (display text is "View Resume" in generators). */
  resume: string;
};

export type EmployerExportFileResult = {
  buffer: Buffer;
  mimeType: string;
  fileName: string;
};

export type EmployerExportPreviewResult = {
  total: number;
};
