"use client";

import { JobSearchMobileJobDetails } from "@/components/job-search/JobSearchMobileJobDetails";
import { JobDetailsPageLayout } from "@/components/jobs/JobDetailsPageLayout";
import { ROUTES } from "@/constants/routes";
import { fetchPublicActiveJobByPublicId } from "@/services/public-jobs.service";
import {
  fetchSavedJobIds,
  removeSavedJob,
  saveJob,
  savedJobsQueryKeys,
} from "@/services/saved-jobs.service";
import {
  getJobSeekerAccessToken,
  JOB_SEEKER_AUTH_CHANGE_EVENT,
} from "@/utils/job-seeker-auth-storage";
import { buildJobSeekerLoginHref } from "@/utils/safe-return-url";
import { showAppToast } from "@/utils/share-job";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { usePathname, useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState, useSyncExternalStore } from "react";

const JOB_SEARCH_RETURN_KEY = "asli-job-search-return";

type PublicJobDetailPageProps = {
  publicJobId: string;
};

function subscribeToMobileMedia(onStoreChange: () => void) {
  const media = window.matchMedia("(max-width: 767px)");
  media.addEventListener("change", onStoreChange);
  return () => media.removeEventListener("change", onStoreChange);
}

function getMobileSnapshot() {
  return window.matchMedia("(max-width: 767px)").matches;
}

function getServerMobileSnapshot() {
  return false;
}

function readReturnPath(): string {
  if (typeof window === "undefined") {
    return ROUTES.FIND_JOBS;
  }

  try {
    const stored = sessionStorage.getItem(JOB_SEARCH_RETURN_KEY);
    if (stored && stored.startsWith(ROUTES.FIND_JOBS)) {
      return stored;
    }
  } catch {
    // Ignore storage access errors.
  }

  return ROUTES.FIND_JOBS;
}

export function PublicJobDetailPage({ publicJobId }: PublicJobDetailPageProps) {
  const router = useRouter();
  const pathname = usePathname();
  const queryClient = useQueryClient();
  const [seekerAuthEpoch, setSeekerAuthEpoch] = useState(0);
  const isMobile = useSyncExternalStore(
    subscribeToMobileMedia,
    getMobileSnapshot,
    getServerMobileSnapshot,
  );
  const isSeekerAuthenticated = Boolean(getJobSeekerAccessToken()?.trim());

  useEffect(() => {
    const bump = () => setSeekerAuthEpoch((value) => value + 1);
    window.addEventListener(JOB_SEEKER_AUTH_CHANGE_EVENT, bump);
    window.addEventListener("storage", bump);
    return () => {
      window.removeEventListener(JOB_SEEKER_AUTH_CHANGE_EVENT, bump);
      window.removeEventListener("storage", bump);
    };
  }, []);

  const seekerAuthKey = getJobSeekerAccessToken() ? "seeker" : "anon";

  const jobQuery = useQuery({
    queryKey: ["public-job", seekerAuthKey, seekerAuthEpoch, publicJobId],
    queryFn: ({ signal }) =>
      fetchPublicActiveJobByPublicId(publicJobId, { signal }),
    retry: false,
  });

  const savedIdsQuery = useQuery({
    queryKey: savedJobsQueryKeys.ids(),
    queryFn: fetchSavedJobIds,
    enabled: isSeekerAuthenticated,
    staleTime: 30_000,
  });

  const bookmarked = useMemo(
    () => (savedIdsQuery.data ?? []).includes(publicJobId),
    [savedIdsQuery.data, publicJobId],
  );

  const handleBack = useCallback(() => {
    const returnPath = readReturnPath();
    try {
      sessionStorage.removeItem(JOB_SEARCH_RETURN_KEY);
    } catch {
      // Ignore storage access errors.
    }
    router.push(returnPath);
  }, [router]);

  const toggleBookmark = () => {
    if (!getJobSeekerAccessToken()?.trim()) {
      showAppToast("Please login as a Job Seeker to save jobs.", "error", 3200);
      router.push(buildJobSeekerLoginHref(pathname));
      return;
    }

    const previousIds = savedIdsQuery.data ?? [];
    const nextIds = bookmarked
      ? previousIds.filter((id) => id !== publicJobId)
      : [...previousIds, publicJobId];

    queryClient.setQueryData(savedJobsQueryKeys.ids(), nextIds);

    void (async () => {
      try {
        if (bookmarked) {
          await removeSavedJob(publicJobId);
          showAppToast("Removed from saved jobs");
        } else {
          await saveJob(publicJobId);
          showAppToast("Job saved");
        }
        void queryClient.invalidateQueries({ queryKey: savedJobsQueryKeys.all });
      } catch {
        queryClient.setQueryData(savedJobsQueryKeys.ids(), previousIds);
        showAppToast(
          bookmarked
            ? "Couldn’t remove saved job. Please try again."
            : "Couldn’t save job. Please try again.",
          "error",
        );
      }
    })();
  };

  if (isMobile) {
    return (
      <main className="min-h-[100dvh] flex-1 overflow-x-hidden bg-white">
        <JobSearchMobileJobDetails
          job={jobQuery.data?.job}
          isLoading={jobQuery.isLoading}
          isError={jobQuery.isError}
          bookmarked={bookmarked}
          onBack={handleBack}
          onToggleBookmark={toggleBookmark}
          onRetry={() => {
            void jobQuery.refetch();
          }}
        />
      </main>
    );
  }

  return (
    <JobDetailsPageLayout
      job={jobQuery.data?.job}
      isLoading={jobQuery.isLoading}
      isError={jobQuery.isError}
      bookmarked={bookmarked}
      onBack={handleBack}
      onToggleBookmark={toggleBookmark}
      onRetry={() => {
        void jobQuery.refetch();
      }}
    />
  );
}

export { JOB_SEARCH_RETURN_KEY };
