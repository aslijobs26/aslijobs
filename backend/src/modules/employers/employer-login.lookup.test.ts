import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import {
  employerWhatsappLookupValues,
  maskEmployerLoginPhone,
} from "./employer-login.lookup.js";

describe("employerWhatsappLookupValues", () => {
  it("always includes the national 10-digit form used by Company Profile registration", () => {
    const values = employerWhatsappLookupValues("9876543210");
    assert.equal(values[0], "9876543210");
    assert.ok(values.includes("+919876543210"));
    assert.ok(values.includes("919876543210"));
    assert.ok(values.includes("09876543210"));
  });

  it("normalizes +91 input to the same lookup set", () => {
    const fromNational = employerWhatsappLookupValues("9876543210");
    const fromCountry = employerWhatsappLookupValues("+91 98765 43210");
    assert.deepEqual(fromNational, fromCountry);
  });
});

describe("maskEmployerLoginPhone", () => {
  it("never prints the full number", () => {
    assert.equal(maskEmployerLoginPhone("9876543210"), "****3210");
    assert.equal(maskEmployerLoginPhone("+919876543210"), "****3210");
  });
});

describe("login lookup wiring", () => {
  it("login send/verify OTP queries phone variants and phone_account_identities", () => {
    const source = readFileSync(
      fileURLToPath(new URL("./employer-login.service.ts", import.meta.url)),
      "utf8",
    );
    assert.match(source, /employerWhatsappLookupValues/);
    assert.match(source, /PhoneAccountIdentityModel/);
    assert.match(source, /whatsappNumber: \{ \$in: lookupValues \}/);
    assert.doesNotMatch(source, /EmployerModel\.create/);
  });
});
