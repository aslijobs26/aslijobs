import assert from "node:assert/strict";
import { afterEach, describe, it } from "node:test";
import {
  SITE_LANGUAGE_AUTO_LOCATION_STORAGE_KEY,
  SITE_LANGUAGE_SOURCE_STORAGE_KEY,
  SITE_LANGUAGE_STORAGE_KEY,
  SITE_LOCATION_LANGUAGE_ATTEMPT_STORAGE_KEY,
} from "../constants/site-language";
import {
  resetLocationLanguageDetectionForTests,
  runLocationLanguageDetection,
} from "./detect-location-language";
import type { LocationLanguageRegion } from "./location-language-map";
import { readSiteLanguage, writeSiteLanguage } from "./site-language";

type MemoryStorage = {
  getItem: (key: string) => string | null;
  setItem: (key: string, value: string) => void;
  removeItem: (key: string) => void;
};

function memoryStorage(throwOnWrite = false): MemoryStorage {
  const values = new Map<string, string>();
  return {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => {
      if (throwOnWrite) {
        throw new Error("storage blocked");
      }
      values.set(key, value);
    },
    removeItem: (key) => {
      values.delete(key);
    },
  };
}

function installBrowser(language = "en-US", search = "") {
  const localStorage = memoryStorage();
  const sessionStorage = memoryStorage();
  Object.assign(globalThis, {
    window: {
      localStorage,
      sessionStorage,
      navigator: { language },
      location: { search, pathname: "/" },
      isSecureContext: true,
      dispatchEvent: () => true,
    },
    document: { documentElement: { lang: "en" } },
  });
  return { localStorage, sessionStorage };
}

function permissions(state: string, calls: { count: number }) {
  return {
    query: async () => {
      calls.count += 1;
      return { state };
    },
  };
}

