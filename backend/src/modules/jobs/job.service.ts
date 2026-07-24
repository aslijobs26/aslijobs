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
import { JobCounterModel } from "./job-counter.model.js";
import { JobModel, type JobDocument } from "./job.model.js";
import type {
  CreateJobInput,
  DraftWizardSnapshot,
  ListEmployerJobsQuery,
  PublicJobsQuery,
  SaveDraftJobInput,
} from "./job.validation.js";

const UNTITLED_DRAFT_TITLE = "Untitled draft";

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

function toJobPublic(job: JobDocument) {
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
    applications: job.applications,
    shortlisted: job.shortlisted,
    interviews: job.interviews,
    hired: job.hired,
    views: job.views,
    bookmarks: job.bookmarks,
    shares: job.shares,
    createdBy: job.createdBy.toString(),
    createdAt: job.createdAt,
    updatedAt: job.updatedAt,
  };
}

function toEmployerJobListItem(job: JobDocument) {
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
    applications: job.applications,
    shortlisted: job.shortlisted,
    interviews: job.interviews,
    hired: job.hired,
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

function toPublicJobListItem(job: JobDocument) {
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
  };
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

    const filter: Record<string, unknown> = {
      employerId: new mongoose.Types.ObjectId(employerId),
      ...buildSearchFilter(query.search),
    };

    if (query.status) {
      filter.status = query.status;
    }

    const skip = (query.page - 1) * query.limit;

    const [jobs, total, statusCounts] = await Promise.all([
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
    ]);

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
      jobs: jobs.map((job) => toEmployerJobListItem(job)),
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
    };
  }

  async getEmployerJobStats(employerId: string) {
    if (!mongoose.Types.ObjectId.isValid(employerId)) {
      throw new AppError("Unauthorized", HTTP_STATUS.UNAUTHORIZED);
    }

    const employerObjectId = new mongoose.Types.ObjectId(employerId);

    const [aggregateResult, recentJobs, statusCounts] = await Promise.all([
      JobModel.aggregate<{
        activeJobs: number;
        applications: number;
        shortlisted: number;
        interviews: number;
        hired: number;
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
            applications: { $sum: "$applications" },
            shortlisted: { $sum: "$shortlisted" },
            interviews: { $sum: "$interviews" },
            hired: { $sum: "$hired" },
            views: { $sum: "$views" },
          },
        },
      ]),
      JobModel.find({ employerId: employerObjectId })
        .sort({ publishedAt: -1, createdAt: -1 })
        .limit(5),
      JobModel.aggregate<{ _id: JobStatus; count: number }>([
        { $match: { employerId: employerObjectId } },
        { $group: { _id: "$status", count: { $sum: 1 } } },
      ]),
    ]);

    const totals = aggregateResult[0] ?? {
      activeJobs: 0,
      applications: 0,
      shortlisted: 0,
      interviews: 0,
      hired: 0,
      views: 0,
    };

    const countsByStatus = Object.fromEntries(
      JOB_STATUSES.map((status) => [status, 0]),
    ) as Record<JobStatus, number>;

    for (const row of statusCounts) {
      countsByStatus[row._id] = row.count;
    }

    return {
      stats: {
        activeJobs: totals.activeJobs,
        applications: totals.applications,
        shortlisted: totals.shortlisted,
        interviews: totals.interviews,
        hired: totals.hired,
        views: totals.views,
        totalJobs: Object.values(countsByStatus).reduce(
          (sum, count) => sum + count,
          0,
        ),
        countsByStatus,
      },
      recentJobs: recentJobs.map((job) => toEmployerJobListItem(job)),
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
    return {
      job: toJobPublic(job),
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

  async getPublicActiveJobByPublicId(publicJobId: string) {
    const job = await JobModel.findOne({
      jobId: publicJobId.toUpperCase(),
      status: "active",
    });

    if (!job) {
      throw new AppError("Job not found", HTTP_STATUS.NOT_FOUND);
    }

    return {
      job: {
        ...toPublicJobListItem(job),
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

  async listPublicActiveJobs(query: PublicJobsQuery) {
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
          docs.map((doc) => {
            const job = JobModel.hydrate(doc) as JobDocument;
            return toPublicJobListItem(job);
          }),
        )
      : JobModel.find(filter)
          .sort({ publishedAt: -1, createdAt: -1 })
          .skip(skip)
          .limit(query.limit)
          .then((jobs) => jobs.map((job) => toPublicJobListItem(job)));

    const [jobs, total, cityFacets] = await Promise.all([
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
