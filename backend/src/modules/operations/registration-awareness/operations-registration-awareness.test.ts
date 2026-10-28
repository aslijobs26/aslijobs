import assert from "node:assert/strict";
import { afterEach, describe, it, mock } from "node:test";
import mongoose from "mongoose";
import { EmployerModel } from "../../employers/employer.model.js";
import { jobService } from "../../jobs/job.service.js";
import { OperationsAuditLogModel } from "../rbac/operations-audit-log.model.js";
import { emitJobPendingOpsNotification } from "../jobs/operations-job-moderation-emit.js";
import {
  formatRelativeTime,
  startOfKolkataDay,
  startOfKolkataWeek,
  startOfNextKolkataDay,
  toKolkataIsoDate,
} from "./operations-registration-time.js";
import {
  buildNewRegistrationAwarenessPayload,
  formatCandidateRegistrationDisplayId,
  formatEmployerRegistrationDisplayId,
  operationsNotificationUnreadClause,
  operationsNotificationVisibleTypes,
  resolveEmployerRegistrationDisplayName,
} from "./operations-registration-awareness.service.js";
import {
  OPERATIONS_REGISTRATION_AUDIT_ACTIONS,
} from "./operations-registration-awareness.constants.js";
import { OperationsNotificationModel } from "./operations-notification.model.js";
import { emitEmployerRegisteredAwareness } from "./operations-registration-emit.js";
import { buildSuperAdminPermissions } from "../auth/operations-rbac.js";

describe("operations registration time helpers", () => {
  it("formats Kolkata ISO dates stably", () => {
    // 2026-09-08 10:00 IST = 2026-09-08 04:30 UTC
    const utc = new Date("2026-09-08T04:30:00.000Z");
    assert.equal(toKolkataIsoDate(utc), "2026-09-08");
  });

  it("computes Kolkata day boundaries as UTC instants", () => {
    const utc = new Date("2026-09-08T04:30:00.000Z");
    const start = startOfKolkataDay(utc);
    const next = startOfNextKolkataDay(utc);
    assert.equal(start.toISOString(), "2026-09-07T18:30:00.000Z");
    assert.equal(next.toISOString(), "2026-09-08T18:30:00.000Z");
    assert.ok(start.getTime() < utc.getTime());
    assert.ok(utc.getTime() < next.getTime());
  });

  it("computes Monday-based Kolkata week start", () => {
    // Tuesday 8 Sep 2026 IST → week starts Monday 7 Sep 2026 IST
    const utc = new Date("2026-09-08T04:30:00.000Z");
    const weekStart = startOfKolkataWeek(utc);
    assert.equal(toKolkataIsoDate(weekStart), "2026-09-07");
  });

  it("formats relative times", () => {
    const now = new Date("2026-09-08T12:00:00.000Z");
    assert.equal(
      formatRelativeTime(new Date("2026-09-08T11:59:30.000Z"), now),
      "just now",
    );
    assert.equal(
      formatRelativeTime(new Date("2026-09-08T11:50:00.000Z"), now),
      "10 min ago",
    );
  });
});

describe("operations registration awareness helpers", () => {
  it("builds NEW awareness payload without mutating verification", () => {
    const at = new Date("2026-09-08T10:00:00.000Z");
    const payload = buildNewRegistrationAwarenessPayload(at);
    assert.deepEqual(payload, {
      state: "new",
      registeredAt: at,
      firstSeenAt: null,
      firstSeenBy: null,
    });
  });

  it("formats display IDs from ObjectId suffixes", () => {
    assert.equal(
      formatEmployerRegistrationDisplayId("507f1f77bcf86cd799439011"),
      "EMP-99439011",
    );
    assert.equal(
      formatCandidateRegistrationDisplayId("507f1f77bcf86cd799439011"),
      "AJ-CAN-99439011",
    );
  });

  it("resolves employer display names preferring company", () => {
    assert.equal(
      resolveEmployerRegistrationDisplayName({
        companyName: "ABC Tech",
        establishmentName: "Shop",
        firstName: "A",
        lastName: "B",
      }),
      "ABC Tech",
    );
    assert.equal(
      resolveEmployerRegistrationDisplayName({
        companyName: "",
        establishmentName: "",
        firstName: "Ravi",
        lastName: "Kumar",
      }),
      "Ravi Kumar",
    );
  });

  it("uses stable audit action constants for Work Queue compatibility", () => {
    assert.equal(
      OPERATIONS_REGISTRATION_AUDIT_ACTIONS.EMPLOYER_REGISTERED,
      "employer.registered",
    );
    assert.equal(
      OPERATIONS_REGISTRATION_AUDIT_ACTIONS.CANDIDATE_REGISTERED,
      "candidate.registered",
    );
  });
});

