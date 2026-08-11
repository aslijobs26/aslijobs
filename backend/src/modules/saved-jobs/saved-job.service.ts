import mongoose from "mongoose";
import { HTTP_STATUS } from "../../constants/http-status.js";
import { AppError } from "../../middleware/error.middleware.js";
import { ApplicationModel } from "../applications/application.model.js";
import { resolveEmployerPosterImageUrl } from "../employers/employer-poster-image.js";
import { EmployerModel } from "../employers/employer.model.js";
import { JobSeekerModel } from "../job-seekers/job-seeker.model.js";
import { JobModel } from "../jobs/job.model.js";
import {
  HIGH_MATCH_THRESHOLD,
  RECENT_SAVED_DAYS,
  type SavedJobsSort,
  type SavedJobsStatsFilter,
} from "./saved-job.constants.js";
import { SavedJobModel } from "./saved-job.model.js";
import { buildListPagination } from "../../utils/pagination.js";
import type {
  SavedJobListItem,
  SavedJobsPagination,
  SavedJobsStats,
} from "./saved-job.types.js";

const JOB_SELECT =
  "jobId jobTitle companyName employerId companyId status city cityName state stateName salaryType salaryPeriod fixedSalary minimumSalary maximumSalary workMode jobType experience perks partTimeSchedule partTimeStartTime partTimeEndTime publishedAt createdAt description industry";

const PERK_LABELS: Record<string, string> = {
  travel_allowance: "Travel Allowance",
  food_meals: "Food",
  accommodation: "Accommodation",
  petrol_allowance: "Petrol",
  mobile_bill_allowance: "Mobile Bill",
  internet_allowance: "Internet",
  annual_bonus: "Incentives",
  laptop: "Laptop",
  pf: "PF + ESI",
};

const EXPERIENCE_LABELS: Record<string, string> = {
  fresher: "Fresher",
  "6_month": "6 months",
  "1_year": "1 year",
  "2_year": "2 years",
  "3_year": "3 years",
  "4_year": "4 years",
  "5_year": "5 years",
  "6_year": "6 years",
  "10_year": "10+ years",
};

type JobLean = {
  _id: mongoose.Types.ObjectId;
  jobId?: string;
  jobTitle?: string;
  companyName?: string;
  employerId?: mongoose.Types.ObjectId;
  companyId?: mongoose.Types.ObjectId;
  status?: string;
  city?: string;
  cityName?: string;
  state?: string;
  stateName?: string;
  salaryType?: string;
  salaryPeriod?: string;
  fixedSalary?: number | null;
  minimumSalary?: number | null;
  maximumSalary?: number | null;
  workMode?: string;
  jobType?: string;
  experience?: string;
  perks?: string[];
  partTimeSchedule?: string;
  partTimeStartTime?: string;
  partTimeEndTime?: string;
  publishedAt?: Date | null;
  createdAt?: Date;
  description?: string;
  industry?: string;
};

type SeekerProfile = {
  jobRole?: string;
  city?: string;
  state?: string;
  preferredJobLocation?: string;
  experienceType?: string;
  expectedSalary?: number | null;
};

