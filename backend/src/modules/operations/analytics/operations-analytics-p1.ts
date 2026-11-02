import { Types, type PipelineStage } from "mongoose";
import { AnalyticsEventModel } from "../../analytics/analytics-event.model.js";
import { ApplicationModel } from "../../applications/application.model.js";
import { EmployerModel } from "../../employers/employer.model.js";
import { JobModel } from "../../jobs/job.model.js";
import { JobSeekerModel } from "../../job-seekers/job-seeker.model.js";
import { JobViewModel } from "../../jobs/job-view.model.js";
import { canonicalCategory } from "./operations-analytics-taxonomy.js";
import { dimensionLabel, percentOrNull, withStageDropOff } from "./operations-analytics-p1-rules.js";
import { jobJoinStages, resolveAnalyticsScope, type AnalyticsScope } from "./operations-analytics-scope.js";
import type { OperationsAnalyticsOverviewQuery } from "./operations-analytics.validation.js";
import type { OperationsAnalyticsEmployerHiring } from "./operations-analytics.types.js";

const MAX_TIME_MS = 20_000;
const TABLE_LIMIT = 25;

function agg<T>(
  model: { aggregate: (pipeline: PipelineStage[]) => { option: (value: object) => unknown } },
  pipeline: PipelineStage[],
): Promise<T[]> {
  return model.aggregate(pipeline).option({ maxTimeMS: MAX_TIME_MS }) as Promise<T[]>;
}

async function eventExists(eventName: string, to: Date): Promise<boolean> {
  const row = await AnalyticsEventModel.findOne({
    eventName,
    occurredAt: { $lte: to },
  })
    .select("_id")
    .lean();
  return Boolean(row);
}

async function distinctEventVisitors(eventName: string, from: Date, to: Date, audience?: string) {
  const match: Record<string, unknown> = { eventName, occurredAt: { $gte: from, $lte: to } };
  if (audience) match.audience = audience;
  const rows = await agg<{ n: number }>(AnalyticsEventModel, [
    { $match: match },
    { $group: { _id: "$visitorId" } },
    { $count: "n" },
  ]);
  return rows[0]?.n ?? 0;
}

export async function buildP1Analytics(input: {
  query: OperationsAnalyticsOverviewQuery;
  from: Date;
  to: Date;
}) {
  const { from, to } = input;
  const scope = await resolveAnalyticsScope(input.query);
  if (scope.outOfScopeCountry || (scope.employerIds && scope.employerIds.length === 0)) {
    scope.employerMatch._id = { $in: [] };
    scope.jobMatch.employerId = { $in: [] };
    scope.applicationMatch.employerId = { $in: [] };
  }
  const [employers, categories, acquisition, registration, jobConversion] = await Promise.all([
    buildEmployerHiring(from, to, scope),
    buildCategoryCoverage(from, to, input.query.category, scope),
    buildAcquisition(from, to, scope),
    buildRegistrationFunnel(from, to, scope),
    buildJobConversion(from, to, scope),
  ]);
  return { employers, categories, acquisition, registration, jobConversion };
}

async function buildEmployerHiring(from: Date, to: Date, scope: AnalyticsScope): Promise<
  OperationsAnalyticsEmployerHiring & {
    employersWhoSelected: number;
    repeatHiringEmployers: number;
    averageApplicationsPerEmployer: number | null;
    employerToApplicationPercent: number | null;
    employerToJoinPercent: number | null;
    verifiedInPeriod: number;
    rows: Array<{
      employerName: string;
      jobs: number;
      applications: number;
      interviews: number;
      offers: number;
      selected: number;
      joined: number;
      distinctJobs: number;
    }>;
    truncated: boolean;
    note: string;
  }
