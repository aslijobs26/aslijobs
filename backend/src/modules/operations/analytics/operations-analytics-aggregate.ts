import { Types, type PipelineStage } from "mongoose";
import { ApplicationModel } from "../../applications/application.model.js";
import { EmployerModel } from "../../employers/employer.model.js";
import { JobModel } from "../../jobs/job.model.js";
import { JobSeekerModel } from "../../job-seekers/job-seeker.model.js";
import { JobViewModel } from "../../jobs/job-view.model.js";
import { categoryMatchClause } from "./operations-analytics-scope.js";
import { canonicalCategory } from "./operations-analytics-taxonomy.js";
import { classifySupplyDemand, percentOf } from "./operations-analytics-domain.js";
import type { OperationsAnalyticsOverviewQuery } from "./operations-analytics.validation.js";
import type {
  OperationsAnalyticsEmployerHiring,
  OperationsAnalyticsInterviewMetrics,
  OperationsAnalyticsSupplyDemandRow,
} from "./operations-analytics.types.js";

const DISPLAY_CATEGORIES = 12;

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

async function employerIdsForFilter(employer: string): Promise<Types.ObjectId[] | null> {
  const trimmed = employer.trim();
  if (!trimmed) return null;
  if (/^[a-f0-9]{24}$/i.test(trimmed)) return [new Types.ObjectId(trimmed)];
  const pattern = new RegExp(escapeRegex(trimmed), "i");
  const rows = await EmployerModel.find({
    $or: [
      { companyName: pattern },
      { establishmentName: pattern },
      { firstName: pattern },
      { lastName: pattern },
    ],
  })
    .select("_id")
    .limit(50)
    .lean();
  return rows.map((row) => row._id as Types.ObjectId);
}

function jobDimension(query: OperationsAnalyticsOverviewQuery, employerIds: Types.ObjectId[] | null) {
  const match: Record<string, unknown> = {};
  if (query.jobType) match.jobType = query.jobType;
  if (employerIds) match.employerId = { $in: employerIds };
  const and: Record<string, unknown>[] = [];
  if (query.state.trim()) {
    const pattern = new RegExp(escapeRegex(query.state.trim()), "i");
    and.push({ $or: [{ stateName: pattern }, { state: pattern }] });
  }
  if (query.city.trim()) {
    const pattern = new RegExp(escapeRegex(query.city.trim()), "i");
    and.push({ $or: [{ cityName: pattern }, { city: pattern }] });
  }
  const categoryClause = categoryMatchClause(query.category);
  if (categoryClause) and.push(categoryClause);
  if (and.length > 0) match.$and = and;
  return match;
}

function needsJobJoin(query: OperationsAnalyticsOverviewQuery): boolean {
  return Boolean(query.state.trim() || query.city.trim() || query.jobType || query.category.trim());
}

function datedCountPipeline(
  match: Record<string, unknown>,
  dateField: string,
  query: OperationsAnalyticsOverviewQuery,
  lookupJob: boolean,
): PipelineStage[] {
  const pipeline: PipelineStage[] = [{ $match: match }];
  const dayExpr = {
    $dateToString: { format: "%Y-%m-%d", date: dateField, timezone: "Asia/Kolkata" },
  };
  if (lookupJob && needsJobJoin(query)) {
    pipeline.push(
      {
        $lookup: {
          from: "jobs",
          let: { jobId: "$jobId" },
          pipeline: [
            { $match: { $expr: { $eq: ["$_id", "$$jobId"] } } },
            { $match: jobDimension(query, null) },
            { $project: { businessCategory: 1, industry: 1 } },
          ],
          as: "job",
        },
      },
      { $match: { "job.0": { $exists: true } } },
      {
        $group: {
          _id: {
            day: dayExpr,
            category: {
              $cond: [
                {
                  $gt: [
                    {
                      $strLenCP: {
                        $trim: {
                          input: { $ifNull: [{ $arrayElemAt: ["$job.businessCategory", 0] }, ""] },
                        },
                      },
                    },
                    0,
                  ],
                },
                { $arrayElemAt: ["$job.businessCategory", 0] },
                { $ifNull: [{ $arrayElemAt: ["$job.industry", 0] }, ""] },
              ],
            },
          },
          count: { $sum: 1 },
        },
      },
    );
    return pipeline;
  }
  pipeline.push({
    $group: {
      _id: {
        day: dayExpr,
        category: lookupJob
          ? ""
          : {
              $cond: [
                {
                  $gt: [
                    { $strLenCP: { $trim: { input: { $ifNull: ["$businessCategory", ""] } } } },
                    0,
                  ],
                },
                "$businessCategory",
                { $ifNull: ["$industry", ""] },
              ],
            },
      },
      count: { $sum: 1 },
    },
  });
  return pipeline;
}

