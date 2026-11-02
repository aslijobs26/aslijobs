import { JobModel } from "../../jobs/job.model.js";
import { JobViewModel } from "../../jobs/job-view.model.js";
import { ApplicationModel } from "../../applications/application.model.js";
import { resolveIndiaStateLabel } from "../employers/india-state-normalize.js";
import { getPlacementsAnalytics } from "../placements/operations-placements-analytics.js";
import { getOperationsCandidatesAnalytics } from "../candidates/operations-candidates-analytics.js";
import { loadJobsAnalyticsCharts } from "../jobs/operations-jobs-analytics.js";
import type { OperationsJobsKpis } from "../jobs/operations-jobs.types.js";
import type { OperationsResolvedAccess } from "../rbac/operations-access.types.js";
import { recordOperationsAuditEvent } from "../rbac/operations-audit.service.js";
import { aggregateWebsiteTraffic } from "../../analytics/analytics-event.service.js";
import {
  classifyLevel,
  compareMetric,
  consecutiveConversionPercent,
  marketStatusForLevels,
  percentOf,
  resolveAnalyticsDateRange,
  toIsoDateOnly,
} from "./operations-analytics-domain.js";
import { buildCalendarForecast } from "./operations-analytics-forecast.js";
import { aggregateHiringPeriod } from "./operations-analytics-aggregate.js";
import { buildP1Analytics } from "./operations-analytics-p1.js";
import { resolveAnalyticsScope } from "./operations-analytics-scope.js";
import { ANALYTICS_KPI_DEFINITIONS } from "./operations-analytics-kpi.js";
import { previousWebsiteCounts } from "./operations-analytics-metrics.js";
import { buildAnalyticsExport } from "./operations-analytics-export.js";
import { exportAnalyticsDrilldownCsv, loadAnalyticsDrilldown } from "./operations-analytics-drilldown.js";
import type {
  OperationsAnalyticsDrilldownQuery,
  OperationsAnalyticsExportQuery,
  OperationsAnalyticsOverviewQuery,
} from "./operations-analytics.validation.js";
import type {
  AnalyticsDatePreset,
  OperationsAnalyticsForecast,
  OperationsAnalyticsFunnelStage,
  OperationsAnalyticsKeyInsight,
  OperationsAnalyticsKpiCard,
  OperationsAnalyticsMarketRow,
  OperationsAnalyticsOverview,
  OperationsAnalyticsPlacementMetric,
  OperationsAnalyticsTopLocation,
  OperationsAnalyticsTrendPoint,
} from "./operations-analytics.types.js";

function mapToPlacementsPreset(preset: AnalyticsDatePreset): {
  preset: "all" | "last_30_days" | "last_90_days" | "this_year" | "custom";
  dateFrom: string;
  dateTo: string;
} {
  if (
    preset === "last_6_months" ||
    preset === "last_12_months" ||
    preset === "today" ||
    preset === "yesterday" ||
    preset === "last_7_days" ||
    preset === "this_month" ||
    preset === "last_month" ||
    preset === "this_quarter" ||
    preset === "custom"
  ) {
    return { preset: "custom", dateFrom: "", dateTo: "" };
  }
  if (preset === "last_30_days") {
    return { preset: "last_30_days", dateFrom: "", dateTo: "" };
  }
  if (preset === "last_90_days") {
    return { preset: "last_90_days", dateFrom: "", dateTo: "" };
  }
  if (preset === "this_year") {
    return { preset: "this_year", dateFrom: "", dateTo: "" };
  }
  return { preset: "all", dateFrom: "", dateTo: "" };
}

function mapToJobsPreset(preset: AnalyticsDatePreset): {
  preset: "all" | "last_30_days" | "last_3_months" | "custom";
  dateFrom: string;
  dateTo: string;
} {
  if (
    preset === "last_6_months" ||
    preset === "last_12_months" ||
    preset === "this_year" ||
    preset === "today" ||
    preset === "yesterday" ||
    preset === "last_7_days" ||
    preset === "this_month" ||
    preset === "last_month" ||
    preset === "this_quarter" ||
    preset === "custom"
  ) {
    return { preset: "custom", dateFrom: "", dateTo: "" };
  }
  if (preset === "last_30_days") {
    return { preset: "last_30_days", dateFrom: "", dateTo: "" };
  }
  if (preset === "last_90_days") {
    return { preset: "last_3_months", dateFrom: "", dateTo: "" };
  }
  return { preset: "all", dateFrom: "", dateTo: "" };
}

