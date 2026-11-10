import assert from "node:assert/strict";
import { afterEach, describe, it, mock } from "node:test";
import type { Request, Response } from "express";
import mongoose from "mongoose";
import { EmployerModel } from "../../employers/employer.model.js";
import { OperationsTeamUserModel } from "../auth/operations-team-user.model.js";
import type { OperationsResolvedAccess } from "../rbac/operations-access.types.js";
import { OperationsAuditLogModel } from "../rbac/operations-audit-log.model.js";
import { operationsEmployersController } from "./operations-employers.controller.js";
import { operationsEmployersService } from "./operations-employers.service.js";
import type {
  OperationsEmployerActivityResult,
  OperationsEmployerDetail,
} from "./operations-employers.types.js";

const employerId = "64f0000000000000000000ab";
const opsUserId = "64f0000000000000000000ff";

function stubStatusUpdate(previousStatus: string) {
  const update = mock.method(EmployerModel, "findByIdAndUpdate", () => ({
    select: () => ({
      lean: async () => ({
        _id: new mongoose.Types.ObjectId(employerId),
        status: previousStatus,
        accountType: "company",
        companyName: "Sai Org",
      }),
    }),
  }));
  mock.method(OperationsTeamUserModel, "findById", () => ({
    select: () => ({ lean: async () => ({ fullName: "Ops Admin" }) }),
  }));
  mock.method(operationsEmployersService, "getEmployerById", async () =>
    ({ id: employerId }) as unknown as OperationsEmployerDetail,
  );
  const audits: Array<Record<string, unknown>> = [];
  mock.method(OperationsAuditLogModel, "create", async (row: Record<string, unknown>) => {
    audits.push(row);
    return row;
  });
  return { update, audits };
}

describe("employer suspend / reactivate audit", () => {
  afterEach(() => {
    mock.restoreAll();
  });

  it("records who suspended the account and why", async () => {
    const { audits } = stubStatusUpdate("active");
    await operationsEmployersService.updateStatus(
      employerId,
      { status: "suspended", reason: "Spam postings" },
      opsUserId,
    );
    assert.equal(audits.length, 1);
    assert.equal(audits[0]?.action, "employer.account_suspended");
    assert.equal(audits[0]?.targetType, "employer");
    assert.equal(audits[0]?.targetId, employerId);
    assert.equal(audits[0]?.actorName, "Ops Admin");
    assert.equal(audits[0]?.reason, "Spam postings");
    assert.deepEqual(audits[0]?.previousState, { status: "active" });
    assert.deepEqual(audits[0]?.nextState, { status: "suspended" });
  });

  it("records reactivation without a reason", async () => {
    const { audits } = stubStatusUpdate("suspended");
    await operationsEmployersService.updateStatus(
      employerId,
      { status: "active", reason: "" },
      opsUserId,
    );
    assert.equal(audits[0]?.action, "employer.account_reactivated");
    assert.equal(audits[0]?.reason, "");
  });

  it("does not audit a status that did not change", async () => {
    const { audits } = stubStatusUpdate("suspended");
    await operationsEmployersService.updateStatus(
      employerId,
      { status: "suspended", reason: "Again" },
      opsUserId,
    );
    assert.equal(audits.length, 0);
  });

  it("keeps the status change when the audit write fails", async () => {
    stubStatusUpdate("active");
    mock.method(console, "error", () => undefined);
    mock.method(OperationsAuditLogModel, "create", async () => {
      throw new Error("db down");
    });
    const result = await operationsEmployersService.updateStatus(
      employerId,
      { status: "suspended", reason: "Spam" },
      opsUserId,
    );
    assert.equal(result.id, employerId);
  });
});

describe("employer activity endpoint", () => {
  afterEach(() => {
    mock.restoreAll();
  });

  it("rejects a cursor it did not issue before touching the database", async () => {
    const findById = mock.method(EmployerModel, "findById", () => {
      throw new Error("must not query");
    });
    await assert.rejects(
      operationsEmployersService.getEmployerActivity(
        employerId,
        { limit: 20, category: "all", cursor: "not-a-cursor" },
        {
          includeJobs: true,
          includeDocuments: true,
          includeCandidates: true,
          includeCandidateNames: true,
        },
      ),
      (error: unknown) =>
        (error as { statusCode?: number }).statusCode === 400 &&
        /Invalid activity cursor/.test((error as Error).message),
    );
    assert.equal(findById.mock.calls.length, 0);
  });

  it("returns 404 for an invalid employer id", async () => {
    await assert.rejects(
      operationsEmployersService.getEmployerActivity(
        "nope",
        { limit: 20, category: "all", cursor: "" },
        {
          includeJobs: false,
          includeDocuments: false,
          includeCandidates: false,
          includeCandidateNames: false,
        },
      ),
      (error: unknown) => (error as { statusCode?: number }).statusCode === 404,
    );
  });

  function access(grantedKeys: string[]): OperationsResolvedAccess {
    return { isSuperAdmin: false, grantedKeys } as unknown as OperationsResolvedAccess;
  }

  async function callController(grantedKeys: string[]) {
    const calls: unknown[][] = [];
    mock.method(operationsEmployersService, "getEmployerActivity", async (...args: unknown[]) => {
      calls.push(args);
      return {} as OperationsEmployerActivityResult;
    });
    const req = {
      operationsAccess: access(grantedKeys),
      params: { employerId },
      query: { limit: 20, category: "all", cursor: "" },
    } as unknown as Request;
    const res = {
      status() {
        return this;
      },
      json() {
        return this;
      },
    } as unknown as Response;
    await operationsEmployersController.getActivity(req, res);
    return calls[0]?.[2];
  }

  it("passes only the sections the operations user can already see", async () => {
    assert.deepEqual(await callController(["employers.profile.view"]), {
      includeJobs: false,
      includeDocuments: false,
      includeCandidates: false,
      includeCandidateNames: false,
    });
    assert.deepEqual(
      await callController([
        "employers.profile.jobs.view",
        "employers.profile.documents.view",
        "candidates.profile.applications.view",
      ]),
      {
        includeJobs: true,
        includeDocuments: true,
        includeCandidates: true,
        includeCandidateNames: false,
      },
    );
  });
});
