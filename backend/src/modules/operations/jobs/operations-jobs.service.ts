import mongoose from "mongoose";
import {
  JOB_LISTING_PAYMENT_STATUSES,
  JOB_STATUSES,
  type JobListingPaymentStatus,
  type JobStatus,
} from "../../../constants/job.constants.js";
import { ApplicationModel } from "../../applications/application.model.js";
import { resolveEmployerPosterImageUrl } from "../../employers/employer-poster-image.js";
import { EmployerModel } from "../../employers/employer.model.js";
import { JobModel, type JobDocument } from "../../jobs/job.model.js";
import { buildListPagination } from "../../../utils/pagination.js";
import type {
  OperationsJobListItem,
  OperationsJobsFilterOptions,
  OperationsJobsInsight,
  OperationsJobsKpis,
  OperationsJobsListResult,
  OperationsJobsTabCounts,
} from "./operations-jobs.types.js";
import type { ListOperationsJobsQuery } from "./operations-jobs.validation.js";

const PENDING_PAYMENT_STATUSES: JobListingPaymentStatus[] = [
  "pending",
  "unpaid",
];

function toIso(value: Date | string | null | undefined): string | null {
  if (!value) {
    return null;
  }

  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return date.toISOString();
}

function startOfUtcDay(date = new Date()): Date {
  return new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()),
  );
}

function daysFromNow(days: number): Date {
  const date = new Date();
  date.setUTCDate(date.getUTCDate() + days);
  return date;
}

function daysAgo(days: number): Date {
  const date = new Date();
  date.setUTCDate(date.getUTCDate() - days);
  return date;
}

function statusLabel(status: JobStatus): string {
  switch (status) {
    case "active":
      return "Live";
    case "draft":
      return "Draft";
    case "paused":
      return "Paused";
    case "closed":
      return "Closed";
    case "expired":
      return "Expired";
    default:
      return status;
  }
}

function paymentStatusLabel(status: JobListingPaymentStatus): string {
  switch (status) {
    case "paid":
      return "Paid";
    case "pending":
      return "Pending";
    case "unpaid":
      return "Unpaid";
    case "not_applicable":
      return "N/A";
    default:
      return status;
  }
}

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function buildListFilter(
  query: ListOperationsJobsQuery,
): Record<string, unknown> {
  const andClauses: Record<string, unknown>[] = [];

  switch (query.tab) {
    case "live":
      andClauses.push({ status: "active" });
      break;
    case "pending_payment":
      andClauses.push({
        listingPaymentStatus: { $in: PENDING_PAYMENT_STATUSES },
      });
      break;
    case "expired":
      andClauses.push({ status: "expired" });
      break;
    case "drafts":
      andClauses.push({ status: "draft" });
      break;
    default:
      break;
  }

  if (query.status) {
    andClauses.push({ status: query.status });
  }

  if (query.paymentStatus) {
    andClauses.push({ listingPaymentStatus: query.paymentStatus });
  }

  if (query.category) {
    andClauses.push({
      businessCategory: {
        $regex: `^${escapeRegex(query.category)}$`,
        $options: "i",
      },
    });
  }

  if (query.location) {
    const locationPattern = escapeRegex(query.location);
    andClauses.push({
      $or: [
        { cityName: { $regex: locationPattern, $options: "i" } },
        { stateName: { $regex: locationPattern, $options: "i" } },
        { city: { $regex: locationPattern, $options: "i" } },
        { state: { $regex: locationPattern, $options: "i" } },
      ],
    });
  }

  const search = query.search.trim();
  if (search) {
    const pattern = escapeRegex(search);
    andClauses.push({
      $or: [
        { jobTitle: { $regex: pattern, $options: "i" } },
        { jobId: { $regex: pattern, $options: "i" } },
        { companyName: { $regex: pattern, $options: "i" } },
        { cityName: { $regex: pattern, $options: "i" } },
        { stateName: { $regex: pattern, $options: "i" } },
        { businessCategory: { $regex: pattern, $options: "i" } },
      ],
    });
  }

  if (andClauses.length === 0) {
    return {};
  }

  return andClauses.length === 1 ? andClauses[0]! : { $and: andClauses };
}

function buildSort(
  sort: ListOperationsJobsQuery["sort"],
): Record<string, 1 | -1> {
  switch (sort) {
    case "oldest":
      return { publishedAt: 1, createdAt: 1 };
    case "applications_desc":
      return { applications: -1, publishedAt: -1 };
    case "latest":
    default:
      return { publishedAt: -1, createdAt: -1 };
  }
}

