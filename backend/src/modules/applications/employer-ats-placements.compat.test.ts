import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  assertEmployerStatusChangeAllowed,
  isValidEmployerStatusTransition,
} from "./employer-status-transition.js";

describe("employer ATS ↔ placements compatibility", () => {
  it("maps selected → joined and selected → did_not_join", () => {
    assert.equal(isValidEmployerStatusTransition("selected", "joined"), true);
    assert.equal(
      isValidEmployerStatusTransition("selected", "did_not_join"),
      true,
    );
    assertEmployerStatusChangeAllowed("selected", "joined");
    assertEmployerStatusChangeAllowed("selected", "did_not_join");
  });

  it("does not treat did_not_join as rejected", () => {
    assert.equal(
      isValidEmployerStatusTransition("selected", "rejected"),
      true,
    );
    assert.equal(
      isValidEmployerStatusTransition("did_not_join", "joined"),
      false,
    );
    assert.equal(
      isValidEmployerStatusTransition("rejected", "joined"),
      false,
    );
    assert.equal(
      isValidEmployerStatusTransition("rejected", "did_not_join"),
      false,
    );
  });

  it("blocks concurrent-style invalid transitions after terminal status", () => {
    assert.throws(
      () => assertEmployerStatusChangeAllowed("joined", "did_not_join"),
    );
    assert.throws(
      () => assertEmployerStatusChangeAllowed("did_not_join", "joined"),
    );
  });
});