function text(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function formatCurrencyAmount(amount: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatSalaryLabel(job: JobLean): string {
  const period =
    job.salaryPeriod === "per-year"
      ? "/year"
      : job.salaryPeriod === "per-day"
        ? "/day"
        : "/month";

  if (job.salaryType === "fixed" && typeof job.fixedSalary === "number") {
    return `${formatCurrencyAmount(job.fixedSalary)}${period}`;
  }

  if (
    typeof job.minimumSalary === "number" &&
    typeof job.maximumSalary === "number"
  ) {
    return `${formatCurrencyAmount(job.minimumSalary)} - ${formatCurrencyAmount(job.maximumSalary)}${period}`;
  }

  if (typeof job.minimumSalary === "number") {
    return `From ${formatCurrencyAmount(job.minimumSalary)}${period}`;
  }

  if (typeof job.maximumSalary === "number") {
    return `Up to ${formatCurrencyAmount(job.maximumSalary)}${period}`;
  }

  if (typeof job.fixedSalary === "number") {
    return `${formatCurrencyAmount(job.fixedSalary)}${period}`;
  }

  return "Not disclosed";
}

function salarySortValue(job: JobLean | null | undefined): number | null {
  if (!job) {
    return null;
  }
  if (job.salaryType === "fixed" && typeof job.fixedSalary === "number") {
    return job.fixedSalary;
  }
  if (
    typeof job.minimumSalary === "number" &&
    typeof job.maximumSalary === "number"
  ) {
    return (job.minimumSalary + job.maximumSalary) / 2;
  }
  if (typeof job.minimumSalary === "number") {
    return job.minimumSalary;
  }
  if (typeof job.maximumSalary === "number") {
    return job.maximumSalary;
  }
  if (typeof job.fixedSalary === "number") {
    return job.fixedSalary;
  }
  return null;
}

function formatJobLocation(job: JobLean): string {
  const city = text(job.cityName) || text(job.city);
  const state = text(job.stateName) || text(job.state);
  return [city, state].filter(Boolean).join(", ");
}

function formatShiftLabel(job: JobLean): string {
  const start = text(job.partTimeStartTime);
  const end = text(job.partTimeEndTime);
  if (start && end) {
    return `${start} – ${end}`;
  }
  const schedule = text(job.partTimeSchedule);
  if (schedule === "fixed-timings") {
    return "Fixed timings";
  }
  if (schedule === "flexible-hours") {
    return "Flexible hours";
  }
  return schedule;
}

function extractTokens(value: string): string[] {
  return [
    ...new Set(
      value
        .toLowerCase()
        .split(/[^a-z0-9+]+/i)
        .map((token) => token.trim())
        .filter((token) => token.length >= 3),
    ),
  ].slice(0, 8);
}

function computeMatchPercent(job: JobLean, seeker: SeekerProfile | null): number {
  let score = 62;

  const seekerRole = text(seeker?.jobRole).toLowerCase();
  const jobTitle = text(job.jobTitle).toLowerCase();
  if (seekerRole && jobTitle) {
    const roleTokens = extractTokens(seekerRole);
    const titleTokens = extractTokens(jobTitle);
    const overlap = roleTokens.filter((token) =>
      titleTokens.some(
        (titleToken) =>
          titleToken.includes(token) || token.includes(titleToken),
      ),
    ).length;
    if (overlap > 0) {
      score += Math.min(22, overlap * 8);
    } else if (
      jobTitle.includes(seekerRole) ||
      seekerRole.includes(jobTitle.slice(0, Math.min(jobTitle.length, 12)))
    ) {
      score += 14;
    }
  }

  const seekerCity = text(seeker?.city).toLowerCase();
  const preferred = text(seeker?.preferredJobLocation).toLowerCase();
  const jobCity = (text(job.cityName) || text(job.city)).toLowerCase();
  const jobState = (text(job.stateName) || text(job.state)).toLowerCase();
  if (
    (seekerCity && jobCity && jobCity.includes(seekerCity)) ||
    (preferred &&
      (jobCity.includes(preferred) ||
        preferred.includes(jobCity) ||
        jobState.includes(preferred)))
  ) {
    score += 12;
  }

  if (
    seeker?.experienceType === "experienced" &&
    text(job.experience) &&
    text(job.experience) !== "fresher"
  ) {
    score += 6;
  } else if (
    seeker?.experienceType === "fresher" &&
    text(job.experience) === "fresher"
  ) {
    score += 8;
  }

  const expected = seeker?.expectedSalary;
  const jobSalary = salarySortValue(job);
  if (
    typeof expected === "number" &&
    expected > 0 &&
    typeof jobSalary === "number" &&
    jobSalary > 0
  ) {
    const ratio = jobSalary / expected;
    if (ratio >= 0.85 && ratio <= 1.35) {
      score += 8;
    } else if (ratio >= 0.7) {
      score += 4;
    }
  }

  return Math.max(55, Math.min(98, Math.round(score)));
}

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

function isJobExpired(status: string | undefined): boolean {
  return status !== "active";
}

function mapListItem(input: {
  savedId: string;
  savedAt: Date;
  job: JobLean;
  companyLogoUrl: string;
  isVerified: boolean;
  isApplied: boolean;
  matchPercent: number;
}): SavedJobListItem {
  const { job } = input;
  const experience = text(job.experience);
  const perks = Array.isArray(job.perks) ? job.perks.map(text).filter(Boolean) : [];
  const expired = isJobExpired(job.status);

  return {
    id: input.savedId,
    publicJobId: text(job.jobId),
    jobMongoId: job._id.toString(),
    jobTitle: text(job.jobTitle) || "Job",
    companyName: text(job.companyName) || "Company",
    companyLogoUrl: input.companyLogoUrl,
    isVerified: input.isVerified,
    location: formatJobLocation(job),
    city: text(job.city),
    cityName: text(job.cityName),
    state: text(job.state),
    stateName: text(job.stateName),
    salaryLabel: formatSalaryLabel(job),
    salarySortValue: salarySortValue(job),
    jobType: text(job.jobType),
    workMode: text(job.workMode),
    experience,
    experienceLabel: EXPERIENCE_LABELS[experience] ?? experience,
    partTimeSchedule: text(job.partTimeSchedule),
    shiftLabel: formatShiftLabel(job),
    perks,
    perkLabels: perks.map((perk) => PERK_LABELS[perk] ?? perk),
    matchPercent: input.matchPercent,
    isHighMatch: input.matchPercent >= HIGH_MATCH_THRESHOLD,
    isApplied: input.isApplied,
    isExpired: expired,
    jobStatus: text(job.status) || "unknown",
    savedAt: input.savedAt.toISOString(),
    publishedAt: toIso(job.publishedAt),
    createdAt: toIso(job.createdAt) ?? input.savedAt.toISOString(),
  };
}

function matchesTab(
  item: SavedJobListItem,
  tab: SavedJobsStatsFilter,
  recentCutoff: Date,
): boolean {
  if (tab === "all") {
    return true;
  }
  if (tab === "recent") {
    return new Date(item.savedAt).getTime() >= recentCutoff.getTime();
  }
  if (tab === "high_match") {
    return item.isHighMatch && !item.isExpired;
  }
  if (tab === "applied") {
    return item.isApplied;
  }
  if (tab === "expired") {
    return item.isExpired;
  }
  return true;
}

function matchesAdvancedFilters(
  item: SavedJobListItem,
  filters: {
    search: string;
    location: string;
    jobType: string;
    workMode: string;
    schedule: string;
    experience: string;
    company: string;
    perk: string;
    minSalary?: number;
    maxSalary?: number;
  },
): boolean {
  const search = filters.search.trim().toLowerCase();
  if (search) {
    const haystack = [
      item.jobTitle,
      item.companyName,
      item.location,
      item.perkLabels.join(" "),
      item.experienceLabel,
      item.shiftLabel,
      item.jobType,
      item.workMode,
    ]
      .join(" ")
      .toLowerCase();
    if (!haystack.includes(search)) {
      return false;
    }
  }

  const location = filters.location.trim().toLowerCase();
  if (location) {
    const locationHaystack = [
      item.location,
      item.city,
      item.cityName,
      item.state,
      item.stateName,
    ]
      .join(" ")
      .toLowerCase();
    if (!locationHaystack.includes(location)) {
      return false;
    }
  }

  if (filters.jobType && item.jobType !== filters.jobType) {
    return false;
  }
  if (filters.workMode && item.workMode !== filters.workMode) {
    return false;
  }
  if (filters.schedule && item.partTimeSchedule !== filters.schedule) {
    return false;
  }
  if (filters.experience && item.experience !== filters.experience) {
    return false;
  }
  if (filters.company) {
    if (!item.companyName.toLowerCase().includes(filters.company.toLowerCase())) {
      return false;
    }
  }
  if (filters.perk) {
    if (!item.perks.includes(filters.perk)) {
      return false;
    }
  }
  if (typeof filters.minSalary === "number") {
    if (
      item.salarySortValue == null ||
      item.salarySortValue < filters.minSalary
    ) {
      return false;
    }
  }
  if (typeof filters.maxSalary === "number") {
    if (
      item.salarySortValue == null ||
      item.salarySortValue > filters.maxSalary
    ) {
      return false;
    }
  }

  return true;
}

function sortItems(items: SavedJobListItem[], sort: SavedJobsSort): SavedJobListItem[] {
  const sorted = [...items];
  sorted.sort((a, b) => {
    switch (sort) {
      case "newest": {
        const aTime = new Date(a.publishedAt ?? a.createdAt).getTime();
        const bTime = new Date(b.publishedAt ?? b.createdAt).getTime();
        return bTime - aTime;
      }
      case "oldest": {
        const aTime = new Date(a.publishedAt ?? a.createdAt).getTime();
        const bTime = new Date(b.publishedAt ?? b.createdAt).getTime();
        return aTime - bTime;
      }
      case "salary_high":
        return (b.salarySortValue ?? -1) - (a.salarySortValue ?? -1);
      case "salary_low":
        return (a.salarySortValue ?? Number.MAX_SAFE_INTEGER) -
          (b.salarySortValue ?? Number.MAX_SAFE_INTEGER);
      case "company_az":
        return a.companyName.localeCompare(b.companyName, "en", {
          sensitivity: "base",
        });
      case "highest_match":
        return b.matchPercent - a.matchPercent;
      case "recently_saved":
      default:
        return new Date(b.savedAt).getTime() - new Date(a.savedAt).getTime();
    }
  });
  return sorted;
}

function buildStats(items: SavedJobListItem[], recentCutoff: Date): SavedJobsStats {
  return {
    total: items.length,
    recent: items.filter(
      (item) => new Date(item.savedAt).getTime() >= recentCutoff.getTime(),
    ).length,
    highMatch: items.filter((item) => item.isHighMatch && !item.isExpired).length,
    applied: items.filter((item) => item.isApplied).length,
    expired: items.filter((item) => item.isExpired).length,
  };
}

async function loadEnrichedSavedJobs(
  jobSeekerId: string,
): Promise<SavedJobListItem[]> {
  if (!mongoose.Types.ObjectId.isValid(jobSeekerId)) {
    throw new AppError("Unauthorized", HTTP_STATUS.UNAUTHORIZED);
  }

  const seekerObjectId = new mongoose.Types.ObjectId(jobSeekerId);

  const [savedRows, seeker] = await Promise.all([
    SavedJobModel.find({ jobSeekerId: seekerObjectId })
      .sort({ savedAt: -1 })
      .lean(),
    JobSeekerModel.findById(seekerObjectId)
      .select("jobRole city state preferredJobLocation experienceType expectedSalary")
      .lean<SeekerProfile | null>(),
  ]);

  if (savedRows.length === 0) {
    return [];
  }

  const jobIds = savedRows.map((row) => row.jobId);
  const jobs = await JobModel.find({ _id: { $in: jobIds } })
    .select(JOB_SELECT)
    .lean<JobLean[]>();

  const jobMap = new Map(jobs.map((job) => [job._id.toString(), job]));

  const employerIds = [
    ...new Set(
      jobs
        .map((job) => (job.employerId ?? job.companyId)?.toString())
        .filter((id): id is string => Boolean(id)),
    ),
  ];

  const employers = employerIds.length
    ? await EmployerModel.find({
        _id: {
          $in: employerIds.map((id) => new mongoose.Types.ObjectId(id)),
        },
      })
        .select(
          "accountType companyLogo.url companyLogo.updatedAt profilePhoto.url profilePhoto.updatedAt registrationStatus",
        )
        .lean()
    : [];

  const employerMap = new Map(
    employers.map((employer) => [employer._id.toString(), employer]),
  );

  const appliedRows = await ApplicationModel.find({
    jobSeekerId: seekerObjectId,
    jobId: { $in: jobIds },
  })
    .select("jobId")
    .lean();

  const appliedIds = new Set(
    appliedRows.map((row) => {
      const jobId = row.jobId;
      return jobId instanceof mongoose.Types.ObjectId
        ? jobId.toString()
        : String(jobId);
    }),
  );

  const items: SavedJobListItem[] = [];

  for (const saved of savedRows) {
    const job = jobMap.get(saved.jobId.toString());
    if (!job) {
      continue;
    }

    const employerKey = (job.employerId ?? job.companyId)?.toString() ?? "";
    const employer = employerMap.get(employerKey);
    const logoUrl = employer
      ? resolveEmployerPosterImageUrl({
          accountType:
            typeof employer.accountType === "string"
              ? employer.accountType
              : undefined,
          companyLogo:
            employer.companyLogo && typeof employer.companyLogo === "object"
              ? (employer.companyLogo as {
                  url?: string;
                  updatedAt?: Date | string | null;
                })
              : null,
          profilePhoto:
            employer.profilePhoto && typeof employer.profilePhoto === "object"
              ? (employer.profilePhoto as {
                  url?: string;
                  updatedAt?: Date | string | null;
                })
              : null,
        })
      : "";

    const registrationStatus =
      employer && typeof employer.registrationStatus === "string"
        ? employer.registrationStatus
        : "";

    items.push(
      mapListItem({
        savedId: saved._id.toString(),
        savedAt: saved.savedAt instanceof Date ? saved.savedAt : new Date(saved.savedAt),
        job,
        companyLogoUrl: logoUrl,
        isVerified:
          registrationStatus === "completed" ||
          registrationStatus === "otp_verified",
        isApplied: appliedIds.has(job._id.toString()),
        matchPercent: computeMatchPercent(job, seeker),
      }),
    );
  }

  return items;
}

export class SavedJobService {
  async saveJob(input: {
    jobSeekerId: string;
    publicJobId: string;
  }): Promise<{ savedJob: SavedJobListItem }> {
    const publicJobId = input.publicJobId.trim();
    const job = await JobModel.findOne({ jobId: publicJobId })
      .select(JOB_SELECT)
      .lean<JobLean | null>();

    if (!job) {
      throw new AppError("Job not found", HTTP_STATUS.NOT_FOUND);
    }

    if (job.status !== "active") {
      throw new AppError(
        "Only active jobs can be saved",
        HTTP_STATUS.BAD_REQUEST,
      );
    }

    const jobSeekerId = new mongoose.Types.ObjectId(input.jobSeekerId);
    const existing = await SavedJobModel.findOne({
      jobSeekerId,
      jobId: job._id,
    }).lean();

    if (existing) {
      const [item] = await this.listMappedForIds(input.jobSeekerId, [
        existing._id.toString(),
      ]);
      if (item) {
        return { savedJob: item };
      }
    }

    try {
      const created = await SavedJobModel.create({
        jobSeekerId,
        jobId: job._id,
        publicJobId: text(job.jobId),
        savedAt: new Date(),
      });

      await JobModel.updateOne({ _id: job._id }, { $inc: { bookmarks: 1 } });

      const [item] = await this.listMappedForIds(input.jobSeekerId, [
        created._id.toString(),
      ]);
      if (!item) {
        throw new AppError(
          "Failed to load saved job",
          HTTP_STATUS.INTERNAL_SERVER_ERROR,
        );
      }
      return { savedJob: item };
    } catch (error) {
      if (
        error &&
        typeof error === "object" &&
        "code" in error &&
        (error as { code?: number }).code === 11000
      ) {
        const again = await SavedJobModel.findOne({
          jobSeekerId,
          jobId: job._id,
        }).lean();
        if (again) {
          const [item] = await this.listMappedForIds(input.jobSeekerId, [
            again._id.toString(),
          ]);
          if (item) {
            return { savedJob: item };
          }
        }
      }
      throw error;
    }
  }

  async removeJob(input: {
    jobSeekerId: string;
    publicJobId: string;
  }): Promise<{ removed: boolean }> {
    const publicJobId = input.publicJobId.trim();
    const jobSeekerId = new mongoose.Types.ObjectId(input.jobSeekerId);

    const existing = await SavedJobModel.findOneAndDelete({
      jobSeekerId,
      publicJobId,
    }).lean();

    if (!existing) {
      throw new AppError("Saved job not found", HTTP_STATUS.NOT_FOUND);
    }

    await JobModel.updateOne(
      { _id: existing.jobId, bookmarks: { $gt: 0 } },
      { $inc: { bookmarks: -1 } },
    );

    return { removed: true };
  }

  async listIds(input: { jobSeekerId: string }): Promise<{ publicJobIds: string[] }> {
    if (!mongoose.Types.ObjectId.isValid(input.jobSeekerId)) {
      throw new AppError("Unauthorized", HTTP_STATUS.UNAUTHORIZED);
    }

    const rows = await SavedJobModel.find({
      jobSeekerId: new mongoose.Types.ObjectId(input.jobSeekerId),
    })
      .select("publicJobId")
      .lean();

    return {
      publicJobIds: rows.map((row) => text(row.publicJobId)).filter(Boolean),
    };
  }

  async getStats(input: { jobSeekerId: string }): Promise<{ stats: SavedJobsStats }> {
    const items = await loadEnrichedSavedJobs(input.jobSeekerId);
    const recentCutoff = new Date();
    recentCutoff.setDate(recentCutoff.getDate() - RECENT_SAVED_DAYS);
    return { stats: buildStats(items, recentCutoff) };
  }

  async list(input: {
    jobSeekerId: string;
    tab: SavedJobsStatsFilter;
    search: string;
    sort: SavedJobsSort;
    location: string;
    jobType: string;
    workMode: string;
    schedule: string;
    experience: string;
    company: string;
    perk: string;
    minSalary?: number;
    maxSalary?: number;
    page: number;
    limit: number;
  }): Promise<{
    jobs: SavedJobListItem[];
    pagination: SavedJobsPagination;
    stats: SavedJobsStats;
  }> {
    const allItems = await loadEnrichedSavedJobs(input.jobSeekerId);
    const recentCutoff = new Date();
    recentCutoff.setDate(recentCutoff.getDate() - RECENT_SAVED_DAYS);
    const stats = buildStats(allItems, recentCutoff);

    const filtered = allItems.filter(
      (item) =>
        matchesTab(item, input.tab, recentCutoff) &&
        matchesAdvancedFilters(item, input),
    );

    const sorted = sortItems(filtered, input.sort);
    const total = sorted.length;
    const pagination = buildListPagination(input.page, input.limit, total);
    const start = (pagination.page - 1) * pagination.limit;
    const jobs = sorted.slice(start, start + pagination.limit);

    return {
      jobs,
      pagination,
      stats,
    };
  }

  private async listMappedForIds(
    jobSeekerId: string,
    savedIds: string[],
  ): Promise<SavedJobListItem[]> {
    const all = await loadEnrichedSavedJobs(jobSeekerId);
    const idSet = new Set(savedIds);
    return all.filter((item) => idSet.has(item.id));
  }
}

export const savedJobService = new SavedJobService();