function mapToCandidatesPreset(preset: AnalyticsDatePreset): {
  preset: "all" | "last_30_days" | "last_3_months" | "custom";
  dateFrom: string;
  dateTo: string;
} {
  if (
    preset === "last_6_months" ||
    preset === "last_12_months" ||
    preset === "this_year" ||
    preset === "today" ||
    preset === "yesterday" ||
    preset === "last_7_days" ||
    preset === "this_month" ||
    preset === "last_month" ||
    preset === "this_quarter" ||
    preset === "custom"
  ) {
    return { preset: "custom", dateFrom: "", dateTo: "" };
  }
  if (preset === "last_30_days") {
    return { preset: "last_30_days", dateFrom: "", dateTo: "" };
  }
  if (preset === "last_90_days") {
    return { preset: "last_3_months", dateFrom: "", dateTo: "" };
  }
  return { preset: "all", dateFrom: "", dateTo: "" };
}

function isUnspecifiedLabel(value: string | null | undefined): boolean {
  const trimmed = (value ?? "").trim();
  if (!trimmed) return true;
  return /^unspecified$/i.test(trimmed);
}

function buildKeyInsights(input: {
  placementsInsights: Array<{ id: string; tone?: string; text?: string; label?: string }>;
  jobsInsightText: string | null;
  candidatesTrendPercent: number | null;
  avgTimeTrend: number | null;
  topShortageCategory: string | null;
}): OperationsAnalyticsKeyInsight[] {
  const insights: OperationsAnalyticsKeyInsight[] = [];
  const titles: Record<OperationsAnalyticsKeyInsight["tone"], string> = {
    growth: "Growth Opportunity",
    concern: "Conversion Concern",
    expansion: "Expansion Opportunity",
    gap: "Talent Gap",
    positive: "Positive Trend",
  };
  const ctas: Record<OperationsAnalyticsKeyInsight["tone"], string> = {
    growth: "Explore details →",
    concern: "Investigate →",
    expansion: "Explore market →",
    gap: "View supply & demand →",
    positive: "View trends →",
  };
  const hrefs: Record<OperationsAnalyticsKeyInsight["tone"], string> = {
    growth: "/operations/jobs",
    concern: "/operations/placements",
    expansion: "/operations/candidates",
    gap: "/operations/analytics?tab=supply-demand",
    positive: "/operations/analytics?tab=trends",
  };

  for (const item of input.placementsInsights.slice(0, 5)) {
    const tone =
      item.tone === "negative"
        ? "concern"
        : item.tone === "warning"
          ? "gap"
          : item.tone === "positive"
            ? "positive"
            : "growth";
    const description = (item.text ?? item.label ?? "").trim();
    if (!description || /unspecified/i.test(description)) continue;
    insights.push({
      id: item.id || `placement-${insights.length}`,
      tone,
      title: titles[tone],
      description,
      ctaLabel: ctas[tone],
      href: hrefs[tone],
    });
  }

  if (
    input.jobsInsightText &&
    !/unspecified/i.test(input.jobsInsightText) &&
    insights.length < 5
  ) {
    insights.push({
      id: "jobs-insight",
      tone: "growth",
      title: titles.growth,
      description: input.jobsInsightText,
      ctaLabel: ctas.growth,
      href: hrefs.growth,
    });
  }

  if (
    input.candidatesTrendPercent != null &&
    input.candidatesTrendPercent > 10 &&
    insights.length < 5
  ) {
    insights.push({
      id: "candidates-growth",
      tone: "expansion",
      title: titles.expansion,
      description: `Jobseeker registrations grew ${Math.round(input.candidatesTrendPercent)}% versus the previous period.`,
      ctaLabel: ctas.expansion,
      href: hrefs.expansion,
    });
  }

  if (
    input.topShortageCategory &&
    !isUnspecifiedLabel(input.topShortageCategory) &&
    insights.length < 5
  ) {
    insights.push({
      id: "talent-gap",
      tone: "gap",
      title: titles.gap,
      description: `${input.topShortageCategory} demand is outpacing available talent in the selected period.`,
      ctaLabel: ctas.gap,
      href: hrefs.gap,
    });
  }

  if (
    input.avgTimeTrend != null &&
    input.avgTimeTrend < 0 &&
    insights.length < 5
  ) {
    insights.push({
      id: "time-to-placement",
      tone: "positive",
      title: titles.positive,
      description: `Average time to placement reduced by ${Math.abs(Math.round(input.avgTimeTrend))}% compared to the previous period.`,
      ctaLabel: ctas.positive,
      href: hrefs.positive,
    });
  }

  return insights.slice(0, 5);
}

function buildFunnel(
  stages: Array<{ key: string; label: string; count: number; definition?: string }>,
): OperationsAnalyticsFunnelStage[] {
  const max = Math.max(...stages.map((s) => s.count), 1);
  return stages.map((stage, index) => {
    const previous = index === 0 ? stage.count : stages[index - 1].count;
    return {
      key: stage.key,
      label: stage.label,
      count: stage.count,
      definition: stage.definition,
      conversionPercent:
        index === 0 ? 100 : consecutiveConversionPercent(stage.count, previous),
      widthPercent: Math.max(8, Math.round((stage.count / max) * 100)),
    };
  });
}

