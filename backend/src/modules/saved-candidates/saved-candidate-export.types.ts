import type {
  SAVED_CANDIDATE_EXPORT_FIELDS,
  SAVED_CANDIDATE_EXPORT_FORMATS,
} from "./saved-candidate-export.constants.js";
import type { SavedCandidatePriority, SavedCandidateSort } from "./saved-candidate.types.js";

export type SavedCandidateExportFormat =
  (typeof SAVED_CANDIDATE_EXPORT_FORMATS)[number];

export type SavedCandidateExportField =
  (typeof SAVED_CANDIDATE_EXPORT_FIELDS)[number];

export type SavedCandidateExportFilters = {
  employerId: string;
  format: SavedCandidateExportFormat;
  fields: SavedCandidateExportField[];
  search?: string;
  publicJobId?: string;
  jobTitle?: string;
  location?: string;
  experience?: string;
  availability?: string;
  applicationStatus?: string;
  priority?: SavedCandidatePriority;
  tag?: string;
  sort?: SavedCandidateSort;
  actor?: {
    teamMemberId?: string | null;
    displayName: string;
    ip?: string | null;
  };
};

export type SavedCandidateExportRow = Record<SavedCandidateExportField, string> & {
  applicationId: string;
  hasResumeSnapshot: boolean;
  resumeSafeFileName: string;
  applicationStatus: string;
};

export type SavedCandidateExportFileResult = {
  buffer: Buffer;
  mimeType: string;
  fileName: string;
  totalCandidates: number;
  resumesExported: number;
};

export type SavedCandidateExportPreviewResult = {
  total: number;
  maxRows: number;
};
