import mongoose from "mongoose";
import {
  JOB_STATUSES,
  type JobStatus,
  type JobStatusAction,
  type SalaryPeriod,
} from "../../constants/job.constants.js";
import { HTTP_STATUS } from "../../constants/http-status.js";
import { AppError } from "../../middleware/error.middleware.js";
import { EmployerModel } from "../employers/employer.model.js";
import { ApplicationModel } from "../applications/application.model.js";
import { JobCounterModel } from "./job-counter.model.js";
import { JobModel, type JobDocument } from "./job.model.js";
import { jobViewService } from "./job-view.service.js";
import {
  emptyEmployerJobApplicationMetrics,
  loadEmployerApplicationMetricsTotals,
  loadEmployerJobApplicationMetricsByJobIds,
  type EmployerJobApplicationMetrics,
} from "./employer-job-application-metrics.js";
import type {
  CreateJobInput,
  DraftWizardSnapshot,
  ListEmployerJobsQuery,
  PublicJobsQuery,
  SaveDraftJobInput,
  SimilarPublicJobsQuery,
} from "./job.validation.js";

const UNTITLED_DRAFT_TITLE = "Untitled draft";

async function getAppliedJobMongoIdSet(
  jobSeekerId: string | undefined,
  jobMongoIds: string[],
): Promise<Set<string>> {
  if (
    !jobSeekerId ||
    !mongoose.Types.ObjectId.isValid(jobSeekerId) ||
    jobMongoIds.length === 0
  ) {
    return new Set();
  }

  const validIds = jobMongoIds.filter((id) =>
    mongoose.Types.ObjectId.isValid(id),
  );
  if (validIds.length === 0) {
    return new Set();
  }

  const rows = await ApplicationModel.find({
    jobSeekerId: new mongoose.Types.ObjectId(jobSeekerId),
    jobId: {
      $in: validIds.map((id) => new mongoose.Types.ObjectId(id)),
    },
  })
    .select("jobId")
    .lean();

  return new Set(
    rows.map((row) => {
      const jobId = row.jobId;
      return jobId instanceof mongoose.Types.ObjectId
        ? jobId.toString()
        : String(jobId);
    }),
  );
}

function toIsoDateString(value: Date | string | null | undefined): string | null {
  if (!value) {
    return null;
  }

  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return date.toISOString();
}

function normalizeSalaryPeriod(value: unknown): SalaryPeriod {
  return value === "per-year" ? "per-year" : "per-month";
}

function toJobPublic(
  job: JobDocument,
  metrics?: EmployerJobApplicationMetrics,
) {
  return {
    id: job._id.toString(),
    jobId: job.jobId,
    employerId: job.employerId.toString(),
    companyId: job.companyId.toString(),
    companyName: job.companyName,
    industry: job.industry ?? "",
    businessCategory: job.businessCategory ?? "",
    companySize: job.companySize ?? "",
    jobTitle: job.jobTitle,
    jobType: job.jobType,
    contractPeriodFrom: job.contractPeriodFrom,
    contractPeriodTo: job.contractPeriodTo,
    partTimeSchedule: job.partTimeSchedule,
    partTimeStartTime: job.partTimeStartTime,
    partTimeEndTime: job.partTimeEndTime,
    partTimeFlexibleHours: job.partTimeFlexibleHours,
    workMode: job.workMode,
    vacancies: job.vacancies,
    description: job.description,
    state: job.state,
    stateName: job.stateName,
    city: job.city,
    cityName: job.cityName,
    address: job.address,
    landmark: job.landmark,
    salaryType: job.salaryType,
    salaryPeriod: normalizeSalaryPeriod(job.salaryPeriod),
    fixedSalary: job.fixedSalary,
    minimumSalary: job.minimumSalary,
    maximumSalary: job.maximumSalary,
    perks: job.perks,
    education: job.education,
    experience: job.experience,
    languages: job.languages,
    gender: job.gender,
    minimumAge: job.minimumAge,
    maximumAge: job.maximumAge,
    walkInEnabled: job.walkInEnabled,
    interviewAddress: job.interviewAddress,
    walkInStartDate: job.walkInStartDate,
    walkInEndDate: job.walkInEndDate,
    walkInStartTime: job.walkInStartTime,
    walkInEndTime: job.walkInEndTime,
    interviewInstructions: job.interviewInstructions,
    contactPersonName: job.contactPersonName,
    contactEmail: job.contactEmail,
    contactMobile: job.contactMobile,
    status: job.status,
    publishedAt: toIsoDateString(job.publishedAt),
    completedStep: job.completedStep ?? 1,
    lastEditedAt: job.lastEditedAt ?? job.updatedAt,
    wizardSnapshot: job.wizardSnapshot ?? null,
    applications: metrics?.applications ?? job.applications ?? 0,
    shortlisted: metrics?.shortlisted ?? 0,
    interviews: job.interviews,
    hired: metrics?.hired ?? 0,
    views: job.views,
    bookmarks: job.bookmarks,
    shares: job.shares,
    createdBy: job.createdBy.toString(),
    createdAt: job.createdAt,
    updatedAt: job.updatedAt,
  };
}

function toEmployerJobListItem(
  job: JobDocument,
  metrics?: EmployerJobApplicationMetrics,
) {
  const applicationMetrics = metrics ?? emptyEmployerJobApplicationMetrics();

  return {
    id: job._id.toString(),
    jobId: job.jobId,
    jobTitle: job.jobTitle,
    jobType: job.jobType,
    vacancies: job.vacancies,
    city: job.city,
    cityName: job.cityName,
    state: job.state,
    stateName: job.stateName,
    applications: applicationMetrics.applications,
    shortlisted: applicationMetrics.shortlisted,
    interviews: job.interviews,
    hired: applicationMetrics.hired,
    views: job.views,
    status: job.status,
    publishedAt: toIsoDateString(job.publishedAt),
    createdAt: job.createdAt,
    updatedAt: job.updatedAt,
  };
}

