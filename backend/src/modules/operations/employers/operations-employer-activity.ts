import { APPLICATION_STATUS_LABELS } from "../../applications/application.constants.js";
import type { ApplicationStatus } from "../../applications/application.types.js";
import { formatEmployerDocumentTypeLabel } from "../../employers/employer-document.labels.js";
import {
  APPLICATION_ACTIVITY_CATEGORIES,
  activityCursorMatch,
  activityDate,
  activityDateField,
  activityNumberField,
  activityPlural,
  activityRefId,
  activityText,
  applicationActivityCategory,
  countActivity,
  describeLoginClient,
  earliestActivityDate,
  emptyActivityCounts,
  finalizeJourney,
  inMemoryActivitySource,
  paginateActivity,
  type ActivityCursor,
  type ActivityFetchParams,
  type ActivityPage,
  type ActivitySource,
  type ActivityStage,
  type ApplicationActivityRow,
  type ApplicationActivityStats,
  type JourneyStage,
  type JourneyStageDraft,
  type LoginClientSummary,
} from "../activity/activity-timeline.js";
import { OPERATIONS_JOB_AUDIT_ACTIONS } from "../jobs/operations-job-moderation.constants.js";

/**
 * Operations "Account Activity & History" for one employer.
 * Built only from recorded data: every event carries a real timestamp from
 * its source document. Facts without a recorded date (e.g. WhatsApp verified
 * before tracking) appear in the journey, never as invented events.
 *
 * Where an action is recorded twice (an audit row and a latest-state field
 * on the employer or job), the audit row wins and the field is only used
 * for history that predates the audit.
 */

export const EMPLOYER_ACTIVITY_CATEGORIES = [
  "account",
  "profile",
  "verification",
  "job",
  "application",
  "interview",
  "offer",
  "candidate",
  "team",
  "operations",
] as const;

export type EmployerActivityCategory =
  (typeof EMPLOYER_ACTIVITY_CATEGORIES)[number];

/** Categories that reveal candidates; omitted without application access. */
export const EMPLOYER_CANDIDATE_ACTIVITY_CATEGORIES: readonly EmployerActivityCategory[] =
  [...APPLICATION_ACTIVITY_CATEGORIES, "candidate"];

export type EmployerActivityActor =
  | "employer"
  | "candidate"
  | "operations"
  | "system";

export type EmployerActivityEvent = {
  id: string;
  type: string;
  category: EmployerActivityCategory;
  title: string;
  description: string;
  at: string;
  actor: EmployerActivityActor;
  actorName: string;
  publicJobId: string;
  jobTitle: string;
  applicationId: string | null;
  /** Job seeker id; only set on candidate-revealing events. */
  candidateId: string | null;
  candidateDisplayId: string;
  /** Empty unless the caller may view candidate names. */
  candidateName: string;
};

export const EMPLOYER_JOURNEY_STAGE_IDS = [
  "registered",
  "whatsapp_verified",
  "profile_completed",
  "verification_submitted",
  "verified",
  "first_job",
  "job_live",
  "first_application",
  "first_hire",
] as const;

export type EmployerJourneyStageId = (typeof EMPLOYER_JOURNEY_STAGE_IDS)[number];

export type EmployerJourneyStage = JourneyStage<EmployerJourneyStageId>;

export type EmployerActivitySummary = {
  jobs: number;
  draftJobs: number;
  liveJobs: number;
  pendingJobs: number;
  closedJobs: number;
  applications: number;
  shortlisted: number;
  interviews: number;
  hired: number;
  savedCandidates: number;
  lastLoginAt: string | null;
  lastActivityAt: string | null;
};

export type EmployerActivityCategoryCounts = Record<
  "all" | EmployerActivityCategory,
  number
>;

/** Registration audit duplicates the account-registered event. */
export const SKIPPED_EMPLOYER_AUDIT_ACTIONS = ["employer.registered"] as const;

export const EMPLOYER_VERIFICATION_AUDIT_ACTIONS = [
  "employer.verification_resubmitted",
  "employer.verification_documents_requested",
  "employer.verification_approved",
  "employer.verification_rejected",
  "employer.verification_updated",
] as const;

/**
 * An audit row is written just after the field it mirrors; within this
 * window the two are treated as the same action.
 */
export const ACTIVITY_DUPLICATE_WINDOW_MS = 2 * 60 * 1000;

const toDate = activityDate;
const clean = activityText;
const refId = activityRefId;
const plural = activityPlural;

