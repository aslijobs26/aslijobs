"use client";

import { JOB_SEEKER_RESUME_QUERY_KEY } from "@/constants/job-seeker-profile";
import { ROUTES } from "@/constants/routes";
import { useJobSeekerProfile } from "@/hooks/useJobSeekerProfile";
import { fetchSeekerApplications } from "@/services/job-seeker-applications.service";
import {
  downloadMyResumePdf,
  fetchMyResume,
  regenerateMyResume,
} from "@/services/job-seeker-resume.service";
import {
  fetchNotifications,
  notificationQueryKeys,
} from "@/services/notifications.service";
import { fetchSavedJobs } from "@/services/saved-jobs.service";
import { cn } from "@/utils/cn";
import {
  buildProfileTags,
  computeProfileCompletion,
  computeProfileStrength,
  formatCurrentLocation,
  formatRelativeUpdatedAt,
  formatWhatsappNumber,
  JOB_SEEKER_PROFILE_TABS,
  JOB_SEEKER_PROFILE_TAB_LABELS,
  parseProfileTab,
  type JobSeekerProfileTab,
} from "@/utils/job-seeker-profile";
import { showAppToast } from "@/utils/share-job";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { BadgeCheck, MapPin, Phone } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useMemo, useState } from "react";
import { getApiErrorMessage } from "./get-api-error-message";
import {
  JobSeekerProfileEditModals,
  type JobSeekerProfileEditModalState,
} from "./JobSeekerProfileEditModals";
import { JobSeekerProfilePhotoAvatar } from "./JobSeekerProfilePhotoAvatar";
import { JobSeekerProfileSidebar } from "./JobSeekerProfileSidebar";
import { JobSeekerProfileTabPanels } from "./JobSeekerProfileTabPanels";
import { ProfileStrengthCircle } from "./ProfileStrengthCircle";
import { useJobSeekerProfileMutations } from "./useJobSeekerProfileMutations";

