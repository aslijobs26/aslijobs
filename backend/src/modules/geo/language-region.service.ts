import { env } from "../../config/env.js";
import { HTTP_STATUS } from "../../constants/http-status.js";
import { AppError } from "../../middleware/error.middleware.js";
import {
  parseBigDataCloudRegion,
  parseNominatimRegion,
  parsePhotonRegion,
  roundCoordinate,
  type LanguageRegion,
} from "./language-region.parse.js";
import {
  assertPublicGeocodeBaseUrl,
  buildLanguageRegionUrl,
  geocodeRequestHeaders,
  isAllowlistedRedirect,
  isBuiltinGeocodeUrl,
  resolveLanguageRegionProviders,
  safeEndpointReason,
  type LanguageRegionProvider,
  type LanguageRegionProviderName,
} from "./language-region.provider.js";

const UPSTREAM_TIMEOUT_MS = 6_000;
const CACHE_TTL_MS = 12 * 60 * 60 * 1000;
const CACHE_MAX = 1_000;
const UPSTREAM_LIMIT = 120;
const UPSTREAM_WINDOW_MS = 60_000;
const CLIENT_MESSAGE = "Language region is temporarily unavailable.";

export type ReverseGeocodeDeps = {
  fetchImpl?: typeof fetch;
  endpoint?: string;
  apiKey?: string;
  provider?: LanguageRegionProviderName;
  providers?: LanguageRegionProvider[];
  requestId?: string;
  enforceSsrf?: boolean;
  upstreamLimit?: number;
};

type CacheEntry = {
  expiresAt: number;
  region: LanguageRegion;
};

type AttemptFailure = {
  statusCode: number;
  category: string;
  upstreamStatus?: number;
  elapsedMs?: number;
  reason?: string;
};

const cache = new Map<string, CacheEntry>();
const upstreamHits: number[] = [];

export function resetLanguageRegionClientForTests(): void {
  cache.clear();
  upstreamHits.length = 0;
}