function titleCase(value: string): string {
  return value
    .split(/[._\s-]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export function employerActivityStatusLabel(status: string): string {
  if (status in APPLICATION_STATUS_LABELS) {
    return APPLICATION_STATUS_LABELS[status as ApplicationStatus];
  }
  return titleCase(status);
}

function nearAny(at: Date, times: readonly Date[] | undefined): boolean {
  return (times ?? []).some(
    (time) => Math.abs(time.getTime() - at.getTime()) <= ACTIVITY_DUPLICATE_WINDOW_MS,
  );
}

// ---------------------------------------------------------------------------
// Entries + sources
// ---------------------------------------------------------------------------

export type EmployerActivityCandidateRef = { displayId: string; name: string };

export type EmployerActivityRefs = {
  jobTitle(jobId: string | null): string;
  candidate(jobSeekerId: string | null): EmployerActivityCandidateRef;
};

/**
 * A timeline row before job titles / candidate labels are resolved. Those
 * are looked up only for the rows on the returned page.
 */
export type EmployerActivityEntry = {
  id: string;
  at: Date;
  category: EmployerActivityCategory;
  jobId: string | null;
  jobSeekerId: string | null;
  render(refs: EmployerActivityRefs): EmployerActivityEvent;
};

export type EmployerActivitySource = ActivitySource<
  EmployerActivityCategory,
  EmployerActivityEntry
>;

export type EmployerActivityPage = ActivityPage<EmployerActivityEntry>;

export function employerActivitySourceFromEntries(
  name: string,
  entries: EmployerActivityEntry[],
): EmployerActivitySource {
  return inMemoryActivitySource(name, entries);
}

export function paginateEmployerActivity(
  sources: readonly EmployerActivitySource[],
  params: ActivityFetchParams<EmployerActivityCategory>,
): Promise<EmployerActivityPage> {
  return paginateActivity(sources, params);
}

export function emptyEmployerActivityCounts(): EmployerActivityCategoryCounts {
  return emptyActivityCounts(EMPLOYER_ACTIVITY_CATEGORIES);
}

export function countEmployerActivity(
  sources: readonly EmployerActivitySource[],
): Promise<EmployerActivityCategoryCounts> {
  return countActivity(sources, EMPLOYER_ACTIVITY_CATEGORIES);
}

type StaticEventInput = Omit<
  EmployerActivityEvent,
  | "at"
  | "publicJobId"
  | "jobTitle"
  | "applicationId"
  | "candidateId"
  | "candidateDisplayId"
  | "candidateName"
> & { at: Date; publicJobId?: string; jobTitle?: string };

function staticEntry(event: StaticEventInput): EmployerActivityEntry {
  const rendered: EmployerActivityEvent = {
    ...event,
    at: event.at.toISOString(),
    publicJobId: event.publicJobId ?? "",
    jobTitle: event.jobTitle ?? "",
    applicationId: null,
    candidateId: null,
    candidateDisplayId: "",
    candidateName: "",
  };
  return {
    id: event.id,
    at: event.at,
    category: event.category,
    jobId: null,
    jobSeekerId: null,
    render: () => rendered,
  };
}

/** Audit times used to avoid repeating an action that a field also records. */
export type EmployerAuditTimes = {
  resubmitted: Date[];
  approved: Date[];
  rejected: Date[];
  suspended: Date[];
};

export function emptyEmployerAuditTimes(): EmployerAuditTimes {
  return { resubmitted: [], approved: [], rejected: [], suspended: [] };
}

export type EmployerActivityProfileInput = {
  accountType?: string | null;
  createdAt?: Date | null;
  isWhatsappVerified?: boolean;
  whatsappVerifiedAt?: Date | null;
  isProfileComplete?: boolean;
  profileCompletedAt?: Date | null;
  registrationStatus?: string | null;
  verificationStatus?: string | null;
  verificationSubmittedAt?: Date | null;
  verifiedAt?: Date | null;
  verifiedByName?: string;
  rejectedAt?: Date | null;
  rejectedByName?: string;
  verificationRemarks?: string | null;
  status?: string | null;
  suspendedAt?: Date | null;
  suspensionReason?: string | null;
  companyLogoUpdatedAt?: Date | null;
  profilePhotoUpdatedAt?: Date | null;
  lastLoginAt?: Date | null;
  /** True when a login-history row already covers `lastLoginAt`. */
  lastLoginRecorded?: boolean;
  operationsFirstSeenAt?: Date | null;
  operationsFirstSeenByName?: string;
  auditTimes?: EmployerAuditTimes;
};

function byOperations(name: string): string {
  return name ? `By ${name}` : "By Operations";
}

/** Milestones stored on the employer document itself. */
export function buildEmployerProfileEntries(
  employer: EmployerActivityProfileInput,
): EmployerActivityEntry[] {
  const entries: EmployerActivityEntry[] = [];
  const audits = employer.auditTimes ?? emptyEmployerAuditTimes();
  const individual = employer.accountType === "individual";

  const registeredAt = toDate(employer.createdAt);
  if (registeredAt) {
    entries.push(
      staticEntry({
        id: "account:registered",
        type: "account_registered",
        category: "account",
        title: "Employer account registered",
        description: "Account created on AsliJobs.",
        at: registeredAt,
        actor: "employer",
        actorName: "",
      }),
    );
  }

  const whatsappAt = toDate(employer.whatsappVerifiedAt);
  if (employer.isWhatsappVerified && whatsappAt) {
    entries.push(
      staticEntry({
        id: "account:whatsapp_verified",
        type: "account_whatsapp_verified",
        category: "account",
        title: "WhatsApp number verified",
        description: "Phone verified by WhatsApp OTP.",
        at: whatsappAt,
        actor: "employer",
        actorName: "",
      }),
    );
  }

  const completedAt = toDate(employer.profileCompletedAt);
  if (completedAt) {
    entries.push(
      staticEntry({
        id: "profile:completed",
        type: "profile_completed",
        category: "profile",
        title: individual ? "Identity details completed" : "Company profile completed",
        description: "Profile and verification document submitted for review.",
        at: completedAt,
        actor: "employer",
        actorName: "",
      }),
    );
  }

  // Only the latest submission is stored. Skip it when it is the first
  // submission (profile completion) or a resubmission that has an audit row.
  const submittedAt = toDate(employer.verificationSubmittedAt);
  if (
    submittedAt &&
    !(completedAt && nearAny(submittedAt, [completedAt])) &&
    !nearAny(submittedAt, audits.resubmitted)
  ) {
    entries.push(
      staticEntry({
        id: "verification:submitted",
        type: "verification_submitted",
        category: "verification",
        title: "Submitted for verification",
        description: "Latest verification submission.",
        at: submittedAt,
        actor: "employer",
        actorName: "",
      }),
    );
  }

  const verifiedAt = toDate(employer.verifiedAt);
  if (verifiedAt && !nearAny(verifiedAt, audits.approved)) {
    const name = clean(employer.verifiedByName);
    entries.push(
      staticEntry({
        id: "verification:verified",
        type: "employer.verification_approved",
        category: "verification",
        title: "Employer verified",
        description: byOperations(name),
        at: verifiedAt,
        actor: "operations",
        actorName: name,
      }),
    );
  }

  const rejectedAt = toDate(employer.rejectedAt);
  if (rejectedAt && !nearAny(rejectedAt, audits.rejected)) {
    const name = clean(employer.rejectedByName);
    const remarks =
      employer.verificationStatus === "rejected" ? clean(employer.verificationRemarks) : "";
    entries.push(
      staticEntry({
        id: "verification:rejected",
        type: "employer.verification_rejected",
        category: "verification",
        title: "Verification rejected",
        description: [byOperations(name), remarks ? `Reason: ${remarks}` : ""]
          .filter(Boolean)
          .join(" — "),
        at: rejectedAt,
        actor: "operations",
        actorName: name,
      }),
    );
  }

  const suspendedAt = toDate(employer.suspendedAt);
  if (
    suspendedAt &&
    employer.status === "suspended" &&
    !nearAny(suspendedAt, audits.suspended)
  ) {
    const reason = clean(employer.suspensionReason);
    entries.push(
      staticEntry({
        id: "operations:suspended",
        type: "employer.account_suspended",
        category: "operations",
        title: "Account suspended",
        description: reason ? `Reason: ${reason}` : "Suspended by Operations.",
        at: suspendedAt,
        actor: "operations",
        actorName: "",
      }),
    );
  }

  const logoAt = toDate(employer.companyLogoUpdatedAt);
  if (logoAt) {
    entries.push(
      staticEntry({
        id: "profile:logo_updated",
        type: "profile_logo_updated",
        category: "profile",
        title: "Company logo updated",
        description: "Most recent logo upload.",
        at: logoAt,
        actor: "employer",
        actorName: "",
      }),
    );
  }

  const photoAt = toDate(employer.profilePhotoUpdatedAt);
  if (photoAt) {
    entries.push(
      staticEntry({
        id: "profile:photo_updated",
        type: "profile_photo_updated",
        category: "profile",
        title: "Profile photo updated",
        description: "Most recent photo upload.",
        at: photoAt,
        actor: "employer",
        actorName: "",
      }),
    );
  }

  const seenAt = toDate(employer.operationsFirstSeenAt);
  if (seenAt) {
    const name = clean(employer.operationsFirstSeenByName);
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
      }),
    );
  }

  // Logins before login history existed only kept the latest timestamp.
  const loginAt = toDate(employer.lastLoginAt);
  if (loginAt && !employer.lastLoginRecorded) {
    entries.push(
      staticEntry({
        id: "account:last_login",
        type: "account_last_login",
        category: "account",
        title: "Last login",
        description: "Most recent sign-in to the employer portal.",
        at: loginAt,
        actor: "employer",
        actorName: "",
      }),
    );
  }

  return entries;
}