> {
  const range = { $gte: from, $lte: to };
  const [created, verifiedCreated, verifiedInPeriod, jobEmployers, applicationEmployers, stageEmployers] =
    await Promise.all([
      EmployerModel.countDocuments({ createdAt: range, ...scope.employerMatch }),
      EmployerModel.countDocuments({ createdAt: range, verificationStatus: "verified", ...scope.employerMatch }),
      EmployerModel.countDocuments({ verifiedAt: range, ...scope.employerMatch }),
      agg<{ _id: Types.ObjectId; jobs: number; jobIds: string[] }>(JobModel, [
        { $match: { createdAt: range, ...scope.jobMatch } },
        { $group: { _id: "$employerId", jobs: { $sum: 1 }, jobIds: { $addToSet: { $toString: "$_id" } } } },
      ]),
      agg<{ _id: Types.ObjectId; applications: number; jobIds: string[] }>(ApplicationModel, [
        { $match: { appliedAt: range, ...scope.applicationMatch } },
        ...jobJoinStages(scope),
        { $group: { _id: "$employerId", applications: { $sum: 1 }, jobIds: { $addToSet: { $toString: "$jobId" } } } },
      ]),
      agg<{
        _id: Types.ObjectId;
        interviews: number;
        offers: number;
        selected: number;
        joined: number;
        jobs: string[];
      }>(ApplicationModel, [
        {
          $match: {
            ...scope.applicationMatch,
            statusHistory: {
              $elemMatch: {
                at: range,
                status: { $in: ["interview_scheduled", "offer_sent", "selected", "joined"] },
              },
            },
          },
        },
        ...jobJoinStages(scope),
        {
          $project: {
            employerId: 1,
            jobId: 1,
            events: {
              $filter: {
                input: "$statusHistory",
                as: "event",
                cond: { $and: [{ $gte: ["$$event.at", from] }, { $lte: ["$$event.at", to] }] },
              },
            },
          },
        },
        {
          $group: {
            _id: "$employerId",
            interviews: {
              $sum: {
                $cond: [
                  { $gt: [{ $size: { $filter: { input: "$events", as: "event", cond: { $eq: ["$$event.status", "interview_scheduled"] } } } }, 0] },
                  1,
                  0,
                ],
              },
            },
            offers: {
              $sum: {
                $cond: [
                  { $gt: [{ $size: { $filter: { input: "$events", as: "event", cond: { $eq: ["$$event.status", "offer_sent"] } } } }, 0] },
                  1,
                  0,
                ],
              },
            },
            selected: {
              $sum: {
                $cond: [
                  { $gt: [{ $size: { $filter: { input: "$events", as: "event", cond: { $eq: ["$$event.status", "selected"] } } } }, 0] },
                  1,
                  0,
                ],
              },
            },
            joined: {
              $sum: {
                $cond: [
                  { $gt: [{ $size: { $filter: { input: "$events", as: "event", cond: { $eq: ["$$event.status", "joined"] } } } }, 0] },
                  1,
                  0,
                ],
              },
            },
            jobs: { $addToSet: { $toString: "$jobId" } },
          },
        },
      ]),
    ]);

  const byId = new Map<string, {
    jobs: number;
    applications: number;
    interviews: number;
    offers: number;
    selected: number;
    joined: number;
    distinctJobs: Set<string>;
  }>();
  const ensure = (id: string) => {
    const current = byId.get(id) ?? {
      jobs: 0,
      applications: 0,
      interviews: 0,
      offers: 0,
      selected: 0,
      joined: 0,
      distinctJobs: new Set<string>(),
    };
    byId.set(id, current);
    return current;
  };
  let jobCount = 0;
  for (const row of jobEmployers) {
    if (!row._id) continue;
    const bucket = ensure(String(row._id));
    bucket.jobs += row.jobs;
    jobCount += row.jobs;
  }
  let applicationCount = 0;
  for (const row of applicationEmployers) {
    if (!row._id) continue;
    ensure(String(row._id)).applications += row.applications;
    applicationCount += row.applications;
  }
  for (const row of jobEmployers) {
    if (!row._id) continue;
    const bucket = ensure(String(row._id));
    for (const jobId of row.jobIds ?? []) {
      if (jobId) bucket.distinctJobs.add(jobId);
    }
  }
  for (const row of applicationEmployers) {
    if (!row._id) continue;
    const bucket = ensure(String(row._id));
    for (const jobId of row.jobIds ?? []) {
      if (jobId) bucket.distinctJobs.add(jobId);
    }
  }
  for (const row of stageEmployers) {
    if (!row._id) continue;
    const bucket = ensure(String(row._id));
    bucket.interviews += row.interviews;
    bucket.offers += row.offers;
    bucket.selected += row.selected;
    bucket.joined += row.joined;
    for (const jobId of row.jobs ?? []) {
      if (jobId) bucket.distinctJobs.add(jobId);
    }
  }
  let repeat = 0;
  for (const bucket of byId.values()) {
    if (bucket.distinctJobs.size >= 2) repeat += 1;
  }
  const employersWithJobs = jobEmployers.filter((row) => row._id).length;
  const employersWithApplications = applicationEmployers.filter((row) => row._id).length;
  const employersInterviewing = [...byId.values()].filter((row) => row.interviews > 0).length;
  const employersWithOffers = [...byId.values()].filter((row) => row.offers > 0).length;
  const employersWhoSelected = [...byId.values()].filter((row) => row.selected > 0).length;
  const employersWithJoins = [...byId.values()].filter((row) => row.joined > 0).length;
  const ranked = [...byId.entries()].sort(
    (a, b) => b[1].joined + b[1].applications - (a[1].joined + a[1].applications),
  );
  const page = ranked.slice(0, TABLE_LIMIT);
  const names = await employerNameMap(page.map(([id]) => id));
  return {
    totalEmployers: created,
    verifiedEmployers: verifiedCreated,
    verifiedInPeriod,
    activeHiringEmployers: byId.size,
    employersWithJobs,
    employersWithApplications,
    employersInterviewing,
    employersWithOffers,
    employersWhoSelected,
    employersWithPlacements: employersWithJoins,
    hiringConversionPercent: percentOrNull(employersWithApplications, employersWithJobs),
    repeatHiringPercent: percentOrNull(repeat, employersWithJobs),
    repeatHiringEmployers: repeat,
    averageJobsPerPostingEmployer:
      byId.size === 0 ? null : Math.round((jobCount / byId.size) * 10) / 10,
    averageApplicationsPerEmployer:
      employersWithApplications === 0
        ? null
        : Math.round((applicationCount / employersWithApplications) * 10) / 10,
    averageHiresPerHiringEmployer:
      employersWithJoins === 0
        ? null
        : Math.round(
            ([...byId.values()].reduce((sum, row) => sum + row.joined, 0) / employersWithJoins) * 10,
          ) / 10,
    employerToApplicationPercent: percentOrNull(employersWithApplications, employersWithJobs),
    employerToJoinPercent: percentOrNull(employersWithJoins, employersWithJobs),
    rows: page.map(([id, row]) => ({
      employerName: names.get(id) ?? "Employer",
      jobs: row.jobs,
      applications: row.applications,
      interviews: row.interviews,
      offers: row.offers,
      selected: row.selected,
      joined: row.joined,
      distinctJobs: row.distinctJobs.size,
    })),
    truncated: ranked.length > TABLE_LIMIT,
    note: "An active hiring employer created a job or had an application, interview, offer, selection, or joining in the period. Repeat hiring means distinct jobs reached two or more. Duplicate events on one job are not a repeat. Employer-to-application is employers who received applications divided by employers who posted jobs. Employer-to-join is employers with a joined candidate divided by employers who posted jobs. Verified employers on the main KPI are accounts created in the period that are currently verified. Verified in period uses verifiedAt.",
  };
}

