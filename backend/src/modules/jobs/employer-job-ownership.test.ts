import assert from "node:assert/strict";
import { describe, it } from "node:test";
import mongoose from "mongoose";
import {
  EMPLOYER_JOBS_LIST_SORT,
  buildEmployerOwnedJobMatch,
} from "./employer-job-ownership.js";

describe("buildEmployerOwnedJobMatch", () => {
  it("matches employerId or companyId as ObjectId or string", () => {
    const employerId = new mongoose.Types.ObjectId().toString();
    const match = buildEmployerOwnedJobMatch(employerId);

    assert.ok(match.$or);
    const clauses = match.$or as Array<Record<string, unknown>>;
    assert.equal(clauses.length, 4);

    const serialized = JSON.stringify(clauses);
    assert.match(serialized, /employerId/);
    assert.match(serialized, /companyId/);
    assert.ok(serialized.includes(employerId));
  });

  it("returns an impossible match for invalid employer ids", () => {
    const match = buildEmployerOwnedJobMatch("not-an-object-id");
    assert.deepEqual(match, { _id: { $exists: false } });
  });

  it("does not accept a client-supplied foreign employerId alone", () => {
    const ownerId = new mongoose.Types.ObjectId().toString();
    const foreignId = new mongoose.Types.ObjectId().toString();
    const match = buildEmployerOwnedJobMatch(ownerId);
    const clauses = match.$or as Array<Record<string, unknown>>;

    for (const clause of clauses) {
      const value = Object.values(clause)[0];
      assert.notEqual(String(value), foreignId);
    }
  });
});

describe("EMPLOYER_JOBS_LIST_SORT", () => {
  it("prioritizes activity over publishedAt so pending jobs are not buried", () => {
    assert.equal(EMPLOYER_JOBS_LIST_SORT.lastEditedAt, -1);
    assert.equal(EMPLOYER_JOBS_LIST_SORT.submittedForApprovalAt, -1);
    assert.equal(EMPLOYER_JOBS_LIST_SORT.createdAt, -1);
    assert.equal(
      Object.prototype.hasOwnProperty.call(EMPLOYER_JOBS_LIST_SORT, "publishedAt"),
      false,
    );
  });
});
