import { siteLanguageFromValue } from "../constants/site-language";
import { openLanguagePrompt } from "./language-confirmation";
import { languageCodeForRegion, type LocationLanguageRegion } from "./location-language-map";
import {
  hasDeclinedLocationLanguageSuggestion,
  hasLocationLanguageAttempted,
  markLocationLanguageAttempted,
  readLanguagePreferenceSource,
} from "./location-language-preference";
import {
  canApplyDetectedLanguage,
  readSiteLanguage,
  writeDefaultSiteLanguage,
} from "./site-language";

export type LocationLanguageResult = "applied" | "suggested" | "skipped" | "fallback";

type GeolocationLike = {
  getCurrentPosition: (
    success: (position: {
      coords: { latitude: number; longitude: number; accuracy?: number };
    }) => void,
    error?: (error: { code: number }) => void,
    options?: {
      enableHighAccuracy?: boolean;
      timeout?: number;
      maximumAge?: number;
    },
  ) => void;
};

type PermissionQuery = {
  query: (descriptor: { name: "geolocation" }) => Promise<{ state: string }>;
};

export type LocationLanguageDeps = {
  geolocation?: GeolocationLike | null;
  permissions?: PermissionQuery | null;
  reverseGeocode?: (
    coords: { latitude: number; longitude: number },
  ) => Promise<LocationLanguageRegion | null>;
  isSecureContext?: boolean;
};

const PERMISSION_DENIED = 1;
const POSITION_TIMEOUT = 3;
const COARSE_ACCURACY_METERS = 300_000;

let inFlight: Promise<LocationLanguageResult> | null = null;

function note(message: string): void {
  if (process.env.NODE_ENV === "development") {
    console.info(`[aslijobs-language] ${message}`);
  }
}

export function shouldRequestLocationLanguage(): boolean {
  if (!canApplyDetectedLanguage()) {
    return false;
  }
  const source = readLanguagePreferenceSource();
  if (source === "automatic" || source === "default") {
    return false;
  }
  if (hasLocationLanguageAttempted()) {
    return false;
  }
  if (hasDeclinedLocationLanguageSuggestion()) {
    return false;
  }
  return true;
}

function readGeolocation(deps: LocationLanguageDeps): GeolocationLike | null {
  if (deps.geolocation !== undefined) {
    return deps.geolocation;
  }
  if (typeof navigator === "undefined" || !navigator.geolocation) {
    return null;
  }
  return navigator.geolocation as GeolocationLike;
}

function readPermissions(deps: LocationLanguageDeps): PermissionQuery | null {
  if (deps.permissions !== undefined) {
    return deps.permissions;
  }
  if (typeof navigator === "undefined" || !navigator.permissions?.query) {
    return null;
  }
  return navigator.permissions as PermissionQuery;
}

function readSecureContext(deps: LocationLanguageDeps): boolean {
  if (deps.isSecureContext !== undefined) {
    return deps.isSecureContext;
  }
  return typeof window === "undefined" ? false : window.isSecureContext;
}

async function readPermissionState(
  permissions: PermissionQuery | null,
): Promise<"granted" | "denied" | "prompt" | "unknown"> {
  if (!permissions?.query) {
    return "unknown";
  }
  try {
    const status = await permissions.query({ name: "geolocation" });
    if (
      status.state === "granted" ||
      status.state === "denied" ||
      status.state === "prompt"
    ) {
      return status.state;
    }
    return "unknown";
  } catch {
    return "unknown";
  }
}

function requestPosition(
  geolocation: GeolocationLike,
): Promise<{ latitude: number; longitude: number; accuracy?: number }> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      reject({ code: POSITION_TIMEOUT });
    }, 12_000);
    geolocation.getCurrentPosition(
      (position) => {
        clearTimeout(timer);
        resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
        });
      },
      (error) => {
        clearTimeout(timer);
        reject(error ?? { code: 2 });
      },
      {
        enableHighAccuracy: false,
        timeout: 10_000,
        maximumAge: 10 * 60 * 1000,
      },
    );
  });
}

async function detectLocationLanguage(
  deps: LocationLanguageDeps,
): Promise<LocationLanguageResult> {
  if (!canApplyDetectedLanguage()) {
    note("skipped because a saved language preference is already in effect");
    return "skipped";
  }
  if (!readSecureContext(deps)) {
    note("skipped because the page is not a secure context");
    markLocationLanguageAttempted();
    return "fallback";
  }

  const geolocation = readGeolocation(deps);
  if (!geolocation) {
    note("geolocation is not supported");
    markLocationLanguageAttempted();
    return "fallback";
  }

  const permission = await readPermissionState(readPermissions(deps));
  if (permission === "denied") {
    note("location permission is denied");
    writeDefaultSiteLanguage();
    markLocationLanguageAttempted();
    return "fallback";
  }

  let position: { latitude: number; longitude: number; accuracy?: number };
  try {
    position = await requestPosition(geolocation);
  } catch (error) {
    const code = (error as { code?: number } | null)?.code;
    if (code === PERMISSION_DENIED) {
      note("location permission was denied");
      writeDefaultSiteLanguage();
    } else if (code === POSITION_TIMEOUT) {
      note("location request timed out");
    } else {
      note("location is unavailable");
    }
    markLocationLanguageAttempted();
    return "fallback";
  }

  if (
    !Number.isFinite(position.latitude) ||
    !Number.isFinite(position.longitude) ||
    position.latitude < -90 ||
    position.latitude > 90 ||
    position.longitude < -180 ||
    position.longitude > 180 ||
    (typeof position.accuracy === "number" &&
      position.accuracy > COARSE_ACCURACY_METERS)
  ) {
    note("location reading was unusable");
    markLocationLanguageAttempted();
    return "fallback";
  }

  if (!deps.reverseGeocode) {
    note("reverse geocoding is not configured");
    markLocationLanguageAttempted();
    return "fallback";
  }

  let region: LocationLanguageRegion | null = null;
  try {
    region = await deps.reverseGeocode({
      latitude: position.latitude,
      longitude: position.longitude,
    });
  } catch {
    note("reverse geocoding failed");
    markLocationLanguageAttempted();
    return "fallback";
  }

  if (!region) {
    note("reverse geocoding did not return a region");
    markLocationLanguageAttempted();
    return "fallback";
  }

  const language = languageCodeForRegion(region);
  const option = siteLanguageFromValue(language ?? "en");
  markLocationLanguageAttempted();
  if (!language || option.code === readSiteLanguage().code) {
    note("detected language matches the current language");
    return "skipped";
  }
  const opened = openLanguagePrompt("location", option);
  if (!opened) {
    note("location suggestion was not shown");
    return "skipped";
  }
  note(`suggested ${option.code}`);
  return "suggested";
}

/**
 * One-shot location language detection for this page load.
 * A second call while the first is running joins the same attempt.
 */
export function runLocationLanguageDetection(
  deps: LocationLanguageDeps = {},
  options?: { force?: boolean },
): Promise<LocationLanguageResult> {
  if (inFlight) {
    return inFlight;
  }
  if (!options?.force && !shouldRequestLocationLanguage()) {
    return Promise.resolve("skipped");
  }
  const run = detectLocationLanguage(deps);
  inFlight = run;
  void run.finally(() => {
    if (inFlight === run) {
      inFlight = null;
    }
  });
  return run;
}

export function resetLocationLanguageDetectionForTests(): void {
  inFlight = null;
}
