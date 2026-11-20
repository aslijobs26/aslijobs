import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { toCashfreeOptionalText, toCashfreePhone } from "./cashfree.client.js";

describe("Cashfree create-order field limits", () => {
  it("drops customer_name / customer_email outside Cashfree's 3–100 char range", () => {
    assert.equal(toCashfreeOptionalText("Al"), undefined);
    assert.equal(toCashfreeOptionalText("   "), undefined);
    assert.equal(toCashfreeOptionalText(undefined), undefined);
    assert.equal(toCashfreeOptionalText("x".repeat(101)), undefined);
    assert.equal(toCashfreeOptionalText("  Ana  "), "Ana");
    assert.equal(toCashfreeOptionalText("x".repeat(100)), "x".repeat(100));
  });

  it("normalizes phone to the last 10 digits", () => {
    assert.equal(toCashfreePhone("+91 98765-43210"), "9876543210");
    assert.equal(toCashfreePhone("9876543210"), "9876543210");
  });
});