export type EmployerLoginActivityRow = {
  eventId: string;
  at: Date;
  method?: string | null;
  client?: LoginClientSummary;
};

export function employerLoginRowToEntry(row: EmployerLoginActivityRow): EmployerActivityEntry {
  return staticEntry({
    id: row.eventId,
    type: "account_login",
    category: "account",
    title:
      clean(row.method) === "registration_otp"
        ? "Signed in after completing registration"
        : "Logged in with WhatsApp OTP",
    description: describeLoginClient(row.client),
    at: row.at,
    actor: "employer",
    actorName: "",
  });
}

export type EmployerDocumentActivityRow = {
  eventId: string;
  at: Date;
  documentType?: string | null;
  verificationStatus?: string | null;
};

/** File names are not shown; Operations can open the document itself. */
export function employerDocumentRowToEntry(
  row: EmployerDocumentActivityRow,
): EmployerActivityEntry {
  const label = formatEmployerDocumentTypeLabel(clean(row.documentType)) || "Document";
  const status = clean(row.verificationStatus) || "pending";
  return staticEntry({
    id: row.eventId,
    type: "verification_document_uploaded",
    category: "verification",
    title: `Verification document uploaded · ${label}`,
    description: `Current document status: ${titleCase(status)}`,
    at: row.at,
    actor: "employer",
    actorName: "",
  });
}

export type EmployerAuditActivityRow = {
  eventId: string;
  at: Date;
  action: string;
  actorName?: string | null;
  actorUserId?: unknown;
  reason?: string | null;
};

const EMPLOYER_AUDIT_TITLES: Record<string, string> = {
  "employer.verification_resubmitted": "Resubmitted for verification",
  "employer.verification_documents_requested": "Documents requested by Operations",
  "employer.verification_approved": "Employer verified",
  "employer.verification_rejected": "Verification rejected",
  "employer.verification_updated": "Verification status updated",
  "employer.account_suspended": "Account suspended",
  "employer.account_reactivated": "Account reactivated",
  "employer.account_deleted": "Account deleted",
};