function mergeTrendSeries(input: {
  placements: Array<{ date: string; label: string; placements: number; joined: number }>;
  registrations: Array<{ date: string; label: string; count: number }>;
  jobsCreated: Array<{ date: string; label: string; count: number }>;
}): OperationsAnalyticsTrendPoint[] {
  const byDate = new Map<string, OperationsAnalyticsTrendPoint>();

  for (const point of input.placements) {
    byDate.set(point.date, {
      date: point.date,
      label: point.label,
      placements: point.placements,
      joined: point.joined,
      registrations: 0,
      jobsCreated: 0,
    });
  }

  for (const point of input.registrations) {
    const existing = byDate.get(point.date);
    if (existing) {
      existing.registrations = point.count;
      if (!existing.label) existing.label = point.label;
    } else {
      byDate.set(point.date, {
        date: point.date,
        label: point.label,
        placements: 0,
        joined: 0,
        registrations: point.count,
        jobsCreated: 0,
      });
    }
  }

  for (const point of input.jobsCreated) {
    const existing = byDate.get(point.date);
    if (existing) {
      existing.jobsCreated = point.count;
      if (!existing.label) existing.label = point.label;
    } else {
      byDate.set(point.date, {
        date: point.date,
        label: point.label,
        placements: 0,
        joined: 0,
        registrations: 0,
        jobsCreated: point.count,
      });
    }
  }

  return Array.from(byDate.values()).sort((a, b) =>
    a.date.localeCompare(b.date),
  );
}

const WEBSITE_JOB_PATH_CAP = 2000;

/**
 * Page views do not store location. When a job filter is active, visits are
 * limited to `/jobs/:jobId` pages for jobs that match that filter.
 */
async function websiteJobPaths(query: OperationsAnalyticsOverviewQuery): Promise<{
  extra: Record<string, unknown>;
  note?: string;
}> {
  const scope = await resolveAnalyticsScope(query);
  const jobScoped = scope.needsJobJoin || scope.employerIds != null;
  if (!jobScoped) {
    const notes = [
      scope.outOfScopeCountry
        ? "Website visits are not stored with a country. Visit totals follow the date range only."
        : "",
      query.applicationStatus
        ? "Application status is not stored on page views. Visit totals follow the date range only."
        : "",
    ].filter(Boolean);
    return { extra: {}, note: notes.join(" ") || undefined };
  }
  if (scope.outOfScopeCountry || (scope.employerIds && scope.employerIds.length === 0)) {
    return {
      extra: { path: { $in: [] } },
      note: "No jobs match these filters, so there are no job page views in this range.",
    };
  }
  const rows = await JobModel.find(scope.jobMatch)
    .select("jobId")
    .limit(WEBSITE_JOB_PATH_CAP + 1)
    .lean();
  const paths = rows
    .slice(0, WEBSITE_JOB_PATH_CAP)
    .map((row) => `/jobs/${String(row.jobId ?? "").trim()}`)
    .filter((path) => path.length > "/jobs/".length);
  const truncated = rows.length > WEBSITE_JOB_PATH_CAP;
  const statusNote = query.applicationStatus
    ? " Application status is not stored on page views."
    : "";
  return {
    extra: { path: { $in: paths } },
    note: `Visit totals are page views of jobs matching the location, category, employer, and job type filters.${truncated ? " The first 2,000 matching jobs are included." : ""}${statusNote}`,
  };
}

async function sumJobViews(from: Date, to: Date): Promise<number> {
  // Period job views from the visitor ledger (not jobs.createdAt × jobs.views).
  return JobViewModel.countDocuments({
    lastViewedAt: { $gte: from, $lte: to },
  });
}

function buildKpiCard(input: {
  id: string;
  label: string;
  value: number;
  previousValue: number | null;
  filterNote?: string;
}): OperationsAnalyticsKpiCard {
  const comparison = compareMetric(input.value, input.previousValue);
  return {
    id: input.id,
    label: input.label,
    value: input.value,
    previousValue: comparison.previousValue,
    absoluteDifference: comparison.absoluteDifference,
    changePercent: comparison.changePercent,
    trendDirection: comparison.trendDirection,
    changeLabel: comparison.changeLabel,
    format: "number",
    filterNote: input.filterNote,
    definition: ANALYTICS_KPI_DEFINITIONS[input.id],
  };
}

