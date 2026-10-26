import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  applicationStatusVariant,
  initialsFromName,
} from "./whatsapp-inbox-format.ts";

describe("whatsapp inbox format helpers", () => {
  it("builds initials from display names", () => {
    assert.equal(initialsFromName("Ravi Kumar"), "RK");
    assert.equal(initialsFromName("BlinkKart"), "BL");
  });

  it("maps application statuses to badge variants", () => {
    assert.equal(applicationStatusVariant("under_review"), "job");
    assert.equal(applicationStatusVariant("applied"), "candidate");
    assert.equal(applicationStatusVariant("rejected"), "high");
  });
});