function auditActor(row: { actorName?: string | null; actorUserId?: unknown }) {
  const actorName = clean(row.actorName);
  if (row.actorUserId) {
    return { actor: "operations" as const, actorName };
  }
  if (actorName.toUpperCase() === "SYSTEM" || !actorName) {
    return { actor: "system" as const, actorName: "" };
  }
  return { actor: "employer" as const, actorName: "" };
}

export function employerAuditRowToEntry(
  category: EmployerActivityCategory,
): (row: EmployerAuditActivityRow) => EmployerActivityEntry {
  return (row) => {
    const { actor, actorName } = auditActor(row);
    const reason = clean(row.reason);
    return staticEntry({
      id: row.eventId,
      type: row.action,
      category,
      title: EMPLOYER_AUDIT_TITLES[row.action] ?? titleCase(row.action.split(".").pop() ?? row.action),
      description: [
        actor === "operations" ? byOperations(actorName) : "",
        reason ? `Reason: ${reason}` : "",
      ]
        .filter(Boolean)
        .join(" — "),
      at: row.at,
      actor,
      actorName,
    });
  };
}

export type JobAuditActivityRow = EmployerAuditActivityRow & {
  targetId?: string | null;
  targetLabel?: string | null;
};

const JOB_AUDIT_TITLES: Record<string, string> = {
  [OPERATIONS_JOB_AUDIT_ACTIONS.SUBMITTED]: "Job submitted for approval",
  [OPERATIONS_JOB_AUDIT_ACTIONS.RESUBMITTED]: "Job resubmitted for approval",
  [OPERATIONS_JOB_AUDIT_ACTIONS.APPROVED]: "Job approved",
  [OPERATIONS_JOB_AUDIT_ACTIONS.REJECTED]: "Job rejected",
  [OPERATIONS_JOB_AUDIT_ACTIONS.PAUSED]: "Job paused",
  [OPERATIONS_JOB_AUDIT_ACTIONS.RESUMED]: "Job resumed",
  [OPERATIONS_JOB_AUDIT_ACTIONS.CLOSED]: "Job closed",
  [OPERATIONS_JOB_AUDIT_ACTIONS.REACTIVATED]: "Job reactivated",
  [OPERATIONS_JOB_AUDIT_ACTIONS.EXPIRED]: "Job expired",
  [OPERATIONS_JOB_AUDIT_ACTIONS.LIVE_REVISION_SUBMITTED]: "Live job changes submitted",
  [OPERATIONS_JOB_AUDIT_ACTIONS.LIVE_REVISION_APPROVED]: "Live job changes approved",
  [OPERATIONS_JOB_AUDIT_ACTIONS.LIVE_REVISION_REJECTED]: "Live job changes rejected",
  [OPERATIONS_JOB_AUDIT_ACTIONS.OPERATIONS_PUBLISHED]: "Job published by Operations",
};

export function jobAuditRowToEntry(row: JobAuditActivityRow): EmployerActivityEntry {
  const { actor, actorName } = auditActor(row);
  const jobTitle = clean(row.targetLabel);
  const publicJobId = clean(row.targetId);
  const reason = clean(row.reason);
  const base = JOB_AUDIT_TITLES[row.action] ?? titleCase(row.action.split(".").pop() ?? row.action);
  return staticEntry({
    id: row.eventId,
    type: row.action,
    category: "job",
    title: jobTitle ? `${base} · ${jobTitle}` : base,
    description: [
      publicJobId,
      actor === "operations" ? byOperations(actorName) : "",
      reason ? `Reason: ${reason}` : "",
    ]
      .filter(Boolean)
      .join(" — "),
    at: row.at,
    actor,
    actorName,
    publicJobId,
    jobTitle,
  });
}

export const JOB_FIELD_EVENT_KINDS = [
  "created",
  "submitted",
  "review",
  "published",
  "reactivated",
  "closed",
  "live_change_submitted",
] as const;

export type JobFieldEventKind = (typeof JOB_FIELD_EVENT_KINDS)[number];

export type JobFieldActivityRow = {
  eventId: string;
  at: Date;
  kind: JobFieldEventKind;
  creationSource?: string | null;
  reviewKind?: string | null;
  decision?: string | null;
  reason?: string | null;
  byOperations?: boolean | null;
  jobId?: unknown;
  jobTitle?: string | null;
  publicJobId?: string | null;
};

function jobFieldTitle(row: JobFieldActivityRow): string {
  switch (row.kind) {
    case "created":
      return row.creationSource === "operations" ? "Job created by Operations" : "Job created";
    case "submitted":
      return "Job submitted for approval";
    case "review": {
      const approved = row.decision === "approved";
      if (row.reviewKind === "live_change") {
        return approved ? "Live job changes approved" : "Live job changes rejected";
      }
      return approved ? "Job approved" : "Job rejected";
    }
    case "published":
      return "Job went live";
    case "reactivated":
      return "Job reactivated";
    case "closed":
      return "Job closed";
    case "live_change_submitted":
      return "Live job changes submitted";
  }
}

function jobFieldActor(row: JobFieldActivityRow): EmployerActivityActor {
  switch (row.kind) {
    case "created":
      return row.creationSource === "operations" ? "operations" : "employer";
    case "review":
      return "operations";
    case "closed":
      return row.byOperations ? "operations" : "system";
    case "published":
      return row.creationSource === "operations" ? "operations" : "system";
    default:
      return "employer";
  }
}