describe("location language detection", () => {
  afterEach(() => {
    resetLocationLanguageDetectionForTests();
    delete (globalThis as { window?: unknown }).window;
  });

  it("switches a granted Andhra Pradesh, Telangana, Tamil Nadu, Karnataka, Kerala, and Hindi reading", async () => {
    const cases: Array<{ state: string; stateCode: string; language: string }> = [
      { state: "Andhra Pradesh", stateCode: "IN-AP", language: "te" },
      { state: "Telangana", stateCode: "IN-TS", language: "te" },
      { state: "Tamil Nadu", stateCode: "IN-TN", language: "ta" },
      { state: "Karnataka", stateCode: "IN-KA", language: "kn" },
      { state: "Kerala", stateCode: "IN-KL", language: "ml" },
      { state: "Uttar Pradesh", stateCode: "IN-UP", language: "hi" },
    ];

    for (const item of cases) {
      resetLocationLanguageDetectionForTests();
      const { localStorage } = installBrowser("en-US");
      let geocodeCalls = 0;
      const result = await runLocationLanguageDetection({
        isSecureContext: true,
        permissions: permissions("granted", { count: 0 }),
        geolocation: {
          getCurrentPosition: (success) => {
            success({ coords: { latitude: 17.4, longitude: 78.5, accuracy: 50 } });
          },
        },
        reverseGeocode: async () => {
          geocodeCalls += 1;
          return {
            countryCode: "IN",
            country: "India",
            state: item.state,
            stateCode: item.stateCode,
          } satisfies LocationLanguageRegion;
        },
      });
      assert.equal(result, "applied", item.state);
      assert.equal(readSiteLanguage().code, item.language, item.state);
      assert.equal(localStorage.getItem(SITE_LANGUAGE_SOURCE_STORAGE_KEY), "automatic");
      assert.equal(geocodeCalls, 1);

      const again = await runLocationLanguageDetection({
        isSecureContext: true,
        geolocation: {
          getCurrentPosition: () => {
            throw new Error("should not request location again");
          },
        },
      });
      assert.equal(again, "skipped", item.state);
      delete (globalThis as { window?: unknown }).window;
    }
  });

  it("keeps English for an international visitor", async () => {
    installBrowser("fr-FR");
    const result = await runLocationLanguageDetection({
      isSecureContext: true,
      permissions: permissions("granted", { count: 0 }),
      geolocation: {
        getCurrentPosition: (success) => {
          success({ coords: { latitude: 40.7, longitude: -74, accuracy: 20 } });
        },
      },
      reverseGeocode: async () => ({
        countryCode: "US",
        country: "United States",
        state: "New York",
        stateCode: "US-NY",
      }),
    });
    assert.equal(result, "applied");
    assert.equal(readSiteLanguage().code, "en");
  });

  it("stays in English when location permission is denied and does not ask again", async () => {
    const { localStorage } = installBrowser("ta-IN");
    const permissionCalls = { count: 0 };
    let positionCalls = 0;
    const result = await runLocationLanguageDetection({
      isSecureContext: true,
      permissions: permissions("denied", permissionCalls),
      geolocation: {
        getCurrentPosition: () => {
          positionCalls += 1;
        },
      },
      reverseGeocode: async () => {
        throw new Error("should not geocode");
      },
    });
    assert.equal(result, "fallback");
    assert.equal(positionCalls, 0);
    assert.equal(readSiteLanguage().code, "en");
    assert.equal(localStorage.getItem(SITE_LANGUAGE_SOURCE_STORAGE_KEY), "default");

    const again = await runLocationLanguageDetection({
      isSecureContext: true,
      permissions: permissions("denied", permissionCalls),
      geolocation: {
        getCurrentPosition: () => {
          positionCalls += 1;
        },
      },
    });
    assert.equal(again, "skipped");
    assert.equal(permissionCalls.count, 1);
    assert.equal(positionCalls, 0);
  });

  it("does not override a manual language after refresh-style reads", async () => {
    installBrowser("en-US");
    writeSiteLanguage({ value: "english", code: "en", label: "English" });
    let positionCalls = 0;
    const result = await runLocationLanguageDetection(
      {
        isSecureContext: true,
        permissions: permissions("granted", { count: 0 }),
        geolocation: {
          getCurrentPosition: (success) => {
            positionCalls += 1;
            success({ coords: { latitude: 17.4, longitude: 78.5, accuracy: 30 } });
          },
        },
        reverseGeocode: async () => ({
          countryCode: "IN",
          state: "Telangana",
          stateCode: "IN-TS",
        }),
      },
      { force: true },
    );
    assert.equal(result, "skipped");
    assert.equal(positionCalls, 0);
    assert.equal(readSiteLanguage().code, "en");
    assert.equal(readSiteLanguage().code, "en");
  });

  it("keeps a previously saved manual language without requesting location", async () => {
    const { localStorage } = installBrowser("te-IN");
    localStorage.setItem(SITE_LANGUAGE_STORAGE_KEY, "tamil");
    localStorage.setItem(SITE_LANGUAGE_SOURCE_STORAGE_KEY, "manual");
    let positionCalls = 0;
    const result = await runLocationLanguageDetection({
      isSecureContext: true,
      geolocation: {
        getCurrentPosition: () => {
          positionCalls += 1;
        },
      },
    });
    assert.equal(result, "skipped");
    assert.equal(positionCalls, 0);
    assert.equal(readSiteLanguage().code, "ta");
  });

  it("stays available when reverse geocoding fails", async () => {
    const { sessionStorage, localStorage } = installBrowser("ta-IN");
    const result = await runLocationLanguageDetection({
      isSecureContext: true,
      permissions: permissions("prompt", { count: 0 }),
      geolocation: {
        getCurrentPosition: (success) => {
          success({ coords: { latitude: 19.07, longitude: 72.87, accuracy: 100 } });
        },
      },
      reverseGeocode: async () => null,
    });
    assert.equal(result, "fallback");
    assert.equal(readSiteLanguage().code, "en");
    assert.equal(localStorage.getItem(SITE_LANGUAGE_SOURCE_STORAGE_KEY), null);
    assert.equal(sessionStorage.getItem(SITE_LOCATION_LANGUAGE_ATTEMPT_STORAGE_KEY), "1");
  });

  it("does not repeat a timed-out lookup during the same visit", async () => {
    installBrowser("en-US");
    let positionCalls = 0;
    const geolocation = {
      getCurrentPosition: (
        _success: (position: {
          coords: { latitude: number; longitude: number; accuracy?: number };
        }) => void,
        error?: (error: { code: number }) => void,
      ) => {
        positionCalls += 1;
        error?.({ code: 3 });
      },
    };
    assert.equal(
      await runLocationLanguageDetection({
        isSecureContext: true,
        permissions: permissions("granted", { count: 0 }),
        geolocation,
        reverseGeocode: async () => null,
      }),
      "fallback",
    );
    assert.equal(
      await runLocationLanguageDetection({
        isSecureContext: true,
        geolocation,
      }),
      "skipped",
    );
    assert.equal(positionCalls, 1);
    assert.equal(readSiteLanguage().code, "en");
  });

  it("uses an already granted permission once and shares an in-flight request", async () => {
    installBrowser("en-US");
    let positionCalls = 0;
    const pending: { finish: (() => void) | null } = { finish: null };
    const geolocation = {
      getCurrentPosition: (
        success: (position: {
          coords: { latitude: number; longitude: number; accuracy?: number };
        }) => void,
      ) => {
        positionCalls += 1;
        pending.finish = () => {
          success({ coords: { latitude: 12.9, longitude: 77.6, accuracy: 40 } });
        };
      },
    };
    const permissionCalls = { count: 0 };
    const deps = {
      isSecureContext: true,
      permissions: permissions("granted", permissionCalls),
      geolocation,
      reverseGeocode: async () => ({
        countryCode: "IN",
        state: "Karnataka",
        stateCode: "IN-KA",
      }),
    };
    const first = runLocationLanguageDetection(deps);
    const second = runLocationLanguageDetection(deps);
    assert.equal(first, second);
    await new Promise((resolve) => setTimeout(resolve, 0));
    assert.equal(positionCalls, 1);
    pending.finish?.();
    assert.equal(await first, "applied");
    assert.equal(readSiteLanguage().code, "kn");
    assert.equal(permissionCalls.count, 1);
  });

  it("ignores a location fix that is too coarse to choose a state", async () => {
    installBrowser("en-US");
    let geocodeCalls = 0;
    const result = await runLocationLanguageDetection({
      isSecureContext: true,
      geolocation: {
        getCurrentPosition: (success) => {
          success({ coords: { latitude: 20, longitude: 78, accuracy: 500_000 } });
        },
      },
      reverseGeocode: async () => {
        geocodeCalls += 1;
        return { countryCode: "IN", state: "Telangana" };
      },
    });
    assert.equal(result, "fallback");
    assert.equal(geocodeCalls, 0);
    assert.equal(readSiteLanguage().code, "en");
  });

  it("stays in English when the browser has no geolocation support", async () => {
    installBrowser("te-IN");
    const result = await runLocationLanguageDetection({
      isSecureContext: true,
      geolocation: null,
    });
    assert.equal(result, "fallback");
    assert.equal(readSiteLanguage().code, "en");
  });

  it("does not follow a notification language link with a new location lookup", async () => {
    const { localStorage } = installBrowser("en-US", "?lang=hi");
    localStorage.setItem(SITE_LANGUAGE_STORAGE_KEY, "english");
    let positionCalls = 0;
    const result = await runLocationLanguageDetection({
      isSecureContext: true,
      geolocation: {
        getCurrentPosition: () => {
          positionCalls += 1;
        },
      },
    });
    assert.equal(result, "skipped");
    assert.equal(positionCalls, 0);
    assert.equal(readSiteLanguage().code, "hi");
    assert.equal(localStorage.getItem(SITE_LANGUAGE_STORAGE_KEY), "english");
  });

  it("keeps working when localStorage cannot be written", async () => {
    const localStorage = memoryStorage(true);
    const sessionStorage = memoryStorage();
    Object.assign(globalThis, {
      window: {
        localStorage,
        sessionStorage,
        navigator: { language: "en-US" },
        location: { search: "", pathname: "/" },
        isSecureContext: true,
        dispatchEvent: () => true,
      },
      document: { documentElement: { lang: "en" } },
    });
    const result = await runLocationLanguageDetection({
      isSecureContext: true,
      permissions: permissions("granted", { count: 0 }),
      geolocation: {
        getCurrentPosition: (success) => {
          success({ coords: { latitude: 16.5, longitude: 80.6, accuracy: 25 } });
        },
      },
      reverseGeocode: async () => ({
        countryCode: "IN",
        state: "Andhra Pradesh",
        stateCode: "IN-AP",
      }),
    });
    assert.equal(result, "skipped");
    assert.equal(readSiteLanguage().code, "en");
  });

  it("does not request location when automatic language selection is off", async () => {
    const { localStorage } = installBrowser("te-IN");
    localStorage.setItem(SITE_LANGUAGE_AUTO_LOCATION_STORAGE_KEY, "0");
    let positionCalls = 0;
    const result = await runLocationLanguageDetection({
      isSecureContext: true,
      geolocation: {
        getCurrentPosition: () => {
          positionCalls += 1;
        },
      },
      reverseGeocode: async () => {
        throw new Error("should not geocode");
      },
    });
    assert.equal(result, "skipped");
    assert.equal(positionCalls, 0);
    assert.equal(readSiteLanguage().code, "te");
  });

  it("stays in English when reverse geocoding throws", async () => {
    const { localStorage, sessionStorage } = installBrowser("ta-IN");
    const result = await runLocationLanguageDetection({
      isSecureContext: true,
      permissions: permissions("granted", { count: 0 }),
      geolocation: {
        getCurrentPosition: (success) => {
          success({ coords: { latitude: 17.4, longitude: 78.5, accuracy: 40 } });
        },
      },
      reverseGeocode: async () => {
        throw new Error("region unavailable");
      },
    });
    assert.equal(result, "fallback");
    assert.equal(readSiteLanguage().code, "en");
    assert.equal(localStorage.getItem(SITE_LANGUAGE_SOURCE_STORAGE_KEY), null);
    assert.equal(sessionStorage.getItem(SITE_LOCATION_LANGUAGE_ATTEMPT_STORAGE_KEY), "1");

    let positionCalls = 0;
    const again = await runLocationLanguageDetection({
      geolocation: {
        getCurrentPosition: () => {
          positionCalls += 1;
        },
      },
    });
    assert.equal(again, "skipped");
    assert.equal(positionCalls, 0);
  });
});
