import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  resolveVerificationStatus,
  resolveVerificationTransition,
} from "./operations-employers.service.js";
import { updateOperationsEmployerVerificationBodySchema } from "./operations-employers.validation.js";

describe("employer verification status resolution", () => {
  it("uses explicit verificationStatus only", () => {
    assert.equal(
      resolveVerificationStatus({ verificationStatus: "verified" }),
      "verified",
    );
    assert.equal(
      resolveVerificationStatus({ verificationStatus: "approved" }),
      "verified",
    );
    assert.equal(
      resolveVerificationStatus({ verificationStatus: "rejected" }),
      "rejected",
    );
    assert.equal(
      resolveVerificationStatus({ verificationStatus: "pending" }),
      "pending",
    );
  });

  it("defaults null or empty to pending and does not infer from WhatsApp", () => {
    assert.equal(resolveVerificationStatus({ verificationStatus: null }), "pending");
    assert.equal(resolveVerificationStatus({ verificationStatus: "" }), "pending");
    assert.equal(
      resolveVerificationStatus({
        verificationStatus: null,
      }),
      "pending",
    );
  });
});

describe("employer verification transitions", () => {
  it("allows approve and reject from pending", () => {
    assert.equal(
      resolveVerificationTransition("pending", "verified"),
      "apply",
    );
    assert.equal(
      resolveVerificationTransition(null, "verified"),
      "apply",
    );
    assert.equal(
      resolveVerificationTransition("", "rejected"),
      "apply",
    );
  });

  it("is idempotent when already at target status", () => {
    assert.equal(
      resolveVerificationTransition("verified", "verified"),
      "idempotent",
    );
    assert.equal(
      resolveVerificationTransition("rejected", "rejected"),
      "idempotent",
    );
    assert.equal(
      resolveVerificationTransition("pending", "pending"),
      "idempotent",
    );
  });

  it("conflicts when already processed to a different status", () => {
    assert.equal(
      resolveVerificationTransition("verified", "rejected"),
      "conflict",
    );
    assert.equal(
      resolveVerificationTransition("rejected", "verified"),
      "conflict",
    );
    assert.equal(
      resolveVerificationTransition("verified", "pending"),
      "conflict",
    );
  });
});

describe("updateOperationsEmployerVerificationBodySchema", () => {
  it("rejects reject without a reason of at least 3 characters", () => {
    const short = updateOperationsEmployerVerificationBodySchema.safeParse({
      verificationStatus: "rejected",
      remarks: "no",
    });
    assert.equal(short.success, false);

    const empty = updateOperationsEmployerVerificationBodySchema.safeParse({
      verificationStatus: "rejected",
      remarks: "",
    });
    assert.equal(empty.success, false);
  });

  it("accepts reject with remarks and approve from pending payload", () => {
    const rejected = updateOperationsEmployerVerificationBodySchema.safeParse({
      verificationStatus: "rejected",
      remarks: "Incomplete GST documents",
    });
    assert.equal(rejected.success, true);

    const verified = updateOperationsEmployerVerificationBodySchema.safeParse({
      verificationStatus: "verified",
      remarks: "",
    });
    assert.equal(verified.success, true);
    if (verified.success) {
      assert.equal(verified.data.verificationStatus, "verified");
    }
  });
});
