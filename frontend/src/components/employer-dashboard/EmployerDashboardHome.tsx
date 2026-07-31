"use client";

import { DashboardAcademyCard } from "@/components/employer-dashboard-home/DashboardAcademyCard";
import { DashboardJobsOverview } from "@/components/employer-dashboard-home/DashboardJobsOverview";
import { DashboardNotifications } from "@/components/employer-dashboard-home/DashboardNotifications";
import { DashboardProfileCompletion } from "@/components/employer-dashboard-home/DashboardProfileCompletion";
import { DashboardRecentApplications } from "@/components/employer-dashboard-home/DashboardRecentApplications";
import { DashboardRecruitmentFunnel } from "@/components/employer-dashboard-home/DashboardRecruitmentFunnel";
import { DashboardRecruiterPerformance } from "@/components/employer-dashboard-home/DashboardRecruiterPerformance";
import { DashboardStatCards } from "@/components/employer-dashboard-home/DashboardStatCards";
import { DashboardSubscriptionOverview } from "@/components/employer-dashboard-home/DashboardSubscriptionOverview";
import { DashboardSupportCard } from "@/components/employer-dashboard-home/DashboardSupportCard";
import { DashboardWelcomeBanner } from "@/components/employer-dashboard-home/DashboardWelcomeBanner";
import {
  EMPLOYER_DASHBOARD_HOME_QUERY_KEYS,
  type EmployerDashboardFunnelPeriod,
  type EmployerDashboardStatKey,
} from "@/constants/employer-dashboard-home";
import {
  EMPLOYER_JOBS_DELETE_CONFIRM,
  EMPLOYER_JOBS_QUERY_KEYS,
} from "@/constants/employer-jobs";
import { useEmployerProfile } from "@/hooks/useEmployerProfile";
import {
  deleteEmployerJob,
  fetchEmployerJobStats,
  fetchEmployerJobs,
} from "@/services/employer-jobs.service";
import {
  fetchEmployerApplicationStats,
  fetchEmployerApplications,
} from "@/services/employer-applications.service";
import {
  fetchNotifications,
  notificationQueryKeys,
} from "@/services/notifications.service";
import type { EmployerApplicationStats } from "@/types/employer-applications";
import { calculateEmployerProfileCompletion } from "@/utils/employer-profile-completion";
import {
  buildEmployerDashboardFunnelFromStats,
  buildEmployerDashboardMetricValues,
  buildEmployerDashboardSourceSlices,
  calculateEmployerDashboardConversionRate,
  calculateEmployerDashboardGrowth,
  getEmployerDashboardDisplayName,
  getEmployerDashboardMonthRange,
  getEmployerDashboardWeekRanges,
  type EmployerDashboardGrowth,
} from "@/utils/employer-dashboard-home";
import { showAppToast } from "@/utils/share-job";
import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import dynamic from "next/dynamic";
import { useMemo, useState } from "react";

const LazySourcesPerformance = dynamic(
  () =>
    import("@/components/employer-dashboard-home/DashboardSourcesPerformance").then(
      (module) => module.DashboardSourcesPerformance,
    ),
  {
    ssr: false,
    loading: () => (
      <div className="h-[22rem] animate-pulse rounded-xl border border-border-subtle bg-surface" />
    ),
  },
);

function metricFromStats(
  stats: EmployerApplicationStats,
  key: Exclude<EmployerDashboardStatKey, "activeJobs">,
): number {
  switch (key) {
    case "applications":
      return stats.total;
    case "shortlisted":
      return stats.shortlisted;
    case "interviews":
      return stats.interview_scheduled + stats.interview_completed;
    case "hired":
      return stats.selected + stats.joined;
  }
}

/**
 * Week-over-week growth using TWO stats aggregations (+ optional jobs counts).
 * Previously this fired ~14 separate list?limit=1 calls and exhausted the API
 * rate limit, which then surfaced as 429s on unrelated endpoints like /me.
 */
async function fetchGrowthMetrics(): Promise<
  Partial<Record<EmployerDashboardStatKey, EmployerDashboardGrowth>>
