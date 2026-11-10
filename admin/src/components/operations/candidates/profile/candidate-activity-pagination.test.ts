import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  candidateActivityPageRange,
  candidateActivityParams,
  filterCandidateActivity,
  initialCandidateActivityView,
  newerCandidateActivityPage,
  olderCandidateActivityPage,
  resizeCandidateActivity,
} from "./candidate-activity-pagination.ts";

describe("candidate activity cursor pagination", () => {
  it("starts on the newest page without a cursor", () => {
    const view = initialCandidateActivityView();
    assert.deepEqual(candidateActivityParams(view), {
      limit: 20,
      category: "all",
      cursor: "",
    });
    assert.deepEqual(candidateActivityPageRange(view, 20), { from: 1, to: 20 });
  });

  it("walks older pages with the server cursor and back again", () => {
    let view = initialCandidateActivityView(10);
    view = olderCandidateActivityPage(view, "cursor-1");
    view = olderCandidateActivityPage(view, "cursor-2");
    assert.equal(candidateActivityParams(view).cursor, "cursor-2");
    assert.deepEqual(candidateActivityPageRange(view, 4), { from: 21, to: 24 });

    view = newerCandidateActivityPage(view);
    assert.equal(candidateActivityParams(view).cursor, "cursor-1");
    view = newerCandidateActivityPage(view);
    view = newerCandidateActivityPage(view);
    assert.equal(candidateActivityParams(view).cursor, "");
  });

  it("ignores a missing or repeated next cursor", () => {
    const view = olderCandidateActivityPage(initialCandidateActivityView(), "cursor-1");
    assert.equal(olderCandidateActivityPage(view, null), view);
    assert.equal(olderCandidateActivityPage(view, "cursor-1"), view);
  });

  it("returns to the newest page when the filter or page size changes", () => {
    const paged = olderCandidateActivityPage(initialCandidateActivityView(), "cursor-1");
    const filtered = filterCandidateActivity(paged, "account");
    assert.deepEqual(candidateActivityParams(filtered), {
      limit: 20,
      category: "account",
      cursor: "",
    });
    const resized = resizeCandidateActivity(paged, 50);
    assert.deepEqual(candidateActivityParams(resized), {
      limit: 50,
      category: "all",
      cursor: "",
    });
  });

  it("reports an empty range when a page has no events", () => {
    assert.deepEqual(
      candidateActivityPageRange(initialCandidateActivityView(), 0),
      { from: 0, to: 0 },
    );
  });
});