function historyDayCounts(
  status: string,
  from: Date,
  to: Date,
  query: OperationsAnalyticsOverviewQuery,
  employerIds: Types.ObjectId[] | null,
) {
  const match: Record<string, unknown> = {
    statusHistory: { $elemMatch: { status, at: { $gte: from, $lte: to } } },
  };
  if (employerIds) match.employerId = { $in: employerIds };
  const pipeline: PipelineStage[] = [{ $match: match }];
  if (needsJobJoin(query)) {
    pipeline.push(
      {
        $lookup: {
          from: "jobs",
          let: { jobId: "$jobId" },
          pipeline: [
            { $match: { $expr: { $eq: ["$_id", "$$jobId"] } } },
            { $match: jobDimension(query, null) },
            { $project: { businessCategory: 1, industry: 1 } },
          ],
          as: "job",
        },
      },
      { $match: { "job.0": { $exists: true } } },
    );
  }
  pipeline.push(
    { $unwind: "$statusHistory" },
    {
      $match: {
        "statusHistory.status": status,
        "statusHistory.at": { $gte: from, $lte: to },
      },
    },
    {
      $group: {
        _id: {
          app: "$_id",
          day: {
            $dateToString: {
              date: "$statusHistory.at",
              format: "%Y-%m-%d",
              timezone: "Asia/Kolkata",
            },
          },
          category: {
            $cond: [
              {
                $gt: [
                  {
                    $strLenCP: {
                      $trim: {
                        input: { $ifNull: [{ $arrayElemAt: ["$job.businessCategory", 0] }, ""] },
                      },
                    },
                  },
                  0,
                ],
              },
              { $arrayElemAt: ["$job.businessCategory", 0] },
              { $ifNull: [{ $arrayElemAt: ["$job.industry", 0] }, ""] },
            ],
          },
        },
      },
    },
  );
  return ApplicationModel.aggregate<{ _id: { day: string; category: string }; count: number }>([
    ...pipeline,
    { $group: { _id: { day: "$_id.day", category: "$_id.category" }, count: { $sum: 1 } } },
    { $sort: { "_id.day": 1 } },
  ]);
}

function foldCategoryDays(
  rows: Array<{ _id: { day: string; category: string }; count: number }>,
  categoryFilter: string,
): Array<{ date: string; count: number }> {
  const byDay = new Map<string, number>();
  for (const row of rows) {
    const mapped = canonicalCategory(row._id?.category);
    if (
      categoryFilter &&
      mapped.id !== categoryFilter &&
      mapped.label.toLowerCase() !== categoryFilter
    ) {
      continue;
    }
    const dayKey = row._id?.day;
    if (!dayKey) continue;
    byDay.set(dayKey, (byDay.get(dayKey) ?? 0) + row.count);
  }
  return [...byDay.entries()]
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([date, count]) => ({ date, count }));
}