/** Job lifecycle facts stored on the job document (see buildJobFieldEventStages). */
export function jobFieldRowToEntry(row: JobFieldActivityRow): EmployerActivityEntry {
  const jobTitle = clean(row.jobTitle) || "Untitled job";
  const publicJobId = clean(row.publicJobId);
  const reason = clean(row.reason);
  return staticEntry({
    id: row.eventId,
    type:
      row.kind === "review"
        ? `job_review_${row.decision === "approved" ? "approved" : "rejected"}`
        : `job_${row.kind}`,
    category: "job",
    title: `${jobFieldTitle(row)} · ${jobTitle}`,
    description: [publicJobId, reason ? `Reason: ${reason}` : ""].filter(Boolean).join(" — "),
    at: row.at,
    actor: jobFieldActor(row),
    actorName: "",
    publicJobId,
    jobTitle,
  });
}

export type TeamActivityRow = {
  eventId: string;
  at: Date;
  type?: string | null;
  message?: string | null;
};

export function teamActivityRowToEntry(row: TeamActivityRow): EmployerActivityEntry {
  const type = clean(row.type);
  return staticEntry({
    id: row.eventId,
    type: type ? `team_${type}` : "team_activity",
    category: "team",
    title: type ? `Team · ${titleCase(type)}` : "Team activity",
    description: clean(row.message),
    at: row.at,
    actor: "employer",
    actorName: "",
  });
}

function candidateLabel(ref: EmployerActivityCandidateRef): string {
  if (ref.name && ref.displayId) {
    return `${ref.name} (${ref.displayId})`;
  }
  return ref.name || ref.displayId || "Candidate";
}

export type SavedCandidateActivityRow = {
  eventId: string;
  at: Date;
  jobSeekerId?: unknown;
  jobId?: unknown;
  applicationId?: unknown;
  publicJobId?: string | null;
  createdByName?: string | null;
};

export function savedCandidateRowToEntry(
  row: SavedCandidateActivityRow,
): EmployerActivityEntry {
  const jobSeekerId = refId(row.jobSeekerId);
  const jobId = refId(row.jobId);
  const publicJobId = clean(row.publicJobId);
  const savedBy = clean(row.createdByName);
  return {
    id: row.eventId,
    at: row.at,
    category: "candidate",
    jobId,
    jobSeekerId,
    render(refs) {
      const candidate = refs.candidate(jobSeekerId);
      const jobTitle = refs.jobTitle(jobId);
      return {
        id: row.eventId,
        type: "candidate_saved",
        category: "candidate",
        title: `Candidate saved · ${candidateLabel(candidate)}`,
        description: [jobTitle, publicJobId, savedBy ? `Saved by ${savedBy}` : ""]
          .filter(Boolean)
          .join(" · "),
        at: row.at.toISOString(),
        actor: "employer",
        actorName: savedBy,
        publicJobId,
        jobTitle,
        applicationId: refId(row.applicationId),
        candidateId: jobSeekerId,
        candidateDisplayId: candidate.displayId,
        candidateName: candidate.name,
      };
    },
  };
}

