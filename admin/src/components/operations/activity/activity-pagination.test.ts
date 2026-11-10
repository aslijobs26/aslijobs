import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  activityPageRange,
  activityParams,
  filterActivity,
  initialActivityView,
  newerActivityPage,
  olderActivityPage,
  resizeActivity,
  type ActivityView,
} from "./activity-pagination.ts";

type Category = "account" | "job";

describe("activity pagination", () => {
  it("starts on the newest page with no cursor", () => {
    const view = initialActivityView<Category>();
    assert.deepEqual(activityParams(view), { limit: 20, category: "all", cursor: "" });
    assert.deepEqual(activityPageRange(view, 0), { from: 0, to: 0 });
  });

  it("walks older and newer pages and reports the visible range", () => {
    let view: ActivityView<Category> = initialActivityView(10);
    view = olderActivityPage(view, "c1");
    view = olderActivityPage(view, "c2");
    assert.equal(activityParams(view).cursor, "c2");
    assert.deepEqual(activityPageRange(view, 7), { from: 21, to: 27 });

    view = newerActivityPage(view);
    assert.equal(activityParams(view).cursor, "c1");
    view = newerActivityPage(newerActivityPage(view));
    assert.deepEqual(view.cursors, [""]);
  });

  it("ignores missing or repeated cursors", () => {
    const view = olderActivityPage(initialActivityView<Category>(), "c1");
    assert.equal(olderActivityPage(view, null), view);
    assert.equal(olderActivityPage(view, "c1"), view);
  });

  it("resets to the newest page when the filter or page size changes", () => {
    const paged = olderActivityPage(initialActivityView<Category>(), "c1");
    assert.deepEqual(filterActivity(paged, "job"), {
      limit: 20,
      category: "job",
      cursors: [""],
    });
    assert.deepEqual(resizeActivity(paged, 50), {
      limit: 50,
      category: "all",
      cursors: [""],
    });
  });
});
