import { JobModel } from "../../jobs/job.model.js";
import { JobViewModel } from "../../jobs/job-view.model.js";
import { ApplicationModel } from "../../applications/application.model.js";
import { JobSeekerModel } from "../../job-seekers/job-seeker.model.js";
import { EmployerModel } from "../../employers/employer.model.js";
import { resolveIndiaStateLabel } from "../employers/india-state-normalize.js";
import { resolveEmployerIndustryLabel } from "../verifications/operations-verifications-industry.js";
import { getPlacementsAnalytics } from "../placements/operations-placements-analytics.js";
import { getOperationsCandidatesAnalytics } from "../candidates/operations-candidates-analytics.js";
import { loadJobsAnalyticsCharts } from "../jobs/operations-jobs-analytics.js";
import type { OperationsJobsKpis } from "../jobs/operations-jobs.types.js";
import type { OperationsResolvedAccess } from "../rbac/operations-access.types.js";
import { recordOperationsAuditEvent } from "../rbac/operations-audit.service.js";
import { aggregateWebsiteTraffic } from "../../analytics/analytics-event.service.js";
import {
  classifyLevel,
  classifySupplyDemand,
  consecutiveConversionPercent,
  marketStatusForLevels,
  percentChange,
  percentOf,
  resolveAnalyticsDateRange,
  toIsoDateOnly,
} from "./operations-analytics-domain.js";
import type { OperationsAnalyticsOverviewQuery } from "./operations-analytics.validation.js";
import type {
  AnalyticsDatePreset,
  OperationsAnalyticsForecast,
  OperationsAnalyticsFunnelStage,
  OperationsAnalyticsKeyInsight,
  OperationsAnalyticsKpiCard,
  OperationsAnalyticsMarketRow,
  OperationsAnalyticsOverview,
  OperationsAnalyticsPlacementMetric,
  OperationsAnalyticsSupplyDemandRow,
  OperationsAnalyticsTopLocation,
  OperationsAnalyticsTrendPoint,
} from "./operations-analytics.types.js";

const FUNNEL_COLORS_ORDER = [
  "job_views",
  "applications",
  "shortlisted",
  "interviews",
  "offers",
  "joined",
] as const;

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

function buildFunnel(stages: Array<{ key: string; label: string; count: number }>): OperationsAnalyticsFunnelStage[] {
  const max = Math.max(...stages.map((s) => s.count), 1);
  return stages.map((stage, index) => {
    const previous = index === 0 ? stage.count : stages[index - 1].count;
    return {
      key: stage.key,
      label: stage.label,
      count: stage.count,
      conversionPercent:
        index === 0 ? 100 : consecutiveConversionPercent(stage.count, previous),
      widthPercent: Math.max(8, Math.round((stage.count / max) * 100)),
    };
  });
}

function buildForecasts(input: {
  topDemandCategory: string | null;
  topDemandCount: number;
  candidatesTrend: number | null;
  placementsTrendPercent: number | null;
}): OperationsAnalyticsForecast[] {
  const forecasts: OperationsAnalyticsForecast[] = [];

  if (
    input.topDemandCategory &&
    !isUnspecifiedLabel(input.topDemandCategory) &&
    input.topDemandCount > 0
  ) {
    forecasts.push({
      id: "demand-outlook",
      tone: "growth",
      text: `${input.topDemandCategory} currently leads live demand with ${input.topDemandCount.toLocaleString("en-IN")} active job${input.topDemandCount === 1 ? "" : "s"} in the selected period.`,
    });
  }

  if (input.candidatesTrend != null) {
    const direction = input.candidatesTrend >= 0 ? "grew" : "declined";
    forecasts.push({
      id: "registration-outlook",
      tone: "expansion",
      text: `Jobseeker registrations ${direction} ${Math.abs(Math.round(input.candidatesTrend))}% versus the previous period.`,
    });
  }

  if (input.placementsTrendPercent != null) {
    const direction = input.placementsTrendPercent >= 0 ? "increased" : "decreased";
    forecasts.push({
      id: "placement-outlook",
      tone: "seasonal",
      text: `Placements ${direction} ${Math.abs(Math.round(input.placementsTrendPercent))}% versus the previous period.`,
    });
  }

  return forecasts.slice(0, 3);
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
}): OperationsAnalyticsKpiCard {
  const change =
    input.previousValue == null
      ? null
      : percentChange(input.value, input.previousValue);
  return {
    id: input.id,
    label: input.label,
    value: input.value,
    previousValue: input.previousValue,
    changePercent: change,
    trendDirection:
      change == null ? null : change > 0 ? "up" : change < 0 ? "down" : "flat",
    format: "number",
  };
}