function historyStagesPipeline(
  from: Date,
  to: Date,
  query: OperationsAnalyticsOverviewQuery,
  employerIds: Types.ObjectId[] | null,
): PipelineStage[] {
  const match: Record<string, unknown> = {
    statusHistory: { $elemMatch: { at: { $gte: from, $lte: to } } },
  };
  if (employerIds) match.employerId = { $in: employerIds };
  if (query.applicationStatus) match["statusHistory.status"] = query.applicationStatus;
  const pipeline: PipelineStage[] = [{ $match: match }];
  if (needsJobJoin(query)) {
    const dimension = jobDimension(query, null);
    pipeline.push(
      {
        $lookup: {
          from: "jobs",
          let: { jobId: "$jobId" },
          pipeline: [
            { $match: { $expr: { $eq: ["$_id", "$$jobId"] } } },
            { $match: dimension },
            { $project: { businessCategory: 1, industry: 1, employerId: 1 } },
          ],
          as: "job",
        },
      },
      { $match: { "job.0": { $exists: true } } },
    );
  }
  pipeline.push(
    {
      $project: {
        employerId: 1,
        job: { $arrayElemAt: ["$job", 0] },
        cancelledAt: "$interview.cancelledAt",
        events: {
          $filter: {
            input: "$statusHistory",
            as: "event",
            cond: {
              $and: [
                { $gte: ["$$event.at", from] },
                { $lte: ["$$event.at", to] },
              ],
            },
          },
        },
      },
    },
    {
      $project: {
        employerId: 1,
        categoryRaw: {
          $cond: [
            {
              $gt: [
                { $strLenCP: { $trim: { input: { $ifNull: ["$job.businessCategory", ""] } } } },
                0,
              ],
            },
            "$job.businessCategory",
            { $ifNull: ["$job.industry", ""] },
          ],
        },
        scheduled: {
          $size: {
            $filter: {
              input: "$events",
              as: "event",
              cond: { $eq: ["$$event.status", "interview_scheduled"] },
            },
          },
        },
        completed: {
          $size: {
            $filter: {
              input: "$events",
              as: "event",
              cond: { $eq: ["$$event.status", "interview_completed"] },
            },
          },
        },
        shortlisted: {
          $size: {
            $filter: {
              input: "$events",
              as: "event",
              cond: { $eq: ["$$event.status", "shortlisted"] },
            },
          },
        },
        offers: {
          $size: {
            $filter: {
              input: "$events",
              as: "event",
              cond: { $eq: ["$$event.status", "offer_sent"] },
            },
          },
        },
        selected: {
          $size: {
            $filter: {
              input: "$events",
              as: "event",
              cond: { $eq: ["$$event.status", "selected"] },
            },
          },
        },
        joined: {
          $size: {
            $filter: {
              input: "$events",
              as: "event",
              cond: { $eq: ["$$event.status", "joined"] },
            },
          },
        },
        rescheduleRemark: {
          $size: {
            $filter: {
              input: "$events",
              as: "event",
              cond: {
                $regexMatch: {
                  input: { $ifNull: ["$$event.remark", ""] },
                  regex: "^Interview Rescheduled",
                  options: "i",
                },
              },
            },
          },
        },
        cancelled: {
          $cond: [
            {
              $and: [
                { $gte: ["$cancelledAt", from] },
                { $lte: ["$cancelledAt", to] },
              ],
            },
            1,
            0,
          ],
        },
      },
    },
  );
  return pipeline;
}

async function employerLabels(ids: Types.ObjectId[]): Promise<Map<string, string>> {
  if (ids.length === 0) return new Map();
  const rows = await EmployerModel.find({ _id: { $in: ids } })
    .select("companyName establishmentName firstName lastName")
    .lean();
  const labels = new Map<string, string>();
  for (const row of rows) {
    const company = String(row.companyName || row.establishmentName || "").trim();
    const person = `${row.firstName ?? ""} ${row.lastName ?? ""}`.trim();
    labels.set(String(row._id), company || person || "Employer");
  }
  return labels;
}

