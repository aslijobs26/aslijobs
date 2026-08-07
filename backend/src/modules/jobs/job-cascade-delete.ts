import mongoose, { type ClientSession, type Types } from "mongoose";
import { HTTP_STATUS } from "../../constants/http-status.js";
import { AppError } from "../../middleware/error.middleware.js";
import { ApplicationModel } from "../applications/application.model.js";
import { NotificationModel } from "../notifications/notification.model.js";
import { SavedCandidateModel } from "../saved-candidates/saved-candidate.model.js";
import { SavedJobModel } from "../saved-jobs/saved-job.model.js";
import { TeamActivityModel } from "../team/team-activity.model.js";
import { JobModel } from "./job.model.js";
import { JobViewModel } from "./job-view.model.js";

export type JobCascadeDeleteResult = {
  deletedJobIds: string[];
  publicJobIds: string[];
  deletedApplicationsCount: number;
  deletedInterviewsCount: number;
  deletedSavedCandidatesCount: number;
  deletedShortlistedCount: number;
  deletedNotificationsCount: number;
  deletedSavedJobsCount: number;
  deletedJobViewsCount: number;
  deletedTeamActivitiesCount: number;
};

type ApplicationCascadeLean = {
  _id: Types.ObjectId;
  jobId: Types.ObjectId;
  publicJobId?: string;
  status?: string;
  interview?: { date?: string | null } | null;
  shortlist?: { shortlistedAt?: Date | null } | null;
};

type CascadeDeleteCounts = {
  deletedNotificationsCount: number;
  deletedSavedCandidatesCount: number;
  deletedApplicationsCount: number;
  deletedSavedJobsCount: number;
  deletedJobViewsCount: number;
  deletedTeamActivitiesCount: number;
  deletedJobsCount: number;
};

function isTransactionUnsupportedError(error: unknown): boolean {
  if (!error || typeof error !== "object") {
    return false;
  }

  const code = "code" in error ? Number(error.code) : NaN;
  const message =
    "message" in error && typeof error.message === "string"
      ? error.message.toLowerCase()
      : "";

  return (
    code === 20 ||
    message.includes("transaction numbers are only allowed on a replica set") ||
    message.includes("transactions are not supported") ||
    message.includes("transaction with { readconcern") ||
    message.includes("replica set")
  );
}

function wrapCascadeFailure(error: unknown): AppError {
  if (error instanceof AppError) {
    return error;
  }

  const message =
    error instanceof Error && error.message
      ? error.message
      : "Cascade job deletion failed";

  return new AppError(
    `Unable to delete job and related data. ${message}`,
    HTTP_STATUS.INTERNAL_SERVER_ERROR,
  );
}

function toObjectIds(ids: Array<string | Types.ObjectId>): Types.ObjectId[] {
  return ids
    .map((id) => String(id))
    .filter((id) => mongoose.Types.ObjectId.isValid(id))
    .map((id) => new mongoose.Types.ObjectId(id));
}

function summarizeApplications(applications: ApplicationCascadeLean[]) {
  const applicationObjectIds = applications.map((app) => app._id);
  const applicationIdStrings = applicationObjectIds.map((id) => id.toString());
  const publicJobIds = [
    ...new Set(
      applications
        .map((app) => app.publicJobId?.trim().toUpperCase() ?? "")
        .filter(Boolean),
    ),
  ];
  const jobObjectIds = [
    ...new Map(
      applications.map((app) => [app.jobId.toString(), app.jobId]),
    ).values(),
  ];

  const deletedInterviewsCount = applications.filter((app) =>
    Boolean(app.interview?.date?.trim()),
  ).length;

  const deletedShortlistedCount = applications.filter((app) => {
    if (app.status === "shortlisted") {
      return true;
    }
    return Boolean(app.shortlist?.shortlistedAt);
  }).length;

  return {
    applicationObjectIds,
    applicationIdStrings,
    publicJobIds,
    jobObjectIds,
    deletedInterviewsCount,
    deletedShortlistedCount,
  };
}

