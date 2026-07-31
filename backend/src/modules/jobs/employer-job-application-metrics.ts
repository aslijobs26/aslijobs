import mongoose from "mongoose";
import {
  EMPLOYER_JOB_HIRED_STATUSES,
  EMPLOYER_JOB_SHORTLISTED_STATUSES,
} from "../applications/application.constants.js";
import { ApplicationModel } from "../applications/application.model.js";

export type EmployerJobApplicationMetrics = {
  applications: number;
  shortlisted: number;
  hired: number;
};

const EMPTY_METRICS: EmployerJobApplicationMetrics = {
  applications: 0,
  shortlisted: 0,
  hired: 0,
};

/**
 * Batch-load application funnel metrics for many jobs in one aggregation.
 * Source of truth: Applications collection (not denormalized Job counters).
 */
export async function loadEmployerJobApplicationMetricsByJobIds(
  employerId: string,
  jobMongoIds: string[],
): Promise<Map<string, EmployerJobApplicationMetrics>> {
  const metricsByJobId = new Map<string, EmployerJobApplicationMetrics>();

  if (
    !mongoose.Types.ObjectId.isValid(employerId) ||
    jobMongoIds.length === 0
  ) {
    return metricsByJobId;
  }

  const jobObjectIds = jobMongoIds
    .filter((id) => mongoose.Types.ObjectId.isValid(id))
    .map((id) => new mongoose.Types.ObjectId(id));

  if (jobObjectIds.length === 0) {
    return metricsByJobId;
  }

  const rows = await ApplicationModel.aggregate<{
    _id: mongoose.Types.ObjectId;
    applications: number;
    shortlisted: number;
    hired: number;
  }>([
    {
      $match: {
        employerId: new mongoose.Types.ObjectId(employerId),
        jobId: { $in: jobObjectIds },
      },
    },
    {
      $group: {
        _id: "$jobId",
        applications: { $sum: 1 },
        shortlisted: {
          $sum: {
            $cond: [
              { $in: ["$status", [...EMPLOYER_JOB_SHORTLISTED_STATUSES]] },
              1,
              0,
            ],
          },
        },
        hired: {
          $sum: {
            $cond: [
              { $in: ["$status", [...EMPLOYER_JOB_HIRED_STATUSES]] },
              1,
              0,
            ],
          },
        },
      },
    },
  ]);

  for (const row of rows) {
    metricsByJobId.set(row._id.toString(), {
      applications: row.applications,
      shortlisted: row.shortlisted,
      hired: row.hired,
    });
  }

  return metricsByJobId;
}

/**
 * Employer-wide application metrics in a single aggregation (My Jobs stats cards).
 */
export async function loadEmployerApplicationMetricsTotals(
  employerId: string,
): Promise<EmployerJobApplicationMetrics> {
  if (!mongoose.Types.ObjectId.isValid(employerId)) {
    return { ...EMPTY_METRICS };
  }

  const rows = await ApplicationModel.aggregate<{
    applications: number;
    shortlisted: number;
    hired: number;
  }>([
    {
      $match: {
        employerId: new mongoose.Types.ObjectId(employerId),
      },
    },
    {
      $group: {
        _id: null,
        applications: { $sum: 1 },
        shortlisted: {
          $sum: {
            $cond: [
              { $in: ["$status", [...EMPLOYER_JOB_SHORTLISTED_STATUSES]] },
              1,
              0,
            ],
          },
        },
        hired: {
          $sum: {
            $cond: [
              { $in: ["$status", [...EMPLOYER_JOB_HIRED_STATUSES]] },
              1,
              0,
            ],
          },
        },
      },
    },
  ]);

  const totals = rows[0];
  if (!totals) {
    return { ...EMPTY_METRICS };
  }

  return {
    applications: totals.applications,
    shortlisted: totals.shortlisted,
    hired: totals.hired,
  };
}

export function emptyEmployerJobApplicationMetrics(): EmployerJobApplicationMetrics {
  return { ...EMPTY_METRICS };
}