export async function getOperationsAnalyticsOverview(
  query: OperationsAnalyticsOverviewQuery,
  _access: OperationsResolvedAccess,
): Promise<OperationsAnalyticsOverview> {
  const range = resolveAnalyticsDateRange({
    preset: query.preset,
    dateFrom: query.dateFrom,
    dateTo: query.dateTo,
  });
  const from = new Date(range.from);
  const to = new Date(range.to);
  const dateFromIso = toIsoDateOnly(range.from);
  const dateToIso = toIsoDateOnly(range.to);
  const state = query.state?.trim() ?? "";

  const placementsMapped = mapToPlacementsPreset(query.preset);
  const jobsMapped = mapToJobsPreset(query.preset);
  const candidatesMapped = mapToCandidatesPreset(query.preset);

  const placementsQuery = {
    preset: placementsMapped.preset,
    dateFrom:
      placementsMapped.preset === "custom" ? dateFromIso : placementsMapped.dateFrom,
    dateTo:
      placementsMapped.preset === "custom" ? dateToIso : placementsMapped.dateTo,
  };

  const jobsQuery = {
    preset: jobsMapped.preset,
    dateFrom: jobsMapped.preset === "custom" ? dateFromIso : jobsMapped.dateFrom,
    dateTo: jobsMapped.preset === "custom" ? dateToIso : jobsMapped.dateTo,
  };

  const candidatesQuery = {
    preset: candidatesMapped.preset,
    dateFrom:
      candidatesMapped.preset === "custom"
        ? dateFromIso
        : candidatesMapped.dateFrom,
    dateTo:
      candidatesMapped.preset === "custom" ? dateToIso : candidatesMapped.dateTo,
  };

  const emptyJobsKpis: OperationsJobsKpis = {
    totalJobs: 0,
    activeJobs: 0,
    pendingApprovalJobs: 0,
    pendingPaymentJobs: 0,
    liveJobs: 0,
    expiredJobs: 0,
    draftJobs: 0,
    atRiskJobs: 0,
    filledClosedJobs: 0,
  };

  const trafficScope = await websiteJobPaths(query);
  const [
    placements,
    candidates,
    jobsCharts,
    jobViews,
    websiteTrafficRaw,
  ] = await Promise.all([
    getPlacementsAnalytics(placementsQuery),
    getOperationsCandidatesAnalytics(candidatesQuery),
    loadJobsAnalyticsCharts(jobsQuery, emptyJobsKpis).catch(() => null),
    sumJobViews(from, to),
    aggregateWebsiteTraffic(from, to, trafficScope.extra).catch(() => null),
  ]);

  const websiteTraffic = websiteTrafficRaw ?? {
    pageViews: 0,
    uniqueVisitors: 0,
    sessions: 0,
    newVisitors: 0,
    returningVisitors: 0,
    topPages: [],
    byDevice: [],
    bySourceHost: [],
    daily: [],
  };

  const funnelCounts = {
    job_views: jobViews,
    applications:
      placements.funnel.find((s) => s.key === "applications")?.count ?? 0,
    shortlisted:
      placements.funnel.find((s) => s.key === "shortlisted")?.count ?? 0,
    interviews:
      placements.funnel.find((s) => s.key === "interviews")?.count ?? 0,
    offers: placements.funnel.find((s) => s.key === "offers")?.count ?? 0,
    joined: placements.funnel.find((s) => s.key === "joined")?.count ?? 0,
  };

  const citySource =
    (candidates.byCity ?? []).filter((row) => !isUnspecifiedLabel(row.label))
      .length > 0
      ? (candidates.byCity ?? []).filter((row) => !isUnspecifiedLabel(row.label))
      : placements.byLocation.cities.filter(
          (row) => !isUnspecifiedLabel(row.label),
        );

  const cityMax = Math.max(...citySource.map((row) => row.count), 1);
  const topLocations: OperationsAnalyticsTopLocation[] = citySource
    .slice(0, 8)
    .map((row, index) => {
      const ratio = row.count / cityMax;
      const opportunity =
        ratio >= 0.6 ? "high" : ratio >= 0.3 ? "medium" : "low";
      return {
        rank: index + 1,
        name: row.label,
        description: `${row.count.toLocaleString("en-IN")} recorded in this period`,
        opportunity,
      };
    });

  const interviews = funnelCounts.interviews;
  const offers = funnelCounts.offers;
  const interviewToOffer =
    interviews > 0 ? Math.round((offers / interviews) * 100) : null;

  const topCategory =
    placements.byCategory.find((row) => !isUnspecifiedLabel(row.label)) ?? null;
  const topCategoryShare =
    topCategory && placements.kpis.totalPlacements > 0
      ? percentOf(topCategory.count, placements.kpis.totalPlacements)
      : null;

  // Employer repeat hiring: share of employers with 2+ placements in period.
  const employerRepeatRate = await computeEmployerRepeatRate(from, to);

  const placementMetrics: OperationsAnalyticsPlacementMetric[] = [
    {
      id: "avg-time",
      value:
        placements.kpis.avgTimeToJoinDays != null
          ? `${Math.round(placements.kpis.avgTimeToJoinDays)} days`
          : "—",
      label: "Average time to placement",
      trendPercent: placements.kpis.avgTimeToJoinTrendPercent,
      trendDirection:
        placements.kpis.avgTimeToJoinTrendPercent == null
          ? null
          : placements.kpis.avgTimeToJoinTrendPercent < 0
            ? "down"
            : placements.kpis.avgTimeToJoinTrendPercent > 0
              ? "up"
              : "flat",
    },
    {
      id: "interview-offer",
      value: interviewToOffer != null ? `${interviewToOffer}%` : "—",
      label: "Interview to offer rate",
      trendPercent: null,
      trendDirection: null,
    },
    {
      id: "employer-repeat",
      value:
        employerRepeatRate != null ? `${Math.round(employerRepeatRate)}%` : "—",
      label: "Employer repeat hiring rate",
      trendPercent: null,
      trendDirection: null,
    },
    {
      id: "top-category",
      value: topCategory?.label ?? "—",
      label: "Top Performing Category",
      trendPercent: null,
      trendDirection: null,
      secondary:
        topCategoryShare != null
          ? `${Math.round(topCategoryShare)}% of total placements`
          : undefined,
    },
  ];

  const supplyStates = candidates.byLocation.filter(
    (row) => !isUnspecifiedLabel(row.label),
  );
  const demandStates = (jobsCharts?.jobsByLocation.states ?? []).filter(
    (row) => !isUnspecifiedLabel(row.label),
  );
  const placementStates = placements.byLocation.states.filter(
    (row) => !isUnspecifiedLabel(row.label),
  );

  const stateNames = new Set<string>();
  for (const row of supplyStates.slice(0, 8)) stateNames.add(row.label);
  for (const row of demandStates.slice(0, 8)) stateNames.add(row.label);
  for (const row of placementStates.slice(0, 8)) stateNames.add(row.label);
  if (state) {
    const label = resolveIndiaStateLabel(state) ?? state;
    stateNames.clear();
    stateNames.add(label);
  }

  const supplyMax = Math.max(...supplyStates.map((r) => r.count), 1);
  const demandMax = Math.max(...demandStates.map((r) => r.count), 1);
  const placementMax = Math.max(...placementStates.map((r) => r.count), 1);

  const marketIntelligence: OperationsAnalyticsMarketRow[] = Array.from(
    stateNames,
  )
    .filter((name) => !isUnspecifiedLabel(name))
    .map((name) => {
      const supply =
        supplyStates.find((r) => r.label === name)?.count ?? 0;
      const demand =
        demandStates.find((r) => r.label === name)?.count ?? 0;
      const placementsCount =
        placementStates.find((r) => r.label === name)?.count ?? 0;
      const talentSupply = classifyLevel(supply, supplyMax * 0.6, supplyMax * 0.3);
      const jobDemand = classifyLevel(demand, demandMax * 0.6, demandMax * 0.3);
      const placementRate = classifyLevel(
        placementsCount,
        placementMax * 0.6,
        placementMax * 0.3,
      );
      const market = marketStatusForLevels(
        talentSupply,
        jobDemand,
        placementRate,
      );
      return {
        state: name,
        talentSupply,
        jobDemand,
        placementRate,
        marketStatus: market.status,
        marketStatusTone: market.tone,
      };
    })
    .sort((a, b) => a.state.localeCompare(b.state))
    .slice(0, 8);

  const trends = mergeTrendSeries({
    placements: placements.trend.map((point) => ({
      date: point.date,
      label: point.label,
      placements: point.placements,
      joined: point.joined,
    })),
    registrations: candidates.registrationTrend.map((point) => ({
      date: point.date,
      label: point.label,
      count: point.newRegistrations,
    })),
    jobsCreated: (jobsCharts?.jobsCreated ?? []).map((point) => ({
      date: point.date,
      label: point.label,
      count: point.count,
    })),
  });

  const previousAllowed = range.comparisonBasis !== "unavailable";
  const [websitePrevious, currentSnapshot, previousSnapshot, p1] = await Promise.all([
    previousAllowed
      ? previousWebsiteCounts(
          new Date(range.previousFrom),
          new Date(range.previousTo),
          trafficScope.extra,
        )
      : Promise.resolve(null),
    aggregateHiringPeriod({ query, from, to }),
    previousAllowed
      ? aggregateHiringPeriod({
          query,
          from: new Date(range.previousFrom),
          to: new Date(range.previousTo),
        })
      : Promise.resolve(null),
    buildP1Analytics({ query, from, to }),
  ]);

  const trafficNote = trafficScope.note;
  const comparedKpis: OperationsAnalyticsKpiCard[] = [
    buildKpiCard({
      id: "unique-visitors",
      label: "Unique Visitors",
      value: websiteTraffic.uniqueVisitors,
      previousValue: websitePrevious?.uniqueVisitors ?? (previousAllowed ? 0 : null),
      filterNote: trafficNote,
    }),
    buildKpiCard({
      id: "page-views",
      label: "Page Views",
      value: websiteTraffic.pageViews,
      previousValue: websitePrevious?.pageViews ?? (previousAllowed ? 0 : null),
      filterNote: trafficNote,
    }),
    buildKpiCard({
      id: "sessions",
      label: "Sessions",
      value: websiteTraffic.sessions,
      previousValue: websitePrevious?.sessions ?? (previousAllowed ? 0 : null),
      filterNote: trafficNote,
    }),
    buildKpiCard({
      id: "job-views",
      label: "Visitor–job pairs",
      value: currentSnapshot.jobViews,
      previousValue: previousSnapshot?.jobViews ?? null,
      filterNote: ANALYTICS_KPI_DEFINITIONS["job-views"]?.limitation,
    }),
    buildKpiCard({
      id: "jobseeker-registrations",
      label: "Jobseeker Registrations",
      value: currentSnapshot.registrations,
      previousValue: previousSnapshot?.registrations ?? null,
    }),
    buildKpiCard({
      id: "employer-registrations",
      label: "Employer Registrations",
      value: currentSnapshot.employerRegistrations,
      previousValue: previousSnapshot?.employerRegistrations ?? null,
    }),
    buildKpiCard({
      id: "verified-employers",
      label: "Verified Employers",
      value: currentSnapshot.verifiedEmployers,
      previousValue: previousSnapshot?.verifiedEmployers ?? null,
    }),
    buildKpiCard({
      id: "applications",
      label: "Job Applications",
      value: currentSnapshot.applications,
      previousValue: previousSnapshot?.applications ?? null,
    }),
    buildKpiCard({
      id: "interviews-scheduled",
      label: "Interviews Scheduled",
      value: currentSnapshot.interviewsScheduled,
      previousValue: previousSnapshot?.interviewsScheduled ?? null,
    }),
    buildKpiCard({
      id: "interviews-completed",
      label: "Interviews Completed",
      value: currentSnapshot.interviewsCompleted,
      previousValue: previousSnapshot?.interviewsCompleted ?? null,
    }),
    buildKpiCard({
      id: "offers",
      label: "Offers",
      value: currentSnapshot.offers,
      previousValue: previousSnapshot?.offers ?? null,
    }),
    buildKpiCard({
      id: "selected",
      label: "Selected",
      value: currentSnapshot.selected,
      previousValue: previousSnapshot?.selected ?? null,
    }),
    buildKpiCard({
      id: "joined",
      label: "Joined",
      value: currentSnapshot.joined,
      previousValue: previousSnapshot?.joined ?? null,
    }),
  ];

  const filteredFunnel = buildFunnel([
    {
      key: "applications",
      label: "Applications",
      count: currentSnapshot.applications,
      definition: "Applications submitted in the period. Each application is counted once.",
    },
    {
      key: "shortlisted",
      label: "Shortlisted",
      count: currentSnapshot.shortlisted,
      definition: "Reached shortlisted in the period. A later rejection stays in this stage.",
    },
    {
      key: "interview_scheduled",
      label: "Interview scheduled",
      count: currentSnapshot.interviewsScheduled,
      definition: "At least one interview_scheduled history event in the period. A reschedule is not a second person.",
    },
    {
      key: "interview_completed",
      label: "Interview completed",
      count: currentSnapshot.interviewsCompleted,
      definition: "An interview_completed history event in the period. Offer or joined status is not used.",
    },
    {
      key: "offers",
      label: "Offers",
      count: currentSnapshot.offers,
      definition: "An offer_sent history event in the period.",
    },
    {
      key: "selected",
      label: "Selected",
      count: currentSnapshot.selected,
      definition: "Selected for the job. This is not a joining event.",
    },
    {
      key: "joined",
      label: "Joined",
      count: currentSnapshot.joined,
      definition: "A joined history event in the period. Selected candidates who have not joined are excluded.",
    },
  ]);
  const filteredSupply = currentSnapshot.supplyDemand;

  const forecastModel = buildForecastModel({
    horizonDays: query.horizonDays ?? 30,
    snapshot: currentSnapshot.daily,
  });
  const selectedByDay = new Map(currentSnapshot.daily.selected.map((point) => [point.date, point.count]));
  const joinedByDay = new Map(currentSnapshot.daily.placements.map((point) => [point.date, point.count]));
  const sumBucket = (source: Map<string, number>, start: string, end: string | undefined) => {
    let total = 0;
    for (const [date, count] of source) {
      if (date >= start && (end == null || date < end)) total += count;
    }
    return total;
  };
  const orderedTrends = [...trends].sort((a, b) => a.date.localeCompare(b.date));
  const historyTrends =
    orderedTrends.length > 0
      ? orderedTrends.map((point, index) => ({
          ...point,
          placements: sumBucket(selectedByDay, point.date, orderedTrends[index + 1]?.date),
          joined: sumBucket(joinedByDay, point.date, orderedTrends[index + 1]?.date),
        }))
      : [...new Set([...selectedByDay.keys(), ...joinedByDay.keys()])].sort().map((date) => ({
          date,
          label: date,
          placements: selectedByDay.get(date) ?? 0,
          joined: joinedByDay.get(date) ?? 0,
          registrations: 0,
          jobsCreated: 0,
        }));
  const accuratePlacementMetrics = placementMetrics.map((metric) => {
    if (metric.id === "interview-offer") {
      const rate = currentSnapshot.interviewMetrics.interviewToOfferRate;
      return { ...metric, value: rate != null ? `${rate}%` : "—" };
    }
    if (metric.id === "employer-repeat") {
      const rate = currentSnapshot.employerHiring.repeatHiringPercent;
      return { ...metric, value: rate != null ? `${Math.round(rate)}%` : "—" };
    }
    return metric;
  });
  const keyInsights = buildKeyInsights({
    placementsInsights: placements.insights,
    jobsInsightText: jobsCharts?.insight
      ? `${jobsCharts.insight.headline} ${jobsCharts.insight.detail}`.trim()
      : null,
    candidatesTrendPercent: candidates.kpis.totalJobseekersTrendPercent,
    avgTimeTrend: placements.kpis.avgTimeToJoinTrendPercent,
    topShortageCategory:
      currentSnapshot.supplyDemand.find((row) => row.status === "shortage")?.category ?? null,
  });
  const forecasts = forecastSentences(forecastModel);
  console.info(
    `[OPS-ANALYTICS] overview preset=${query.preset} state=${state || "all"} durationReady=1`,
  );

  return {
    range: {
      preset: range.preset,
      from: range.from,
      to: range.to,
      previousFrom: range.previousFrom,
      previousTo: range.previousTo,
      label: range.label,
      comparisonBasis: range.comparisonBasis,
      timezone: "Asia/Kolkata",
    },
    state,
    filters: {
      country: query.country,
      state: query.state,
      city: query.city,
      category: query.category,
      employer: query.employer,
      jobType: query.jobType,
      applicationStatus: query.applicationStatus,
      horizonDays: query.horizonDays ?? 30,
    },
    limitations: analyticsLimitations(query, currentSnapshot.outOfScope, currentSnapshot.supplyDemandTruncated),
    generatedAt: new Date().toISOString(),
    platformKpis: comparedKpis,
    websiteTraffic: {
      ...websiteTraffic,
      trackingActive: true,
      scopeNote: trafficScope.note,
    },
    keyInsights,
    funnel: filteredFunnel,
    supplyDemand: filteredSupply,
    supplyDemandTruncated: currentSnapshot.supplyDemandTruncated,
    categoryCoverage: currentSnapshot.categoryCoverage,
    topLocations,
    placementMetrics: accuratePlacementMetrics,
    marketIntelligence,
    interviewMetrics: currentSnapshot.interviewMetrics,
    employerHiring: {
      ...currentSnapshot.employerHiring,
      ...p1.employers,
    },
    categoryBreakdown: p1.categories,
    acquisition: p1.acquisition,
    registrationFunnel: p1.registration,
    jobConversion: p1.jobConversion,
    forecasts,
    forecastModel,
    trends: historyTrends,
    scheduledReports: false,
  };
}