function rememberUpstream(limit: number): boolean {
  const now = Date.now();
  while (upstreamHits.length > 0 && now - upstreamHits[0]! > UPSTREAM_WINDOW_MS) {
    upstreamHits.shift();
  }
  if (upstreamHits.length >= limit) {
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

function providersFor(deps: ReverseGeocodeDeps): {
  providers: LanguageRegionProvider[];
  enforceSsrf: boolean;
} {
  if (deps.providers && deps.providers.length > 0) {
    return { providers: deps.providers, enforceSsrf: deps.enforceSsrf ?? false };
  }
  if (deps.provider && deps.endpoint) {
    return {
      providers: [
        {
          provider: deps.provider,
          urlBase: deps.endpoint,
          apiKey: deps.apiKey ?? "",
        },
      ],
      enforceSsrf: deps.enforceSsrf ?? false,
    };
  }
  return {
    providers: resolveLanguageRegionProviders({
      baseUrl: env.REVERSE_GEOCODE_BASE_URL,
      apiKey: env.REVERSE_GEOCODE_API_KEY,
    }),
    enforceSsrf: true,
  };
}

function unavailable(statusCode: number): AppError {
  return new AppError(CLIENT_MESSAGE, statusCode);
}

function logGeo(
  level: "info" | "error",
  entry: {
    requestId: string;
    provider: string;
    category: string;
    upstreamStatus?: number;
    elapsedMs?: number;
    reason?: string;
  },
): void {
  const payload = {
    requestId: entry.requestId,
    provider: entry.provider,
    category: entry.category,
    ...(entry.upstreamStatus !== undefined
      ? { upstreamStatus: entry.upstreamStatus }
      : {}),
    ...(entry.elapsedMs !== undefined ? { elapsedMs: entry.elapsedMs } : {}),
    timeoutMs: UPSTREAM_TIMEOUT_MS,
    ...(entry.reason ? { reason: entry.reason } : {}),
  };
  const line = `[geo] ${JSON.stringify(payload)}`;
  if (level === "info") {
    console.info(line);
  } else {
    console.error(line);
  }
}

function classifyThrown(error: unknown): AttemptFailure {
  const name = error instanceof Error ? error.name : "";
  if (name === "TimeoutError" || name === "AbortError") {
    return { statusCode: HTTP_STATUS.GATEWAY_TIMEOUT, category: "timeout" };
  }
  return { statusCode: HTTP_STATUS.BAD_GATEWAY, category: "network" };
}

function failureForHttpStatus(status: number): AttemptFailure {
  if (status === HTTP_STATUS.TOO_MANY_REQUESTS) {
    return {
      statusCode: HTTP_STATUS.TOO_MANY_REQUESTS,
      category: "rate_limited",
      upstreamStatus: status,
    };
  }
  if (status === 408 || status === HTTP_STATUS.GATEWAY_TIMEOUT) {
    return {
      statusCode: HTTP_STATUS.GATEWAY_TIMEOUT,
      category: "timeout",
      upstreamStatus: status,
    };
  }
  return {
    statusCode: HTTP_STATUS.BAD_GATEWAY,
    category: "upstream_http",
    upstreamStatus: status,
  };
}

function bigDataCloudRateLimited(payload: unknown): boolean {
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    return false;
  }
  return (payload as { status?: unknown }).status === HTTP_STATUS.TOO_MANY_REQUESTS;
}

function parseRegion(
  provider: LanguageRegionProviderName,
  payload: unknown,
): LanguageRegion | null {
  if (provider === "photon") {
    return parsePhotonRegion(payload);
  }
  if (provider === "nominatim") {
    return parseNominatimRegion(payload);
  }
  return parseBigDataCloudRegion(payload);
}

async function readUpstream(
  startUrl: string,
  fetchImpl: typeof fetch,
  followPublicRedirects: boolean,
): Promise<
  | { ok: true; response: Response; elapsedMs: number }
  | { ok: false; failure: AttemptFailure; elapsedMs: number }
> {
  const started = Date.now();
  let current = startUrl;
  for (let hop = 0; hop < 2; hop += 1) {
    let response: Response;
    try {
      response = await fetchImpl(current, {
        headers: geocodeRequestHeaders(),
        redirect: "manual",
        signal: AbortSignal.timeout(UPSTREAM_TIMEOUT_MS),
      });
    } catch (error) {
      const failure = classifyThrown(error);
      return { ok: false, failure, elapsedMs: Date.now() - started };
    }

    if (response.status >= 300 && response.status < 400) {
      const location = response.headers.get("location");
      const nextIsAllowed = Boolean(
        location &&
          (isAllowlistedRedirect(current, location) ||
            (followPublicRedirects && (await publicRedirect(location, current)))),
      );
      if (!location || !nextIsAllowed || hop === 1) {
        return {
          ok: false,
          elapsedMs: Date.now() - started,
          failure: {
            statusCode: HTTP_STATUS.BAD_GATEWAY,
            category: "unexpected_redirect",
            upstreamStatus: response.status,
          },
        };
      }
      current = new URL(location, current).toString();
      continue;
    }

    return { ok: true, response, elapsedMs: Date.now() - started };
  }

  return {
    ok: false,
    elapsedMs: Date.now() - started,
    failure: {
      statusCode: HTTP_STATUS.BAD_GATEWAY,
      category: "unexpected_redirect",
    },
  };
}

async function publicRedirect(location: string, current: string): Promise<boolean> {
  try {
    const next = new URL(location, current);
    await assertPublicGeocodeBaseUrl(next.toString());
    return next.protocol === "https:" || next.protocol === "http:";
  } catch {
    return false;
  }
}

/**
 * Resolves a coarse position to country, state, and city.
 * Rounded coordinates are used only for the upstream request and an
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

  const requestId = deps.requestId?.slice(0, 128) || "n/a";
  const { providers, enforceSsrf } = providersFor(deps);
  const limit = deps.upstreamLimit ?? UPSTREAM_LIMIT;
  let lastFailure: AttemptFailure | null = null;

  for (const provider of providers) {
    if (enforceSsrf && !isBuiltinGeocodeUrl(provider.urlBase)) {
      try {
        await assertPublicGeocodeBaseUrl(provider.urlBase);
      } catch (error) {
        logGeo("error", {
          requestId,
          provider: provider.provider,
          category: "invalid_endpoint",
          reason: safeEndpointReason(error),
        });
        throw unavailable(HTTP_STATUS.BAD_GATEWAY);
      }
    }

    if (!rememberUpstream(limit)) {
      logGeo("error", {
        requestId,
        provider: provider.provider,
        category: "rate_limited",
      });
      throw unavailable(HTTP_STATUS.TOO_MANY_REQUESTS);
    }

    let requestUrl: string;
    try {
      requestUrl = buildLanguageRegionUrl(lat, lon, provider);
    } catch {
      logGeo("error", {
        requestId,
        provider: provider.provider,
        category: "invalid_endpoint",
        reason: "invalid_url",
      });
      throw unavailable(HTTP_STATUS.BAD_GATEWAY);
    }

    const fetchImpl = deps.fetchImpl ?? fetch;
    const upstream = await readUpstream(
      requestUrl,
      fetchImpl,
      enforceSsrf && !isBuiltinGeocodeUrl(provider.urlBase),
    );
    if (!upstream.ok) {
      lastFailure = { ...upstream.failure, elapsedMs: upstream.elapsedMs };
      logGeo("error", {
        requestId,
        provider: provider.provider,
        category: lastFailure.category,
        upstreamStatus: lastFailure.upstreamStatus,
        elapsedMs: lastFailure.elapsedMs,
      });
      continue;
    }

    if (!upstream.response.ok) {
      lastFailure = {
        ...failureForHttpStatus(upstream.response.status),
        elapsedMs: upstream.elapsedMs,
      };
      logGeo("error", {
        requestId,
        provider: provider.provider,
        category: lastFailure.category,
        upstreamStatus: lastFailure.upstreamStatus,
        elapsedMs: lastFailure.elapsedMs,
      });
      continue;
    }

    let payload: unknown;
    try {
      payload = await upstream.response.json();
    } catch {
      lastFailure = {
        statusCode: HTTP_STATUS.BAD_GATEWAY,
        category: "invalid_json",
        upstreamStatus: upstream.response.status,
        elapsedMs: upstream.elapsedMs,
      };
      logGeo("error", {
        requestId,
        provider: provider.provider,
        category: lastFailure.category,
        upstreamStatus: lastFailure.upstreamStatus,
        elapsedMs: lastFailure.elapsedMs,
      });
      continue;
    }

    if (provider.provider === "bigdatacloud" && bigDataCloudRateLimited(payload)) {
      lastFailure = {
        statusCode: HTTP_STATUS.TOO_MANY_REQUESTS,
        category: "rate_limited",
        upstreamStatus: upstream.response.status,
        elapsedMs: upstream.elapsedMs,
      };
      logGeo("error", {
        requestId,
        provider: provider.provider,
        category: lastFailure.category,
        upstreamStatus: lastFailure.upstreamStatus,
        elapsedMs: lastFailure.elapsedMs,
      });
      continue;
    }

    const region = parseRegion(provider.provider, payload);
    if (!region) {
      lastFailure = {
        statusCode: HTTP_STATUS.BAD_GATEWAY,
        category: "invalid_payload",
        upstreamStatus: upstream.response.status,
        elapsedMs: upstream.elapsedMs,
      };
      logGeo("error", {
        requestId,
        provider: provider.provider,
        category: lastFailure.category,
        upstreamStatus: lastFailure.upstreamStatus,
        elapsedMs: lastFailure.elapsedMs,
      });
      continue;
    }

    logGeo("info", {
      requestId,
      provider: provider.provider,
      category: "ok",
      upstreamStatus: upstream.response.status,
      elapsedMs: upstream.elapsedMs,
    });
    writeCache(cacheKey, region);
    return region;
  }

  throw unavailable(lastFailure?.statusCode ?? HTTP_STATUS.BAD_GATEWAY);
}
