import assert from "node:assert/strict";
import { afterEach, describe, it } from "node:test";
import { HTTP_STATUS } from "../../constants/http-status.js";
import { AppError } from "../../middleware/error.middleware.js";
import { requestIdMiddleware } from "../../middleware/request-id.middleware.js";
import {
  parseBigDataCloudRegion,
  parseNominatimRegion,
  parsePhotonRegion,
  roundCoordinate,
} from "./language-region.parse.js";
import {
  assertPublicGeocodeBaseUrl,
  BIGDATACLOUD_CLIENT_URL,
  BIGDATACLOUD_SERVER_URL,
  PHOTON_REVERSE_URL,
  resolveLanguageRegionProviders,
} from "./language-region.provider.js";
import {
  resetLanguageRegionClientForTests,
  reverseGeocodeLanguageRegion,
  type ReverseGeocodeDeps,
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

  it("reads a Photon feature without using a building name as the city", () => {
    const region = parsePhotonRegion({
      features: [
        {
          properties: {
            name: "Gokul Chat",
            state: "Telangana",
            country: "India",
            countrycode: "in",
            locality: "Sultan Bazar",
          },
        },
      ],
    });
    assert.equal(region?.countryCode, "IN");
    assert.equal(region?.state, "Telangana");
    assert.equal(region?.city, "Sultan Bazar");
  });

  it("accepts a country when the state is missing and rejects an empty feature", () => {
    const countryOnly = parsePhotonRegion({
      features: [{ properties: { country: "France", countrycode: "FR" } }],
    });
    assert.equal(countryOnly?.countryCode, "FR");
    assert.equal(countryOnly?.state, "");
    assert.equal(parsePhotonRegion({ features: [] }), null);
    assert.equal(parsePhotonRegion({ features: [{ properties: { name: "Cafe" } }] }), null);
    assert.equal(parseBigDataCloudRegion({ principalSubdivision: "Kerala" })?.state, "Kerala");
    assert.equal(parseBigDataCloudRegion({ city: "Hyderabad" }), null);
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
    for (const [lat, lon] of [
      [120, 0],
      [-91, 0],
      [0, 181],
      [0, -181],
    ] as const) {
      await assert.rejects(
        () => reverseGeocodeLanguageRegion(lat, lon),
        (error: unknown) => {
          assert.ok(error instanceof AppError);
          assert.equal(error.statusCode, HTTP_STATUS.BAD_REQUEST);
          assert.equal(error.message, "A valid location is required.");
          return true;
        },
      );
    }
  });
});

const singleProvider = {
  provider: "bigdatacloud" as const,
  endpoint: "https://geo.example.test/reverse",
};

async function captureErrors(run: () => Promise<void>): Promise<string[]> {
  const lines: string[] = [];
  const original = console.error;
  console.error = (...args: unknown[]) => {
    lines.push(args.map((item) => String(item)).join(" "));
  };
  try {
    await run();
  } finally {
    console.error = original;
  }
  return lines;
}

function expectFailure(
  statusCode: number,
  deps: ReverseGeocodeDeps,
): Promise<void> {
  return assert.rejects(
    () => reverseGeocodeLanguageRegion(17.385, 78.487, deps),
    (error: unknown) => {
      assert.ok(error instanceof AppError);
      assert.equal(error.statusCode, statusCode);
      assert.equal(error.message, "Language region is temporarily unavailable.");
      assert.equal(error.message.includes("17.385"), false);
      assert.equal(error.message.includes("78.487"), false);
      return true;
    },
  );
}

describe("language region providers", () => {
  it("uses Photon first and the canonical BigDataCloud host as fallback", () => {
    const providers = resolveLanguageRegionProviders({ baseUrl: "", apiKey: "" });
    assert.deepEqual(
      providers.map((item) => item.urlBase),
      [PHOTON_REVERSE_URL, BIGDATACLOUD_CLIENT_URL],
    );
    assert.equal(providers[1]?.urlBase.includes("bigdatacloud.net"), false);
  });

  it("prefers the keyed BigDataCloud server API, then Photon", () => {
    const providers = resolveLanguageRegionProviders({
      baseUrl: "  ",
      apiKey: "server-key",
    });
    assert.equal(providers[0]?.urlBase, BIGDATACLOUD_SERVER_URL);
    assert.equal(providers[0]?.apiKey, "server-key");
    assert.equal(providers[1]?.provider, "photon");
  });

  it("uses only a configured Nominatim URL", () => {
    const providers = resolveLanguageRegionProviders({
      baseUrl: " https://nominatim.example.com/reverse ",
      apiKey: "ignored",
    });
    assert.deepEqual(providers, [
      {
        provider: "nominatim",
        urlBase: "https://nominatim.example.com/reverse",
        apiKey: "",
      },
    ]);
  });

  it("rejects private and credentialled reverse-geocode URLs", async () => {
    await assert.rejects(
      () => assertPublicGeocodeBaseUrl("http://169.254.169.254/latest"),
      /private_ip_forbidden/,
    );
    await assert.rejects(
      () => assertPublicGeocodeBaseUrl("https://user:secret@nominatim.example.com/reverse"),
      /credentials_forbidden/,
    );
    await assert.rejects(
      () => assertPublicGeocodeBaseUrl("http://metadata.google.internal/"),
      /host_forbidden/,
    );
    await assert.rejects(
      () =>
        assertPublicGeocodeBaseUrl("https://nominatim.example.com/reverse", async () => [
          { address: "10.1.1.1" },
        ]),
      /resolved_private_ip/,
    );
    await assertPublicGeocodeBaseUrl("https://nominatim.example.com/reverse", async () => [
      { address: "8.8.8.8" },
    ]);
  });
});

