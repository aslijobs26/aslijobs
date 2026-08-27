import mongoose from "mongoose";
import {
  JOB_SEEKER_AVAILABILITY_STATUS_LABELS,
  JOB_SEEKER_JOB_ROLES,
} from "../../../constants/job-seeker.constants.js";
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
import { calculateProfileCompleteness } from "../../resumes/utils/profile-completeness.js";
import type {
  ListOperationsCandidateApplicationsQuery,
  ListOperationsCandidatesQuery,
} from "./operations-candidates.validation.js";
import type {
  OperationsCandidateApplicationItem,
  OperationsCandidateApplicationsResult,
  OperationsCandidateDatePreset,
  OperationsCandidateDetail,
  OperationsCandidateEducation,
  OperationsCandidateExperienceEntry,
  OperationsCandidateListItem,
  OperationsCandidateProfileStatus,
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

const EDUCATION_LEVEL_LABELS: Record<string, string> = {
  no_formal_education: "No Formal Education",
  below_10th: "Below 10th",
  "10th_pass": "10th Pass",
  intermediate: "Intermediate",
  iti: "ITI",
  diploma: "Diploma",
  graduation: "Graduation",
  post_graduation: "Post Graduation",
};

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function text(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function splitCsv(value: unknown): string[] {
  const raw = text(value);
  if (!raw) {
    return [];
  }
  return raw
    .split(/[,;/|]+/)
    .map((part) => part.trim())
    .filter(Boolean);
}

function titleCaseToken(value: string): string {
  return value
    .split(/[_\s-]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(" ");
}

function profileStatusFromRegistration(
  registrationStatus: string | null | undefined,
): OperationsCandidateProfileStatus {
  return registrationStatus === "COMPLETED" ? "complete" : "incomplete";
}

function profileStatusLabel(
  status: OperationsCandidateProfileStatus,
): string {
  return status === "complete" ? "Complete" : "Incomplete";
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

const EXPERIENCE_NOT_SPECIFIED_LABEL = "Not specified";

function experienceLabelFromSeeker(jobSeeker: {
  experienceType?: string | null;
  experiences?: Array<{ duration?: string }> | null;
}): string {
  // Fresher selection always wins — do not show preferred role or other fields.
  if (jobSeeker.experienceType === "fresher") {
    return "Fresher";
  }

  const experiences = Array.isArray(jobSeeker.experiences)
    ? jobSeeker.experiences
    : [];
  // Prefer the duration they entered (e.g. "3 years").
  const duration = experiences
    .map((item) => text(item.duration))
    .find(Boolean);
  if (duration) {
    return duration;
  }

  // Experienced selected (or experience entries exist) but no duration text.
  if (jobSeeker.experienceType === "experienced" || experiences.length > 0) {
    return "Experienced";
  }

  return "";
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
    experiences?: Array<{ duration?: string }> | null;
    jobRole?: string | null;
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
  // Prefer live seeker profile experience. Never fall back to preferred role
  // (jobRole) or headline — those belong in other columns.
  const seekerExperienceLabel = jobSeeker
    ? experienceLabelFromSeeker(jobSeeker)
    : "";
  const resumeExperienceLabel = sections?.isFresher
    ? "Fresher"
    : text(sections?.experienceLabel);
  const experienceLabel =
    seekerExperienceLabel ||
    resumeExperienceLabel ||
    EXPERIENCE_NOT_SPECIFIED_LABEL;
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

function mapEducation(
  education: Record<string, unknown> | null | undefined,
): OperationsCandidateEducation {
  if (!education || typeof education !== "object") {
    return null;
  }

  const level = text(education.level);
  if (!level) {
    return null;
  }

  return {
    level,
    levelLabel: EDUCATION_LEVEL_LABELS[level] || titleCaseToken(level),
    schoolName: text(education.schoolName),
    collegeName: text(education.collegeName),
    instituteName: text(education.instituteName),
    board: text(education.board),
    stream: text(education.stream),
    trade: text(education.trade),
    branch: text(education.branch),
    degree: text(education.degree),
    specialization: text(education.specialization),
    passingYear: text(education.passingYear),
    percentage: text(education.percentage),
    cgpa: text(education.cgpa),
  };
}

function mapExperiences(
  experiences: unknown,
): OperationsCandidateExperienceEntry[] {
  if (!Array.isArray(experiences)) {
    return [];
  }

  return experiences.map((entry) => {
    const row = (entry ?? {}) as Record<string, unknown>;
    return {
      companyName: text(row.companyName),
      jobRole: text(row.jobRole),
      industry: text(row.industry),
      startDate: text(row.startDate),
      endDate: text(row.endDate),
      currentlyWorking: Boolean(row.currentlyWorking),
      duration: text(row.duration),
      salary: text(row.salary),
      location: text(row.location),
      responsibilities: text(row.responsibilities),
      achievements: text(row.achievements),
    };
  });
}

function formatLocationLabel(value: string): string {
  return value
    .split(",")
    .map((part) => titleCaseToken(part.trim()))
    .filter(Boolean)
    .join(", ");
}

/** Same formula used for list display, filter options, and location matching. */
function buildSeekerLocationLabel(input: {
  city?: string | null;
  state?: string | null;
  preferredJobLocation?: string | null;
}): string {
  const city = text(input.city);
  const state = text(input.state);
  const preferred = text(input.preferredJobLocation);
  const fromCityState = [city, state].filter(Boolean).join(", ");
  return fromCityState || preferred;
}

/**
 * Case-insensitive exact match against the canonical seeker location label.
 * Avoids mismatched "City, State" options that previously regex-matched city/state separately.
 */
function buildLocationFilterClause(locationFilter: string): Record<string, unknown> {
  const needle = locationFilter.trim().toLowerCase();
  return {
    $expr: {
      $eq: [
        {
          $toLower: {
            $let: {
              vars: {
                city: {
                  $trim: { input: { $ifNull: ["$city", ""] } },
                },
                state: {
                  $trim: { input: { $ifNull: ["$state", ""] } },
                },
                preferred: {
                  $trim: {
                    input: { $ifNull: ["$preferredJobLocation", ""] },
                  },
                },
              },
              in: {
                $let: {
                  vars: {
                    cityState: {
                      $trim: {
                        input: {
                          $cond: [
                            {
                              $and: [
                                { $ne: ["$$city", ""] },
                                { $ne: ["$$state", ""] },
                              ],
                            },
                            { $concat: ["$$city", ", ", "$$state"] },
                            {
                              $cond: [
                                { $ne: ["$$city", ""] },
                                "$$city",
                                {
                                  $cond: [
                                    { $ne: ["$$state", ""] },
                                    "$$state",
                                    "",
                                  ],
                                },
                              ],
                            },
                          ],
                        },
                      },
                    },
                  },
                  in: {
                    $cond: [
                      { $ne: ["$$cityState", ""] },
                      "$$cityState",
                      "$$preferred",
                    ],
                  },
                },
              },
            },
          },
        },
        needle,
      ],
    },
  };
}

async function loadFilterOptions(): Promise<OperationsCandidatesFilterOptions> {
  const [jobRows, employerRows, locationRows, genderRows, roleRows] =
    await Promise.all([
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
      JobSeekerModel.aggregate<{ label: string }>([
        {
          $project: {
            city: { $trim: { input: { $ifNull: ["$city", ""] } } },
            state: { $trim: { input: { $ifNull: ["$state", ""] } } },
            preferred: {
              $trim: { input: { $ifNull: ["$preferredJobLocation", ""] } },
            },
          },
        },
        {
          $project: {
            locationLabel: {
              $let: {
                vars: {
                  cityState: {
                    $trim: {
                      input: {
                        $cond: [
                          {
                            $and: [
                              { $ne: ["$city", ""] },
                              { $ne: ["$state", ""] },
                            ],
                          },
                          { $concat: ["$city", ", ", "$state"] },
                          {
                            $cond: [
                              { $ne: ["$city", ""] },
                              "$city",
                              {
                                $cond: [
                                  { $ne: ["$state", ""] },
                                  "$state",
                                  "",
                                ],
                              },
                            ],
                          },
                        ],
                      },
                    },
                  },
                },
                in: {
                  $cond: [
                    { $ne: ["$$cityState", ""] },
                    "$$cityState",
                    "$preferred",
                  ],
                },
              },
            },
          },
        },
        {
          $match: {
            locationLabel: { $nin: [null, ""] },
          },
        },
        {
          $group: {
            _id: { $toLower: "$locationLabel" },
            label: { $first: "$locationLabel" },
          },
        },
        { $sort: { label: 1 } },
        { $limit: 200 },
      ]),
      JobSeekerModel.distinct("gender"),
      JobSeekerModel.distinct("jobRole"),
    ]);

  const preferredRoles = [
    ...new Set([
      ...JOB_SEEKER_JOB_ROLES,
      ...roleRows.map((value) => text(value)).filter(Boolean),
    ]),
  ].sort((a, b) => a.localeCompare(b));

  const locations = [
    ...new Map(
      locationRows
        .map((row) => {
          const raw = text(row.label);
          if (!raw) {
            return null;
          }
          const label = formatLocationLabel(raw);
          return [label.toLowerCase(), label] as const;
        })
        .filter((entry): entry is readonly [string, string] => entry != null),
    ).values(),
  ].sort((a, b) => a.localeCompare(b));

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
    locations,
    experienceLevels: ["Fresher", "Experienced"],
    genders: genderRows.map((value) => String(value ?? "").trim()).filter(Boolean),
    preferredRoles,
    profileStatuses: [
      { value: "complete", label: "Complete" },
      { value: "incomplete", label: "Incomplete" },
    ],
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
    newCandidatesToday,
    newThisWeek,
    newPrevWeek,
    activeCandidates,
    statusCounts,
    withApplications,
    applicationsToday,
    applicationsNeedsReview,
    seekersNoActiveApp,
  ] = await Promise.all([
    JobSeekerModel.countDocuments({}),
    JobSeekerModel.countDocuments({
      createdAt: { $gte: startToday, $lte: endToday },
    }),
    JobSeekerModel.countDocuments({
      createdAt: { $gte: start7, $lte: endToday },
    }),
    JobSeekerModel.countDocuments({
      createdAt: { $gte: startPrev7, $lte: endPrev7 },
    }),
    JobSeekerModel.countDocuments({ registrationStatus: "COMPLETED" }),
    ApplicationModel.aggregate<{ _id: string; count: number }>([
      { $group: { _id: "$status", count: { $sum: 1 } } },
    ]),
    ApplicationModel.distinct("jobSeekerId").then((ids) => ids.length),
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
  const withoutApplications = Math.max(0, totalCandidates - withApplications);

  const weekChange =
    newPrevWeek > 0
      ? Math.round(((newThisWeek - newPrevWeek) / newPrevWeek) * 1000) / 10
      : newThisWeek > 0
        ? 100
        : null;

  const kpis: OperationsCandidatesKpis = {
    totalCandidates,
    newCandidatesToday,
    newThisWeek,
    newThisWeekChangePercent: weekChange,
    activeCandidates,
    withApplications,
    withApplicationsPercent: percentOf(withApplications, totalCandidates),
    withoutApplications,
    withoutApplicationsPercent: percentOf(withoutApplications, totalCandidates),
    shortlisted,
    hired,
    activeApplications,
    shortlistedPercent: percentOf(shortlisted, totalCandidates),
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
      count: newCandidatesToday,
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
    const [candidatesRegistered, withApplications, profilesIncomplete, recentlyActive] =
      await Promise.all([
        JobSeekerModel.estimatedDocumentCount(),
        ApplicationModel.distinct("jobSeekerId").then((ids) => ids.length),
        JobSeekerModel.countDocuments({
          registrationStatus: { $ne: "COMPLETED" },
        }),
        JobSeekerModel.countDocuments({ lastLoginAt: { $ne: null } }),
      ]);

    return {
      preset: "all",
      from: null,
      to: null,
      candidatesRegistered,
      withApplications,
      profilesIncomplete,
      recentlyActive,
      applicationsReceived: withApplications,
    };
  }

  const createdAt: Record<string, Date> = {};
  const lastLoginAt: Record<string, Date> = {};
  if (range.from) {
    createdAt.$gte = range.from;
    lastLoginAt.$gte = range.from;
  }
  if (range.to) {
    createdAt.$lte = range.to;
    lastLoginAt.$lte = range.to;
  }

  const registeredSeekers = await JobSeekerModel.find({ createdAt })
    .select("_id registrationStatus")
    .lean();
  const registeredIds = registeredSeekers.map(
    (row) => row._id as mongoose.Types.ObjectId,
  );

  const [withApplications, recentlyActive, applicationsReceived] =
    await Promise.all([
      registeredIds.length === 0
        ? Promise.resolve(0)
        : ApplicationModel.distinct("jobSeekerId", {
            jobSeekerId: { $in: registeredIds },
          }).then((ids) => ids.length),
      JobSeekerModel.countDocuments({ lastLoginAt }),
      ApplicationModel.countDocuments({
        appliedAt: {
          ...(range.from ? { $gte: range.from } : {}),
          ...(range.to ? { $lte: range.to } : {}),
        },
      }),
    ]);

  const profilesIncomplete = registeredSeekers.filter(
    (row) => row.registrationStatus !== "COMPLETED",
  ).length;

  return {
    preset: range.preset,
    from: range.from?.toISOString() ?? null,
    to: range.to?.toISOString() ?? null,
    candidatesRegistered: registeredSeekers.length,
    withApplications,
    profilesIncomplete,
    recentlyActive,
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
    idToken && idToken.length < 24
      ? ApplicationModel.aggregate<{ jobSeekerId: mongoose.Types.ObjectId }>([
          {
            $match: buildObjectIdSuffixMatch("jobSeekerId", idToken),
          },
          { $group: { _id: "$jobSeekerId", jobSeekerId: { $first: "$jobSeekerId" } } },
        ])
      : Promise.resolve([] as Array<{ jobSeekerId: mongoose.Types.ObjectId }>);

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
    andClauses.push(buildLocationFilterClause(query.location));
  }

  if (query.preferredRole.trim()) {
    andClauses.push({
      jobRole: {
        $regex: escapeRegex(query.preferredRole.trim()),
        $options: "i",
      },
    });
  }

  if (query.profileStatus === "complete") {
    andClauses.push({ registrationStatus: "COMPLETED" });
  } else if (query.profileStatus === "incomplete") {
    andClauses.push({ registrationStatus: { $ne: "COMPLETED" } });
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
  experiences?: Array<{ duration?: string }> | null;
  jobRole?: string | null;
  registrationStatus?: string;
  lastLoginAt?: Date | null;
  profilePhoto?: { url?: string } | null;
  createdAt?: Date;
  applicationCount?: number;
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
    experiences: row.experiences,
    jobRole: row.jobRole,
    profilePhoto: row.profilePhoto,
    createdAt: row.createdAt,
  });

  const employerName =
    row.employer?.companyName?.trim() ||
    row.employer?.establishmentName?.trim() ||
    row.job?.companyName?.trim() ||
    "";

  const hasApplication = Boolean(app?._id);
  const preferredRoles = splitCsv(row.jobRole);
  const profileStatus = profileStatusFromRegistration(row.registrationStatus);
  const applicationCount =
    typeof row.applicationCount === "number"
      ? row.applicationCount
      : hasApplication
        ? 1
        : 0;

  const seekerLocation = buildSeekerLocationLabel({
    city: row.city,
    state: row.state,
    preferredJobLocation: row.preferredJobLocation,
  });

  return {
    id: String(row._id),
    applicationId: app?._id ? String(app._id) : null,
    jobSeekerId: String(row._id),
    candidateName: candidate.fullName,
    candidatePhone: candidate.phone,
    candidateEmail: candidate.email,
    candidateHeadline: candidate.headline,
    candidateExperienceLabel: candidate.experienceLabel,
    candidateLocation: seekerLocation || candidate.location,
    candidateSkills: candidate.skills.slice(0, 6),
    candidateGender: candidate.gender,
    profilePhotoUrl: candidate.profilePhotoUrl,
    preferredRoles,
    applicationCount,
    profileStatus,
    profileStatusLabel: profileStatusLabel(profileStatus),
    registrationStatus: text(row.registrationStatus) || "PENDING",
    lastActiveAt: row.lastLoginAt ? row.lastLoginAt.toISOString() : null,
    publicJobId: text(app?.publicJobId),
    jobTitle: text(row.job?.jobTitle),
    employerId: app?.employerId ? String(app.employerId) : "",
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

function buildDetailFromSeeker(input: {
  jobSeeker: Record<string, unknown> & {
    _id: mongoose.Types.ObjectId;
    createdAt?: Date;
    lastLoginAt?: Date | null;
    profilePhoto?: { url?: string } | null;
    uploadedResume?: {
      url?: string;
      originalName?: string;
    } | null;
    education?: Record<string, unknown> | null;
    experiences?: unknown;
    languages?: string[];
  };
  listItem: OperationsCandidateListItem;
  applicationCount: number;
  shortlistedCount: number;
  latestApplication?: {
    resumeVersion?: number;
    resumeStatus?: string;
    statusHistory?: Array<{
      status?: string;
      at?: Date | string;
      actorType?: string;
    }>;
    resumeSnapshot?: unknown;
  } | null;
  jobCompanyName?: string;
  descriptionExcerpt?: string;
}): OperationsCandidateDetail {
  const { jobSeeker, listItem } = input;
  const completeness = calculateProfileCompleteness({
    fullName: text(jobSeeker.fullName),
    whatsappNumber: text(jobSeeker.whatsappNumber),
    dateOfBirth: (jobSeeker.dateOfBirth as Date | string | null) ?? null,
    gender: (jobSeeker.gender as string | null) ?? null,
    pincode: text(jobSeeker.pincode),
    city: text(jobSeeker.city),
    state: text(jobSeeker.state),
    jobRole: text(jobSeeker.jobRole),
    jobType: (jobSeeker.jobType as string | null) ?? null,
    workMode: (jobSeeker.workMode as string | null) ?? null,
    preferredJobLocation: text(jobSeeker.preferredJobLocation),
    expectedSalary: (jobSeeker.expectedSalary as number | null) ?? null,
    expectedSalaryPeriod:
      (jobSeeker.expectedSalaryPeriod as string | null) ?? null,
    education: jobSeeker.education ?? null,
    experienceType: (jobSeeker.experienceType as string | null) ?? null,
    experiences: Array.isArray(jobSeeker.experiences)
      ? jobSeeker.experiences
      : [],
    languages: Array.isArray(jobSeeker.languages) ? jobSeeker.languages : [],
    professionalSummary: text(jobSeeker.professionalSummary),
    skills: Array.isArray(jobSeeker.skills)
      ? (jobSeeker.skills as string[])
      : [],
  });

  const availabilityStatus = text(jobSeeker.availabilityStatus);
  const availabilityLabel =
    availabilityStatus &&
    availabilityStatus in JOB_SEEKER_AVAILABILITY_STATUS_LABELS
      ? JOB_SEEKER_AVAILABILITY_STATUS_LABELS[
          availabilityStatus as keyof typeof JOB_SEEKER_AVAILABILITY_STATUS_LABELS
        ]
      : availabilityStatus
        ? titleCaseToken(availabilityStatus)
        : "";

  const history = Array.isArray(input.latestApplication?.statusHistory)
    ? input.latestApplication.statusHistory.map((entry) => ({
        status: String(entry.status ?? ""),
        statusLabel: statusLabel(String(entry.status ?? "")),
        at:
          entry.at instanceof Date
            ? entry.at.toISOString()
            : entry.at
              ? new Date(entry.at).toISOString()
              : "",
        actor: String(entry.actorType ?? "system"),
      }))
    : [];

  const snapshotSkills = candidateFromSources(
    asSnapshot(input.latestApplication?.resumeSnapshot),
    {
      fullName: text(jobSeeker.fullName),
      whatsappNumber: text(jobSeeker.whatsappNumber),
      city: text(jobSeeker.city),
      state: text(jobSeeker.state),
      preferredJobLocation: text(jobSeeker.preferredJobLocation),
      skills: Array.isArray(jobSeeker.skills)
        ? (jobSeeker.skills as string[])
        : [],
      gender: (jobSeeker.gender as string | null) ?? null,
      experienceType: (jobSeeker.experienceType as string | null) ?? null,
      experiences: mapExperiences(jobSeeker.experiences),
      jobRole: text(jobSeeker.jobRole),
      profilePhoto: jobSeeker.profilePhoto,
      createdAt: jobSeeker.createdAt,
    },
  ).skills;

  return {
    ...listItem,
    applicationCount: input.applicationCount,
    shortlistedCount: input.shortlistedCount,
    candidateCity: text(jobSeeker.city),
    candidateState: text(jobSeeker.state),
    candidatePincode: text(jobSeeker.pincode),
    dateOfBirth:
      jobSeeker.dateOfBirth instanceof Date
        ? jobSeeker.dateOfBirth.toISOString()
        : jobSeeker.dateOfBirth
          ? new Date(String(jobSeeker.dateOfBirth)).toISOString()
          : null,
    skills:
      Array.isArray(jobSeeker.skills) && jobSeeker.skills.length > 0
        ? (jobSeeker.skills as string[]).map((item) => text(item)).filter(Boolean)
        : snapshotSkills,
    professionalSummary: text(jobSeeker.professionalSummary),
    education: mapEducation(jobSeeker.education),
    experiences: mapExperiences(jobSeeker.experiences),
    languages: Array.isArray(jobSeeker.languages)
      ? jobSeeker.languages.map((item) => titleCaseToken(String(item)))
      : [],
    preferredLocations: splitCsv(jobSeeker.preferredJobLocation),
    preferredRoles: splitCsv(jobSeeker.jobRole),
    jobType: text(jobSeeker.jobType)
      ? titleCaseToken(text(jobSeeker.jobType))
      : "",
    workMode: text(jobSeeker.workMode)
      ? titleCaseToken(text(jobSeeker.workMode))
      : "",
    expectedSalary:
      typeof jobSeeker.expectedSalary === "number"
        ? jobSeeker.expectedSalary
        : null,
    expectedSalaryPeriod: text(jobSeeker.expectedSalaryPeriod) || "per-month",
    availabilityStatus,
    availabilityLabel,
    willingToTravel: null,
    willingToRelocate: null,
    workShiftPreference: null,
    profileCompletionPercent: completeness.percent,
    uploadedResumeUrl: text(jobSeeker.uploadedResume?.url),
    uploadedResumeName: text(jobSeeker.uploadedResume?.originalName),
    jobCompanyName: input.jobCompanyName ?? listItem.employerName,
    resumeVersion: input.latestApplication?.resumeVersion ?? 0,
    resumeStatus: text(input.latestApplication?.resumeStatus),
    statusHistory: history,
    descriptionExcerpt: input.descriptionExcerpt ?? "",
    notesCount: 0,
  };
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
          pipeline: [
            {
              $match: {
                $expr: {
                  $eq: [
                    { $toString: "$jobSeekerId" },
                    { $toString: "$$seekerId" },
                  ],
                },
              },
            },
            { $count: "count" },
          ],
          as: "applicationCountRows",
        },
      },
      {
        $addFields: {
          applicationCount: {
            $ifNull: [{ $arrayElemAt: ["$applicationCountRows.count", 0] }, 0],
          },
        },
      },
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
        datePreset: query.analyticsPreset || query.datePreset,
        dateFrom: query.analyticsFrom || query.dateFrom,
        dateTo: query.analyticsTo || query.dateTo,
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

    const jobSeeker = await JobSeekerModel.findById(jobSeekerId).lean();

    if (!jobSeeker) {
      throw new AppError("Candidate not found.", HTTP_STATUS.NOT_FOUND);
    }

    const [applicationCount, shortlistedCount, latestApplication] =
      await Promise.all([
        ApplicationModel.countDocuments({ jobSeekerId: jobSeeker._id }),
        ApplicationModel.countDocuments({
          jobSeekerId: jobSeeker._id,
          status: { $in: SHORTLISTED_TAB_STATUSES },
        }),
        ApplicationModel.findOne({ jobSeekerId: jobSeeker._id })
          .sort({ appliedAt: -1 })
          .lean(),
      ]);

    let job: {
      jobTitle?: string;
      companyName?: string;
      description?: string;
    } | null = null;
    let employer: {
      _id?: mongoose.Types.ObjectId;
      companyName?: string;
      establishmentName?: string;
      companyLogo?: { url?: string } | null;
      profilePhoto?: { url?: string } | null;
      isWhatsappVerified?: boolean;
      registrationStatus?: string;
    } | null = null;

    if (latestApplication) {
      const [jobDoc, employerDoc] = await Promise.all([
        JobModel.findById(latestApplication.jobId)
          .select("jobId jobTitle companyName description")
          .lean(),
        EmployerModel.findById(latestApplication.employerId)
          .select(
            "companyName establishmentName companyLogo profilePhoto isWhatsappVerified registrationStatus",
          )
          .lean(),
      ]);
      job = jobDoc;
      employer = employerDoc;
    }

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
      experiences: jobSeeker.experiences,
      jobRole: jobSeeker.jobRole,
      registrationStatus: jobSeeker.registrationStatus,
      lastLoginAt: jobSeeker.lastLoginAt,
      profilePhoto: jobSeeker.profilePhoto,
      createdAt: jobSeeker.createdAt,
      applicationCount,
      app: latestApplication
        ? {
            _id: latestApplication._id as mongoose.Types.ObjectId,
            publicJobId: latestApplication.publicJobId,
            status: latestApplication.status,
            resumeSnapshot: latestApplication.resumeSnapshot,
            appliedAt: latestApplication.appliedAt,
            employerId: latestApplication.employerId as mongoose.Types.ObjectId,
          }
        : null,
      job: job ?? null,
      employer: employer ?? null,
    });

    return buildDetailFromSeeker({
      jobSeeker: jobSeeker as typeof jobSeeker & Record<string, unknown>,
      listItem,
      applicationCount,
      shortlistedCount,
      latestApplication,
      jobCompanyName: job?.companyName?.trim() || listItem.employerName,
      descriptionExcerpt: text(job?.description).slice(0, 400),
    });
  },

  async listSeekerApplications(
    jobSeekerId: string,
    query: ListOperationsCandidateApplicationsQuery,
  ): Promise<OperationsCandidateApplicationsResult> {
    if (!mongoose.Types.ObjectId.isValid(jobSeekerId)) {
      throw new AppError("Candidate not found.", HTTP_STATUS.NOT_FOUND);
    }

    const seekerExists = await JobSeekerModel.exists({ _id: jobSeekerId });
    if (!seekerExists) {
      throw new AppError("Candidate not found.", HTTP_STATUS.NOT_FOUND);
    }

    const seekerObjectId = new mongoose.Types.ObjectId(jobSeekerId);

    const pipeline: mongoose.PipelineStage[] = [
      { $match: { jobSeekerId: seekerObjectId } },
      { $sort: { appliedAt: -1 } },
      {
        $lookup: {
          from: "jobs",
          localField: "jobId",
          foreignField: "_id",
          as: "job",
        },
      },
      { $unwind: { path: "$job", preserveNullAndEmptyArrays: true } },
      {
        $lookup: {
          from: "employers",
          localField: "employerId",
          foreignField: "_id",
          as: "employer",
        },
      },
      { $unwind: { path: "$employer", preserveNullAndEmptyArrays: true } },
      {
        $facet: {
          items: [
            { $skip: (query.page - 1) * query.limit },
            { $limit: query.limit },
          ],
          totalCount: [{ $count: "count" }],
        },
      },
    ];

    const [facet] = await ApplicationModel.aggregate<{
      items: Array<{
        _id: mongoose.Types.ObjectId;
        publicJobId?: string;
        status?: ApplicationStatus | string;
        appliedAt?: Date;
        updatedAt?: Date;
        employerId?: mongoose.Types.ObjectId;
        job?: { jobTitle?: string };
        employer?: {
          companyName?: string;
          establishmentName?: string;
          isWhatsappVerified?: boolean;
          registrationStatus?: string;
        };
      }>;
      totalCount: Array<{ count: number }>;
    }>(pipeline);

    const total = facet?.totalCount?.[0]?.count ?? 0;
    const applications: OperationsCandidateApplicationItem[] = (
      facet?.items ?? []
    ).map((app) => {
      const employerName =
        app.employer?.companyName?.trim() ||
        app.employer?.establishmentName?.trim() ||
        "Employer";

      return {
        id: String(app._id),
        publicJobId: text(app.publicJobId),
        jobTitle: text(app.job?.jobTitle) || "Job",
        employerId: app.employerId ? String(app.employerId) : "",
        employerName,
        employerVerified: Boolean(
          app.employer?.isWhatsappVerified ||
            app.employer?.registrationStatus === "completed",
        ),
        status: app.status ?? "submitted",
        statusLabel: statusLabel(String(app.status ?? "submitted")),
        appliedAt: app.appliedAt ? app.appliedAt.toISOString() : null,
        updatedAt: app.updatedAt ? app.updatedAt.toISOString() : null,
      };
    });

    return {
      applications,
      pagination: buildListPagination(query.page, query.limit, total),
    };
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

    return this.getSeekerDetail(String(application.jobSeekerId));
  },
};
