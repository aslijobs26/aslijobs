import mongoose from "mongoose";
import { HTTP_STATUS } from "../../constants/http-status.js";
import { buildListPagination } from "../../utils/pagination.js";
import {
  JOB_SEEKER_AVAILABILITY_STATUS_LABELS,
  JOB_SEEKER_AVAILABILITY_STATUSES,
} from "../../constants/job-seeker.constants.js";
import { AppError } from "../../middleware/error.middleware.js";
import { EmployerModel } from "../employers/employer.model.js";
import { JobModel } from "../jobs/job.model.js";
import { ensureEmployerJobRelationsConsistent } from "../jobs/job-cascade-delete.js";
import { JobSeekerModel } from "../job-seekers/job-seeker.model.js";
import { generateResumePdfFromJson } from "../resumes/pdf/index.js";
import { resumeService } from "../resumes/resume.service.js";
import type { ResumeJson } from "../resumes/resume.types.js";
import {
  APPLICATION_DEFAULT_STATUS,
  APPLICATION_EVENT_NAMES,
  WITHDRAWABLE_STATUSES,
} from "./application.constants.js";
import { ApplicationModel } from "./application.model.js";
import {
  buildEmployerAvailabilityMatch,
  parseEmployerAvailabilityFilter,
} from "./employer-availability-filter.js";
import { buildEmployerCandidateSearchMatch } from "./employer-candidate-search.js";
import {
  buildEmployerExperienceMatch,
  parseEmployerExperienceFilter,
} from "./employer-experience-filter.js";
import {
  buildEmployerPreferredLocationMatch,
  buildPreferredLocationSuggestions,
  EMPLOYER_LOCATION_AUTOCOMPLETE_MIN_QUERY,
  escapeEmployerLocationRegex,
  normalizeEmployerLocationQuery,
} from "./employer-location-filter.js";
import {
  assertEmployerStatusChangeAllowed,
  isEmployerTerminalStatus,
} from "./employer-status-transition.js";
import type {
  ApplicationHistoryActor,
  ApplicationInterview,
  ApplicationOffer,
  ApplicationResumeSnapshot,
  ApplicationSavedCandidatePrefill,
  ApplicationShortlistDetails,
  ApplicationShortlistNextAction,
  ApplicationStatus,
  ApplicationStatusHistoryEntry,
  ApplyToJobInput,
  EmployerApplicationDetail,
  EmployerApplicationListItem,
  EmployerApplicationStats,
  EmployerApplicationsPagination,
  EmployerInterviewListItem,
  EmployerInterviewJobTab,
  EmployerInterviewStats,
  EmployerInterviewStatusOverview,
  PublicApplicationSummary,
  SeekerApplicationDetail,
  SeekerApplicationListItem,
  SeekerApplicationStats,
} from "./application.types.js";
import { SavedCandidateModel } from "../saved-candidates/saved-candidate.model.js";
import { savedCandidateService } from "../saved-candidates/saved-candidate.service.js";
import type { SavedCandidatePriority } from "../saved-candidates/saved-candidate.types.js";
import {
  buildEmployerInterviewBaseMatch,
  buildEmployerInterviewSearchMatch,
  endOfWeekSunday,
  formatLocalDateString,
  hasInterviewRescheduleRemark,
  isInterviewDateInPeriod,
  startOfWeekMonday,
  type EmployerInterviewStatsPeriod,
} from "./employer-interview-query.js";
import { notificationService } from "../notifications/notification.service.js";
import type { ApplicationNotificationContext } from "../notifications/notification.types.js";

type StatusHistoryWrite = {
  status: ApplicationStatus;
  at: Date;
  actorType: ApplicationHistoryActor;
  remark?: string;
};

function toPublicApplication(application: {
  _id: mongoose.Types.ObjectId;
  publicJobId: string;
  resumeVersion: number;
  appliedAt: Date;
  status: ApplicationStatus;
}): PublicApplicationSummary {
  return {
    id: application._id.toString(),
    publicJobId: application.publicJobId,
    resumeVersion: application.resumeVersion,
    appliedAt: application.appliedAt.toISOString(),
    status: application.status,
  };
}

function buildResumeSnapshot(resume: {
  id: string;
  status: ApplicationResumeSnapshot["status"];
  templateId: string;
  templateVersion: string;
  versionNumber: number;
  profileCompletionPercent: number;
  resumeJson: ResumeJson | Record<string, never>;
  lastGeneratedAt: Date | null;
}): ApplicationResumeSnapshot {
  const resumeJson = structuredClone(resume.resumeJson) as ResumeJson;

  return {
    resumeJson,
    templateId: resume.templateId,
    templateVersion: resume.templateVersion,
    versionNumber: resume.versionNumber,
    profileCompletionPercent: resume.profileCompletionPercent,
    generatedAt: resume.lastGeneratedAt
      ? resume.lastGeneratedAt.toISOString()
      : (resumeJson.meta?.generatedAt ?? null),
    status: resume.status,
  };
}

