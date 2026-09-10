import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  assertEmployerStatusChangeAllowed,
  getAllowedEmployerStatusTransitions,
  isEmployerTerminalStatus,
  isValidEmployerStatusTransition,
} from "./employer-status-transition.js";

describe("employer status transition — did_not_join", () => {
  it("treats did_not_join as a terminal status", () => {
    assert.equal(isEmployerTerminalStatus("did_not_join"), true);
    assert.deepEqual(getAllowedEmployerStatusTransitions("did_not_join"), []);
  });

  it("allows selected → did_not_join", () => {
    assert.equal(
      isValidEmployerStatusTransition("selected", "did_not_join"),
      true,
    );
    assert.doesNotThrow(() =>
      assertEmployerStatusChangeAllowed("selected", "did_not_join"),
    );
  });

  it("blocks did_not_join from non-selected statuses", () => {
    assert.equal(
      isValidEmployerStatusTransition("offer_sent", "did_not_join"),
      false,
    );
    assert.throws(
      () => assertEmployerStatusChangeAllowed("offer_sent", "did_not_join"),
      /Invalid status transition/i,
    );
    assert.throws(
      () => assertEmployerStatusChangeAllowed("joined", "did_not_join"),
      /final status|cannot be updated/i,
    );
  });

  it("allows selected → joined alongside did_not_join", () => {
    const allowed = getAllowedEmployerStatusTransitions("selected");
    assert.ok(allowed.includes("joined"));
    assert.ok(allowed.includes("did_not_join"));
  });
});
