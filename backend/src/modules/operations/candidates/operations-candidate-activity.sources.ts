import mongoose from "mongoose";
import { ApplicationModel } from "../../applications/application.model.js";
import { EmployerModel } from "../../employers/employer.model.js";
import { JobSeekerLoginEventModel } from "../../job-seekers/job-seeker-login-event.model.js";
import { JobModel } from "../../jobs/job.model.js";
import { ResumeModel } from "../../resumes/resume.model.js";
import { SavedJobModel } from "../../saved-jobs/saved-job.model.js";
import {
  applicationActivitySource,
  asPipeline,
  timestampedActivitySource,
  type RunActivityPipeline,
} from "../activity/activity-sources.js";
import { OperationsAuditLogModel } from "../rbac/operations-audit-log.model.js";
import {
  SKIPPED_CANDIDATE_AUDIT_ACTIONS,
  applicationRowToEntry,
  auditRowToEntry,
  buildApplicationStatsPipeline,
  buildCandidateActivitySummary,
  buildCandidateJourney,
  buildResumeStatsPipeline,
  buildSeekerActivityEntries,
  countCandidateActivity,
  encodeCandidateActivityCursor,
  inMemoryActivitySource,
  loginRowToEntry,
  paginateCandidateActivity,
  parseApplicationStats,
  parseResumeStats,
  resumeRowToEntry,
  savedJobRowToEntry,
  type AuditActivityRow,
  type CandidateActivityCategory,
  type CandidateActivityCursor,
  type CandidateActivityEntry,
  type CandidateActivityRefs,
  type CandidateActivitySeekerInput,
  type CandidateActivitySource,
  type LoginActivityRow,
  type ResumeActivityRow,
  type SavedJobActivityRow,
  type TimestampedActivitySourceConfig,
} from "./operations-candidate-activity.js";
import type { OperationsCandidateActivityResult } from "./operations-candidates.types.js";

function timestampedSource<Row>(options: {
  name: string;
  category: CandidateActivityCategory;
  config: TimestampedActivitySourceConfig;
  run: RunActivityPipeline;
  toEntry: (row: Row) => CandidateActivityEntry;
}): CandidateActivitySource {
  return timestampedActivitySource(options);
}

function applicationsSource(
  jobSeekerId: mongoose.Types.ObjectId,
): CandidateActivitySource {
  return applicationActivitySource({
    match: { jobSeekerId },
    toEntry: applicationRowToEntry,
  });
}

function buildSources(input: {
  jobSeekerId: mongoose.Types.ObjectId;
  seeker: CandidateActivitySeekerInput;
  includeApplications: boolean;
}): CandidateActivitySource[] {
  const { jobSeekerId } = input;
  const sources: CandidateActivitySource[] = [
    inMemoryActivitySource("seeker", buildSeekerActivityEntries(input.seeker)),
    timestampedSource<LoginActivityRow>({
      name: "logins",
      category: "account",
      config: {
        match: { jobSeekerId },
        atExpression: "$loggedInAt",
        indexedAtField: "loggedInAt",
        idPrefix: "login:",
        project: { method: 1, client: 1 },
      },
      run: (pipeline) => JobSeekerLoginEventModel.aggregate(pipeline).exec(),
      toEntry: loginRowToEntry,
    }),
    timestampedSource<ResumeActivityRow>({
      name: "resumes",
      category: "resume",
      config: {
        match: { jobSeekerId, status: { $ne: "NOT_GENERATED" } },
        atExpression: { $ifNull: ["$lastGeneratedAt", "$createdAt"] },
        idPrefix: "resume:",
        project: { versionNumber: 1, status: 1, failureReason: 1 },
      },
      run: (pipeline) => ResumeModel.aggregate(pipeline).exec(),
      toEntry: resumeRowToEntry,
    }),
    timestampedSource<SavedJobActivityRow>({
      name: "saved_jobs",
      category: "saved_job",
      config: {
        match: { jobSeekerId },
        atExpression: "$savedAt",
        indexedAtField: "savedAt",
        idPrefix: "saved_job:",
        project: { jobId: 1, publicJobId: 1 },
      },
      run: (pipeline) => SavedJobModel.aggregate(pipeline).exec(),
      toEntry: savedJobRowToEntry,
    }),
    timestampedSource<AuditActivityRow>({
      name: "audits",
      category: "operations",
      config: {
        match: {
          targetType: "candidate",
          targetId: String(jobSeekerId),
          action: { $nin: [...SKIPPED_CANDIDATE_AUDIT_ACTIONS] },
        },
        atExpression: "$createdAt",
        indexedAtField: "createdAt",
        idPrefix: "audit:",
        project: { action: 1, actorName: 1, reason: 1 },
      },
      run: (pipeline) => OperationsAuditLogModel.aggregate(pipeline).exec(),
      toEntry: auditRowToEntry,
    }),
  ];
  if (input.includeApplications) {
    sources.push(applicationsSource(jobSeekerId));
  }
  return sources;
}

