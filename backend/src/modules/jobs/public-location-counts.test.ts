import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  canonicalPublicCitySlug,
  clearPublicLocationCountsCache,
  readPublicLocationCountsCache,
  resolvePublicStateId,
  rollupPublicLocationCounts,
  writePublicLocationCountsCache,
} from "./public-location-counts.js";

describe("public location counts", () => {
  it("counts a state only when the public state filter would match it", () => {
    assert.equal(resolvePublicStateId("telangana", "Telangana"), "telangana");
    assert.equal(resolvePublicStateId("", "Odisha"), "odisha");
    assert.equal(resolvePublicStateId("andhra pradesh", ""), "andhra-pradesh");
    assert.equal(resolvePublicStateId("nct-of-delhi", "NCT of Delhi"), "");
    assert.equal(resolvePublicStateId("delhi", "NCT of Delhi"), "delhi");
    assert.equal(resolvePublicStateId("daman-and-diu", "Daman and Diu"), "");
  });

  it("folds city aliases used by job search links", () => {
    assert.equal(canonicalPublicCitySlug("bengaluru"), "bangalore");
    assert.equal(canonicalPublicCitySlug("visakhapatnam", ""), "vizag");
    assert.equal(canonicalPublicCitySlug("", "Hyderabad"), "hyderabad");
  });

  it("sums active rows onto canonical state and city slugs", () => {
    const result = rollupPublicLocationCounts([
      {
        state: "telangana",
        stateName: "telangana",
        city: "hyderabad",
        cityName: "Hyderabad",
        count: 4,
      },
      {
        state: "telangana",
        stateName: "telangana",
        city: "warangal",
        cityName: "Warangal",
        count: 1,
      },
      {
        state: "karnataka",
        stateName: "karnataka",
        city: "bengaluru",
        cityName: "Bengaluru",
        count: 3,
      },
      {
        state: "karnataka",
        stateName: "karnataka",
        city: "bangalore",
        cityName: "Bangalore",
        count: 2,
      },
      {
        state: "nct-of-delhi",
        stateName: "nct of delhi",
        city: "delhi",
        cityName: "Delhi",
        count: 9,
      },
      {
        state: "",
        stateName: "goa",
        city: "",
        cityName: "",
        count: 2,
      },
    ]);

    assert.deepEqual(
      result.states.map((row) => [row.state, row.count]),
      [
        ["karnataka", 5],
        ["telangana", 5],
        ["goa", 2],
      ],
    );
    const bangalore = result.cities.find((row) => row.city === "bangalore");
    assert.equal(bangalore?.count, 5);
    assert.equal(bangalore?.state, "karnataka");
    assert.equal(bangalore?.cityName, "Bengaluru");
    const unmatchedState = result.cities.find((row) => row.city === "delhi");
    assert.equal(unmatchedState?.count, 9);
    assert.equal(unmatchedState?.state, "");
  });

  it("drops the cached payload when jobs change", () => {
    clearPublicLocationCountsCache();
    writePublicLocationCountsCache({ states: [], cities: [] });
    assert.ok(readPublicLocationCountsCache());
    clearPublicLocationCountsCache();
    assert.equal(readPublicLocationCountsCache(), null);
  });
});
