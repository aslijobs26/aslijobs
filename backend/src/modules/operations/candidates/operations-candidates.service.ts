import mongoose from "mongoose";
import { HTTP_STATUS } from "../../../constants/http-status.js";
import { AppError } from "../../../middleware/error.middleware.js";
import { buildListPagination } from "../../../utils/pagination.js";
import {
  APPLICATION_STATUS_LABELS,
  EMPLOYER_JOB_HIRED_STATUSES,
  EMPLOYER_JOB_SHORTLISTED_STATUSES,
} from "../../applications/application.constants.js";
import { ApplicationModel } from "../../applications/application.model.js";
import type {
  ApplicationResumeSnapshot,
  ApplicationStatus,
} from "../../applications/application.types.js";
import { resolveEmployerPosterImageUrl } from "../../employers/employer-poster-image.js";
import { EmployerModel } from "../../employers/employer.model.js";
import { JobModel } from "../../jobs/job.model.js";
import { JobSeekerModel } from "../../job-seekers/job-seeker.model.js";
import type {
  ListOperationsCandidatesQuery,
} from "./operations-candidates.validation.js";
import type {
  OperationsCandidateDatePreset,
  OperationsCandidateDetail,
  OperationsCandidateListItem,
  OperationsCandidatesFilterOptions,
  OperationsCandidatesInsight,
  OperationsCandidatesKpis,
  OperationsCandidatesListResult,
  OperationsCandidatesPeriodStats,
  OperationsCandidatesTabCounts,
  OperationsCandidateTab,
} from "./operations-candidates.types.js";

const ACTIVE_APPLICATION_STATUSES: ApplicationStatus[] = [
  "submitted",
  "viewed",
  "under_review",
  "shortlisted",
  "interview_scheduled",
  "interview_completed",
  "offer_sent",
  "selected",
];

const APPLIED_TAB_STATUSES: ApplicationStatus[] = ["submitted", "viewed"];
const INTERVIEW_TAB_STATUSES: ApplicationStatus[] = [
  "interview_scheduled",
  "interview_completed",
  "offer_sent",
];
const HIRED_TAB_STATUSES: ApplicationStatus[] = [
  ...EMPLOYER_JOB_HIRED_STATUSES,
];
const SHORTLISTED_TAB_STATUSES: ApplicationStatus[] = [
  ...EMPLOYER_JOB_SHORTLISTED_STATUSES,
];
const NEEDS_REVIEW_STATUSES: ApplicationStatus[] = [
  "submitted",
  "viewed",
  "under_review",
];

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function text(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

/**
 * Normalize Operations Candidates search input.
 * Supports display IDs like `AJ-CAN-08F43A34`.
 */
function normalizeCandidateSearch(raw: string): {
  text: string;
  idToken: string | null;
} {
  const text = raw.trim().replace(/\s+/g, " ");
  if (!text) {
    return { text: "", idToken: null };
  }

  const withoutCanPrefix = text.replace(/^AJ-?CAN[-:\s_]*/i, "").trim();

  let idToken: string | null = null;
  if (/^[a-fA-F0-9]{8,24}$/.test(withoutCanPrefix)) {
    idToken = withoutCanPrefix;
  } else if (/^[a-fA-F0-9]{8,24}$/.test(text)) {
    idToken = text;
  } else {
    const embedded = text.match(/\bAJ-?CAN[-:\s_]*([a-fA-F0-9]{8,24})\b/i);
    if (embedded?.[1]) {
      idToken = embedded[1];
    }
  }

  return { text, idToken };
}

function buildObjectIdSuffixMatch(
  fieldPath: string,
  idToken: string,
): Record<string, unknown> {
  if (idToken.length === 24) {
    return { [fieldPath]: new mongoose.Types.ObjectId(idToken) };
  }

  return {
    $expr: {
      $regexMatch: {
        input: { $toString: `$${fieldPath}` },
        regex: `${escapeRegex(idToken.toLowerCase())}$`,
        options: "i",
      },
    },
  };
}

function asSnapshot(value: unknown): ApplicationResumeSnapshot | null {
  if (!value || typeof value !== "object") {
    return null;
  }
  return value as ApplicationResumeSnapshot;
}

function startOfLocalDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate(), 0, 0, 0, 0);
}

function endOfLocalDay(date: Date): Date {
  return new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate(),
    23,
    59,
    59,
    999,
  );
}