export function JobSeekerProfileDashboard() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();

  const profileQuery = useJobSeekerProfile();
  const [activeModal, setActiveModal] =
    useState<JobSeekerProfileEditModalState>(null);

  const activeTab = parseProfileTab(searchParams.get("tab"));

  const resumeQuery = useQuery({
    queryKey: JOB_SEEKER_RESUME_QUERY_KEY,
    queryFn: fetchMyResume,
    staleTime: 60_000,
  });

  const applicationsQuery = useQuery({
    queryKey: ["job-seeker", "profile-activity", "applications"],
    queryFn: () => fetchSeekerApplications({ page: 1, limit: 5, sort: "newest" }),
    staleTime: 60_000,
    enabled: activeTab === "activity" && Boolean(profileQuery.data),
  });

  const savedJobsQuery = useQuery({
    queryKey: ["job-seeker", "profile-activity", "saved-jobs"],
    queryFn: () => fetchSavedJobs({ page: 1, limit: 5 }),
    staleTime: 60_000,
    enabled: activeTab === "activity" && Boolean(profileQuery.data),
  });

  const notificationsQuery = useQuery({
    queryKey: [
      ...notificationQueryKeys.recent("job-seeker"),
      "profile-activity",
    ],
    queryFn: () =>
      fetchNotifications({ page: 1, limit: 5, readStatus: "all" }),
    staleTime: 60_000,
    enabled: activeTab === "activity" && Boolean(profileQuery.data),
  });

  const {
    updateProfile,
    uploadPhoto,
    deletePhoto,
    isSaving: isProfileSaving,
  } = useJobSeekerProfileMutations();

  const regenerateMutation = useMutation({
    mutationFn: regenerateMyResume,
    onSuccess: (resume) => {
      queryClient.setQueryData(JOB_SEEKER_RESUME_QUERY_KEY, resume);
      showAppToast("Resume regenerated successfully.", "success");
    },
    onError: (error) => {
      showAppToast(
        getApiErrorMessage(error, "Could not regenerate resume."),
        "error",
      );
    },
  });

  const [isDownloading, setIsDownloading] = useState(false);
  const [isPhotoUploading, setIsPhotoUploading] = useState(false);

  const setTab = useCallback(
    (tab: JobSeekerProfileTab) => {
      const params = new URLSearchParams(searchParams.toString());
      if (tab === "overview") {
        params.delete("tab");
      } else {
        params.set("tab", tab);
      }
      const query = params.toString();
      router.replace(query ? `${pathname}?${query}` : pathname, {
        scroll: false,
      });
    },
    [pathname, router, searchParams],
  );

  const jobSeeker = profileQuery.data;
  const resume = resumeQuery.data;

  const strength = useMemo(
    () =>
      jobSeeker
        ? computeProfileStrength(jobSeeker, resume)
        : { percent: 0, message: "", breakdown: {} as never },
    [jobSeeker, resume],
  );

  const completion = useMemo(
    () =>
      jobSeeker
        ? computeProfileCompletion(jobSeeker, resume)
        : { percent: 0, checklist: [] },
    [jobSeeker, resume],
  );

  const tags = useMemo(
    () => (jobSeeker ? buildProfileTags(jobSeeker) : []),
    [jobSeeker],
  );

  const handleDownloadResume = useCallback(async () => {
    setIsDownloading(true);
    try {
      const { blob, fileName } = await downloadMyResumePdf();
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = fileName;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      URL.revokeObjectURL(url);
      showAppToast("PDF download started.", "success");
    } catch (error) {
      showAppToast(
        getApiErrorMessage(error, "Could not download resume PDF."),
        "error",
      );
    } finally {
      setIsDownloading(false);
    }
  }, []);

  const handleDeleteExperience = useCallback(
    async (index: number) => {
      if (!jobSeeker) {
        return;
      }
      const experiences = [...(jobSeeker.experiences ?? [])];
      experiences.splice(index, 1);
      await updateProfile({
        experiences,
        experienceType: experiences.length > 0 ? "experienced" : "fresher",
      });
    },
    [jobSeeker, updateProfile],
  );

  const handleDeleteEducation = useCallback(async () => {
    await updateProfile({ education: null });
  }, [updateProfile]);

  const handleVisibilityChange = useCallback(
    async (value: NonNullable<typeof jobSeeker>["profileVisibility"]) => {
      if (!value) {
        return;
      }
      await updateProfile({ profileVisibility: value });
    },
    [updateProfile],
  );

  if (profileQuery.isLoading) {
    return (
      <div className="mx-auto w-full max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="animate-pulse space-y-5">
          <div className="h-36 rounded-2xl bg-primary-light/40" />
          <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(17.5rem,20rem)]">
            <div className="h-96 rounded-2xl bg-primary-light/25" />
            <div className="h-80 rounded-2xl bg-primary-light/25" />
          </div>
        </div>
      </div>
    );
  }

  if (profileQuery.isError || !jobSeeker) {
    return (
      <div className="mx-auto w-full max-w-3xl px-4 py-16 text-center sm:px-6">
        <h1 className="text-2xl font-bold text-foreground">Profile</h1>
        <p className="mt-3 text-sm text-muted">
          We couldn&apos;t load your profile. Please try again.
        </p>
        <Link
          href={ROUTES.JOB_SEEKER_DASHBOARD}
          className="mt-6 inline-flex text-sm font-semibold text-primary underline underline-offset-2"
        >
          Back to dashboard
        </Link>
      </div>
    );
  }

  const fullName = jobSeeker.fullName?.trim() || "Job Seeker";
  const locationLabel = formatCurrentLocation(jobSeeker);
  const updatedLabel = formatRelativeUpdatedAt(jobSeeker.updatedAt);

  const phoneLabel = formatWhatsappNumber(jobSeeker.whatsappNumber);

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-5 sm:px-6 sm:py-6 lg:px-8 lg:py-8">
      <header className="overflow-hidden rounded-2xl border border-border-subtle bg-surface shadow-sm">
        <div className="border-b border-border-subtle bg-primary-light/35 px-4 py-4 sm:px-6 sm:py-5">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
            <div className="flex min-w-0 flex-col gap-4 sm:flex-row sm:items-start">
              <JobSeekerProfilePhotoAvatar
                jobSeeker={jobSeeker}
                size="header"
                isUploading={isPhotoUploading}
                onUpload={async (file) => {
                  setIsPhotoUploading(true);
                  try {
                    await uploadPhoto(file);
                  } finally {
                    setIsPhotoUploading(false);
                  }
                }}
                onRemove={async () => {
                  setIsPhotoUploading(true);
                  try {
                    await deletePhoto();
                  } finally {
                    setIsPhotoUploading(false);
                  }
                }}
              />
              <div className="min-w-0 pt-0.5">
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-[1.875rem]">
                    {fullName}
                  </h1>
                  {jobSeeker.isWhatsappVerified ? (
                    <span
                      className="inline-flex items-center gap-1 rounded-md bg-resource-guide-icon-surface px-2 py-0.5 text-[11px] font-semibold text-resource-guide-icon"
                      title="WhatsApp verified"
                    >
                      <BadgeCheck className="size-3.5" aria-hidden="true" />
                      Verified
                    </span>
                  ) : null}
                </div>
                <p className="mt-1 text-sm font-semibold text-foreground">
                  {jobSeeker.jobRole?.trim() || "Job Seeker"}
                </p>
                <ul className="mt-3 flex flex-col gap-1.5 text-sm text-muted sm:flex-row sm:flex-wrap sm:items-center sm:gap-x-4 sm:gap-y-1.5">
                  {locationLabel ? (
                    <li className="inline-flex min-w-0 items-center gap-1.5">
                      <MapPin
                        className="size-3.5 shrink-0 text-primary"
                        aria-hidden="true"
                      />
                      <span className="truncate">{locationLabel}</span>
                    </li>
                  ) : null}
                  {phoneLabel ? (
                    <li className="inline-flex min-w-0 items-center gap-1.5">
                      <Phone
                        className="size-3.5 shrink-0 text-primary"
                        aria-hidden="true"
                      />
                      <span className="truncate">{phoneLabel}</span>
                    </li>
                  ) : null}
                  {updatedLabel ? (
                    <li className="hidden text-xs text-muted lg:inline">
                      Updated {updatedLabel}
                    </li>
                  ) : null}
                </ul>
                {tags.length > 0 ? (
                  <ul className="mt-3.5 flex flex-wrap gap-2">
                    {tags.map((tag) => (
                      <li
                        key={tag}
                        className="rounded-lg border border-border-subtle bg-surface px-2.5 py-1 text-xs font-semibold text-foreground"
                      >
                        {tag}
                      </li>
                    ))}
                  </ul>
                ) : null}
              </div>
            </div>

            <div className="flex w-full shrink-0 items-center gap-3 rounded-xl border border-border-subtle bg-surface p-3.5 shadow-sm sm:w-auto sm:min-w-[14rem]">
              <ProfileStrengthCircle percentage={strength.percent} size={64} />
              <div className="min-w-0">
                <p className="text-sm font-bold text-foreground">
                  Profile {strength.percent}%
                </p>
                <p className="mt-0.5 text-xs leading-snug text-muted">
                  {strength.message}
                </p>
                <button
                  type="button"
                  className="mt-1.5 text-xs font-semibold text-primary underline-offset-2 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
                  onClick={() => setTab("preferences")}
                >
                  Improve profile →
                </button>
              </div>
            </div>
          </div>
          {updatedLabel ? (
            <p className="mt-4 text-xs text-muted lg:hidden">
              Last updated {updatedLabel}
            </p>
          ) : null}
        </div>
      </header>

      <div className="mt-5 grid grid-cols-1 items-start gap-5 lg:mt-6 lg:grid-cols-[minmax(0,1fr)_minmax(17.5rem,20rem)] lg:gap-6">
        <div className="min-w-0 rounded-2xl border border-border-subtle bg-surface p-3 shadow-sm sm:p-4">
          <div
            className="overflow-x-auto scrollbar-hidden"
            role="tablist"
            aria-label="Profile sections"
          >
            <div className="flex min-w-max gap-0.5 border-b border-border-subtle">
              {JOB_SEEKER_PROFILE_TABS.map((tab) => {
                const selected = activeTab === tab;
                return (
                  <button
                    key={tab}
                    type="button"
                    role="tab"
                    id={`profile-tab-${tab}`}
                    aria-selected={selected}
                    aria-controls={`profile-panel-${tab}`}
                    className={cn(
                      "inline-flex min-h-11 shrink-0 items-center border-b-[3px] px-3.5 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 sm:px-4",
                      selected
                        ? "border-primary text-primary"
                        : "border-transparent text-muted hover:text-foreground",
                    )}
                    onClick={() => setTab(tab)}
                  >
                    {JOB_SEEKER_PROFILE_TAB_LABELS[tab]}
                  </button>
                );
              })}
            </div>
          </div>

          <div
            id={`profile-panel-${activeTab}`}
            role="tabpanel"
            aria-labelledby={`profile-tab-${activeTab}`}
            className="mt-4 pb-2 lg:pb-0"
          >
            <JobSeekerProfileTabPanels
              activeTab={activeTab}
              jobSeeker={jobSeeker}
              resume={resume}
              applications={applicationsQuery.data?.applications ?? []}
              savedJobs={savedJobsQuery.data?.jobs ?? []}
              notifications={notificationsQuery.data?.notifications ?? []}
              isApplicationsLoading={applicationsQuery.isLoading}
              isSavedJobsLoading={savedJobsQuery.isLoading}
              isNotificationsLoading={notificationsQuery.isLoading}
              isResumeBusy={
                isDownloading ||
                regenerateMutation.isPending ||
                resumeQuery.isFetching
              }
              onOpenModal={setActiveModal}
              onDeleteExperience={handleDeleteExperience}
              onDeleteEducation={handleDeleteEducation}
              onDownloadResume={handleDownloadResume}
              onRegenerateResume={() => regenerateMutation.mutate()}
            />
          </div>
        </div>

        <div className="min-w-0">
          <JobSeekerProfileSidebar
            jobSeeker={jobSeeker}
            strengthPercent={strength.percent}
            strengthMessage={strength.message}
            checklist={completion.checklist}
            completionPercent={completion.percent}
            onOpenPreferences={() => setActiveModal({ type: "preferences" })}
            onOpenVisibility={() => setActiveModal({ type: "visibility" })}
            onSelectTab={setTab}
            onVisibilityChange={(value) => void handleVisibilityChange(value)}
            isSavingVisibility={isProfileSaving}
          />
        </div>
      </div>

      <JobSeekerProfileEditModals
        jobSeeker={jobSeeker}
        activeModal={activeModal}
        isSaving={isProfileSaving}
        onClose={() => setActiveModal(null)}
        onSave={async (input) => {
          await updateProfile(input);
        }}
      />

    </div>
  );
}