async function employerNameMap(ids: string[]): Promise<Map<string, string>> {
  const objectIds = ids.filter((id) => Types.ObjectId.isValid(id)).map((id) => new Types.ObjectId(id));
  if (objectIds.length === 0) return new Map();
  const rows = await EmployerModel.find({ _id: { $in: objectIds } })
    .select("companyName establishmentName firstName lastName")
    .lean();
  const names = new Map<string, string>();
  for (const row of rows) {
    const company = String(row.companyName || row.establishmentName || "").trim();
    const person = `${row.firstName ?? ""} ${row.lastName ?? ""}`.trim();
    names.set(String(row._id), company || person || "Employer");
  }
  return names;
}

async function buildCategoryCoverage(from: Date, to: Date, categoryFilter: string, scope: AnalyticsScope) {
  const range = { $gte: from, $lte: to };
  const [jobs, stages] = await Promise.all([
    agg<{ _id: string; jobs: number; employers: string[] }>(JobModel, [
      { $match: { createdAt: range, ...scope.jobMatch } },
      {
        $group: {
          _id: {
            $cond: [
              { $gt: [{ $strLenCP: { $trim: { input: { $ifNull: ["$businessCategory", ""] } } } }, 0] },
              "$businessCategory",
              { $ifNull: ["$industry", ""] },
            ],
          },
          jobs: { $sum: 1 },
          employers: { $addToSet: { $toString: "$employerId" } },
        },
      },
    ]),
    agg<{
      _id: string;
      applications: number;
      interviews: number;
      offers: number;
      selected: number;
      joined: number;
    }>(ApplicationModel, [
      { $match: { appliedAt: range, ...scope.applicationMatch } },
      {
        $lookup: {
          from: "jobs",
          localField: "jobId",
          foreignField: "_id",
          pipeline: [
            ...(Object.keys(scope.jobMatch).length > 0 ? [{ $match: scope.jobMatch }] : []),
            { $project: { businessCategory: 1, industry: 1 } },
          ],
          as: "job",
        },
      },
      ...(scope.needsJobJoin ? [{ $match: { "job.0": { $exists: true } } } as PipelineStage] : []),
      {
        $group: {
          _id: {
            $let: {
              vars: { job: { $arrayElemAt: ["$job", 0] } },
              in: {
                $cond: [
                  { $gt: [{ $strLenCP: { $trim: { input: { $ifNull: ["$$job.businessCategory", ""] } } } }, 0] },
                  "$$job.businessCategory",
                  { $ifNull: ["$$job.industry", ""] },
                ],
              },
            },
          },
          applications: { $sum: 1 },
          interviews: {
            $sum: {
              $cond: [
                { $in: ["interview_completed", "$statusHistory.status"] },
                1,
                0,
              ],
            },
          },
          offers: { $sum: { $cond: [{ $in: ["offer_sent", "$statusHistory.status"] }, 1, 0] } },
          selected: { $sum: { $cond: [{ $in: ["selected", "$statusHistory.status"] }, 1, 0] } },
          joined: { $sum: { $cond: [{ $in: ["joined", "$statusHistory.status"] }, 1, 0] } },
        },
      },
    ]),
  ]);
  const filter = categoryFilter.trim().toLowerCase();
  const rows = new Map<string, {
    label: string;
    unclassified: boolean;
    jobs: number;
    employers: number;
    applications: number;
    interviews: number;
    offers: number;
    selected: number;
    joined: number;
  }>();
  const ensure = (raw: string) => {
    const mapped = canonicalCategory(raw);
    if (filter && mapped.id !== filter && mapped.label.toLowerCase() !== filter) return null;
    const current = rows.get(mapped.id) ?? {
      label: mapped.label,
      unclassified: mapped.id === "unclassified",
      jobs: 0,
      employers: 0,
      applications: 0,
      interviews: 0,
      offers: 0,
      selected: 0,
      joined: 0,
    };
    rows.set(mapped.id, current);
    return current;
  };
  for (const row of jobs) {
    const bucket = ensure(String(row._id ?? ""));
    if (!bucket) continue;
    bucket.jobs += row.jobs;
    bucket.employers += (row.employers ?? []).filter(Boolean).length;
  }
  for (const row of stages) {
    const bucket = ensure(String(row._id ?? ""));
    if (!bucket) continue;
    bucket.applications += row.applications;
    bucket.interviews += row.interviews;
    bucket.offers += row.offers;
    bucket.selected += row.selected;
    bucket.joined += row.joined;
  }
  const all = [...rows.values()].sort((a, b) => b.applications + b.jobs - (a.applications + a.jobs));
  return {
    rows: all.slice(0, 40).map((row) => ({
      category: row.label,
      unclassified: row.unclassified,
      jobs: row.jobs,
      applications: row.applications,
      interviews: row.interviews,
      offers: row.offers,
      selected: row.selected,
      joined: row.joined,
      employers: row.employers,
      applicationToInterviewPercent: percentOrNull(row.interviews, row.applications),
      offerToJoinPercent: percentOrNull(row.joined, row.offers),
    })),
    jobsWithoutApplications: all.filter((row) => row.jobs > 0 && row.applications === 0).length,
    applicationsWithoutInterviews: all.filter((row) => row.applications > 0 && row.interviews === 0).length,
    offersWithoutJoins: all.filter((row) => row.offers > 0 && row.joined === 0).length,
    truncated: all.length > 40,
    note: "Unknown category text stays Unclassified. Interview, offer, selected, and joined counts are applications in the period whose history contains that status. They are not inferred from a later status alone when the history entry is missing.",
  };
}

