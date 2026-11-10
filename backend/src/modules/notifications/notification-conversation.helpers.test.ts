import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  INTERVIEW_EVENT_TYPES,
  planConversationTypeFilters,
  sliceConversationTimelinePage,
  type ConversationTimelinePage,
} from "./notification-conversation.helpers.js";

function timeline(count: number): Array<{ id: string }> {
  return Array.from({ length: count }, (_, index) => ({ id: `n${index + 1}` }));
}

describe("sliceConversationTimelinePage", () => {
  it("returns the newest page first, in chronological order", () => {
    const page = sliceConversationTimelinePage(timeline(120), { limit: 50 });
    assert.equal(page.items.length, 50);
    assert.equal(page.items[0]?.id, "n71");
    assert.equal(page.items[49]?.id, "n120");
    assert.equal(page.hasOlder, true);
    assert.equal(page.olderCursor, "n71");
  });

  it("walks older pages by cursor without skips or duplicates", () => {
    const items = timeline(120);
    const seen: string[] = [];
    let before: string | null = null;
    let guard = 0;
    do {
      const page: ConversationTimelinePage<{ id: string }> =
        sliceConversationTimelinePage(items, { limit: 50, before });
      seen.unshift(...page.items.map((item) => item.id));
      before = page.hasOlder ? page.olderCursor : null;
      guard += 1;
    } while (before && guard < 10);

    assert.equal(guard, 3);
    assert.deepEqual(
      seen,
      items.map((item) => item.id),
    );
  });

  it("keeps cursors stable when newer items arrive between requests", () => {
    const first = sliceConversationTimelinePage(timeline(60), { limit: 50 });
    const grown = timeline(65);
    const older = sliceConversationTimelinePage(grown, {
      limit: 50,
      before: first.olderCursor,
    });
    assert.deepEqual(
      older.items.map((item) => item.id),
      timeline(10).map((item) => item.id),
    );
    assert.equal(older.hasOlder, false);
    assert.equal(older.olderCursor, null);
  });

  it("returns an empty page for an unknown cursor", () => {
    const page = sliceConversationTimelinePage(timeline(10), {
      limit: 5,
      before: "missing",
    });
    assert.deepEqual(page, { items: [], hasOlder: false, olderCursor: null });
  });

  it("supports newest-first numeric pages", () => {
    const page = sliceConversationTimelinePage(timeline(12), {
      limit: 5,
      page: 2,
    });
    assert.deepEqual(
      page.items.map((item) => item.id),
      ["n3", "n4", "n5", "n6", "n7"],
    );
    assert.equal(page.hasOlder, true);
  });

  it("handles short threads", () => {
    const page = sliceConversationTimelinePage(timeline(3), { limit: 50 });
    assert.equal(page.items.length, 3);
    assert.equal(page.hasOlder, false);
    assert.equal(page.olderCursor, null);
  });
});

describe("planConversationTypeFilters", () => {
  it("routes seeker-only employer actions to application statusHistory", () => {
    const plan = planConversationTypeFilters([
      "all",
      "application_shortlisted",
      "all",
    ]);
    assert.deepEqual(plan.notificationTypes, []);
    assert.deepEqual(plan.statusHistoryStatuses, ["shortlisted"]);

    assert.deepEqual(
      planConversationTypeFilters(["application_viewed"]).statusHistoryStatuses,
      ["viewed"],
    );
    assert.deepEqual(
      planConversationTypeFilters(["application_under_review"])
        .statusHistoryStatuses,
      ["under_review"],
    );
  });

  it("maps seeker submit/withdraw events to the employer mirror types", () => {
    assert.deepEqual(
      planConversationTypeFilters(["application_submitted"]).notificationTypes,
      ["application_received"],
    );
    assert.deepEqual(
      planConversationTypeFilters(["application_withdrawn"]).notificationTypes,
      ["candidate_withdrawn"],
    );
  });

  it("keeps employer notification types and de-duplicates", () => {
    const plan = planConversationTypeFilters([
      "offer_sent",
      "interview_scheduled",
      "offer_sent",
      undefined,
    ]);
    assert.deepEqual(plan.notificationTypes, ["offer_sent", "interview_scheduled"]);
    assert.deepEqual(plan.statusHistoryStatuses, []);
  });

  it("combines notification and statusHistory conditions", () => {
    const plan = planConversationTypeFilters([
      "interview_scheduled",
      "application_viewed",
      "application_received",
    ]);
    assert.deepEqual(plan.notificationTypes, [
      "interview_scheduled",
      "application_received",
    ]);
    assert.deepEqual(plan.statusHistoryStatuses, ["viewed"]);
  });
});

describe("INTERVIEW_EVENT_TYPES", () => {
  it("covers every interview lifecycle notification", () => {
    assert.deepEqual([...INTERVIEW_EVENT_TYPES].sort(), [
      "interview_cancelled",
      "interview_completed",
      "interview_scheduled",
      "interview_updated",
    ]);
  });
});