/**
 * Deletes all hiring data that belongs only to the given jobs/applications.
 * Job Seeker accounts and resumes are never touched.
 */
async function executeRelatedDataDeletes(input: {
  employerObjectId: Types.ObjectId;
  jobObjectIds: Types.ObjectId[];
  publicJobIds: string[];
  applicationObjectIds: Types.ObjectId[];
  applicationIdStrings: string[];
  deleteJobs: boolean;
  session: ClientSession | null;
}): Promise<CascadeDeleteCounts> {
  const {
    employerObjectId,
    jobObjectIds,
    publicJobIds,
    applicationObjectIds,
    applicationIdStrings,
    deleteJobs,
    session,
  } = input;
  const opts = session ? { session } : undefined;
  const normalizedPublicJobIds = publicJobIds
    .map((id) => id.trim().toUpperCase())
    .filter(Boolean);

  let deletedNotificationsCount = 0;
  if (applicationIdStrings.length > 0 || normalizedPublicJobIds.length > 0) {
    const notificationClauses: Record<string, unknown>[] = [];

    if (applicationIdStrings.length > 0) {
      notificationClauses.push({
        referenceType: "application",
        referenceId: { $in: applicationIdStrings },
      });
    }

    if (normalizedPublicJobIds.length > 0) {
      notificationClauses.push({
        "metadata.publicJobId": { $in: normalizedPublicJobIds },
      });
      notificationClauses.push({
        "metadata.publicJobId": {
          $in: normalizedPublicJobIds.map((id) => id.toLowerCase()),
        },
      });
    }

    const notificationsResult = await NotificationModel.deleteMany(
      { $or: notificationClauses },
      opts,
    );
    deletedNotificationsCount = notificationsResult.deletedCount ?? 0;
  }

  const savedCandidateOr: Record<string, unknown>[] = [];
  if (jobObjectIds.length > 0) {
    savedCandidateOr.push({ jobId: { $in: jobObjectIds } });
  }
  if (applicationObjectIds.length > 0) {
    savedCandidateOr.push({ applicationId: { $in: applicationObjectIds } });
  }
  if (normalizedPublicJobIds.length > 0) {
    savedCandidateOr.push({ publicJobId: { $in: normalizedPublicJobIds } });
  }

  let deletedSavedCandidatesCount = 0;
  if (savedCandidateOr.length > 0) {
    const savedCandidatesResult = await SavedCandidateModel.deleteMany(
      {
        $and: [{ employerId: employerObjectId }, { $or: savedCandidateOr }],
      },
      opts,
    );
    deletedSavedCandidatesCount = savedCandidatesResult.deletedCount ?? 0;
  }

  const applicationClauses: Record<string, unknown>[] = [];
  if (jobObjectIds.length > 0) {
    applicationClauses.push({ jobId: { $in: jobObjectIds } });
  }
  if (applicationObjectIds.length > 0) {
    applicationClauses.push({ _id: { $in: applicationObjectIds } });
  }
  if (normalizedPublicJobIds.length > 0) {
    applicationClauses.push({
      employerId: employerObjectId,
      publicJobId: { $in: normalizedPublicJobIds },
    });
  }

  let deletedApplicationsCount = 0;
  if (applicationClauses.length > 0) {
    const applicationsResult = await ApplicationModel.deleteMany(
      { $or: applicationClauses },
      opts,
    );
    deletedApplicationsCount = applicationsResult.deletedCount ?? 0;
  }

  let deletedSavedJobsCount = 0;
  if (jobObjectIds.length > 0 || normalizedPublicJobIds.length > 0) {
    const savedJobClauses: Record<string, unknown>[] = [];
    if (jobObjectIds.length > 0) {
      savedJobClauses.push({ jobId: { $in: jobObjectIds } });
    }
    if (normalizedPublicJobIds.length > 0) {
      savedJobClauses.push({ publicJobId: { $in: normalizedPublicJobIds } });
    }
    const savedJobsResult = await SavedJobModel.deleteMany(
      { $or: savedJobClauses },
      opts,
    );
    deletedSavedJobsCount = savedJobsResult.deletedCount ?? 0;
  }

  let deletedJobViewsCount = 0;
  if (jobObjectIds.length > 0 || normalizedPublicJobIds.length > 0) {
    const viewClauses: Record<string, unknown>[] = [];
    if (jobObjectIds.length > 0) {
      viewClauses.push({ jobId: { $in: jobObjectIds } });
    }
    if (normalizedPublicJobIds.length > 0) {
      viewClauses.push({ publicJobId: { $in: normalizedPublicJobIds } });
    }
    const jobViewsResult = await JobViewModel.deleteMany(
      { $or: viewClauses },
      opts,
    );
    deletedJobViewsCount = jobViewsResult.deletedCount ?? 0;
  }

  let deletedTeamActivitiesCount = 0;
  if (
    jobObjectIds.length > 0 ||
    normalizedPublicJobIds.length > 0 ||
    applicationIdStrings.length > 0
  ) {
    const activityClauses: Record<string, unknown>[] = [];
    const deletedJobIdStrings = jobObjectIds.map((id) => id.toString());

    if (deletedJobIdStrings.length > 0) {
      activityClauses.push({
        "metadata.deletedIds": { $in: deletedJobIdStrings },
      });
      activityClauses.push({
        "metadata.jobId": { $in: deletedJobIdStrings },
      });
    }
    if (normalizedPublicJobIds.length > 0) {
      activityClauses.push({
        "metadata.publicJobIds": { $in: normalizedPublicJobIds },
      });
      activityClauses.push({
        "metadata.publicJobId": { $in: normalizedPublicJobIds },
      });
    }
    if (applicationIdStrings.length > 0) {
      activityClauses.push({
        "metadata.applicationId": { $in: applicationIdStrings },
      });
    }

    if (activityClauses.length > 0) {
      const activitiesResult = await TeamActivityModel.deleteMany(
        {
          employerId: employerObjectId,
          type: { $nin: ["job_deleted", "jobs_bulk_deleted"] },
          $or: activityClauses,
        },
        opts,
      );
      deletedTeamActivitiesCount = activitiesResult.deletedCount ?? 0;
    }
  }

  let deletedJobsCount = 0;
  if (deleteJobs && jobObjectIds.length > 0) {
    const jobsResult = await JobModel.deleteMany(
      {
        employerId: employerObjectId,
        _id: { $in: jobObjectIds },
      },
      opts,
    );
    deletedJobsCount = jobsResult.deletedCount ?? 0;
  }

  return {
    deletedNotificationsCount,
    deletedSavedCandidatesCount,
    deletedApplicationsCount,
    deletedSavedJobsCount,
    deletedJobViewsCount,
    deletedTeamActivitiesCount,
    deletedJobsCount,
  };
}

