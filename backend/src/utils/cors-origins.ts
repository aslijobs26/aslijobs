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

export function buildAllowedCorsOrigins(input: {
  frontendUrl: string;
  adminUrl: string;
  extraOrigins?: string[];
}): string[] {
  const allowed = new Set<string>();

  for (const origin of expandPublicSiteOrigins(input.frontendUrl)) {
    allowed.add(origin);
  }

  const adminOrigin = normalizeOrigin(input.adminUrl);
  if (adminOrigin) {
    allowed.add(adminOrigin);
  }

  for (const extra of input.extraOrigins ?? []) {
    const normalized = normalizeOrigin(extra);
    if (normalized) {
      allowed.add(normalized);
    }
  }

  return [...allowed];
}
