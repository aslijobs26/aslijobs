import { apiClient } from "@/services/api-client";
import type {
  EmployerApplicationDetail,
  EmployerApplicationListItem,
  EmployerApplicationStatus,
  EmployerHiringUpdatePayload,
} from "@/types/employer-applications";

type ApiSuccess<T> = {
  success: true;
  message?: string;
  data: T;
};

export async function fetchEmployerApplications(options?: {
  publicJobId?: string;
  status?: EmployerApplicationStatus;
  search?: string;
}): Promise<EmployerApplicationListItem[]> {
  const response = await apiClient.get<
    ApiSuccess<{ applications: EmployerApplicationListItem[] }>
  >("/applications/employer", {
    params: {
      publicJobId: options?.publicJobId || undefined,
      status: options?.status || undefined,
      search: options?.search || undefined,
    },
  });

  return response.data.data.applications;
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
