import { lookup } from "node:dns/promises";
import { isIP } from "node:net";

const PRIVATE_V4 =
  /^(127\.|10\.|0\.|169\.254\.|192\.168\.|172\.(1[6-9]|2\d|3[0-1])\.)/;
const BLOCKED_HOSTS = new Set([
  "localhost",
  "metadata.google.internal",
  "metadata.google.com",
]);

export type AllowedFetchOrigin = {
  protocol: string;
  hostname: string;
  port: string;
};

export function parseAllowedOrigin(origin: string): AllowedFetchOrigin | null {
  try {
    const url = new URL(origin);
    if (url.protocol !== "http:" && url.protocol !== "https:") return null;
    return {
      protocol: url.protocol,
      hostname: url.hostname.toLowerCase(),
      port: url.port,
    };
  } catch {
    return null;
  }
}

export function isPrivateIpAddress(address: string): boolean {
  const value = address.trim().toLowerCase();
  if (!value) return true;
  if (value === "::1" || value === "0:0:0:0:0:0:0:1") return true;
  if (value.startsWith("fe80:") || value.startsWith("fc") || value.startsWith("fd")) return true;
  if (value.includes(":")) {
    const mapped = value.match(/::ffff:(\d+\.\d+\.\d+\.\d+)$/);
    if (mapped?.[1]) return PRIVATE_V4.test(mapped[1]);
  }
  return PRIVATE_V4.test(value);
}

export function assertPublicKnowledgeUrl(
  raw: string,
  allowed: AllowedFetchOrigin[],
): URL {
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    throw new Error("invalid_url");
  }
  if (url.username || url.password) throw new Error("credentials_forbidden");
  if (url.protocol !== "http:" && url.protocol !== "https:") {
    throw new Error("protocol_forbidden");
  }
  const host = url.hostname.toLowerCase();
  if (BLOCKED_HOSTS.has(host) && !allowed.some((item) => item.hostname === host)) {
    throw new Error("host_forbidden");
  }
  const matched = allowed.some(
    (item) =>
      item.hostname === host &&
      item.protocol === url.protocol &&
      (!item.port || item.port === url.port),
  );
  if (!matched) throw new Error("host_not_allowlisted");
  const ip = isIP(host);
  if (ip && isPrivateIpAddress(host) && !allowPrivateForOrigin(host, allowed)) {
    throw new Error("private_ip_forbidden");
  }
  return url;
}

function allowPrivateForOrigin(host: string, allowed: AllowedFetchOrigin[]): boolean {
  return allowed.some((item) => item.hostname === host);
}

export async function assertResolvedAddressPublic(
  hostname: string,
  allowed: AllowedFetchOrigin[],
): Promise<void> {
  if (isIP(hostname)) {
    if (isPrivateIpAddress(hostname) && !allowPrivateForOrigin(hostname, allowed)) {
      throw new Error("private_ip_forbidden");
    }
    return;
  }
  const records = await lookup(hostname, { all: true, verbatim: true });
  for (const record of records) {
    if (isPrivateIpAddress(record.address) && !allowPrivateForOrigin(hostname, allowed)) {
      throw new Error("resolved_private_ip");
    }
  }
}

export function redirectStaysOnAllowlist(
  from: URL,
  locationHeader: string,
  allowed: AllowedFetchOrigin[],
): URL {
  const next = new URL(locationHeader, from);
  assertPublicKnowledgeUrl(next.toString(), allowed);
  if (next.hostname.toLowerCase() !== from.hostname.toLowerCase()) {
    throw new Error("redirect_host_mismatch");
  }
  return next;
}
