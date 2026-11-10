import { APPLICATION_STATUS_LABELS } from "../../applications/application.constants.js";
import type { ApplicationStatus } from "../../applications/application.types.js";
import {
  APPLICATION_ACTIVITY_CATEGORIES,
  activityDate,
  activityDateField,
  activityNumberField,
  activityPlural,
  activityRefId,
  activityText,
  applicationActivityCategory as sharedApplicationActivityCategory,
  buildApplicationActivityStatsPipeline,
  buildApplicationEventCountPipeline,
  buildApplicationEventPagePipeline,
  countActivity,
  decodeActivityCursor,
  earliestActivityDate,
  emptyActivityCounts,
  encodeActivityCursor,
  inMemoryActivitySource as sharedInMemoryActivitySource,
  paginateActivity,
  parseApplicationActivityStats,
  type ActivityCursor,
  type ActivityFetchParams,
  type ActivityPage,
  type ActivitySource,
  type ActivityStage,
  type ApplicationActivityRow,
  type ApplicationActivityRowKind,
  type ApplicationActivityStats,
  type LoginClientSummary,
} from "../activity/activity-timeline.js";

export {
  buildTimestampedActivityCountPipeline,
  buildTimestampedActivityPipeline,
  compareActivityOrder,
  comesAfterCursor,
  describeLoginClient,
  type ApplicationActivityRow,
  type ApplicationActivityRowKind,
  type TimestampedActivitySourceConfig,
} from "../activity/activity-timeline.js";
import { describeLoginClient } from "../activity/activity-timeline.js";

/**
 * Operations "Account Activity & History" for one job seeker.
 * Built only from recorded data: every event has a real timestamp from the
 * source document. Facts without a recorded date (e.g. WhatsApp verified
 * before tracking) are shown in the journey, never as invented events.
 *
 * The timeline is a k-way merge of independent sources (seeker milestones,
 * resumes, saved jobs, logins, applications, audits). Each source returns
 * at most `limit + 1` rows strictly after a `(at, id)` cursor, newest first,
 * so no source is ever loaded in full.
 */

export const CANDIDATE_ACTIVITY_CATEGORIES = [
  "account",
  "profile",
  "resume",
  "saved_job",
  "application",
  "interview",
  "offer",
  "operations",
] as const;

export type CandidateActivityCategory =
  (typeof CANDIDATE_ACTIVITY_CATEGORIES)[number];

export const CANDIDATE_APPLICATION_ACTIVITY_CATEGORIES: readonly CandidateActivityCategory[] =
  APPLICATION_ACTIVITY_CATEGORIES;

export type CandidateActivityActor =
  | "candidate"
  | "employer"
  | "operations"
  | "system";

export type CandidateActivityEvent = {
  id: string;
  type: string;
  category: CandidateActivityCategory;
  title: string;
  description: string;
  at: string;
  actor: CandidateActivityActor;
  actorName: string;
  applicationId: string | null;
  publicJobId: string;
  jobTitle: string;
  employerName: string;
};

export const CANDIDATE_JOURNEY_STAGE_IDS = [
  "registered",
  "whatsapp_verified",
  "profile_completed",
  "resume_ready",
  "applied",
  "shortlisted",
  "interview",
  "offer",
  "hired",
] as const;

export type CandidateJourneyStageId =
  (typeof CANDIDATE_JOURNEY_STAGE_IDS)[number];

export type CandidateJourneyStage = {
  id: CandidateJourneyStageId;
  label: string;
  state: "done" | "current" | "pending";
  /** Null when reached but the source has no recorded timestamp. */
  at: string | null;
  detail: string;
};

export type CandidateActivitySummary = {
  applications: number;
  activeApplications: number;
  interviews: number;
  offers: number;
  offersAccepted: number;
  offersDeclined: number;
  hired: number;
  rejected: number;
  withdrawn: number;
  savedJobs: number;
  lastActivityAt: string | null;
};

export type CandidateActivityCategoryCounts = Record<
  "all" | CandidateActivityCategory,
  number
>;