async function buildAcquisition(from: Date, to: Date, scope: AnalyticsScope) {
  const rows = await agg<{
    _id: { source: string; medium: string; campaign: string; content: string; term: string; landing: string; referrer?: string };
    visitors: number;
    sessions: number;
    registrations: number;
    applications: number;
  }>(AnalyticsEventModel, [
    { $match: { occurredAt: { $gte: from, $lte: to }, eventName: { $in: ["page_view", "registration_completed", "job_application_submitted"] } } },
    {
      $group: {
        _id: {
          source: { $ifNull: ["$utmSource", ""] },
          medium: { $ifNull: ["$utmMedium", ""] },
          campaign: { $ifNull: ["$utmCampaign", ""] },
          content: { $ifNull: ["$utmContent", ""] },
          term: { $ifNull: ["$utmTerm", ""] },
          landing: { $ifNull: ["$landingPath", "$path"] },
          referrer: { $ifNull: ["$referrerHost", ""] },
          visitorId: "$visitorId",
        },
        sessions: { $addToSet: "$sessionId" },
        registrations: { $sum: { $cond: [{ $eq: ["$eventName", "registration_completed"] }, 1, 0] } },
        applications: { $sum: { $cond: [{ $eq: ["$eventName", "job_application_submitted"] }, 1, 0] } },
      },
    },
    {
      $group: {
        _id: {
          source: "$_id.source",
          medium: "$_id.medium",
          campaign: "$_id.campaign",
          content: "$_id.content",
          term: "$_id.term",
          landing: "$_id.landing",
          referrer: "$_id.referrer",
        },
        visitors: { $sum: 1 },
        sessions: { $sum: { $size: "$sessions" } },
        registrations: { $sum: "$registrations" },
        applications: { $sum: "$applications" },
      },
    },
    { $sort: { applications: -1, visitors: -1 } },
    { $limit: TABLE_LIMIT },
  ]);
  return {
    model: "first_touch" as const,
    rows: rows.map((row) => {
      const source = row._id.source.trim()
        ? row._id.source.trim()
        : String(row._id.referrer ?? "").trim() || "Direct";
      return {
        source,
        medium: dimensionLabel(row._id.medium),
        campaign: dimensionLabel(row._id.campaign),
        content: dimensionLabel(row._id.content),
        term: dimensionLabel(row._id.term),
        landingPath: row._id.landing || "Unknown",
        visitors: row.visitors,
        sessions: row.sessions,
        registrations: row.registrations,
        applications: row.applications,
        visitorToApplicationPercent: percentOrNull(row.applications, row.visitors),
      };
    }),
    note: `UTM values are first-touch fields stored on each event. Empty source with no referrer is Direct. Empty campaign, content, or term is Unknown. Session UTM is stored separately and is not written over the original source. Events recorded before UTM content and term existed have those dimensions as Unknown. Registration and application counts here are tracked events, not a backfill of older accounts.${scope.ignoredByWebsiteEvents.length > 0 ? ` Website events have no ${scope.ignoredByWebsiteEvents.join(", ")} field, so those filters are not applied to this table.` : ""}`,
  };
}

