/**
 * Production CORS helpers.
 * Browser Origin never includes a trailing slash; env URLs often do.
 */

export function normalizeOrigin(url: string): string {
  return url.trim().replace(/\/+$/, "");
}

/**
 * Expand a configured frontend URL into apex + www variants so both
 * https://aslijobs.com and https://www.aslijobs.com work in production.
 */
export function expandPublicSiteOrigins(frontendUrl: string): string[] {
  const normalized = normalizeOrigin(frontendUrl);
  if (!normalized) {
    return [];
  }

  const origins = new Set<string>([normalized]);

  try {
    const parsed = new URL(normalized);
    if (!parsed.protocol.startsWith("http")) {
      return [normalized];
    }

    if (parsed.hostname.startsWith("www.")) {
      const apexHost = parsed.hostname.slice(4);
      if (apexHost) {
        origins.add(`${parsed.protocol}//${apexHost}`);
      }
    } else if (parsed.hostname.includes(".")) {
      origins.add(`${parsed.protocol}//www.${parsed.hostname}`);
    }
  } catch {
    return [normalized];
  }

  return [...origins];
}

/**
 * For local development, browsers may send Origin as either localhost or
 * 127.0.0.1 depending on how the admin/Vite URL was opened. Allow both.
 */
export function expandLocalhostOrigins(origin: string): string[] {
  const normalized = normalizeOrigin(origin);
  if (!normalized) {
    return [];
  }

  const origins = new Set<string>([normalized]);

  try {
    const parsed = new URL(normalized);
    if (parsed.hostname === "localhost") {
      origins.add(`${parsed.protocol}//127.0.0.1${parsed.port ? `:${parsed.port}` : ""}`);
    } else if (parsed.hostname === "127.0.0.1") {
      origins.add(
        `${parsed.protocol}//localhost${parsed.port ? `:${parsed.port}` : ""}`,
      );
    }
  } catch {
    return [normalized];
  }

  return [...origins];
}

export function buildAllowedCorsOrigins(input: {
  frontendUrl: string;
  adminUrl: string;
  extraOrigins?: string[];
}): string[] {
  const allowed = new Set<string>();

  for (const origin of expandPublicSiteOrigins(input.frontendUrl)) {
    allowed.add(origin);
  }

  for (const origin of expandLocalhostOrigins(input.frontendUrl)) {
    allowed.add(origin);
  }

  const adminOrigin = normalizeOrigin(input.adminUrl);
  if (adminOrigin) {
    for (const origin of expandLocalhostOrigins(adminOrigin)) {
      allowed.add(origin);
    }
  }

  for (const extra of input.extraOrigins ?? []) {
    const normalized = normalizeOrigin(extra);
    if (normalized) {
      for (const origin of expandLocalhostOrigins(normalized)) {
        allowed.add(origin);
      }
    }
  }

  return [...allowed];
}

function defaultPortForProtocol(protocol: string): string {
  return protocol === "https:" ? "443" : "80";
}

export function extractOriginPort(url: string): string | null {
  const normalized = normalizeOrigin(url);
  if (!normalized) {
    return null;
  }

  try {
    const parsed = new URL(normalized);
    return parsed.port || defaultPortForProtocol(parsed.protocol);
  } catch {
    return null;
  }
}

/**
 * RFC1918 + loopback hostnames used when Next/Vite is opened via a LAN IP
 * (e.g. http://192.168.1.20:3000 from the Network URL).
 */
export function isPrivateOrLoopbackHostname(hostname: string): boolean {
  const host = hostname.trim().toLowerCase();
  if (!host) {
    return false;
  }

  if (host === "localhost" || host === "127.0.0.1" || host === "::1") {
    return true;
  }

  if (/^10(?:\.\d{1,3}){3}$/.test(host)) {
    return true;
  }

  if (/^192\.168(?:\.\d{1,3}){2}$/.test(host)) {
    return true;
  }

  if (/^172\.(1[6-9]|2\d|3[0-1])(?:\.\d{1,3}){2}$/.test(host)) {
    return true;
  }

  return false;
}

/**
 * Development-only: allow the same frontend/admin ports when the browser
 * Origin uses a private LAN IP instead of localhost. Production must stay
 * on the explicit allow-list.
 */
export function isDevelopmentLanOriginAllowed(
  origin: string,
  allowedPorts: ReadonlySet<string>,
): boolean {
  const normalized = normalizeOrigin(origin);
  if (!normalized || allowedPorts.size === 0) {
    return false;
  }

  try {
    const parsed = new URL(normalized);
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
      return false;
    }

    if (!isPrivateOrLoopbackHostname(parsed.hostname)) {
      return false;
    }

    const port = parsed.port || defaultPortForProtocol(parsed.protocol);
    return allowedPorts.has(port);
  } catch {
    return false;
  }
}

export function buildDevelopmentCorsPorts(input: {
  frontendUrl: string;
  adminUrl: string;
  extraOrigins?: string[];
}): Set<string> {
  const ports = new Set<string>();

  for (const url of [
    input.frontendUrl,
    input.adminUrl,
    ...(input.extraOrigins ?? []),
  ]) {
    const port = extractOriginPort(url);
    if (port) {
      ports.add(port);
    }
  }

  // Stable local defaults so LAN access works even if env URLs omit ports.
  ports.add("3000");
  ports.add("5173");

  return ports;
}
