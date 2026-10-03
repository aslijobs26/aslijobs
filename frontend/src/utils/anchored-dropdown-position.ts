export type AnchoredDropdownPlacement = "below" | "above";

export interface AnchoredDropdownPosition {
  top: number;
  left: number;
  maxHeight: number;
  maxWidth: number;
  placement: AnchoredDropdownPlacement;
}

export interface ViewportInsets {
  top: number;
  right: number;
  bottom: number;
  left: number;
}

export interface AnchoredDropdownPositionInput {
  anchorRect: Pick<DOMRect, "top" | "bottom" | "right">;
  /** Natural (unconstrained) size of the dropdown content. */
  contentWidth: number;
  contentHeight: number;
  viewportWidth: number;
  viewportHeight: number;
  insets?: ViewportInsets;
  gap?: number;
  edgePadding?: number;
}

const ZERO_INSETS: ViewportInsets = { top: 0, right: 0, bottom: 0, left: 0 };

/**
 * Right-aligns a fixed-position dropdown to its trigger and keeps it inside the
 * visible viewport: opens below when the content fits (or below has more room),
 * otherwise above, and caps height to the chosen side so the list scrolls
 * instead of being clipped.
 */
export function computeAnchoredDropdownPosition({
  anchorRect,
  contentWidth,
  contentHeight,
  viewportWidth,
  viewportHeight,
  insets = ZERO_INSETS,
  gap = 8,
  edgePadding = 8,
}: AnchoredDropdownPositionInput): AnchoredDropdownPosition {
  const minLeft = insets.left + edgePadding;
  const maxRight = viewportWidth - insets.right - edgePadding;
  const maxWidth = Math.max(0, maxRight - minLeft);
  const width = Math.min(contentWidth, maxWidth);
  const left = Math.max(minLeft, Math.min(anchorRect.right - width, maxRight - width));

  const spaceBelow = Math.max(
    0,
    viewportHeight - insets.bottom - edgePadding - anchorRect.bottom - gap,
  );
  const spaceAbove = Math.max(0, anchorRect.top - gap - insets.top - edgePadding);
  const placement: AnchoredDropdownPlacement =
    contentHeight <= spaceBelow || spaceBelow >= spaceAbove ? "below" : "above";
  const maxHeight = placement === "below" ? spaceBelow : spaceAbove;
  const renderedHeight = Math.min(contentHeight, maxHeight);
  const top =
    placement === "below"
      ? anchorRect.bottom + gap
      : anchorRect.top - gap - renderedHeight;

  return { top, left, maxHeight, maxWidth, placement };
}

/** Reads `env(safe-area-inset-*)` in pixels; zero where unsupported. Browser-only. */
export function readSafeAreaInsets(): ViewportInsets {
  const probe = document.createElement("div");
  probe.style.cssText =
    "position:fixed;visibility:hidden;pointer-events:none;" +
    "padding:env(safe-area-inset-top,0px) env(safe-area-inset-right,0px) env(safe-area-inset-bottom,0px) env(safe-area-inset-left,0px);";
  document.body.appendChild(probe);
  const style = window.getComputedStyle(probe);
  const insets: ViewportInsets = {
    top: parseFloat(style.paddingTop) || 0,
    right: parseFloat(style.paddingRight) || 0,
    bottom: parseFloat(style.paddingBottom) || 0,
    left: parseFloat(style.paddingLeft) || 0,
  };
  probe.remove();
  return insets;
}

/** Visible viewport size, excluding mobile browser toolbars and the on-screen keyboard. */
export function readVisibleViewportSize(): { width: number; height: number } {
  const visualViewport = window.visualViewport;
  return {
    width: visualViewport?.width ?? window.innerWidth,
    height: visualViewport?.height ?? window.innerHeight,
  };
}
