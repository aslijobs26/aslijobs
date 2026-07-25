import { apiClient } from "@/services/api-client";
import type { PublicResume } from "@/types/job-seeker-resume";

type ApiSuccess<T> = {
  success: true;
  message?: string;
  data: T;
};

type MyResumeResponse = {
  resume: PublicResume | null;
};

type RegenerateResumeResponse = {
  resume: PublicResume;
};

export async function fetchMyResume(): Promise<PublicResume | null> {
  const response = await apiClient.get<ApiSuccess<MyResumeResponse>>(
    "/resumes/me",
  );
  return response.data.data.resume;
}

export async function regenerateMyResume(): Promise<PublicResume> {
  const response = await apiClient.post<ApiSuccess<RegenerateResumeResponse>>(
    "/resumes/me/regenerate",
  );
  return response.data.data.resume;
}

export async function downloadMyResumePdf(): Promise<{
  blob: Blob;
  fileName: string;
}> {
  try {
    const response = await apiClient.get<Blob>("/resumes/me/pdf", {
      responseType: "blob",
    });

    const disposition = response.headers["content-disposition"];
    let fileName = "aslijobs-resume.pdf";

    if (typeof disposition === "string") {
      const matched = /filename="?([^"]+)"?/i.exec(disposition);
      if (matched?.[1]) {
        fileName = matched[1];
      }
    }

    return {
      blob: response.data,
      fileName,
    };
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