async function jobsByIndustryCounts(
  from: Date,
  to: Date,
  state: string,
): Promise<Map<string, number>> {
  const match: Record<string, unknown> = {
    // Live listings only — same definition as Jobs "Live" tab.
    status: "active",
    createdAt: { $gte: from, $lte: to },
  };
  if (state.trim()) {
    const label = resolveIndiaStateLabel(state) ?? state.trim();
    const escaped = label.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    match.$or = [
      { "location.state": new RegExp(escaped, "i") },
      { state: new RegExp(escaped, "i") },
    ];
  }

  const rows = await JobModel.aggregate<{ _id: string; count: number }>([
    { $match: match },
    {
      $project: {
        industryKey: {
          $let: {
            vars: {
              category: {
                $trim: { input: { $ifNull: ["$businessCategory", ""] } },
              },
              industry: {
                $trim: { input: { $ifNull: ["$industry", ""] } },
              },
            },
            in: {
              $cond: [
                { $ne: ["$$category", ""] },
                "$$category",
                "$$industry",
              ],
            },
          },
        },
      },
    },
    { $match: { industryKey: { $ne: "" } } },
    {
      $group: {
        _id: "$industryKey",
        count: { $sum: 1 },
      },
    },
    { $sort: { count: -1 } },
    { $limit: 12 },
  ]);

  const map = new Map<string, number>();
  for (const row of rows) {
    const label = resolveEmployerIndustryLabel(row._id || "Unspecified");
    if (!label || label === "Unspecified") continue;
    map.set(label, (map.get(label) ?? 0) + row.count);
  }
  return map;
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

  const previousFrom = new Date(range.previousFrom);
  const previousTo = new Date(range.previousTo);

  const [
    placements,
    candidates,
    jobsCharts,
    jobViews,
    demandByIndustry,
    websiteTrafficRaw,
    jobseekersCurrent,
    jobseekersPrevious,
    verifiedEmployersCurrent,
  ] = await Promise.all([
    getPlacementsAnalytics(placementsQuery),
    getOperationsCandidatesAnalytics(candidatesQuery),
    loadJobsAnalyticsCharts(jobsQuery, emptyJobsKpis).catch(() => null),
    sumJobViews(from, to),
    jobsByIndustryCounts(from, to, state),
    aggregateWebsiteTraffic(from, to).catch(() => null),
    JobSeekerModel.countDocuments({ createdAt: { $gte: from, $lte: to } }),
    JobSeekerModel.countDocuments({
      createdAt: { $gte: previousFrom, $lte: previousTo },
    }),
    EmployerModel.countDocuments({
      createdAt: { $gte: from, $lte: to },
      verificationStatus: "verified",
    }),
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

  const platformKpis: OperationsAnalyticsKpiCard[] = [
    buildKpiCard({
      id: "unique-visitors",
      label: "Unique Visitors",
      value: websiteTraffic.uniqueVisitors,
      previousValue: null,
    }),
    buildKpiCard({
      id: "page-views",
      label: "Page Views",
      value: websiteTraffic.pageViews,
      previousValue: null,
    }),
    buildKpiCard({
      id: "sessions",
      label: "Sessions",
      value: websiteTraffic.sessions,
      previousValue: null,
    }),
    buildKpiCard({
      id: "jobseeker-registrations",
      label: "Jobseeker Registrations",
      value: jobseekersCurrent,
      previousValue: jobseekersPrevious,
    }),
    buildKpiCard({
      id: "verified-employers",
      label: "Verified Employers",
      value: verifiedEmployersCurrent,
      previousValue: null,
    }),
  ];

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

  const funnel = buildFunnel(
    FUNNEL_COLORS_ORDER.map((key) => ({
      key,
      label:
        key === "job_views"
          ? "Job Views"
          : key === "offers"
            ? "Offers"
            : key.charAt(0).toUpperCase() + key.slice(1),
      count: funnelCounts[key],
    })),
  );

  const supplyMap = new Map<string, number>();
  for (const row of candidates.topJobCategories) {
    const label = row.label?.trim();
    if (!label || /^unspecified$/i.test(label)) continue;
    supplyMap.set(label, row.count);
  }

  // Prefer live-job demand categories as the primary rows so Supply vs Demand
  // reflects active listings, not draft/pending/closed jobs.
  const categoryKeys =
    demandByIndustry.size > 0
      ? Array.from(demandByIndustry.keys())
      : Array.from(supplyMap.keys());

  const supplyDemand: OperationsAnalyticsSupplyDemandRow[] = categoryKeys
    .map((category) => {
      const supply = supplyMap.get(category) ?? 0;
      const demand = demandByIndustry.get(category) ?? 0;
      return {
        category,
        supply,
        demand,
        status: classifySupplyDemand(supply, demand),
      };
    })
    .filter((row) => row.demand > 0 || row.supply > 0)
    .sort((a, b) => b.demand + b.supply - (a.demand + a.supply))
    .slice(0, 5);

  const topShortage =
    supplyDemand.find((row) => row.status === "shortage")?.category ?? null;

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

  const keyInsights = buildKeyInsights({
    placementsInsights: placements.insights,
    jobsInsightText: jobsCharts?.insight
      ? `${jobsCharts.insight.headline} ${jobsCharts.insight.detail}`.trim()
      : null,
    candidatesTrendPercent: candidates.kpis.totalJobseekersTrendPercent,
    avgTimeTrend: placements.kpis.avgTimeToJoinTrendPercent,
    topShortageCategory: topShortage,
  });

  const forecasts = buildForecasts({
    topDemandCategory: supplyDemand[0]?.category ?? null,
    topDemandCount: supplyDemand[0]?.demand ?? 0,
    candidatesTrend: candidates.kpis.totalJobseekersTrendPercent,
    placementsTrendPercent: placements.kpis.totalPlacementsTrendPercent,
  });

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

  return {
    range: {
      preset: range.preset,
      from: range.from,
      to: range.to,
      previousFrom: range.previousFrom,
      previousTo: range.previousTo,
      label: range.label,
    },
    state,
    platformKpis,
    websiteTraffic: {
      ...websiteTraffic,
      // Event ingest + frontend beacons are deployed; zeros mean no traffic yet.
      trackingActive: true,
    },
    keyInsights,
    funnel,
    supplyDemand,
    topLocations,
    placementMetrics,
    marketIntelligence,
    forecasts,
    trends,
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
        status: { $in: ["selected", "joined", "did_not_join"] },
        updatedAt: { $gte: from, $lte: to },
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

export async function exportOperationsAnalyticsOverview(
  query: OperationsAnalyticsOverviewQuery,
  access: OperationsResolvedAccess,
): Promise<{ filename: string; contentType: string; body: string }> {
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
    },
  });

  const lines: string[] = [
    "Section,Metric,Value",
    `Range,Preset,${overview.range.label}`,
    `Range,State,${overview.state || "All India"}`,
    ...overview.platformKpis.map(
      (kpi) => `PlatformKPI,${kpi.label},${kpi.value}`,
    ),
    `WebsiteTraffic,Page views,${overview.websiteTraffic.pageViews}`,
    `WebsiteTraffic,Unique visitors,${overview.websiteTraffic.uniqueVisitors}`,
    `WebsiteTraffic,Sessions,${overview.websiteTraffic.sessions}`,
    `WebsiteTraffic,New visitors,${overview.websiteTraffic.newVisitors}`,
    `WebsiteTraffic,Returning visitors,${overview.websiteTraffic.returningVisitors}`,
    ...overview.funnel.map(
      (stage) =>
        `Funnel,${stage.label},${stage.count} (${stage.conversionPercent}%)`,
    ),
    ...overview.supplyDemand.map(
      (row) =>
        `SupplyDemand,${row.category},"supply=${row.supply};demand=${row.demand};status=${row.status}"`,
    ),
    ...overview.topLocations.map(
      (row) =>
        `TopLocations,${row.rank}. ${row.name},${row.opportunity}`,
    ),
    ...overview.placementMetrics.map(
      (row) => `PlacementIntelligence,${row.label},${row.value}`,
    ),
    ...overview.marketIntelligence.map(
      (row) =>
        `Market,${row.state},"${row.talentSupply}/${row.jobDemand}/${row.placementRate};${row.marketStatus}"`,
    ),
    ...overview.forecasts.map((row) => `Forecast,${row.id},"${row.text.replace(/"/g, '""')}"`),
  ];

  return {
    filename: `asli-os-analytics-${overview.range.preset}.csv`,
    contentType: "text/csv; charset=utf-8",
    body: lines.join("\n"),
  };
}

export const operationsAnalyticsService = {
  getOverview: getOperationsAnalyticsOverview,
  exportOverview: exportOperationsAnalyticsOverview,
};