export async function aggregateHiringPeriod(input: {
  query: OperationsAnalyticsOverviewQuery;
  from: Date;
  to: Date;
}): Promise<{
  outOfScope: boolean;
  jobViews: number;
  registrations: number;
  employerRegistrations: number;
  verifiedEmployers: number;
  applications: number;
  shortlisted: number;
  interviewsScheduled: number;
  interviewsCompleted: number;
  interviewsRescheduled: number;
  offers: number;
  selected: number;
  joined: number;
  placements: number;
  missingInterviewHistory: number;
  supplyDemand: OperationsAnalyticsSupplyDemandRow[];
  supplyDemandTruncated: boolean;
  categoryCoverage: {
    jobsMapped: number;
    jobsUnmapped: number;
    candidatesMapped: number;
    candidatesUnmapped: number;
    coveragePercent: number | null;
  };
  interviewMetrics: OperationsAnalyticsInterviewMetrics;
  employerHiring: OperationsAnalyticsEmployerHiring;
  daily: {
    applications: Array<{ date: string; count: number }>;
    registrations: Array<{ date: string; count: number }>;
    jobsCreated: Array<{ date: string; count: number }>;
    placements: Array<{ date: string; count: number }>;
    selected: Array<{ date: string; count: number }>;
    employers: Array<{ date: string; count: number }>;
  };
}> {
  const country = input.query.country.trim().toLowerCase();
  if (country && !["india", "in", "bharat"].includes(country)) {
    return emptyAggregate();
  }
  const employerIds = await employerIdsForFilter(input.query.employer);
  if (employerIds && employerIds.length === 0) return emptyAggregate();

  const dimension = jobDimension(input.query, employerIds);
  const liveMatch = {
    ...dimension,
    status: "active",
    createdAt: { $gte: input.from, $lte: input.to },
  };
  const seekerMatch: Record<string, unknown> = {
    createdAt: { $gte: input.from, $lte: input.to },
  };
  if (input.query.state.trim()) {
    seekerMatch.state = new RegExp(escapeRegex(input.query.state.trim()), "i");
  }
  if (input.query.city.trim()) {
    seekerMatch.city = new RegExp(escapeRegex(input.query.city.trim()), "i");
  }
  if (input.query.jobType) seekerMatch.jobType = input.query.jobType;
  const employerMatch: Record<string, unknown> = {
    createdAt: { $gte: input.from, $lte: input.to },
  };
  if (input.query.state.trim()) {
    employerMatch.state = new RegExp(escapeRegex(input.query.state.trim()), "i");
  }
  if (input.query.city.trim()) {
    employerMatch.city = new RegExp(escapeRegex(input.query.city.trim()), "i");
  }
  if (employerIds) employerMatch._id = { $in: employerIds };

  const applicationMatch: Record<string, unknown> = {
    appliedAt: { $gte: input.from, $lte: input.to },
  };
  if (employerIds) applicationMatch.employerId = { $in: employerIds };
  if (input.query.applicationStatus) {
    applicationMatch["statusHistory.status"] = input.query.applicationStatus;
  }

  const day = {
    format: "%Y-%m-%d",
    timezone: "Asia/Kolkata",
  };

  const [jobGroups, seekerGroups, stageRows, postingEmployerRows, applicationGroups, jobDayGroups, seekerDayGroups, joinedDaily, selectedDaily, jobViews, employersCreated, verifiedEmployers, missingInterviewHistory] =
    await Promise.all([
      JobModel.aggregate<{ _id: string; count: number }>([
        { $match: liveMatch },
        {
          $group: {
            _id: {
              $cond: [
                { $gt: [{ $strLenCP: { $trim: { input: { $ifNull: ["$businessCategory", ""] } } } }, 0] },
                "$businessCategory",
                { $ifNull: ["$industry", ""] },
              ],
            },
            count: { $sum: 1 },
          },
        },
      ]),
      JobSeekerModel.aggregate<{ _id: string; count: number }>([
        { $match: seekerMatch },
        { $group: { _id: { $ifNull: ["$jobRole", ""] }, count: { $sum: 1 } } },
      ]),
      ApplicationModel.aggregate<{
        employerId: Types.ObjectId;
        categoryRaw: string;
        scheduled: number;
        completed: number;
        shortlisted: number;
        offers: number;
        selected: number;
        joined: number;
        rescheduleRemark: number;
        cancelled: number;
      }>(historyStagesPipeline(input.from, input.to, input.query, employerIds)),
      JobModel.aggregate<{ _id: { employerId: Types.ObjectId; category: string } }>([
        { $match: liveMatch },
        {
          $group: {
            _id: {
              employerId: "$employerId",
              category: {
                $cond: [
                  {
                    $gt: [
                      { $strLenCP: { $trim: { input: { $ifNull: ["$businessCategory", ""] } } } },
                      0,
                    ],
                  },
                  "$businessCategory",
                  { $ifNull: ["$industry", ""] },
                ],
              },
            },
          },
        },
      ]),
      ApplicationModel.aggregate<{ _id: { day: string; category: string }; count: number }>(
        datedCountPipeline(applicationMatch, "$appliedAt", input.query, true),
      ),
      JobModel.aggregate<{ _id: { day: string; category: string }; count: number }>(
        datedCountPipeline(
          { ...dimension, createdAt: { $gte: input.from, $lte: input.to } },
          "$createdAt",
          input.query,
          false,
        ),
      ),
      JobSeekerModel.aggregate<{ _id: { day: string; category: string }; count: number }>([
        { $match: seekerMatch },
        {
          $group: {
            _id: {
              day: { $dateToString: { date: "$createdAt", ...day } },
              category: { $ifNull: ["$jobRole", ""] },
            },
            count: { $sum: 1 },
          },
        },
      ]),
      historyDayCounts("joined", input.from, input.to, input.query, employerIds),
      historyDayCounts("selected", input.from, input.to, input.query, employerIds),
      countVisitorJobPairs(input.from, input.to, input.query, employerIds),
      EmployerModel.countDocuments(employerMatch),
      EmployerModel.countDocuments({ ...employerMatch, verificationStatus: "verified" }),
      ApplicationModel.countDocuments({
        status: { $in: ["interview_completed", "offer_sent", "selected", "joined"] },
        updatedAt: { $gte: input.from, $lte: input.to },
        statusHistory: { $not: { $elemMatch: { status: "interview_completed" } } },
      }),
    ]);

  const categoryFilter = input.query.category.trim().toLowerCase();
  const demand = new Map<string, { label: string; count: number }>();
  let jobsMapped = 0;
  let jobsUnmapped = 0;
  for (const row of jobGroups) {
    const mapped = canonicalCategory(row._id);
    if (categoryFilter && mapped.id !== categoryFilter && mapped.label.toLowerCase() !== categoryFilter) {
      continue;
    }
    if (mapped.confidence === "unclassified") jobsUnmapped += row.count;
    else jobsMapped += row.count;
    const current = demand.get(mapped.id) ?? { label: mapped.label, count: 0 };
    current.count += row.count;
    demand.set(mapped.id, current);
  }
  const supply = new Map<string, { label: string; count: number }>();
  let candidatesMapped = 0;
  let candidatesUnmapped = 0;
  let registrations = 0;
  for (const row of seekerGroups) {
    const mapped = canonicalCategory(row._id);
    if (categoryFilter && mapped.id !== categoryFilter && mapped.label.toLowerCase() !== categoryFilter) {
      continue;
    }
    if (mapped.confidence === "unclassified") candidatesUnmapped += row.count;
    else candidatesMapped += row.count;
    registrations += row.count;
    const current = supply.get(mapped.id) ?? { label: mapped.label, count: 0 };
    current.count += row.count;
    supply.set(mapped.id, current);
  }

  let shortlisted = 0;
  let interviewsScheduled = 0;
  let interviewsCompleted = 0;
  let interviewsRescheduled = 0;
  let offers = 0;
  let selected = 0;
  let joined = 0;
  let cancelled = 0;
  const employersWithApplications = new Set<string>();
  const employersInterviewing = new Set<string>();
  const employersWithOffers = new Set<string>();
  const employersWithPlacements = new Set<string>();
  const hireCounts = new Map<string, number>();
  const byEmployer = new Map<string, { scheduled: number; completed: number; offers: number }>();
  for (const row of stageRows) {
    if (categoryFilter) {
      const mapped = canonicalCategory(row.categoryRaw);
      if (mapped.id !== categoryFilter && mapped.label.toLowerCase() !== categoryFilter) continue;
    }
    const employerId = String(row.employerId ?? "");
    if (employerId) employersWithApplications.add(employerId);
    if (row.shortlisted > 0) shortlisted += 1;
    if (row.scheduled > 0) {
      interviewsScheduled += 1;
      if (employerId) employersInterviewing.add(employerId);
    }
    if (row.completed > 0) interviewsCompleted += 1;
    if (row.rescheduleRemark > 0 || row.scheduled >= 2) interviewsRescheduled += 1;
    if (row.offers > 0) {
      offers += 1;
      if (employerId) employersWithOffers.add(employerId);
    }
    if (row.selected > 0) selected += 1;
    if (row.joined > 0) {
      joined += 1;
      if (employerId) {
        employersWithPlacements.add(employerId);
        hireCounts.set(employerId, (hireCounts.get(employerId) ?? 0) + 1);
      }
    }
    if (row.cancelled > 0) cancelled += 1;
    if (employerId && (row.scheduled > 0 || row.completed > 0 || row.offers > 0)) {
      byEmployer.set(employerId, {
        scheduled: row.scheduled > 0 ? 1 : 0,
        completed: row.completed > 0 ? 1 : 0,
        offers: row.offers > 0 ? 1 : 0,
      });
    }
  }

  const labels = await employerLabels(
    [...byEmployer.keys()].slice(0, 20).map((id) => new Types.ObjectId(id)),
  );
  const supplyDemandAll: OperationsAnalyticsSupplyDemandRow[] = [...new Set([...demand.keys(), ...supply.keys()])]
    .map((id) => {
      const supplyCount = supply.get(id)?.count ?? 0;
      const demandCount = demand.get(id)?.count ?? 0;
      return {
        category: demand.get(id)?.label ?? supply.get(id)?.label ?? "Unclassified",
        categoryId: id,
        supply: supplyCount,
        demand: demandCount,
        ratio: demandCount > 0 ? Math.round((supplyCount / demandCount) * 100) / 100 : null,
        unclassified: id === "unclassified",
        status: classifySupplyDemand(supplyCount, demandCount),
      };
    })
    .filter((row) => row.supply > 0 || row.demand > 0)
    .sort((a, b) => b.demand + b.supply - (a.demand + a.supply));

  const repeat = [...hireCounts.values()].filter((count) => count >= 2).length;
  const hires = [...hireCounts.values()].reduce((sum, count) => sum + count, 0);
  const applicationsDaily = foldCategoryDays(applicationGroups, categoryFilter);
  const jobsDaily = foldCategoryDays(jobDayGroups, categoryFilter);
  const registrationsDaily = foldCategoryDays(seekerDayGroups, categoryFilter);
  const joinedDailyFolded = foldCategoryDays(joinedDaily, categoryFilter);
  const selectedDailyFolded = foldCategoryDays(selectedDaily, categoryFilter);
  const postingEmployers = new Set<string>();
  for (const row of postingEmployerRows) {
    const mapped = canonicalCategory(row._id?.category);
    if (
      categoryFilter &&
      mapped.id !== categoryFilter &&
      mapped.label.toLowerCase() !== categoryFilter
    ) {
      continue;
    }
    if (row._id?.employerId) postingEmployers.add(String(row._id.employerId));
  }
  const employerHiring: OperationsAnalyticsEmployerHiring = {
    totalEmployers: employersCreated,
    verifiedEmployers,
    activeHiringEmployers: employersWithApplications.size,
    employersWithJobs: postingEmployers.size,
    employersWithApplications: employersWithApplications.size,
    employersInterviewing: employersInterviewing.size,
    employersWithOffers: employersWithOffers.size,
    employersWithPlacements: employersWithPlacements.size,
    hiringConversionPercent: percentOf(employersWithPlacements.size, employersWithApplications.size),
    repeatHiringPercent: percentOf(repeat, employersWithPlacements.size),
    averageJobsPerPostingEmployer: null,
    averageHiresPerHiringEmployer:
      employersWithPlacements.size === 0 ? null : Math.round((hires / employersWithPlacements.size) * 10) / 10,
  };

  if (!needsJobJoin(input.query)) {
    const cancelledMatch: Record<string, unknown> = {
      "interview.cancelledAt": { $gte: input.from, $lte: input.to },
    };
    if (employerIds) cancelledMatch.employerId = { $in: employerIds };
    cancelled = await ApplicationModel.countDocuments(cancelledMatch);
  }

  const interviewMetrics: OperationsAnalyticsInterviewMetrics = {
    scheduled: interviewsScheduled,
    completed: interviewsCompleted,
    rescheduled: interviewsRescheduled,
    cancelled,
    missingHistory: missingInterviewHistory,
    noShows: null,
    completionRate: percentOf(interviewsCompleted, interviewsScheduled),
    interviewToOfferRate: percentOf(offers, interviewsCompleted),
    avgDaysApplicationToInterview: null,
    avgDaysInterviewToOffer: null,
    byCategory: [],
    byEmployer: [...byEmployer.entries()].slice(0, 20).map(([id, counts]) => ({
      employerId: labels.get(id) ?? "Employer",
      ...counts,
    })),
    statusDistribution: [],
    note: missingInterviewHistory > 0
      ? `${missingInterviewHistory.toLocaleString("en-IN")} applications are in a later status without an interview_completed history event. They are not counted as completed interviews. No-shows are not stored. Rescheduled means a reschedule remark or a second interview_scheduled event in the period.`
      : "Completed interviews count only interview_completed history events. No-shows are not stored. Rescheduled means a reschedule remark or a second interview_scheduled event in the period.",
  };

  return {
    outOfScope: false,
    jobViews,
    registrations,
    employerRegistrations: employersCreated,
    verifiedEmployers,
    applications: applicationsDaily.reduce((sum, row) => sum + row.count, 0),
    shortlisted,
    interviewsScheduled,
    interviewsCompleted,
    interviewsRescheduled,
    offers,
    selected,
    joined,
    placements: joined,
    missingInterviewHistory,
    supplyDemand: supplyDemandAll.slice(0, DISPLAY_CATEGORIES),
    supplyDemandTruncated: supplyDemandAll.length > DISPLAY_CATEGORIES,
    categoryCoverage: {
      jobsMapped,
      jobsUnmapped,
      candidatesMapped,
      candidatesUnmapped,
      coveragePercent:
        jobsMapped + jobsUnmapped + candidatesMapped + candidatesUnmapped === 0
          ? null
          : Math.round(((jobsMapped + candidatesMapped) / (jobsMapped + jobsUnmapped + candidatesMapped + candidatesUnmapped)) * 1000) / 10,
    },
    interviewMetrics,
    employerHiring,
    daily: {
      applications: applicationsDaily,
      registrations: registrationsDaily,
      jobsCreated: jobsDaily,
      placements: joinedDailyFolded,
      selected: selectedDailyFolded,
      employers: [],
    },
  };
}

