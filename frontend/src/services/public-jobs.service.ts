import { apiClient } from "@/services/api-client";
import { normalizeAbortedRequestError } from "@/utils/query-error";

type ApiSuccess<T> = {
  success: true;
  message?: string;
  data: T;
};

export type PublicJobSort =
  | "relevant"
  | "latest"
  | "salary_desc"
  | "salary_asc";

export type PublicJobListItem = {
  id: string;
  jobId: string;
  companyName: string;
  /** Company logo, consultancy logo, or individual profile photo. */
  companyLogoUrl?: string;
  jobTitle: string;
  jobType: "full-time" | "part-time" | "contract";
  workMode: "office" | "field" | "both" | "home";
  vacancies: number;
  description: string;
  state: string;
  stateName: string;
  city: string;
  cityName: string;
  salaryType: "fixed" | "range";
  salaryPeriod?: "per-month" | "per-year";
  fixedSalary: number | null;
  minimumSalary: number | null;
  maximumSalary: number | null;
  perks: string[];
  education: string[];
  experience: string;
  publishedAt: string | null;
  applyWhatsAppNumber: string | null;
  createdAt: string;
  /** True when the logged-in job seeker already applied to this job. */
  isApplied?: boolean;
  /** Unique authenticated job-seeker views (denormalized Job.views). */
  views?: number;
};

export type PublicJobDetail = PublicJobListItem & {
  address: string;
  landmark: string;
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
  contactPersonName: string | null;
  /** Requested site language, when one was sent. */
  language?: string | null;
  /** Canonical employer/Operations source language. */
  sourceLanguage?: "en" | "hi" | "te" | "ta" | "kn" | "ml";
  /** Language of the canonical source fields. */
  contentLanguage?: string | null;
  /** ready when this response is in the requested language. */
  translationStatus?: "ready" | "pending" | "fallback" | "failed";
  /** False while the original text is shown because translation is not ready. */
  isTranslated?: boolean;
};

export type PublicJobCityFacet = {
  city: string;
  cityName: string;
  count: number;
};

export type PublicJobsResponse = {
  jobs: PublicJobListItem[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  facets?: {
    cities: PublicJobCityFacet[];
  };
};

export type FetchPublicJobsParams = {
  search?: string;
  page?: number;
  limit?: number;
  city?: string;
  state?: string;
  jobType?: string;
  experience?: string;
  gender?: string;
  workMode?: string;
  minSalary?: number;
  maxSalary?: number;
  sort?: PublicJobSort;
  language?: string;
};

/** Only Active jobs are returned by the API. */
export async function fetchPublicActiveJobs(
  params: FetchPublicJobsParams = {},
  options?: { signal?: AbortSignal },
) {
  try {
    const response = await apiClient.get<ApiSuccess<PublicJobsResponse>>(
      "/jobs/public",
      { params, signal: options?.signal },
    );
    return response.data.data;
  } catch (error) {
    throw normalizeAbortedRequestError(error, options?.signal);
  }
}

/** Only Active jobs are returned. Non-active public IDs yield 404. */
export async function fetchPublicActiveJobByPublicId(
  publicJobId: string,
  options?: { signal?: AbortSignal; language?: string },
) {
  try {
    const response = await apiClient.get<ApiSuccess<{ job: PublicJobDetail }>>(
      `/jobs/public/${encodeURIComponent(publicJobId)}`,
      {
        signal: options?.signal,
        params: options?.language ? { language: options.language } : undefined,
      },
    );
    return response.data.data;
  } catch (error) {
    throw normalizeAbortedRequestError(error, options?.signal);
  }
}

/** Poll while a background translation is genuinely in progress. HTML jobs can take >40s. */
export const PUBLIC_JOB_PENDING_REFETCH_LIMIT = 16;
export const PUBLIC_JOB_PENDING_REFETCH_MS = 8_000;
/** After an honest failed response, retry a few times so recovery does not need a 10-minute wait. */
export const PUBLIC_JOB_FAILED_REFETCH_LIMIT = 5;
export const PUBLIC_JOB_FAILED_REFETCH_MS = 30_000;

export function publicJobDetailRefetchInterval(
  translationStatus: PublicJobDetail["translationStatus"],
  dataUpdateCount: number,
): number | false {
  if (translationStatus === "pending") {
    return dataUpdateCount >= PUBLIC_JOB_PENDING_REFETCH_LIMIT
      ? false
      : PUBLIC_JOB_PENDING_REFETCH_MS;
  }
  if (translationStatus === "failed") {
    return dataUpdateCount >= PUBLIC_JOB_FAILED_REFETCH_LIMIT
      ? false
      : PUBLIC_JOB_FAILED_REFETCH_MS;
  }
  return false;
}

/** Related active jobs ranked for the given public job. Excludes the source job. */
export async function fetchSimilarPublicJobs(
  publicJobId: string,
  params: { limit?: number; language?: string } = {},
  options?: { signal?: AbortSignal },
) {
  try {
    const response = await apiClient.get<
      ApiSuccess<{ jobs: PublicJobListItem[] }>
    >(`/jobs/public/${encodeURIComponent(publicJobId)}/similar`, {
      params,
      signal: options?.signal,
    });
    return response.data.data;
  } catch (error) {
    throw normalizeAbortedRequestError(error, options?.signal);
  }
}
