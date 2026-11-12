import { lookup } from "node:dns/promises";
import { isIP } from "node:net";
import { isPrivateIpAddress } from "../website-knowledge/website-knowledge.ssrf.js";

/**
 * Photon is the default because the keyless BigDataCloud client API is a
 * browser endpoint. api.bigdatacloud.net answers servers with a 307 to
 * api-bdc.io, and datacenter addresses are often rejected there.
 */
export const PHOTON_REVERSE_URL = "https://photon.komoot.io/reverse";
export const BIGDATACLOUD_CLIENT_URL =
  "https://api-bdc.io/data/reverse-geocode-client";
export const BIGDATACLOUD_SERVER_URL = "https://api-bdc.io/data/reverse-geocode";

const USER_AGENT = "AsliJobs/1.0 (language-region; +https://aslijobs.com)";
const BUILTIN_HOSTS = new Set([
  "photon.komoot.io",
  "api-bdc.io",
  "api.bigdatacloud.net",
]);
const BLOCKED_HOSTS = new Set([
  "localhost",
  "metadata.google.internal",
  "metadata.google.com",
]);
const SAFE_ENDPOINT_REASONS = new Set([
  "invalid_url",
  "credentials_forbidden",
  "protocol_forbidden",
  "host_forbidden",
  "private_ip_forbidden",
  "resolved_private_ip",
  "dns_failed",
]);

export type LanguageRegionProviderName = "bigdatacloud" | "nominatim" | "photon";

export type LanguageRegionProvider = {
  provider: LanguageRegionProviderName;
  urlBase: string;
  apiKey: string;
};

export type AddressLookup = (
  hostname: string,
) => Promise<readonly { address: string }[]>;

export function resolveLanguageRegionProviders(options: {
  baseUrl?: string;
  apiKey?: string;
}): LanguageRegionProvider[] {
  const baseUrl = options.baseUrl?.trim() ?? "";
  if (baseUrl) {
    return [{ provider: "nominatim", urlBase: baseUrl, apiKey: "" }];
  }
  const apiKey = options.apiKey?.trim() ?? "";
  if (apiKey) {
    return [
      { provider: "bigdatacloud", urlBase: BIGDATACLOUD_SERVER_URL, apiKey },
      { provider: "photon", urlBase: PHOTON_REVERSE_URL, apiKey: "" },
    ];
  }
  return [
    { provider: "photon", urlBase: PHOTON_REVERSE_URL, apiKey: "" },
    { provider: "bigdatacloud", urlBase: BIGDATACLOUD_CLIENT_URL, apiKey: "" },
  ];
}

export function isBuiltinGeocodeUrl(raw: string): boolean {
  try {
    const url = new URL(raw);
    return (
      url.protocol === "https:" &&
      !url.username &&
      !url.password &&
      BUILTIN_HOSTS.has(url.hostname.toLowerCase())
    );
  } catch {
    return false;
  }
}

export function buildLanguageRegionUrl(
  latitude: number,
  longitude: number,
  provider: LanguageRegionProvider,
): string {
  const url = new URL(provider.urlBase);
  if (provider.provider === "photon") {
    url.searchParams.set("lat", latitude.toFixed(3));
    url.searchParams.set("lon", longitude.toFixed(3));
    url.searchParams.set("lang", "en");
    return url.toString();
  }
  if (provider.provider === "nominatim") {
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
  if (provider.apiKey) {
    url.searchParams.set("key", provider.apiKey);
  }
  return url.toString();
}

export function geocodeRequestHeaders(): { Accept: string; "User-Agent": string } {
  return {
    Accept: "application/json",
    "User-Agent": USER_AGENT,
  };
}

function normalizeHost(hostname: string): string {
  return hostname.trim().toLowerCase().replace(/^\[|\]$/g, "");
}

function rejectBlockedHost(host: string): void {
  if (
    !host ||
    BLOCKED_HOSTS.has(host) ||
    host.endsWith(".localhost") ||
    host.endsWith(".local") ||
    host.endsWith(".internal") ||
    /^\d+$/.test(host)
  ) {
    throw new Error("host_forbidden");
  }
}

async function lookupPublicAddresses(
  hostname: string,
): Promise<readonly { address: string }[]> {
  return lookup(hostname, { all: true, verbatim: true });
}

/** Rejects custom reverse-geocode URLs that could reach a private network. */
export async function assertPublicGeocodeBaseUrl(
  raw: string,
  lookupImpl: AddressLookup = lookupPublicAddresses,
): Promise<void> {
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    throw new Error("invalid_url");
  }
  if (url.username || url.password) {
    throw new Error("credentials_forbidden");
  }
  if (url.protocol !== "https:" && url.protocol !== "http:") {
    throw new Error("protocol_forbidden");
  }
  const host = normalizeHost(url.hostname);
  rejectBlockedHost(host);
  if (isIP(host)) {
    if (isPrivateIpAddress(host)) {
      throw new Error("private_ip_forbidden");
    }
    return;
  }
  let records: readonly { address: string }[];
  try {
    records = await lookupImpl(host);
  } catch {
    throw new Error("dns_failed");
  }
  if (records.length === 0) {
    throw new Error("dns_failed");
  }
  for (const record of records) {
    if (isPrivateIpAddress(record.address)) {
      throw new Error("resolved_private_ip");
    }
  }
}

export function safeEndpointReason(error: unknown): string {
  const message = error instanceof Error ? error.message : "";
  return SAFE_ENDPOINT_REASONS.has(message) ? message : "invalid_endpoint";
}

export function isAllowlistedRedirect(from: string, location: string): boolean {
  try {
    const next = new URL(location, from);
    return (
      next.protocol === "https:" &&
      !next.username &&
      !next.password &&
      BUILTIN_HOSTS.has(next.hostname.toLowerCase())
    );
  } catch {
    return false;
  }
}
