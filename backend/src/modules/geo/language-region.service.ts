import { env } from "../../config/env.js";
import { HTTP_STATUS } from "../../constants/http-status.js";
import { AppError } from "../../middleware/error.middleware.js";
import {
  parseBigDataCloudRegion,
  parseNominatimRegion,
  roundCoordinate,
  type LanguageRegion,
} from "./language-region.parse.js";

const BIGDATACLOUD_CLIENT =
  "https://api.bigdatacloud.net/data/reverse-geocode-client";
const BIGDATACLOUD_SERVER = "https://api.bigdatacloud.net/data/reverse-geocode";
const USER_AGENT = "AsliJobs/1.0 (language-region; +https://aslijobs.com)";
const TIMEOUT_MS = 4_000;
const CACHE_TTL_MS = 12 * 60 * 60 * 1000;
const CACHE_MAX = 1_000;
const UPSTREAM_LIMIT = 120;
const UPSTREAM_WINDOW_MS = 60_000;

type ProviderName = "bigdatacloud" | "nominatim";

export type ReverseGeocodeDeps = {
  fetchImpl?: typeof fetch;
  endpoint?: string;
  apiKey?: string;
  provider?: ProviderName;
};

type CacheEntry = {
  expiresAt: number;
  region: LanguageRegion;
};

const cache = new Map<string, CacheEntry>();
const upstreamHits: number[] = [];

export function resetLanguageRegionClientForTests(): void {
  cache.clear();
  upstreamHits.length = 0;
}

function rememberUpstream(): boolean {
  const now = Date.now();
  while (upstreamHits.length > 0 && now - upstreamHits[0]! > UPSTREAM_WINDOW_MS) {
    upstreamHits.shift();
  }
  if (upstreamHits.length >= UPSTREAM_LIMIT) {
    return false;
  }
  upstreamHits.push(now);
  return true;
}

function readCache(key: string): LanguageRegion | null {
  const entry = cache.get(key);
  if (!entry) {
    return null;
  }
  if (entry.expiresAt <= Date.now()) {
    cache.delete(key);
    return null;
  }
  cache.delete(key);
  cache.set(key, entry);
  return entry.region;
}

function writeCache(key: string, region: LanguageRegion): void {
  if (cache.size >= CACHE_MAX) {
    const oldest = cache.keys().next().value;
    if (oldest) {
      cache.delete(oldest);
    }
  }
  cache.set(key, { expiresAt: Date.now() + CACHE_TTL_MS, region });
}

function resolveEndpoint(deps: ReverseGeocodeDeps): {
  urlBase: string;
  provider: ProviderName;
  apiKey: string;
} {
  if (deps.provider && deps.endpoint) {
    return {
      urlBase: deps.endpoint,
      provider: deps.provider,
      apiKey: deps.apiKey ?? "",
    };
  }
  const custom = env.REVERSE_GEOCODE_BASE_URL.trim();
  if (custom) {
    return { urlBase: custom, provider: "nominatim", apiKey: "" };
  }
  const apiKey = env.REVERSE_GEOCODE_API_KEY.trim();
  return {
    urlBase: apiKey ? BIGDATACLOUD_SERVER : BIGDATACLOUD_CLIENT,
    provider: "bigdatacloud",
    apiKey,
  };
}

function buildRequestUrl(
  latitude: number,
  longitude: number,
  endpoint: { urlBase: string; provider: ProviderName; apiKey: string },
): string {
  const url = new URL(endpoint.urlBase);
  if (endpoint.provider === "nominatim") {
    url.searchParams.set("format", "jsonv2");
    url.searchParams.set("addressdetails", "1");
    url.searchParams.set("zoom", "10");
    url.searchParams.set("lat", latitude.toFixed(3));
    url.searchParams.set("lon", longitude.toFixed(3));
    return url.toString();
  }
  url.searchParams.set("latitude", latitude.toFixed(3));
  url.searchParams.set("longitude", longitude.toFixed(3));
  url.searchParams.set("localityLanguage", "en");
  if (endpoint.apiKey) {
    url.searchParams.set("key", endpoint.apiKey);
  }
  return url.toString();
}

function unavailable(): AppError {
  return new AppError(
    "Language region is temporarily unavailable.",
    HTTP_STATUS.BAD_GATEWAY,
  );
}

/**
 * Resolves a coarse position to country, state, and city.
 * The rounded coordinates are used only for the upstream request and an
 * in-memory cache. They are not logged, stored, or returned.
 */
export async function reverseGeocodeLanguageRegion(
  latitude: number,
  longitude: number,
  deps: ReverseGeocodeDeps = {},
): Promise<LanguageRegion> {
  if (
    !Number.isFinite(latitude) ||
    !Number.isFinite(longitude) ||
    latitude < -90 ||
    latitude > 90 ||
    longitude < -180 ||
    longitude > 180
  ) {
    throw new AppError("A valid location is required.", HTTP_STATUS.BAD_REQUEST);
  }

  const lat = roundCoordinate(latitude);
  const lon = roundCoordinate(longitude);
  const cacheKey = `${lat.toFixed(3)},${lon.toFixed(3)}`;
  const cached = readCache(cacheKey);
  if (cached) {
    return cached;
  }
  if (!rememberUpstream()) {
    throw new AppError(
      "Language region is temporarily unavailable.",
      HTTP_STATUS.TOO_MANY_REQUESTS,
    );
  }

  const endpoint = resolveEndpoint(deps);
  let requestUrl: string;
  try {
    requestUrl = buildRequestUrl(lat, lon, endpoint);
  } catch {
    throw unavailable();
  }

  const fetchImpl = deps.fetchImpl ?? fetch;
  let response: Response;
  try {
    response = await fetchImpl(requestUrl, {
      headers: {
        Accept: "application/json",
        "User-Agent": USER_AGENT,
      },
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
  } catch {
    console.error(`[geo] reverse geocode request failed (${endpoint.provider})`);
    throw unavailable();
  }

  if (!response.ok) {
    console.error(
      `[geo] reverse geocode rejected (${endpoint.provider}, status ${response.status})`,
    );
    throw unavailable();
  }

  let payload: unknown;
  try {
    payload = await response.json();
  } catch {
    throw unavailable();
  }

  const region =
    endpoint.provider === "nominatim"
      ? parseNominatimRegion(payload)
      : parseBigDataCloudRegion(payload);
  if (!region) {
    throw unavailable();
  }
  writeCache(cacheKey, region);
  return region;
}
