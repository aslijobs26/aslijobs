import axios, { AxiosHeaders } from "axios";
import { env } from "@/constants/env";
import { getEmployerAccessToken } from "@/utils/employer-auth-storage";
import { getJobSeekerAccessToken } from "@/utils/job-seeker-auth-storage";

export const apiClient = axios.create({
  baseURL: env.apiUrl,
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true,
});

apiClient.interceptors.request.use((config) => {
  const requestUrl = config.url ?? "";
  const isNotificationsRequest = requestUrl.includes("/notifications");
  const pathname =
    typeof window !== "undefined" ? window.location.pathname : "";

  let accessToken: string | null = null;

  if (isNotificationsRequest) {
    accessToken = pathname.startsWith("/employer")
      ? getEmployerAccessToken()
      : getJobSeekerAccessToken() || getEmployerAccessToken();
  } else {
    const isPublicJobsRequest = requestUrl.includes("/jobs/public");
    const isJobSeekerRequest =
      requestUrl.includes("/jobseekers") ||
      requestUrl.includes("/resumes") ||
      requestUrl.includes("/applications/apply") ||
      requestUrl.includes("/applications/me") ||
      isPublicJobsRequest;

    if (isPublicJobsRequest) {
      // Prefer seeker token so public job APIs can attach isApplied.
      accessToken = getJobSeekerAccessToken();
    } else {
      accessToken = isJobSeekerRequest
        ? getJobSeekerAccessToken()
        : getEmployerAccessToken();
    }
  }

  if (accessToken) {
    const headers = AxiosHeaders.from(config.headers ?? {});
    headers.set("Authorization", `Bearer ${accessToken}`);
    config.headers = headers;
  }

  return config;
});
