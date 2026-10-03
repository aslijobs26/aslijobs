import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { computeAnchoredDropdownPosition } from "./anchored-dropdown-position";

const trigger = { top: 16, bottom: 48, right: 300 };

describe("computeAnchoredDropdownPosition", () => {
  it("opens below at full height when the content fits", () => {
    const position = computeAnchoredDropdownPosition({
      anchorRect: trigger,
      contentWidth: 168,
      contentHeight: 250,
      viewportWidth: 360,
      viewportHeight: 640,
    });
    assert.equal(position.placement, "below");
    assert.equal(position.top, 56);
    assert.equal(position.left, 132);
    assert.ok(position.maxHeight >= 250);
  });

  it("caps height to the visible space below a top header on short viewports", () => {
    const position = computeAnchoredDropdownPosition({
      anchorRect: trigger,
      contentWidth: 168,
      contentHeight: 250,
      viewportWidth: 568,
      viewportHeight: 260,
    });
    assert.equal(position.placement, "below");
    assert.equal(position.maxHeight, 260 - 8 - 48 - 8);
    assert.ok(position.top + position.maxHeight <= 260);
  });

  it("opens above when there is more room above the trigger", () => {
    const position = computeAnchoredDropdownPosition({
      anchorRect: { top: 500, bottom: 532, right: 300 },
      contentWidth: 168,
      contentHeight: 250,
      viewportWidth: 360,
      viewportHeight: 640,
    });
    assert.equal(position.placement, "above");
    assert.equal(position.top, 500 - 8 - 250);
  });

  it("keeps a wide menu inside the left viewport edge", () => {
    const position = computeAnchoredDropdownPosition({
      anchorRect: { top: 16, bottom: 48, right: 200 },
      contentWidth: 330,
      contentHeight: 480,
      viewportWidth: 412,
      viewportHeight: 780,
    });
    assert.equal(position.left, 8);
    assert.equal(position.maxWidth, 412 - 16);
  });

  it("reserves the bottom safe-area inset", () => {
    const position = computeAnchoredDropdownPosition({
      anchorRect: trigger,
      contentWidth: 168,
      contentHeight: 400,
      viewportWidth: 390,
      viewportHeight: 400,
      insets: { top: 0, right: 0, bottom: 34, left: 0 },
    });
    assert.equal(position.maxHeight, 400 - 34 - 8 - 48 - 8);
  });
});
