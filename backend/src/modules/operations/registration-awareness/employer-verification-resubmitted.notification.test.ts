import assert from "node:assert/strict";
import { afterEach, describe, it, mock } from "node:test";
import { OPERATIONS_NOTIFICATION_TYPES } from "./operations-registration-awareness.constants.js";
import { OperationsNotificationModel } from "./operations-notification.model.js";
import { emitEmployerVerificationResubmittedNotification } from "./operations-registration-emit.js";

type CapturedUpdate = {
  filter: { idempotencyKey?: string };
  insert: {
    type?: string;
    title?: string;
    body?: string;
    entityType?: string;
    entityId?: string;
    actionPath?: string;
    metadata?: { kind?: string; submittedAt?: string };
  };
};

describe("employer verification resubmitted inbox notification", () => {
  afterEach(() => {
    mock.restoreAll();
  });

  it("is a known operations inbox type", () => {
    assert.equal(
      OPERATIONS_NOTIFICATION_TYPES.includes("employer.verification_resubmitted"),
      true,
    );
  });

  it("creates one inbox item per resubmit cycle", async () => {
    const captured: CapturedUpdate[] = [];
    mock.method(
      OperationsNotificationModel,
      "updateOne",
      async (
        filter: CapturedUpdate["filter"],
        update: { $setOnInsert?: CapturedUpdate["insert"] },
      ) => {
        captured.push({
          filter,
          insert: update.$setOnInsert ?? {},
        });
        return { acknowledged: true };
      },
    );

    const employerId = "507f1f77bcf86cd799439011";
    const firstSubmittedAt = new Date("2026-10-08T10:00:00.000Z");
    const secondSubmittedAt = new Date("2026-10-08T12:00:00.000Z");

    await emitEmployerVerificationResubmittedNotification({
      employerId,
      displayName: "veer",
      submittedAt: firstSubmittedAt,
    });
    await emitEmployerVerificationResubmittedNotification({
      employerId,
      displayName: "veer",
      submittedAt: firstSubmittedAt,
    });
    await emitEmployerVerificationResubmittedNotification({
      employerId,
      displayName: "veer",
      submittedAt: secondSubmittedAt,
    });

    assert.equal(captured.length, 3);
    assert.equal(
      captured[0]?.filter.idempotencyKey,
      `employer.verification_resubmitted:${employerId}:${firstSubmittedAt.toISOString()}`,
    );
    assert.equal(
      captured[1]?.filter.idempotencyKey,
      captured[0]?.filter.idempotencyKey,
    );
    assert.notEqual(
      captured[2]?.filter.idempotencyKey,
      captured[0]?.filter.idempotencyKey,
    );
    assert.equal(captured[0]?.insert.type, "employer.verification_resubmitted");
    assert.equal(captured[0]?.insert.entityType, "employer");
    assert.equal(captured[0]?.insert.entityId, employerId);
    assert.equal(
      captured[0]?.insert.actionPath,
      `/operations/verifications/${employerId}`,
    );
    assert.match(captured[0]?.insert.body ?? "", /veer/);
    assert.equal(captured[0]?.insert.metadata?.kind, "resubmitted");
  });

  it("does not throw when the inbox write fails", async () => {
    mock.method(OperationsNotificationModel, "updateOne", async () => {
      throw new Error("mongo unavailable");
    });

    await emitEmployerVerificationResubmittedNotification({
      employerId: "507f1f77bcf86cd799439011",
      displayName: "veer",
      submittedAt: new Date("2026-10-08T10:00:00.000Z"),
    });
  });
});
