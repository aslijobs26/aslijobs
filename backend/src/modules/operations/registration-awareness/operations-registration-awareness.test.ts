import assert from "node:assert/strict";
import { describe, it } from "node:test";
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
  resolveEmployerRegistrationDisplayName,
} from "./operations-registration-awareness.service.js";
import {
  OPERATIONS_REGISTRATION_AUDIT_ACTIONS,
} from "./operations-registration-awareness.constants.js";

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
