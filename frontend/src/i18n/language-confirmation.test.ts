import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { afterEach, describe, it } from "node:test";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import {
  SITE_LANGUAGE_OPTIONS,
  SITE_LANGUAGE_SOURCE_STORAGE_KEY,
  SITE_LANGUAGE_STORAGE_KEY,
  SITE_LOCATION_LANGUAGE_ATTEMPT_STORAGE_KEY,
  SITE_LOCATION_SUGGESTION_DECISION_KEY,
} from "../constants/site-language";
import {
  resetLocationLanguageDetectionForTests,
  runLocationLanguageDetection,
} from "./detect-location-language";
import {
  LANGUAGE_PROMPT_A11Y,
  LOCATION_SUGGESTION_DISMISS_MS,
  NAVBAR_CONFIRMATION_DISMISS_MS,
  acceptLanguagePrompt,
  closeLanguagePromptWithoutApplying,
  languageNameKey,
  languagePromptDuration,
  languagePromptRevisionForTests,
  openLanguagePrompt,
  readLanguagePrompt,
  rejectLanguagePrompt,
  resetLanguagePromptForTests,
  startLanguagePromptTimer,
} from "./language-confirmation";
import { readSiteLanguage, setSiteLanguageAccountPersister, writeAutomaticSiteLanguage, writeSiteLanguage } from "./site-language";
import { translate } from "./translate";

const here = dirname(fileURLToPath(import.meta.url));

type MemoryStorage = {
  getItem: (key: string) => string | null;
  setItem: (key: string, value: string) => void;
  removeItem: (key: string) => void;
};