async function runWithOptionalTransaction<T>(
  run: (session: ClientSession | null) => Promise<T>,
): Promise<T> {
  const session = await mongoose.startSession();

  try {
    try {
      return await session.withTransaction(async () => run(session));
    } catch (error) {
      if (!isTransactionUnsupportedError(error)) {
        throw wrapCascadeFailure(error);
      }

      // Standalone MongoDB: ordered deletes with jobs last remain retryable.
      return run(null);
    }
  } finally {
    await session.endSession();
  }
}

/**
 * Permanently deletes employer-owned jobs and all data that belongs only to those jobs.
 */
export async function cascadeDeleteOwnedJobs(input: {
  employerId: string;
  jobObjectIds: Types.ObjectId[];
}): Promise<JobCascadeDeleteResult> {
  const { employerId, jobObjectIds } = input;

  if (!mongoose.Types.ObjectId.isValid(employerId)) {
    throw new AppError("Unauthorized", HTTP_STATUS.UNAUTHORIZED);
  }

  const empty: JobCascadeDeleteResult = {
    deletedJobIds: [],
    publicJobIds: [],
    deletedApplicationsCount: 0,
    deletedInterviewsCount: 0,
    deletedSavedCandidatesCount: 0,
    deletedShortlistedCount: 0,
    deletedNotificationsCount: 0,
    deletedSavedJobsCount: 0,
    deletedJobViewsCount: 0,
    deletedTeamActivitiesCount: 0,
  };

  if (jobObjectIds.length === 0) {
    return empty;
  }

  const employerObjectId = new mongoose.Types.ObjectId(employerId);

  const ownedJobs = await JobModel.find({
    employerId: employerObjectId,
    _id: { $in: jobObjectIds },
  })
    .select("_id jobId")
    .lean();

  if (ownedJobs.length === 0) {
    return empty;
  }

  const ownedJobObjectIds = ownedJobs.map((job) => job._id);
  const publicJobIds = ownedJobs.map((job) =>
    String(job.jobId).trim().toUpperCase(),
  );
  const deletedJobIds = ownedJobObjectIds.map((id) => id.toString());

  const applications = (await ApplicationModel.find({
    $or: [
      { jobId: { $in: ownedJobObjectIds } },
      {
        employerId: employerObjectId,
        publicJobId: { $in: publicJobIds },
      },
    ],
  })
    .select("_id jobId publicJobId status interview.date shortlist.shortlistedAt")
    .lean()) as ApplicationCascadeLean[];

  const summary = summarizeApplications(applications);

  try {
    const deleteCounts = await runWithOptionalTransaction((session) =>
      executeRelatedDataDeletes({
        employerObjectId,
        jobObjectIds: ownedJobObjectIds,
        publicJobIds,
        applicationObjectIds: summary.applicationObjectIds,
        applicationIdStrings: summary.applicationIdStrings,
        deleteJobs: true,
        session,
      }),
    );

    if (deleteCounts.deletedJobsCount !== ownedJobObjectIds.length) {
      throw new AppError(
        "Cascade job deletion could not remove all selected jobs.",
        HTTP_STATUS.CONFLICT,
      );
    }

    return {
      deletedJobIds,
      publicJobIds,
      deletedApplicationsCount: deleteCounts.deletedApplicationsCount,
      deletedInterviewsCount: summary.deletedInterviewsCount,
      deletedSavedCandidatesCount: deleteCounts.deletedSavedCandidatesCount,
      deletedShortlistedCount: summary.deletedShortlistedCount,
      deletedNotificationsCount: deleteCounts.deletedNotificationsCount,
      deletedSavedJobsCount: deleteCounts.deletedSavedJobsCount,
      deletedJobViewsCount: deleteCounts.deletedJobViewsCount,
      deletedTeamActivitiesCount: deleteCounts.deletedTeamActivitiesCount,
    };
  } catch (error) {
    throw wrapCascadeFailure(error);
  }
}

