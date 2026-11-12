import assert from "node:assert/strict";
import { afterEach, describe, it } from "node:test";
import {
  parseLanguageRegionPayload,
  reverseGeocodeLanguageRegion,
  roundCoordinate,
} from "./language-region.service";

describe("language region client", () => {
  const originalFetch = globalThis.fetch;

  afterEach(() => {
    globalThis.fetch = originalFetch;
    delete (globalThis as { window?: unknown }).window;
  });

  it("reads a successful region payload", () => {
    const region = parseLanguageRegionPayload({
      success: true,
      data: {
        countryCode: "in",
        country: "India",
        state: "Kerala",
        stateCode: "in-kl",
        city: "Kochi",
      },
    });
    assert.deepEqual(region, {
      countryCode: "IN",
      country: "India",
      state: "Kerala",
      stateCode: "IN-KL",
      city: "Kochi",
    });
    assert.equal(parseLanguageRegionPayload({ success: false }), null);
    assert.equal(roundCoordinate(17.385044), 17.385);
    assert.equal(roundCoordinate(78.486671), 78.487);
  });

  it("posts rounded coordinates and returns the region", async () => {
    let requestUrl = "";
    let requestBody = "";
    globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
      requestUrl = String(input);
      requestBody = String(init?.body ?? "");
      assert.equal(init?.method, "POST");
      assert.equal(init?.credentials, "omit");
      const headers = new Headers(init?.headers);
      assert.equal(headers.get("content-type"), "application/json");
      assert.equal(headers.get("accept"), "application/json");
      return new Response(
        JSON.stringify({
          success: true,
          data: {
            countryCode: "IN",
            country: "India",
            state: "Telangana",
            stateCode: "IN-TS",
            city: "Hyderabad",
          },
        }),
        { status: 200, headers: { "Content-Type": "application/json" } },
      );
    }) as typeof fetch;

    const region = await reverseGeocodeLanguageRegion(17.385044, 78.486671);
    assert.equal(region?.state, "Telangana");
    assert.equal(region?.stateCode, "IN-TS");
    assert.match(requestUrl, /\/geo\/region$/);
    assert.deepEqual(JSON.parse(requestBody), { lat: 17.385, lon: 78.487 });
  });

  it("returns null when the region API fails or returns invalid JSON", async () => {
    globalThis.fetch = (async () =>
      new Response(
        JSON.stringify({
          success: false,
          message: "Language region is temporarily unavailable.",
        }),
        { status: 502 },
      )) as typeof fetch;
    assert.equal(await reverseGeocodeLanguageRegion(12.97, 77.59), null);

    globalThis.fetch = (async () => new Response("not-json", { status: 200 })) as typeof fetch;
    assert.equal(await reverseGeocodeLanguageRegion(12.97, 77.59), null);
  });

  it("returns null when the region API times out", async () => {
    globalThis.fetch = ((_input: RequestInfo | URL, init?: RequestInit) =>
      new Promise((_resolve, reject) => {
        init?.signal?.addEventListener("abort", () => {
          reject(Object.assign(new Error("aborted"), { name: "AbortError" }));
        });
      })) as typeof fetch;

    const started = Date.now();
    const region = await reverseGeocodeLanguageRegion(15.9, 80.6, { timeoutMs: 20 });
    assert.equal(region, null);
    assert.ok(Date.now() - started < 1_000);
  });
});
