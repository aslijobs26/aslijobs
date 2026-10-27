export function placeAnchoredMenu(
  anchor: DOMRect,
  size: { width: number; height: number },
  prefer: "below" | "above",
): { top: number; left: number } {
  const margin = 8;
  const gap = 6;
  const viewportWidth = window.innerWidth;
  const viewportHeight = window.innerHeight;
  const width = Math.min(size.width, viewportWidth - margin * 2);
  const height = Math.min(size.height, viewportHeight - margin * 2);

  let left = anchor.right - width;
  left = Math.min(Math.max(margin, left), viewportWidth - width - margin);

  const below = anchor.bottom + gap;
  const above = anchor.top - height - gap;
  let top = prefer === "above" ? above : below;
  if (prefer === "below" && below + height > viewportHeight - margin && above >= margin) {
    top = above;
  } else if (prefer === "above" && above < margin && below + height <= viewportHeight - margin) {
    top = below;
  }
  top = Math.min(Math.max(margin, top), viewportHeight - height - margin);

  return { top, left };
}
