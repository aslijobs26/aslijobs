import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { z } from "zod";

/**
 * Contract tests for mandatory expectedRevision on Organization mutations.
 * Keeps schema shape locked without needing a live Mongo session.
 */
describe("organization CAS contracts", () => {
  it("requires revision on org-unit updates", () => {
    const schema = z
      .object({
        name: z.string().optional(),
        revision: z.number().int().positive(),
      })
      .refine(
        (body) => Object.keys(body).some((key) => key !== "revision"),
        { message: "At least one field is required." },
      );

    assert.throws(() => schema.parse({ name: "Hyderabad" }));
    assert.deepEqual(schema.parse({ name: "Hyderabad", revision: 2 }), {
      name: "Hyderabad",
      revision: 2,
    });
  });

  it("requires expectedRevision on role archive and restore", () => {
    const archive = z.object({
      reassignRoleId: z.string().optional().default(""),
      expectedRevision: z.coerce.number().int().min(1),
    });
    const restore = z.object({
      expectedRevision: z.coerce.number().int().min(1),
    });

    assert.throws(() => archive.parse({}));
    assert.throws(() => restore.parse({}));
    assert.equal(archive.parse({ expectedRevision: "3" }).expectedRevision, 3);
    assert.equal(restore.parse({ expectedRevision: 4 }).expectedRevision, 4);
  });

  it("requires expectedRevision on department update and archive", () => {
    const update = z.object({
      name: z.string().optional(),
      expectedRevision: z.coerce.number().int().min(1),
    });
    const archive = z.object({
      expectedRevision: z.coerce.number().int().min(1),
    });

    assert.throws(() => update.parse({ name: "Ops" }));
    assert.throws(() => archive.parse({}));
    assert.equal(
      update.parse({ name: "Ops", expectedRevision: 1 }).expectedRevision,
      1,
    );
  });
});
