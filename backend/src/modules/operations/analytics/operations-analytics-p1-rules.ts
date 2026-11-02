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

export function attributionHasValue(touch: AttributionTouch): boolean {
  return Object.values(touch).some((value) => value.trim().length > 0);
}

/**
 * First-touch is kept once it exists. Session attribution follows the current visit
 * and does not replace the original source.
 * A dimension with no value is Unknown. No UTM and no referrer is Direct.
 */
export function resolveAttribution(input: {
  storedFirst: AttributionTouch | null;
  current: AttributionTouch;
  referrerHost: string;
}): { first: AttributionTouch; session: AttributionTouch; sourceLabel: string } {
  const current = input.current;
  const first =
    input.storedFirst && attributionHasValue(input.storedFirst)
      ? input.storedFirst
      : attributionHasValue(current) || input.referrerHost.trim()
        ? current
        : emptyAttribution();
  const sourceLabel = first.source.trim()
    ? first.source.trim()
    : input.referrerHost.trim()
      ? input.referrerHost.trim()
      : "Direct";
  return { first, session: current, sourceLabel };
}

export function dimensionLabel(value: string): string {
  const trimmed = value.trim();
  return trimmed || "Unknown";
}

export type CountedStage = {
  key: string;
  count: number | null;
};

export function withStageDropOff<T extends CountedStage>(
  stages: T[],
): Array<T & { dropOff: number | null; conversionPercent: number | null }> {
  return stages.map((stage, index) => {
    if (index === 0) {
      return {
        ...stage,
        dropOff: null,
        conversionPercent: stage.count == null ? null : 100,
      };
    }
    const previous = stages[index - 1];
    if (stage.count == null || !previous || previous.count == null) {
      return { ...stage, dropOff: null, conversionPercent: null };
    }
    return {
      ...stage,
      dropOff: Math.max(previous.count - stage.count, 0),
      conversionPercent:
        previous.count === 0
          ? null
          : Math.round((stage.count / previous.count) * 1000) / 10,
    };
  });
}

export function repeatEmployerCount(
  pairs: Array<{ employerId: string; jobId: string }>,
): number {
  const jobs = new Map<string, Set<string>>();
  for (const pair of pairs) {
    if (!pair.employerId || !pair.jobId) continue;
    const set = jobs.get(pair.employerId) ?? new Set<string>();
    set.add(pair.jobId);
    jobs.set(pair.employerId, set);
  }
  let repeat = 0;
  for (const set of jobs.values()) {
    if (set.size >= 2) repeat += 1;
  }
  return repeat;
}

export function percentOrNull(part: number, whole: number): number | null {
  if (whole <= 0) return null;
  return Math.round((part / whole) * 1000) / 10;
}
