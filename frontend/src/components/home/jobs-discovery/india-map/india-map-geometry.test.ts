import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { INDIA_MAP_REGIONS } from "./india-map-geometry";

const EXPECTED_REGIONS = [
  "andaman-and-nicobar-islands",
  "andhra-pradesh",
  "arunachal-pradesh",
  "assam",
  "bihar",
  "chandigarh",
  "chhattisgarh",
  "dadra-and-nagar-haveli-and-daman-and-diu",
  "delhi",
  "goa",
  "gujarat",
  "haryana",
  "himachal-pradesh",
  "jammu-and-kashmir",
  "jharkhand",
  "karnataka",
  "kerala",
  "ladakh",
  "lakshadweep",
  "madhya-pradesh",
  "maharashtra",
  "manipur",
  "meghalaya",
  "mizoram",
  "nagaland",
  "odisha",
  "puducherry",
  "punjab",
  "rajasthan",
  "sikkim",
  "tamil-nadu",
  "telangana",
  "tripura",
  "uttar-pradesh",
  "uttarakhand",
  "west-bengal",
] as const;

describe("India map geometry", () => {
  it("has one interactive shape for every state and union territory", () => {
    const ids = INDIA_MAP_REGIONS.map((region) => region.id);
    assert.deepEqual([...ids].sort(), [...EXPECTED_REGIONS].sort());
    assert.equal(new Set(ids).size, 36);

    for (const region of INDIA_MAP_REGIONS) {
      assert.match(region.d, /^M/);
      assert.ok(region.d.includes("Z"));
      assert.ok(region.label.length > 0);
      assert.ok(region.name.length > 0);
    }
  });
});
