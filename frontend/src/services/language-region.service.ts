import { getApiUrl } from "@/constants/env";
import type { LocationLanguageRegion } from "@/i18n/location-language-map";

export type LanguageRegion = LocationLanguageRegion & {
  city: string;
};

/** About 111 metres. Precise enough for a state, and not a street address. */
export function roundCoordinate(value: number): number {
  return Math.round(value * 1000) / 1000;
}

function asString(value: unknown, max = 120): string {
  if (typeof value !== "string") {
    return "";
  }
  return value.trim().slice(0, max);
}

export function parseLanguageRegionPayload(payload: unknown): LanguageRegion | null {
  if (!payload || typeof payload !== "object") {
    return null;
  }
  const record = payload as Record<string, unknown>;
  const data =
    record.data && typeof record.data === "object"
      ? (record.data as Record<string, unknown>)
      : record;
  const countryCode = asString(data.countryCode, 8).toUpperCase();
  const country = asString(data.country);
  const state = asString(data.state);
  const stateCode = asString(data.stateCode, 16).toUpperCase();
  const city = asString(data.city);
  if (!countryCode && !country && !state && !stateCode) {
    return null;
  }
  return { countryCode, country, state, stateCode, city };
}

/**
 * Asks the AsliJobs API to turn a one-time position into a state and country.
 * Coordinates are rounded before they leave the browser and are not stored.
 */
export function reverseGeocodeLanguageRegionFromCoords(coords: {
  latitude: number;
  longitude: number;
}): Promise<LanguageRegion | null> {
  return reverseGeocodeLanguageRegion(coords.latitude, coords.longitude);
}

export async function reverseGeocodeLanguageRegion(
  latitude: number,
  longitude: number,
  options?: { timeoutMs?: number },
): Promise<LanguageRegion | null> {
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
    return null;
  }
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), options?.timeoutMs ?? 15_000);
  try {
    const response = await fetch(`${getApiUrl()}/geo/region`, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        lat: roundCoordinate(latitude),
        lon: roundCoordinate(longitude),
      }),
      signal: controller.signal,
      credentials: "omit",
    });
    if (!response.ok) {
      return null;
    }
    return parseLanguageRegionPayload(await response.json());
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}