describe("language region upstream failures", () => {
  afterEach(() => {
    resetLanguageRegionClientForTests();
  });

  it("parses a Photon result from rounded coordinates", async () => {
    const urls: string[] = [];
    const region = await reverseGeocodeLanguageRegion(17.385044, 78.486671, {
      requestId: "req-photon",
      providers: [
        { provider: "photon", urlBase: PHOTON_REVERSE_URL, apiKey: "" },
        { provider: "bigdatacloud", urlBase: BIGDATACLOUD_CLIENT_URL, apiKey: "" },
      ],
      fetchImpl: async (input) => {
        const url = String(input);
        urls.push(url);
        if (url.startsWith(PHOTON_REVERSE_URL)) {
          return jsonResponse(
            {
              features: [
                {
                  properties: {
                    state: "Telangana",
                    country: "India",
                    countrycode: "IN",
                    city: "Hyderabad",
                  },
                },
              ],
            },
          );
        }
        throw new Error("fallback should not run");
      },
    });
    assert.equal(region.state, "Telangana");
    assert.equal(region.city, "Hyderabad");
    assert.equal(urls.length, 1);
    assert.match(urls[0] ?? "", /lat=17\.385/);
    assert.match(urls[0] ?? "", /lon=78\.487/);
    assert.doesNotMatch(urls[0] ?? "", /17\.385044/);
  });

  it("uses the next provider when the first one is rate limited", async () => {
    const region = await reverseGeocodeLanguageRegion(13.083, 80.27, {
      providers: [
        { provider: "photon", urlBase: PHOTON_REVERSE_URL, apiKey: "" },
        { provider: "bigdatacloud", urlBase: BIGDATACLOUD_CLIENT_URL, apiKey: "" },
      ],
      fetchImpl: async (input) => {
        if (String(input).startsWith(PHOTON_REVERSE_URL)) {
          return jsonResponse({ message: "slow down" }, 429);
        }
        return jsonResponse({
          countryCode: "IN",
          countryName: "India",
          principalSubdivision: "Tamil Nadu",
          principalSubdivisionCode: "IN-TN",
          city: "Chennai",
        });
      },
    });
    assert.equal(region.state, "Tamil Nadu");
  });

  it("returns 504 when the upstream request times out", async () => {
    const lines = await captureErrors(async () => {
      await expectFailure(HTTP_STATUS.GATEWAY_TIMEOUT, {
        ...singleProvider,
        requestId: "req-timeout",
        fetchImpl: async () => {
          const error = new Error("The operation was aborted due to timeout");
          error.name = "TimeoutError";
          throw error;
        },
      });
    });
    const diagnostic = lines.find((line) => line.includes("req-timeout")) ?? "";
    assert.match(diagnostic, /"category":"timeout"/);
    assert.match(diagnostic, /"provider":"bigdatacloud"/);
    assert.match(diagnostic, /"timeoutMs":6000/);
    assert.equal(diagnostic.includes("17.385"), false);
  });

  it("returns 429 for an upstream rate limit and 502 for an upstream 5xx", async () => {
    await expectFailure(HTTP_STATUS.TOO_MANY_REQUESTS, {
      ...singleProvider,
      fetchImpl: async () => jsonResponse({ status: 429 }, 429),
    });
    resetLanguageRegionClientForTests();
    const lines = await captureErrors(async () => {
      await expectFailure(HTTP_STATUS.BAD_GATEWAY, {
        ...singleProvider,
        requestId: "req-upstream",
        fetchImpl: async () => jsonResponse({ status: 503 }, 503),
      });
    });
    assert.match(lines.join("\n"), /"category":"upstream_http"/);
    assert.match(lines.join("\n"), /"upstreamStatus":503/);
  });

  it("treats a BigDataCloud rate-limit body as 429", async () => {
    await expectFailure(HTTP_STATUS.TOO_MANY_REQUESTS, {
      ...singleProvider,
      fetchImpl: async () => jsonResponse({ status: 429, description: "slow down" }),
    });
  });

  it("returns 502 for invalid JSON, a missing region, and a network error", async () => {
    await expectFailure(HTTP_STATUS.BAD_GATEWAY, {
      ...singleProvider,
      fetchImpl: async () => new Response("not-json", { status: 200 }),
    });
    resetLanguageRegionClientForTests();
    const urls: string[] = [];
    const lines = await captureErrors(async () => {
      await expectFailure(HTTP_STATUS.BAD_GATEWAY, {
        ...singleProvider,
        requestId: "req-network",
        apiKey: "super-secret-key",
        fetchImpl: async (input) => {
          urls.push(String(input));
          throw new TypeError("fetch failed");
        },
      });
    });
    const diagnostic = lines.join("\n");
    assert.match(urls[0] ?? "", /super-secret-key/);
    assert.match(diagnostic, /"requestId":"req-network"/);
    assert.match(diagnostic, /"category":"network"/);
    assert.equal(diagnostic.includes("super-secret-key"), false);
    assert.equal(diagnostic.includes("17.385"), false);

    resetLanguageRegionClientForTests();
    await expectFailure(HTTP_STATUS.BAD_GATEWAY, {
      ...singleProvider,
      fetchImpl: async () => jsonResponse({ city: "Hyderabad" }),
    });
  });

  it("keeps a country-only result and does not follow a private redirect", async () => {
    const country = await reverseGeocodeLanguageRegion(48.856, 2.352, {
      ...singleProvider,
      fetchImpl: async () =>
        jsonResponse({
          countryCode: "FR",
          countryName: "France",
        }),
    });
    assert.equal(country.countryCode, "FR");
    assert.equal(country.state, "");

    resetLanguageRegionClientForTests();
    const urls: string[] = [];
    await expectFailure(HTTP_STATUS.BAD_GATEWAY, {
      ...singleProvider,
      fetchImpl: async (input) => {
        urls.push(String(input));
        return new Response(null, {
          status: 307,
          headers: { location: "http://127.0.0.1/latest" },
        });
      },
    });
    assert.equal(urls.length, 1);
    assert.equal(urls[0]?.includes("127.0.0.1"), false);
  });

  it("does not call a private reverse-geocode URL", async () => {
    let called = false;
    const lines = await captureErrors(async () => {
      await expectFailure(HTTP_STATUS.BAD_GATEWAY, {
        requestId: "req-ssrf",
        enforceSsrf: true,
        providers: [
          {
            provider: "nominatim",
            urlBase: "http://169.254.169.254/reverse",
            apiKey: "",
          },
        ],
        fetchImpl: async () => {
          called = true;
          return jsonResponse({});
        },
      });
    });
    assert.equal(called, false);
    assert.match(lines.join("\n"), /"category":"invalid_endpoint"/);
    assert.match(lines.join("\n"), /"reason":"private_ip_forbidden"/);
    assert.equal(lines.join("\n").includes("169.254.169.254"), false);
  });

  it("stops calling upstream after the process budget is exhausted", async () => {
    let calls = 0;
    const fetchImpl: typeof fetch = async () => {
      calls += 1;
      return jsonResponse({
        countryCode: "IN",
        countryName: "India",
        principalSubdivision: "Karnataka",
      });
    };
    await reverseGeocodeLanguageRegion(12.972, 77.594, {
      ...singleProvider,
      upstreamLimit: 1,
      fetchImpl,
    });
    await expectFailure(HTTP_STATUS.TOO_MANY_REQUESTS, {
      ...singleProvider,
      upstreamLimit: 1,
      fetchImpl,
    });
    assert.equal(calls, 1);
  });
});