async function computeEmployerRepeatRate(
  from: Date,
  to: Date,
): Promise<number | null> {
  const rows = await ApplicationModel.aggregate<{
    _id: string;
    count: number;
  }>([
    {
      $match: {
        statusHistory: {
          $elemMatch: { status: "joined", at: { $gte: from, $lte: to } },
        },
      },
    },
    {
      $group: {
        _id: "$employerId",
        count: { $sum: 1 },
      },
    },
  ]);
  if (rows.length === 0) return null;
  const repeat = rows.filter((row) => row.count >= 2).length;
  return (repeat / rows.length) * 100;
}

function analyticsLimitations(
  query: OperationsAnalyticsOverviewQuery,
  outOfScope: boolean,
  supplyDemandTruncated: boolean,
): string[] {
  const notes = [
    "Dates are inclusive Asia/Kolkata calendar days. Overall has no previous-period baseline.",
    "Page views do not store location. When a job filter is applied, visit totals count only /jobs/:jobId pages for matching jobs. Home, search, and account pages stay out of that filtered total.",
    "Visitor–job pairs use lastViewedAt. A repeat view updates that time and is not stored as a separate page-view event.",
    "Funnel stages count each application once for a stage reached in the period. A later rejection does not remove the earlier stage.",
    "Selected and Joined are separate history events. A selected candidate is not counted as joined unless a joined event exists.",
    "Completed interviews count only interview_completed history events. Offer, selected, or joined status is not treated as an interview.",
    "Registered jobseekers are not treated as confirmed available candidates.",
    "Interview no-shows are not stored. Scheduled report delivery is not enabled.",
    "Registration start, OTP, profile completion, job search, and job detail views are unavailable for periods before those events were tracked.",
    "Employer hiring, category coverage, job conversion, drilldowns, and job page views use the same state, city, category, employer, and job type filters. Application status is not stored on page views. Acquisition and registration event stages say when a filter is not applied.",
  ];
  if (supplyDemandTruncated) {
    notes.push(
      "The supply and demand chart shows the first 12 categories. KPI totals are not limited to those rows.",
    );
  }
  if (outOfScope) {
    notes.unshift(
      "Country is not stored on hiring records. A non-India country filter returns no hiring metrics instead of an unfiltered India result.",
    );
  }
  if (query.state || query.city || query.category || query.employer || query.jobType) {
    notes.push(
      "Job views are filtered by joining the job record. The view ledger itself has no location.",
    );
  }
  return notes;
}

