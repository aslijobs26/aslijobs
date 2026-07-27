import { apiClient } from "@/services/api-client";
import type {
  EmployerApplicationDetail,
  EmployerApplicationListItem,
  EmployerApplicationStats,
  EmployerApplicationStatus,
  EmployerApplicationsExportParams,
  EmployerApplicationsListParams,
  EmployerApplicationsPagination,
  EmployerHiringUpdatePayload,
} from "@/types/employer-applications";

type ApiSuccess<T> = {
  success: true;
  message?: string;
  data: T;
};

export async function fetchEmployerApplications(
  options?: EmployerApplicationsListParams,
): Promise<{
  applications: EmployerApplicationListItem[];
  pagination: EmployerApplicationsPagination;
}> {
  const response = await apiClient.get<
    ApiSuccess<{
      applications: EmployerApplicationListItem[];
      pagination: EmployerApplicationsPagination;
    }>
  >("/applications/employer", {
    params: {
      publicJobId: options?.publicJobId || undefined,
      status: options?.status || undefined,
      search: options?.search || undefined,
      sort: options?.sort ?? "newest",
      page: options?.page ?? 1,
      limit: options?.limit ?? 20,
      location: options?.location || undefined,
      experience: options?.experience || undefined,
      skills: options?.skills || undefined,
      availability: options?.availability || undefined,
      appliedFrom: options?.appliedFrom || undefined,
      appliedTo: options?.appliedTo || undefined,
    },
  });

  return response.data.data;
}

export async function fetchEmployerLocationSuggestions(
  options: { q: string; publicJobId?: string; limit?: number },
  signal?: AbortSignal,
): Promise<string[]> {
  const query = options.q.trim().replace(/\s+/g, " ");
  if (query.length < 2) {
    return [];
  }

  const response = await apiClient.get<
    ApiSuccess<{ locations: string[] }>
  >("/applications/employer/location-suggestions", {
    params: {
      q: query,
      publicJobId: options.publicJobId || undefined,
      limit: options.limit ?? 20,
    },
    signal,
  });

  return response.data.data.locations ?? [];
}

export async function fetchEmployerApplicationStats(options?: {
  publicJobId?: string;
}): Promise<EmployerApplicationStats> {
  const response = await apiClient.get<
    ApiSuccess<{ stats: EmployerApplicationStats }>
  >("/applications/employer/stats", {
    params: {
      publicJobId: options?.publicJobId || undefined,
    },
  });

  return response.data.data.stats;
}

export async function fetchEmployerApplication(
  applicationId: string,
): Promise<EmployerApplicationDetail> {
  const response = await apiClient.get<
    ApiSuccess<{ application: EmployerApplicationDetail }>
  >(`/applications/employer/${applicationId}`);

  return response.data.data.application;
}

export async function updateEmployerApplicationStatus(
  applicationId: string,
  status: EmployerApplicationStatus,
): Promise<EmployerApplicationDetail> {
  const response = await apiClient.patch<
    ApiSuccess<{ application: EmployerApplicationDetail }>
  >(`/applications/employer/${applicationId}/status`, { status });

  return response.data.data.application;
}

export async function updateEmployerApplicationNotes(
  applicationId: string,
  notes: string,
): Promise<EmployerApplicationDetail> {
  const response = await apiClient.patch<
    ApiSuccess<{ application: EmployerApplicationDetail }>
  >(`/applications/employer/${applicationId}/notes`, { notes });

  return response.data.data.application;
}

export async function updateEmployerApplicationHiring(
  applicationId: string,
  payload: EmployerHiringUpdatePayload,
): Promise<EmployerApplicationDetail> {
  const response = await apiClient.patch<
    ApiSuccess<{ application: EmployerApplicationDetail }>
  >(`/applications/employer/${applicationId}/hiring`, payload);

  return response.data.data.application;
}

export async function downloadEmployerApplicationPdf(
  applicationId: string,
): Promise<{ blob: Blob; fileName: string }> {
  try {
    const response = await apiClient.get<Blob>(
      `/applications/employer/${applicationId}/pdf`,
      { responseType: "blob" },
    );

    const disposition = response.headers["content-disposition"];
    let fileName = "candidate-resume.pdf";

    if (typeof disposition === "string") {
      const matched = /filename="?([^"]+)"?/i.exec(disposition);
      if (matched?.[1]) {
        fileName = matched[1];
      }
    }

    return { blob: response.data, fileName };
  } catch (error) {
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
      } catch (parsedError) {
        if (parsedError instanceof Error && parsedError.name !== "SyntaxError") {
          throw parsedError;
        }
      }
    }

    throw error;
  }
}

function buildExportPayload(options: EmployerApplicationsExportParams) {
  const quickDateFilter = options.quickDateFilter || "all_time";
  const isCustom = quickDateFilter === "custom";
  return {
    format: options.format,
    fields: options.fields,
    publicJobId: options.publicJobId || "",
    status: options.status || undefined,
    search: options.search || "",
    location: options.location || "",
    experience: options.experience || "",
    skills: options.skills || "",
    availability: options.availability || "",
    quickDateFilter,
    appliedFrom: isCustom ? options.appliedFrom || "" : "",
    appliedTo: isCustom ? options.appliedTo || "" : "",
  };
}

export async function previewEmployerApplicationsExport(
  options: EmployerApplicationsExportParams,
): Promise<{ total: number }> {
  const response = await apiClient.post<ApiSuccess<{ total: number }>>(
    "/applications/employer/export/preview",
    buildExportPayload(options),
  );
  return response.data.data;
}

export async function exportEmployerApplications(
  options: EmployerApplicationsExportParams,
): Promise<{ blob: Blob; fileName: string }> {
  try {
    const response = await apiClient.post<Blob>(
      "/applications/employer/export",
      buildExportPayload(options),
      { responseType: "blob" },
    );

    const disposition = response.headers["content-disposition"];
    let fileName = `candidates-export.${options.format === "xlsx" ? "xlsx" : options.format}`;

    if (typeof disposition === "string") {
      const matched = /filename="?([^"]+)"?/i.exec(disposition);
      if (matched?.[1]) {
        fileName = matched[1];
      }
    }

    return { blob: response.data, fileName };
  } catch (error) {
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
      } catch (parsedError) {
        if (parsedError instanceof Error && parsedError.name !== "SyntaxError") {
          throw parsedError;
        }
      }
    }

    throw error;
  }
}