function memoryStorage(): MemoryStorage {
  const values = new Map<string, string>();
  return {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => {
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

function option(code: string) {
  const found = SITE_LANGUAGE_OPTIONS.find((item) => item.code === code);
  if (!found) {
    throw new Error(`missing language ${code}`);
  }
  return found;
}

describe("language confirmation", () => {
  afterEach(() => {
    resetLocationLanguageDetectionForTests();
    resetLanguagePromptForTests();
    delete (globalThis as { window?: unknown }).window;
  });

  it("suggests Telugu for a first visit and waits for confirmation", async () => {
    const { localStorage } = installBrowser("en-US");
    const result = await runLocationLanguageDetection({
      isSecureContext: true,
      permissions: { query: async () => ({ state: "granted" }) },
      geolocation: {
        getCurrentPosition: (success) => {
          success({ coords: { latitude: 17.385, longitude: 78.487, accuracy: 40 } });
        },
      },
      reverseGeocode: async () => ({
        countryCode: "IN",
        country: "India",
        state: "Telangana",
        stateCode: "IN-TS",
      }),
    });

    assert.equal(result, "suggested");
    assert.equal(readSiteLanguage().code, "en");
    assert.equal(readLanguagePrompt()?.kind, "location");
    assert.equal(readLanguagePrompt()?.language.code, "te");
    assert.equal(localStorage.getItem(SITE_LANGUAGE_SOURCE_STORAGE_KEY), null);

    const message = translate("en", "languageConfirm.suggestionMessage", {
      language: translate("en", languageNameKey("te")),
      native: option("te").label,
    });
    assert.match(message, /Telugu/);
    assert.match(message, /తెలుగు/);
    assert.equal(message.includes("Telangana"), false);
    assert.equal(
      translate("en", "languageConfirm.changeTo", {
        language: translate("en", languageNameKey("te")),
      }),
      "Change to Telugu",
    );
  });

  it("applies Telugu only after the visitor confirms", async () => {
    const { localStorage } = installBrowser();
    const saved: string[] = [];
    setSiteLanguageAccountPersister((next) => {
      saved.push(next.code);
    });
    openLanguagePrompt("location", option("te"));
    assert.equal(readSiteLanguage().code, "en");

    assert.equal(acceptLanguagePrompt(), true);
    assert.equal(readLanguagePrompt(), null);
    assert.equal(readSiteLanguage().code, "te");
    assert.equal(localStorage.getItem(SITE_LANGUAGE_STORAGE_KEY), "telugu");
    assert.equal(localStorage.getItem(SITE_LANGUAGE_SOURCE_STORAGE_KEY), "manual");
    assert.deepEqual(saved, ["te"]);
  });

  it("keeps English when the suggestion is declined and does not ask again", async () => {
    const { localStorage, sessionStorage } = installBrowser();
    openLanguagePrompt("location", option("te"));
    rejectLanguagePrompt();

    assert.equal(readSiteLanguage().code, "en");
    assert.equal(localStorage.getItem(SITE_LANGUAGE_SOURCE_STORAGE_KEY), null);
    assert.equal(localStorage.getItem(SITE_LOCATION_SUGGESTION_DECISION_KEY), "keep-english");
    sessionStorage.removeItem(SITE_LOCATION_LANGUAGE_ATTEMPT_STORAGE_KEY);

    let positionCalls = 0;
    const again = await runLocationLanguageDetection({
      isSecureContext: true,
      geolocation: {
        getCurrentPosition: () => {
          positionCalls += 1;
        },
      },
    });
    assert.equal(again, "skipped");
    assert.equal(positionCalls, 0);
    assert.equal(readSiteLanguage().code, "en");
  });

  it("does not change the language when the suggestion times out or closes", () => {
    const { localStorage, sessionStorage } = installBrowser();
    openLanguagePrompt("location", option("ta"));
    let fired = false;
    let cancelled = false;
    const stop = startLanguagePromptTimer(
      "location",
      () => {
        fired = true;
        closeLanguagePromptWithoutApplying();
      },
      ((callback: () => void, durationMs: number) => {
        assert.equal(durationMs, LOCATION_SUGGESTION_DISMISS_MS);
        assert.equal(durationMs >= 8_000 && durationMs <= 10_000, true);
        callback();
        return 1 as unknown as ReturnType<typeof setTimeout>;
      }) as typeof setTimeout,
      () => {
        cancelled = true;
      },
    );

    assert.equal(fired, true);
    assert.equal(readLanguagePrompt(), null);
    assert.equal(readSiteLanguage().code, "en");
    assert.equal(localStorage.getItem(SITE_LANGUAGE_STORAGE_KEY), null);
    assert.equal(localStorage.getItem(SITE_LOCATION_SUGGESTION_DECISION_KEY), null);
    assert.equal(sessionStorage.getItem(SITE_LOCATION_LANGUAGE_ATTEMPT_STORAGE_KEY), null);
    stop();
    assert.equal(cancelled, true);
    assert.equal(languagePromptDuration("location"), 10_000);
    assert.equal(languagePromptDuration("navbar"), NAVBAR_CONFIRMATION_DISMISS_MS);
  });

  it("does not suggest again in the same visit after the toast is dismissed", async () => {
    installBrowser();
    const first = await runLocationLanguageDetection({
      isSecureContext: true,
      permissions: { query: async () => ({ state: "granted" }) },
      geolocation: {
        getCurrentPosition: (success) => {
          success({ coords: { latitude: 17.4, longitude: 78.5, accuracy: 20 } });
        },
      },
      reverseGeocode: async () => ({
        countryCode: "IN",
        state: "Telangana",
        stateCode: "IN-TS",
      }),
    });
    assert.equal(first, "suggested");
    closeLanguagePromptWithoutApplying();
    resetLocationLanguageDetectionForTests();

    let positionCalls = 0;
    const refresh = await runLocationLanguageDetection({
      isSecureContext: true,
      geolocation: {
        getCurrentPosition: () => {
          positionCalls += 1;
        },
      },
    });
    assert.equal(refresh, "skipped");
    assert.equal(positionCalls, 0);
    assert.equal(readSiteLanguage().code, "en");
    assert.equal(readLanguagePrompt(), null);
  });

  it("does not suggest when a manual or automatic language is already saved", async () => {
    const manual = installBrowser();
    manual.localStorage.setItem(SITE_LANGUAGE_STORAGE_KEY, "tamil");
    manual.localStorage.setItem(SITE_LANGUAGE_SOURCE_STORAGE_KEY, "manual");
    assert.equal(
      await runLocationLanguageDetection({
        isSecureContext: true,
        geolocation: {
          getCurrentPosition: () => {
            throw new Error("should not request location");
          },
        },
      }),
      "skipped",
    );
    assert.equal(readLanguagePrompt(), null);
    assert.equal(readSiteLanguage().code, "ta");

    delete (globalThis as { window?: unknown }).window;
    const automatic = installBrowser();
    writeAutomaticSiteLanguage(option("kn"));
    assert.equal(automatic.localStorage.getItem(SITE_LANGUAGE_SOURCE_STORAGE_KEY), "automatic");
    assert.equal(
      await runLocationLanguageDetection({
        isSecureContext: true,
        geolocation: {
          getCurrentPosition: () => {
            throw new Error("should not request location");
          },
        },
      }),
      "skipped",
    );
    assert.equal(readSiteLanguage().code, "kn");
    assert.equal(readLanguagePrompt(), null);
  });

  it("does not toast for an international location, a failed lookup, or the active language", async () => {
    installBrowser();
    assert.equal(
      await runLocationLanguageDetection({
        isSecureContext: true,
        permissions: { query: async () => ({ state: "granted" }) },
        geolocation: {
          getCurrentPosition: (success) => {
            success({ coords: { latitude: 40.7, longitude: -74, accuracy: 30 } });
          },
        },
        reverseGeocode: async () => ({
          countryCode: "US",
          country: "United States",
          state: "New York",
          stateCode: "US-NY",
        }),
      }),
      "skipped",
    );
    assert.equal(readLanguagePrompt(), null);
    assert.equal(readSiteLanguage().code, "en");

    resetLocationLanguageDetectionForTests();
    delete (globalThis as { window?: unknown }).window;
    installBrowser();
    assert.equal(
      await runLocationLanguageDetection({
        isSecureContext: true,
        permissions: { query: async () => ({ state: "granted" }) },
        geolocation: {
          getCurrentPosition: (success) => {
            success({ coords: { latitude: 13, longitude: 80, accuracy: 30 } });
          },
        },
        reverseGeocode: async () => null,
      }),
      "fallback",
    );
    assert.equal(readLanguagePrompt(), null);

    resetLocationLanguageDetectionForTests();
    assert.equal(openLanguagePrompt("location", option("en")), false);
    assert.equal(readLanguagePrompt(), null);
  });

  it("confirms a navbar language without applying it until Apply", () => {
    const { localStorage } = installBrowser();
    writeSiteLanguage(option("en"));
    const before = localStorage.getItem(SITE_LANGUAGE_STORAGE_KEY);
    assert.equal(openLanguagePrompt("navbar", option("en")), false);
    assert.equal(readLanguagePrompt(), null);

    assert.equal(openLanguagePrompt("navbar", option("te")), true);
    assert.equal(readSiteLanguage().code, "en");
    assert.equal(localStorage.getItem(SITE_LANGUAGE_STORAGE_KEY), before);
    const message = translate("en", "languageConfirm.confirmMessage", {
      language: "Telugu",
      native: "తెలుగు",
    });
    assert.match(message, /Telugu \(తెలుగు\)/);

    const saved: string[] = [];
    setSiteLanguageAccountPersister((next) => {
      saved.push(next.code);
    });
    acceptLanguagePrompt();
    assert.equal(readSiteLanguage().code, "te");
    assert.equal(localStorage.getItem(SITE_LANGUAGE_SOURCE_STORAGE_KEY), "manual");
    assert.deepEqual(saved, ["te"]);
  });

  it("cancels a navbar change without overwriting the saved preference", () => {
    const { localStorage } = installBrowser();
    writeSiteLanguage(option("hi"));
    const calls: string[] = [];
    setSiteLanguageAccountPersister((next) => {
      calls.push(next.code);
    });
    openLanguagePrompt("navbar", option("ml"));
    rejectLanguagePrompt();

    assert.equal(readLanguagePrompt(), null);
    assert.equal(readSiteLanguage().code, "hi");
    assert.equal(localStorage.getItem(SITE_LANGUAGE_STORAGE_KEY), "hindi");
    assert.equal(localStorage.getItem(SITE_LANGUAGE_SOURCE_STORAGE_KEY), "manual");
    assert.deepEqual(calls, []);
    assert.equal(localStorage.getItem(SITE_LOCATION_SUGGESTION_DECISION_KEY), null);
  });

  it("replaces a pending navbar selection and ignores a duplicate", () => {
    installBrowser();
    openLanguagePrompt("navbar", option("hi"));
    const firstRevision = languagePromptRevisionForTests();
    assert.equal(openLanguagePrompt("navbar", option("hi")), true);
    assert.equal(languagePromptRevisionForTests(), firstRevision);

    assert.equal(openLanguagePrompt("navbar", option("ta")), true);
    assert.equal(readLanguagePrompt()?.language.code, "ta");
    assert.equal(readSiteLanguage().code, "en");
    assert.ok(languagePromptRevisionForTests() > firstRevision);

    openLanguagePrompt("navbar", option("kn"));
    assert.equal(openLanguagePrompt("location", option("te")), false);
    assert.equal(readLanguagePrompt()?.kind, "navbar");
    assert.equal(readLanguagePrompt()?.language.code, "kn");
  });

  it("cancels a navbar confirmation when its timer ends", () => {
    installBrowser();
    writeSiteLanguage(option("en"));
    openLanguagePrompt("navbar", option("hi"));
    startLanguagePromptTimer(
      "navbar",
      () => closeLanguagePromptWithoutApplying(),
      ((callback: () => void, durationMs: number) => {
        assert.equal(durationMs, NAVBAR_CONFIRMATION_DISMISS_MS);
        callback();
        return 1 as unknown as ReturnType<typeof setTimeout>;
      }) as typeof setTimeout,
    );
    assert.equal(readLanguagePrompt(), null);
    assert.equal(readSiteLanguage().code, "en");
  });

  it("does not let a location suggestion replace a notification language", async () => {
    const { localStorage } = installBrowser("en-US", "?lang=hi");
    localStorage.setItem(SITE_LANGUAGE_STORAGE_KEY, "english");
    const result = await runLocationLanguageDetection({
      isSecureContext: true,
      geolocation: {
        getCurrentPosition: () => {
          throw new Error("should not request location");
        },
      },
    });
    assert.equal(result, "skipped");
    assert.equal(readLanguagePrompt(), null);
    assert.equal(readSiteLanguage().code, "hi");
    assert.equal(localStorage.getItem(SITE_LANGUAGE_STORAGE_KEY), "english");
  });

  it("announces one accessible toast and stacks its actions on a narrow screen", () => {
    assert.equal(LANGUAGE_PROMPT_A11Y.role, "status");
    assert.equal(LANGUAGE_PROMPT_A11Y.live, "polite");
    const source = readFileSync(
      join(here, "../components/i18n/LanguageConfirmationToast.tsx"),
      "utf8",
    );
    assert.match(source, /aria-live=\{LANGUAGE_PROMPT_A11Y\.live\}/);
    assert.match(source, /min-h-11/);
    assert.match(source, /sm:flex-row/);
    assert.match(source, /aria-label=\{t\("languageConfirm\.close"\)\}/);
    assert.equal(source.includes("writeSiteLanguage"), false);
    for (const code of ["en", "hi", "te", "ta", "kn", "ml"] as const) {
      assert.ok(translate(code, "languageConfirm.suggestionTitle").length > 0);
      assert.ok(translate(code, "languageConfirm.confirmTitle").length > 0);
      assert.equal(translate(code, "languageConfirm.apply").includes("{"), false);
    }
  });
});
