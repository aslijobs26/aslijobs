import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { classifyNewReturningVisitors } from "./analytics-event.service.js";

describe("analytics-event visitor classification", () => {
  it("counts all as new when no prior visitors", () => {
    const result = classifyNewReturningVisitors(["a", "b", "c"], []);
    assert.equal(result.newVisitors, 3);
    assert.equal(result.returningVisitors, 0);
  });

  it("splits new vs returning correctly", () => {
    const result = classifyNewReturningVisitors(
      ["a", "b", "c"],
      ["a", "x"],
    );
    assert.equal(result.returningVisitors, 1);
    assert.equal(result.newVisitors, 2);
  });

  it("handles empty period", () => {
    const result = classifyNewReturningVisitors([], ["a"]);
    assert.equal(result.newVisitors, 0);
    assert.equal(result.returningVisitors, 0);
  });
});
