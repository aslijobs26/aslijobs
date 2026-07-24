"use client";

import { JobSearchMobileJobDetails } from "@/components/job-search/JobSearchMobileJobDetails";
import { JobSearchOverviewPanel } from "@/components/job-search/JobSearchOverviewPanel";
import { ROUTES } from "@/constants/routes";
import { fetchPublicActiveJobByPublicId } from "@/services/public-jobs.service";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useCallback, useState, useSyncExternalStore } from "react";

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
  const [bookmarked, setBookmarked] = useState(false);
  const isMobile = useSyncExternalStore(
    subscribeToMobileMedia,
    getMobileSnapshot,
    getServerMobileSnapshot,
  );

  const jobQuery = useQuery({
    queryKey: ["public-job", publicJobId],
    queryFn: ({ signal }) =>
      fetchPublicActiveJobByPublicId(publicJobId, { signal }),
    retry: false,
  });

  const handleBack = useCallback(() => {
    const returnPath = readReturnPath();
    try {
      sessionStorage.removeItem(JOB_SEARCH_RETURN_KEY);
    } catch {
      // Ignore storage access errors.
    }
    router.push(returnPath);
  }, [router]);

  const toggleBookmark = () => setBookmarked((current) => !current);

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
    <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
      <div className="min-h-[70vh]">
        <JobSearchOverviewPanel
          job={jobQuery.data?.job}
          isLoading={jobQuery.isLoading}
          isError={jobQuery.isError}
          bookmarked={bookmarked}
          showBackButton
          onBack={handleBack}
          onToggleBookmark={toggleBookmark}
          onRetry={() => {
            void jobQuery.refetch();
          }}
        />
      </div>
    </main>
  );
}

export { JOB_SEARCH_RETURN_KEY };
