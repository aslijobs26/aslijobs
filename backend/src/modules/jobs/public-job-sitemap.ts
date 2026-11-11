import type { PipelineStage } from "mongoose";
import { JobModel } from "./job.model.js";
import { buildPublicEmployerVerificationStages } from "./public-job-eligibility.js";

/** Same pattern the public job detail route accepts (`/jobs/:publicJobId`). */
const PUBLIC_JOB_ID_PATTERN = /^AJ-\d{4}-\d{6}$/;

export type PublicJobSitemapRow = {
  jobId?: string | null;
  publishedAt?: Date | string | null;
  lastEditedAt?: Date | string | null;
  createdAt?: Date | string | null;
};

export type PublicJobSitemapEntry = {
  publicJobId: string;
  lastModified: string | null;
};

function toValidTime(value: Date | string | null | undefined): number | null {
  if (value == null || value === "") {
    return null;
  }
  const time = new Date(value).getTime();
  return Number.isFinite(time) ? time : null;
}

/**
 * Content-based last modification of a public job page.
 * `updatedAt` is intentionally ignored: view, application and bookmark
 * counters bump it without changing the public page.
 */
export function resolvePublicJobLastModified(
  row: PublicJobSitemapRow,
): string | null {
  const contentTimes = [row.publishedAt, row.lastEditedAt]
    .map(toValidTime)
    .filter((time): time is number => time !== null);

  const latest =
    contentTimes.length > 0 ? Math.max(...contentTimes) : toValidTime(row.createdAt);

  return latest === null ? null : new Date(latest).toISOString();
}

export function toPublicJobSitemapEntries(
  rows: readonly PublicJobSitemapRow[],
): PublicJobSitemapEntry[] {
  const seen = new Set<string>();
  const entries: PublicJobSitemapEntry[] = [];

  for (const row of rows) {
    const publicJobId = row.jobId?.trim().toUpperCase() ?? "";
    if (!PUBLIC_JOB_ID_PATTERN.test(publicJobId) || seen.has(publicJobId)) {
      continue;
    }
    seen.add(publicJobId);
    entries.push({
      publicJobId,
      lastModified: resolvePublicJobLastModified(row),
    });
  }

  return entries;
}

/**
 * Same visibility rules as the public job detail endpoint: `status: "active"`
 * plus the employer verification safety net. Ordered by `_id` so existing jobs
 * keep their page while new jobs append to the last page.
 */
export function buildPublicJobSitemapPipeline(input: {
  page: number;
  limit: number;
}): PipelineStage[] {
  return [
    { $match: { status: "active" } },
    { $sort: { _id: 1 } },
    { $skip: (input.page - 1) * input.limit },
    { $limit: input.limit },
    ...buildPublicEmployerVerificationStages(),
    {
      $project: {
        _id: 0,
        jobId: 1,
        publishedAt: 1,
        lastEditedAt: 1,
        createdAt: 1,
      },
    },
  ];
}

export async function listPublicJobSitemapEntries(input: {
  page: number;
  limit: number;
}) {
  const [rows, total] = await Promise.all([
    JobModel.aggregate<PublicJobSitemapRow>(
      buildPublicJobSitemapPipeline(input),
    ),
    // Upper bound for page planning; the verification safety net may drop a
    // few rows from a page, never add any.
    JobModel.countDocuments({ status: "active" }),
  ]);

  return {
    jobs: toPublicJobSitemapEntries(rows),
    pagination: {
      page: input.page,
      limit: input.limit,
      total,
      totalPages: Math.max(1, Math.ceil(total / input.limit)),
    },
  };
}
