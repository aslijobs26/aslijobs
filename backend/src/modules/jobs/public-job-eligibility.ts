import type { PipelineStage } from "mongoose";
import { EmployerModel } from "../employers/employer.model.js";
import {
  isEmployerCreatedJobSource,
  isEmployerVerifiedForJobs,
  type EmployerVerificationSnapshot,
} from "./employer-job-verification.guard.js";

/**
 * Aggregation stages appended after an initial $match on jobs.
 * Filters out employer-created active jobs whose employer is not verified,
 * without N+1 lookups.
 */
export function buildPublicEmployerVerificationStages(): PipelineStage[] {
  return [
    {
      $lookup: {
        from: EmployerModel.collection.name,
        let: {
          employerRef: {
            $ifNull: ["$employerId", "$companyId"],
          },
        },
        pipeline: [
          {
            $match: {
              $expr: {
                $eq: ["$_id", "$$employerRef"],
              },
            },
          },
          {
            $project: {
              verificationStatus: 1,
            },
          },
        ],
        as: "_publicEmployer",
      },
    },
    {
      $addFields: {
        _publicEmployer: { $arrayElemAt: ["$_publicEmployer", 0] },
      },
    },
    {
      $match: {
        $or: [
          { creationSource: "operations" },
          { "_publicEmployer.verificationStatus": "verified" },
          { "_publicEmployer.verificationStatus": "approved" },
        ],
      },
    },
  ];
}

export function isJobPubliclyEligible(input: {
  creationSource?: string | null;
  employer?: EmployerVerificationSnapshot | null;
}): boolean {
  if (!isEmployerCreatedJobSource(input.creationSource)) {
    return true;
  }
  return isEmployerVerifiedForJobs(input.employer);
}
