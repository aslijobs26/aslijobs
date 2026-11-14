import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type { JobLocationItem } from "@/types/jobs-discovery";
import { buildJobSearchHref } from "@/utils/job-search-url";
import {
  buildCityBrowseItems,
  indexStateJobCounts,
  topDistrictsForState,
} from "./location-browse";

const featured: JobLocationItem[] = [
  {
    id: "hyderabad",
    name: "Hyderabad",
    jobCount: "placeholder",
    href: buildJobSearchHref({ state: "telangana", cities: ["hyderabad"] }),
  },
  {
    id: "bangalore",
    name: "Bangalore",
    jobCount: "placeholder",
    href: buildJobSearchHref({ state: "karnataka", cities: ["bangalore"] }),
  },
];

describe("location browse counts", () => {
  it("indexes state counts by the jobs page slug and keeps zero as a real value", () => {
    const counts = indexStateJobCounts([
      { state: "Telangana", count: 4 },
      { state: "telangana", count: 1 },
      { state: "goa", count: 0 },
    ]);
    assert.equal(counts?.get("telangana"), 5);
    assert.equal(counts?.get("goa"), 0);
    assert.equal(counts?.get("kerala"), undefined);
  });

  it("replaces featured city counts and keeps their existing search links", () => {
    const items = buildCityBrowseItems(
      [
        {
          city: "hyderabad",
          cityName: "Hyderabad",
          state: "telangana",
          stateName: "Telangana",
          count: 3,
        },
        {
          city: "bengaluru",
          cityName: "Bengaluru",
          state: "karnataka",
          stateName: "Karnataka",
          count: 2,
        },
        {
          city: "bangalore",
          cityName: "Bangalore",
          state: "karnataka",
          stateName: "Karnataka",
          count: 5,
        },
        {
          city: "pune",
          cityName: "Pune",
          state: "maharashtra",
          stateName: "Maharashtra",
          count: 4,
        },
      ],
      featured,
      "ready",
    );

    assert.equal(items[0]?.jobCount, "3 Jobs");
    assert.equal(items[0]?.href, featured[0]?.href);
    assert.equal(items[1]?.jobCount, "7 Jobs");
    assert.equal(items[1]?.href, featured[1]?.href);
    assert.equal(items[2]?.name, "Pune");
    assert.equal(
      items[2]?.href,
      buildJobSearchHref({ state: "maharashtra", cities: ["pune"] }),
    );
  });

  it("lists a state's districts by job count and ignores other states", () => {
    const districts = topDistrictsForState(
      [
        {
          city: "madhapur",
          cityName: "Madhapur",
          state: "telangana",
          stateName: "Telangana",
          count: 2,
        },
        {
          city: "hyderabad",
          cityName: "Hyderabad",
          state: "telangana",
          stateName: "Telangana",
          count: 5,
        },
        {
          city: "pune",
          cityName: "Pune",
          state: "maharashtra",
          stateName: "Maharashtra",
          count: 9,
        },
      ],
      "telangana",
    );

    assert.deepEqual(
      districts.map((district) => [district.name, district.count]),
      [
        ["Hyderabad", 5],
        ["Madhapur", 2],
      ],
    );
    assert.equal(
      districts[0]?.href,
      buildJobSearchHref({ state: "telangana", cities: ["hyderabad"] }),
    );
  });

  it("does not invent counts while the request is still loading", () => {
    const items = buildCityBrowseItems(null, featured, "loading");
    assert.deepEqual(
      items.map((item) => item.jobCount),
      ["…", "…"],
    );
  });
});
