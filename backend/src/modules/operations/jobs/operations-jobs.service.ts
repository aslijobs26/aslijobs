import mongoose from "mongoose";
import {
  JOB_EDUCATION_LEVELS,
  JOB_EXPERIENCE_LEVELS,
  JOB_GENDERS,
  JOB_LISTING_PAYMENT_STATUSES,
  JOB_STATUSES,
  type JobCreationSource,
  type JobListingPaymentStatus,
  type JobStatus,
  type JobStatusAction,
} from "../../../constants/job.constants.js";
import { HTTP_STATUS } from "../../../constants/http-status.js";
import { AppError } from "../../../middleware/error.middleware.js";
import { buildListPagination } from "../../../utils/pagination.js";
import {
  APPLICATION_STATUS_LABELS,
} from "../../applications/application.constants.js";
import { ApplicationModel } from "../../applications/application.model.js";
import type {
  ApplicationResumeSnapshot,
  ApplicationStatus,
} from "../../applications/application.types.js";
import { resolveEmployerPosterImageUrl } from "../../employers/employer-poster-image.js";
import { EmployerModel } from "../../employers/employer.model.js";
import { JobModel, type JobDocument } from "../../jobs/job.model.js";
import { jobService } from "../../jobs/job.service.js";
import type {
  OperationsJobActivityItem,
  OperationsJobAnalytics,
  OperationsJobApplicationItem,
  OperationsJobApplicationsResult,
  OperationsJobDetail,
  OperationsJobListItem,
  OperationsJobsFilterOptions,
  OperationsJobsInsight,
  OperationsJobsKpis,
  OperationsJobsListResult,
  OperationsJobsTabCounts,
} from "./operations-jobs.types.js";
import type {
  AssignOperationsJobEmployerBody,
  ListOperationsJobApplicationsQuery,
  ListOperationsJobsQuery,
  PublishOperationsJobBody,
  SaveOperationsJobDraftBody,
} from "./operations-jobs.validation.js";

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
  categoryEmployerIds: string[] = [],
): Record<string, unknown> {
  const andClauses: Record<string, unknown>[] = [];

  switch (query.tab) {
    case "live":
      andClauses.push({ status: "active" });
      break;
    case "paused":
      andClauses.push({ status: "paused" });
      break;
    case "draft":
      andClauses.push({ status: "draft" });
      break;
    case "expired":
      andClauses.push({ status: "expired" });
      break;
    case "closed":
      andClauses.push({ status: "closed" });
      break;
    default:
      break;
  }

  // Status dropdown is only applied on the All Status tab so it cannot
  // conflict with a lifecycle tab that already filters by status.
  if (query.status && query.tab === "all") {
    andClauses.push({ status: query.status });
  }

  if (query.paymentStatus) {
    andClauses.push({ listingPaymentStatus: query.paymentStatus });
  }

  if (query.category) {
    const categoryPattern = {
      $regex: `^${escapeRegex(query.category)}$`,
      $options: "i",
    };
    const categoryOr: Record<string, unknown>[] = [
      { businessCategory: categoryPattern },
    ];
    if (categoryEmployerIds.length > 0) {
      const employerObjectIds = categoryEmployerIds.map(
        (id) => new mongoose.Types.ObjectId(id),
      );
      categoryOr.push({ employerId: { $in: employerObjectIds } });
      categoryOr.push({ companyId: { $in: employerObjectIds } });
    }
    andClauses.push({ $or: categoryOr });
  }

  if (query.location) {
    const statePattern = escapeRegex(query.location);
    andClauses.push({
      stateName: { $regex: `^${statePattern}$`, $options: "i" },
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
  const [jobCategories, employerCategories, stateRows] = await Promise.all([
    JobModel.distinct("businessCategory"),
    EmployerModel.distinct("businessCategory"),
    JobModel.distinct("stateName"),
  ]);

  const locations = stateRows
    .map((value) => String(value ?? "").trim())
    .filter(Boolean)
    .sort((a, b) => a.localeCompare(b));

  const categories = [
    ...new Set(
      [...jobCategories, ...employerCategories]
        .map((value) => String(value ?? "").trim())
        .filter(Boolean),
    ),
  ].sort((a, b) => a.localeCompare(b));

  return {
    categories,
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
  // Align with employer dashboard: "active" means live listings only.
  const activeJobs = countsByStatus.active;

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
    paused: countsByStatus.paused,
    draft: countsByStatus.draft,
    expired: countsByStatus.expired,
    closed: countsByStatus.closed,
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
      tab: "draft",
    },
  ];

  return { kpis, counts, insights };
}

type OperationsEmployerListProjection = {
  _id: mongoose.Types.ObjectId;
  companyName?: string;
  accountType?: string;
  companyLogo?: { url?: string } | null;
  profilePhoto?: { url?: string } | null;
  isWhatsappVerified?: boolean;
  registrationStatus?: string;
  businessCategory?: string;
  industry?: string;
};

function resolveBusinessCategory(
  job: JobDocument,
  employer: OperationsEmployerListProjection | null,
): string {
  return (
    job.businessCategory?.trim() ||
    employer?.businessCategory?.trim() ||
    ""
  );
}

function toListItem(
  job: JobDocument,
  employer: OperationsEmployerListProjection | null,
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
    businessCategory: resolveBusinessCategory(job, employer),
    vacancies: job.vacancies ?? 0,
    cityName,
    stateName,
    locationLabel,
    publishedAt: toIso(job.publishedAt),
    createdAt: toIso(job.createdAt) ?? new Date().toISOString(),
    applications,
    applicationsToday,
    employer: {
      id:
        employer?._id?.toString() ??
        (job.employerId ? String(job.employerId) : ""),
      companyName:
        employer?.companyName?.trim() ||
        job.companyName?.trim() ||
        (job.employerId ? "Unknown employer" : "Employer not assigned"),
      logoUrl: employer ? resolveEmployerPosterImageUrl(employer) : "",
      isWhatsappVerified: Boolean(employer?.isWhatsappVerified),
      registrationCompleted: employer?.registrationStatus === "completed",
    },
  };
}

function formatCurrencyAmount(amount: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatSalaryLabel(job: JobDocument): string {
  const period = job.salaryPeriod === "per-year" ? "/year" : "/month";

  if (job.salaryType === "fixed" && typeof job.fixedSalary === "number") {
    return `${formatCurrencyAmount(job.fixedSalary)} ${period}`;
  }

  if (
    typeof job.minimumSalary === "number" &&
    typeof job.maximumSalary === "number"
  ) {
    return `${formatCurrencyAmount(job.minimumSalary)} - ${formatCurrencyAmount(job.maximumSalary)} ${period}`;
  }

  if (typeof job.minimumSalary === "number") {
    return `${formatCurrencyAmount(job.minimumSalary)}+ ${period}`;
  }

  return "";
}

function humanizeToken(value: string): string {
  return value
    .split(/[_-]/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function jobTypeLabel(jobType: string): string {
  switch (jobType) {
    case "full-time":
      return "Full Time";
    case "part-time":
      return "Part Time";
    case "contract":
      return "Contract";
    default:
      return jobType ? humanizeToken(jobType) : "";
  }
}

function workModeLabel(workMode: string): string {
  switch (workMode) {
    case "office":
      return "Office";
    case "field":
      return "Field";
    case "both":
      return "Office + Field";
    case "home":
      return "Work from Home";
    default:
      return workMode ? humanizeToken(workMode) : "";
  }
}

function experienceLabel(experience: string): string {
  switch (experience) {
    case "fresher":
      return "Fresher";
    case "6_month":
      return "6+ Months";
    case "1_year":
      return "1+ Year";
    case "2_year":
      return "2+ Years";
    case "3_year":
      return "3+ Years";
    case "4_year":
      return "4+ Years";
    case "5_year":
      return "5+ Years";
    case "6_year":
      return "6+ Years";
    case "10_year":
      return "10+ Years";
    default:
      return experience && (JOB_EXPERIENCE_LEVELS as readonly string[]).includes(experience)
        ? humanizeToken(experience)
        : experience || "";
  }
}

function educationLabel(levels: string[]): string {
  if (!levels.length) {
    return "Not Required";
  }

  return levels
    .map((level) =>
      (JOB_EDUCATION_LEVELS as readonly string[]).includes(level)
        ? humanizeToken(level)
        : level,
    )
    .join(", ");
}

function genderLabel(genders: string[]): string {
  if (!genders.length) {
    return "Any";
  }

  return genders
    .map((gender) =>
      (JOB_GENDERS as readonly string[]).includes(gender)
        ? humanizeToken(gender)
        : gender,
    )
    .join(", ");
}

function daysRemainingUntil(iso: string | null): number | null {
  if (!iso) {
    return null;
  }

  const expiry = new Date(iso);
  if (Number.isNaN(expiry.getTime())) {
    return null;
  }

  const now = new Date();
  const diffMs = expiry.getTime() - now.getTime();
  return Math.ceil(diffMs / (1000 * 60 * 60 * 24));
}

function resolveStatusFromAction(
  currentStatus: JobStatus,
  action: JobStatusAction,
): JobStatus {
  switch (action) {
    case "publish":
      if (currentStatus !== "draft" && currentStatus !== "paused") {
        throw new AppError(
          "Only draft or paused jobs can be published.",
          HTTP_STATUS.BAD_REQUEST,
        );
      }
      return "active";
    case "pause":
      if (currentStatus !== "active") {
        throw new AppError(
          "Only active jobs can be paused.",
          HTTP_STATUS.BAD_REQUEST,
        );
      }
      return "paused";
    case "resume":
      if (currentStatus !== "paused") {
        throw new AppError(
          "Only paused jobs can be resumed.",
          HTTP_STATUS.BAD_REQUEST,
        );
      }
      return "active";
    case "close":
      if (currentStatus === "closed") {
        throw new AppError("Job is already closed.", HTTP_STATUS.BAD_REQUEST);
      }
      return "closed";
    case "expire":
      return "expired";
    case "reactivate":
      if (currentStatus !== "closed" && currentStatus !== "expired") {
        throw new AppError(
          "Only closed or expired jobs can be reactivated.",
          HTTP_STATUS.BAD_REQUEST,
        );
      }
      return "active";
    default:
      throw new AppError("Unsupported status action.", HTTP_STATUS.BAD_REQUEST);
  }
}

function textValue(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function asResumeSnapshot(value: unknown): ApplicationResumeSnapshot | null {
  if (!value || typeof value !== "object") {
    return null;
  }
  return value as ApplicationResumeSnapshot;
}

function candidateFromSnapshot(snapshot: ApplicationResumeSnapshot | null) {
  const header = snapshot?.resumeJson?.header;
  const contact = snapshot?.resumeJson?.sections?.contact;
  const sections = snapshot?.resumeJson?.sections;

  const fullName =
    textValue(header?.fullName) || textValue(contact?.fullName) || "Candidate";
  const phone = textValue(header?.phone) || textValue(contact?.phone);
  const city = textValue(header?.city) || textValue(contact?.city);
  const state = textValue(header?.state) || textValue(contact?.state);
  const headline =
    textValue(sections?.professionalHeadline) || textValue(header?.headline);
  const location =
    [city, state].filter(Boolean).join(", ") || textValue(header?.location);
  const experienceLabelValue = sections?.isFresher
    ? "Fresher"
    : textValue(sections?.experienceLabel) || headline || "Experienced";
  const skills = Array.isArray(sections?.skills)
    ? sections.skills.map((item) => textValue(item)).filter(Boolean)
    : [];

  return {
    fullName,
    phone,
    location,
    headline,
    experienceLabel: experienceLabelValue,
    skills,
  };
}

function applicationStatusLabel(status: ApplicationStatus | string): string {
  if (status === "submitted") {
    return "New";
  }

  if (status in APPLICATION_STATUS_LABELS) {
    return APPLICATION_STATUS_LABELS[status as ApplicationStatus];
  }

  return humanizeToken(String(status));
}

function buildActivity(job: JobDocument): OperationsJobActivityItem[] {
  const events: OperationsJobActivityItem[] = [];

  const createdAt = toIso(job.createdAt);
  if (createdAt) {
    events.push({
      id: "created",
      type: "created",
      label: "Job created",
      at: createdAt,
    });
  }

  const publishedAt = toIso(job.publishedAt);
  if (publishedAt) {
    events.push({
      id: "published",
      type: "published",
      label: "Job published",
      at: publishedAt,
    });
  }

  const reactivatedAt = toIso(job.reactivatedAt);
  if (reactivatedAt) {
    events.push({
      id: "reactivated",
      type: "reactivated",
      label: "Job reactivated",
      at: reactivatedAt,
    });
  }

  const lastStatusChangedAt = toIso(job.lastStatusChangedAt);
  if (lastStatusChangedAt) {
    events.push({
      id: "status-changed",
      type: "status_changed",
      label: `Status set to ${statusLabel(job.status as JobStatus)}`,
      at: lastStatusChangedAt,
    });
  }

  const lastEditedAt = toIso(job.lastEditedAt ?? job.updatedAt);
  if (lastEditedAt) {
    events.push({
      id: "edited",
      type: "edited",
      label: "Job details updated",
      at: lastEditedAt,
    });
  }

  return events.sort(
    (a, b) => new Date(b.at).getTime() - new Date(a.at).getTime(),
  );
}

function toDetail(
  job: JobDocument,
  employer: OperationsEmployerListProjection | null,
  applications: number,
  applicationsToday: number,
  shortlisted: number,
  hired: number,
): OperationsJobDetail {
  const paymentStatus = (JOB_LISTING_PAYMENT_STATUSES as readonly string[]).includes(
    String(job.listingPaymentStatus),
  )
    ? (job.listingPaymentStatus as JobListingPaymentStatus)
    : "paid";

  const cityName = job.cityName?.trim() || "";
  const stateName = job.stateName?.trim() || "";
  const locationLabel = [cityName, stateName].filter(Boolean).join(", ");
  const listingValidUntil = toIso(job.listingValidUntil);
  const views = job.views ?? 0;
  const applicationRatePercent =
    views > 0 ? Math.round((applications / views) * 1000) / 10 : null;

  const analytics: OperationsJobAnalytics = {
    views,
    applications,
    applicationRatePercent,
    shares: job.shares ?? 0,
    bookmarks: job.bookmarks ?? 0,
    shortlisted,
    interviews: job.interviews ?? 0,
    hired,
    applicationsToday,
    daysRemaining: daysRemainingUntil(listingValidUntil),
    autoExpiryAt: listingValidUntil,
  };

  const status = job.status as JobStatus;

  return {
    id: job._id.toString(),
    jobId: job.jobId,
    employerId: job.employerId ? String(job.employerId) : "",
    companyId: job.companyId ? String(job.companyId) : "",
    companyName: job.companyName?.trim() || "",
    industry: job.industry?.trim() || "",
    businessCategory: resolveBusinessCategory(job, employer),
    companySize: job.companySize?.trim() || "",
    jobTitle: job.jobTitle?.trim() || "Untitled job",
    jobType: job.jobType || "",
    contractPeriodFrom: job.contractPeriodFrom || "",
    contractPeriodTo: job.contractPeriodTo || "",
    partTimeSchedule: job.partTimeSchedule || "",
    partTimeStartTime: job.partTimeStartTime || "",
    partTimeEndTime: job.partTimeEndTime || "",
    partTimeFlexibleHours: job.partTimeFlexibleHours || "",
    workMode: job.workMode || "",
    vacancies: job.vacancies ?? 0,
    description: job.description || "",
    state: job.state || "",
    stateName,
    city: job.city || "",
    cityName,
    address: job.address || "",
    landmark: job.landmark || "",
    locationLabel,
    salaryType: job.salaryType || "",
    salaryPeriod: job.salaryPeriod || "per-month",
    fixedSalary: job.fixedSalary ?? null,
    minimumSalary: job.minimumSalary ?? null,
    maximumSalary: job.maximumSalary ?? null,
    salaryLabel: formatSalaryLabel(job),
    perks: Array.isArray(job.perks) ? job.perks.map(String) : [],
    education: Array.isArray(job.education) ? job.education.map(String) : [],
    educationLabel: educationLabel(
      Array.isArray(job.education) ? job.education.map(String) : [],
    ),
    experience: job.experience || "",
    experienceLabel: experienceLabel(job.experience || ""),
    languages: Array.isArray(job.languages) ? job.languages.map(String) : [],
    gender: Array.isArray(job.gender) ? job.gender.map(String) : [],
    genderLabel: genderLabel(
      Array.isArray(job.gender) ? job.gender.map(String) : [],
    ),
    minimumAge: job.minimumAge ?? null,
    maximumAge: job.maximumAge ?? null,
    walkInEnabled: Boolean(job.walkInEnabled),
    interviewAddress: job.interviewAddress || "",
    walkInStartDate: job.walkInStartDate || "",
    walkInEndDate: job.walkInEndDate || "",
    walkInStartTime: job.walkInStartTime || "",
    walkInEndTime: job.walkInEndTime || "",
    interviewInstructions: job.interviewInstructions || "",
    contactPersonName: job.contactPersonName || "",
    contactEmail: job.contactEmail || "",
    contactMobile: job.contactMobile || "",
    status,
    statusLabel: statusLabel(status),
    listingPaymentStatus: paymentStatus,
    paymentStatusLabel: paymentStatusLabel(paymentStatus),
    listingPackageLabel: job.listingPackageLabel?.trim() || "",
    listingValidUntil,
    isFeatured: Boolean(job.isFeatured),
    visibilityLabel: status === "draft" ? "Draft" : "Public",
    jobTypeLabel: jobTypeLabel(job.jobType || ""),
    workModeLabel: workModeLabel(job.workMode || ""),
    completedStep: job.completedStep ?? 1,
    lastEditedAt: toIso(job.lastEditedAt ?? job.updatedAt),
    publishedAt: toIso(job.publishedAt),
    reactivatedAt: toIso(job.reactivatedAt),
    lastStatusChangedAt: toIso(job.lastStatusChangedAt),
    createdAt: toIso(job.createdAt) ?? new Date().toISOString(),
    updatedAt: toIso(job.updatedAt) ?? new Date().toISOString(),
    wizardSnapshot: job.wizardSnapshot ?? null,
    creationSource: (job.creationSource ?? "employer") as JobCreationSource,
    employerAssigned: Boolean(job.employerId),
    employer: {
      id:
        employer?._id?.toString() ??
        (job.employerId ? String(job.employerId) : ""),
      companyName:
        employer?.companyName?.trim() ||
        job.companyName?.trim() ||
        (job.employerId ? "Unknown employer" : "Employer not assigned"),
      logoUrl: employer ? resolveEmployerPosterImageUrl(employer) : "",
      isWhatsappVerified: Boolean(employer?.isWhatsappVerified),
      registrationCompleted: employer?.registrationStatus === "completed",
    },
    analytics,
    activity: buildActivity(job),
  };
}

async function findJobByPublicId(publicJobId: string): Promise<JobDocument> {
  const normalized = publicJobId.trim().toUpperCase();
  const job = await JobModel.findOne({ jobId: normalized });

  if (!job) {
    throw new AppError("Job not found.", HTTP_STATUS.NOT_FOUND);
  }

  return job;
}

async function loadApplicationStatusCounts(
  jobMongoId: string,
): Promise<{ shortlisted: number; hired: number; total: number }> {
  if (!mongoose.Types.ObjectId.isValid(jobMongoId)) {
    return { shortlisted: 0, hired: 0, total: 0 };
  }

  const rows = await ApplicationModel.aggregate<{
    _id: ApplicationStatus;
    count: number;
  }>([
    { $match: { jobId: new mongoose.Types.ObjectId(jobMongoId) } },
    { $group: { _id: "$status", count: { $sum: 1 } } },
  ]);

  let shortlisted = 0;
  let hired = 0;
  let total = 0;

  for (const row of rows) {
    total += row.count;
    if (row._id === "shortlisted") {
      shortlisted = row.count;
    }
    if (row._id === "joined" || row._id === "selected") {
      hired += row.count;
    }
  }

  return { shortlisted, hired, total };
}

export const operationsJobsService = {
  async listJobs(
    query: ListOperationsJobsQuery,
  ): Promise<OperationsJobsListResult> {
    const categoryEmployerIds = query.category
      ? (
          await EmployerModel.find({
            businessCategory: {
              $regex: `^${escapeRegex(query.category)}$`,
              $options: "i",
            },
          })
            .select("_id")
            .lean()
        ).map((employer) => String(employer._id))
      : [];

    const filter = buildListFilter(query, categoryEmployerIds);
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
      ...new Set(
        jobs.flatMap((job) => [
          String(job.employerId ?? ""),
          String(job.companyId ?? ""),
        ]),
      ),
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
            "companyName accountType companyLogo profilePhoto isWhatsappVerified registrationStatus businessCategory industry",
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
        const employer =
          employersById.get(String(job.employerId ?? "")) ??
          employersById.get(String(job.companyId ?? "")) ??
          null;
        return toListItem(
          job,
          employer,
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

  async getJobDetail(publicJobId: string): Promise<OperationsJobDetail> {
    const job = await findJobByPublicId(publicJobId);
    const jobMongoId = job._id.toString();
    const employerLookupId =
      (job.employerId && String(job.employerId)) ||
      (job.companyId && String(job.companyId)) ||
      "";

    const [employer, applicationsTodayMap, statusCounts] = await Promise.all([
      employerLookupId && mongoose.Types.ObjectId.isValid(employerLookupId)
        ? EmployerModel.findById(employerLookupId)
            .select(
              "companyName accountType companyLogo profilePhoto isWhatsappVerified registrationStatus businessCategory industry",
            )
            .lean()
        : Promise.resolve(null),
      loadApplicationsTodayByJobIds([jobMongoId]),
      loadApplicationStatusCounts(jobMongoId),
    ]);

    return toDetail(
      job,
      employer,
      statusCounts.total || job.applications || 0,
      applicationsTodayMap.get(jobMongoId) ?? 0,
      statusCounts.shortlisted || job.shortlisted || 0,
      statusCounts.hired || job.hired || 0,
    );
  },

  async listJobApplications(
    publicJobId: string,
    query: ListOperationsJobApplicationsQuery,
  ): Promise<OperationsJobApplicationsResult> {
    const job = await findJobByPublicId(publicJobId);
    const match: Record<string, unknown> = {
      jobId: job._id,
    };

    if (query.status) {
      match.status = query.status;
    }

    const search = query.search.trim();
    const andFilters: Record<string, unknown>[] = [];

    if (search) {
      const pattern = escapeRegex(search);
      andFilters.push({
        $or: [
          {
            "resumeSnapshot.resumeJson.header.fullName": {
              $regex: pattern,
              $options: "i",
            },
          },
          {
            "resumeSnapshot.resumeJson.sections.contact.fullName": {
              $regex: pattern,
              $options: "i",
            },
          },
          {
            "resumeSnapshot.resumeJson.header.phone": {
              $regex: pattern,
              $options: "i",
            },
          },
        ],
      });
    }

    const pipeline: mongoose.PipelineStage[] = [{ $match: match }];

    if (andFilters.length > 0) {
      pipeline.push({ $match: { $and: andFilters } });
    }

    pipeline.push({ $sort: { appliedAt: -1 } });
    pipeline.push({
      $facet: {
        items: [
          { $skip: (query.page - 1) * query.limit },
          { $limit: query.limit },
        ],
        totalCount: [{ $count: "count" }],
      },
    });

    const [facet] = await ApplicationModel.aggregate<{
      items: Array<{
        _id: mongoose.Types.ObjectId;
        publicJobId: string;
        status: ApplicationStatus | string;
        resumeVersion: number;
        resumeStatus: string;
        resumeSource?: string;
        resumeSnapshot: unknown;
        appliedAt: Date;
        updatedAt?: Date;
      }>;
      totalCount: Array<{ count: number }>;
    }>(pipeline);

    const total = facet?.totalCount?.[0]?.count ?? 0;
    const applications: OperationsJobApplicationItem[] = (facet?.items ?? []).map(
      (app) => {
        const candidate = candidateFromSnapshot(asResumeSnapshot(app.resumeSnapshot));

        return {
          id: app._id.toString(),
          publicJobId: app.publicJobId,
          candidateName: candidate.fullName,
          candidateHeadline: candidate.headline,
          candidateLocation: candidate.location,
          candidatePhone: candidate.phone,
          candidateExperienceLabel: candidate.experienceLabel,
          candidateSkills: candidate.skills.slice(0, 8),
          status: app.status as ApplicationStatus,
          statusLabel: applicationStatusLabel(app.status),
          resumeVersion: app.resumeVersion,
          resumeStatus: app.resumeStatus,
          appliedAt: app.appliedAt.toISOString(),
          updatedAt: app.updatedAt ? app.updatedAt.toISOString() : null,
          sourceLabel:
            app.resumeSource === "uploaded" ? "Uploaded Resume" : "Website",
        };
      },
    );

    return {
      applications,
      pagination: buildListPagination(query.page, query.limit, total),
    };
  },

  async updateJobStatus(
    publicJobId: string,
    action: JobStatusAction,
  ): Promise<OperationsJobDetail> {
    const job = await findJobByPublicId(publicJobId);

    if (action === "publish" && !job.employerId) {
      throw new AppError(
        "Assign an employer before publishing this job.",
        HTTP_STATUS.BAD_REQUEST,
      );
    }

    const nextStatus = resolveStatusFromAction(job.status as JobStatus, action);
    const now = new Date();

    const $set: Record<string, unknown> = {
      status: nextStatus,
      lastStatusChangedAt: now,
    };

    if (action === "reactivate") {
      $set.publishedAt = now;
      $set.reactivatedAt = now;
    } else if (action === "publish") {
      $set.publishedAt = now;
      if (
        job.listingPaymentStatus === "pending" ||
        job.listingPaymentStatus === "unpaid"
      ) {
        $set.listingPaymentStatus = "paid";
      }
    }

    const updateResult = await JobModel.updateOne({ _id: job._id }, { $set });

    if (updateResult.matchedCount === 0) {
      throw new AppError("Job not found.", HTTP_STATUS.NOT_FOUND);
    }

    return this.getJobDetail(job.jobId);
  },

  async createDraft(
    operationsUserId: string,
    body: SaveOperationsJobDraftBody,
  ): Promise<OperationsJobDetail> {
    const result = await jobService.createOperationsDraft(
      operationsUserId,
      {
        completedStep: body.completedStep,
        wizardSnapshot: body.wizardSnapshot,
      },
      body.employerId ?? null,
    );

    return this.getJobDetail(result.job.jobId);
  },

  async updateDraft(
    operationsUserId: string,
    publicJobId: string,
    body: SaveOperationsJobDraftBody,
  ): Promise<OperationsJobDetail> {
    await jobService.updateOperationsDraft(
      operationsUserId,
      publicJobId,
      {
        completedStep: body.completedStep,
        wizardSnapshot: body.wizardSnapshot,
      },
      body.employerId ?? null,
    );

    return this.getJobDetail(publicJobId);
  },

  async assignEmployer(
    operationsUserId: string,
    publicJobId: string,
    body: AssignOperationsJobEmployerBody,
  ): Promise<OperationsJobDetail> {
    await jobService.assignOperationsJobEmployer(
      operationsUserId,
      publicJobId,
      body.employerId,
    );

    return this.getJobDetail(publicJobId);
  },

  async publishDraft(
    operationsUserId: string,
    publicJobId: string,
    body: PublishOperationsJobBody,
  ): Promise<OperationsJobDetail> {
    await jobService.publishOperationsDraft(
      operationsUserId,
      publicJobId,
      body,
    );

    return this.getJobDetail(publicJobId);
  },
};
