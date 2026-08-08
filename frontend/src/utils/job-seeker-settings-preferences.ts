export type JobSeekerAppPreferenceKey =
  | "darkMode"
  | "dataSaver"
  | "showJobRecommendations"
  | "showAiTips";

export type JobSeekerAppPreferences = Record<JobSeekerAppPreferenceKey, boolean>;

const DEFAULT_PREFERENCES: JobSeekerAppPreferences = {
  darkMode: false,
  dataSaver: true,
  showJobRecommendations: true,
  showAiTips: true,
};

function storageKey(jobSeekerId: string): string {
  return `aslijobs.job-seeker.settings.prefs.${jobSeekerId}`;
}

export function getJobSeekerAppPreferences(
  jobSeekerId: string,
): JobSeekerAppPreferences {
  if (typeof window === "undefined" || !jobSeekerId) {
    return { ...DEFAULT_PREFERENCES };
  }

  try {
    const raw = window.localStorage.getItem(storageKey(jobSeekerId));
    if (!raw) {
      return { ...DEFAULT_PREFERENCES };
    }
    const parsed = JSON.parse(raw) as Partial<JobSeekerAppPreferences>;
    return {
      ...DEFAULT_PREFERENCES,
      ...parsed,
    };
  } catch {
    return { ...DEFAULT_PREFERENCES };
  }
}

export function setJobSeekerAppPreference(
  jobSeekerId: string,
  key: JobSeekerAppPreferenceKey,
  value: boolean,
): JobSeekerAppPreferences {
  const next = {
    ...getJobSeekerAppPreferences(jobSeekerId),
    [key]: value,
  };
  if (typeof window !== "undefined" && jobSeekerId) {
    window.localStorage.setItem(storageKey(jobSeekerId), JSON.stringify(next));
  }
  return next;
}

/** Clears only safe client-side temporary data for this job seeker. */
export function clearJobSeekerSafeCache(jobSeekerId: string): void {
  if (typeof window === "undefined") {
    return;
  }

  const prefixes = [
    "aslijobs.job-seeker.temp.",
    "aslijobs.job-seeker.draft.",
    "aslijobs.job-seeker.cache.",
  ];

  const keysToRemove: string[] = [];
  for (let i = 0; i < window.localStorage.length; i += 1) {
    const key = window.localStorage.key(i);
    if (!key) {
      continue;
    }
    if (prefixes.some((prefix) => key.startsWith(prefix))) {
      keysToRemove.push(key);
    }
    if (
      jobSeekerId &&
      key.includes(jobSeekerId) &&
      key.includes(".cache.")
    ) {
      keysToRemove.push(key);
    }
  }

  for (const key of keysToRemove) {
    window.localStorage.removeItem(key);
  }

  try {
    window.sessionStorage.removeItem("aslijobs.job-seeker.ui-temp");
  } catch {
    // ignore
  }
}