function mapHistoryActor(actorType: string | null | undefined): EmployerActivityActor {
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

function applicationEventTitle(status: string, jobTitle: string): string {
  switch (status) {
    case "submitted":
      return `Application received · ${jobTitle}`;
    case "withdrawn":
      return `Candidate withdrew · ${jobTitle}`;
    default:
      return `${employerActivityStatusLabel(status)} · ${jobTitle}`;
  }
}

/** Application events seen from the employer's side. */
export function employerApplicationRowToEntry(
  row: ApplicationActivityRow,
): EmployerActivityEntry {
  const status = clean(row.status);
  const category = applicationActivityCategory(row.kind, status);
  const applicationId = refId(row.applicationId);
  const jobId = refId(row.jobId);
  const jobSeekerId = refId(row.jobSeekerId);
  const publicJobId = clean(row.publicJobId);

  return {
    id: row.eventId,
    at: row.at,
    category,
    jobId,
    jobSeekerId,
    render(refs) {
      const jobTitle = refs.jobTitle(jobId) || "Job";
      const candidate = refs.candidate(jobSeekerId);
      const who = candidateLabel(candidate);
      const base = {
        id: row.eventId,
        category,
        at: row.at.toISOString(),
        actorName: "",
        publicJobId,
        jobTitle,
        applicationId,
        candidateId: jobSeekerId,
        candidateDisplayId: candidate.displayId,
        candidateName: candidate.name,
      };
      const where = [who, publicJobId].filter(Boolean).join(" · ");

      switch (row.kind) {
        case "applied":
          return {
            ...base,
            type: "application_submitted",
            title: applicationEventTitle("submitted", jobTitle),
            description: where,
            actor: "candidate",
          };
        case "interview_cancelled": {
          const reason = clean(row.reason);
          return {
            ...base,
            type: "interview_cancelled",
            title: `Interview cancelled · ${jobTitle}`,
            description: [where, reason ? `Reason: ${reason}` : ""]
              .filter(Boolean)
              .join(" — "),
            actor: "employer",
          };
        }
        case "offer_response":
          return {
            ...base,
            type: `offer_${status}`,
            title: `Offer ${status} by candidate · ${jobTitle}`,
            description: where,
            actor: "candidate",
          };
        default:
          return {
            ...base,
            type: `application_${status}`,
            title: applicationEventTitle(status, jobTitle),
            description: [where, clean(row.remark)].filter(Boolean).join(" — "),
            actor: mapHistoryActor(row.actorType),
          };
      }
    },
  };
}

// ---------------------------------------------------------------------------
// Job lifecycle pipeline
// ---------------------------------------------------------------------------

const A = OPERATIONS_JOB_AUDIT_ACTIONS;
const JOB_ID_STRING = { $toString: "$_id" };

function jobEventId(suffix: unknown[]): ActivityStage {
  return { $concat: ["job:", JOB_ID_STRING, ...suffix] };
}

function whenSet(field: string, event: Record<string, unknown>): ActivityStage {
  return {
    $cond: [{ $ne: [{ $ifNull: [field, null] }, null] }, [event], []],
  };
}

/** True when any review approval sits within the duplicate window of `field`. */
function nearApprovedReview(field: string): ActivityStage {
  return {
    $anyElementTrue: [
      {
        $map: {
          input: { $ifNull: ["$reviewHistory", []] },
          as: "r",
          in: {
            $and: [
              { $eq: ["$$r.decision", "approved"] },
              { $eq: [{ $type: "$$r.reviewedAt" }, "date"] },
              {
                $lte: [
                  { $abs: { $subtract: ["$$r.reviewedAt", field] } },
                  ACTIVITY_DUPLICATE_WINDOW_MS,
                ],
              },
            ],
          },
        },
      },
    ],
  };
}

/**
 * Unwinds each job into the lifecycle facts stored on it. A fact is dropped
 * when the job's moderation audit already records the same action within
 * the duplicate window, so audits (shown by their own source) win and the
 * fields only fill in history from before job audits existed.
 */
export function buildJobFieldEventStages(params: {
  match: Record<string, unknown>;
  cursor: ActivityCursor | null;
}): ActivityStage[] {
  // Every job event happens at or after the job was created.
  const match = params.cursor
    ? { ...params.match, createdAt: { $lte: params.cursor.at } }
    : params.match;
  return [
    { $match: match },
    {
      $lookup: {
        from: "operations_audit_logs",
        let: { publicJobId: { $toUpper: { $ifNull: ["$jobId", ""] } } },
        pipeline: [
          {
            $match: {
              $expr: {
                $and: [
                  { $eq: ["$targetType", "job"] },
                  { $eq: ["$targetId", "$$publicJobId"] },
                ],
              },
            },
          },
          { $project: { _id: 0, action: 1, createdAt: 1 } },
        ],
        as: "jobAudits",
      },
    },
    {
      $project: {
        jobTitle: 1,
        publicJobId: "$jobId",
        jobAudits: 1,
        events: {
          $concatArrays: [
            [
              {
                kind: "created",
                at: "$createdAt",
                creationSource: "$creationSource",
                eventId: jobEventId([":created"]),
                coveredBy: [],
              },
            ],
            whenSet("$submittedForApprovalAt", {
              kind: "submitted",
              at: "$submittedForApprovalAt",
              eventId: jobEventId([":submitted"]),
              coveredBy: [A.SUBMITTED, A.RESUBMITTED],
            }),
            {
              $map: {
                input: {
                  $range: [0, { $size: { $ifNull: ["$reviewHistory", []] } }],
                },
                as: "i",
                in: {
                  $let: {
                    vars: { entry: { $arrayElemAt: ["$reviewHistory", "$$i"] } },
                    in: {
                      kind: "review",
                      reviewKind: "$$entry.kind",
                      decision: "$$entry.decision",
                      reason: "$$entry.reason",
                      at: "$$entry.reviewedAt",
                      eventId: jobEventId([":review:", { $toString: "$$i" }]),
                      coveredBy: {
                        $cond: [
                          { $eq: ["$$entry.kind", "live_change"] },
                          [A.LIVE_REVISION_APPROVED, A.LIVE_REVISION_REJECTED],
                          [A.APPROVED, A.REJECTED],
                        ],
                      },
                    },
                  },
                },
              },
            },
            {
              $cond: [
                {
                  $and: [
                    { $eq: [{ $size: { $ifNull: ["$reviewHistory", []] } }, 0] },
                    { $ne: [{ $ifNull: ["$reviewedAt", null] }, null] },
                    { $in: ["$reviewDecision", ["approved", "rejected"]] },
                  ],
                },
                [
                  {
                    kind: "review",
                    reviewKind: "initial",
                    decision: "$reviewDecision",
                    reason: "$rejectionReason",
                    at: "$reviewedAt",
                    eventId: jobEventId([":reviewed"]),
                    coveredBy: [A.APPROVED, A.REJECTED],
                  },
                ],
                [],
              ],
            },
            {
              // Approval and reactivation set publishedAt themselves.
              $cond: [
                {
                  $and: [
                    { $ne: [{ $ifNull: ["$publishedAt", null] }, null] },
                    { $ne: ["$publishedAt", { $ifNull: ["$reactivatedAt", null] }] },
                    {
                      $not: [
                        {
                          $and: [
                            { $eq: ["$reviewDecision", "approved"] },
                            { $eq: [{ $type: "$reviewedAt" }, "date"] },
                            {
                              $lte: [
                                { $abs: { $subtract: ["$reviewedAt", "$publishedAt"] } },
                                ACTIVITY_DUPLICATE_WINDOW_MS,
                              ],
                            },
                          ],
                        },
                      ],
                    },
                    { $not: [nearApprovedReview("$publishedAt")] },
                  ],
                },
                [
                  {
                    kind: "published",
                    at: "$publishedAt",
                    creationSource: "$creationSource",
                    eventId: jobEventId([":published"]),
                    coveredBy: [
                      A.APPROVED,
                      A.OPERATIONS_PUBLISHED,
                      A.REACTIVATED,
                      A.LIVE_REVISION_APPROVED,
                    ],
                  },
                ],
                [],
              ],
            },
            whenSet("$reactivatedAt", {
              kind: "reactivated",
              at: "$reactivatedAt",
              eventId: jobEventId([":reactivated"]),
              coveredBy: [A.REACTIVATED],
            }),
            whenSet("$closedAt", {
              kind: "closed",
              at: "$closedAt",
              reason: "$closedReason",
              byOperations: {
                $ne: [{ $ifNull: ["$closedByOperationsUserId", null] }, null],
              },
              eventId: jobEventId([":closed"]),
              coveredBy: [A.CLOSED],
            }),
            whenSet("$liveChangeSubmittedAt", {
              kind: "live_change_submitted",
              at: "$liveChangeSubmittedAt",
              eventId: jobEventId([":live_change_submitted"]),
              coveredBy: [A.LIVE_REVISION_SUBMITTED],
            }),
          ],
        },
      },
    },
    { $unwind: "$events" },
    {
      $replaceWith: {
        $mergeObjects: [
          "$events",
          {
            jobId: "$_id",
            jobTitle: "$jobTitle",
            publicJobId: "$publicJobId",
            jobAudits: "$jobAudits",
          },
        ],
      },
    },
    { $match: { at: { $type: "date" } } },
    {
      $match: {
        $expr: {
          $not: [
            {
              $anyElementTrue: [
                {
                  $map: {
                    input: "$jobAudits",
                    as: "a",
                    in: {
                      $and: [
                        { $in: ["$$a.action", "$coveredBy"] },
                        { $eq: [{ $type: "$$a.createdAt" }, "date"] },
                        {
                          $lte: [
                            { $abs: { $subtract: ["$$a.createdAt", "$at"] } },
                            ACTIVITY_DUPLICATE_WINDOW_MS,
                          ],
                        },
                      ],
                    },
                  },
                },
              ],
            },
          ],
        },
      },
    },
    { $project: { jobAudits: 0, coveredBy: 0 } },
  ];
}

export function buildJobFieldEventPagePipeline(params: {
  match: Record<string, unknown>;
  cursor: ActivityCursor | null;
  limit: number;
}): ActivityStage[] {
  return [
    ...buildJobFieldEventStages({ match: params.match, cursor: params.cursor }),
    ...(params.cursor ? [{ $match: activityCursorMatch(params.cursor) }] : []),
    { $sort: { at: -1, eventId: -1 } },
    { $limit: params.limit },
  ];
}

export function buildJobFieldEventCountPipeline(
  match: Record<string, unknown>,
): ActivityStage[] {
  return [...buildJobFieldEventStages({ match, cursor: null }), { $count: "count" }];
}

// ---------------------------------------------------------------------------
// Job stats, journey + summary (totals computed in MongoDB, never from one page)
// ---------------------------------------------------------------------------

export type EmployerJobStats = {
  total: number;
  drafts: number;
  live: number;
  pending: number;
  closed: number;
  firstCreatedAt: Date | null;
  firstPublishedAt: Date | null;
  firstApprovedAt: Date | null;
};

function countWhen(condition: ActivityStage): ActivityStage {
  return { $sum: { $cond: [condition, 1, 0] } };
}

export function buildEmployerJobStatsPipeline(
  match: Record<string, unknown>,
): ActivityStage[] {
  return [
    { $match: match },
    {
      $facet: {
        totals: [
          {
            $group: {
              _id: null,
              total: { $sum: 1 },
              drafts: countWhen({ $eq: ["$status", "draft"] }),
              live: countWhen({ $eq: ["$status", "active"] }),
              pending: countWhen({
                $or: [
                  { $eq: ["$status", "pending_approval"] },
                  { $eq: ["$liveChangeReviewStatus", "pending_approval"] },
                ],
              }),
              closed: countWhen({ $in: ["$status", ["closed", "expired"]] }),
              firstCreatedAt: { $min: "$createdAt" },
              firstPublishedAt: { $min: "$publishedAt" },
            },
          },
        ],
        approvals: [
          { $unwind: "$reviewHistory" },
          {
            $match: {
              "reviewHistory.decision": "approved",
              "reviewHistory.kind": { $ne: "live_change" },
              "reviewHistory.reviewedAt": { $type: "date" },
            },
          },
          { $group: { _id: null, firstApprovedAt: { $min: "$reviewHistory.reviewedAt" } } },
        ],
      },
    },
  ];
}

export function parseEmployerJobStats(rows: unknown[]): EmployerJobStats {
  const facet = (rows[0] ?? {}) as {
    totals?: Record<string, unknown>[];
    approvals?: Record<string, unknown>[];
  };
  const totals = facet.totals?.[0];
  const approvals = facet.approvals?.[0];
  return {
    total: activityNumberField(totals, "total"),
    drafts: activityNumberField(totals, "drafts"),
    live: activityNumberField(totals, "live"),
    pending: activityNumberField(totals, "pending"),
    closed: activityNumberField(totals, "closed"),
    firstCreatedAt: activityDateField(totals, "firstCreatedAt"),
    firstPublishedAt: activityDateField(totals, "firstPublishedAt"),
    firstApprovedAt: activityDateField(approvals, "firstApprovedAt"),
  };
}

export type EmployerJourneyInput = {
  employer: EmployerActivityProfileInput;
  /** Null when the caller may not view this employer's jobs. */
  jobs: EmployerJobStats | null;
  /** Null when the caller may not view this employer's applications. */
  applications: ApplicationActivityStats | null;
};

const SUBMITTED_REGISTRATION_STATUSES = ["completed", "document_uploaded"];

export function buildEmployerJourney(input: EmployerJourneyInput): EmployerJourneyStage[] {
  const { employer, jobs } = input;
  const verificationStatus = clean(employer.verificationStatus) || "pending";
  const profileCompletedAt = toDate(employer.profileCompletedAt);
  const submittedAt = toDate(employer.verificationSubmittedAt);
  const profileReached =
    Boolean(employer.isProfileComplete) ||
    Boolean(profileCompletedAt) ||
    employer.registrationStatus === "completed";
  const submittedReached =
    Boolean(profileCompletedAt) ||
    Boolean(submittedAt) ||
    verificationStatus !== "pending" ||
    SUBMITTED_REGISTRATION_STATUSES.includes(clean(employer.registrationStatus));

  const stages: JourneyStageDraft<EmployerJourneyStageId>[] = [
    {
      id: "registered",
      label: "Registered",
      reached: Boolean(employer.createdAt),
      at: toDate(employer.createdAt),
      detail: "Account created",
    },
    {
      id: "whatsapp_verified",
      label: "WhatsApp verified",
      reached: Boolean(employer.isWhatsappVerified),
      at: employer.isWhatsappVerified ? toDate(employer.whatsappVerifiedAt) : null,
      detail: employer.isWhatsappVerified ? "Phone verified by WhatsApp OTP" : "Not verified yet",
    },
    {
      id: "profile_completed",
      label: "Profile completed",
      reached: profileReached,
      at: profileCompletedAt,
      detail: profileReached
        ? employer.accountType === "individual"
          ? "Identity details added"
          : "Company details added"
        : "Profile incomplete",
    },
    {
      id: "verification_submitted",
      label: "Submitted for review",
      reached: submittedReached,
      at: earliestActivityDate([profileCompletedAt, submittedAt]),
      detail: submittedReached ? "Documents sent to Operations" : "Not submitted yet",
    },
    {
      id: "verified",
      label: "Verified",
      reached: verificationStatus === "verified",
      at: verificationStatus === "verified" ? toDate(employer.verifiedAt) : null,
      detail:
        verificationStatus === "verified"
          ? clean(employer.verifiedByName)
            ? `Verified by ${clean(employer.verifiedByName)}`
            : "Verified by Operations"
          : verificationStatus === "rejected"
            ? "Rejected · awaiting resubmission"
            : submittedReached
              ? "Awaiting Operations review"
              : "Not reviewed yet",
    },
  ];

  if (jobs) {
    const firstLiveAt = earliestActivityDate([jobs.firstPublishedAt, jobs.firstApprovedAt]);
    stages.push(
      {
        id: "first_job",
        label: "First job created",
        reached: jobs.total > 0,
        at: jobs.firstCreatedAt,
        detail: jobs.total > 0 ? plural(jobs.total, "job") : "No jobs yet",
      },
      {
        id: "job_live",
        label: "Job live",
        reached: Boolean(firstLiveAt) || jobs.live > 0,
        at: firstLiveAt,
        detail:
          jobs.live > 0
            ? `${plural(jobs.live, "job")} live now`
            : firstLiveAt
              ? "None live now"
              : "No job live yet",
      },
    );
  }

  const apps = input.applications;
  if (apps) {
    stages.push(
      {
        id: "first_application",
        label: "First application",
        reached: apps.applications > 0,
        at: earliestActivityDate([apps.firstAppliedAt, apps.firstSubmittedAt]),
        detail:
          apps.applications > 0
            ? plural(apps.applications, "application")
            : "No applications yet",
      },
      {
        id: "first_hire",
        label: "First hire",
        reached: apps.hired > 0,
        at: apps.firstHiredAt,
        detail: apps.hired > 0 ? plural(apps.hired, "hire") : "Not yet",
      },
    );
  }

  return finalizeJourney(stages);
}

export function buildEmployerActivitySummary(input: {
  jobs: EmployerJobStats | null;
  applications: ApplicationActivityStats | null;
  savedCandidates: number;
  lastLoginAt: Date | null;
  lastActivityAt: Date | null;
}): EmployerActivitySummary {
  const { jobs } = input;
  const apps = input.applications;
  return {
    jobs: jobs?.total ?? 0,
    draftJobs: jobs?.drafts ?? 0,
    liveJobs: jobs?.live ?? 0,
    pendingJobs: jobs?.pending ?? 0,
    closedJobs: jobs?.closed ?? 0,
    applications: apps?.applications ?? 0,
    shortlisted: apps?.shortlisted ?? 0,
    interviews: apps?.interviews ?? 0,
    hired: apps?.hired ?? 0,
    savedCandidates: input.savedCandidates,
    lastLoginAt: input.lastLoginAt?.toISOString() ?? null,
    lastActivityAt: input.lastActivityAt?.toISOString() ?? null,
  };
}
