import { apiClient } from "@/services/api-client";

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
};

/** Only Active jobs are returned by the API. */
export async function fetchPublicActiveJobs(
  params: FetchPublicJobsParams = {},
  options?: { signal?: AbortSignal },
) {
  const response = await apiClient.get<ApiSuccess<PublicJobsResponse>>(
    "/jobs/public",
    { params, signal: options?.signal },
  );
  return response.data.data;
}

/** Only Active jobs are returned. Non-active public IDs yield 404. */
export async function fetchPublicActiveJobByPublicId(
  publicJobId: string,
  options?: { signal?: AbortSignal },
) {
  const response = await apiClient.get<ApiSuccess<{ job: PublicJobDetail }>>(
    `/jobs/public/${encodeURIComponent(publicJobId)}`,
    { signal: options?.signal },
  );
  return response.data.data;
}
