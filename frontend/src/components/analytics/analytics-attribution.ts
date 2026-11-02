export type AttributionTouch = {
  source: string;
  medium: string;
  campaign: string;
  content: string;
  term: string;
};

export function emptyAttribution(): AttributionTouch {
  return { source: "", medium: "", campaign: "", content: "", term: "" };
}

function hasValue(touch: AttributionTouch): boolean {
  return Object.values(touch).some((value) => value.trim().length > 0);
}

/** Keep the original first touch. Session fields follow the current visit only. */
export function resolveAttribution(input: {
  storedFirst: AttributionTouch | null;
  current: AttributionTouch;
  referrerHost: string;
}): { first: AttributionTouch; session: AttributionTouch; sourceLabel: string } {
  const first =
    input.storedFirst && hasValue(input.storedFirst)
      ? input.storedFirst
      : hasValue(input.current) || input.referrerHost.trim()
        ? input.current
        : emptyAttribution();
  const sourceLabel = first.source.trim()
    ? first.source.trim()
    : input.referrerHost.trim()
      ? input.referrerHost.trim()
      : "Direct";
  return { first, session: input.current, sourceLabel };
}