async function loadApplicationsTodayByJobIds(
  jobMongoIds: string[],
): Promise<Map<string, number>> {
  const result = new Map<string, number>();
  if (jobMongoIds.length === 0) {
    return result;
  }

  const objectIds = jobMongoIds
    .filter((id) => mongoose.Types.ObjectId.isValid(id))
    .map((id) => new mongoose.Types.ObjectId(id));

  if (objectIds.length === 0) {
    return result;
  }

  const rows = await ApplicationModel.aggregate<{
    _id: mongoose.Types.ObjectId;
    count: number;
  }>([
    {
      $match: {
        jobId: { $in: objectIds },
        createdAt: { $gte: startOfUtcDay() },
      },
    },
    {
      $group: {
        _id: "$jobId",
        count: { $sum: 1 },
      },
    },
  ]);

  for (const row of rows) {
    result.set(String(row._id), row.count);
  }

  return result;
}

async function loadApplicationTotalsByJobIds(
  jobMongoIds: string[],
): Promise<Map<string, number>> {
  const result = new Map<string, number>();
  if (jobMongoIds.length === 0) {
    return result;
  }

  const objectIds = jobMongoIds
    .filter((id) => mongoose.Types.ObjectId.isValid(id))
    .map((id) => new mongoose.Types.ObjectId(id));

  if (objectIds.length === 0) {
    return result;
  }

  const rows = await ApplicationModel.aggregate<{
    _id: mongoose.Types.ObjectId;
    count: number;
  }>([
    { $match: { jobId: { $in: objectIds } } },
    { $group: { _id: "$jobId", count: { $sum: 1 } } },
  ]);

  for (const row of rows) {
    result.set(String(row._id), row.count);
  }

  return result;
}

async function loadFilterOptions(): Promise<OperationsJobsFilterOptions> {
  const [categories, cityRows, stateRows] = await Promise.all([
    JobModel.distinct("businessCategory"),
    JobModel.distinct("cityName"),
    JobModel.distinct("stateName"),
  ]);

  const locations = [
    ...new Set(
      [...cityRows, ...stateRows]
        .map((value) => String(value ?? "").trim())
        .filter(Boolean),
    ),
  ].sort((a, b) => a.localeCompare(b));

  return {
    categories: categories
      .map((value) => String(value ?? "").trim())
      .filter(Boolean)
      .sort((a, b) => a.localeCompare(b)),
    locations,
  };
}

async function loadKpisAndCounts(): Promise<{
  kpis: OperationsJobsKpis;
  counts: OperationsJobsTabCounts;
  insights: OperationsJobsInsight[];
}> {
  const [
    statusCounts,
    pendingPaymentJobs,
    expiringSoon,
    lowApplications,
    inactivePaused,
    draftJobs,
  ] = await Promise.all([
    JobModel.aggregate<{ _id: JobStatus; count: number }>([
      { $group: { _id: "$status", count: { $sum: 1 } } },
    ]),
    JobModel.countDocuments({
      listingPaymentStatus: { $in: PENDING_PAYMENT_STATUSES },
    }),
    JobModel.countDocuments({
      listingValidUntil: {
        $ne: null,
        $gte: new Date(),
        $lte: daysFromNow(7),
      },
    }),
    JobModel.countDocuments({
      status: "active",
      applications: { $lte: 5 },
    }),
    JobModel.countDocuments({
      status: "paused",
      $or: [
        { lastStatusChangedAt: { $lte: daysAgo(30) } },
        {
          lastStatusChangedAt: null,
          updatedAt: { $lte: daysAgo(30) },
        },
      ],
    }),
    JobModel.countDocuments({ status: "draft" }),
  ]);

  const countsByStatus = Object.fromEntries(
    JOB_STATUSES.map((status) => [status, 0]),
  ) as Record<JobStatus, number>;

  for (const row of statusCounts) {
    if (row._id in countsByStatus) {
      countsByStatus[row._id] = row.count;
    }
  }

  const totalJobs = Object.values(countsByStatus).reduce(
    (sum, count) => sum + count,
    0,
  );
  const liveJobs = countsByStatus.active;
  const activeJobs = countsByStatus.active + countsByStatus.paused;

  const kpis: OperationsJobsKpis = {
    totalJobs,
    activeJobs,
    pendingPaymentJobs,
    liveJobs,
    expiredJobs: countsByStatus.expired,
    draftJobs: countsByStatus.draft,
  };

  const counts: OperationsJobsTabCounts = {
    all: totalJobs,
    live: liveJobs,
    pending_payment: pendingPaymentJobs,
    expired: countsByStatus.expired,
    drafts: countsByStatus.draft,
  };

  const insights: OperationsJobsInsight[] = [
    {
      id: "expiring-soon",
      label: "Jobs expiring in 7 days",
      count: expiringSoon,
      tab: "live",
    },
    {
      id: "low-applications",
      label: "Jobs with low applications",
      count: lowApplications,
      tab: "live",
    },
    {
      id: "pending-payment",
      label: "Pending payment jobs",
      count: pendingPaymentJobs,
      tab: "pending_payment",
    },
    {
      id: "inactive-30",
      label: "Inactive jobs (30+ days)",
      count: inactivePaused,
      tab: "paused_inactive",
    },
    {
      id: "drafts",
      label: "Draft jobs",
      count: draftJobs,
      tab: "drafts",
    },
  ];

  return { kpis, counts, insights };
}

