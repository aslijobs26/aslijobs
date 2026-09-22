/**
 * Safe MongoDB URI / database-name helpers.
 * Never log full URIs, usernames, or passwords.
 */

export const CANONICAL_PRODUCTION_DB_NAME = "aslijobs_prod";
export const CANONICAL_DEVELOPMENT_DB_NAME = "aslijobs_test";

/** Databases that must never host production traffic. */
export const FORBIDDEN_PRODUCTION_DB_NAMES = new Set([
  "aslijobs_test",
  "test",
  "local",
  "admin",
  "localtest",
]);

/**
 * Extract the database name from a MongoDB connection string.
 * When the path is omitted, the Node driver defaults to `test`.
 */
export function parseDatabaseNameFromMongoUri(uri: string): string {
  const trimmed = uri.trim();
  if (!trimmed) {
    return "test";
  }

  // Strip query string first so credentials/options never leak into parsing.
  const withoutQuery = trimmed.split("?")[0] ?? trimmed;

  const schemeSeparator = withoutQuery.indexOf("://");
  if (schemeSeparator === -1) {
    return "test";
  }

  const afterScheme = withoutQuery.slice(schemeSeparator + 3);
  const atIndex = afterScheme.lastIndexOf("@");
  const hostAndPath = atIndex >= 0 ? afterScheme.slice(atIndex + 1) : afterScheme;

  const slashIndex = hostAndPath.indexOf("/");
  if (slashIndex === -1 || slashIndex === hostAndPath.length - 1) {
    // mongodb+srv://host/?opts  → driver default database is "test"
    return "test";
  }

  const rawName = hostAndPath.slice(slashIndex + 1).replace(/\/+$/, "");
  if (!rawName) {
    return "test";
  }

  // Reject path segments that look like accidental extras.
  const dbName = rawName.split("/")[0]?.trim() ?? "";
  return dbName || "test";
}

/** Redact a URI to host + database only (no credentials). */
export function describeMongoUriTarget(uri: string): {
  databaseName: string;
  hasCredentials: boolean;
  hostHint: string;
} {
  const databaseName = parseDatabaseNameFromMongoUri(uri);
  const hasCredentials = /:\/\/[^/@]+@/.test(uri);
  let hostHint = "unknown-host";
  try {
    const withoutQuery = uri.trim().split("?")[0] ?? uri;
    const afterScheme = withoutQuery.replace(/^mongodb(\+srv)?:\/\//i, "");
    const hostPart = afterScheme.includes("@")
      ? afterScheme.slice(afterScheme.lastIndexOf("@") + 1)
      : afterScheme;
    hostHint = (hostPart.split("/")[0] ?? "unknown-host").trim() || "unknown-host";
  } catch {
    hostHint = "unknown-host";
  }
  return { databaseName, hasCredentials, hostHint };
}
