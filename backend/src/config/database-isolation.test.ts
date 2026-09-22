import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  CANONICAL_DEVELOPMENT_DB_NAME,
  CANONICAL_PRODUCTION_DB_NAME,
  describeMongoUriTarget,
  parseDatabaseNameFromMongoUri,
} from "./mongo-database-name.js";
import { assertDatabaseIsolation } from "./database-isolation.js";

describe("parseDatabaseNameFromMongoUri", () => {
  it("reads aslijobs_prod and aslijobs_test from path", () => {
    assert.equal(
      parseDatabaseNameFromMongoUri(
        "mongodb+srv://user:pass@cluster.example.net/aslijobs_prod?retryWrites=true",
      ),
      CANONICAL_PRODUCTION_DB_NAME,
    );
    assert.equal(
      parseDatabaseNameFromMongoUri(
        "mongodb+srv://user:pass@cluster.example.net/aslijobs_test",
      ),
      CANONICAL_DEVELOPMENT_DB_NAME,
    );
  });

  it("defaults to test when path is omitted (driver behavior)", () => {
    assert.equal(
      parseDatabaseNameFromMongoUri(
        "mongodb+srv://user:pass@cluster.example.net/?retryWrites=true",
      ),
      "test",
    );
    assert.equal(
      parseDatabaseNameFromMongoUri(
        "mongodb+srv://user:pass@cluster.example.net",
      ),
      "test",
    );
  });

  it("never returns credentials in describeMongoUriTarget", () => {
    const described = describeMongoUriTarget(
      "mongodb+srv://aslijobs:SuperSecret@cluster.ohxo349.mongodb.net/aslijobs_test",
    );
    assert.equal(described.databaseName, "aslijobs_test");
    assert.equal(described.hasCredentials, true);
    assert.match(described.hostHint, /cluster\.ohxo349\.mongodb\.net/i);
    assert.equal(described.hostHint.includes("SuperSecret"), false);
    assert.equal(described.hostHint.includes("aslijobs:"), false);
  });
});

describe("assertDatabaseIsolation", () => {
  const prodUri =
    "mongodb+srv://u:p@cluster.example.net/aslijobs_prod?retryWrites=true";
  const testUri =
    "mongodb+srv://u:p@cluster.example.net/aslijobs_test?retryWrites=true";
  const bareUri =
    "mongodb+srv://u:p@cluster.example.net/?retryWrites=true";

  it("allows production → aslijobs_prod", () => {
    const result = assertDatabaseIsolation({
      nodeEnv: "production",
      mongoUri: prodUri,
    });
    assert.equal(result.ok, true);
    if (result.ok) {
      assert.equal(result.databaseName, "aslijobs_prod");
    }
  });

  it("fails production → aslijobs_test", () => {
    const result = assertDatabaseIsolation({
      nodeEnv: "production",
      mongoUri: testUri,
    });
    assert.equal(result.ok, false);
    if (!result.ok) {
      assert.match(result.error, /Expected aslijobs_prod/);
    }
  });

  it("fails production → default test database", () => {
    const result = assertDatabaseIsolation({
      nodeEnv: "production",
      mongoUri: bareUri,
    });
    assert.equal(result.ok, false);
    if (!result.ok) {
      assert.equal(result.databaseName, "test");
    }
  });

  it("fails Render runtime when NODE_ENV is not production", () => {
    const result = assertDatabaseIsolation({
      nodeEnv: "development",
      mongoUri: testUri,
      isRenderRuntime: true,
    });
    assert.equal(result.ok, false);
    if (!result.ok) {
      assert.match(result.error, /Render runtime requires NODE_ENV=production/);
    }
  });

  it("allows development → aslijobs_test", () => {
    const result = assertDatabaseIsolation({
      nodeEnv: "development",
      mongoUri: testUri,
    });
    assert.equal(result.ok, true);
  });

  it("fails development → aslijobs_prod without override", () => {
    const result = assertDatabaseIsolation({
      nodeEnv: "development",
      mongoUri: prodUri,
    });
    assert.equal(result.ok, false);
  });

  it("allows temporary non-canonical production DB only with explicit flags", () => {
    const denied = assertDatabaseIsolation({
      nodeEnv: "production",
      mongoUri: testUri,
      expectedProductionDbName: "aslijobs_test",
      allowNonCanonicalProductionDb: false,
    });
    assert.equal(denied.ok, false);

    const allowed = assertDatabaseIsolation({
      nodeEnv: "production",
      mongoUri: testUri,
      expectedProductionDbName: "aslijobs_test",
      allowNonCanonicalProductionDb: true,
    });
    assert.equal(allowed.ok, true);
    if (allowed.ok) {
      assert.ok(allowed.warnings.length > 0);
    }
  });

  it("fails production when MONGO_URI missing", () => {
    const result = assertDatabaseIsolation({
      nodeEnv: "production",
      mongoUri: undefined,
    });
    assert.equal(result.ok, false);
  });
});
