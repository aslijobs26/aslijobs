import mongoose from "mongoose";
import { ApplicationModel } from "../../applications/application.model.js";
import { EmployerDocumentModel } from "../../employers/employer-document.model.js";
import { EmployerLoginEventModel } from "../../employers/employer-login-event.model.js";
import { JobSeekerModel } from "../../job-seekers/job-seeker.model.js";
import { JobModel } from "../../jobs/job.model.js";
import { SavedCandidateModel } from "../../saved-candidates/saved-candidate.model.js";
import { TeamActivityModel } from "../../team/team-activity.model.js";
import {
  applicationActivitySource,
  asPipeline,
  readActivityCount,
  timestampedActivitySource,
  type RunActivityPipeline,
} from "../activity/activity-sources.js";
import {
  buildApplicationActivityStatsPipeline,
  encodeActivityCursor,
  parseApplicationActivityStats,
  type ActivityCursor,
  type TimestampedActivitySourceConfig,
} from "../activity/activity-timeline.js";
import { formatCandidateDisplayId } from "../candidates/operations-candidates.service.js";
import { OperationsAuditLogModel } from "../rbac/operations-audit-log.model.js";
import {
  EMPLOYER_VERIFICATION_AUDIT_ACTIONS,
  SKIPPED_EMPLOYER_AUDIT_ACTIONS,
  buildEmployerActivitySummary,
  buildEmployerJobStatsPipeline,
  buildEmployerJourney,
  buildEmployerProfileEntries,
  buildJobFieldEventCountPipeline,
  buildJobFieldEventPagePipeline,
  countEmployerActivity,
  employerActivitySourceFromEntries,
  employerApplicationRowToEntry,
  employerAuditRowToEntry,
  employerDocumentRowToEntry,
  employerLoginRowToEntry,
  emptyEmployerAuditTimes,
  jobAuditRowToEntry,
  jobFieldRowToEntry,
  paginateEmployerActivity,
  parseEmployerJobStats,
  savedCandidateRowToEntry,
  teamActivityRowToEntry,
  type EmployerActivityCategory,
  type EmployerActivityEntry,
  type EmployerActivityProfileInput,
  type EmployerActivityRefs,
  type EmployerActivitySource,
  type EmployerAuditActivityRow,
  type EmployerAuditTimes,
  type EmployerDocumentActivityRow,
  type EmployerLoginActivityRow,
  type JobAuditActivityRow,
  type JobFieldActivityRow,
  type SavedCandidateActivityRow,
  type TeamActivityRow,
} from "./operations-employer-activity.js";
import type { OperationsEmployerActivityResult } from "./operations-employers.types.js";

function timestampedSource<Row>(options: {
  name: string;
  category: EmployerActivityCategory;
  config: TimestampedActivitySourceConfig;
  run: RunActivityPipeline;
  toEntry: (row: Row) => EmployerActivityEntry;
}): EmployerActivitySource {
  return timestampedActivitySource(options);
}

function jobFieldSource(match: Record<string, unknown>): EmployerActivitySource {
  return {
    name: "job_fields",
    categories: ["job"],
    async fetch({ cursor, limit, category }) {
      if (category && category !== "job") {
        return [];
      }
      const rows = await JobModel.aggregate(
        asPipeline(buildJobFieldEventPagePipeline({ match, cursor, limit })),
      ).exec();
      return (rows as JobFieldActivityRow[]).map(jobFieldRowToEntry);
    },
    async count() {
      const rows = await JobModel.aggregate(
        asPipeline(buildJobFieldEventCountPipeline(match)),
      ).exec();
      return { job: readActivityCount(rows) };
    },
  };
}

