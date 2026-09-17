import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  canAttachOrgChild,
  rollupPeopleCounts,
  wouldCreateOrgCycle,
} from "./operations-organization-domain.js";

describe("operations organization domain", () => {
  it("allows valid parent/child type combinations", () => {
    assert.equal(canAttachOrgChild("global", "country"), true);
    assert.equal(canAttachOrgChild("country", "region"), true);
    assert.equal(canAttachOrgChild("region", "state"), true);
    assert.equal(canAttachOrgChild("state", "city"), true);
    assert.equal(canAttachOrgChild("city", "office"), true);
    assert.equal(canAttachOrgChild("office", "city"), false);
    assert.equal(canAttachOrgChild("state", "country"), false);
  });

  it("detects hierarchy cycles", () => {
    assert.equal(wouldCreateOrgCycle("a", "a", []), true);
    assert.equal(wouldCreateOrgCycle("a", "b", ["a", "c"]), true);
    assert.equal(wouldCreateOrgCycle("a", "b", ["c"]), false);
    assert.equal(wouldCreateOrgCycle("a", null, []), false);
  });

  it("rolls people counts up the tree", () => {
    const rolled = rollupPeopleCounts([
      { id: "global", parentId: null, directCount: 2 },
      { id: "india", parentId: "global", directCount: 1 },
      { id: "south", parentId: "india", directCount: 0 },
      { id: "telangana", parentId: "south", directCount: 4 },
      { id: "ap", parentId: "south", directCount: 3 },
    ]);
    assert.equal(rolled.get("telangana"), 4);
    assert.equal(rolled.get("south"), 7);
    assert.equal(rolled.get("india"), 8);
    assert.equal(rolled.get("global"), 10);
  });
});
