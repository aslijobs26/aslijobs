import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { operationsTeamLoginSchema } from "./operations-auth.validation.js";

describe("Organization login validation", () => {
  it("accepts email and password", () => {
    const parsed = operationsTeamLoginSchema.parse({
      email: "rahul@aslijobs.com",
      password: "SecurePass1",
    });
    assert.equal(parsed.email, "rahul@aslijobs.com");
    assert.equal(parsed.password, "SecurePass1");
  });

  it("rejects mobile-only login payloads", () => {
    const result = operationsTeamLoginSchema.safeParse({
      mobileNumber: "9876543210",
      password: "SecurePass1",
    });
    assert.equal(result.success, false);
  });

  it("rejects missing email", () => {
    const result = operationsTeamLoginSchema.safeParse({
      password: "SecurePass1",
    });
    assert.equal(result.success, false);
  });
});
