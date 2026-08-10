"use client";

import {
  JOB_SEEKER_RESUME_BUNDLE_QUERY_KEY,
  JOB_SEEKER_RESUME_QUERY_KEY,
} from "@/constants/job-seeker-profile";
import {
  JOB_SEEKER_PROFILE_QUERY_KEY,
} from "@/hooks/useJobSeekerProfile";
import {
  deleteJobSeekerProfilePhoto,
  updateJobSeekerProfile,
  uploadJobSeekerProfilePhoto,
} from "@/services/job-seeker-profile.service";
import type {
  JobSeekerPublic,
  UpdateJobSeekerProfileInput,
} from "@/types/job-seeker";
import { showAppToast } from "@/utils/share-job";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { getApiErrorMessage } from "./get-api-error-message";

export function useJobSeekerProfileMutations(options?: {
  successMessage?: string;
}) {
  const queryClient = useQueryClient();
  const successMessage =
    options?.successMessage ?? "Profile updated successfully.";

  const updateMutation = useMutation({
    mutationFn: (input: UpdateJobSeekerProfileInput) =>
      updateJobSeekerProfile(input),
    onSuccess: (jobSeeker: JobSeekerPublic) => {
      // API response is the source of truth for profile cache.
      queryClient.setQueryData(JOB_SEEKER_PROFILE_QUERY_KEY, jobSeeker);
      void queryClient.invalidateQueries({
        queryKey: JOB_SEEKER_RESUME_QUERY_KEY,
      });
      void queryClient.invalidateQueries({
        queryKey: JOB_SEEKER_RESUME_BUNDLE_QUERY_KEY,
      });
      showAppToast(successMessage, "success");
    },
    onError: (error) => {
      showAppToast(
        getApiErrorMessage(error, "Could not update profile. Try again."),
        "error",
      );
    },
  });

  const uploadPhotoMutation = useMutation({
    mutationFn: (file: File) => uploadJobSeekerProfilePhoto(file),
    onSuccess: (jobSeeker: JobSeekerPublic) => {
      queryClient.setQueryData(JOB_SEEKER_PROFILE_QUERY_KEY, jobSeeker);
      showAppToast("Profile photo updated.", "success");
    },
    onError: (error) => {
      showAppToast(
        getApiErrorMessage(error, "Could not upload photo. Try again."),
        "error",
      );
    },
  });

  const deletePhotoMutation = useMutation({
    mutationFn: () => deleteJobSeekerProfilePhoto(),
    onSuccess: (jobSeeker: JobSeekerPublic) => {
      queryClient.setQueryData(JOB_SEEKER_PROFILE_QUERY_KEY, jobSeeker);
      showAppToast("Profile photo removed.", "success");
    },
    onError: (error) => {
      showAppToast(
        getApiErrorMessage(error, "Could not remove photo. Try again."),
        "error",
      );
    },
  });

  const isSaving =
    updateMutation.isPending ||
    uploadPhotoMutation.isPending ||
    deletePhotoMutation.isPending;

  return {
    updateProfile: updateMutation.mutateAsync,
    uploadPhoto: uploadPhotoMutation.mutateAsync,
    deletePhoto: deletePhotoMutation.mutateAsync,
    isSaving,
    updateError: updateMutation.error,
  };
}
