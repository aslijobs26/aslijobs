import { apiClient } from "@/services/api-client";

type ApiSuccess<T> = {
  success: true;
  message?: string;
  data: T;
};

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
  fixedSalary: number | null;
  minimumSalary: number | null;
  maximumSalary: number | null;
  perks: string[];
  education: string[];
  experience: string;
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
  publishedAt: string | null;
};

export type PublicJobsResponse = {
  jobs: PublicJobListItem[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
};

export type FetchPublicJobsParams = {
  search?: string;
  page?: number;
  limit?: number;
  city?: string;
  state?: string;
};

/** Only Active jobs are returned by the API. */
export async function fetchPublicActiveJobs(
  params: FetchPublicJobsParams = {},
) {
  const response = await apiClient.get<ApiSuccess<PublicJobsResponse>>(
    "/jobs/public",
    { params },
  );
  return response.data.data;
}

/** Only Active jobs are returned. Non-active public IDs yield 404. */
export async function fetchPublicActiveJobByPublicId(publicJobId: string) {
  const response = await apiClient.get<ApiSuccess<{ job: PublicJobDetail }>>(
    `/jobs/public/${encodeURIComponent(publicJobId)}`,
  );
  return response.data.data;
}