describe("language region request ids", () => {
  it("generates a request id and keeps a supplied one", () => {
    const headers = new Map<string, string>();
    const generated = { headers: {} } as Parameters<typeof requestIdMiddleware>[0];
    requestIdMiddleware(
      generated,
      {
        setHeader(name: string, value: string) {
          headers.set(name.toLowerCase(), value);
        },
      } as Parameters<typeof requestIdMiddleware>[1],
      () => undefined,
    );
    assert.match(generated.requestId ?? "", /^[0-9a-f-]{36}$/i);
    assert.equal(headers.get("x-request-id"), generated.requestId);

    const supplied = {
      headers: { "x-request-id": "db0ee0f8-9808-403a-aacf-c5e3dd2824cb" },
    } as unknown as Parameters<typeof requestIdMiddleware>[0];
    const suppliedHeaders = new Map<string, string>();
    requestIdMiddleware(
      supplied,
      {
        setHeader(name: string, value: string) {
          suppliedHeaders.set(name.toLowerCase(), value);
        },
      } as Parameters<typeof requestIdMiddleware>[1],
      () => undefined,
    );
    assert.equal(supplied.requestId, "db0ee0f8-9808-403a-aacf-c5e3dd2824cb");
    assert.equal(suppliedHeaders.get("x-request-id"), supplied.requestId);
  });
});