function toOptionalNumber(value: string): number | null {
  const trimmed = value.trim().replace(/[^\d.]/g, "");
  if (!trimmed) {
    return null;
  }

  const parsed = Number(trimmed);
  return Number.isFinite(parsed) ? parsed : null;
}

function toLocationSlug(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function denormalizeDraftFields(snapshot: DraftWizardSnapshot) {
  const { jobInformation, locationAndSalary, candidateAndInterview } = snapshot;
  const vacanciesParsed = Number(jobInformation.vacancies.trim());
  const walkInEnabled = candidateAndInterview.walkIn === "yes";

  return {
    companyName: jobInformation.companyDetails.trim(),
    industry: (jobInformation.industry ?? "").trim(),
    businessCategory: (jobInformation.businessCategory ?? "").trim(),
    companySize: (jobInformation.companySize ?? "").trim(),
    jobTitle: jobInformation.jobTitle.trim() || UNTITLED_DRAFT_TITLE,
    jobType: jobInformation.jobType,
    contractPeriodFrom: jobInformation.contractPeriodFrom,
    contractPeriodTo: jobInformation.contractPeriodTo,
    partTimeSchedule: jobInformation.partTimeSchedule,
    partTimeStartTime: jobInformation.partTimeStartTime,
    partTimeEndTime: jobInformation.partTimeEndTime,
    partTimeFlexibleHours: jobInformation.partTimeFlexibleHours,
    workMode: jobInformation.workMode,
    vacancies:
      Number.isFinite(vacanciesParsed) && vacanciesParsed > 0
        ? vacanciesParsed
        : 1,
    description: jobInformation.jobDescription.trim(),
    state:
      toLocationSlug(locationAndSalary.state) || locationAndSalary.state.trim(),
    stateName: locationAndSalary.state.trim(),
    city: toLocationSlug(locationAndSalary.city) || locationAndSalary.city.trim(),
    cityName: locationAndSalary.city.trim(),
    address: locationAndSalary.address.trim(),
    landmark: locationAndSalary.landmark.trim(),
    salaryType: locationAndSalary.salaryType,
    salaryPeriod: normalizeSalaryPeriod(locationAndSalary.salaryPeriod),
    fixedSalary:
      locationAndSalary.salaryType === "fixed"
        ? toOptionalNumber(locationAndSalary.incentives)
        : null,
    minimumSalary:
      locationAndSalary.salaryType === "range"
        ? toOptionalNumber(locationAndSalary.salaryMin)
        : null,
    maximumSalary:
      locationAndSalary.salaryType === "range"
        ? toOptionalNumber(locationAndSalary.salaryMax)
        : null,
    perks: locationAndSalary.perks,
    education: candidateAndInterview.education,
    experience: candidateAndInterview.experienceRequired,
    languages: candidateAndInterview.additionalRequirements.language
      ? candidateAndInterview.languages
      : [],
    gender: candidateAndInterview.additionalRequirements.gender
      ? candidateAndInterview.gender
      : [],
    minimumAge: candidateAndInterview.additionalRequirements.age
      ? toOptionalNumber(candidateAndInterview.ageMin)
      : null,
    maximumAge: candidateAndInterview.additionalRequirements.age
      ? toOptionalNumber(candidateAndInterview.ageMax)
      : null,
    walkInEnabled,
    interviewAddress: walkInEnabled
      ? candidateAndInterview.walkInAddress.trim()
      : "",
    walkInStartDate: walkInEnabled
      ? candidateAndInterview.walkInStartDate
      : "",
    walkInEndDate: walkInEnabled ? candidateAndInterview.walkInEndDate : "",
    walkInStartTime: walkInEnabled
      ? candidateAndInterview.walkInStartTime
      : "",
    walkInEndTime: walkInEnabled ? candidateAndInterview.walkInEndTime : "",
    interviewInstructions: candidateAndInterview.otherInstructions.trim(),
    contactPersonName: candidateAndInterview.contactName.trim(),
    contactEmail: candidateAndInterview.contactEmail.trim(),
    contactMobile: candidateAndInterview.contactMobile.trim(),
  };
}

function applyCreateInputToJob(job: JobDocument, input: CreateJobInput) {
  job.companyName = input.companyName;
  job.industry = input.industry ?? "";
  job.businessCategory = input.businessCategory ?? "";
  job.companySize = input.companySize ?? "";
  job.jobTitle = input.jobTitle;
  job.jobType = input.jobType;
  job.contractPeriodFrom =
    input.jobType === "contract" ? input.contractPeriodFrom : "";
  job.contractPeriodTo =
    input.jobType === "contract" ? input.contractPeriodTo : "";
  job.partTimeSchedule =
    input.jobType === "part-time" ? input.partTimeSchedule : "";
  job.partTimeStartTime =
    input.jobType === "part-time" ? input.partTimeStartTime : "";
  job.partTimeEndTime =
    input.jobType === "part-time" ? input.partTimeEndTime : "";
  job.partTimeFlexibleHours =
    input.jobType === "part-time" ? input.partTimeFlexibleHours : "";
  job.workMode = input.workMode;
  job.vacancies = input.vacancies;
  job.description = input.description;
  job.state = input.state;
  job.stateName = input.stateName;
  job.city = input.city;
  job.cityName = input.cityName;
  job.address = input.address;
  job.landmark = input.landmark;
  job.salaryType = input.salaryType;
  job.salaryPeriod = input.salaryPeriod;
  job.fixedSalary = input.salaryType === "fixed" ? input.fixedSalary : null;
  job.minimumSalary =
    input.salaryType === "range" ? input.minimumSalary : null;
  job.maximumSalary =
    input.salaryType === "range" ? input.maximumSalary : null;
  job.perks = input.perks;
  job.education = input.education;
  job.experience = input.experience;
  job.languages = input.languages;
  job.gender = input.gender;
  job.minimumAge = input.minimumAge;
  job.maximumAge = input.maximumAge;
  job.walkInEnabled = input.walkInEnabled;
  job.interviewAddress = input.walkInEnabled ? input.interviewAddress : "";
  job.walkInStartDate = input.walkInEnabled ? input.walkInStartDate : "";
  job.walkInEndDate = input.walkInEnabled ? input.walkInEndDate : "";
  job.walkInStartTime = input.walkInEnabled ? input.walkInStartTime : "";
  job.walkInEndTime = input.walkInEnabled ? input.walkInEndTime : "";
  job.interviewInstructions = input.interviewInstructions;
  job.contactPersonName = input.contactPersonName;
  job.contactEmail = input.contactEmail;
  job.contactMobile = input.contactMobile;
}

async function generateJobId(): Promise<string> {
  const year = new Date().getFullYear();
  const counterId = `job_${year}`;

  const counter = await JobCounterModel.findByIdAndUpdate(
    counterId,
    { $inc: { sequence: 1 } },
    { upsert: true, new: true, setDefaultsOnInsert: true },
  );

  const sequence = counter?.sequence ?? 1;
  return `AJ-${year}-${String(sequence).padStart(6, "0")}`;
}

function resolveStatusFromAction(
  currentStatus: JobStatus,
  action: JobStatusAction,
): JobStatus {
  switch (action) {
    case "publish":
      if (currentStatus !== "draft" && currentStatus !== "paused") {
        throw new AppError(
          "Only draft or paused jobs can be published",
          HTTP_STATUS.BAD_REQUEST,
        );
      }
      return "active";
    case "pause":
      if (currentStatus !== "active") {
        throw new AppError(
          "Only active jobs can be paused",
          HTTP_STATUS.BAD_REQUEST,
        );
      }
      return "paused";
    case "resume":
      if (currentStatus !== "paused") {
        throw new AppError(
          "Only paused jobs can be resumed",
          HTTP_STATUS.BAD_REQUEST,
        );
      }
      return "active";
    case "close":
      if (currentStatus === "closed" || currentStatus === "expired") {
        throw new AppError(
          "Job is already closed or expired",
          HTTP_STATUS.BAD_REQUEST,
        );
      }
      return "closed";
    case "expire":
      return "expired";
    case "reactivate":
      if (currentStatus !== "closed") {
        throw new AppError(
          "Only closed jobs can be reactivated",
          HTTP_STATUS.BAD_REQUEST,
        );
      }
      return "active";
    default:
      throw new AppError("Invalid status action", HTTP_STATUS.BAD_REQUEST);
  }
}

function buildSearchFilter(search: string) {
  const trimmed = search.trim();
  if (!trimmed) {
    return {};
  }

  const escaped = trimmed.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const regex = new RegExp(escaped, "i");

  return {
    $or: [
      { jobTitle: regex },
      { companyName: regex },
      { jobId: regex },
      { city: regex },
      { cityName: regex },
      { state: regex },
      { stateName: regex },
      { address: regex },
    ],
  };
}

function startOfLocalDay(date: Date): Date {
  const next = new Date(date);
  next.setHours(0, 0, 0, 0);
  return next;
}

function endOfLocalDay(date: Date): Date {
  const next = new Date(date);
  next.setHours(23, 59, 59, 999);
  return next;
}

function parseIsoDateOnly(value: string): Date | null {
  const trimmed = value.trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    return null;
  }
  const parsed = new Date(`${trimmed}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) {
    return null;
  }
  return parsed;
}

function resolveEmployerJobsPostedRange(
  query: ListEmployerJobsQuery,
  nowInput: Date = new Date(),
): { from?: Date; to?: Date } | null {
  const now = new Date(nowInput);

  if (!query.postedQuick) {
    return null;
  }

  if (query.postedQuick === "custom") {
    const fromRaw = parseIsoDateOnly(query.postedFrom);
    const toRaw = parseIsoDateOnly(query.postedTo);
    if (!fromRaw && !toRaw) {
      return null;
    }
    return {
      from: fromRaw ? startOfLocalDay(fromRaw) : undefined,
      to: toRaw ? endOfLocalDay(toRaw) : undefined,
    };
  }

  switch (query.postedQuick) {
    case "today":
      return {
        from: startOfLocalDay(now),
        to: endOfLocalDay(now),
      };
    case "last_7_days": {
      const from = new Date(now);
      from.setDate(from.getDate() - 6);
      return {
        from: startOfLocalDay(from),
        to: endOfLocalDay(now),
      };
    }
    case "last_30_days": {
      const from = new Date(now);
      from.setDate(from.getDate() - 29);
      return {
        from: startOfLocalDay(from),
        to: endOfLocalDay(now),
      };
    }
    case "last_90_days": {
      const from = new Date(now);
      from.setDate(from.getDate() - 89);
      return {
        from: startOfLocalDay(from),
        to: endOfLocalDay(now),
      };
    }
    default:
      return null;
  }
}

function buildPostedDateFilter(from?: Date, to?: Date) {
  if (!from && !to) {
    return {};
  }

  const comparisons: Record<string, unknown>[] = [];
  if (from) {
    comparisons.push({
      $gte: [{ $ifNull: ["$publishedAt", "$createdAt"] }, from],
    });
  }
  if (to) {
    comparisons.push({
      $lte: [{ $ifNull: ["$publishedAt", "$createdAt"] }, to],
    });
  }

  return {
    $expr: {
      $and: comparisons,
    },
  };
}

function buildApplicationsBandFilter(
  bands: ListEmployerJobsQuery["applications"],
) {
  if (!bands || bands.length === 0) {
    return {};
  }

  const clauses: Record<string, unknown>[] = [];

  for (const band of bands) {
    switch (band) {
      case "0":
        clauses.push({ applications: 0 });
        break;
      case "1-10":
        clauses.push({ applications: { $gte: 1, $lte: 10 } });
        break;
      case "11-25":
        clauses.push({ applications: { $gte: 11, $lte: 25 } });
        break;
      case "26-50":
        clauses.push({ applications: { $gte: 26, $lte: 50 } });
        break;
      case "51+":
        clauses.push({ applications: { $gte: 51 } });
        break;
      default:
        break;
    }
  }

  if (clauses.length === 0) {
    return {};
  }

  if (clauses.length === 1) {
    return clauses[0];
  }

  return { $or: clauses };
}

function buildEmployerJobsAdvancedFilter(query: ListEmployerJobsQuery) {
  const andClauses: Record<string, unknown>[] = [];

  if (query.jobId) {
    andClauses.push({ jobId: query.jobId });
  }

  if (query.jobType.length > 0) {
    andClauses.push({ jobType: { $in: query.jobType } });
  }

  if (query.workMode.length > 0) {
    andClauses.push({ workMode: { $in: query.workMode } });
  }

  if (query.experience.length > 0) {
    andClauses.push({ experience: { $in: query.experience } });
  }

  if (query.city.length === 1) {
    andClauses.push({ city: query.city[0] });
  } else if (query.city.length > 1) {
    andClauses.push({ city: { $in: query.city } });
  }

  if (query.state) {
    andClauses.push({ state: query.state });
  }

  if (query.businessCategory.length > 0) {
    andClauses.push({
      businessCategory: { $in: query.businessCategory },
    });
  }

  const salaryFilter = buildSalaryFilter(query.minSalary, query.maxSalary);
  if (Object.keys(salaryFilter).length > 0) {
    andClauses.push(salaryFilter);
  }

  const postedRange = resolveEmployerJobsPostedRange(query);
  if (postedRange) {
    const postedFilter = buildPostedDateFilter(postedRange.from, postedRange.to);
    if (Object.keys(postedFilter).length > 0) {
      andClauses.push(postedFilter);
    }
  }

  const applicationsFilter = buildApplicationsBandFilter(query.applications);
  if (Object.keys(applicationsFilter).length > 0) {
    andClauses.push(applicationsFilter);
  }

  if (
    query.minVacancies !== undefined ||
    query.maxVacancies !== undefined
  ) {
    const vacanciesFilter: Record<string, number> = {};
    if (query.minVacancies !== undefined) {
      vacanciesFilter.$gte = query.minVacancies;
    }
    if (query.maxVacancies !== undefined) {
      vacanciesFilter.$lte = query.maxVacancies;
    }
    andClauses.push({ vacancies: vacanciesFilter });
  }

  return andClauses.filter((clause) => Object.keys(clause).length > 0);
}

function toMonthlySalaryExpr(fieldPath: string) {
  return {
    $cond: [
      {
        $eq: [{ $ifNull: ["$salaryPeriod", "per-month"] }, "per-year"],
      },
      { $divide: [{ $ifNull: [fieldPath, 0] }, 12] },
      { $ifNull: [fieldPath, 0] },
    ],
  };
}

/**
 * Public salary filters are expressed in monthly INR.
 * Yearly job salaries are converted to monthly equivalents before comparison.
 */
function buildSalaryFilter(minSalary?: number, maxSalary?: number) {
  if (minSalary === undefined && maxSalary === undefined) {
    return {};
  }

  const fixedMonthly = toMonthlySalaryExpr("$fixedSalary");
  const rangeMinMonthly = toMonthlySalaryExpr("$minimumSalary");
  const rangeMaxMonthly = {
    $cond: [
      {
        $eq: [{ $ifNull: ["$salaryPeriod", "per-month"] }, "per-year"],
      },
      {
        $divide: [
          {
            $ifNull: ["$maximumSalary", { $ifNull: ["$minimumSalary", 0] }],
          },
          12,
        ],
      },
      {
        $ifNull: ["$maximumSalary", { $ifNull: ["$minimumSalary", 0] }],
      },
    ],
  };

  const fixedConditions: Record<string, unknown>[] = [];
  const rangeConditions: Record<string, unknown>[] = [];

  if (minSalary !== undefined) {
    fixedConditions.push({ $gte: [fixedMonthly, minSalary] });
    rangeConditions.push({ $gte: [rangeMaxMonthly, minSalary] });
  }

  if (maxSalary !== undefined) {
    fixedConditions.push({ $lte: [fixedMonthly, maxSalary] });
    rangeConditions.push({ $lte: [rangeMinMonthly, maxSalary] });
  }

  return {
    $or: [
      {
        $and: [
          { salaryType: "fixed" },
          { $expr: { $and: fixedConditions } },
        ],
      },
      {
        $and: [
          { salaryType: "range" },
          { $expr: { $and: rangeConditions } },
        ],
      },
    ],
  };
}

function buildPublicJobsFilter(query: PublicJobsQuery) {
  const andClauses: Record<string, unknown>[] = [
    { status: "active" },
    buildSearchFilter(query.search),
  ];

  if (query.city.length === 1) {
    andClauses.push({ city: query.city[0] });
  } else if (query.city.length > 1) {
    andClauses.push({ city: { $in: query.city } });
  }

  if (query.state) {
    andClauses.push({ state: query.state });
  }

  if (query.jobType.length > 0) {
    andClauses.push({ jobType: { $in: query.jobType } });
  }

  if (query.experience.length > 0) {
    andClauses.push({ experience: { $in: query.experience } });
  }

  if (query.workMode.length > 0) {
    andClauses.push({ workMode: { $in: query.workMode } });
  }

  if (query.gender.length > 0) {
    andClauses.push({
      $or: [
        { gender: { $exists: false } },
        { gender: { $size: 0 } },
        { gender: { $in: query.gender } },
      ],
    });
  }

  const salaryFilter = buildSalaryFilter(query.minSalary, query.maxSalary);
  if (Object.keys(salaryFilter).length > 0) {
    andClauses.push(salaryFilter);
  }

  const cleaned = andClauses.filter((clause) => Object.keys(clause).length > 0);

  if (cleaned.length === 1) {
    return cleaned[0];
  }

  return { $and: cleaned };
}

function toPublicApplyWhatsAppNumber(
  contactMobile: string | null | undefined,
): string | null {
  if (!contactMobile) {
    return null;
  }

  const digits = contactMobile.replace(/\D/g, "");
  if (digits.length < 10) {
    return null;
  }

  return digits;
}

function toPublicJobListItem(
  job: JobDocument,
  options?: { isApplied?: boolean },
) {
  return {
    id: job._id.toString(),
    jobId: job.jobId,
    companyName: job.companyName,
    jobTitle: job.jobTitle,
    jobType: job.jobType,
    workMode: job.workMode,
    vacancies: job.vacancies,
    description: job.description,
    state: job.state,
    stateName: job.stateName,
    city: job.city,
    cityName: job.cityName,
    salaryType: job.salaryType,
    salaryPeriod: normalizeSalaryPeriod(job.salaryPeriod),
    fixedSalary: job.fixedSalary,
    minimumSalary: job.minimumSalary,
    maximumSalary: job.maximumSalary,
    perks: job.perks,
    education: job.education,
    experience: job.experience,
    publishedAt: toIsoDateString(job.publishedAt),
    applyWhatsAppNumber: toPublicApplyWhatsAppNumber(job.contactMobile),
    createdAt: job.createdAt,
    isApplied: options?.isApplied === true,
    views: job.views ?? 0,
  };
}

const TITLE_STOP_WORDS = new Set([
  "a",
  "an",
  "and",
  "for",
  "in",
  "of",
  "on",
  "or",
  "the",
  "to",
  "with",
  "job",
  "jobs",
  "role",
  "roles",
  "needed",
  "required",
  "urgent",
  "hiring",
]);

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function extractTitleTokens(jobTitle: string): string[] {
  const tokens = jobTitle
    .toLowerCase()
    .split(/[^a-z0-9+]+/i)
    .map((token) => token.trim())
    .filter((token) => token.length >= 3 && !TITLE_STOP_WORDS.has(token));

  return [...new Set(tokens)].slice(0, 6);
}

function scoreSimilarJob(
  candidate: JobDocument,
  source: {
    jobTitle: string;
    titleTokens: string[];
    city: string;
    state: string;
    industry: string;
    businessCategory: string;
  },
): number {
  let score = 0;
  const candidateTitle = candidate.jobTitle.toLowerCase();
  const sourceTitle = source.jobTitle.toLowerCase();

  if (candidateTitle === sourceTitle) {
    score += 120;
  } else if (
    candidateTitle.includes(sourceTitle) ||
    sourceTitle.includes(candidateTitle)
  ) {
    score += 90;
  }

  for (const token of source.titleTokens) {
    if (candidateTitle.includes(token)) {
      score += 35;
    }
  }

  const candidateCategory = (candidate.businessCategory ?? "").trim().toLowerCase();
  const sourceCategory = source.businessCategory.trim().toLowerCase();
  if (sourceCategory && candidateCategory && candidateCategory === sourceCategory) {
    score += 80;
  }

  const candidateIndustry = (candidate.industry ?? "").trim().toLowerCase();
  const sourceIndustry = source.industry.trim().toLowerCase();
  if (sourceIndustry && candidateIndustry && candidateIndustry === sourceIndustry) {
    score += 50;
  }

  if (source.city && candidate.city === source.city) {
    score += 40;
  } else if (source.state && candidate.state === source.state) {
    score += 20;
  }

  return score;
}

const EFFECTIVE_SALARY_EXPRESSION = {
  $cond: [
    { $eq: ["$salaryType", "fixed"] },
    { $ifNull: ["$fixedSalary", 0] },
    {
      $ifNull: [
        "$maximumSalary",
        { $ifNull: ["$minimumSalary", 0] },
      ],
    },
  ],
};

export class JobService {
  async createJob(employerId: string, input: CreateJobInput) {
    if (!mongoose.Types.ObjectId.isValid(employerId)) {
      throw new AppError("Unauthorized", HTTP_STATUS.UNAUTHORIZED);
    }

    const employer = await EmployerModel.findById(employerId);
    if (!employer) {
      throw new AppError("Employer not found", HTTP_STATUS.UNAUTHORIZED);
    }

    const employerObjectId = employer._id;
    const jobId = await generateJobId();

    const job = await JobModel.create({
      jobId,
      employerId: employerObjectId,
      companyId: employerObjectId,
      companyName: input.companyName,
      industry: input.industry ?? "",
      businessCategory: input.businessCategory ?? "",
      companySize: input.companySize ?? "",
      jobTitle: input.jobTitle,
      jobType: input.jobType,
      contractPeriodFrom:
        input.jobType === "contract" ? input.contractPeriodFrom : "",
      contractPeriodTo:
        input.jobType === "contract" ? input.contractPeriodTo : "",
      partTimeSchedule:
        input.jobType === "part-time" ? input.partTimeSchedule : "",
      partTimeStartTime:
        input.jobType === "part-time" ? input.partTimeStartTime : "",
      partTimeEndTime:
        input.jobType === "part-time" ? input.partTimeEndTime : "",
      partTimeFlexibleHours:
        input.jobType === "part-time" ? input.partTimeFlexibleHours : "",
      workMode: input.workMode,
      vacancies: input.vacancies,
      description: input.description,
      state: input.state,
      stateName: input.stateName,
      city: input.city,
      cityName: input.cityName,
      address: input.address,
      landmark: input.landmark,
      salaryType: input.salaryType,
      salaryPeriod: input.salaryPeriod,
      fixedSalary: input.salaryType === "fixed" ? input.fixedSalary : null,
      minimumSalary: input.salaryType === "range" ? input.minimumSalary : null,
      maximumSalary: input.salaryType === "range" ? input.maximumSalary : null,
      perks: input.perks,
      education: input.education,
      experience: input.experience,
      languages: input.languages,
      gender: input.gender,
      minimumAge: input.minimumAge,
      maximumAge: input.maximumAge,
      walkInEnabled: input.walkInEnabled,
      interviewAddress: input.walkInEnabled ? input.interviewAddress : "",
      walkInStartDate: input.walkInEnabled ? input.walkInStartDate : "",
      walkInEndDate: input.walkInEnabled ? input.walkInEndDate : "",
      walkInStartTime: input.walkInEnabled ? input.walkInStartTime : "",
      walkInEndTime: input.walkInEnabled ? input.walkInEndTime : "",
      interviewInstructions: input.interviewInstructions,
      contactPersonName: input.contactPersonName,
      contactEmail: input.contactEmail,
      contactMobile: input.contactMobile,
      status: input.status,
      completedStep: input.status === "draft" ? 1 : 3,
      lastEditedAt: new Date(),
      wizardSnapshot: null,
      publishedAt: input.status === "draft" ? null : new Date(),
      lastStatusChangedAt: input.status === "draft" ? null : new Date(),
      applications: 0,
      shortlisted: 0,
      interviews: 0,
      hired: 0,
      views: 0,
      bookmarks: 0,
      shares: 0,
      createdBy: employerObjectId,
    });

    return {
      job: toJobPublic(job),
    };
  }

  async listEmployerJobs(employerId: string, query: ListEmployerJobsQuery) {
    if (!mongoose.Types.ObjectId.isValid(employerId)) {
      throw new AppError("Unauthorized", HTTP_STATUS.UNAUTHORIZED);
    }

    const andClauses: Record<string, unknown>[] = [
      { employerId: new mongoose.Types.ObjectId(employerId) },
      buildSearchFilter(query.search),
      ...buildEmployerJobsAdvancedFilter(query),
    ];

    if (query.status) {
      andClauses.push({ status: query.status });
    }

    const cleaned = andClauses.filter(
      (clause) => Object.keys(clause).length > 0,
    );

    const filter: Record<string, unknown> =
      cleaned.length === 1 ? cleaned[0]! : { $and: cleaned };

    const skip = (query.page - 1) * query.limit;

    const [jobs, total, statusCounts, jobOptions] = await Promise.all([
      JobModel.find(filter)
        .sort({ publishedAt: -1, createdAt: -1 })
        .skip(skip)
        .limit(query.limit),
      JobModel.countDocuments(filter),
      JobModel.aggregate<{ _id: JobStatus; count: number }>([
        {
          $match: {
            employerId: new mongoose.Types.ObjectId(employerId),
          },
        },
        {
          $group: {
            _id: "$status",
            count: { $sum: 1 },
          },
        },
      ]),
      JobModel.find({
        employerId: new mongoose.Types.ObjectId(employerId),
      })
        .select("jobId jobTitle status")
        .sort({ publishedAt: -1, createdAt: -1 })
        .lean(),
    ]);

    const applicationMetricsByJobId =
      await loadEmployerJobApplicationMetricsByJobIds(
        employerId,
        jobs.map((job) => job._id.toString()),
      );

    const countsByStatus = Object.fromEntries(
      JOB_STATUSES.map((status) => [status, 0]),
    ) as Record<JobStatus, number>;

    for (const row of statusCounts) {
      countsByStatus[row._id] = row.count;
    }

    const all = Object.values(countsByStatus).reduce(
      (sum, count) => sum + count,
      0,
    );

    return {
      jobs: jobs.map((job) =>
        toEmployerJobListItem(
          job,
          applicationMetricsByJobId.get(job._id.toString()),
        ),
      ),
      pagination: {
        page: query.page,
        limit: query.limit,
        total,
        totalPages: Math.max(1, Math.ceil(total / query.limit)),
      },
      counts: {
        all,
        ...countsByStatus,
      },
      jobOptions: jobOptions.map((job) => ({
        jobId: job.jobId,
        jobTitle: job.jobTitle,
        status: job.status,
      })),
    };
  }

  async getEmployerJobStats(employerId: string) {
    if (!mongoose.Types.ObjectId.isValid(employerId)) {
      throw new AppError("Unauthorized", HTTP_STATUS.UNAUTHORIZED);
    }

    const employerObjectId = new mongoose.Types.ObjectId(employerId);

    const [jobTotalsResult, applicationTotals, recentJobs, statusCounts] =
      await Promise.all([
        JobModel.aggregate<{
          activeJobs: number;
          interviews: number;
          views: number;
        }>([
          { $match: { employerId: employerObjectId } },
          {
            $group: {
              _id: null,
              activeJobs: {
                $sum: {
                  $cond: [{ $eq: ["$status", "active"] }, 1, 0],
                },
              },
              interviews: { $sum: "$interviews" },
              views: { $sum: "$views" },
            },
          },
        ]),
        loadEmployerApplicationMetricsTotals(employerId),
        JobModel.find({ employerId: employerObjectId })
          .sort({ publishedAt: -1, createdAt: -1 })
          .limit(5),
        JobModel.aggregate<{ _id: JobStatus; count: number }>([
          { $match: { employerId: employerObjectId } },
          { $group: { _id: "$status", count: { $sum: 1 } } },
        ]),
      ]);

    const jobTotals = jobTotalsResult[0] ?? {
      activeJobs: 0,
      interviews: 0,
      views: 0,
    };

    const recentJobMetrics = await loadEmployerJobApplicationMetricsByJobIds(
      employerId,
      recentJobs.map((job) => job._id.toString()),
    );

    const countsByStatus = Object.fromEntries(
      JOB_STATUSES.map((status) => [status, 0]),
    ) as Record<JobStatus, number>;

    for (const row of statusCounts) {
      countsByStatus[row._id] = row.count;
    }

    return {
      stats: {
        activeJobs: jobTotals.activeJobs,
        applications: applicationTotals.applications,
        shortlisted: applicationTotals.shortlisted,
        interviews: jobTotals.interviews,
        hired: applicationTotals.hired,
        views: jobTotals.views,
        totalJobs: Object.values(countsByStatus).reduce(
          (sum, count) => sum + count,
          0,
        ),
        countsByStatus,
      },
      recentJobs: recentJobs.map((job) =>
        toEmployerJobListItem(
          job,
          recentJobMetrics.get(job._id.toString()),
        ),
      ),
    };
  }

  async updateJobStatus(
    employerId: string,
    jobMongoId: string,
    action: JobStatusAction,
  ) {
    const job = await this.findOwnedJobOrThrow(employerId, jobMongoId);
    const nextStatus = resolveStatusFromAction(job.status as JobStatus, action);
    const now = new Date();

    const $set: Record<string, unknown> = {
      status: nextStatus,
      lastStatusChangedAt: now,
    };

    // Close → Activate must refresh Posted On.
    // Pause → Resume must keep the original publishedAt.
    if (action === "reactivate") {
      $set.publishedAt = now;
      $set.reactivatedAt = now;
    } else if (action === "publish") {
      $set.publishedAt = now;
    }

    const updateResult = await JobModel.updateOne(
      {
        _id: job._id,
        employerId: new mongoose.Types.ObjectId(employerId),
      },
      { $set },
    );

    if (updateResult.matchedCount === 0) {
      throw new AppError("Job not found", HTTP_STATUS.NOT_FOUND);
    }

    const updatedJob = await JobModel.findById(job._id);

    if (!updatedJob) {
      throw new AppError("Job not found", HTTP_STATUS.NOT_FOUND);
    }

    return {
      job: toJobPublic(updatedJob),
    };
  }

  async deleteJob(employerId: string, jobMongoId: string) {
    const job = await this.findOwnedJobOrThrow(employerId, jobMongoId);
    await job.deleteOne();

    return {
      id: jobMongoId,
      deleted: true,
    };
  }

  async getOwnedJob(employerId: string, jobMongoId: string) {
    const job = await this.findOwnedJobOrThrow(employerId, jobMongoId);
    const metricsByJobId = await loadEmployerJobApplicationMetricsByJobIds(
      employerId,
      [job._id.toString()],
    );

    return {
      job: toJobPublic(job, metricsByJobId.get(job._id.toString())),
    };
  }

  async createDraft(employerId: string, input: SaveDraftJobInput) {
    if (!mongoose.Types.ObjectId.isValid(employerId)) {
      throw new AppError("Unauthorized", HTTP_STATUS.UNAUTHORIZED);
    }

    const employer = await EmployerModel.findById(employerId);
    if (!employer) {
      throw new AppError("Employer not found", HTTP_STATUS.UNAUTHORIZED);
    }

    const employerObjectId = employer._id;
    const jobId = await generateJobId();
    const denormalized = denormalizeDraftFields(input.wizardSnapshot);
    const now = new Date();

    const job = await JobModel.create({
      jobId,
      employerId: employerObjectId,
      companyId: employerObjectId,
      ...denormalized,
      status: "draft",
      completedStep: input.completedStep,
      lastEditedAt: now,
      wizardSnapshot: input.wizardSnapshot,
      applications: 0,
      shortlisted: 0,
      interviews: 0,
      hired: 0,
      views: 0,
      bookmarks: 0,
      shares: 0,
      createdBy: employerObjectId,
    });

    return {
      job: toJobPublic(job),
    };
  }

  async updateDraft(
    employerId: string,
    jobMongoId: string,
    input: SaveDraftJobInput,
  ) {
    const job = await this.findOwnedJobOrThrow(employerId, jobMongoId);

    if (job.status !== "draft") {
      throw new AppError(
        "Only draft jobs can be updated as drafts",
        HTTP_STATUS.BAD_REQUEST,
      );
    }

    const denormalized = denormalizeDraftFields(input.wizardSnapshot);
    Object.assign(job, denormalized);
    job.completedStep = input.completedStep;
    job.lastEditedAt = new Date();
    job.wizardSnapshot = input.wizardSnapshot;
    await job.save();

    return {
      job: toJobPublic(job),
    };
  }

  async publishDraft(
    employerId: string,
    jobMongoId: string,
    input: CreateJobInput,
  ) {
    const job = await this.findOwnedJobOrThrow(employerId, jobMongoId);

    if (job.status !== "draft") {
      throw new AppError(
        "Only draft jobs can be published from the post job form",
        HTTP_STATUS.BAD_REQUEST,
      );
    }

    applyCreateInputToJob(job, input);
    const now = new Date();
    job.status = "active";
    job.completedStep = 3;
    job.lastEditedAt = now;
    job.wizardSnapshot = null;
    job.publishedAt = now;
    job.lastStatusChangedAt = now;
    await job.save();

    return {
      job: toJobPublic(job),
    };
  }

  async updateActiveJob(
    employerId: string,
    jobMongoId: string,
    input: CreateJobInput,
  ) {
    const job = await this.findOwnedJobOrThrow(employerId, jobMongoId);

    if (job.status !== "active") {
      throw new AppError(
        "Only active jobs can be updated from the post job form",
        HTTP_STATUS.BAD_REQUEST,
      );
    }

    applyCreateInputToJob(job, input);
    job.lastEditedAt = new Date();
    job.wizardSnapshot = null;
    await job.save();

    return {
      job: toJobPublic(job),
    };
  }

  async getPublicActiveJobByPublicId(
    publicJobId: string,
    options?: {
      jobSeekerId?: string;
      visitorType?: "guest" | "jobSeeker";
      visitorId?: string;
    },
  ) {
    const job = await JobModel.findOne({
      jobId: publicJobId.toUpperCase(),
      status: "active",
    });

    if (!job) {
      throw new AppError("Job not found", HTTP_STATUS.NOT_FOUND);
    }

    const jobSeekerId = options?.jobSeekerId;
    let views = job.views ?? 0;

    if (options?.visitorId && options.visitorType) {
      const recorded = await jobViewService.recordJobView({
        jobMongoId: job._id.toString(),
        publicJobId: job.jobId,
        visitorType: options.visitorType,
        visitorId: options.visitorId,
      });

      if (recorded) {
        views += 1;
      }
    }

    const appliedIds = await getAppliedJobMongoIdSet(jobSeekerId, [
      job._id.toString(),
    ]);

    return {
      job: {
        ...toPublicJobListItem(job, {
          isApplied: appliedIds.has(job._id.toString()),
        }),
        views,
        address: job.address,
        landmark: job.landmark,
        languages: job.languages,
        gender: job.gender,
        minimumAge: job.minimumAge,
        maximumAge: job.maximumAge,
        walkInEnabled: job.walkInEnabled,
        interviewAddress: job.interviewAddress,
        walkInStartDate: job.walkInStartDate,
        walkInEndDate: job.walkInEndDate,
        walkInStartTime: job.walkInStartTime,
        walkInEndTime: job.walkInEndTime,
        interviewInstructions: job.interviewInstructions,
        contactPersonName: job.contactPersonName?.trim() || null,
      },
    };
  }

  async listSimilarPublicJobs(
    publicJobId: string,
    query: SimilarPublicJobsQuery,
    jobSeekerId?: string,
  ) {
    const sourceJob = await JobModel.findOne({
      jobId: publicJobId.toUpperCase(),
      status: "active",
    }).select(
      "jobId jobTitle city state industry businessCategory",
    );

    if (!sourceJob) {
      throw new AppError("Job not found", HTTP_STATUS.NOT_FOUND);
    }

    const titleTokens = extractTitleTokens(sourceJob.jobTitle);
    const orClauses: Record<string, unknown>[] = [];

    if (titleTokens.length > 0) {
      orClauses.push(
        ...titleTokens.map((token) => ({
          jobTitle: { $regex: escapeRegex(token), $options: "i" },
        })),
      );
    } else if (sourceJob.jobTitle.trim()) {
      orClauses.push({
        jobTitle: {
          $regex: escapeRegex(sourceJob.jobTitle.trim()),
          $options: "i",
        },
      });
    }

    if (sourceJob.businessCategory?.trim()) {
      orClauses.push({
        businessCategory: sourceJob.businessCategory.trim(),
      });
    }

    if (sourceJob.industry?.trim()) {
      orClauses.push({ industry: sourceJob.industry.trim() });
    }

    if (sourceJob.city?.trim()) {
      orClauses.push({ city: sourceJob.city });
    }

    if (sourceJob.state?.trim()) {
      orClauses.push({ state: sourceJob.state });
    }

    const filter: Record<string, unknown> = {
      status: "active",
      jobId: { $ne: sourceJob.jobId },
    };

    if (orClauses.length > 0) {
      filter.$or = orClauses;
    }

    const candidates = await JobModel.find(filter)
      .sort({ publishedAt: -1, createdAt: -1 })
      .limit(40);

    const sourceContext = {
      jobTitle: sourceJob.jobTitle,
      titleTokens,
      city: sourceJob.city ?? "",
      state: sourceJob.state ?? "",
      industry: sourceJob.industry ?? "",
      businessCategory: sourceJob.businessCategory ?? "",
    };

    const rankedEntries = candidates
      .map((candidate) => ({
        candidate,
        score: scoreSimilarJob(candidate, sourceContext),
      }))
      .filter((entry) => entry.score > 0)
      .sort((left, right) => {
        if (right.score !== left.score) {
          return right.score - left.score;
        }

        const rightPublished = right.candidate.publishedAt?.getTime() ?? 0;
        const leftPublished = left.candidate.publishedAt?.getTime() ?? 0;
        return rightPublished - leftPublished;
      })
      .slice(0, query.limit);

    const appliedIds = await getAppliedJobMongoIdSet(
      jobSeekerId,
      rankedEntries.map((entry) => entry.candidate._id.toString()),
    );

    const ranked = rankedEntries.map((entry) =>
      toPublicJobListItem(entry.candidate, {
        isApplied: appliedIds.has(entry.candidate._id.toString()),
      }),
    );

    return {
      jobs: ranked,
    };
  }

  async listPublicActiveJobs(
    query: PublicJobsQuery,
    jobSeekerId?: string,
  ) {
    const filter = buildPublicJobsFilter(query);
    const skip = (query.page - 1) * query.limit;

    const facetFilter = buildPublicJobsFilter({
      ...query,
      city: [],
    });
    const cityFacetLimit = query.state ? 100 : 30;

    const useSalarySort =
      query.sort === "salary_desc" || query.sort === "salary_asc";
    const salaryDirection = query.sort === "salary_asc" ? 1 : -1;

    const jobsPromise = useSalarySort
      ? JobModel.aggregate([
          { $match: filter },
          { $addFields: { effectiveSalary: EFFECTIVE_SALARY_EXPRESSION } },
          {
            $sort: {
              effectiveSalary: salaryDirection,
              publishedAt: -1,
              createdAt: -1,
            },
          },
          { $skip: skip },
          { $limit: query.limit },
        ]).then((docs) =>
          docs.map((doc) => JobModel.hydrate(doc) as JobDocument),
        )
      : JobModel.find(filter)
          .sort({ publishedAt: -1, createdAt: -1 })
          .skip(skip)
          .limit(query.limit);

    const [jobDocs, total, cityFacets] = await Promise.all([
      jobsPromise,
      JobModel.countDocuments(filter),
      JobModel.aggregate<{
        _id: { city: string; cityName: string };
        count: number;
      }>([
        { $match: facetFilter },
        {
          $group: {
            _id: { city: "$city", cityName: "$cityName" },
            count: { $sum: 1 },
          },
        },
        { $sort: { count: -1 } },
        { $limit: cityFacetLimit },
      ]),
    ]);

    const appliedIds = await getAppliedJobMongoIdSet(
      jobSeekerId,
      jobDocs.map((job) => job._id.toString()),
    );

    const jobs = jobDocs.map((job) =>
      toPublicJobListItem(job, {
        isApplied: appliedIds.has(job._id.toString()),
      }),
    );

    return {
      jobs,
      pagination: {
        page: query.page,
        limit: query.limit,
        total,
        totalPages: Math.max(1, Math.ceil(total / query.limit)),
      },
      facets: {
        cities: cityFacets
          .filter((facet) => facet._id.city)
          .map((facet) => ({
            city: facet._id.city,
            cityName: facet._id.cityName || facet._id.city,
            count: facet.count,
          })),
      },
    };
  }

  private async findOwnedJobOrThrow(employerId: string, jobMongoId: string) {
    if (
      !mongoose.Types.ObjectId.isValid(employerId) ||
      !mongoose.Types.ObjectId.isValid(jobMongoId)
    ) {
      throw new AppError("Job not found", HTTP_STATUS.NOT_FOUND);
    }

    const job = await JobModel.findOne({
      _id: jobMongoId,
      employerId: new mongoose.Types.ObjectId(employerId),
    });

    if (!job) {
      throw new AppError("Job not found", HTTP_STATUS.NOT_FOUND);
    }

    return job;
  }
}

export const jobService = new JobService();
