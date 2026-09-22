import {
  CANONICAL_DEVELOPMENT_DB_NAME,
  CANONICAL_PRODUCTION_DB_NAME,
  FORBIDDEN_PRODUCTION_DB_NAMES,
  parseDatabaseNameFromMongoUri,
} from "./mongo-database-name.js";

export type DatabaseIsolationInput = {
  nodeEnv: "development" | "production" | "test";
  mongoUri: string | undefined;
  /** Render sets RENDER=true on all services. */
  isRenderRuntime?: boolean;
  /**
   * Temporary cutover escape hatch. Requires BOTH:
   * ALLOW_NON_CANONICAL_PRODUCTION_DB=true
   * and an explicit allowed name via EXPECTED_PRODUCTION_DB_NAME.
   * Disabled by default. Never use permanently.
   */
  allowNonCanonicalProductionDb?: boolean;
  expectedProductionDbName?: string;
  /**
   * Emergency only: allow local/dev process to open aslijobs_prod.
   * Requires ALLOW_DEV_PRODUCTION_DB=true.
   */
  allowDevProductionDb?: boolean;
};

export type DatabaseIsolationResult =
  | {
      ok: true;
      databaseName: string;
      nodeEnv: DatabaseIsolationInput["nodeEnv"];
      warnings: string[];
    }
  | {
      ok: false;
      databaseName: string | null;
      nodeEnv: DatabaseIsolationInput["nodeEnv"];
      error: string;
      warnings: string[];
    };

function isTruthyFlag(value: unknown): boolean {
  return String(value ?? "")
    .trim()
    .toLowerCase() === "true";
}

/**
 * Enforce Local ↔ aslijobs_test and Production ↔ aslijobs_prod isolation.
 * Call before mongoose.connect. Never logs credentials.
 */
export function assertDatabaseIsolation(
  input: DatabaseIsolationInput,
): DatabaseIsolationResult {
  const warnings: string[] = [];
  const { nodeEnv, mongoUri } = input;

  if (nodeEnv === "test") {
    // Automated tests may use memory servers or ephemeral DBs.
    return {
      ok: true,
      databaseName: mongoUri ? parseDatabaseNameFromMongoUri(mongoUri) : "test",
      nodeEnv,
      warnings,
    };
  }

  if (!mongoUri?.trim()) {
    if (nodeEnv === "production") {
      return {
        ok: false,
        databaseName: null,
        nodeEnv,
        error:
          "Production database safety check failed. MONGO_URI is required.",
        warnings,
      };
    }
    return {
      ok: true,
      databaseName: "unconfigured",
      nodeEnv,
      warnings: ["MONGO_URI is not set; database connection will be skipped."],
    };
  }

  const databaseName = parseDatabaseNameFromMongoUri(mongoUri);

  if (input.isRenderRuntime && nodeEnv !== "production") {
    return {
      ok: false,
      databaseName,
      nodeEnv,
      error:
        "Production database safety check failed. Render runtime requires NODE_ENV=production.",
      warnings,
    };
  }

  if (nodeEnv === "production") {
    const canonical = CANONICAL_PRODUCTION_DB_NAME;
    const expected =
      input.expectedProductionDbName?.trim() || canonical;
    const allowLegacy =
      Boolean(input.allowNonCanonicalProductionDb) &&
      expected !== canonical;

    if (allowLegacy) {
      warnings.push(
        `NON-CANONICAL production DB allowed temporarily: expected=${expected} (canonical=${canonical}). Migrate to ${canonical} and remove ALLOW_NON_CANONICAL_PRODUCTION_DB.`,
      );
    }

    if (databaseName !== expected) {
      return {
        ok: false,
        databaseName,
        nodeEnv,
        error: `Production database safety check failed. Expected ${expected}, resolved ${databaseName}.`,
        warnings,
      };
    }

    if (
      !allowLegacy &&
      FORBIDDEN_PRODUCTION_DB_NAMES.has(databaseName)
    ) {
      return {
        ok: false,
        databaseName,
        nodeEnv,
        error: `Production database safety check failed. Forbidden database name: ${databaseName}. Expected ${canonical}.`,
        warnings,
      };
    }

    if (databaseName !== canonical && !allowLegacy) {
      return {
        ok: false,
        databaseName,
        nodeEnv,
        error: `Production database safety check failed. Expected ${canonical}.`,
        warnings,
      };
    }

    return { ok: true, databaseName, nodeEnv, warnings };
  }

  // development
  if (
    databaseName === CANONICAL_PRODUCTION_DB_NAME &&
    !input.allowDevProductionDb
  ) {
    return {
      ok: false,
      databaseName,
      nodeEnv,
      error:
        "Development database safety check failed. Local must not use aslijobs_prod. Set MONGO_URI to aslijobs_test.",
      warnings,
    };
  }

  if (
    databaseName === CANONICAL_PRODUCTION_DB_NAME &&
    input.allowDevProductionDb
  ) {
    warnings.push(
      "ALLOW_DEV_PRODUCTION_DB=true: development process is connected to aslijobs_prod. Disable immediately after emergency use.",
    );
  }

  if (
    databaseName !== CANONICAL_DEVELOPMENT_DB_NAME &&
    databaseName !== CANONICAL_PRODUCTION_DB_NAME
  ) {
    warnings.push(
      `Development database is "${databaseName}" (canonical local DB is ${CANONICAL_DEVELOPMENT_DB_NAME}).`,
    );
  }

  return { ok: true, databaseName, nodeEnv, warnings };
}

export function readDatabaseIsolationFlagsFromEnv(
  envBag: NodeJS.ProcessEnv = process.env,
): Pick<
  DatabaseIsolationInput,
  | "isRenderRuntime"
  | "allowNonCanonicalProductionDb"
  | "expectedProductionDbName"
  | "allowDevProductionDb"
> {
  return {
    isRenderRuntime: isTruthyFlag(envBag.RENDER),
    allowNonCanonicalProductionDb: isTruthyFlag(
      envBag.ALLOW_NON_CANONICAL_PRODUCTION_DB,
    ),
    expectedProductionDbName:
      envBag.EXPECTED_PRODUCTION_DB_NAME?.trim() || undefined,
    allowDevProductionDb: isTruthyFlag(envBag.ALLOW_DEV_PRODUCTION_DB),
  };
}