/**
 * Removes hiring records whose parent Job no longer exists.
 * Heals orphan data left by legacy job-only deletes.
 */
export async function purgeOrphanJobRelationsForEmployer(
  employerId: string,
): Promise<JobCascadeDeleteResult> {
  if (!mongoose.Types.ObjectId.isValid(employerId)) {
    throw new AppError("Unauthorized", HTTP_STATUS.UNAUTHORIZED);
  }

  const employerObjectId = new mongoose.Types.ObjectId(employerId);
  const empty: JobCascadeDeleteResult = {
    deletedJobIds: [],
    publicJobIds: [],
    deletedApplicationsCount: 0,
    deletedInterviewsCount: 0,
    deletedSavedCandidatesCount: 0,
    deletedShortlistedCount: 0,
    deletedNotificationsCount: 0,
    deletedSavedJobsCount: 0,
    deletedJobViewsCount: 0,
    deletedTeamActivitiesCount: 0,
  };

  const [applicationJobIds, savedCandidateJobIds] = await Promise.all([
    ApplicationModel.distinct("jobId", { employerId: employerObjectId }),
    SavedCandidateModel.distinct("jobId", { employerId: employerObjectId }),
  ]);

  const referencedJobIds = toObjectIds([
    ...applicationJobIds.map((id) => String(id)),
    ...savedCandidateJobIds.map((id) => String(id)),
  ]);

  if (referencedJobIds.length === 0) {
    // Still clean dangling notifications/views with no live applications.
    return empty;
  }

  const existingJobs = await JobModel.find({
    _id: { $in: referencedJobIds },
  })
    .select("_id")
    .lean();
  const existingJobIdSet = new Set(existingJobs.map((job) => job._id.toString()));

  const orphanJobObjectIds = referencedJobIds.filter(
    (id) => !existingJobIdSet.has(id.toString()),
  );

  if (orphanJobObjectIds.length === 0) {
    return empty;
  }

  const applications = (await ApplicationModel.find({
    employerId: employerObjectId,
    jobId: { $in: orphanJobObjectIds },
  })
    .select("_id jobId publicJobId status interview.date shortlist.shortlistedAt")
    .lean()) as ApplicationCascadeLean[];

  const summary = summarizeApplications(applications);
  const publicJobIds = [
    ...new Set([
      ...summary.publicJobIds,
      ...(
        await SavedCandidateModel.distinct("publicJobId", {
          employerId: employerObjectId,
          jobId: { $in: orphanJobObjectIds },
        })
      ).map((id) => String(id).trim().toUpperCase()),
    ]),
  ].filter(Boolean);

  try {
    const deleteCounts = await runWithOptionalTransaction((session) =>
      executeRelatedDataDeletes({
        employerObjectId,
        jobObjectIds: orphanJobObjectIds,
        publicJobIds,
        applicationObjectIds: summary.applicationObjectIds,
        applicationIdStrings: summary.applicationIdStrings,
        deleteJobs: false,
        session,
      }),
    );

    return {
      deletedJobIds: orphanJobObjectIds.map((id) => id.toString()),
      publicJobIds,
      deletedApplicationsCount: deleteCounts.deletedApplicationsCount,
      deletedInterviewsCount: summary.deletedInterviewsCount,
      deletedSavedCandidatesCount: deleteCounts.deletedSavedCandidatesCount,
      deletedShortlistedCount: summary.deletedShortlistedCount,
      deletedNotificationsCount: deleteCounts.deletedNotificationsCount,
      deletedSavedJobsCount: deleteCounts.deletedSavedJobsCount,
      deletedJobViewsCount: deleteCounts.deletedJobViewsCount,
      deletedTeamActivitiesCount: deleteCounts.deletedTeamActivitiesCount,
    };
  } catch (error) {
    throw wrapCascadeFailure(error);
  }
}