function text(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function asSnapshot(
  value: unknown,
): ApplicationResumeSnapshot | null {
  if (!value || typeof value !== "object") {
    return null;
  }

  const snapshot = value as ApplicationResumeSnapshot;
  if (
    !snapshot.resumeJson ||
    typeof snapshot.resumeJson !== "object" ||
    !("header" in snapshot.resumeJson) ||
    !("sections" in snapshot.resumeJson)
  ) {
    return null;
  }

  return snapshot;
}

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

type JobSeekerAvailabilityStatus =
  (typeof JOB_SEEKER_AVAILABILITY_STATUSES)[number];

function availabilityStatusLabel(status: unknown): string {
  if (
    typeof status === "string" &&
    status in JOB_SEEKER_AVAILABILITY_STATUS_LABELS
  ) {
    return JOB_SEEKER_AVAILABILITY_STATUS_LABELS[
      status as JobSeekerAvailabilityStatus
    ];
  }
  return "";
}

function jobSeekerLookupStages(): mongoose.PipelineStage[] {
  return [
    {
      $lookup: {
        from: "jobseekers",
        localField: "jobSeekerId",
        foreignField: "_id",
        as: "jobSeekerDoc",
      },
    },
    {
      $unwind: {
        path: "$jobSeekerDoc",
        preserveNullAndEmptyArrays: true,
      },
    },
  ];
}

function candidateFieldsFromSnapshot(snapshot: ApplicationResumeSnapshot | null) {
  const header = snapshot?.resumeJson?.header;
  const contact = snapshot?.resumeJson?.sections?.contact;
  const sections = snapshot?.resumeJson?.sections;
  const preferences = sections?.careerPreferences;
  const meta = snapshot?.resumeJson?.meta;

  const fullName =
    text(header?.fullName) || text(contact?.fullName) || "Candidate";
  const phone = text(header?.phone) || text(contact?.phone);
  const city = text(header?.city) || text(contact?.city);
  const state = text(header?.state) || text(contact?.state);
  const headline =
    text(sections?.professionalHeadline) || text(header?.headline);
  const location =
    [city, state].filter(Boolean).join(", ") || text(header?.location);
  const experienceLabel = sections?.isFresher
    ? "Fresher"
    : text(sections?.experienceLabel) || headline || "Experienced";
  const availability = text(sections?.availability);
  const languages = Array.isArray(sections?.languages)
    ? sections.languages.map((item) => text(item)).filter(Boolean)
    : [];
  const skills = Array.isArray(sections?.skills)
    ? sections.skills.map((item) => text(item)).filter(Boolean)
    : [];
  const expectedSalary =
    typeof preferences?.expectedSalary === "number"
      ? preferences.expectedSalary
      : null;
  const expectedSalaryPeriod = text(preferences?.expectedSalaryPeriod) || null;
  const dateOfBirth = text(meta?.dateOfBirth) || null;

  return {
    fullName,
    phone,
    city,
    state,
    headline,
    location,
    experienceLabel,
    availability,
    languages,
    skills,
    expectedSalary,
    expectedSalaryPeriod,
    dateOfBirth,
  };
}

function formatCurrencyAmount(amount: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatSalaryLabel(job: {
  salaryType?: string;
  salaryPeriod?: string;
  fixedSalary?: number | null;
  minimumSalary?: number | null;
  maximumSalary?: number | null;
}): string {
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
    return `${formatCurrencyAmount(job.minimumSalary)} – ${formatCurrencyAmount(job.maximumSalary)}${period}`;
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

function formatJobLocation(job: {
  cityName?: string;
  city?: string;
  stateName?: string;
  state?: string;
}): string {
  const city = text(job.cityName) || text(job.city);
  const state = text(job.stateName) || text(job.state);
  return [city, state].filter(Boolean).join(", ");
}

function salarySortValue(job: {
  salaryType?: string;
  fixedSalary?: number | null;
  minimumSalary?: number | null;
  maximumSalary?: number | null;
} | null | undefined): number | null {
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

function formatShiftLabel(job: {
  partTimeSchedule?: string;
  partTimeStartTime?: string;
  partTimeEndTime?: string;
} | null | undefined): string {
  if (!job) {
    return "";
  }
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

function mapSeekerListItem(input: {
  app: {
    _id: { toString(): string };
    publicJobId: string;
    jobId: unknown;
    employerId: unknown;
    status: string;
    resumeVersion: number;
    appliedAt: Date;
    statusHistory?: unknown;
    interview?: unknown;
  };
  job:
    | {
        jobTitle?: string;
        companyName?: string;
        cityName?: string;
        city?: string;
        stateName?: string;
        state?: string;
        salaryType?: string;
        salaryPeriod?: string;
        fixedSalary?: number | null;
        minimumSalary?: number | null;
        maximumSalary?: number | null;
        workMode?: string;
        jobType?: string;
        partTimeSchedule?: string;
        partTimeStartTime?: string;
        partTimeEndTime?: string;
      }
    | undefined;
  employer: { companyLogo?: { url?: string } | null } | undefined;
}): SeekerApplicationListItem {
  const { app, job, employer } = input;
  const history = mapStatusHistory(app.statusHistory);
  const lastStatusUpdatedAt =
    history.length > 0 ? history[history.length - 1]!.at : null;
  const interview = mapInterview(app.interview);
  const status = app.status as ApplicationStatus;

  return {
    id: app._id.toString(),
    publicJobId: app.publicJobId,
    jobTitle: job?.jobTitle?.trim() || "Job",
    companyName: job?.companyName?.trim() || "",
    companyLogoUrl: text(employer?.companyLogo?.url),
    location: job ? formatJobLocation(job) : "",
    salaryLabel: job ? formatSalaryLabel(job) : "Not disclosed",
    salarySortValue: salarySortValue(job),
    workMode: text(job?.workMode),
    jobType: text(job?.jobType),
    shiftLabel: formatShiftLabel(job),
    interviewDate: interview.date,
    interviewTime: interview.time,
    canWithdraw: canWithdraw(status),
    status,
    resumeVersion: app.resumeVersion,
    appliedAt: app.appliedAt.toISOString(),
    lastStatusUpdatedAt,
  };
}

function emptyInterview(): ApplicationInterview {
  return {
    date: "",
    time: "",
    mode: "",
    meetingLink: "",
    venue: "",
    instructions: "",
    interviewerName: "",
    interviewerDesignation: "",
    interviewerEmail: "",
    interviewerPhone: "",
    cancelledAt: null,
    cancellationReason: "",
    cancelledByName: "",
  };
}

function emptyOffer(): ApplicationOffer {
  return {
    offerDate: "",
    joiningDate: "",
    packageText: "",
    notes: "",
  };
}

function mapCancelledAt(value: unknown): string | null {
  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : value.toISOString();
  }
  if (typeof value === "string" && value.trim()) {
    return value.trim();
  }
  return null;
}

function mapInterview(value: unknown): ApplicationInterview {
  if (!value || typeof value !== "object") {
    return emptyInterview();
  }
  const interview = value as Record<string, unknown>;
  return {
    date: text(interview.date),
    time: text(interview.time),
    mode: (interview.mode as ApplicationInterview["mode"]) || "",
    meetingLink: text(interview.meetingLink),
    venue: text(interview.venue),
    instructions: text(interview.instructions),
    interviewerName: text(interview.interviewerName),
    interviewerDesignation: text(interview.interviewerDesignation),
    interviewerEmail: text(interview.interviewerEmail),
    interviewerPhone: text(interview.interviewerPhone),
    cancelledAt: mapCancelledAt(interview.cancelledAt),
    cancellationReason: text(interview.cancellationReason),
    cancelledByName: text(interview.cancelledByName),
  };
}

/** Converts API interview shape to a mongoose-safe document (Date for cancelledAt). */
function toInterviewDocument(interview: ApplicationInterview): {
  date: string;
  time: string;
  mode: ApplicationInterview["mode"];
  meetingLink: string;
  venue: string;
  instructions: string;
  interviewerName: string;
  interviewerDesignation: string;
  interviewerEmail: string;
  interviewerPhone: string;
  cancelledAt: Date | null;
  cancellationReason: string;
  cancelledByName: string;
} {
  let cancelledAt: Date | null = null;
  if (interview.cancelledAt) {
    const parsed = new Date(interview.cancelledAt);
    cancelledAt = Number.isNaN(parsed.getTime()) ? null : parsed;
  }

  return {
    date: interview.date,
    time: interview.time,
    mode: interview.mode,
    meetingLink: interview.meetingLink,
    venue: interview.venue,
    instructions: interview.instructions,
    interviewerName: interview.interviewerName,
    interviewerDesignation: interview.interviewerDesignation,
    interviewerEmail: interview.interviewerEmail,
    interviewerPhone: interview.interviewerPhone,
    cancelledAt,
    cancellationReason: interview.cancellationReason,
    cancelledByName: interview.cancelledByName,
  };
}

function isInterviewCancelled(interview: ApplicationInterview): boolean {
  return Boolean(interview.cancelledAt);
}

function normalizeInterviewForMode(
  interview: ApplicationInterview,
): ApplicationInterview {
  const next: ApplicationInterview = {
    ...interview,
    date: text(interview.date),
    time: text(interview.time),
    mode: interview.mode || "",
    meetingLink: text(interview.meetingLink),
    venue: text(interview.venue),
    instructions: text(interview.instructions),
    interviewerName: text(interview.interviewerName),
    interviewerDesignation: text(interview.interviewerDesignation),
    interviewerEmail: text(interview.interviewerEmail),
    interviewerPhone: text(interview.interviewerPhone),
  };

  if (next.mode === "online") {
    next.venue = "";
  } else if (next.mode === "offline") {
    next.meetingLink = "";
  } else if (next.mode === "phone") {
    next.meetingLink = "";
    next.venue = "";
  }

  return next;
}

function interviewsEqual(
  left: ApplicationInterview,
  right: ApplicationInterview,
): boolean {
  return (
    left.date === right.date &&
    left.time === right.time &&
    left.mode === right.mode &&
    left.meetingLink === right.meetingLink &&
    left.venue === right.venue &&
    left.instructions === right.instructions &&
    left.interviewerName === right.interviewerName &&
    left.interviewerDesignation === right.interviewerDesignation &&
    left.interviewerEmail === right.interviewerEmail &&
    left.interviewerPhone === right.interviewerPhone
  );
}

function mapOffer(value: unknown): ApplicationOffer {
  if (!value || typeof value !== "object") {
    return emptyOffer();
  }
  const offer = value as Partial<ApplicationOffer>;
  return {
    offerDate: text(offer.offerDate),
    joiningDate: text(offer.joiningDate),
    packageText: text(offer.packageText),
    notes: text(offer.notes),
  };
}

function mapStatusHistory(
  value: unknown,
): ApplicationStatusHistoryEntry[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.map((entry) => {
    const item = entry as {
      status?: ApplicationStatus;
      at?: Date | string;
      actorType?: ApplicationHistoryActor;
      remark?: string;
    };
    const at =
      item.at instanceof Date
        ? item.at.toISOString()
        : typeof item.at === "string"
          ? item.at
          : new Date().toISOString();

    return {
      status: (item.status ?? APPLICATION_DEFAULT_STATUS) as ApplicationStatus,
      at,
      actorType: (item.actorType ?? "system") as ApplicationHistoryActor,
      remark: text(item.remark),
    };
  });
}

function appendStatusHistory(
  application: {
    statusHistory?: StatusHistoryWrite[];
  },
  entry: StatusHistoryWrite,
): void {
  if (!Array.isArray(application.statusHistory)) {
    application.statusHistory = [];
  }
  application.statusHistory.push({
    status: entry.status,
    at: entry.at,
    actorType: entry.actorType,
    remark: text(entry.remark),
  });
}

function eventNameForStatus(status: ApplicationStatus): string | null {
  switch (status) {
    case "viewed":
      return APPLICATION_EVENT_NAMES.VIEWED;
    case "under_review":
      return APPLICATION_EVENT_NAMES.UNDER_REVIEW;
    case "shortlisted":
      return APPLICATION_EVENT_NAMES.SHORTLISTED;
    case "interview_scheduled":
      return APPLICATION_EVENT_NAMES.INTERVIEW_SCHEDULED;
    case "interview_completed":
      return APPLICATION_EVENT_NAMES.INTERVIEW_COMPLETED;
    case "offer_sent":
      return APPLICATION_EVENT_NAMES.OFFER_SENT;
    case "selected":
      return APPLICATION_EVENT_NAMES.SELECTED;
    case "rejected":
      return APPLICATION_EVENT_NAMES.REJECTED;
    case "joined":
      return APPLICATION_EVENT_NAMES.JOINED;
    case "withdrawn":
      return APPLICATION_EVENT_NAMES.WITHDRAWN;
    default:
      return null;
  }
}

/** Dispatches in-app notifications; never fails the hiring mutation. */
function emitApplicationEvent(
  eventName: string,
  context: ApplicationNotificationContext,
): void {
  void notificationService
    .handleApplicationEvent({ eventName, context })
    .catch((error: unknown) => {
      console.error("[notifications] Failed to handle application event", {
        eventName,
        applicationId: context.applicationId,
        error,
      });
    });
}

function buildApplicationEventContext(input: {
  applicationId: string;
  jobSeekerId: string;
  employerId: string;
  publicJobId: string;
  jobTitle?: string;
  companyName?: string;
  candidateName?: string;
  interview?: ApplicationInterview;
  cancellationReason?: string;
}): ApplicationNotificationContext {
  const interview = input.interview
    ? {
        date: text(input.interview.date) || undefined,
        time: text(input.interview.time) || undefined,
        mode: text(input.interview.mode) || undefined,
        meetingLink: text(input.interview.meetingLink) || undefined,
        venue: text(input.interview.venue) || undefined,
      }
    : undefined;

  return {
    applicationId: input.applicationId,
    jobSeekerId: String(input.jobSeekerId),
    employerId: String(input.employerId),
    publicJobId: input.publicJobId,
    jobTitle: input.jobTitle?.trim() || "Job",
    companyName: input.companyName?.trim() || "",
    candidateName: input.candidateName?.trim() || undefined,
    interview,
    cancellationReason: input.cancellationReason?.trim() || undefined,
  };
}

function canWithdraw(status: ApplicationStatus): boolean {
  return (WITHDRAWABLE_STATUSES as readonly string[]).includes(status);
}

function interviewHasContent(interview: ApplicationInterview): boolean {
  return Boolean(
    interview.date ||
      interview.time ||
      interview.mode ||
      interview.meetingLink ||
      interview.venue ||
      interview.instructions ||
      interview.interviewerName ||
      interview.interviewerDesignation ||
      interview.interviewerEmail ||
      interview.interviewerPhone,
  );
}

function offerHasContent(offer: ApplicationOffer): boolean {
  return Boolean(
    offer.offerDate ||
      offer.joiningDate ||
      offer.packageText ||
      offer.notes,
  );
}

export class ApplicationService {
  async applyToJob(input: ApplyToJobInput) {
    if (!mongoose.Types.ObjectId.isValid(input.jobSeekerId)) {
      throw new AppError("Unauthorized", HTTP_STATUS.UNAUTHORIZED);
    }

    const publicJobId = input.publicJobId.trim().toUpperCase();
    if (!publicJobId) {
      throw new AppError("Job id is required", HTTP_STATUS.BAD_REQUEST);
    }

    const job = await JobModel.findOne({
      jobId: publicJobId,
      status: "active",
    });

    if (!job) {
      throw new AppError("Job not found", HTTP_STATUS.NOT_FOUND);
    }

    const existing = await ApplicationModel.findOne({
      jobSeekerId: input.jobSeekerId,
      jobId: job._id,
    }).lean();

    if (existing) {
      throw new AppError(
        "You have already applied to this job",
        HTTP_STATUS.CONFLICT,
      );
    }

    const resume = await resumeService.ensureReadyResumeForApply(
      input.jobSeekerId,
    );

    if (resume.jobSeekerId !== input.jobSeekerId || !resume.isActive) {
      throw new AppError(
        "We couldn't prepare your resume right now. Please try again in a few moments.",
        HTTP_STATUS.BAD_REQUEST,
      );
    }

    const resumeSnapshot = buildResumeSnapshot(resume);
    const appliedAt = new Date();

    let application;
    try {
      application = await ApplicationModel.create({
        jobId: job._id,
        publicJobId: job.jobId,
        employerId: job.employerId,
        jobSeekerId: input.jobSeekerId,
        resumeId: resume.id,
        resumeVersion: resume.versionNumber,
        resumeStatus: resume.status,
        resumeSnapshot,
        status: APPLICATION_DEFAULT_STATUS,
        statusHistory: [
          {
            status: APPLICATION_DEFAULT_STATUS,
            at: appliedAt,
            actorType: "job_seeker",
            remark: "",
          },
        ],
        employerNotes: "",
        employerNotesVisibleToSeeker: false,
        employerNotesCreatedAt: null,
        employerNotesUpdatedAt: null,
        employerNotesUpdatedByName: "",
        appliedAt,
      });
    } catch (error) {
      if (
        typeof error === "object" &&
        error !== null &&
        "code" in error &&
        (error as { code?: number }).code === 11000
      ) {
        throw new AppError(
          "You have already applied to this job",
          HTTP_STATUS.CONFLICT,
        );
      }
      throw error;
    }

    await JobModel.updateOne({ _id: job._id }, { $inc: { applications: 1 } });

    const snapshot = asSnapshot(resumeSnapshot);
    const candidate = candidateFieldsFromSnapshot(snapshot);

    emitApplicationEvent(
      APPLICATION_EVENT_NAMES.SUBMITTED,
      buildApplicationEventContext({
        applicationId: application._id.toString(),
        jobSeekerId: input.jobSeekerId,
        employerId: String(job.employerId),
        publicJobId: job.jobId,
        jobTitle: job.jobTitle,
        companyName: job.companyName,
        candidateName: candidate.fullName,
      }),
    );

    return {
      application: toPublicApplication(application),
    };
  }

  private async findOwnedApplicationOrThrow(
    applicationId: string,
    employerId: string,
  ) {
    if (!mongoose.Types.ObjectId.isValid(applicationId)) {
      throw new AppError("Application not found", HTTP_STATUS.NOT_FOUND);
    }

    if (!mongoose.Types.ObjectId.isValid(employerId)) {
      throw new AppError("Unauthorized", HTTP_STATUS.UNAUTHORIZED);
    }

    const application = await ApplicationModel.findOne({
      _id: applicationId,
      employerId,
    });

    if (!application) {
      throw new AppError("Application not found", HTTP_STATUS.NOT_FOUND);
    }

    return application;
  }

  private async findSeekerApplicationOrThrow(
    applicationId: string,
    jobSeekerId: string,
  ) {
    if (!mongoose.Types.ObjectId.isValid(applicationId)) {
      throw new AppError("Application not found", HTTP_STATUS.NOT_FOUND);
    }

    if (!mongoose.Types.ObjectId.isValid(jobSeekerId)) {
      throw new AppError("Unauthorized", HTTP_STATUS.UNAUTHORIZED);
    }

    const application = await ApplicationModel.findOne({
      _id: applicationId,
      jobSeekerId,
    });

    if (!application) {
      throw new AppError("Application not found", HTTP_STATUS.NOT_FOUND);
    }

    return application;
  }

  private mapShortlistDetails(
    shortlist: unknown,
  ): ApplicationShortlistDetails | null {
    if (!shortlist || typeof shortlist !== "object") {
      return null;
    }
    const value = shortlist as {
      priority?: string;
      tags?: unknown;
      notes?: string;
      nextAction?: string;
      shortlistedAt?: Date | string | null;
      shortlistedByName?: string | null;
    };
    const priority =
      value.priority === "high" ||
      value.priority === "medium" ||
      value.priority === "low"
        ? value.priority
        : null;
    const nextAction =
      value.nextAction === "schedule_interview" ||
      value.nextAction === "send_message" ||
      value.nextAction === "call_candidate" ||
      value.nextAction === "none"
        ? value.nextAction
        : "none";
    const tags = Array.isArray(value.tags)
      ? value.tags
          .filter((tag): tag is string => typeof tag === "string")
          .map((tag) => tag.trim())
          .filter(Boolean)
      : [];
    const shortlistedAt =
      value.shortlistedAt instanceof Date
        ? value.shortlistedAt.toISOString()
        : typeof value.shortlistedAt === "string" && value.shortlistedAt
          ? value.shortlistedAt
          : null;

    return {
      priority,
      tags,
      notes: text(value.notes),
      nextAction,
      shortlistedAt,
      shortlistedByName: text(value.shortlistedByName) || null,
    };
  }

  private toEmployerDetail(
    application: {
      _id: mongoose.Types.ObjectId;
      publicJobId: string;
      status: ApplicationStatus | string;
      resumeVersion: number;
      resumeStatus: string;
      resumeSnapshot: unknown;
      employerNotes?: string;
      employerNotesVisibleToSeeker?: boolean;
      employerNotesCreatedAt?: Date | null;
      employerNotesUpdatedAt?: Date | null;
      employerNotesUpdatedByName?: string | null;
      rejectReason?: string;
      interview?: unknown;
      offer?: unknown;
      shortlist?: unknown;
      statusHistory?: unknown;
      appliedAt: Date;
      viewedAt?: Date | null;
      withdrawnAt?: Date | null;
      createdAt?: Date;
      updatedAt?: Date;
    },
    job: { jobTitle?: string; companyName?: string } | null,
    availabilityStatus?: string | null,
    preferredJobLocation?: string | null,
    savedCandidate?: ApplicationSavedCandidatePrefill | null,
  ): EmployerApplicationDetail {
    const snapshot = asSnapshot(application.resumeSnapshot);
    if (!snapshot) {
      throw new AppError(
        "Resume snapshot is not available for this application",
        HTTP_STATUS.BAD_REQUEST,
      );
    }

    const candidate = candidateFieldsFromSnapshot(snapshot);
    const statusLabel = availabilityStatusLabel(availabilityStatus);
    const preferredLocation =
      typeof preferredJobLocation === "string" && preferredJobLocation.trim()
        ? preferredJobLocation.trim()
        : null;

    return {
      id: application._id.toString(),
      publicJobId: application.publicJobId,
      jobTitle: job?.jobTitle?.trim() || "Job",
      companyName: job?.companyName?.trim() || "",
      status: application.status as ApplicationStatus,
      resumeVersion: application.resumeVersion,
      resumeStatus: application.resumeStatus,
      resumeSnapshot: snapshot,
      employerNotes: application.employerNotes ?? "",
      employerNotesVisibleToSeeker:
        application.employerNotesVisibleToSeeker === true,
      employerNotesCreatedAt: application.employerNotesCreatedAt
        ? application.employerNotesCreatedAt.toISOString()
        : null,
      employerNotesUpdatedAt: application.employerNotesUpdatedAt
        ? application.employerNotesUpdatedAt.toISOString()
        : null,
      employerNotesUpdatedByName: text(
        application.employerNotesUpdatedByName,
      ) || null,
      rejectReason: text(application.rejectReason),
      interview: mapInterview(application.interview),
      offer: mapOffer(application.offer),
      shortlist: this.mapShortlistDetails(application.shortlist),
      savedCandidate: savedCandidate ?? null,
      statusHistory: mapStatusHistory(application.statusHistory),
      appliedAt: application.appliedAt.toISOString(),
      viewedAt: application.viewedAt
        ? application.viewedAt.toISOString()
        : null,
      withdrawnAt: application.withdrawnAt
        ? application.withdrawnAt.toISOString()
        : null,
      createdAt: application.createdAt
        ? application.createdAt.toISOString()
        : null,
      updatedAt: application.updatedAt
        ? application.updatedAt.toISOString()
        : null,
      candidate: {
        fullName: candidate.fullName,
        phone: candidate.phone,
        city: candidate.city,
        state: candidate.state,
        headline: candidate.headline,
        experienceLabel: candidate.experienceLabel,
        availability: statusLabel || candidate.availability,
        availabilityStatus:
          typeof availabilityStatus === "string" ? availabilityStatus : null,
        preferredJobLocation: preferredLocation,
        languages: candidate.languages,
        expectedSalary: candidate.expectedSalary,
        expectedSalaryPeriod: candidate.expectedSalaryPeriod,
        dateOfBirth: candidate.dateOfBirth,
      },
    };
  }

  async listForEmployer(input: {
    employerId: string;
    publicJobId?: string;
    status?: ApplicationStatus;
    search?: string;
    sort?: "newest" | "oldest" | "updated";
    page?: number;
    limit?: number;
    location?: string;
    experience?: string;
    skills?: string;
    availability?: string;
    appliedFrom?: string;
    appliedTo?: string;
  }): Promise<{
    applications: EmployerApplicationListItem[];
    pagination: EmployerApplicationsPagination;
  }> {
    if (!mongoose.Types.ObjectId.isValid(input.employerId)) {
      throw new AppError("Unauthorized", HTTP_STATUS.UNAUTHORIZED);
    }

    await ensureEmployerJobRelationsConsistent(input.employerId);

    const page = input.page ?? 1;
    const limit = input.limit ?? 20;
    const sortKey = input.sort ?? "newest";

    const match: Record<string, unknown> = {
      employerId: new mongoose.Types.ObjectId(input.employerId),
    };

    if (input.publicJobId?.trim()) {
      match.publicJobId = input.publicJobId.trim().toUpperCase();
    }

    if (input.status) {
      match.status = input.status;
    }

    const appliedAt: Record<string, Date> = {};
    if (input.appliedFrom?.trim()) {
      const from = new Date(input.appliedFrom);
      if (!Number.isNaN(from.getTime())) {
        appliedAt.$gte = from;
      }
    }
    if (input.appliedTo?.trim()) {
      const to = new Date(input.appliedTo);
      if (!Number.isNaN(to.getTime())) {
        to.setHours(23, 59, 59, 999);
        appliedAt.$lte = to;
      }
    }
    if (Object.keys(appliedAt).length > 0) {
      match.appliedAt = appliedAt;
    }

    const andFilters: Record<string, unknown>[] = [];

    const searchMatch = buildEmployerCandidateSearchMatch(input.search);
    if (searchMatch) {
      andFilters.push(searchMatch);
    }

    const locationMatch = buildEmployerPreferredLocationMatch(input.location);
    if (locationMatch) {
      andFilters.push(locationMatch);
    }

    const experienceMatch = buildEmployerExperienceMatch(
      parseEmployerExperienceFilter(input.experience),
    );
    if (experienceMatch) {
      andFilters.push(experienceMatch);
    }

    const skills = text(input.skills);
    if (skills) {
      const skillTerms = skills
        .split(",")
        .map((term) => term.trim())
        .filter(Boolean);
      for (const term of skillTerms) {
        andFilters.push({
          "resumeSnapshot.resumeJson.sections.skills": {
            $elemMatch: {
              $regex: escapeRegex(term),
              $options: "i",
            },
          },
        });
      }
    }

    const availabilityMatch = buildEmployerAvailabilityMatch(
      parseEmployerAvailabilityFilter(input.availability),
    );
    if (availabilityMatch) {
      andFilters.push(availabilityMatch);
    }

    const sortStage: Record<string, 1 | -1> =
      sortKey === "oldest"
        ? { appliedAt: 1 }
        : sortKey === "updated"
          ? { updatedAt: -1 }
          : { appliedAt: -1 };

    const pipeline: mongoose.PipelineStage[] = [
      { $match: match },
      {
        $lookup: {
          from: "jobs",
          localField: "jobId",
          foreignField: "_id",
          as: "job",
        },
      },
      {
        $unwind: {
          path: "$job",
          preserveNullAndEmptyArrays: true,
        },
      },
      ...jobSeekerLookupStages(),
    ];

    if (andFilters.length > 0) {
      pipeline.push({ $match: { $and: andFilters } });
    }

    pipeline.push({ $sort: sortStage });
    pipeline.push({
      $facet: {
        items: [{ $skip: (page - 1) * limit }, { $limit: limit }],
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
        resumeSnapshot: unknown;
        appliedAt: Date;
        updatedAt?: Date;
        job?: { jobTitle?: string; companyName?: string };
        jobSeekerDoc?: {
          availabilityStatus?: string | null;
          preferredJobLocation?: string | null;
        };
      }>;
      totalCount: Array<{ count: number }>;
    }>(pipeline);

    const total = facet?.totalCount?.[0]?.count ?? 0;
    const applications: EmployerApplicationListItem[] = (facet?.items ?? []).map(
      (app) => {
        const snapshot = asSnapshot(app.resumeSnapshot);
        const candidate = candidateFieldsFromSnapshot(snapshot);
        const statusLabel = availabilityStatusLabel(
          app.jobSeekerDoc?.availabilityStatus,
        );

        return {
          id: app._id.toString(),
          publicJobId: app.publicJobId,
          jobTitle: app.job?.jobTitle?.trim() || "Job",
          companyName: app.job?.companyName?.trim() || "",
          candidateName: candidate.fullName,
          candidateHeadline: candidate.headline,
          candidateLocation:
            text(app.jobSeekerDoc?.preferredJobLocation) || candidate.location,
          candidatePhone: candidate.phone,
          candidateExperienceLabel: candidate.experienceLabel,
          candidateSkills: candidate.skills.slice(0, 5),
          candidateAvailability: statusLabel || candidate.availability,
          candidateAvailabilityStatus:
            typeof app.jobSeekerDoc?.availabilityStatus === "string"
              ? app.jobSeekerDoc.availabilityStatus
              : null,
          status: app.status as ApplicationStatus,
          resumeVersion: app.resumeVersion,
          resumeStatus: app.resumeStatus,
          appliedAt: app.appliedAt.toISOString(),
          updatedAt: app.updatedAt ? app.updatedAt.toISOString() : null,
        };
      },
    );

    return {
      applications,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.max(1, Math.ceil(total / limit)),
      },
    };
  }

  async suggestPreferredLocationsForEmployer(input: {
    employerId: string;
    q: string;
    publicJobId?: string;
    limit?: number;
  }): Promise<{ locations: string[] }> {
    if (!mongoose.Types.ObjectId.isValid(input.employerId)) {
      throw new AppError("Unauthorized", HTTP_STATUS.UNAUTHORIZED);
    }

    const query = normalizeEmployerLocationQuery(input.q);
    if (query.length < EMPLOYER_LOCATION_AUTOCOMPLETE_MIN_QUERY) {
      return { locations: [] };
    }

    const match: Record<string, unknown> = {
      employerId: new mongoose.Types.ObjectId(input.employerId),
    };
    if (input.publicJobId?.trim()) {
      match.publicJobId = input.publicJobId.trim().toUpperCase();
    }

    const pattern = escapeEmployerLocationRegex(query);
    const rows = await ApplicationModel.aggregate<{ location: string }>([
      { $match: match },
      {
        $group: {
          _id: "$jobSeekerId",
        },
      },
      {
        $lookup: {
          from: "jobseekers",
          localField: "_id",
          foreignField: "_id",
          as: "jobSeekerDoc",
        },
      },
      {
        $unwind: {
          path: "$jobSeekerDoc",
          preserveNullAndEmptyArrays: false,
        },
      },
      {
        $project: {
          location: {
            $trim: {
              input: {
                $ifNull: ["$jobSeekerDoc.preferredJobLocation", ""],
              },
            },
          },
        },
      },
      {
        $match: {
          location: {
            $ne: "",
            $regex: pattern,
            $options: "i",
          },
        },
      },
      {
        $group: {
          _id: "$location",
        },
      },
      {
        $project: {
          _id: 0,
          location: "$_id",
        },
      },
      { $limit: 200 },
    ]);

    return {
      locations: buildPreferredLocationSuggestions(
        rows.map((row) => row.location),
        query,
        input.limit,
      ),
    };
  }

  async getStatsForEmployer(input: {
    employerId: string;
    publicJobId?: string;
    appliedFrom?: string;
    appliedTo?: string;
  }): Promise<{ stats: EmployerApplicationStats }> {
    if (!mongoose.Types.ObjectId.isValid(input.employerId)) {
      throw new AppError("Unauthorized", HTTP_STATUS.UNAUTHORIZED);
    }

    await ensureEmployerJobRelationsConsistent(input.employerId);

    const match: Record<string, unknown> = {
      employerId: new mongoose.Types.ObjectId(input.employerId),
    };

    if (input.publicJobId?.trim()) {
      match.publicJobId = input.publicJobId.trim().toUpperCase();
    }

    const appliedAt: Record<string, Date> = {};
    if (input.appliedFrom?.trim()) {
      const from = new Date(input.appliedFrom);
      if (!Number.isNaN(from.getTime())) {
        appliedAt.$gte = from;
      }
    }
    if (input.appliedTo?.trim()) {
      const to = new Date(input.appliedTo);
      if (!Number.isNaN(to.getTime())) {
        to.setHours(23, 59, 59, 999);
        appliedAt.$lte = to;
      }
    }
    if (Object.keys(appliedAt).length > 0) {
      match.appliedAt = appliedAt;
    }

    const rows = await ApplicationModel.aggregate<{
      _id: ApplicationStatus;
      count: number;
    }>([
      { $match: match },
      { $group: { _id: "$status", count: { $sum: 1 } } },
    ]);

    const byStatus = new Map(rows.map((row) => [row._id, row.count]));

    const stats: EmployerApplicationStats = {
      total: 0,
      submitted: byStatus.get("submitted") ?? 0,
      viewed: byStatus.get("viewed") ?? 0,
      under_review: byStatus.get("under_review") ?? 0,
      shortlisted: byStatus.get("shortlisted") ?? 0,
      interview_scheduled: byStatus.get("interview_scheduled") ?? 0,
      interview_completed: byStatus.get("interview_completed") ?? 0,
      offer_sent: byStatus.get("offer_sent") ?? 0,
      selected: byStatus.get("selected") ?? 0,
      joined: byStatus.get("joined") ?? 0,
      rejected: byStatus.get("rejected") ?? 0,
      withdrawn: byStatus.get("withdrawn") ?? 0,
    };

    stats.total =
      stats.submitted +
      stats.viewed +
      stats.under_review +
      stats.shortlisted +
      stats.interview_scheduled +
      stats.interview_completed +
      stats.offer_sent +
      stats.selected +
      stats.joined +
      stats.rejected +
      stats.withdrawn;

    return { stats };
  }

  private toEmployerInterviewListItem(app: {
    _id: mongoose.Types.ObjectId;
    publicJobId: string;
    status: ApplicationStatus;
    appliedAt: Date;
    updatedAt?: Date;
    resumeSnapshot?: unknown;
    interview?: unknown;
    statusHistory?: unknown;
    job?: {
      jobTitle?: string;
      city?: string;
      cityName?: string;
      state?: string;
      stateName?: string;
    } | null;
  }): EmployerInterviewListItem {
    const snapshot = asSnapshot(app.resumeSnapshot);
    const candidate = candidateFieldsFromSnapshot(snapshot);
    const interview = mapInterview(app.interview);

    return {
      id: app._id.toString(),
      publicJobId: app.publicJobId,
      jobTitle: text(app.job?.jobTitle) || "Job",
      jobLocation: app.job ? formatJobLocation(app.job) : "",
      status: app.status,
      wasRescheduled: hasInterviewRescheduleRemark(app.statusHistory),
      isCancelled: isInterviewCancelled(interview),
      cancellationReason: interview.cancellationReason,
      cancelledAt: interview.cancelledAt,
      candidateName: candidate.fullName || "Candidate",
      candidatePhone: candidate.phone,
      interviewDate: interview.date,
      interviewTime: interview.time,
      interviewMode: interview.mode,
      interviewerName: interview.interviewerName,
      interviewerDesignation: interview.interviewerDesignation,
      meetingLink: interview.meetingLink,
      venue: interview.venue,
      appliedAt: app.appliedAt.toISOString(),
      updatedAt: app.updatedAt ? app.updatedAt.toISOString() : null,
    };
  }

  private resolveInterviewDateRange(input: {
    quickDate?: string;
    interviewFrom?: string;
    interviewTo?: string;
  }): { from: string; to: string } | null {
    const today = new Date();
    const todayStr = formatLocalDateString(today);

    if (input.quickDate === "today") {
      return { from: todayStr, to: todayStr };
    }
    if (input.quickDate === "tomorrow") {
      const tomorrow = new Date(today);
      tomorrow.setDate(today.getDate() + 1);
      const tomorrowStr = formatLocalDateString(tomorrow);
      return { from: tomorrowStr, to: tomorrowStr };
    }
    if (input.quickDate === "this_week") {
      return {
        from: formatLocalDateString(startOfWeekMonday(today)),
        to: formatLocalDateString(endOfWeekSunday(today)),
      };
    }
    if (input.quickDate === "this_month") {
      const from = new Date(today.getFullYear(), today.getMonth(), 1);
      const to = new Date(today.getFullYear(), today.getMonth() + 1, 0);
      return {
        from: formatLocalDateString(from),
        to: formatLocalDateString(to),
      };
    }

    const from = text(input.interviewFrom);
    const to = text(input.interviewTo);
    if (!from && !to) {
      return null;
    }
    return {
      from: from || "0000-01-01",
      to: to || "9999-12-31",
    };
  }

  async listInterviewsForEmployer(input: {
    employerId: string;
    publicJobId?: string;
    status?: "interview_scheduled" | "interview_completed";
    mode?: ApplicationInterview["mode"];
    search?: string;
    interviewer?: string;
    interviewFrom?: string;
    interviewTo?: string;
    quickDate?: string;
    sort?: "interview_asc" | "interview_desc" | "newest" | "oldest";
    page?: number;
    limit?: number;
    rescheduledOnly?: boolean;
    cancelledOnly?: boolean;
  }): Promise<{
    interviews: EmployerInterviewListItem[];
    pagination: EmployerApplicationsPagination;
  }> {
    if (!mongoose.Types.ObjectId.isValid(input.employerId)) {
      throw new AppError("Unauthorized", HTTP_STATUS.UNAUTHORIZED);
    }

    await ensureEmployerJobRelationsConsistent(input.employerId);

    const page = input.page ?? 1;
    const limit = input.limit ?? 10;
    const match: Record<string, unknown> = buildEmployerInterviewBaseMatch(
      new mongoose.Types.ObjectId(input.employerId),
    );

    if (input.publicJobId?.trim()) {
      match.publicJobId = input.publicJobId.trim().toUpperCase();
    }
    if (input.status === "interview_completed") {
      match.status = "interview_completed";
    } else if (input.status === "interview_scheduled") {
      // Active interviews by activity (interview.date), not hiring status —
      // shortlisted candidates with a scheduled interview still appear here.
      match.status = { $ne: "interview_completed" };
    }
    if (input.mode === "online" || input.mode === "offline" || input.mode === "phone") {
      match["interview.mode"] = input.mode;
    }

    const interviewer = text(input.interviewer);
    if (interviewer) {
      match["interview.interviewerName"] = {
        $regex: escapeRegex(interviewer),
        $options: "i",
      };
    }

    const dateRange = this.resolveInterviewDateRange(input);
    if (dateRange) {
      match["interview.date"] = {
        $gte: dateRange.from,
        $lte: dateRange.to,
      };
    }

    const andFilters: Record<string, unknown>[] = [];
    const searchMatch = buildEmployerInterviewSearchMatch(input.search);
    if (searchMatch) {
      andFilters.push(searchMatch);
    }

    if (input.cancelledOnly) {
      andFilters.push({
        "interview.cancelledAt": { $type: "date" },
      });
    } else if (input.status === "interview_scheduled" || input.rescheduledOnly) {
      andFilters.push({
        $or: [
          { "interview.cancelledAt": null },
          { "interview.cancelledAt": { $exists: false } },
        ],
      });
    }

    const sortKey = input.sort ?? "interview_asc";
    const sortStage: Record<string, 1 | -1> =
      sortKey === "interview_desc"
        ? { "interview.date": -1, "interview.time": -1 }
        : sortKey === "newest"
          ? { appliedAt: -1 }
          : sortKey === "oldest"
            ? { appliedAt: 1 }
            : { "interview.date": 1, "interview.time": 1 };

    const pipeline: mongoose.PipelineStage[] = [
      { $match: match },
      {
        $lookup: {
          from: "jobs",
          localField: "jobId",
          foreignField: "_id",
          as: "job",
        },
      },
      {
        $unwind: {
          path: "$job",
          preserveNullAndEmptyArrays: true,
        },
      },
    ];

    if (andFilters.length > 0) {
      pipeline.push({ $match: { $and: andFilters } });
    }

    if (input.rescheduledOnly) {
      pipeline.push({
        $match: {
          statusHistory: {
            $elemMatch: {
              remark: { $regex: "^Interview Rescheduled" },
            },
          },
        },
      });
    }

    pipeline.push({ $sort: sortStage });
    pipeline.push({
      $facet: {
        items: [{ $skip: (page - 1) * limit }, { $limit: limit }],
        totalCount: [{ $count: "count" }],
      },
    });

    const [facet] = await ApplicationModel.aggregate<{
      items: Array<{
        _id: mongoose.Types.ObjectId;
        publicJobId: string;
        status: ApplicationStatus;
        appliedAt: Date;
        updatedAt?: Date;
        resumeSnapshot?: unknown;
        interview?: unknown;
        statusHistory?: unknown;
        job?: {
          jobTitle?: string;
          city?: string;
          cityName?: string;
          state?: string;
          stateName?: string;
        } | null;
      }>;
      totalCount: Array<{ count: number }>;
    }>(pipeline);

    const total = facet?.totalCount?.[0]?.count ?? 0;
    const interviews = (facet?.items ?? []).map((app) =>
      this.toEmployerInterviewListItem(app),
    );

    return {
      interviews,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.max(1, Math.ceil(total / limit)),
      },
    };
  }

  async getInterviewStatsForEmployer(input: {
    employerId: string;
    publicJobId?: string;
    period?: EmployerInterviewStatsPeriod;
  }): Promise<{
    stats: EmployerInterviewStats;
    todaysSchedule: EmployerInterviewListItem[];
    jobTabs: EmployerInterviewJobTab[];
    statusOverview: EmployerInterviewStatusOverview;
  }> {
    if (!mongoose.Types.ObjectId.isValid(input.employerId)) {
      throw new AppError("Unauthorized", HTTP_STATUS.UNAUTHORIZED);
    }

    const employerObjectId = new mongoose.Types.ObjectId(input.employerId);
    const baseMatch = buildEmployerInterviewBaseMatch(employerObjectId);
    const match: Record<string, unknown> = { ...baseMatch };
    if (input.publicJobId?.trim()) {
      match.publicJobId = input.publicJobId.trim().toUpperCase();
    }
    const period: EmployerInterviewStatsPeriod = input.period ?? "all_time";

    const today = new Date();
    const todayStr = formatLocalDateString(today);
    const weekFrom = formatLocalDateString(startOfWeekMonday(today));
    const weekTo = formatLocalDateString(endOfWeekSunday(today));

    const [rows, jobTabRows, employerJobs] = await Promise.all([
      ApplicationModel.aggregate<{
        _id: mongoose.Types.ObjectId;
        publicJobId: string;
        status: ApplicationStatus;
        appliedAt: Date;
        updatedAt?: Date;
        resumeSnapshot?: unknown;
        interview?: {
          date?: string;
          time?: string;
          mode?: string;
        };
        statusHistory?: unknown;
        job?: {
          jobTitle?: string;
          city?: string;
          cityName?: string;
          state?: string;
          stateName?: string;
        } | null;
      }>([
        { $match: match },
        {
          $lookup: {
            from: "jobs",
            localField: "jobId",
            foreignField: "_id",
            as: "job",
          },
        },
        {
          $unwind: {
            path: "$job",
            preserveNullAndEmptyArrays: true,
          },
        },
        {
          $project: {
            publicJobId: 1,
            status: 1,
            appliedAt: 1,
            updatedAt: 1,
            resumeSnapshot: 1,
            interview: 1,
            statusHistory: 1,
            job: 1,
          },
        },
      ]),
      ApplicationModel.aggregate<{
        _id: string;
        count: number;
        jobTitle: string;
      }>([
        { $match: baseMatch },
        {
          $lookup: {
            from: "jobs",
            localField: "jobId",
            foreignField: "_id",
            as: "job",
          },
        },
        {
          $unwind: {
            path: "$job",
            preserveNullAndEmptyArrays: true,
          },
        },
        {
          $group: {
            _id: "$publicJobId",
            count: { $sum: 1 },
            jobTitle: {
              $first: {
                $ifNull: ["$job.jobTitle", "$publicJobId"],
              },
            },
          },
        },
      ]),
      JobModel.find({
        employerId: employerObjectId,
        status: { $ne: "draft" },
      })
        .select("jobId jobTitle")
        .sort({ updatedAt: -1 })
        .lean(),
    ]);

    const stats: EmployerInterviewStats = {
      total: rows.length,
      today: 0,
      thisWeek: 0,
      scheduled: 0,
      completed: 0,
      rescheduled: 0,
      byMode: { online: 0, offline: 0, phone: 0 },
    };

    const todays: EmployerInterviewListItem[] = [];
    let overviewScheduled = 0;
    let overviewCompleted = 0;
    let overviewRescheduled = 0;
    let overviewCancelled = 0;
    let overviewTotal = 0;

    for (const row of rows) {
      const interview = mapInterview(row.interview);
      const date = interview.date;
      const cancelled = isInterviewCancelled(interview);

      if (!cancelled && date === todayStr) {
        stats.today += 1;
        todays.push(this.toEmployerInterviewListItem(row));
      }
      if (!cancelled && date >= weekFrom && date <= weekTo) {
        stats.thisWeek += 1;
      }
      if (!cancelled && row.status !== "interview_completed") {
        stats.scheduled += 1;
      }
      if (row.status === "interview_completed") {
        stats.completed += 1;
      }
      if (!cancelled && hasInterviewRescheduleRemark(row.statusHistory)) {
        stats.rescheduled += 1;
      }
      if (!cancelled && interview.mode === "online") {
        stats.byMode.online += 1;
      } else if (!cancelled && interview.mode === "offline") {
        stats.byMode.offline += 1;
      } else if (!cancelled && interview.mode === "phone") {
        stats.byMode.phone += 1;
      }

      if (isInterviewDateInPeriod(date, period, today)) {
        overviewTotal += 1;
        if (cancelled) {
          overviewCancelled += 1;
        } else if (row.status === "interview_completed") {
          overviewCompleted += 1;
        } else {
          overviewScheduled += 1;
        }
        if (!cancelled && hasInterviewRescheduleRemark(row.statusHistory)) {
          overviewRescheduled += 1;
        }
      }
    }

    const toPercentage = (count: number): number => {
      if (overviewTotal <= 0) {
        return 0;
      }
      return Math.round((count / overviewTotal) * 100);
    };

    const statusOverview: EmployerInterviewStatusOverview = {
      total: overviewTotal,
      period,
      statuses: [
        {
          key: "scheduled",
          label: "Scheduled",
          count: overviewScheduled,
          percentage: toPercentage(overviewScheduled),
        },
        {
          key: "completed",
          label: "Completed",
          count: overviewCompleted,
          percentage: toPercentage(overviewCompleted),
        },
        {
          key: "rescheduled",
          label: "Rescheduled",
          count: overviewRescheduled,
          percentage: toPercentage(overviewRescheduled),
        },
        {
          key: "cancelled",
          label: "Cancelled",
          count: overviewCancelled,
          percentage: toPercentage(overviewCancelled),
        },
      ],
    };

    todays.sort((a, b) => {
      const dateCmp = a.interviewDate.localeCompare(b.interviewDate);
      if (dateCmp !== 0) {
        return dateCmp;
      }
      return a.interviewTime.localeCompare(b.interviewTime);
    });

    const countByJobId = new Map(
      jobTabRows.map((row) => [
        text(row._id).toUpperCase(),
        {
          count: row.count,
          jobTitle: text(row.jobTitle) || text(row._id) || "Job",
        },
      ]),
    );

    const jobTabsMap = new Map<string, EmployerInterviewJobTab>();
    for (const job of employerJobs) {
      const publicJobId = text(job.jobId).toUpperCase();
      if (!publicJobId) {
        continue;
      }
      const counted = countByJobId.get(publicJobId);
      jobTabsMap.set(publicJobId, {
        publicJobId,
        jobTitle: text(job.jobTitle) || publicJobId,
        count: counted?.count ?? 0,
      });
    }
    for (const [publicJobId, counted] of countByJobId) {
      if (!jobTabsMap.has(publicJobId)) {
        jobTabsMap.set(publicJobId, {
          publicJobId,
          jobTitle: counted.jobTitle,
          count: counted.count,
        });
      }
    }

    const jobTabs = [...jobTabsMap.values()].sort((a, b) => {
      if (b.count !== a.count) {
        return b.count - a.count;
      }
      return a.jobTitle.localeCompare(b.jobTitle);
    });

    return {
      stats,
      todaysSchedule: todays.slice(0, 20),
      jobTabs,
      statusOverview,
    };
  }

  private async loadEmployerDetail(input: {
    employerId: string;
    applicationId: string;
    autoView?: boolean;
  }): Promise<{ application: EmployerApplicationDetail }> {
    const application = await this.findOwnedApplicationOrThrow(
      input.applicationId,
      input.employerId,
    );

    if (input.autoView && application.status === "submitted") {
      const now = new Date();
      application.status = "viewed";
      application.viewedAt = now;
      appendStatusHistory(application, {
        status: "viewed",
        at: now,
        actorType: "system",
        remark: "Employer viewed application",
      });
      await application.save();
      await this.emitForApplication(APPLICATION_EVENT_NAMES.VIEWED, application);
    }

    const job = await JobModel.findById(application.jobId)
      .select("jobTitle companyName jobId")
      .lean();

    const jobSeeker = await JobSeekerModel.findById(application.jobSeekerId)
      .select("availabilityStatus preferredJobLocation")
      .lean();

    const savedRow = await SavedCandidateModel.findOne({
      employerId: application.employerId,
      applicationId: application._id,
    })
      .select("_id priority tags notes")
      .lean();

    const savedPriority =
      savedRow?.priority === "high" ||
      savedRow?.priority === "medium" ||
      savedRow?.priority === "low"
        ? savedRow.priority
        : null;

    const savedCandidate: ApplicationSavedCandidatePrefill | null = savedRow
      ? {
          id: savedRow._id.toString(),
          priority: savedPriority,
          tags: Array.isArray(savedRow.tags)
            ? savedRow.tags
                .filter((tag): tag is string => typeof tag === "string")
                .map((tag) => tag.trim())
                .filter(Boolean)
            : [],
          notes: typeof savedRow.notes === "string" ? savedRow.notes : "",
        }
      : null;

    return {
      application: this.toEmployerDetail(
        application,
        job,
        jobSeeker?.availabilityStatus ?? null,
        jobSeeker?.preferredJobLocation ?? null,
        savedCandidate,
      ),
    };
  }

  async getForEmployer(input: {
    employerId: string;
    applicationId: string;
  }): Promise<{ application: EmployerApplicationDetail }> {
    return this.loadEmployerDetail({
      ...input,
      autoView: true,
    });
  }

  async downloadSnapshotPdfForEmployer(input: {
    employerId: string;
    applicationId: string;
  }) {
    const application = await this.findOwnedApplicationOrThrow(
      input.applicationId,
      input.employerId,
    );

    const snapshot = asSnapshot(application.resumeSnapshot);
    if (!snapshot) {
      throw new AppError(
        "Resume snapshot is not available for download",
        HTTP_STATUS.BAD_REQUEST,
      );
    }

    const fullName = text(snapshot.resumeJson.header?.fullName) || "candidate";
    const safeName = fullName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");

    return generateResumePdfFromJson(snapshot.resumeJson, {
      fileName: `${safeName || "candidate"}-application-resume.pdf`,
    });
  }

  private async emitForApplication(
    eventName: string,
    application: {
      _id: mongoose.Types.ObjectId;
      jobSeekerId: unknown;
      employerId: unknown;
      publicJobId: string;
      jobId: unknown;
      resumeSnapshot?: unknown;
      interview?: unknown;
    },
  ): Promise<void> {
    const [job, snapshot] = await Promise.all([
      JobModel.findById(application.jobId).select("jobTitle companyName").lean(),
      Promise.resolve(asSnapshot(application.resumeSnapshot)),
    ]);
    const candidate = candidateFieldsFromSnapshot(snapshot);
    const interview = mapInterview(application.interview);

    emitApplicationEvent(
      eventName,
      buildApplicationEventContext({
        applicationId: application._id.toString(),
        jobSeekerId: String(application.jobSeekerId),
        employerId: String(application.employerId),
        publicJobId: application.publicJobId,
        jobTitle: job?.jobTitle,
        companyName: job?.companyName,
        candidateName: candidate.fullName,
        interview: interviewHasContent(interview) ? interview : undefined,
        cancellationReason: interview.cancellationReason || undefined,
      }),
    );
  }

  async updateStatusForEmployer(input: {
    employerId: string;
    applicationId: string;
    status: ApplicationStatus;
  }) {
    const application = await this.findOwnedApplicationOrThrow(
      input.applicationId,
      input.employerId,
    );

    if (input.status === "interview_scheduled") {
      throw new AppError(
        "Schedule an interview to set status to Interview Scheduled. Direct status update is not allowed.",
        HTTP_STATUS.BAD_REQUEST,
      );
    }

    if (input.status === "shortlisted") {
      throw new AppError(
        "Use Shortlist Candidate to set status to Shortlisted. Direct status update is not allowed.",
        HTTP_STATUS.BAD_REQUEST,
      );
    }

    if (application.status !== input.status) {
      assertEmployerStatusChangeAllowed(
        application.status as ApplicationStatus,
        input.status,
        {
          interview: mapInterview(application.interview),
          offer: mapOffer(application.offer),
        },
      );
      const now = new Date();
      application.status = input.status;
      appendStatusHistory(application, {
        status: input.status,
        at: now,
        actorType: "employer",
      });
      await application.save();

      const eventName = eventNameForStatus(input.status);
      if (eventName) {
        await this.emitForApplication(eventName, application);
      }
    }

    return this.loadEmployerDetail({
      employerId: input.employerId,
      applicationId: input.applicationId,
      autoView: false,
    });
  }

  async shortlistForEmployer(input: {
    employerId: string;
    applicationId: string;
    priority: SavedCandidatePriority;
    tags: string[];
    notes: string;
    nextAction: ApplicationShortlistNextAction;
    alsoSave?: boolean;
    actor: {
      teamMemberId?: string | null;
      displayName: string;
    };
  }): Promise<{
    application: EmployerApplicationDetail;
    saved: boolean;
    nextAction: ApplicationShortlistNextAction;
  }> {
    void input.alsoSave;
    const application = await this.findOwnedApplicationOrThrow(
      input.applicationId,
      input.employerId,
    );

    const currentStatus = application.status as ApplicationStatus;
    const alreadyShortlisted = currentStatus === "shortlisted";

    if (!alreadyShortlisted) {
      assertEmployerStatusChangeAllowed(currentStatus, "shortlisted", {
        interview: mapInterview(application.interview),
        offer: mapOffer(application.offer),
      });
    }

    const now = new Date();
    const existingShortlist = this.mapShortlistDetails(application.shortlist);
    const shortlistedAt = existingShortlist?.shortlistedAt
      ? new Date(existingShortlist.shortlistedAt)
      : now;

    application.shortlist = {
      priority: input.priority,
      tags: input.tags,
      notes: input.notes,
      nextAction: input.nextAction,
      shortlistedAt,
      shortlistedByTeamMemberId: input.actor.teamMemberId
        ? new mongoose.Types.ObjectId(input.actor.teamMemberId)
        : null,
      shortlistedByName: input.actor.displayName,
    };

    if (!alreadyShortlisted) {
      application.status = "shortlisted";
      appendStatusHistory(application, {
        status: "shortlisted",
        at: now,
        actorType: "employer",
        remark: "Candidate shortlisted",
      });
    }

    await application.save();

    if (!alreadyShortlisted) {
      const eventName = eventNameForStatus("shortlisted");
      if (eventName) {
        await this.emitForApplication(eventName, application);
      }
    }

    // Shortlisted Candidates page lists saved rows filtered by status=shortlisted.
    // Always upsert so shortlisted applicants appear there.
    await savedCandidateService.upsertForApplication({
      employerId: input.employerId,
      applicationId: input.applicationId,
      actor: {
        teamMemberId: input.actor.teamMemberId || undefined,
        displayName: input.actor.displayName,
      },
      priority: input.priority,
      tags: input.tags,
      notes: input.notes,
    });
    const saved = true;

    const detail = await this.loadEmployerDetail({
      employerId: input.employerId,
      applicationId: input.applicationId,
      autoView: false,
    });

    return {
      application: detail.application,
      saved,
      nextAction: input.nextAction,
    };
  }

  async updateNotesForEmployer(input: {
    employerId: string;
    applicationId: string;
    notes: string;
    employerNotesVisibleToSeeker: boolean;
    updatedByName: string;
  }) {
    const application = await this.findOwnedApplicationOrThrow(
      input.applicationId,
      input.employerId,
    );

    if (isEmployerTerminalStatus(String(application.status))) {
      throw new AppError(
        "This candidate is in a terminal hiring status. Notes are read-only.",
        HTTP_STATUS.BAD_REQUEST,
      );
    }

    const nextNotes = input.notes.trim();
    const nextVisible = input.employerNotesVisibleToSeeker === true;
    const previousNotes = text(application.employerNotes);
    const previousVisible = application.employerNotesVisibleToSeeker === true;

    if (nextNotes === previousNotes && nextVisible === previousVisible) {
      return this.loadEmployerDetail({
        employerId: input.employerId,
        applicationId: input.applicationId,
        autoView: false,
      });
    }

    const now = new Date();
    const hasNotes = nextNotes.length > 0;

    application.employerNotes = nextNotes;
    application.employerNotesVisibleToSeeker = hasNotes ? nextVisible : false;

    if (!hasNotes) {
      application.employerNotesCreatedAt = null;
      application.employerNotesUpdatedAt = null;
      application.employerNotesUpdatedByName = "";
    } else {
      if (!application.employerNotesCreatedAt) {
        application.employerNotesCreatedAt = now;
      }
      application.employerNotesUpdatedAt = now;
      application.employerNotesUpdatedByName = input.updatedByName.trim();
    }

    await application.save();

    return this.loadEmployerDetail({
      employerId: input.employerId,
      applicationId: input.applicationId,
      autoView: false,
    });
  }

  async updateInterviewForEmployer(input: {
    employerId: string;
    applicationId: string;
    interview: ApplicationInterview;
    updatedByName: string;
  }): Promise<{
    application: EmployerApplicationDetail;
    action: "scheduled" | "updated";
  }> {
    const application = await this.findOwnedApplicationOrThrow(
      input.applicationId,
      input.employerId,
    );

    const currentStatus = application.status as ApplicationStatus;

    if (isEmployerTerminalStatus(String(currentStatus))) {
      throw new AppError(
        "This application is in a terminal hiring status.",
        HTTP_STATUS.BAD_REQUEST,
      );
    }

    const previousInterview = mapInterview(application.interview);
    if (isInterviewCancelled(previousInterview)) {
      throw new AppError(
        "This interview has been cancelled and cannot be edited. Schedule a new interview from a later workflow if needed.",
        HTTP_STATUS.BAD_REQUEST,
      );
    }

    const nextInterview: ApplicationInterview = {
      ...normalizeInterviewForMode(mapInterview(input.interview)),
      cancelledAt: null,
      cancellationReason: "",
      cancelledByName: "",
    };

    // First schedule = no prior active interview date. Reschedule/update keeps hiring status.
    const isFirstSchedule = !text(previousInterview.date);
    const action: "scheduled" | "updated" = isFirstSchedule
      ? "scheduled"
      : "updated";

    if (interviewsEqual(previousInterview, nextInterview) && !isFirstSchedule) {
      const detail = await this.loadEmployerDetail({
        employerId: input.employerId,
        applicationId: input.applicationId,
        autoView: false,
      });
      return {
        application: detail.application,
        action: "updated",
      };
    }

    const now = new Date();
    const actorName = text(input.updatedByName) || "Employer";

    application.interview = toInterviewDocument(nextInterview);

    // Scheduling an interview creates/updates the interview activity only.
    // Hiring status stays unchanged (e.g. Shortlisted) until the employer
    // explicitly advances the pipeline.
    appendStatusHistory(application, {
      status: currentStatus,
      at: now,
      actorType: "employer",
      remark: isFirstSchedule
        ? `Interview Scheduled by ${actorName}`
        : `Interview Rescheduled by ${actorName}`,
    });

    await application.save();

    if (action === "scheduled") {
      await this.emitForApplication(
        APPLICATION_EVENT_NAMES.INTERVIEW_SCHEDULED,
        application,
      );
    } else {
      await this.emitForApplication(
        APPLICATION_EVENT_NAMES.INTERVIEW_UPDATED,
        application,
      );
    }

    const detail = await this.loadEmployerDetail({
      employerId: input.employerId,
      applicationId: input.applicationId,
      autoView: false,
    });

    return {
      application: detail.application,
      action,
    };
  }

  async cancelInterviewForEmployer(input: {
    employerId: string;
    applicationId: string;
    reason: string;
    cancelledByName: string;
  }): Promise<EmployerApplicationDetail> {
    const application = await this.findOwnedApplicationOrThrow(
      input.applicationId,
      input.employerId,
    );

    const currentStatus = application.status as ApplicationStatus;
    if (isEmployerTerminalStatus(String(currentStatus))) {
      throw new AppError(
        "This application is in a terminal hiring status.",
        HTTP_STATUS.BAD_REQUEST,
      );
    }

    const interview = mapInterview(application.interview);
    if (!interview.date) {
      throw new AppError(
        "No interview is scheduled for this candidate.",
        HTTP_STATUS.BAD_REQUEST,
      );
    }
    if (isInterviewCancelled(interview)) {
      throw new AppError(
        "This interview is already cancelled.",
        HTTP_STATUS.BAD_REQUEST,
      );
    }

    const reason = text(input.reason);
    if (!reason) {
      throw new AppError(
        "Cancellation reason is required.",
        HTTP_STATUS.BAD_REQUEST,
      );
    }

    const now = new Date();
    const actorName = text(input.cancelledByName) || "Employer";

    application.interview = toInterviewDocument({
      ...interview,
      cancelledAt: now.toISOString(),
      cancellationReason: reason,
      cancelledByName: actorName,
    });

    appendStatusHistory(application, {
      status: currentStatus,
      at: now,
      actorType: "employer",
      remark: `Interview Cancelled by ${actorName}. Reason: ${reason}`,
    });

    await application.save();

    await this.emitForApplication(
      APPLICATION_EVENT_NAMES.INTERVIEW_CANCELLED,
      application,
    );

    const detail = await this.loadEmployerDetail({
      employerId: input.employerId,
      applicationId: input.applicationId,
      autoView: false,
    });
    return detail.application;
  }

  async updateHiringForEmployer(input: {
    employerId: string;
    applicationId: string;
    status?: ApplicationStatus;
    interview?: Partial<ApplicationInterview>;
    offer?: Partial<ApplicationOffer>;
    rejectReason?: string;
    employerNotesVisibleToSeeker?: boolean;
  }) {
    const application = await this.findOwnedApplicationOrThrow(
      input.applicationId,
      input.employerId,
    );

    const now = new Date();
    let statusChanged = false;
    let interviewUpdated = false;

    if (input.interview) {
      const next = normalizeInterviewForMode({
        ...mapInterview(application.interview),
        ...Object.fromEntries(
          Object.entries(input.interview).map(([key, value]) => [
            key,
            typeof value === "string" ? value.trim() : value,
          ]),
        ),
      } as ApplicationInterview);
      application.interview = toInterviewDocument(next);
      interviewUpdated = true;
    }

    if (input.offer) {
      application.offer = {
        ...mapOffer(application.offer),
        ...Object.fromEntries(
          Object.entries(input.offer).map(([key, value]) => [
            key,
            typeof value === "string" ? value.trim() : value,
          ]),
        ),
      } as ApplicationOffer;
    }

    if (typeof input.rejectReason === "string") {
      application.rejectReason = input.rejectReason.trim();
    }

    if (typeof input.employerNotesVisibleToSeeker === "boolean") {
      application.employerNotesVisibleToSeeker =
        input.employerNotesVisibleToSeeker;
    }

    if (input.status && application.status !== input.status) {
      assertEmployerStatusChangeAllowed(
        application.status as ApplicationStatus,
        input.status,
        {
          interview: mapInterview(application.interview),
          offer: mapOffer(application.offer),
        },
      );
      application.status = input.status;
      statusChanged = true;
      appendStatusHistory(application, {
        status: input.status,
        at: now,
        actorType: "employer",
      });
    }

    await application.save();

    if (statusChanged) {
      const eventName = eventNameForStatus(input.status!);
      if (eventName) {
        await this.emitForApplication(eventName, application);
      }
    } else if (interviewUpdated && application.status === "interview_scheduled") {
      await this.emitForApplication(
        APPLICATION_EVENT_NAMES.INTERVIEW_UPDATED,
        application,
      );
    }

    return this.loadEmployerDetail({
      employerId: input.employerId,
      applicationId: input.applicationId,
      autoView: false,
    });
  }

  async listForSeeker(input: {
    jobSeekerId: string;
    status?: ApplicationStatus;
    statuses?: ApplicationStatus[];
    search?: string;
    sort?:
      | "newest"
      | "oldest"
      | "updated"
      | "salary_high"
      | "salary_low"
      | "company";
    location?: string;
    company?: string;
    jobType?: string;
    workMode?: string;
    shift?: string;
    minSalary?: number;
    appliedFrom?: string;
    appliedTo?: string;
    page?: number;
    limit?: number;
  }) {
    if (!mongoose.Types.ObjectId.isValid(input.jobSeekerId)) {
      throw new AppError("Unauthorized", HTTP_STATUS.UNAUTHORIZED);
    }

    const requestedPage = input.page ?? 1;
    const limit = Math.min(input.limit ?? 20, 100);
    const search = text(input.search).toLowerCase();
    const location = text(input.location).toLowerCase();
    const company = text(input.company).toLowerCase();
    const jobType = text(input.jobType).toLowerCase();
    const workMode = text(input.workMode).toLowerCase();
    const shift = text(input.shift).toLowerCase();
    const minSalary =
      typeof input.minSalary === "number" && Number.isFinite(input.minSalary)
        ? input.minSalary
        : null;

    const appMatch: Record<string, unknown> = {
      jobSeekerId: new mongoose.Types.ObjectId(input.jobSeekerId),
    };

    if (input.statuses && input.statuses.length > 0) {
      appMatch.status = { $in: input.statuses };
    } else if (input.status) {
      appMatch.status = input.status;
    }

    const appliedFrom = text(input.appliedFrom);
    const appliedTo = text(input.appliedTo);
    if (appliedFrom || appliedTo) {
      const appliedAt: Record<string, Date> = {};
      if (appliedFrom) {
        const from = new Date(`${appliedFrom}T00:00:00`);
        if (!Number.isNaN(from.getTime())) {
          appliedAt.$gte = from;
        }
      }
      if (appliedTo) {
        const to = new Date(`${appliedTo}T23:59:59.999`);
        if (!Number.isNaN(to.getTime())) {
          appliedAt.$lte = to;
        }
      }
      if (Object.keys(appliedAt).length > 0) {
        appMatch.appliedAt = appliedAt;
      }
    }

    const escapeRegex = (value: string) =>
      value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

    const postLookupMatch: Record<string, unknown> = {};
    if (search) {
      postLookupMatch.$or = [
        { "job.jobTitle": { $regex: escapeRegex(search), $options: "i" } },
        { "job.companyName": { $regex: escapeRegex(search), $options: "i" } },
        { publicJobId: { $regex: escapeRegex(search), $options: "i" } },
        { locationLabel: { $regex: escapeRegex(search), $options: "i" } },
      ];
    }
    if (location) {
      postLookupMatch.locationLabel = {
        $regex: escapeRegex(location),
        $options: "i",
      };
    }
    if (company) {
      postLookupMatch["job.companyName"] = {
        $regex: escapeRegex(company),
        $options: "i",
      };
    }

    const exprParts: Record<string, unknown>[] = [];
    if (jobType) {
      exprParts.push({
        $eq: [{ $toLower: { $ifNull: ["$job.jobType", ""] } }, jobType],
      });
    }
    if (workMode) {
      exprParts.push({
        $eq: [{ $toLower: { $ifNull: ["$job.workMode", ""] } }, workMode],
      });
    }
    if (exprParts.length === 1) {
      postLookupMatch.$expr = exprParts[0];
    } else if (exprParts.length > 1) {
      postLookupMatch.$expr = { $and: exprParts };
    }

    if (shift) {
      postLookupMatch.shiftLabel = {
        $regex: `^${escapeRegex(shift)}$`,
        $options: "i",
      };
    }
    if (minSalary != null && minSalary > 0) {
      postLookupMatch.salarySortValue = { $gte: minSalary };
    }

    const enrichStages: mongoose.PipelineStage[] = [
      { $match: appMatch },
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
        $addFields: {
          locationLabel: {
            $trim: {
              input: {
                $concat: [
                  {
                    $ifNull: ["$job.cityName", { $ifNull: ["$job.city", ""] }],
                  },
                  {
                    $cond: [
                      {
                        $and: [
                          {
                            $gt: [
                              {
                                $strLenCP: {
                                  $ifNull: [
                                    "$job.cityName",
                                    { $ifNull: ["$job.city", ""] },
                                  ],
                                },
                              },
                              0,
                            ],
                          },
                          {
                            $gt: [
                              {
                                $strLenCP: {
                                  $ifNull: [
                                    "$job.stateName",
                                    { $ifNull: ["$job.state", ""] },
                                  ],
                                },
                              },
                              0,
                            ],
                          },
                        ],
                      },
                      ", ",
                      "",
                    ],
                  },
                  {
                    $ifNull: [
                      "$job.stateName",
                      { $ifNull: ["$job.state", ""] },
                    ],
                  },
                ],
              },
            },
          },
          shiftLabel: {
            $let: {
              vars: {
                start: { $ifNull: ["$job.partTimeStartTime", ""] },
                end: { $ifNull: ["$job.partTimeEndTime", ""] },
                schedule: { $ifNull: ["$job.partTimeSchedule", ""] },
              },
              in: {
                $cond: [
                  {
                    $and: [
                      { $gt: [{ $strLenCP: "$$start" }, 0] },
                      { $gt: [{ $strLenCP: "$$end" }, 0] },
                    ],
                  },
                  { $concat: ["$$start", " – ", "$$end"] },
                  {
                    $cond: [
                      { $eq: ["$$schedule", "fixed-timings"] },
                      "Fixed timings",
                      {
                        $cond: [
                          { $eq: ["$$schedule", "flexible-hours"] },
                          "Flexible hours",
                          "$$schedule",
                        ],
                      },
                    ],
                  },
                ],
              },
            },
          },
          salarySortValue: {
            $switch: {
              branches: [
                {
                  case: {
                    $and: [
                      { $eq: ["$job.salaryType", "fixed"] },
                      { $ne: ["$job.fixedSalary", null] },
                    ],
                  },
                  then: "$job.fixedSalary",
                },
                {
                  case: {
                    $and: [
                      { $ne: ["$job.minimumSalary", null] },
                      { $ne: ["$job.maximumSalary", null] },
                    ],
                  },
                  then: {
                    $divide: [
                      { $add: ["$job.minimumSalary", "$job.maximumSalary"] },
                      2,
                    ],
                  },
                },
                {
                  case: { $ne: ["$job.minimumSalary", null] },
                  then: "$job.minimumSalary",
                },
                {
                  case: { $ne: ["$job.maximumSalary", null] },
                  then: "$job.maximumSalary",
                },
                {
                  case: { $ne: ["$job.fixedSalary", null] },
                  then: "$job.fixedSalary",
                },
              ],
              default: null,
            },
          },
          lastStatusUpdatedAt: {
            $ifNull: [
              { $arrayElemAt: ["$statusHistory.at", -1] },
              "$appliedAt",
            ],
          },
        },
      },
    ];

    if (Object.keys(postLookupMatch).length > 0) {
      enrichStages.push({ $match: postLookupMatch } as mongoose.PipelineStage);
    }

    let sortStage: Record<string, 1 | -1>;
    switch (input.sort) {
      case "oldest":
        sortStage = { appliedAt: 1, _id: 1 };
        break;
      case "updated":
        sortStage = { lastStatusUpdatedAt: -1, appliedAt: -1, _id: -1 };
        break;
      case "salary_high":
        sortStage = { salarySortValue: -1, appliedAt: -1, _id: -1 };
        break;
      case "salary_low":
        sortStage = { salarySortValue: 1, appliedAt: -1, _id: -1 };
        break;
      case "company":
        sortStage = { "job.companyName": 1, appliedAt: -1, _id: -1 };
        break;
      case "newest":
      default:
        sortStage = { appliedAt: -1, _id: -1 };
        break;
    }

    const countRows = await ApplicationModel.aggregate<{ total: number }>([
      ...enrichStages,
      { $count: "total" },
    ]);
    const total = countRows[0]?.total ?? 0;
    const pagination = buildListPagination(requestedPage, limit, total);
    const skip = (pagination.page - 1) * pagination.limit;

    type AggApp = {
      _id: mongoose.Types.ObjectId;
      publicJobId: string;
      jobId: unknown;
      employerId: unknown;
      status: string;
      resumeVersion: number;
      appliedAt: Date;
      statusHistory?: unknown;
      interview?: unknown;
      job?: Parameters<typeof mapSeekerListItem>[0]["job"];
      employer?: { companyLogo?: { url?: string } | null };
    };

    const pageItems =
      total === 0
        ? []
        : await ApplicationModel.aggregate<AggApp>([
            ...enrichStages,
            { $sort: sortStage },
            { $skip: skip },
            { $limit: pagination.limit },
          ]);

    const items: SeekerApplicationListItem[] = pageItems.map((app) =>
      mapSeekerListItem({
        app,
        job: app.job,
        employer: app.employer,
      }),
    );

    return {
      applications: items,
      pagination,
    };
  }

  async getStatsForSeeker(input: {
    jobSeekerId: string;
  }): Promise<{ stats: SeekerApplicationStats }> {
    if (!mongoose.Types.ObjectId.isValid(input.jobSeekerId)) {
      throw new AppError("Unauthorized", HTTP_STATUS.UNAUTHORIZED);
    }

    const rows = await ApplicationModel.aggregate<{
      _id: ApplicationStatus;
      count: number;
    }>([
      { $match: { jobSeekerId: new mongoose.Types.ObjectId(input.jobSeekerId) } },
      { $group: { _id: "$status", count: { $sum: 1 } } },
    ]);

    const byStatus = new Map(rows.map((row) => [row._id, row.count]));

    const applied =
      (byStatus.get("submitted") ?? 0) + (byStatus.get("viewed") ?? 0);
    const interview =
      (byStatus.get("interview_scheduled") ?? 0) +
      (byStatus.get("interview_completed") ?? 0);
    const offer = byStatus.get("offer_sent") ?? 0;

    return {
      stats: {
        applied,
        underReview: byStatus.get("under_review") ?? 0,
        shortlisted: byStatus.get("shortlisted") ?? 0,
        interview,
        offer,
        selected: byStatus.get("selected") ?? 0,
        rejected: byStatus.get("rejected") ?? 0,
        joined: byStatus.get("joined") ?? 0,
        withdrawn: byStatus.get("withdrawn") ?? 0,
      },
    };
  }

  async getForSeeker(input: {
    jobSeekerId: string;
    applicationId: string;
  }): Promise<{ application: SeekerApplicationDetail }> {
    const application = await this.findSeekerApplicationOrThrow(
      input.applicationId,
      input.jobSeekerId,
    );

    const snapshot = asSnapshot(application.resumeSnapshot);
    if (!snapshot) {
      throw new AppError(
        "Resume snapshot is not available for this application",
        HTTP_STATUS.BAD_REQUEST,
      );
    }

    const [job, employer] = await Promise.all([
      JobModel.findById(application.jobId)
        .select(
          "jobTitle companyName jobId city cityName state stateName salaryType salaryPeriod fixedSalary minimumSalary maximumSalary workMode jobType",
        )
        .lean(),
      EmployerModel.findById(application.employerId)
        .select("companyLogo")
        .lean(),
    ]);

    const interview = mapInterview(application.interview);
    const offer = mapOffer(application.offer);
    const status = application.status as ApplicationStatus;

    return {
      application: {
        id: application._id.toString(),
        publicJobId: application.publicJobId,
        jobTitle: job?.jobTitle?.trim() || "Job",
        companyName: job?.companyName?.trim() || "",
        companyLogoUrl: text(employer?.companyLogo?.url),
        location: job ? formatJobLocation(job) : "",
        salaryLabel: job ? formatSalaryLabel(job) : "Not disclosed",
        workMode: text(job?.workMode),
        jobType: text(job?.jobType),
        status,
        resumeVersion: application.resumeVersion,
        resumeSnapshot: snapshot,
        statusHistory: mapStatusHistory(application.statusHistory),
        interview: interviewHasContent(interview) ? interview : null,
        offer: offerHasContent(offer) ? offer : null,
        rejectReason: text(application.rejectReason),
        employerNotes: application.employerNotesVisibleToSeeker
          ? text(application.employerNotes)
          : null,
        appliedAt: application.appliedAt.toISOString(),
        canWithdraw: canWithdraw(status),
        createdAt: application.createdAt
          ? application.createdAt.toISOString()
          : null,
        updatedAt: application.updatedAt
          ? application.updatedAt.toISOString()
          : null,
      },
    };
  }

  async withdrawForSeeker(input: {
    jobSeekerId: string;
    applicationId: string;
  }) {
    const application = await this.findSeekerApplicationOrThrow(
      input.applicationId,
      input.jobSeekerId,
    );

    const status = application.status as ApplicationStatus;
    if (!canWithdraw(status)) {
      throw new AppError(
        "This application can no longer be withdrawn",
        HTTP_STATUS.BAD_REQUEST,
      );
    }

    const now = new Date();
    application.status = "withdrawn";
    application.withdrawnAt = now;
    appendStatusHistory(application, {
      status: "withdrawn",
      at: now,
      actorType: "job_seeker",
      remark: "Application withdrawn by candidate",
    });
    await application.save();
    await this.emitForApplication(
      APPLICATION_EVENT_NAMES.WITHDRAWN,
      application,
    );

    return this.getForSeeker({
      jobSeekerId: input.jobSeekerId,
      applicationId: input.applicationId,
    });
  }
}

export const applicationService = new ApplicationService();
