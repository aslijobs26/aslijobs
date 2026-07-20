import axios from "axios";
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
  const isJobSeekerRequest = requestUrl.includes("/jobseekers");

  const accessToken = isJobSeekerRequest
    ? getJobSeekerAccessToken()
    : getEmployerAccessToken();

  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }

  return config;
});