function buildForecastModel(input: {
  horizonDays: number;
  snapshot: {
    applications: Array<{ date: string; count: number }>;
    registrations: Array<{ date: string; count: number }>;
    jobsCreated: Array<{ date: string; count: number }>;
    placements: Array<{ date: string; count: number }>;
  };
}): NonNullable<OperationsAnalyticsOverview["forecastModel"]> {
  const seriesInput = [
    { id: "job-demand", label: "Jobs created", points: input.snapshot.jobsCreated },
    { id: "applications", label: "Applications", points: input.snapshot.applications },
    { id: "registrations", label: "Jobseeker registrations", points: input.snapshot.registrations },
    { id: "joined", label: "Joined", points: input.snapshot.placements },
  ];
  return {
    horizonDays: input.horizonDays,
    methodology:
      "Holt linear exponential smoothing. Historical dates are the Asia/Kolkata dates of the source records. Missing days inside that span are zero. Projection dates start the day after the last actual date. Estimates are not historical values.",
    generatedAt: new Date().toISOString(),
    series: seriesInput.map((series) => {
      const result = buildCalendarForecast(series.points, input.horizonDays);
      return {
        id: series.id,
        label: series.label,
        ...result,
      };
    }),
  };
}

function forecastSentences(
  model: NonNullable<OperationsAnalyticsOverview["forecastModel"]>,
): OperationsAnalyticsForecast[] {
  return model.series.slice(0, 3).map((series) => ({
    id: series.id,
    tone: series.sufficient ? "growth" : "seasonal",
    text: series.sufficient
      ? `${series.label}: next ${model.horizonDays} days are estimated from ${series.history.length} historical days. First-day estimate ${series.projection[0]?.estimate ?? 0}. ${series.backtest ? `Backtest MAE ${series.backtest.mae}.` : ""} This is an estimate, not a guaranteed outcome.`
      : series.message,
  }));
}

