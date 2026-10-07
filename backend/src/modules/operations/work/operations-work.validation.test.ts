import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { listOperationsWorkQuerySchema } from "./operations-work.validation.js";

describe("operations work list validation", () => {
  it("accepts do_now due filter matching KPI semantics", () => {
    const parsed = listOperationsWorkQuerySchema.parse({
      due: "do_now",
      tab: "all",
    });
    assert.equal(parsed.due, "do_now");
    assert.equal(parsed.tab, "all");
  });

  it("rejects arbitrary sort field injection", () => {
    assert.throws(() =>
      listOperationsWorkQuerySchema.parse({
        sort: "metadata.secret",
      }),
    );
  });

  it("defaults sort to createdAt desc", () => {
    const parsed = listOperationsWorkQuerySchema.parse({});
    assert.equal(parsed.sort, "createdAt");
    assert.equal(parsed.order, "desc");
  });
});
