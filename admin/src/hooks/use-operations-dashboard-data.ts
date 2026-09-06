import { useMemo } from "react";
import { OPERATIONS_DASHBOARD_MOCK } from "../data/operations-dashboard.mock";
import { useOperationsPermissions } from "./use-operations-permissions";
import { useOperationsCandidates } from "./use-operations-candidates";
import { useOperationsEmployers } from "./use-operations-employers";
import { useOperationsJobs } from "./use-operations-jobs";
import { useOperationsTeamMembers } from "./use-operations-team";
import type {
  OperationsDashboardData,
  PlatformPulseMetric,
  TeamWorkloadMember,
  TodaysActivityMetric,
  TrendDirection,
} from "../types/operations-dashboard";

function getInitials(fullName: string) {
  return fullName
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

function trendFromPercent(percent: number | null | undefined): {
  trendPercent: number | null;
  trendDirection: TrendDirection;
} {
  if (percent == null || Number.isNaN(percent)) {
    return { trendPercent: null, trendDirection: "neutral" };
  }
  return {
    trendPercent: percent,
    trendDirection: percent > 0 ? "up" : percent < 0 ? "down" : "neutral",
  };
}

/**
 * Home command-center data.
 * Platform Pulse + Today's Activity use live KPI APIs only (no mock numbers).
 */
export function useOperationsDashboardData(): OperationsDashboardData {
  const { can } = useOperationsPermissions();
  const base = OPERATIONS_DASHBOARD_MOCK;

  const canReadCandidates = can("candidates", "read");
  const canReadEmployers = can("employers", "read");
  const canReadJobs = can("jobs", "read");
  const canReadTeam = can("team", "read");

  const candidatesQuery = useOperationsCandidates(
    {
      page: 1,
      limit: 1,
      tab: "all",
      search: "",
      status: "",
      jobId: "",
      employerId: "",
      location: "",
      experience: "",
      gender: "",
      preferredRole: "",
      profileStatus: "",
      datePreset: "all",
      dateFrom: "",
      dateTo: "",
      dateField: "registered",
      analyticsPreset: "all",
      analyticsFrom: "",
      analyticsTo: "",
    },
    { enabled: canReadCandidates },
  );

  const employersQuery = useOperationsEmployers(
    {
      page: 1,
      limit: 1,
      datePreset: "all",
    },
    { enabled: canReadEmployers },
  );

  const jobsQuery = useOperationsJobs(
    {
      page: 1,
      limit: 1,
      tab: "all",
      search: "",
      status: "",
      paymentStatus: "",
      location: "",
    },
    { enabled: canReadJobs },
  );

  const teamQuery = useOperationsTeamMembers(
    {
      page: 1,
      limit: 5,
      status: "active",
    },
    { enabled: canReadTeam },
  );

  return useMemo(() => {
    const candidateKpis = canReadCandidates
      ? candidatesQuery.data?.kpis
      : undefined;
    const employerKpis = canReadEmployers
      ? employersQuery.data?.kpis
      : undefined;
    const jobKpis = canReadJobs ? jobsQuery.data?.kpis : undefined;

    const platformPulse: PlatformPulseMetric[] = base.platformPulse.map(
      (metric) => {
        const empty: PlatformPulseMetric = {
          ...metric,
          value: null,
          todayChange: null,
          trendPercent: null,
          trendDirection: "neutral",
        };

        if (metric.id === "jobseekers" && candidateKpis) {
          return {
            ...empty,
            value: candidateKpis.totalCandidates,
            todayChange: candidateKpis.newCandidatesToday,
            ...trendFromPercent(candidateKpis.newThisWeekChangePercent),
          };
        }

        if (metric.id === "employers" && employerKpis) {
          return {
            ...empty,
            value: employerKpis.totalEmployers,
            todayChange: employerKpis.newEmployersToday,
            // No week-over-week % in employers KPI API yet.
            trendPercent: null,
            trendDirection: "neutral",
          };
        }

        if (metric.id === "active-jobs" && jobKpis) {
          return {
            ...empty,
            value: jobKpis.activeJobs,
            todayChange: null,
            trendPercent: null,
            trendDirection: "neutral",
          };
        }

        if (metric.id === "applications" && candidateKpis) {
          return {
            ...empty,
            value: candidateKpis.activeApplications,
            todayChange: null,
            trendPercent: null,
            trendDirection: "neutral",
          };
        }

        // Placements: no dedicated Home KPI API yet — keep empty until available.
        return empty;
      },
    );

    const todaysActivity: TodaysActivityMetric[] = base.todaysActivity.map(
      (metric) => {
        const empty: TodaysActivityMetric = { ...metric, value: null };

        if (metric.id === "act-jobseekers" && candidateKpis) {
          return { ...empty, value: candidateKpis.newCandidatesToday };
        }
        if (metric.id === "act-employers" && employerKpis) {
          return { ...empty, value: employerKpis.newEmployersToday };
        }
        if (metric.id === "act-applications" && candidateKpis) {
          return { ...empty, value: candidateKpis.activeApplications };
        }
        // Jobs posted / placements: no "today" counters in current APIs.
        return empty;
      },
    );

    let teamWorkload: TeamWorkloadMember[] = base.teamWorkload;
    if (canReadTeam && teamQuery.data?.members.length) {
      teamWorkload = teamQuery.data.members.slice(0, 5).map((member, index) => {
        const fallback = base.teamWorkload[index];
        const capacity = fallback?.capacity ?? 20;
        const assigned =
          fallback?.assigned ?? Math.min(capacity, 8 + index * 2);
        return {
          id: member.id,
          name: member.fullName,
          role: member.roleName || member.role || "Team member",
          initials: getInitials(member.fullName) || "TM",
          assigned,
          capacity,
        };
      });
    }

    return {
      ...base,
      platformPulse,
      todaysActivity,
      teamWorkload,
    };
  }, [
    base,
    canReadCandidates,
    canReadEmployers,
    canReadJobs,
    canReadTeam,
    candidatesQuery.data,
    employersQuery.data,
    jobsQuery.data,
    teamQuery.data,
  ]);
}