/**
 * Cheap consistency guard used by read paths to heal legacy orphans.
 */
export async function ensureEmployerJobRelationsConsistent(
  employerId: string,
): Promise<JobCascadeDeleteResult | null> {
  if (!mongoose.Types.ObjectId.isValid(employerId)) {
    return null;
  }

  const employerObjectId = new mongoose.Types.ObjectId(employerId);
  const referencedJobIds = toObjectIds(
    (
      await ApplicationModel.distinct("jobId", { employerId: employerObjectId })
    ).map((id) => String(id)),
  );

  if (referencedJobIds.length === 0) {
    const savedRefs = toObjectIds(
      (
        await SavedCandidateModel.distinct("jobId", {
          employerId: employerObjectId,
        })
      ).map((id) => String(id)),
    );
    if (savedRefs.length === 0) {
      return null;
    }

    const existingSavedJobs = await JobModel.countDocuments({
      _id: { $in: savedRefs },
    });
    if (existingSavedJobs === savedRefs.length) {
      return null;
    }

    return purgeOrphanJobRelationsForEmployer(employerId);
  }

  const existingCount = await JobModel.countDocuments({
    _id: { $in: referencedJobIds },
  });

  if (existingCount === referencedJobIds.length) {
    return null;
  }

  return purgeOrphanJobRelationsForEmployer(employerId);
}