async function buildRegistrationFunnel(from: Date, to: Date, scope: AnalyticsScope) {
  const range = { $gte: from, $lte: to };
  const [
    employerPage,
    seekerStarted,
    employerStarted,
    seekerAccounts,
    employerAccounts,
    otpTracked,
    profileTracked,
    searchTracked,
    detailTracked,
    otp,
    profile,
    search,
    detail,
    firstApplications,
  ] = await Promise.all([
    AnalyticsEventModel.countDocuments({
      eventName: "page_view",
      occurredAt: range,
      path: /\/employer\/register/,
    }),
    eventExists("registration_started", to).then(async (exists) =>
      exists ? distinctEventVisitors("registration_started", from, to, "job_seeker") : null,
    ),
    eventExists("registration_started", to).then(async (exists) =>
      exists ? distinctEventVisitors("registration_started", from, to, "employer") : null,
    ),
    JobSeekerModel.countDocuments({
      createdAt: range,
      ...(scope.employerMatch.state ? { state: scope.employerMatch.state } : {}),
      ...(scope.employerMatch.city ? { city: scope.employerMatch.city } : {}),
    }),
    EmployerModel.countDocuments({ createdAt: range, ...scope.employerMatch }),
    eventExists("otp_verified", to),
    eventExists("profile_completed", to),
    eventExists("job_search", to),
    eventExists("job_detail_viewed", to),
    distinctEventVisitors("otp_verified", from, to, "job_seeker"),
    distinctEventVisitors("profile_completed", from, to, "job_seeker"),
    distinctEventVisitors("job_search", from, to),
    distinctEventVisitors("job_detail_viewed", from, to),
    agg<{ n: number }>(ApplicationModel, [
      { $match: { appliedAt: { $lte: to }, ...scope.applicationMatch } },
      ...jobJoinStages(scope),
      { $group: { _id: "$jobSeekerId", first: { $min: "$appliedAt" } } },
      { $match: { first: range } },
      { $count: "n" },
    ]),
  ]);
  const seekerPageViews = await AnalyticsEventModel.countDocuments({
    eventName: "page_view",
    occurredAt: range,
    path: /\/job-seeker\/register/,
  });
  const seekerStages = withStageDropOff([
    { key: "page", label: "Registration page viewed", count: seekerPageViews, source: "analytics_events.page_view", definition: "Page views whose path is the job-seeker registration page. This is not a registration start." },
    { key: "started", label: "Registration started", count: seekerStarted, source: "analytics_events.registration_started", definition: "Visitors who started the job-seeker form. Unavailable when that event has never been tracked." },
    { key: "completed", label: "Registration completed", count: seekerAccounts, source: "jobseekers.createdAt", definition: "Job-seeker accounts created in the period. Not inferred from a page view." },
    { key: "otp", label: "OTP verified", count: otpTracked ? otp : null, source: "analytics_events.otp_verified", definition: "OTP success events. Unavailable until the event exists." },
    { key: "profile", label: "Profile completed", count: profileTracked ? profile : null, source: "analytics_events.profile_completed", definition: "Profile completion events. A later application does not count as profile completion." },
    { key: "search", label: "Job search", count: searchTracked ? search : null, source: "analytics_events.job_search", definition: "Visitors who searched jobs." },
    { key: "detail", label: "Job detail viewed", count: detailTracked ? detail : null, source: "analytics_events.job_detail_viewed", definition: "Visitors who opened a job detail page." },
    { key: "application", label: "First application submitted", count: firstApplications[0]?.n ?? 0, source: "applications.appliedAt", definition: "Job seekers whose earliest application falls in the period." },
  ]);
  return {
    jobSeekers: seekerStages.map((stage) => ({
      ...stage,
      unavailableReason: stage.count == null ? "This event was not tracked for historical visits, so the stage is unavailable rather than zero." : undefined,
    })),
    employers: withStageDropOff([
      { key: "page", label: "Registration page viewed", count: employerPage, definition: "Page views of the employer registration page." },
      { key: "started", label: "Registration started", count: employerStarted, definition: "Employer registration start events. Unavailable when never tracked." },
      { key: "completed", label: "Registration completed", count: employerAccounts, definition: "Employer accounts created in the period." },
    ]).map((stage) => ({
      ...stage,
      unavailableReason: stage.count == null ? "This event was not tracked for historical visits, so the stage is unavailable rather than zero." : undefined,
    })),
    ignoredPageViewsAsStarts: true,
    note: `Job-seeker page-view count is only the registration path. A broad page-view total is not used as a start. Account counts use state and city when those filters are set. Event stages do not store ${scope.ignoredByWebsiteEvents.length > 0 ? scope.ignoredByWebsiteEvents.join(", ") : "location or employer"}, so those filters are not applied to tracked steps.`,
  };
}