function buildSources(input: {
  employerId: mongoose.Types.ObjectId;
  employer: EmployerActivityProfileInput;
  publicJobIds: string[];
  access: EmployerActivityAccess;
}): EmployerActivitySource[] {
  const { employerId } = input;
  const employerKey = String(employerId);
  const auditBase = { targetType: "employer", targetId: employerKey };
  const auditProject = { action: 1, actorName: 1, actorUserId: 1, reason: 1 } as const;

  const sources: EmployerActivitySource[] = [
    employerActivitySourceFromEntries(
      "employer",
      buildEmployerProfileEntries(input.employer),
    ),
    timestampedSource<EmployerLoginActivityRow>({
      name: "logins",
      category: "account",
      config: {
        match: { employerId },
        atExpression: "$loggedInAt",
        indexedAtField: "loggedInAt",
        idPrefix: "login:",
        project: { method: 1, client: 1 },
      },
      run: (pipeline) => EmployerLoginEventModel.aggregate(pipeline).exec(),
      toEntry: employerLoginRowToEntry,
    }),
    timestampedSource<EmployerAuditActivityRow>({
      name: "verification_audits",
      category: "verification",
      config: {
        match: { ...auditBase, action: { $in: [...EMPLOYER_VERIFICATION_AUDIT_ACTIONS] } },
        atExpression: "$createdAt",
        indexedAtField: "createdAt",
        idPrefix: "audit:",
        project: auditProject,
      },
      run: (pipeline) => OperationsAuditLogModel.aggregate(pipeline).exec(),
      toEntry: employerAuditRowToEntry("verification"),
    }),
    timestampedSource<EmployerAuditActivityRow>({
      name: "operations_audits",
      category: "operations",
      config: {
        match: {
          ...auditBase,
          action: {
            $nin: [...EMPLOYER_VERIFICATION_AUDIT_ACTIONS, ...SKIPPED_EMPLOYER_AUDIT_ACTIONS],
          },
        },
        atExpression: "$createdAt",
        indexedAtField: "createdAt",
        idPrefix: "audit:",
        project: auditProject,
      },
      run: (pipeline) => OperationsAuditLogModel.aggregate(pipeline).exec(),
      toEntry: employerAuditRowToEntry("operations"),
    }),
    timestampedSource<TeamActivityRow>({
      name: "team",
      category: "team",
      config: {
        match: { employerId },
        atExpression: "$createdAt",
        indexedAtField: "createdAt",
        idPrefix: "team:",
        project: { type: 1, message: 1 },
      },
      run: (pipeline) => TeamActivityModel.aggregate(pipeline).exec(),
      toEntry: teamActivityRowToEntry,
    }),
  ];

  if (input.access.includeDocuments) {
    sources.push(
      timestampedSource<EmployerDocumentActivityRow>({
        name: "documents",
        category: "verification",
        config: {
          match: { employerId },
          atExpression: "$uploadedAt",
          indexedAtField: "uploadedAt",
          idPrefix: "document:",
          project: { documentType: 1, verificationStatus: 1 },
        },
        run: (pipeline) => EmployerDocumentModel.aggregate(pipeline).exec(),
        toEntry: employerDocumentRowToEntry,
      }),
    );
  }

  if (input.access.includeJobs) {
    sources.push(jobFieldSource({ employerId }));
  }

  if (input.access.includeJobs && input.publicJobIds.length > 0) {
    sources.push(
      timestampedSource<JobAuditActivityRow>({
        name: "job_audits",
        category: "job",
        config: {
          match: { targetType: "job", targetId: { $in: input.publicJobIds } },
          atExpression: "$createdAt",
          indexedAtField: "createdAt",
          idPrefix: "job_audit:",
          project: { ...auditProject, targetId: 1, targetLabel: 1 },
        },
        run: (pipeline) => OperationsAuditLogModel.aggregate(pipeline).exec(),
        toEntry: jobAuditRowToEntry,
      }),
    );
  }

  if (input.access.includeCandidates) {
    sources.push(
      applicationActivitySource({
        match: { employerId },
        toEntry: employerApplicationRowToEntry,
      }),
      timestampedSource<SavedCandidateActivityRow>({
        name: "saved_candidates",
        category: "candidate",
        config: {
          match: { employerId },
          atExpression: "$savedAt",
          indexedAtField: "savedAt",
          idPrefix: "saved_candidate:",
          project: {
            jobSeekerId: 1,
            jobId: 1,
            applicationId: 1,
            publicJobId: 1,
            createdByName: 1,
          },
        },
        run: (pipeline) => SavedCandidateModel.aggregate(pipeline).exec(),
        toEntry: savedCandidateRowToEntry,
      }),
    );
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

/** Job titles and candidate labels for the rows on one page only. */
async function loadActivityRefs(
  entries: EmployerActivityEntry[],
  options: { includeCandidateNames: boolean },
): Promise<EmployerActivityRefs> {
  const jobIds = validObjectIds(entries.map((entry) => entry.jobId));
  const seekerIds = options.includeCandidateNames
    ? validObjectIds(entries.map((entry) => entry.jobSeekerId))
    : [];
  const [jobs, seekers] = await Promise.all([
    jobIds.length > 0
      ? JobModel.find({ _id: { $in: jobIds } }).select("jobTitle").lean()
      : Promise.resolve([]),
    seekerIds.length > 0
      ? JobSeekerModel.find({ _id: { $in: seekerIds } }).select("fullName").lean()
      : Promise.resolve([]),
  ]);
  const jobTitleById = new Map(jobs.map((job) => [String(job._id), text(job.jobTitle)]));
  const seekerNameById = new Map(
    seekers.map((seeker) => [String(seeker._id), text(seeker.fullName)]),
  );
  return {
    jobTitle: (jobId) => (jobId ? (jobTitleById.get(jobId) ?? "") : ""),
    candidate: (jobSeekerId) =>
      jobSeekerId
        ? {
            displayId: formatCandidateDisplayId(jobSeekerId),
            name: seekerNameById.get(jobSeekerId) ?? "",
          }
        : { displayId: "", name: "" },
  };
}

/** Audit times that mirror latest-state employer fields (small, per employer). */
async function loadEmployerAuditTimes(employerKey: string): Promise<EmployerAuditTimes> {
  const rows = await OperationsAuditLogModel.find({
    targetType: "employer",
    targetId: employerKey,
    action: {
      $in: [
        "employer.verification_resubmitted",
        "employer.verification_approved",
        "employer.verification_rejected",
        "employer.account_suspended",
      ],
    },
  })
    .select("action createdAt")
    .sort({ createdAt: -1 })
    .limit(500)
    .lean();
  const times = emptyEmployerAuditTimes();
  for (const row of rows) {
    const at = row.createdAt instanceof Date ? row.createdAt : null;
    if (!at) {
      continue;
    }
    switch (row.action) {
      case "employer.verification_resubmitted":
        times.resubmitted.push(at);
        break;
      case "employer.verification_approved":
        times.approved.push(at);
        break;
      case "employer.verification_rejected":
        times.rejected.push(at);
        break;
      case "employer.account_suspended":
        times.suspended.push(at);
        break;
    }
  }
  return times;
}

/** What the caller may see; each flag mirrors an existing tab permission. */
export type EmployerActivityAccess = {
  /** Posted jobs tab (employers.profile.jobs.view). */
  includeJobs: boolean;
  /** Documents section (employers.profile.documents.view). */
  includeDocuments: boolean;
  /** Application, interview, offer and saved-candidate events. */
  includeCandidates: boolean;
  includeCandidateNames: boolean;
};

export type LoadEmployerActivityInput = {
  employerId: mongoose.Types.ObjectId;
  employer: Omit<EmployerActivityProfileInput, "lastLoginRecorded" | "auditTimes">;
  query: {
    limit: number;
    category: "all" | EmployerActivityCategory;
    cursor: ActivityCursor | null;
  };
  access: EmployerActivityAccess;
};

export async function loadEmployerActivity(
  input: LoadEmployerActivityInput,
): Promise<OperationsEmployerActivityResult> {
  const { employerId, query, access } = input;
  const { includeCandidates, includeJobs } = access;
  const lastLoginAt = input.employer.lastLoginAt ?? null;
  const jobMatch = { employerId };

  const [lastLoginRecorded, auditTimes, publicJobIds] = await Promise.all([
    lastLoginAt
      ? EmployerLoginEventModel.exists({ employerId, loggedInAt: lastLoginAt }).then(Boolean)
      : Promise.resolve(false),
    loadEmployerAuditTimes(String(employerId)),
    includeJobs
      ? JobModel.distinct("jobId", jobMatch).then((ids) => [
          ...new Set(ids.map((id) => text(id).toUpperCase()).filter(Boolean)),
        ])
      : Promise.resolve([] as string[]),
  ]);

  const employer: EmployerActivityProfileInput = {
    ...input.employer,
    lastLoginRecorded,
    auditTimes,
  };

  // Without application permission the candidate sources are never built,
  // so their categories page and count as empty.
  const sources = buildSources({ employerId, employer, publicJobIds, access });
  const category = query.category === "all" ? null : query.category;

  const [page, categoryCounts, jobStats, applicationStats] = await Promise.all([
    paginateEmployerActivity(sources, {
      cursor: query.cursor,
      limit: query.limit,
      category,
    }),
    countEmployerActivity(sources),
    includeJobs
      ? JobModel.aggregate(asPipeline(buildEmployerJobStatsPipeline(jobMatch)))
          .exec()
          .then(parseEmployerJobStats)
      : Promise.resolve(null),
    includeCandidates
      ? ApplicationModel.aggregate(
          asPipeline(buildApplicationActivityStatsPipeline({ employerId })),
        )
          .exec()
          .then(parseApplicationActivityStats)
      : Promise.resolve(null),
  ]);

  const lastActivityAt =
    !query.cursor && !category
      ? (page.entries[0]?.at ?? null)
      : ((
          await paginateEmployerActivity(sources, {
            cursor: null,
            limit: 1,
            category: null,
          })
        ).entries[0]?.at ?? null);

  const refs = await loadActivityRefs(page.entries, {
    includeCandidateNames: includeCandidates && access.includeCandidateNames,
  });

  return {
    journey: buildEmployerJourney({
      employer,
      jobs: jobStats,
      applications: applicationStats,
    }),
    summary: buildEmployerActivitySummary({
      jobs: jobStats,
      applications: applicationStats,
      savedCandidates: categoryCounts.candidate,
      lastLoginAt,
      lastActivityAt,
    }),
    applicationsRestricted: !includeCandidates,
    jobsRestricted: !includeJobs,
    documentsRestricted: !access.includeDocuments,
    categoryCounts,
    events: page.entries.map((entry) => entry.render(refs)),
    pageInfo: {
      limit: query.limit,
      total: categoryCounts[query.category] ?? 0,
      hasMore: page.hasMore,
      nextCursor: page.nextCursor ? encodeActivityCursor(page.nextCursor) : null,
    },
  };
}
