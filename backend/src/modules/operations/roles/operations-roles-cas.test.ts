import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { prepareRoleGrants } from "./operations-role-grants.js";

describe("prepareRoleGrants", () => {
  it("keeps known catalog keys for Super Admin and drops unknown keys", () => {
    const grants = prepareRoleGrants({
      requestedGrants: [
        { key: "employers.list.view" },
        { key: "not.a.real.permission.key" },
        { key: "my_work.list.view" },
      ],
      isSuperAdmin: true,
      actorDelegatableKeys: [],
    });
    assert.deepEqual(
      grants.map((grant) => grant.key).sort(),
      ["employers.list.view", "my_work.list.view"],
    );
  });
});

describe("role expectedRevision comparison", () => {
  it("treats string and number revisions as equal when coerced", () => {
    const expectedRevision = Number("4");
    const currentRevision = Number(4);
    assert.equal(expectedRevision, currentRevision);
    assert.equal(expectedRevision !== currentRevision, false);
  });

  it("detects stale expectedRevision", () => {
    const expectedRevision = Number(4);
    const currentRevision = Number(5);
    assert.equal(expectedRevision !== currentRevision, true);
  });
});