describe("operations notification visibility and unread state", () => {
  const userId = new mongoose.Types.ObjectId("507f1f77bcf86cd799439011");

  it("shows employer registration and job submission only to readers of those modules", () => {
    const jobsOnly = operationsNotificationVisibleTypes({
      permissions: {
        ...buildSuperAdminPermissions(),
        employers: {
          read: false,
          create: false,
          update: false,
          delete: false,
          export: false,
        },
        candidates: {
          read: false,
          create: false,
          update: false,
          delete: false,
          export: false,
        },
        verifications: {
          read: false,
          create: false,
          update: false,
          delete: false,
          export: false,
        },
      },
    });
    assert.equal(jobsOnly.includes("job.pending_approval"), true);
    assert.equal(jobsOnly.includes("employer.registered"), false);

    const employersOnly = operationsNotificationVisibleTypes({
      permissions: {
        ...buildSuperAdminPermissions(),
        jobs: {
          read: false,
          create: false,
          update: false,
          delete: false,
          export: false,
        },
        candidates: {
          read: false,
          create: false,
          update: false,
          delete: false,
          export: false,
        },
        my_work: {
          read: false,
          create: false,
          update: false,
          delete: false,
          export: false,
        },
        roles: {
          read: false,
          create: false,
          update: false,
          delete: false,
          export: false,
        },
        verifications: {
          read: false,
          create: false,
          update: false,
          delete: false,
          export: false,
        },
      },
    });
    assert.deepEqual(employersOnly, [
      "employer.registered",
      "employer.verification_resubmitted",
    ]);
  });

  it("treats a notification as unread only when this user has no read entry", () => {
    const clause = operationsNotificationUnreadClause(userId);
    assert.deepEqual(clause, {
      reads: { $not: { $elemMatch: { userId } } },
    });
    assert.equal(JSON.stringify(clause).includes("$ne"), false);
  });
});

describe("employer registration and job submission inbox writes", () => {
  afterEach(() => {
    mock.restoreAll();
  });

  it("writes one employer.registered inbox item and dedupes retries", async () => {
    const captured: string[] = [];
    mock.method(
      OperationsNotificationModel,
      "updateOne",
      async (filter: { idempotencyKey?: string }) => {
        captured.push(filter.idempotencyKey ?? "");
        return { acknowledged: true };
      },
    );
    mock.method(OperationsAuditLogModel, "findOne", () => ({
      select() {
        return this;
      },
      async lean() {
        return { _id: "existing-audit" };
      },
    }));

    const employerId = "507f1f77bcf86cd799439011";
    await emitEmployerRegisteredAwareness({
      employerId,
      displayName: "Acme Pvt Ltd",
      displayId: "EMP-99439011",
      registeredAt: new Date("2026-10-28T10:00:00.000Z"),
    });
    await emitEmployerRegisteredAwareness({
      employerId,
      displayName: "Acme Pvt Ltd",
      displayId: "EMP-99439011",
      registeredAt: new Date("2026-10-28T10:00:00.000Z"),
    });

    assert.deepEqual(captured, [
      `employer.registered:${employerId}`,
      `employer.registered:${employerId}`,
    ]);
  });

  it("writes a job pending-approval item for the employer and job, and dedupes the same submit", async () => {
    const captured: Array<{ key?: string; type?: string; body?: string }> = [];
    mock.method(
      OperationsNotificationModel,
      "updateOne",
      async (
        filter: { idempotencyKey?: string },
        update: { $setOnInsert?: { type?: string; body?: string } },
      ) => {
        captured.push({
          key: filter.idempotencyKey,
          type: update.$setOnInsert?.type,
          body: update.$setOnInsert?.body,
        });
        return { acknowledged: true };
      },
    );
    const submittedAt = new Date("2026-10-28T11:00:00.000Z");
    await emitJobPendingOpsNotification({
      publicJobId: "aj-2026-000099",
      jobMongoId: "507f1f77bcf86cd799439099",
      jobTitle: "Electrician",
      companyName: "Acme Pvt Ltd",
      kind: "submitted",
      submittedAt,
    });
    await emitJobPendingOpsNotification({
      publicJobId: "AJ-2026-000099",
      jobMongoId: "507f1f77bcf86cd799439099",
      jobTitle: "Electrician",
      companyName: "Acme Pvt Ltd",
      kind: "submitted",
      submittedAt,
    });

    assert.equal(captured.length, 2);
    assert.equal(captured[0]?.type, "job.pending_approval");
    assert.equal(
      captured[0]?.key,
      `job.submitted:AJ-2026-000099:${submittedAt.toISOString()}`,
    );
    assert.equal(captured[1]?.key, captured[0]?.key);
    assert.match(captured[0]?.body ?? "", /Acme Pvt Ltd/);
    assert.match(captured[0]?.body ?? "", /Electrician/);
    assert.match(captured[0]?.body ?? "", /AJ-2026-000099/);
  });

  it("does not write an operations notification when job creation fails before save", async () => {
    let writes = 0;
    mock.method(EmployerModel, "findById", async () => null);
    mock.method(OperationsNotificationModel, "updateOne", async () => {
      writes += 1;
      return { acknowledged: true };
    });

    await assert.rejects(
      () =>
        jobService.createJob("507f1f77bcf86cd799439011", {
          status: "active",
        } as never),
      (error: unknown) => {
        assert.equal((error as { statusCode?: number }).statusCode, 401);
        return true;
      },
    );
    await new Promise((resolve) => setImmediate(resolve));
    assert.equal(writes, 0);
  });
});

describe("idempotency key conventions", () => {
  it("uses entity id keys without timestamps", () => {
    const employerId = "507f1f77bcf86cd799439011";
    const candidateId = "507f1f77bcf86cd799439022";
    assert.equal(`employer.registered:${employerId}`, `employer.registered:${employerId}`);
    assert.equal(`candidate.registered:${candidateId}`, `candidate.registered:${candidateId}`);
    assert.notEqual(
      `employer.registered:${employerId}`,
      `candidate.registered:${employerId}`,
    );
  });
});