export async function exportOperationsAnalyticsOverview(
  query: OperationsAnalyticsExportQuery,
  access: OperationsResolvedAccess,
): Promise<{ filename: string; contentType: string; body: string | Buffer }> {
  const overview = await getOperationsAnalyticsOverview(query, access);

  await recordOperationsAuditEvent({
    actorUserId: access.userId,
    action: "analytics.export",
    targetType: "analytics",
    targetId: "overview",
    targetLabel: "Analytics overview export",
    metadata: {
      preset: overview.range.preset,
      state: overview.state || "all",
      format: query.format,
      report: query.report,
    },
  });

  return buildAnalyticsExport(overview, query.report, query.format);
}

export async function getOperationsAnalyticsDrilldown(
  query: OperationsAnalyticsDrilldownQuery,
): Promise<Awaited<ReturnType<typeof loadAnalyticsDrilldown>>> {
  const range = resolveAnalyticsDateRange({
    preset: query.preset,
    dateFrom: query.dateFrom,
    dateTo: query.dateTo,
  });
  return loadAnalyticsDrilldown({
    query,
    from: new Date(range.from),
    to: new Date(range.to),
  });
}

export async function exportOperationsAnalyticsDrilldown(
  query: OperationsAnalyticsDrilldownQuery,
  access: OperationsResolvedAccess,
) {
  const range = resolveAnalyticsDateRange({
    preset: query.preset,
    dateFrom: query.dateFrom,
    dateTo: query.dateTo,
  });
  const file = await exportAnalyticsDrilldownCsv({
    query,
    from: new Date(range.from),
    to: new Date(range.to),
  });
  await recordOperationsAuditEvent({
    actorUserId: access.userId,
    action: "analytics.export",
    targetType: "analytics",
    targetId: "drilldown",
    targetLabel: "Analytics drilldown export",
    metadata: {
      metric: query.metric,
      preset: query.preset,
      format: "csv",
      scope: "filtered",
      exported: file.exported,
      total: file.total,
      truncated: file.truncated,
    },
  });
  return file;
}

export const operationsAnalyticsService = {
  getOverview: getOperationsAnalyticsOverview,
  exportOverview: exportOperationsAnalyticsOverview,
  drilldown: getOperationsAnalyticsDrilldown,
  exportDrilldown: exportOperationsAnalyticsDrilldown,
};
