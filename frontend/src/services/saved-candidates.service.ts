import { apiClient } from "@/services/api-client";
import type {
  SaveCandidateBody,
  SavedCandidateExportField,
  SavedCandidateExportFormat,
  SavedCandidateIdsPayload,
  SavedCandidateListItem,
  SavedCandidatePriority,
  SavedCandidateSort,
  SavedCandidateStats,
  SavedCandidatesPagination,
} from "@/types/saved-candidates";

type ApiSuccess<T> = {
  success: true;
  message?: string;
  data: T;
};

export const savedCandidatesQueryKeys = {
  all: ["saved-candidates"] as const,
  stats: () => [...savedCandidatesQueryKeys.all, "stats"] as const,
  ids: () => [...savedCandidatesQueryKeys.all, "ids"] as const,
  list: (params: Record<string, unknown>) =>
    [...savedCandidatesQueryKeys.all, "list", params] as const,
};

export type FetchSavedCandidatesParams = {
  search?: string;
  publicJobId?: string;
  jobTitle?: string;
  location?: string;
  experience?: string;
  availability?: string;
  /** Filter by linked application status (e.g. "shortlisted"). */
  applicationStatus?: string;
  priority?: SavedCandidatePriority;
  tag?: string;
  sort?: SavedCandidateSort;
  page?: number;
  limit?: number;
};

export async function fetchSavedCandidateStats(): Promise<SavedCandidateStats> {
  const response = await apiClient.get<
    ApiSuccess<{ stats: SavedCandidateStats }>
  >("/saved-candidates/stats");
  return response.data.data.stats;
}

export async function fetchSavedCandidateApplicationIds(): Promise<SavedCandidateIdsPayload> {
  const response = await apiClient.get<
    ApiSuccess<{
      applicationIds?: string[];
      savedByApplicationId?: Record<string, string>;
    }>
  >("/saved-candidates/ids");

  const applicationIds = response.data.data.applicationIds ?? [];
  const savedByApplicationId =
    response.data.data.savedByApplicationId ??
    Object.fromEntries(applicationIds.map((id) => [id, ""]));

  return {
    applicationIds,
    savedByApplicationId,
  };
}

export async function fetchSavedCandidates(
  params: FetchSavedCandidatesParams = {},
): Promise<{
  savedCandidates: SavedCandidateListItem[];
  pagination: SavedCandidatesPagination;
}> {
  const response = await apiClient.get<
    ApiSuccess<{
      savedCandidates: SavedCandidateListItem[];
      pagination: SavedCandidatesPagination;
    }>
  >("/saved-candidates", {
    params: {
      search: params.search || undefined,
      publicJobId: params.publicJobId || undefined,
      jobTitle: params.jobTitle || undefined,
      location: params.location || undefined,
      experience: params.experience || undefined,
      availability: params.availability || undefined,
      applicationStatus: params.applicationStatus || undefined,
      priority: params.priority || undefined,
      tag: params.tag || undefined,
      sort: params.sort ?? "recently_saved",
      page: params.page ?? 1,
      limit: params.limit ?? 20,
    },
  });

  return response.data.data;
}

export async function saveCandidateApplication(
  body: SaveCandidateBody,
): Promise<{ savedCandidate: { id: string }; created: boolean }> {
  const response = await apiClient.post<
    ApiSuccess<{ savedCandidate: { id: string }; created: boolean }>
  >("/saved-candidates", {
    applicationId: body.applicationId,
    priority: body.priority,
    tags: body.tags,
    notes: body.notes,
  });
  return response.data.data;
}

export async function updateSavedCandidate(
  savedCandidateId: string,
  body: {
    priority?: SavedCandidatePriority;
    tags?: string[];
    notes?: string;
  },
): Promise<{ id: string }> {
  const response = await apiClient.patch<ApiSuccess<{ id: string }>>(
    `/saved-candidates/${encodeURIComponent(savedCandidateId)}`,
    body,
  );
  return response.data.data;
}

export async function removeSavedCandidate(
  savedCandidateId: string,
): Promise<{ removed: boolean }> {
  const response = await apiClient.delete<
    ApiSuccess<{ removed: boolean }>
  >(`/saved-candidates/${encodeURIComponent(savedCandidateId)}`);
  return response.data.data;
}

export async function removeSavedCandidateByApplication(
  applicationId: string,
): Promise<{ removed: boolean }> {
  const response = await apiClient.delete<
    ApiSuccess<{ removed: boolean }>
  >(
    `/saved-candidates/by-application/${encodeURIComponent(applicationId)}`,
  );
  return response.data.data;
}

export type ExportSavedCandidatesParams = FetchSavedCandidatesParams & {
  format: SavedCandidateExportFormat;
  fields: SavedCandidateExportField[];
};

export type SavedCandidatesExportPreview = {
  total: number;
  maxRows: number;
};

async function parseBlobError(error: unknown): Promise<never> {
  if (
    typeof error === "object" &&
    error !== null &&
    "response" in error &&
    (error as { response?: { data?: unknown } }).response?.data instanceof Blob
  ) {
    const blob = (error as { response: { data: Blob } }).response.data;
    const text = await blob.text();
    try {
      const parsed = JSON.parse(text) as { message?: string };
      if (typeof parsed.message === "string" && parsed.message.trim()) {
        throw new Error(parsed.message.trim());
      }
    } catch (parseError) {
      if (parseError instanceof Error && parseError.message !== text) {
        throw parseError;
      }
    }
  }
  throw error;
}

function buildExportBody(params: ExportSavedCandidatesParams) {
  return {
    format: params.format,
    fields: params.fields,
    search: params.search || undefined,
    publicJobId: params.publicJobId || undefined,
    jobTitle: params.jobTitle || undefined,
    location: params.location || undefined,
    experience: params.experience || undefined,
    availability: params.availability || undefined,
    applicationStatus: params.applicationStatus || undefined,
    priority: params.priority || undefined,
    tag: params.tag || undefined,
    sort: params.sort ?? "recently_saved",
  };
}

export async function previewSavedCandidatesExport(
  params: ExportSavedCandidatesParams,
): Promise<SavedCandidatesExportPreview> {
  const response = await apiClient.post<
    ApiSuccess<SavedCandidatesExportPreview>
  >("/saved-candidates/export/preview", buildExportBody(params));
  return response.data.data;
}

export async function exportSavedCandidates(
  params: ExportSavedCandidatesParams,
): Promise<{ blob: Blob; fileName: string }> {
  try {
    const response = await apiClient.post<Blob>(
      "/saved-candidates/export",
      buildExportBody(params),
      { responseType: "blob" },
    );

    const disposition = response.headers["content-disposition"];
    let fileName =
      params.format === "zip"
        ? "SavedCandidatesExport.zip"
        : params.format === "pdf"
          ? "Saved_Candidates_Report.pdf"
          : "Saved_Candidates.xlsx";

    if (typeof disposition === "string") {
      const matched = /filename="?([^"]+)"?/i.exec(disposition);
      if (matched?.[1]) {
        fileName = matched[1];
      }
    }

    return { blob: response.data, fileName };
  } catch (error) {
    await parseBlobError(error);
    throw error;
  }
}