> {
  const weeks = getEmployerDashboardWeekRanges();

  const [currentStats, previousStats, jobsCurrent, jobsPrevious] =
    await Promise.all([
      fetchEmployerApplicationStats({
        appliedFrom: weeks.currentFrom,
        appliedTo: weeks.currentTo,
      }),
      fetchEmployerApplicationStats({
        appliedFrom: weeks.previousFrom,
        appliedTo: weeks.previousTo,
      }),
      fetchEmployerJobs({
        postedFrom: weeks.currentFrom.slice(0, 10),
        postedTo: weeks.currentTo.slice(0, 10),
        page: 1,
        limit: 1,
      }),
      fetchEmployerJobs({
        postedFrom: weeks.previousFrom.slice(0, 10),
        postedTo: weeks.previousTo.slice(0, 10),
        page: 1,
        limit: 1,
      }),
    ]);

  return {
    activeJobs: calculateEmployerDashboardGrowth(
      jobsCurrent.pagination.total,
      jobsPrevious.pagination.total,
    ),
    applications: calculateEmployerDashboardGrowth(
      metricFromStats(currentStats, "applications"),
      metricFromStats(previousStats, "applications"),
    ),
    shortlisted: calculateEmployerDashboardGrowth(
      metricFromStats(currentStats, "shortlisted"),
      metricFromStats(previousStats, "shortlisted"),
    ),
    interviews: calculateEmployerDashboardGrowth(
      metricFromStats(currentStats, "interviews"),
      metricFromStats(previousStats, "interviews"),
    ),
    hired: calculateEmployerDashboardGrowth(
      metricFromStats(currentStats, "hired"),
      metricFromStats(previousStats, "hired"),
    ),
  };
}

async function fetchFunnelStages(
  period: EmployerDashboardFunnelPeriod,
): Promise<ReturnType<typeof buildEmployerDashboardFunnelFromStats>> {
  if (period === "all") {
    const stats = await fetchEmployerApplicationStats();
    return buildEmployerDashboardFunnelFromStats(stats);
  }

  const range = getEmployerDashboardMonthRange(period);
  const stats = await fetchEmployerApplicationStats({
    appliedFrom: range.from,
    appliedTo: range.to,
  });
  return buildEmployerDashboardFunnelFromStats(stats);
}