function countScopedApplications(
  range: { $gte: Date; $lte: Date },
  scope: AnalyticsScope,
): Promise<number> {
  if (!scope.needsJobJoin && Object.keys(scope.applicationMatch).length === 0) {
    return ApplicationModel.countDocuments({ appliedAt: range });
  }
  return agg<{ n: number }>(ApplicationModel, [
    { $match: { appliedAt: range, ...scope.applicationMatch } },
    ...jobJoinStages(scope),
    { $count: "n" },
  ]).then((rows) => rows[0]?.n ?? 0);
}

async function buildJobConversion(from: Date, to: Date, scope: AnalyticsScope) {
  const range = { $gte: from, $lte: to };
  const [detailTracked, detailVisitors, detailEvents, applyStarts, pairs, applications, gaps, viewsWithoutApplications] = await Promise.all([
    eventExists("job_detail_viewed", to),
    distinctEventVisitors("job_detail_viewed", from, to),
    AnalyticsEventModel.countDocuments({ eventName: "job_detail_viewed", occurredAt: range }),
    eventExists("job_apply_started", to).then(async (exists) =>
      exists ? AnalyticsEventModel.countDocuments({ eventName: "job_apply_started", occurredAt: range }) : null,
    ),
    scope.needsJobJoin
      ? agg<{ n: number }>(JobViewModel, [
          { $match: { lastViewedAt: range } },
          ...jobJoinStages(scope),
          { $count: "n" },
        ]).then((rows) => rows[0]?.n ?? 0)
      : JobViewModel.countDocuments({ lastViewedAt: range }),
    countScopedApplications(range, scope),
    agg<{
      viewsNoApplications: number;
      applicationsNoInterviews: number;
      interviewsNoOffers: number;
      offersNoJoins: number;
    }>(ApplicationModel, [
      { $match: { appliedAt: range, ...scope.applicationMatch } },
      ...jobJoinStages(scope),
      {
        $group: {
          _id: "$jobId",
          applications: { $sum: 1 },
          interviews: { $sum: { $cond: [{ $in: ["interview_completed", "$statusHistory.status"] }, 1, 0] } },
          offers: { $sum: { $cond: [{ $in: ["offer_sent", "$statusHistory.status"] }, 1, 0] } },
          joined: { $sum: { $cond: [{ $in: ["joined", "$statusHistory.status"] }, 1, 0] } },
        },
      },
      {
        $group: {
          _id: null,
          applicationsNoInterviews: { $sum: { $cond: [{ $and: [{ $gt: ["$applications", 0] }, { $eq: ["$interviews", 0] }] }, 1, 0] } },
          interviewsNoOffers: { $sum: { $cond: [{ $and: [{ $gt: ["$interviews", 0] }, { $eq: ["$offers", 0] }] }, 1, 0] } },
          offersNoJoins: { $sum: { $cond: [{ $and: [{ $gt: ["$offers", 0] }, { $eq: ["$joined", 0] }] }, 1, 0] } },
        },
      },
    ]),
    agg<{ n: number }>(JobViewModel, [
      { $match: { lastViewedAt: range } },
      ...jobJoinStages(scope),
      { $group: { _id: "$jobId" } },
      {
        $lookup: {
          from: "applications",
          let: { jobId: "$_id" },
          pipeline: [
            { $match: { $expr: { $eq: ["$jobId", "$$jobId"] }, appliedAt: range, ...scope.applicationMatch } },
            { $limit: 1 },
            { $project: { _id: 1 } },
          ],
          as: "apps",
        },
      },
      { $match: { apps: { $size: 0 } } },
      { $count: "n" },
    ]),
  ]);
  const jobsWithApplications = await agg<{ n: number }>(ApplicationModel, [
    { $match: { appliedAt: range, ...scope.applicationMatch } },
    ...jobJoinStages(scope),
    { $group: { _id: "$jobId" } },
    { $count: "n" },
  ]);
  const topJobs = await agg<{ _id: string; publicJobId: string; applications: number; interviews: number; offers: number; joined: number }>(ApplicationModel, [
    { $match: { appliedAt: range, ...scope.applicationMatch } },
    ...jobJoinStages(scope),
    {
      $group: {
        _id: "$jobId",
        publicJobId: { $first: "$publicJobId" },
        applications: { $sum: 1 },
        interviews: { $sum: { $cond: [{ $in: ["interview_completed", "$statusHistory.status"] }, 1, 0] } },
        offers: { $sum: { $cond: [{ $in: ["offer_sent", "$statusHistory.status"] }, 1, 0] } },
        joined: { $sum: { $cond: [{ $in: ["joined", "$statusHistory.status"] }, 1, 0] } },
      },
    },
    { $sort: { applications: -1 } },
    { $limit: TABLE_LIMIT },
  ]);
  const jobCount = jobsWithApplications[0]?.n ?? 0;
  return {
    detailViewsTracked: detailTracked,
    detailViewEvents: detailTracked ? detailEvents : null,
    detailViewVisitors: detailTracked ? detailVisitors : null,
    visitorJobPairs: pairs,
    jobsWithViewsNoApplications: viewsWithoutApplications[0]?.n ?? 0,
    applications,
    applyStarts,
    viewToApplicationPercent: detailTracked ? percentOrNull(applications, detailVisitors) : null,
    startToSubmitPercent: applyStarts == null ? null : percentOrNull(applications, applyStarts),
    applicationsPerJob: jobCount === 0 ? null : Math.round((applications / jobCount) * 10) / 10,
    jobsWithApplicationsNoInterviews: gaps[0]?.applicationsNoInterviews ?? 0,
    jobsWithInterviewsNoOffers: gaps[0]?.interviewsNoOffers ?? 0,
    jobsWithOffersNoJoins: gaps[0]?.offersNoJoins ?? 0,
    rows: topJobs.map((row) => ({
      jobLabel: row.publicJobId || "Job",
      applications: row.applications,
      interviews: row.interviews,
      offers: row.offers,
      joined: row.joined,
    })),
    note: "Visitor–job pairs are the latest-view ledger, not page views. Job detail views and apply starts are event counts and stay unavailable until those events exist. Applications are counted once per application document.",
  };
}
