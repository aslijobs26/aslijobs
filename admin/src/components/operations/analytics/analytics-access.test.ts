import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { canAccessOperationsAnalytics } from "./analytics-access.ts";

describe("analytics access", () => {
  it("allows reports readers and super admins", () => {
    assert.equal(
      canAccessOperationsAnalytics({
        isSuperAdmin: false,
        reportsRead: true,
        reportsView: false,
      }),
      true,
    );
    assert.equal(
      canAccessOperationsAnalytics({
        isSuperAdmin: true,
        reportsRead: false,
        reportsView: false,
      }),
      true,
    );
    assert.equal(
      canAccessOperationsAnalytics({
        isSuperAdmin: false,
        reportsRead: false,
        reportsView: true,
      }),
      true,
    );
  });

  it("does not allow job view or job export to open analytics", () => {
    assert.equal(
      canAccessOperationsAnalytics({
        isSuperAdmin: false,
        reportsRead: false,
        reportsView: false,
      }),
      false,
    );
  });
});