function text(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function validObjectIds(ids: Array<string | null>): mongoose.Types.ObjectId[] {
  return [...new Set(ids.filter((id): id is string => Boolean(id)))]
    .filter((id) => mongoose.Types.ObjectId.isValid(id))
    .map((id) => new mongoose.Types.ObjectId(id));
}

/** Job and employer names for the rows on one page only. */
async function loadActivityRefs(
  entries: CandidateActivityEntry[],
): Promise<CandidateActivityRefs> {
  const jobIds = validObjectIds(entries.map((entry) => entry.jobId));
  const employerIds = validObjectIds(entries.map((entry) => entry.employerId));
  const [jobs, employers] = await Promise.all([
    jobIds.length > 0
      ? JobModel.find({ _id: { $in: jobIds } })
          .select("jobTitle companyName")
          .lean()
      : Promise.resolve([]),
    employerIds.length > 0
      ? EmployerModel.find({ _id: { $in: employerIds } })
          .select("companyName establishmentName")
          .lean()
      : Promise.resolve([]),
  ]);
  const jobById = new Map(jobs.map((job) => [String(job._id), job]));
  const employerNameById = new Map(
    employers.map((employer) => [
      String(employer._id),
      text(employer.companyName) || text(employer.establishmentName),
    ]),
  );
  return {
    jobTitle: (jobId) => (jobId ? text(jobById.get(jobId)?.jobTitle) : ""),
    jobCompany: (jobId) => (jobId ? text(jobById.get(jobId)?.companyName) : ""),
    employerName: (employerId) =>
      employerId ? (employerNameById.get(employerId) ?? "") : "",
  };
}

export type LoadCandidateActivityInput = {
  jobSeekerId: mongoose.Types.ObjectId;
  seeker: Omit<CandidateActivitySeekerInput, "lastLoginRecorded">;
  query: {
    limit: number;
    category: "all" | CandidateActivityCategory;
    cursor: CandidateActivityCursor | null;
  };
  includeApplications: boolean;
};

export async function loadCandidateActivity(
  input: LoadCandidateActivityInput,
): Promise<OperationsCandidateActivityResult> {
  const { jobSeekerId, query, includeApplications } = input;
  const lastLoginAt = input.seeker.lastLoginAt ?? null;
  const lastLoginRecorded = lastLoginAt
    ? Boolean(
        await JobSeekerLoginEventModel.exists({
          jobSeekerId,
          loggedInAt: lastLoginAt,
        }),
      )
    : false;
  const seeker: CandidateActivitySeekerInput = {
    ...input.seeker,
    lastLoginRecorded,
  };

  // Without application permission the applications source is never built,
  // so its categories page and count as empty.
  const sources = buildSources({ jobSeekerId, seeker, includeApplications });
  const category = query.category === "all" ? null : query.category;

  const [page, categoryCounts, applicationStats, resumeStats] = await Promise.all([
    paginateCandidateActivity(sources, {
      cursor: query.cursor,
      limit: query.limit,
      category,
    }),
    countCandidateActivity(sources),
    includeApplications
      ? ApplicationModel.aggregate(
          asPipeline(buildApplicationStatsPipeline(jobSeekerId)),
        )
          .exec()
          .then(parseApplicationStats)
      : Promise.resolve(null),
    ResumeModel.aggregate(asPipeline(buildResumeStatsPipeline(jobSeekerId)))
      .exec()
      .then(parseResumeStats),
  ]);

  const lastActivityAt =
    !query.cursor && !category
      ? (page.entries[0]?.at ?? null)
      : ((
          await paginateCandidateActivity(sources, {
            cursor: null,
            limit: 1,
            category: null,
          })
        ).entries[0]?.at ?? null);

  const refs = await loadActivityRefs(page.entries);

  return {
    journey: buildCandidateJourney({
      seeker,
      resumes: resumeStats,
      applications: applicationStats,
    }),
    summary: buildCandidateActivitySummary({
      applications: applicationStats,
      savedJobs: categoryCounts.saved_job,
      lastActivityAt,
    }),
    applicationsRestricted: !includeApplications,
    categoryCounts,
    events: page.entries.map((entry) => entry.render(refs)),
    pageInfo: {
      limit: query.limit,
      total: categoryCounts[query.category] ?? 0,
      hasMore: page.hasMore,
      nextCursor: page.nextCursor
        ? encodeCandidateActivityCursor(page.nextCursor)
        : null,
    },
  };
}
