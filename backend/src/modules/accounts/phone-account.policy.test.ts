import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  InMemoryPhoneRegistry,
  normalizeRegisteredWhatsappNumber,
  phoneAlreadyRegisteredError,
  phoneAlreadyRegisteredMessage,
  resolvePhoneIdentityReservation,
  resolvePhoneRegistrationDecision,
} from "./phone-account.policy.js";

describe("normalizeRegisteredWhatsappNumber", () => {
  it("treats formatted Indian numbers as the same 10-digit value", () => {
    const expected = "6303582546";
    assert.equal(normalizeRegisteredWhatsappNumber("6303582546"), expected);
    assert.equal(normalizeRegisteredWhatsappNumber("+916303582546"), expected);
    assert.equal(normalizeRegisteredWhatsappNumber("+91 6303582546"), expected);
    assert.equal(normalizeRegisteredWhatsappNumber("91 6303582546"), expected);
    assert.equal(normalizeRegisteredWhatsappNumber("63035 82546"), expected);
    assert.equal(normalizeRegisteredWhatsappNumber("630-358-2546"), expected);
    assert.equal(normalizeRegisteredWhatsappNumber("06303582546"), expected);
  });
});

describe("resolvePhoneRegistrationDecision", () => {
  it("allows a new job seeker when no account exists", () => {
    assert.deepEqual(
      resolvePhoneRegistrationDecision({
        intendedKind: "job_seeker",
        jobSeeker: null,
        employer: null,
      }),
      { action: "allow", resumeAccountId: null },
    );
  });

  it("allows a new employer when no account exists", () => {
    assert.deepEqual(
      resolvePhoneRegistrationDecision({
        intendedKind: "employer",
        jobSeeker: null,
        employer: null,
      }),
      { action: "allow", resumeAccountId: null },
    );
  });

  it("rejects employer registration when a job seeker exists", () => {
    const decision = resolvePhoneRegistrationDecision({
      intendedKind: "employer",
      jobSeeker: { id: "seeker-1", registrationComplete: true },
      employer: null,
    });
    assert.deepEqual(decision, {
      action: "reject",
      existingKind: "job_seeker",
    });
  });

  it("rejects job seeker registration when an employer exists", () => {
    const decision = resolvePhoneRegistrationDecision({
      intendedKind: "job_seeker",
      jobSeeker: null,
      employer: { id: "employer-1", registrationComplete: true },
    });
    assert.deepEqual(decision, { action: "reject", existingKind: "employer" });
  });

  it("rejects a second employer type on a completed employer number", () => {
    const decision = resolvePhoneRegistrationDecision({
      intendedKind: "employer",
      jobSeeker: null,
      employer: { id: "company-1", registrationComplete: true },
    });
    assert.equal(decision.action, "reject");
  });

  it("rejects a job seeker when a consultancy employer exists", () => {
    const decision = resolvePhoneRegistrationDecision({
      intendedKind: "job_seeker",
      jobSeeker: null,
      employer: { id: "consultancy-1", registrationComplete: true },
    });
    assert.deepEqual(decision, { action: "reject", existingKind: "employer" });
  });

  it("rejects a pending opposite account", () => {
    const decision = resolvePhoneRegistrationDecision({
      intendedKind: "employer",
      jobSeeker: { id: "seeker-pending", registrationComplete: false },
      employer: null,
    });
    assert.equal(decision.action, "reject");
  });

  it("allows the same pending job seeker registration to resume", () => {
    const decision = resolvePhoneRegistrationDecision({
      intendedKind: "job_seeker",
      jobSeeker: { id: "seeker-pending", registrationComplete: false },
      employer: null,
    });
    assert.deepEqual(decision, {
      action: "allow",
      resumeAccountId: "seeker-pending",
    });
  });
});

describe("resolvePhoneIdentityReservation", () => {
  it("reclaims an identity whose employer document no longer exists", () => {
    assert.deepEqual(
      resolvePhoneIdentityReservation({
        intendedKind: "employer",
        liveResumeAccountId: null,
        linkedAccount: null,
      }),
      { action: "reclaim" },
    );
  });

  it("reclaims an identity that points at an account that no longer owns the phone", () => {
    assert.deepEqual(
      resolvePhoneIdentityReservation({
        intendedKind: "employer",
        liveResumeAccountId: null,
        linkedAccount: {
          id: "old-employer",
          kind: "employer",
          ownsThisPhone: false,
          registrationComplete: true,
        },
      }),
      { action: "reclaim" },
    );
  });

  it("resumes an incomplete employer that still owns the phone", () => {
    assert.deepEqual(
      resolvePhoneIdentityReservation({
        intendedKind: "employer",
        liveResumeAccountId: null,
        linkedAccount: {
          id: "pending-employer",
          kind: "employer",
          ownsThisPhone: true,
          registrationComplete: false,
        },
      }),
      { action: "resume", resumeAccountId: "pending-employer" },
    );
  });

  it("rejects a completed employer that still owns the phone", () => {
    assert.deepEqual(
      resolvePhoneIdentityReservation({
        intendedKind: "employer",
        liveResumeAccountId: null,
        linkedAccount: {
          id: "live-employer",
          kind: "employer",
          ownsThisPhone: true,
          registrationComplete: true,
        },
      }),
      { action: "reject", existingKind: "employer" },
    );
  });

  it("rejects a live job seeker identity when registering an employer", () => {
    assert.deepEqual(
      resolvePhoneIdentityReservation({
        intendedKind: "employer",
        liveResumeAccountId: null,
        linkedAccount: {
          id: "seeker-1",
          kind: "job_seeker",
          ownsThisPhone: true,
          registrationComplete: true,
        },
      }),
      { action: "reject", existingKind: "job_seeker" },
    );
  });
});

describe("phone already registered errors", () => {
  it("uses a login message that names the existing account type", () => {
    const error = phoneAlreadyRegisteredError("job_seeker");
    assert.equal(error.statusCode, 409);
    assert.equal(error.message, phoneAlreadyRegisteredMessage("job_seeker"));
    assert.match(error.message, /Job Seeker/);
    assert.match(error.message, /log in/i);
    assert.equal(
      phoneAlreadyRegisteredError("employer").message.includes("Employer"),
      true,
    );
  });
});

describe("one phone reservation", () => {
  it("creates only one account when two registrations race", async () => {
    const registry = new InMemoryPhoneRegistry();
    const phone = "6303582546";
    const results = await Promise.allSettled([
      registry.reserve(phone, "job_seeker"),
      registry.reserve(phone, "employer"),
    ]);

    const fulfilled = results.filter((result) => result.status === "fulfilled");
    const rejected = results.filter((result) => result.status === "rejected");
    assert.equal(fulfilled.length, 1);
    assert.equal(rejected.length, 1);
    assert.match(
      String((rejected[0] as PromiseRejectedResult).reason),
      /already registered/i,
    );
  });

  it("rejects a second claim after the first account is stored", async () => {
    const registry = new InMemoryPhoneRegistry();
    await registry.reserve("6303582546", "employer");
    await assert.rejects(
      () => registry.reserve("6303582546", "job_seeker"),
      /Employer account/,
    );
  });
});
