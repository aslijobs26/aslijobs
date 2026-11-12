import assert from "node:assert/strict";
import { afterEach, describe, it } from "node:test";
import { HTTP_STATUS } from "../../constants/http-status.js";
import { AppError } from "../../middleware/error.middleware.js";
import {
  parseBigDataCloudRegion,
  parseNominatimRegion,
  roundCoordinate,
} from "./language-region.parse.js";
import {
  resetLanguageRegionClientForTests,
  reverseGeocodeLanguageRegion,
} from "./language-region.service.js";

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

describe("language region parsing", () => {
  it("reads a BigDataCloud state without keeping coordinates", () => {
    const region = parseBigDataCloudRegion({
      latitude: 17.385044,
      longitude: 78.486671,
      countryName: "India",
      countryCode: "IN",
      principalSubdivision: "Telangana",
      principalSubdivisionCode: "IN-TG",
      city: "Hyderabad",
      localityInfo: { administrative: [] },
    });
    assert.deepEqual(region, {
      countryCode: "IN",
      country: "India",
      state: "Telangana",
      stateCode: "IN-TG",
      city: "Hyderabad",
    });
  });

  it("reads a Nominatim address without the display name", () => {
    const region = parseNominatimRegion({
      display_name: "Chennai, Tamil Nadu, India",
      lat: "13.08",
      lon: "80.27",
      address: {
        city: "Chennai",
        state: "Tamil Nadu",
        country: "India",
        country_code: "in",
        "ISO3166-2-lvl4": "IN-TN",
      },
    });
    assert.equal(region?.countryCode, "IN");
    assert.equal(region?.state, "Tamil Nadu");
    assert.equal(region?.stateCode, "IN-TN");
    assert.equal(region?.city, "Chennai");
  });

  it("rejects error payloads", () => {
    assert.equal(parseBigDataCloudRegion({ status: 403, description: "no" }), null);
    assert.equal(parseNominatimRegion({ error: "Unable to geocode" }), null);
    assert.equal(parseBigDataCloudRegion(null), null);
    assert.equal(parseNominatimRegion([]), null);
  });

  it("rounds coordinates to three decimal places", () => {
    assert.equal(roundCoordinate(17.385044), 17.385);
    assert.equal(roundCoordinate(-78.486671), -78.487);
  });
});

describe("language region lookup", () => {
  afterEach(() => {
    resetLanguageRegionClientForTests();
  });

  it("sends rounded coordinates and does not repeat a cached lookup", async () => {
    const urls: string[] = [];
    const fetchImpl: typeof fetch = async (input) => {
      urls.push(String(input));
      return jsonResponse({
        countryName: "India",
        countryCode: "IN",
        principalSubdivision: "Andhra Pradesh",
        principalSubdivisionCode: "IN-AP",
        city: "Visakhapatnam",
      });
    };

    const rawLat = 17.686815;
    const rawLon = 83.218541;
    const first = await reverseGeocodeLanguageRegion(rawLat, rawLon, {
      fetchImpl,
      provider: "bigdatacloud",
      endpoint: "https://geo.example.test/reverse",
    });
    const second = await reverseGeocodeLanguageRegion(
      roundCoordinate(rawLat),
      roundCoordinate(rawLon),
      {
        fetchImpl,
        provider: "bigdatacloud",
        endpoint: "https://geo.example.test/reverse",
      },
    );

    assert.equal(first.state, "Andhra Pradesh");
    assert.equal(second.city, "Visakhapatnam");
    assert.equal(urls.length, 1);
    assert.match(urls[0] ?? "", /latitude=\d+\.\d{3}/);
    assert.match(urls[0] ?? "", /longitude=\d+\.\d{3}/);
    assert.doesNotMatch(urls[0] ?? "", /17\.686815/);
    assert.doesNotMatch(urls[0] ?? "", /83\.218541/);
    assert.equal("latitude" in first, false);
  });

  it("parses a Nominatim endpoint and fails closed on a provider error", async () => {
    const fetchImpl: typeof fetch = async () =>
      jsonResponse({
        address: {
          state: "Kerala",
          country: "India",
          country_code: "in",
          "ISO3166-2-lvl4": "IN-KL",
          city: "Kochi",
        },
      });
    const region = await reverseGeocodeLanguageRegion(9.9312, 76.2673, {
      fetchImpl,
      provider: "nominatim",
      endpoint: "https://nominatim.example.test/reverse",
    });
    assert.equal(region.stateCode, "IN-KL");

    await assert.rejects(
      () =>
        reverseGeocodeLanguageRegion(1, 1, {
          fetchImpl: async () => jsonResponse({ error: "nope" }, 200),
          provider: "nominatim",
          endpoint: "https://nominatim.example.test/reverse",
        }),
      (error: unknown) => {
        assert.ok(error instanceof AppError);
        assert.equal(error.statusCode, HTTP_STATUS.BAD_GATEWAY);
        assert.equal(error.message.includes("1"), false);
        return true;
      },
    );
  });

  it("rejects coordinates that are not a real position", async () => {
    await assert.rejects(
      () => reverseGeocodeLanguageRegion(120, 0),
      (error: unknown) => {
        assert.ok(error instanceof AppError);
        assert.equal(error.statusCode, HTTP_STATUS.BAD_REQUEST);
        return true;
      },
    );
  });
});
