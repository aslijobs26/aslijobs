import { apiClient } from "@/services/api-client";
import type {
  JobSeekerPublic,
  UpdateJobSeekerProfileInput,
} from "@/types/job-seeker";

type ApiSuccess<T> = {
  success: true;
  message?: string;
  data: T;
};

type ProfileResponse = {
  jobSeeker: JobSeekerPublic;
};

export async function updateJobSeekerProfile(
  input: UpdateJobSeekerProfileInput,
): Promise<JobSeekerPublic> {
  const response = await apiClient.patch<ApiSuccess<ProfileResponse>>(
    "/jobseekers/me",
    input,
  );
  return response.data.data.jobSeeker;
}

export async function uploadJobSeekerProfilePhoto(
  file: File,
): Promise<JobSeekerPublic> {
  const formData = new FormData();
  formData.append("profilePhoto", file);

  const response = await apiClient.post<ApiSuccess<ProfileResponse>>(
    "/jobseekers/me/photo",
    formData,
    {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    },
  );

  return response.data.data.jobSeeker;
}

export async function deleteJobSeekerProfilePhoto(): Promise<JobSeekerPublic> {
  const response = await apiClient.delete<ApiSuccess<ProfileResponse>>(
    "/jobseekers/me/photo",
  );
  return response.data.data.jobSeeker;
}