const READY_RESUME_STATUSES = ["READY", "OUTDATED", "REGENERATING"] as const;

/** Registration audit duplicates the account-created event. */
export const SKIPPED_CANDIDATE_AUDIT_ACTIONS = ["candidate.registered"] as const;

const toDate = activityDate;
const clean = activityText;
const refId = activityRefId;
const plural = activityPlural;

export function candidateActivityStatusLabel(status: string): string {
  if (status in APPLICATION_STATUS_LABELS) {
    return APPLICATION_STATUS_LABELS[status as ApplicationStatus];
  }
  return status
    .split("_")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export function mapHistoryActor(
  actorType: string | null | undefined,
): CandidateActivityActor {
  switch (actorType) {
    case "job_seeker":
      return "candidate";
    case "employer":
      return "employer";
    case "operations":
      return "operations";
    default:
      return "system";
  }
}

function humanizeAction(action: string): string {
  const last = action.split(".").pop() ?? action;
  return candidateActivityStatusLabel(last);
}

// ---------------------------------------------------------------------------
// Cursor + ordering
// ---------------------------------------------------------------------------

export type CandidateActivityCursor = ActivityCursor;

export const encodeCandidateActivityCursor = encodeActivityCursor;

/** Returns null for anything that is not a cursor this module produced. */
export const decodeCandidateActivityCursor = decodeActivityCursor;

// ---------------------------------------------------------------------------
// Entries + sources
// ---------------------------------------------------------------------------

export type CandidateActivityRefs = {
  jobTitle(jobId: string | null): string;
  jobCompany(jobId: string | null): string;
  employerName(employerId: string | null): string;
};

/**
 * A timeline row before job/employer names are resolved. Names are looked
 * up only for the rows on the returned page.
 */
export type CandidateActivityEntry = {
  id: string;
  at: Date;
  category: CandidateActivityCategory;
  jobId: string | null;
  employerId: string | null;
  render(refs: CandidateActivityRefs): CandidateActivityEvent;
};

export type CandidateActivityFetchParams = ActivityFetchParams<CandidateActivityCategory>;

export type CandidateActivitySource = ActivitySource<
  CandidateActivityCategory,
  CandidateActivityEntry
>;

export function inMemoryActivitySource(
  name: string,
  entries: CandidateActivityEntry[],
): CandidateActivitySource {
  return sharedInMemoryActivitySource(name, entries);
}

export type CandidateActivityPage = ActivityPage<CandidateActivityEntry>;

export function paginateCandidateActivity(
  sources: readonly CandidateActivitySource[],
  params: CandidateActivityFetchParams,
): Promise<CandidateActivityPage> {
  return paginateActivity(sources, params);
}

export function emptyCandidateActivityCounts(): CandidateActivityCategoryCounts {
  return emptyActivityCounts(CANDIDATE_ACTIVITY_CATEGORIES);
}

export function countCandidateActivity(
  sources: readonly CandidateActivitySource[],
): Promise<CandidateActivityCategoryCounts> {
  return countActivity(sources, CANDIDATE_ACTIVITY_CATEGORIES);
}

// ---------------------------------------------------------------------------
// Row → entry mapping
// ---------------------------------------------------------------------------

function noJob() {
  return {
    applicationId: null,
    publicJobId: "",
    jobTitle: "",
    employerName: "",
  };
}

function staticEntry(
  event: Omit<CandidateActivityEvent, "at"> & { at: Date },
): CandidateActivityEntry {
  const rendered: CandidateActivityEvent = {
    ...event,
    at: event.at.toISOString(),
  };
  return {
    id: event.id,
    at: event.at,
    category: event.category,
    jobId: null,
    employerId: null,
    render: () => rendered,
  };
}

export type CandidateActivitySeekerInput = {
  createdAt?: Date | null;
  lastLoginAt?: Date | null;
  /** True when a login-history row already covers `lastLoginAt`. */
  lastLoginRecorded?: boolean;
  isWhatsappVerified?: boolean;
  whatsappVerifiedAt?: Date | null;
  registrationStatus?: string | null;
  profileCompletedAt?: Date | null;
  /** Current result of the shared apply-completion rules. */
  profileCompleteNow?: boolean;
  profileCompletionPercent: number;
  uploadedResume?: { originalName?: string; uploadedAt?: Date | null } | null;
  operationsFirstSeenAt?: Date | null;
  operationsFirstSeenByName?: string;
};

/** Milestones stored on the job seeker document itself. */
export function buildSeekerActivityEntries(
  seeker: CandidateActivitySeekerInput,
): CandidateActivityEntry[] {
  const entries: CandidateActivityEntry[] = [];

  const registeredAt = toDate(seeker.createdAt);
  if (registeredAt) {
    entries.push(
      staticEntry({
        id: "account:registered",
        type: "account_registered",
        category: "account",
        title: "Job seeker account registered",
        description: "Account created on AsliJobs.",
        at: registeredAt,
        actor: "candidate",
        actorName: "",
        ...noJob(),
      }),
    );
  }

  const verifiedAt = toDate(seeker.whatsappVerifiedAt);
  if (seeker.isWhatsappVerified && verifiedAt) {
    entries.push(
      staticEntry({
        id: "account:whatsapp_verified",
        type: "account_whatsapp_verified",
        category: "account",
        title: "WhatsApp number verified",
        description: "Phone verified by WhatsApp OTP.",
        at: verifiedAt,
        actor: "candidate",
        actorName: "",
        ...noJob(),
      }),
    );
  }

  const completedAt = toDate(seeker.profileCompletedAt);
  if (completedAt) {
    entries.push(
      staticEntry({
        id: "profile:completed",
        type: "profile_completed",
        category: "profile",
        title: "Profile completed",
        description: "All required profile sections were filled.",
        at: completedAt,
        actor: "candidate",
        actorName: "",
        ...noJob(),
      }),
    );
  }

  const seenAt = toDate(seeker.operationsFirstSeenAt);
  if (seenAt) {
    const name = clean(seeker.operationsFirstSeenByName);
    entries.push(
      staticEntry({
        id: "operations:first_seen",
        type: "operations_profile_reviewed",
        category: "operations",
        title: "Profile first opened by Operations",
        description: name
          ? `New registration reviewed by ${name}.`
          : "New registration reviewed by Operations.",
        at: seenAt,
        actor: "operations",
        actorName: name,
        ...noJob(),
      }),
    );
  }

  // Logins before login history existed only kept the latest timestamp.
  const loginAt = toDate(seeker.lastLoginAt);
  if (loginAt && !seeker.lastLoginRecorded) {
    entries.push(
      staticEntry({
        id: "account:last_login",
        type: "account_last_login",
        category: "account",
        title: "Last login",
        description: "Most recent sign-in to the job seeker portal.",
        at: loginAt,
        actor: "candidate",
        actorName: "",
        ...noJob(),
      }),
    );
  }

  const uploadedAt = toDate(seeker.uploadedResume?.uploadedAt);
  if (uploadedAt) {
    const name = clean(seeker.uploadedResume?.originalName);
    entries.push(
      staticEntry({
        id: "resume:uploaded",
        type: "resume_uploaded",
        category: "resume",
        title: "Resume uploaded",
        description: name ? `Uploaded file: ${name}` : "Uploaded a resume file.",
        at: uploadedAt,
        actor: "candidate",
        actorName: "",
        ...noJob(),
      }),
    );
  }

  return entries;
}

export type ResumeActivityRow = {
  eventId: string;
  at: Date;
  versionNumber?: number | null;
  status?: string | null;
  failureReason?: string | null;
};

export function resumeRowToEntry(row: ResumeActivityRow): CandidateActivityEntry {
  const version = row.versionNumber ?? 1;
  const status = clean(row.status);
  const failed = status === "FAILED";
  return staticEntry({
    id: row.eventId,
    type: failed ? "resume_generation_failed" : "resume_generated",
    category: "resume",
    title: failed
      ? `AsliResume v${version} generation failed`
      : `AsliResume v${version} generated`,
    description: failed
      ? clean(row.failureReason) || "Resume could not be generated."
      : status === "OUTDATED"
        ? "Profile changed after this version was generated."
        : "Resume generated from the job seeker profile.",
    at: row.at,
    actor: "system",
    actorName: "",
    ...noJob(),
  });
}

export type SavedJobActivityRow = {
  eventId: string;
  at: Date;
  jobId?: unknown;
  publicJobId?: string | null;
};

export function savedJobRowToEntry(
  row: SavedJobActivityRow,
): CandidateActivityEntry {
  const jobId = refId(row.jobId);
  const publicJobId = clean(row.publicJobId);
  return {
    id: row.eventId,
    at: row.at,
    category: "saved_job",
    jobId,
    employerId: null,
    render(refs) {
      const jobTitle = refs.jobTitle(jobId);
      const employerName = refs.jobCompany(jobId);
      return {
        id: row.eventId,
        type: "job_saved",
        category: "saved_job",
        title: jobTitle ? `Saved job · ${jobTitle}` : "Saved a job",
        description: [employerName, publicJobId].filter(Boolean).join(" · "),
        at: row.at.toISOString(),
        actor: "candidate",
        actorName: "",
        applicationId: null,
        publicJobId,
        jobTitle,
        employerName,
      };
    },
  };
}

export type AuditActivityRow = {
  eventId: string;
  at: Date;
  action: string;
  actorName?: string | null;
  reason?: string | null;
};

export function auditRowToEntry(row: AuditActivityRow): CandidateActivityEntry {
  const actorName = clean(row.actorName);
  const reason = clean(row.reason);
  return staticEntry({
    id: row.eventId,
    type: row.action,
    category: "operations",
    title: humanizeAction(row.action),
    description: [
      actorName ? `By ${actorName}` : "",
      reason ? `Reason: ${reason}` : "",
    ]
      .filter(Boolean)
      .join(" — "),
    at: row.at,
    actor: actorName.toUpperCase() === "SYSTEM" ? "system" : "operations",
    actorName,
    ...noJob(),
  });
}

export type LoginActivityRow = {
  eventId: string;
  at: Date;
  method?: string | null;
  client?: LoginClientSummary;
};

export function loginRowToEntry(row: LoginActivityRow): CandidateActivityEntry {
  const method = clean(row.method);
  return staticEntry({
    id: row.eventId,
    type: "account_login",
    category: "account",
    title:
      method === "registration_otp"
        ? "Signed in after completing registration"
        : "Logged in with WhatsApp OTP",
    description: describeLoginClient(row.client),
    at: row.at,
    actor: "candidate",
    actorName: "",
    ...noJob(),
  });
}

export function applicationActivityCategory(
  kind: ApplicationActivityRowKind,
  status: string,
): CandidateActivityCategory {
  return sharedApplicationActivityCategory(kind, status);
}

function applicationTitle(status: string, jobTitle: string): string {
  switch (status) {
    case "submitted":
      return `Applied to ${jobTitle}`;
    case "withdrawn":
      return `Withdrew application for ${jobTitle}`;
    default:
      return `${candidateActivityStatusLabel(status)} · ${jobTitle}`;
  }
}

export function applicationRowToEntry(
  row: ApplicationActivityRow,
): CandidateActivityEntry {
  const status = clean(row.status);
  const category = applicationActivityCategory(row.kind, status);
  const applicationId = refId(row.applicationId);
  const jobId = refId(row.jobId);
  const employerId = refId(row.employerId);
  const publicJobId = clean(row.publicJobId);

  return {
    id: row.eventId,
    at: row.at,
    category,
    jobId,
    employerId,
    render(refs) {
      const jobTitle = refs.jobTitle(jobId) || "Job";
      const employerName =
        refs.employerName(employerId) || refs.jobCompany(jobId) || "Employer";
      const where = `${employerName}${publicJobId ? ` · ${publicJobId}` : ""}`;
      const base = {
        id: row.eventId,
        category,
        at: row.at.toISOString(),
        actorName: "",
        applicationId,
        publicJobId,
        jobTitle,
        employerName,
      };

      switch (row.kind) {
        case "applied":
          return {
            ...base,
            type: "application_submitted",
            title: applicationTitle("submitted", jobTitle),
            description: where,
            actor: "candidate",
          };
        case "interview_cancelled": {
          const reason = clean(row.reason);
          return {
            ...base,
            type: "interview_cancelled",
            title: `Interview cancelled · ${jobTitle}`,
            description: [employerName, reason ? `Reason: ${reason}` : ""]
              .filter(Boolean)
              .join(" — "),
            actor: "employer",
          };
        }
        case "offer_response":
          return {
            ...base,
            type: `offer_${status}`,
            title: `Offer ${status} · ${jobTitle}`,
            description: employerName,
            actor: "candidate",
          };
        default:
          return {
            ...base,
            type: `application_${status}`,
            title: applicationTitle(status, jobTitle),
            description: [where, clean(row.remark)].filter(Boolean).join(" — "),
            actor: mapHistoryActor(row.actorType),
          };
      }
    },
  };
}

// ---------------------------------------------------------------------------
// MongoDB pipelines
// ---------------------------------------------------------------------------

type Stage = ActivityStage;

export function buildApplicationActivityPipeline(params: {
  jobSeekerId: unknown;
  cursor: CandidateActivityCursor | null;
  limit: number;
  category: CandidateActivityCategory | null;
}): Stage[] {
  return buildApplicationEventPagePipeline({
    match: { jobSeekerId: params.jobSeekerId },
    cursor: params.cursor,
    limit: params.limit,
    category: params.category,
  });
}

export function buildApplicationActivityCountPipeline(jobSeekerId: unknown): Stage[] {
  return buildApplicationEventCountPipeline({ jobSeekerId });
}

// ---------------------------------------------------------------------------
// Journey + summary (totals computed in MongoDB, never from one page)
// ---------------------------------------------------------------------------

export type CandidateApplicationStats = ApplicationActivityStats;

export function buildApplicationStatsPipeline(jobSeekerId: unknown): Stage[] {
  return buildApplicationActivityStatsPipeline({ jobSeekerId });
}

export const parseApplicationStats = parseApplicationActivityStats;

const numberField = activityNumberField;
const dateField = activityDateField;

export type CandidateResumeStats = {
  readyCount: number;
  firstReadyAt: Date | null;
};

export function buildResumeStatsPipeline(jobSeekerId: unknown): Stage[] {
  return [
    { $match: { jobSeekerId, status: { $in: [...READY_RESUME_STATUSES] } } },
    {
      $group: {
        _id: null,
        readyCount: { $sum: 1 },
        firstReadyAt: { $min: { $ifNull: ["$createdAt", "$lastGeneratedAt"] } },
      },
    },
  ];
}

export function parseResumeStats(rows: unknown[]): CandidateResumeStats {
  const row = rows[0] as Record<string, unknown> | undefined;
  return {
    readyCount: numberField(row, "readyCount"),
    firstReadyAt: dateField(row, "firstReadyAt"),
  };
}

const earliestDate = earliestActivityDate;

export type CandidateJourneyInput = {
  seeker: CandidateActivitySeekerInput;
  resumes: CandidateResumeStats;
  /** Null when the caller may not view this candidate's applications. */
  applications: CandidateApplicationStats | null;
};

export function buildCandidateJourney(
  input: CandidateJourneyInput,
): CandidateJourneyStage[] {
  const { seeker, resumes } = input;
  type Reached = {
    id: CandidateJourneyStageId;
    label: string;
    reached: boolean;
    at: Date | null;
    detail: string;
  };

  const uploadedAt = toDate(seeker.uploadedResume?.uploadedAt);
  const hasReadyResume = resumes.readyCount > 0;
  const hasResume = hasReadyResume || Boolean(uploadedAt);
  const percent = Math.max(
    0,
    Math.min(100, Math.round(seeker.profileCompletionPercent)),
  );
  const profileCompletedAt = toDate(seeker.profileCompletedAt);
  const profileReached =
    seeker.registrationStatus === "COMPLETED" ||
    Boolean(profileCompletedAt) ||
    seeker.profileCompleteNow === true;

  const stages: Reached[] = [
    {
      id: "registered",
      label: "Registered",
      reached: Boolean(seeker.createdAt),
      at: toDate(seeker.createdAt ?? null),
      detail: "Account created",
    },
    {
      id: "whatsapp_verified",
      label: "WhatsApp verified",
      reached: Boolean(seeker.isWhatsappVerified),
      at: seeker.isWhatsappVerified ? toDate(seeker.whatsappVerifiedAt) : null,
      detail: seeker.isWhatsappVerified
        ? "Phone verified by WhatsApp OTP"
        : "Not verified yet",
    },
    {
      id: "profile_completed",
      label: "Profile completed",
      reached: profileReached,
      at: profileCompletedAt,
      detail:
        profileCompletedAt && seeker.profileCompleteNow === false
          ? `Now incomplete · ${percent}% complete`
          : `${percent}% complete`,
    },
    {
      id: "resume_ready",
      label: "Resume ready",
      reached: hasResume,
      at: earliestDate([resumes.firstReadyAt, uploadedAt]),
      detail: hasResume
        ? uploadedAt && hasReadyResume
          ? "AsliResume and uploaded resume"
          : uploadedAt
            ? "Uploaded resume"
            : "AsliResume generated"
        : "No resume yet",
    },
  ];

  const apps = input.applications;
  if (apps) {
    const countDetail = (count: number, noun: string) =>
      count > 0 ? plural(count, noun) : "Not yet";
    stages.push(
      {
        id: "applied",
        label: "Applied",
        reached: apps.applications > 0,
        at: earliestDate([apps.firstAppliedAt, apps.firstSubmittedAt]),
        detail:
          apps.applications > 0
            ? plural(apps.applications, "application")
            : "No applications yet",
      },
      {
        id: "shortlisted",
        label: "Shortlisted",
        reached: apps.shortlisted > 0,
        at: apps.firstShortlistedAt,
        detail: countDetail(apps.shortlisted, "job"),
      },
      {
        id: "interview",
        label: "Interview",
        reached: apps.interviews > 0,
        at: apps.firstInterviewAt,
        detail: countDetail(apps.interviews, "job"),
      },
      {
        id: "offer",
        label: "Offer",
        reached: apps.offers > 0,
        at: apps.firstOfferAt,
        detail: countDetail(apps.offers, "offer"),
      },
      {
        id: "hired",
        label: "Hired",
        reached: apps.hired > 0,
        at: apps.firstHiredAt,
        detail: countDetail(apps.hired, "job"),
      },
    );
  }

  const firstPendingIndex = stages.findIndex((stage) => !stage.reached);

  return stages.map((stage, index) => ({
    id: stage.id,
    label: stage.label,
    state: stage.reached
      ? "done"
      : index === firstPendingIndex
        ? "current"
        : "pending",
    at: stage.reached && stage.at ? stage.at.toISOString() : null,
    detail: stage.detail,
  }));
}

export function buildCandidateActivitySummary(input: {
  applications: CandidateApplicationStats | null;
  savedJobs: number;
  lastActivityAt: Date | null;
}): CandidateActivitySummary {
  const apps = input.applications;
  return {
    applications: apps?.applications ?? 0,
    activeApplications: apps?.active ?? 0,
    interviews: apps?.interviews ?? 0,
    offers: apps?.offers ?? 0,
    offersAccepted: apps?.offersAccepted ?? 0,
    offersDeclined: apps?.offersDeclined ?? 0,
    hired: apps?.hired ?? 0,
    rejected: apps?.rejected ?? 0,
    withdrawn: apps?.withdrawn ?? 0,
    savedJobs: input.savedJobs,
    lastActivityAt: input.lastActivityAt?.toISOString() ?? null,
  };
}