async function countVisitorJobPairs(
  from: Date,
  to: Date,
  query: OperationsAnalyticsOverviewQuery,
  employerIds: Types.ObjectId[] | null,
): Promise<number> {
  if (!needsJobJoin(query) && !employerIds) {
    return JobViewModel.countDocuments({ lastViewedAt: { $gte: from, $lte: to } });
  }
  const rows = await JobViewModel.aggregate<{ _id: string; count: number }>([
    { $match: { lastViewedAt: { $gte: from, $lte: to } } },
    {
      $lookup: {
        from: "jobs",
        let: { jobId: "$jobId" },
        pipeline: [
          { $match: { $expr: { $eq: ["$_id", "$$jobId"] } } },
          { $match: jobDimension(query, employerIds) },
          { $project: { businessCategory: 1, industry: 1 } },
        ],
        as: "job",
      },
    },
    { $match: { "job.0": { $exists: true } } },
    {
      $group: {
        _id: {
          $cond: [
            {
              $gt: [
                {
                  $strLenCP: {
                    $trim: {
                      input: { $ifNull: [{ $arrayElemAt: ["$job.businessCategory", 0] }, ""] },
                    },
                  },
                },
                0,
              ],
            },
            { $arrayElemAt: ["$job.businessCategory", 0] },
            { $ifNull: [{ $arrayElemAt: ["$job.industry", 0] }, ""] },
          ],
        },
        count: { $sum: 1 },
      },
    },
  ]);
  const categoryFilter = query.category.trim().toLowerCase();
  return rows.reduce((sum, row) => {
    if (!categoryFilter) return sum + row.count;
    const mapped = canonicalCategory(row._id);
    if (mapped.id !== categoryFilter && mapped.label.toLowerCase() !== categoryFilter) return sum;
    return sum + row.count;
  }, 0);
}