function parseDateOnly(value: string): Date | null {
  const trimmed = value.trim();
  if (!trimmed) {
    return null;
  }
  const parsed = new Date(`${trimmed}T00:00:00`);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function resolveDateRange(input: {
  datePreset: OperationsCandidateDatePreset;
  dateFrom: string;
  dateTo: string;
}): { from: Date | null; to: Date | null; preset: OperationsCandidateDatePreset } {
  const now = new Date();

  switch (input.datePreset) {
    case "today":
      return {
        preset: "today",
        from: startOfLocalDay(now),
        to: endOfLocalDay(now),
      };
    case "yesterday": {
      const yesterday = new Date(now);
      yesterday.setDate(yesterday.getDate() - 1);
      return {
        preset: "yesterday",
        from: startOfLocalDay(yesterday),
        to: endOfLocalDay(yesterday),
      };
    }
    case "last_7_days": {
      const from = startOfLocalDay(now);
      from.setDate(from.getDate() - 6);
      return { preset: "last_7_days", from, to: endOfLocalDay(now) };
    }
    case "last_30_days": {
      const from = startOfLocalDay(now);
      from.setDate(from.getDate() - 29);
      return { preset: "last_30_days", from, to: endOfLocalDay(now) };
    }
    case "custom": {
      const fromRaw = parseDateOnly(input.dateFrom);
      const toRaw = parseDateOnly(input.dateTo);
      return {
        preset: "custom",
        from: fromRaw ? startOfLocalDay(fromRaw) : null,
        to: toRaw ? endOfLocalDay(toRaw) : fromRaw ? endOfLocalDay(fromRaw) : null,
      };
    }
    default:
      return { preset: "all", from: null, to: null };
  }
}

function statusLabel(status: ApplicationStatus | string): string {
  if (status in APPLICATION_STATUS_LABELS) {
    return APPLICATION_STATUS_LABELS[status as ApplicationStatus];
  }
  return String(status)
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function statusesForTab(tab: OperationsCandidateTab): ApplicationStatus[] | null {
  switch (tab) {
    case "applied":
      return APPLIED_TAB_STATUSES;
    case "under_review":
      return ["under_review"];
    case "shortlisted":
      return SHORTLISTED_TAB_STATUSES;
    case "interview":
      return INTERVIEW_TAB_STATUSES;
    case "hired":
      return HIRED_TAB_STATUSES;
    case "rejected":
      return ["rejected"];
    default:
      return null;
  }
}

function candidateFromSources(
  snapshot: ApplicationResumeSnapshot | null,
  jobSeeker: {
    fullName?: string;
    whatsappNumber?: string;
    city?: string;
    state?: string;
    preferredJobLocation?: string;
    skills?: string[];
    gender?: string | null;
    experienceType?: string | null;
    profilePhoto?: { url?: string } | null;
    createdAt?: Date;
  } | null,
) {
  const header = snapshot?.resumeJson?.header;
  const contact = snapshot?.resumeJson?.sections?.contact;
  const sections = snapshot?.resumeJson?.sections;

  const fullName =
    text(header?.fullName) ||
    text(contact?.fullName) ||
    text(jobSeeker?.fullName) ||
    "Candidate";
  const phone =
    text(header?.phone) ||
    text(contact?.phone) ||
    text(jobSeeker?.whatsappNumber);
  const email = text((contact as { email?: string } | undefined)?.email);
  const city = text(header?.city) || text(contact?.city) || text(jobSeeker?.city);
  const state =
    text(header?.state) || text(contact?.state) || text(jobSeeker?.state);
  const location =
    [city, state].filter(Boolean).join(", ") ||
    text(jobSeeker?.preferredJobLocation) ||
    text(header?.location);
  const headline =
    text(sections?.professionalHeadline) || text(header?.headline);
  const experienceLabel = sections?.isFresher
    ? "Fresher"
    : text(sections?.experienceLabel) ||
      (jobSeeker?.experienceType === "fresher" ? "Fresher" : "") ||
      headline ||
      "Experienced";
  const skills = Array.isArray(sections?.skills)
    ? sections.skills.map((item) => text(item)).filter(Boolean)
    : Array.isArray(jobSeeker?.skills)
      ? jobSeeker.skills.map((item) => text(item)).filter(Boolean)
      : [];

  return {
    fullName,
    phone,
    email,
    city,
    state,
    location,
    headline,
    experienceLabel,
    skills,
    gender: text(jobSeeker?.gender),
    profilePhotoUrl: text(jobSeeker?.profilePhoto?.url),
    registeredAt: jobSeeker?.createdAt
      ? jobSeeker.createdAt.toISOString()
      : null,
  };
}

function percentOf(part: number, total: number): number | null {
  if (total <= 0) {
    return null;
  }
  return Math.round((part / total) * 1000) / 10;
}

async function loadFilterOptions(): Promise<OperationsCandidatesFilterOptions> {
  const [jobRows, employerRows, locationRows, genderRows] = await Promise.all([
    JobModel.find({ status: "active" })
      .select("jobId jobTitle")
      .sort({ updatedAt: -1 })
      .limit(300)
      .lean(),
    EmployerModel.find({})
      .select("companyName establishmentName")
      .sort({ updatedAt: -1 })
      .limit(300)
      .lean(),
    ApplicationModel.aggregate<{ _id: string }>([
      {
        $group: {
          _id: {
            $ifNull: [
              "$resumeSnapshot.resumeJson.header.city",
              "$resumeSnapshot.resumeJson.sections.contact.city",
            ],
          },
        },
      },
      { $match: { _id: { $nin: [null, ""] } } },
      { $sort: { _id: 1 } },
      { $limit: 200 },
    ]),
    JobSeekerModel.distinct("gender"),
  ]);

  return {
    jobs: jobRows
      .map((job) => ({
        value: job.jobId,
        label: `${job.jobTitle?.trim() || "Job"} (${job.jobId})`,
      }))
      .filter((item) => item.value),
    employers: employerRows
      .map((employer) => ({
        value: String(employer._id),
        label:
          employer.companyName?.trim() ||
          employer.establishmentName?.trim() ||
          "Employer",
      }))
      .filter((item) => item.value && item.label),
    locations: locationRows
      .map((row) => String(row._id ?? "").trim())
      .filter(Boolean),
    experienceLevels: ["Fresher", "Experienced"],
    genders: genderRows.map((value) => String(value ?? "").trim()).filter(Boolean),
  };
}

async function loadSummary(now: Date): Promise<{
  kpis: OperationsCandidatesKpis;
  counts: OperationsCandidatesTabCounts;
  insights: OperationsCandidatesInsight[];
}> {
  const startToday = startOfLocalDay(now);
  const endToday = endOfLocalDay(now);
  const start7 = startOfLocalDay(now);
  start7.setDate(start7.getDate() - 6);
  const startPrev7 = startOfLocalDay(now);
  startPrev7.setDate(startPrev7.getDate() - 13);
  const endPrev7 = endOfLocalDay(now);
  endPrev7.setDate(endPrev7.getDate() - 7);

  const [
    totalCandidates,
    newThisWeek,
    newPrevWeek,
    statusCounts,
    applicationsToday,
    applicationsNeedsReview,
    seekersNoActiveApp,
  ] = await Promise.all([
    JobSeekerModel.countDocuments({}),
    JobSeekerModel.countDocuments({
      createdAt: { $gte: start7, $lte: endToday },
    }),
    JobSeekerModel.countDocuments({
      createdAt: { $gte: startPrev7, $lte: endPrev7 },
    }),
    ApplicationModel.aggregate<{ _id: string; count: number }>([
      { $group: { _id: "$status", count: { $sum: 1 } } },
    ]),
    ApplicationModel.countDocuments({
      appliedAt: { $gte: startToday, $lte: endToday },
    }),
    ApplicationModel.countDocuments({
      status: { $in: NEEDS_REVIEW_STATUSES },
    }),
    JobSeekerModel.aggregate<{ count: number }>([
      {
        $lookup: {
          from: "applications",
          localField: "_id",
          foreignField: "jobSeekerId",
          as: "apps",
        },
      },
      {
        $match: {
          $or: [
            { apps: { $size: 0 } },
            {
              apps: {
                $not: {
                  $elemMatch: {
                    status: { $in: ACTIVE_APPLICATION_STATUSES },
                  },
                },
              },
            },
          ],
        },
      },
      { $count: "count" },
    ]).then((rows) => rows[0]?.count ?? 0),
  ]);

  const byStatus = new Map(
    statusCounts.map((row) => [String(row._id), row.count] as const),
  );
  const countStatuses = (statuses: readonly string[]) =>
    statuses.reduce((sum, status) => sum + (byStatus.get(status) ?? 0), 0);

  const shortlisted = countStatuses(SHORTLISTED_TAB_STATUSES);
  const hired = countStatuses(HIRED_TAB_STATUSES);
  const rejected = byStatus.get("rejected") ?? 0;
  const activeApplications = countStatuses(ACTIVE_APPLICATION_STATUSES);
  const applied = countStatuses(APPLIED_TAB_STATUSES);
  const underReview = byStatus.get("under_review") ?? 0;
  const interview = countStatuses(INTERVIEW_TAB_STATUSES);

  const weekChange =
    newPrevWeek > 0
      ? Math.round(((newThisWeek - newPrevWeek) / newPrevWeek) * 1000) / 10
      : newThisWeek > 0
        ? 100
        : null;

  const kpis: OperationsCandidatesKpis = {
    totalCandidates,
    newThisWeek,
    newThisWeekChangePercent: weekChange,
    activeApplications,
    shortlisted,
    shortlistedPercent: percentOf(shortlisted, totalCandidates),
    hired,
    hiredPercent: percentOf(hired, totalCandidates),
    rejected,
    rejectedPercent: percentOf(rejected, totalCandidates),
  };

  const counts: OperationsCandidatesTabCounts = {
    all: totalCandidates,
    applied,
    under_review: underReview,
    shortlisted,
    interview,
    hired,
    rejected,
  };

  const insights: OperationsCandidatesInsight[] = [
    {
      id: "new-today",
      label: "New candidates today",
      count: await JobSeekerModel.countDocuments({
        createdAt: { $gte: startToday, $lte: endToday },
      }),
      datePreset: "today",
    },
    {
      id: "registered-7d",
      label: "Candidates added in last 7 days",
      count: newThisWeek,
      datePreset: "last_7_days",
    },
    {
      id: "needs-review",
      label: "Applications needing review",
      count: applicationsNeedsReview,
      tab: "applied",
    },
    {
      id: "shortlisted",
      label: "Shortlisted candidates",
      count: shortlisted,
      tab: "shortlisted",
    },
    {
      id: "hired",
      label: "Candidates hired",
      count: hired,
      tab: "hired",
    },
    {
      id: "no-active-app",
      label: "Candidates with no active application",
      count: seekersNoActiveApp,
    },
    {
      id: "applications-today",
      label: "Applications received today",
      count: applicationsToday,
      datePreset: "today",
    },
  ];

  return { kpis, counts, insights };
}

async function loadPeriodStats(input: {
  datePreset: OperationsCandidateDatePreset;
  dateFrom: string;
  dateTo: string;
}): Promise<OperationsCandidatesPeriodStats> {
  const range = resolveDateRange(input);
  if (!range.from && !range.to) {
    const [candidatesRegistered, applicationsReceived] = await Promise.all([
      JobSeekerModel.estimatedDocumentCount(),
      ApplicationModel.estimatedDocumentCount(),
    ]);
    return {
      preset: "all",
      from: null,
      to: null,
      candidatesRegistered,
      applicationsReceived,
    };
  }

  const createdAt: Record<string, Date> = {};
  const appliedAt: Record<string, Date> = {};
  if (range.from) {
    createdAt.$gte = range.from;
    appliedAt.$gte = range.from;
  }
  if (range.to) {
    createdAt.$lte = range.to;
    appliedAt.$lte = range.to;
  }

  const [candidatesRegistered, applicationsReceived] = await Promise.all([
    JobSeekerModel.countDocuments({ createdAt }),
    ApplicationModel.countDocuments({ appliedAt }),
  ]);

  return {
    preset: range.preset,
    from: range.from?.toISOString() ?? null,
    to: range.to?.toISOString() ?? null,
    candidatesRegistered,
    applicationsReceived,
  };
}

function requiresApplicationRow(query: ListOperationsCandidatesQuery): boolean {
  if (query.tab !== "all") {
    return true;
  }
  if (query.status.trim()) {
    return true;
  }
  if (query.jobId.trim() || query.employerId.trim()) {
    return true;
  }
  if (query.dateField === "applied" && query.datePreset !== "all") {
    return true;
  }
  return false;
}

function buildSeekerIdSuffixMatch(
  search: string,
): Record<string, unknown> | null {
  const { idToken } = normalizeCandidateSearch(search);
  if (!idToken) {
    return null;
  }

  return buildObjectIdSuffixMatch("_id", idToken);
}

function isCandidateIdOnlyQuery(search: string): boolean {
  const { text: trimmed, idToken } = normalizeCandidateSearch(search);
  if (!trimmed || !idToken) {
    return false;
  }
  return (
    trimmed === idToken ||
    trimmed.replace(/^AJ-?CAN[-:\s_]*/i, "").trim() === idToken
  );
}

/** Candidate Name only (case-insensitive partial match). */
function buildSeekerTextSearchClauses(
  search: string,
): Record<string, unknown>[] {
  const { text: trimmed } = normalizeCandidateSearch(search);
  if (!trimmed || isCandidateIdOnlyQuery(search)) {
    return [];
  }

  const pattern = escapeRegex(trimmed);
  return [{ fullName: { $regex: pattern, $options: "i" } }];
}

/**
 * Resolve seeker IDs from Applied Job Title and Candidate Name on applications,
 * plus Candidate ID (jobSeekerId) matches.
 */
async function findSeekerIdsMatchingApplicationSearch(
  search: string,
): Promise<mongoose.Types.ObjectId[]> {
  const { text: trimmed, idToken } = normalizeCandidateSearch(search);
  if (!trimmed) {
    return [];
  }

  const idOnly = isCandidateIdOnlyQuery(search);
  const pattern = escapeRegex(trimmed);

  const jobTitleMatchesPromise = idOnly
    ? Promise.resolve([] as Array<{ _id: mongoose.Types.ObjectId }>)
    : ApplicationModel.aggregate<{ _id: mongoose.Types.ObjectId }>([
        {
          $lookup: {
            from: "jobs",
            localField: "jobId",
            foreignField: "_id",
            as: "job",
          },
        },
        { $unwind: { path: "$job", preserveNullAndEmptyArrays: false } },
        {
          $match: {
            "job.jobTitle": { $regex: pattern, $options: "i" },
          },
        },
        { $group: { _id: "$jobSeekerId" } },
      ]);

  const nameMatchesPromise = idOnly
    ? Promise.resolve([] as mongoose.Types.ObjectId[])
    : ApplicationModel.distinct("jobSeekerId", {
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
        ],
      });

  const suffixAggregations =
    idToken && idToken.length >= 8 && idToken.length < 24
      ? ApplicationModel.aggregate<{ jobSeekerId: mongoose.Types.ObjectId }>([
          { $match: buildObjectIdSuffixMatch("jobSeekerId", idToken) },
          { $project: { jobSeekerId: 1 } },
        ])
      : Promise.resolve(
          [] as Array<{ jobSeekerId: mongoose.Types.ObjectId }>,
        );

  const fullIdMatches =
    idToken && idToken.length === 24
      ? ApplicationModel.distinct("jobSeekerId", {
          jobSeekerId: new mongoose.Types.ObjectId(idToken),
        })
      : Promise.resolve([] as mongoose.Types.ObjectId[]);

  const [nameMatches, jobTitleMatches, suffixMatches, fullIdRows] =
    await Promise.all([
      nameMatchesPromise,
      jobTitleMatchesPromise,
      suffixAggregations,
      fullIdMatches,
    ]);

  const ids = new Map<string, mongoose.Types.ObjectId>();
  for (const id of nameMatches) {
    if (id) {
      ids.set(String(id), id as mongoose.Types.ObjectId);
    }
  }
  for (const row of jobTitleMatches) {
    if (row._id) {
      ids.set(String(row._id), row._id);
    }
  }
  for (const row of suffixMatches) {
    if (row.jobSeekerId) {
      ids.set(String(row.jobSeekerId), row.jobSeekerId);
    }
  }
  for (const id of fullIdRows) {
    if (id) {
      ids.set(String(id), id as mongoose.Types.ObjectId);
    }
  }

  return [...ids.values()];
}

function buildSeekerMatch(
  query: ListOperationsCandidatesQuery,
  searchMatchedSeekerIds: mongoose.Types.ObjectId[] = [],
): Record<string, unknown> {
  const andClauses: Record<string, unknown>[] = [];

  const range = resolveDateRange({
    datePreset: query.datePreset,
    dateFrom: query.dateFrom,
    dateTo: query.dateTo,
  });

  if (query.dateField === "registered" && (range.from || range.to)) {
    const createdAt: Record<string, Date> = {};
    if (range.from) createdAt.$gte = range.from;
    if (range.to) createdAt.$lte = range.to;
    andClauses.push({ createdAt });
  }

  if (query.gender.trim()) {
    andClauses.push({
      gender: {
        $regex: `^${escapeRegex(query.gender.trim())}$`,
        $options: "i",
      },
    });
  }

  if (query.experience.trim()) {
    const experience = query.experience.trim().toLowerCase();
    if (experience === "fresher") {
      andClauses.push({ experienceType: "fresher" });
    } else if (experience === "experienced") {
      andClauses.push({
        $or: [
          { experienceType: "experienced" },
          { experienceType: { $exists: false } },
          { experienceType: null },
        ],
      });
    }
  }

  if (query.location.trim()) {
    const pattern = escapeRegex(query.location.trim());
    andClauses.push({
      $or: [
        { city: { $regex: pattern, $options: "i" } },
        { state: { $regex: pattern, $options: "i" } },
        { preferredJobLocation: { $regex: pattern, $options: "i" } },
      ],
    });
  }

  const search = query.search.trim();
  if (search) {
    const searchOr: Record<string, unknown>[] = [
      ...buildSeekerTextSearchClauses(search),
    ];

    const idSuffixMatch = buildSeekerIdSuffixMatch(search);
    if (idSuffixMatch) {
      searchOr.push(idSuffixMatch);
    }

    if (searchMatchedSeekerIds.length > 0) {
      searchOr.push({ _id: { $in: searchMatchedSeekerIds } });
    }

    // Only add the $or clause when at least one branch exists.
    if (searchOr.length > 0) {
      andClauses.push({ $or: searchOr });
    }
  }

  return andClauses.length > 0 ? { $and: andClauses } : {};
}

function buildApplicationSubpipeline(
  query: ListOperationsCandidatesQuery,
): mongoose.PipelineStage.FacetPipelineStage[] {
  const stages: mongoose.PipelineStage.FacetPipelineStage[] = [
    {
      $match: {
        $expr: {
          $eq: [{ $toString: "$jobSeekerId" }, { $toString: "$$seekerId" }],
        },
      },
    },
  ];

  const tabStatuses = statusesForTab(query.tab);
  if (tabStatuses) {
    stages.push({ $match: { status: { $in: tabStatuses } } });
  }
  if (query.status && query.tab === "all") {
    stages.push({ $match: { status: query.status } });
  }
  if (query.jobId.trim()) {
    stages.push({
      $match: { publicJobId: query.jobId.trim().toUpperCase() },
    });
  }
  if (query.employerId.trim()) {
    stages.push({
      $match: {
        employerId: new mongoose.Types.ObjectId(query.employerId.trim()),
      },
    });
  }

  const range = resolveDateRange({
    datePreset: query.datePreset,
    dateFrom: query.dateFrom,
    dateTo: query.dateTo,
  });
  if (query.dateField === "applied" && (range.from || range.to)) {
    const appliedAt: Record<string, Date> = {};
    if (range.from) appliedAt.$gte = range.from;
    if (range.to) appliedAt.$lte = range.to;
    stages.push({ $match: { appliedAt } });
  }

  stages.push({ $sort: { appliedAt: -1 } }, { $limit: 1 });
  return stages;
}

type SeekerListRow = {
  _id: mongoose.Types.ObjectId;
  fullName?: string;
  whatsappNumber?: string;
  city?: string;
  state?: string;
  preferredJobLocation?: string;
  skills?: string[];
  gender?: string | null;
  experienceType?: string | null;
  profilePhoto?: { url?: string } | null;
  createdAt?: Date;
  app?: {
    _id: mongoose.Types.ObjectId;
    publicJobId?: string;
    status?: ApplicationStatus | string;
    resumeSnapshot?: unknown;
    appliedAt?: Date;
    employerId?: mongoose.Types.ObjectId;
  } | null;
  job?: {
    jobTitle?: string;
    companyName?: string;
  } | null;
  employer?: {
    _id?: mongoose.Types.ObjectId;
    companyName?: string;
    establishmentName?: string;
    companyLogo?: { url?: string } | null;
    profilePhoto?: { url?: string } | null;
    isWhatsappVerified?: boolean;
    registrationStatus?: string;
  } | null;
};

function toListItemFromSeeker(row: SeekerListRow): OperationsCandidateListItem {
  const app = row.app ?? null;
  const candidate = candidateFromSources(asSnapshot(app?.resumeSnapshot), {
    fullName: row.fullName,
    whatsappNumber: row.whatsappNumber,
    city: row.city,
    state: row.state,
    preferredJobLocation: row.preferredJobLocation,
    skills: row.skills,
    gender: row.gender,
    experienceType: row.experienceType,
    profilePhoto: row.profilePhoto,
    createdAt: row.createdAt,
  });

  const employerName =
    row.employer?.companyName?.trim() ||
    row.employer?.establishmentName?.trim() ||
    row.job?.companyName?.trim() ||
    "";

  const hasApplication = Boolean(app?._id);

  return {
    id: row._id.toString(),
    applicationId: app?._id ? String(app._id) : null,
    jobSeekerId: row._id.toString(),
    candidateName: candidate.fullName,
    candidatePhone: candidate.phone,
    candidateEmail: candidate.email,
    candidateHeadline: candidate.headline,
    candidateExperienceLabel: candidate.experienceLabel,
    candidateLocation: candidate.location,
    candidateSkills: candidate.skills.slice(0, 6),
    candidateGender: candidate.gender,
    profilePhotoUrl: candidate.profilePhotoUrl,
    publicJobId: text(app?.publicJobId),
    jobTitle: row.job?.jobTitle?.trim() || (hasApplication ? "Job" : ""),
    employerId: row.employer?._id ? String(row.employer._id) : "",
    employerName: employerName || (hasApplication ? "Employer" : ""),
    employerLogoUrl: row.employer
      ? resolveEmployerPosterImageUrl(row.employer)
      : "",
    employerVerified: Boolean(
      row.employer?.isWhatsappVerified ||
        row.employer?.registrationStatus === "completed",
    ),
    status: hasApplication ? (app?.status as ApplicationStatus) : null,
    statusLabel: hasApplication
      ? statusLabel(String(app?.status ?? ""))
      : "No application",
    appliedAt: app?.appliedAt ? app.appliedAt.toISOString() : null,
    registeredAt: candidate.registeredAt,
    hasApplication,
  };
}

function toListItem(row: {
  _id: mongoose.Types.ObjectId;
  jobSeekerId?: mongoose.Types.ObjectId;
  publicJobId: string;
  status: ApplicationStatus | string;
  resumeSnapshot: unknown;
  appliedAt: Date;
  job?: {
    jobTitle?: string;
    companyName?: string;
  };
  employer?: {
    _id?: mongoose.Types.ObjectId;
    companyName?: string;
    establishmentName?: string;
    companyLogo?: { url?: string } | null;
    profilePhoto?: { url?: string } | null;
    isWhatsappVerified?: boolean;
    registrationStatus?: string;
  };
  jobSeekerDoc?: {
    fullName?: string;
    whatsappNumber?: string;
    city?: string;
    state?: string;
    preferredJobLocation?: string;
    skills?: string[];
    gender?: string | null;
    experienceType?: string | null;
    profilePhoto?: { url?: string } | null;
    createdAt?: Date;
  } | null;
}): OperationsCandidateListItem {
  return toListItemFromSeeker({
    _id: row.jobSeekerId ?? row._id,
    fullName: row.jobSeekerDoc?.fullName,
    whatsappNumber: row.jobSeekerDoc?.whatsappNumber,
    city: row.jobSeekerDoc?.city,
    state: row.jobSeekerDoc?.state,
    preferredJobLocation: row.jobSeekerDoc?.preferredJobLocation,
    skills: row.jobSeekerDoc?.skills,
    gender: row.jobSeekerDoc?.gender,
    experienceType: row.jobSeekerDoc?.experienceType,
    profilePhoto: row.jobSeekerDoc?.profilePhoto,
    createdAt: row.jobSeekerDoc?.createdAt,
    app: {
      _id: row._id,
      publicJobId: row.publicJobId,
      status: row.status,
      resumeSnapshot: row.resumeSnapshot,
      appliedAt: row.appliedAt,
    },
    job: row.job,
    employer: row.employer,
  });
}

export const operationsCandidatesService = {
  async listCandidates(
    query: ListOperationsCandidatesQuery,
  ): Promise<OperationsCandidatesListResult> {
    const now = new Date();
    const searchMatchedSeekerIds = query.search.trim()
      ? await findSeekerIdsMatchingApplicationSearch(query.search)
      : [];
    const seekerMatch = buildSeekerMatch(query, searchMatchedSeekerIds);
    const mustHaveApp = requiresApplicationRow(query);

    const sortStage: Record<string, 1 | -1> =
      query.sort === "oldest"
        ? mustHaveApp
          ? { "app.appliedAt": 1 }
          : { createdAt: 1 }
        : query.sort === "updated"
          ? { updatedAt: -1 }
          : mustHaveApp
            ? { "app.appliedAt": -1 }
            : { createdAt: -1 };

    const pipeline: mongoose.PipelineStage[] = [
      { $match: seekerMatch },
      {
        $lookup: {
          from: "applications",
          let: { seekerId: "$_id" },
          pipeline: buildApplicationSubpipeline(query),
          as: "app",
        },
      },
      {
        $unwind: {
          path: "$app",
          preserveNullAndEmptyArrays: !mustHaveApp,
        },
      },
      {
        $lookup: {
          from: "jobs",
          localField: "app.jobId",
          foreignField: "_id",
          as: "job",
        },
      },
      { $unwind: { path: "$job", preserveNullAndEmptyArrays: true } },
      {
        $lookup: {
          from: "employers",
          localField: "app.employerId",
          foreignField: "_id",
          as: "employer",
        },
      },
      { $unwind: { path: "$employer", preserveNullAndEmptyArrays: true } },
    ];

    if (mustHaveApp) {
      pipeline.push({ $match: { app: { $ne: null } } });
    }

    pipeline.push({ $sort: sortStage });
    pipeline.push({
      $facet: {
        items: [
          { $skip: (query.page - 1) * query.limit },
          { $limit: query.limit },
        ],
        totalCount: [{ $count: "count" }],
      },
    });

    const [facet, summary, periodStats, filterOptions] = await Promise.all([
      JobSeekerModel.aggregate<{
        items: SeekerListRow[];
        totalCount: Array<{ count: number }>;
      }>(pipeline),
      loadSummary(now),
      loadPeriodStats({
        datePreset: query.datePreset,
        dateFrom: query.dateFrom,
        dateTo: query.dateTo,
      }),
      loadFilterOptions(),
    ]);

    const total = facet?.[0]?.totalCount?.[0]?.count ?? 0;
    const applications = (facet?.[0]?.items ?? []).map(toListItemFromSeeker);
    const pagination = buildListPagination(query.page, query.limit, total);

    return {
      kpis: summary.kpis,
      counts: summary.counts,
      insights: summary.insights,
      periodStats,
      filterOptions,
      applications,
      pagination: {
        ...pagination,
        page:
          query.page > pagination.totalPages ? pagination.page : query.page,
      },
    };
  },

  async getSeekerDetail(jobSeekerId: string): Promise<OperationsCandidateDetail> {
    if (!mongoose.Types.ObjectId.isValid(jobSeekerId)) {
      throw new AppError("Candidate not found.", HTTP_STATUS.NOT_FOUND);
    }

    const jobSeeker = await JobSeekerModel.findById(jobSeekerId)
      .select(
        "fullName whatsappNumber city state preferredJobLocation skills gender experienceType profilePhoto createdAt",
      )
      .lean();

    if (!jobSeeker) {
      throw new AppError("Candidate not found.", HTTP_STATUS.NOT_FOUND);
    }

    const application = await ApplicationModel.findOne({
      jobSeekerId: jobSeeker._id,
    })
      .sort({ appliedAt: -1 })
      .lean();

    if (!application) {
      const listItem = toListItemFromSeeker({
        _id: jobSeeker._id as mongoose.Types.ObjectId,
        fullName: jobSeeker.fullName,
        whatsappNumber: jobSeeker.whatsappNumber,
        city: jobSeeker.city,
        state: jobSeeker.state,
        preferredJobLocation: jobSeeker.preferredJobLocation,
        skills: jobSeeker.skills,
        gender: jobSeeker.gender,
        experienceType: jobSeeker.experienceType,
        profilePhoto: jobSeeker.profilePhoto,
        createdAt: jobSeeker.createdAt,
        app: null,
        job: null,
        employer: null,
      });

      const candidate = candidateFromSources(null, jobSeeker);

      return {
        ...listItem,
        candidateCity: candidate.city,
        candidateState: candidate.state,
        skills: candidate.skills,
        jobCompanyName: "",
        resumeVersion: 0,
        resumeStatus: "",
        statusHistory: [],
        descriptionExcerpt: "",
      };
    }

    return this.getApplicationDetail(String(application._id));
  },

  async getApplicationDetail(
    applicationId: string,
  ): Promise<OperationsCandidateDetail> {
    if (!mongoose.Types.ObjectId.isValid(applicationId)) {
      throw new AppError("Application not found.", HTTP_STATUS.NOT_FOUND);
    }

    const application = await ApplicationModel.findById(applicationId).lean();
    if (!application) {
      throw new AppError("Application not found.", HTTP_STATUS.NOT_FOUND);
    }

    const [job, employer, jobSeeker] = await Promise.all([
      JobModel.findById(application.jobId)
        .select("jobId jobTitle companyName description")
        .lean(),
      EmployerModel.findById(application.employerId)
        .select(
          "companyName establishmentName companyLogo profilePhoto isWhatsappVerified registrationStatus",
        )
        .lean(),
      JobSeekerModel.findById(application.jobSeekerId)
        .select(
          "fullName whatsappNumber city state preferredJobLocation skills gender experienceType profilePhoto createdAt",
        )
        .lean(),
    ]);

    const listItem = toListItem({
      _id: application._id as mongoose.Types.ObjectId,
      jobSeekerId: application.jobSeekerId as mongoose.Types.ObjectId,
      publicJobId: application.publicJobId,
      status: application.status,
      resumeSnapshot: application.resumeSnapshot,
      appliedAt: application.appliedAt,
      job: job ?? undefined,
      employer: employer ?? undefined,
      jobSeekerDoc: jobSeeker ?? undefined,
    });

    const candidate = candidateFromSources(
      asSnapshot(application.resumeSnapshot),
      jobSeeker ?? null,
    );

    const history = Array.isArray(application.statusHistory)
      ? application.statusHistory.map((entry, index) => ({
          status: String(entry.status ?? ""),
          statusLabel: statusLabel(String(entry.status ?? "")),
          at:
            entry.at instanceof Date
              ? entry.at.toISOString()
              : new Date(entry.at).toISOString(),
          actor: String(entry.actorType ?? "system"),
          id: `${index}`,
        }))
      : [];

    return {
      ...listItem,
      candidateCity: candidate.city,
      candidateState: candidate.state,
      skills: candidate.skills,
      jobCompanyName: job?.companyName?.trim() || listItem.employerName,
      resumeVersion: application.resumeVersion ?? 1,
      resumeStatus: application.resumeStatus ?? "",
      statusHistory: history.map(({ status, statusLabel: label, at, actor }) => ({
        status,
        statusLabel: label,
        at,
        actor,
      })),
      descriptionExcerpt: text(job?.description).slice(0, 400),
    };
  },
};
