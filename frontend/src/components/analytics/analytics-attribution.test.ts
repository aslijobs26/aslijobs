import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { emptyAttribution, resolveAttribution } from "./analytics-attribution";

describe("analytics attribution", () => {
  it("keeps the first touch when a later visit has a different campaign", () => {
    const first = resolveAttribution({
      storedFirst: null,
      current: { source: "google", medium: "cpc", campaign: "hire", content: "", term: "" },
      referrerHost: "",
    });
    const later = resolveAttribution({
      storedFirst: first.first,
      current: { source: "facebook", medium: "paid", campaign: "other", content: "ad", term: "driver" },
      referrerHost: "facebook.com",
    });
    assert.equal(later.first.source, "google");
    assert.equal(later.first.campaign, "hire");
    assert.equal(later.session.source, "facebook");
    assert.equal(later.sourceLabel, "google");
  });

  it("labels a visit with no UTM and no referrer as Direct", () => {
    const result = resolveAttribution({
      storedFirst: null,
      current: emptyAttribution(),
      referrerHost: "",
    });
    assert.equal(result.sourceLabel, "Direct");
  });
});