function emptyAggregate(): Awaited<ReturnType<typeof aggregateHiringPeriod>> {
  return {
    outOfScope: true,
    jobViews: 0,
    registrations: 0,
    employerRegistrations: 0,
    verifiedEmployers: 0,
    applications: 0,
    shortlisted: 0,
    interviewsScheduled: 0,
    interviewsCompleted: 0,
    interviewsRescheduled: 0,
    offers: 0,
    selected: 0,
    joined: 0,
    placements: 0,
    missingInterviewHistory: 0,
    supplyDemand: [],
    supplyDemandTruncated: false,
    categoryCoverage: {
      jobsMapped: 0,
      jobsUnmapped: 0,
      candidatesMapped: 0,
      candidatesUnmapped: 0,
      coveragePercent: null,
    },
    interviewMetrics: {
      scheduled: 0,
      completed: 0,
      rescheduled: 0,
      cancelled: 0,
      missingHistory: 0,
      noShows: null,
      completionRate: null,
      interviewToOfferRate: null,
      avgDaysApplicationToInterview: null,
      avgDaysInterviewToOffer: null,
      byCategory: [],
      byEmployer: [],
      statusDistribution: [],
      note: "No records match the selected country. Analytics records do not store a country other than India.",
    },
    employerHiring: {
      totalEmployers: 0,
      verifiedEmployers: 0,
      activeHiringEmployers: 0,
      employersWithJobs: 0,
      employersWithApplications: 0,
      employersInterviewing: 0,
      employersWithOffers: 0,
      employersWithPlacements: 0,
      hiringConversionPercent: null,
      repeatHiringPercent: null,
      averageJobsPerPostingEmployer: null,
      averageHiresPerHiringEmployer: null,
    },
    daily: { applications: [], registrations: [], jobsCreated: [], placements: [], selected: [], employers: [] },
  };
}
