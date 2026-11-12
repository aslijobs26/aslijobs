import {
  SITE_LANGUAGE_AUTO_LOCATION_STORAGE_KEY,
  SITE_LANGUAGE_SOURCE_STORAGE_KEY,
  SITE_LOCATION_LANGUAGE_ATTEMPT_STORAGE_KEY,
  type SiteLanguagePreferenceSource,
} from "../constants/site-language";

const listeners = new Set<() => void>();

function notifyAutomaticLocationLanguage(): void {
  listeners.forEach((listener) => listener());
}

export function subscribeAutomaticLocationLanguage(
  onChange: () => void,
): () => void {
  listeners.add(onChange);
  if (typeof window === "undefined") {
    return () => {
      listeners.delete(onChange);
    };
  }
  const onStorage = (event: StorageEvent) => {
    if (event.key === SITE_LANGUAGE_AUTO_LOCATION_STORAGE_KEY) {
      onChange();
    }
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(onChange);
    window.removeEventListener("storage", onStorage);
  };
}

export function readLanguagePreferenceSource(): SiteLanguagePreferenceSource | null {
  if (typeof window === "undefined") {
    return null;
  }
  try {
    const value = window.localStorage.getItem(SITE_LANGUAGE_SOURCE_STORAGE_KEY);
    if (value === "manual" || value === "automatic" || value === "default") {
      return value;
    }
    return null;
  } catch {
    return null;
  }
}

export function writeLanguagePreferenceSource(
  source: SiteLanguagePreferenceSource,
): void {
  if (typeof window === "undefined") {
    return;
  }
  try {
    window.localStorage.setItem(SITE_LANGUAGE_SOURCE_STORAGE_KEY, source);
  } catch {
    // Ignore storage access errors.
  }
}

/** Missing or unreadable storage keeps automatic selection available. */
export function isAutomaticLocationLanguageEnabled(): boolean {
  if (typeof window === "undefined") {
    return true;
  }
  try {
    return window.localStorage.getItem(SITE_LANGUAGE_AUTO_LOCATION_STORAGE_KEY) !== "0";
  } catch {
    return true;
  }
}

export function setAutomaticLocationLanguageEnabled(enabled: boolean): void {
  if (typeof window === "undefined") {
    return;
  }
  try {
    window.localStorage.setItem(
      SITE_LANGUAGE_AUTO_LOCATION_STORAGE_KEY,
      enabled ? "1" : "0",
    );
  } catch {
    // Ignore storage access errors.
  }
  notifyAutomaticLocationLanguage();
}

export function hasLocationLanguageAttempted(): boolean {
  if (typeof window === "undefined") {
    return false;
  }
  try {
    return (
      window.sessionStorage.getItem(SITE_LOCATION_LANGUAGE_ATTEMPT_STORAGE_KEY) ===
      "1"
    );
  } catch {
    return false;
  }
}

export function markLocationLanguageAttempted(): void {
  if (typeof window === "undefined") {
    return;
  }
  try {
    window.sessionStorage.setItem(SITE_LOCATION_LANGUAGE_ATTEMPT_STORAGE_KEY, "1");
  } catch {
    // Ignore storage access errors.
  }
}
