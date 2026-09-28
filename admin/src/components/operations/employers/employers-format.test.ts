import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  formatEmployerDateTime,
  formatEmployerRegisteredLabel,
} from "./employers-format.ts";

describe("employer registration datetime display", () => {
  it("formats UTC instants in Asia/Kolkata", () => {
    const parts = formatEmployerDateTime("2026-09-25T12:43:00.000Z");
    assert.equal(parts.date, "25 Sept 2026");
    assert.match(parts.time, /06:13\s*pm/i);
  });

  it("prefers the ISO registration instant over preformatted UTC strings", () => {
    const label = formatEmployerRegisteredLabel({
      registeredAt: "2026-09-25T12:43:00.000Z",
      registeredAtDate: "25 Sept 2026",
      registeredAtTime: "12:43 pm",
    });
    assert.match(label, /25 Sept 2026/i);
    assert.match(label, /06:13\s*pm/i);
  });
});