function toListItem(
  job: JobDocument,
  employer: {
    _id: mongoose.Types.ObjectId;
    companyName?: string;
    accountType?: string;
    companyLogo?: { url?: string } | null;
    profilePhoto?: { url?: string } | null;
    isWhatsappVerified?: boolean;
    registrationStatus?: string;
  } | null,
  applications: number,
  applicationsToday: number,
): OperationsJobListItem {
  const paymentStatus = (JOB_LISTING_PAYMENT_STATUSES as readonly string[]).includes(
    String(job.listingPaymentStatus),
  )
    ? (job.listingPaymentStatus as JobListingPaymentStatus)
    : "paid";

  const cityName = job.cityName?.trim() || "";
  const stateName = job.stateName?.trim() || "";
  const locationLabel = [cityName, stateName].filter(Boolean).join(", ");

  return {
    id: job._id.toString(),
    jobId: job.jobId,
    jobTitle: job.jobTitle?.trim() || "Untitled job",
    jobType: job.jobType || "",
    isFeatured: Boolean(job.isFeatured),
    status: job.status as JobStatus,
    statusLabel: statusLabel(job.status as JobStatus),
    listingPaymentStatus: paymentStatus,
    paymentStatusLabel: paymentStatusLabel(paymentStatus),
    listingPackageLabel: job.listingPackageLabel?.trim() || "",
    listingValidUntil: toIso(job.listingValidUntil),
    businessCategory: job.businessCategory?.trim() || "",
    cityName,
    stateName,
    locationLabel,
    publishedAt: toIso(job.publishedAt),
    createdAt: toIso(job.createdAt) ?? new Date().toISOString(),
    applications,
    applicationsToday,
    employer: {
      id: employer?._id?.toString() ?? String(job.employerId),
      companyName:
        employer?.companyName?.trim() ||
        job.companyName?.trim() ||
        "Unknown employer",
      logoUrl: employer ? resolveEmployerPosterImageUrl(employer) : "",
      isWhatsappVerified: Boolean(employer?.isWhatsappVerified),
      registrationCompleted: employer?.registrationStatus === "completed",
    },
  };
}

export const operationsJobsService = {
  async listJobs(
    query: ListOperationsJobsQuery,
  ): Promise<OperationsJobsListResult> {
    const filter = buildListFilter(query);
    const sort = buildSort(query.sort);
    const skip = (query.page - 1) * query.limit;

    const [jobs, total, summary, filterOptions] = await Promise.all([
      JobModel.find(filter).sort(sort).skip(skip).limit(query.limit),
      JobModel.countDocuments(filter),
      loadKpisAndCounts(),
      loadFilterOptions(),
    ]);

    const jobIds = jobs.map((job) => job._id.toString());
    const employerIds = [
      ...new Set(jobs.map((job) => String(job.employerId))),
    ].filter((id) => mongoose.Types.ObjectId.isValid(id));

    const [applicationTotals, applicationsToday, employers] = await Promise.all(
      [
        loadApplicationTotalsByJobIds(jobIds),
        loadApplicationsTodayByJobIds(jobIds),
        EmployerModel.find({
          _id: {
            $in: employerIds.map((id) => new mongoose.Types.ObjectId(id)),
          },
        })
          .select(
            "companyName accountType companyLogo profilePhoto isWhatsappVerified registrationStatus",
          )
          .lean(),
      ],
    );

    const employersById = new Map(
      employers.map((employer) => [String(employer._id), employer]),
    );

    const pagination = buildListPagination(query.page, query.limit, total);

    return {
      kpis: summary.kpis,
      counts: summary.counts,
      insights: summary.insights,
      filterOptions,
      jobs: jobs.map((job) => {
        const id = job._id.toString();
        return toListItem(
          job,
          employersById.get(String(job.employerId)) ?? null,
          applicationTotals.get(id) ?? job.applications ?? 0,
          applicationsToday.get(id) ?? 0,
        );
      }),
      pagination: {
        ...pagination,
        page: query.page > pagination.totalPages ? pagination.page : query.page,
      },
    };
  },
};