export function EmployerDashboardHome() {
  const queryClient = useQueryClient();
  const [funnelPeriod, setFunnelPeriod] =
    useState<EmployerDashboardFunnelPeriod>("this_month");

  const profileQuery = useEmployerProfile();

  const jobStatsQuery = useQuery({
    queryKey: EMPLOYER_JOBS_QUERY_KEYS.stats(),
    queryFn: fetchEmployerJobStats,
    staleTime: 60_000,
  });

  const applicationStatsQuery = useQuery({
    queryKey: EMPLOYER_DASHBOARD_HOME_QUERY_KEYS.applicationStats(),
    queryFn: () => fetchEmployerApplicationStats(),
    staleTime: 60_000,
  });

  const recentApplicationsQuery = useQuery({
    queryKey: EMPLOYER_DASHBOARD_HOME_QUERY_KEYS.recentApplications(),
    queryFn: () =>
      fetchEmployerApplications({
        page: 1,
        limit: 6,
        sort: "newest",
      }),
    staleTime: 60_000,
  });

  const notificationsQuery = useQuery({
    queryKey: [...notificationQueryKeys.recent("employer"), "dashboard"],
    queryFn: () =>
      fetchNotifications({
        page: 1,
        limit: 4,
        readStatus: "all",
      }),
    staleTime: 30_000,
  });

  const growthQuery = useQuery({
    queryKey: EMPLOYER_DASHBOARD_HOME_QUERY_KEYS.growth(),
    queryFn: fetchGrowthMetrics,
    staleTime: 5 * 60_000,
  });

  const funnelQuery = useQuery({
    queryKey: EMPLOYER_DASHBOARD_HOME_QUERY_KEYS.funnel(funnelPeriod),
    queryFn: () => fetchFunnelStages(funnelPeriod),
    staleTime: 60_000,
  });

  const deleteMutation = useMutation({
    mutationFn: deleteEmployerJob,
    onSuccess: async () => {
      showAppToast("Job deleted.", "success");
      await queryClient.invalidateQueries({
        queryKey: EMPLOYER_JOBS_QUERY_KEYS.all,
      });
    },
    onError: () => {
      showAppToast("Unable to delete job.", "error");
    },
  });

  const profile = profileQuery.data;
  const profileCompletion = profile
    ? calculateEmployerProfileCompletion(profile)
    : null;
  const displayName = profile
    ? getEmployerDashboardDisplayName(profile)
    : "Employer";

  const metricValues = useMemo(
    () =>
      buildEmployerDashboardMetricValues({
        activeJobs: jobStatsQuery.data?.stats.activeJobs ?? 0,
        applicationStats: applicationStatsQuery.data,
      }),
    [applicationStatsQuery.data, jobStatsQuery.data?.stats.activeJobs],
  );

  const recentJobs = jobStatsQuery.data?.recentJobs ?? [];

  const funnelStages =
    funnelQuery.data ??
    (applicationStatsQuery.data
      ? buildEmployerDashboardFunnelFromStats(applicationStatsQuery.data)
      : []);
  const conversionRate = calculateEmployerDashboardConversionRate(funnelStages);

  const sourceSlices = buildEmployerDashboardSourceSlices({
    totalApplications: applicationStatsQuery.data?.total ?? 0,
  });

  const handleDeleteJob = (jobId: string) => {
    if (
      typeof window !== "undefined" &&
      !window.confirm(EMPLOYER_JOBS_DELETE_CONFIRM)
    ) {
      return;
    }
    deleteMutation.mutate(jobId);
  };

  return (
    <div className="flex flex-1 flex-col gap-4 px-4 py-5 sm:px-6 sm:py-6 lg:px-8">
      <div className="grid items-start gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(17rem,20rem)]">
        <div className="min-w-0 space-y-4">
          <DashboardWelcomeBanner
            displayName={displayName}
            isLoading={profileQuery.isLoading}
          />

          <DashboardStatCards
            values={metricValues}
            growth={growthQuery.data ?? {}}
            isLoading={
              jobStatsQuery.isLoading || applicationStatsQuery.isLoading
            }
          />

          <DashboardJobsOverview
            jobs={recentJobs}
            isLoading={jobStatsQuery.isLoading}
            isError={jobStatsQuery.isError}
            isDeleting={deleteMutation.isPending}
            onRetry={() => {
              void jobStatsQuery.refetch();
            }}
            onDelete={handleDeleteJob}
          />

          <div className="grid items-stretch gap-4 xl:grid-cols-2">
            <DashboardRecruitmentFunnel
              stages={funnelStages}
              conversionRate={conversionRate}
              period={funnelPeriod}
              onPeriodChange={setFunnelPeriod}
              isLoading={funnelQuery.isLoading && !funnelQuery.data}
            />
            <DashboardRecruiterPerformance />
          </div>

          <div className="grid items-stretch gap-4 xl:grid-cols-[minmax(0,1.55fr)_minmax(16rem,0.95fr)]">
            <DashboardRecentApplications
              applications={recentApplicationsQuery.data?.applications ?? []}
              isLoading={recentApplicationsQuery.isLoading}
              isError={recentApplicationsQuery.isError}
              onRetry={() => {
                void recentApplicationsQuery.refetch();
              }}
            />
            <LazySourcesPerformance
              slices={sourceSlices}
              total={applicationStatsQuery.data?.total ?? 0}
              isLoading={applicationStatsQuery.isLoading}
            />
          </div>

          <DashboardSubscriptionOverview />
        </div>

        <aside className="min-w-0 space-y-4 xl:sticky xl:top-20 xl:self-start">
          {profileCompletion ? (
            <DashboardProfileCompletion
              percentage={profileCompletion.percentage}
              isComplete={profileCompletion.isComplete}
              isIndividual={profile?.accountType === "individual"}
            />
          ) : (
            <div className="h-28 animate-pulse rounded-xl border border-border-subtle bg-surface" />
          )}

          <DashboardNotifications
            notifications={notificationsQuery.data?.notifications ?? []}
            unreadCount={notificationsQuery.data?.unreadCount ?? 0}
            isLoading={notificationsQuery.isLoading}
          />

          <DashboardAcademyCard />
          <DashboardSupportCard />
        </aside>
      </div>
    </div>
  );
}
