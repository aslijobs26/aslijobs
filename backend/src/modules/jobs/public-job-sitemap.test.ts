import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { PUBLIC_JOB_SITEMAP_MAX_LIMIT } from "../../constants/job.constants.js";
import { publicJobSitemapQuerySchema } from "./job.validation.js";
import {
  buildPublicJobSitemapPipeline,
  resolvePublicJobLastModified,
  toPublicJobSitemapEntries,
} from "./public-job-sitemap.js";

describe("buildPublicJobSitemapPipeline", () => {
  it("matches only active jobs, paginates by stable _id order, then applies the employer verification safety net", () => {
    const stages = buildPublicJobSitemapPipeline({ page: 3, limit: 100 });

    assert.deepEqual(stages[0], { $match: { status: "active" } });
    assert.deepEqual(stages[1], { $sort: { _id: 1 } });
    assert.deepEqual(stages[2], { $skip: 200 });
    assert.deepEqual(stages[3], { $limit: 100 });
    assert.ok("$lookup" in (stages[4] as object));
  });

  it("projects only public, non-personal fields", () => {
    const stages = buildPublicJobSitemapPipeline({ page: 1, limit: 10 });
    const projection = (stages.at(-1) as { $project: Record<string, number> })
      .$project;

    assert.deepEqual(projection, {
      _id: 0,
      jobId: 1,
      publishedAt: 1,
      lastEditedAt: 1,
      createdAt: 1,
    });
  });
});

describe("resolvePublicJobLastModified", () => {
  it("uses the latest content date (published or edited)", () => {
    assert.equal(
      resolvePublicJobLastModified({
        publishedAt: new Date("2026-03-01T10:00:00.000Z"),
        lastEditedAt: new Date("2026-04-15T08:30:00.000Z"),
        createdAt: new Date("2026-02-01T00:00:00.000Z"),
      }),
      "2026-04-15T08:30:00.000Z",
    );
    assert.equal(
      resolvePublicJobLastModified({
        publishedAt: "2026-05-02T00:00:00.000Z",
        lastEditedAt: "2026-05-01T00:00:00.000Z",
      }),
      "2026-05-02T00:00:00.000Z",
    );
  });

  it("falls back to createdAt, and returns null when no reliable date exists", () => {
    assert.equal(
      resolvePublicJobLastModified({
        publishedAt: null,
        lastEditedAt: "not-a-date",
        createdAt: new Date("2026-01-10T00:00:00.000Z"),
      }),
      "2026-01-10T00:00:00.000Z",
    );
    assert.equal(resolvePublicJobLastModified({}), null);
  });
});

describe("toPublicJobSitemapEntries", () => {
  it("keeps only valid public job ids and removes duplicates", () => {
    const entries = toPublicJobSitemapEntries([
      { jobId: "AJ-2026-000001", publishedAt: "2026-01-01T00:00:00.000Z" },
      { jobId: "aj-2026-000001", publishedAt: "2026-01-02T00:00:00.000Z" },
      { jobId: "AJ-ELEC-2" },
      { jobId: "" },
      { jobId: null },
      { jobId: " AJ-2026-000002 " },
    ]);

    assert.deepEqual(entries, [
      {
        publicJobId: "AJ-2026-000001",
        lastModified: "2026-01-01T00:00:00.000Z",
      },
      { publicJobId: "AJ-2026-000002", lastModified: null },
    ]);
  });
});

describe("publicJobSitemapQuerySchema", () => {
  it("defaults to the first page at the sitemap protocol limit", () => {
    assert.deepEqual(publicJobSitemapQuerySchema.parse({}), {
      page: 1,
      limit: PUBLIC_JOB_SITEMAP_MAX_LIMIT,
    });
  });

  it("rejects limits above 50,000 URLs and invalid pages", () => {
    assert.equal(
      publicJobSitemapQuerySchema.safeParse({ limit: "50001" }).success,
      false,
    );
    assert.equal(publicJobSitemapQuerySchema.safeParse({ page: "0" }).success, false);
  });
});
