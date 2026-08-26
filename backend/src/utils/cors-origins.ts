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
