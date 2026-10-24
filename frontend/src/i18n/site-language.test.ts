import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { afterEach, describe, it } from "node:test";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import {
  SITE_DEFAULT_LANGUAGE,
  SITE_LANGUAGE_QUERY_PARAM,
  SITE_LANGUAGE_STORAGE_KEY,
  SITE_LANGUAGE_VISIT_STORAGE_KEY,
  normalizeSiteLanguageCode,
  parseSiteLanguageQuery,
  withSiteLanguageQuery,
} from "../constants/site-language";
import {
  applyAccountSiteLanguage,
  getSiteLanguageClientSnapshot,
  getSiteLanguageReadyClientSnapshot,
  getSiteLanguageReadyServerSnapshot,
  getSiteLanguageServerSnapshot,
  readExplicitSiteLanguage,
  readSiteLanguage,
  writeSiteLanguage,
} from "./site-language";

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

function installBrowser(language: string, search = "") {
  const localStorage = memoryStorage();
  const sessionStorage = memoryStorage();
  const documentElement = { lang: "en" };
  const navigatorState = { language };
  Object.assign(globalThis, {
    window: {
      localStorage,
      sessionStorage,
      navigator: navigatorState,
      location: { search, pathname: "/" },
      dispatchEvent: () => true,
    },
    document: { documentElement },
  });
  return { documentElement, localStorage, sessionStorage, navigatorState };
}

describe("site language persistence", () => {
  afterEach(() => {
    delete (globalThis as { window?: unknown }).window;
  });

  it("uses English when nothing is saved and the browser language is unsupported", () => {
    installBrowser("fr-FR");
    assert.equal(readSiteLanguage().code, "en");
    assert.equal(readSiteLanguage().code, SITE_DEFAULT_LANGUAGE.code);
  });

  it("uses a supported browser language only when nothing is saved", () => {
    installBrowser("ta-IN");
    assert.equal(readSiteLanguage().code, "ta");
    assert.equal(readExplicitSiteLanguage(), null);
  });

  it("keeps the saved language across reads and ignores a later browser language", () => {
    const { documentElement, navigatorState } = installBrowser("en-US");
    writeSiteLanguage({ value: "hindi", code: "hi", label: "हिंदी" });
    assert.equal(readSiteLanguage().code, "hi");
    assert.equal(documentElement.lang, "hi");
    assert.equal(readSiteLanguage().value, "hindi");
    navigatorState.language = "te-IN";
    assert.equal(readSiteLanguage().code, "hi");
  });

  it("opens a Telugu notification link in Telugu without overwriting a saved English preference", () => {
    const { localStorage } = installBrowser("en-US", "?lang=te");
    localStorage.setItem(SITE_LANGUAGE_STORAGE_KEY, "english");
    assert.equal(readSiteLanguage().code, "te");
    assert.equal(localStorage.getItem(SITE_LANGUAGE_STORAGE_KEY), "english");
  });

  it("lets an incoming Hindi job link beat a stale English localStorage preference", () => {
    const { localStorage } = installBrowser("en-US", "?lang=hi");
    localStorage.setItem(SITE_LANGUAGE_STORAGE_KEY, "english");
    assert.equal(readSiteLanguage().code, "hi");
    assert.equal(readExplicitSiteLanguage()?.code, "hi");
    assert.equal(localStorage.getItem(SITE_LANGUAGE_STORAGE_KEY), "english");
  });

  it("opens Tamil, Kannada, and Malayalam job links in those languages", () => {
    for (const code of ["ta", "kn", "ml"] as const) {
      installBrowser("en-US", `?lang=${code}`);
      assert.equal(readSiteLanguage().code, code);
    }
  });

  it("opens an English notification link in English", () => {
    installBrowser("te-IN", "?lang=en");
    assert.equal(readSiteLanguage().code, "en");
  });

  it("seeds localStorage from a notification link only when no preference is saved", () => {
    const { localStorage } = installBrowser("en-US", "?lang=te");
    assert.equal(readSiteLanguage().code, "te");
    assert.equal(localStorage.getItem(SITE_LANGUAGE_STORAGE_KEY), "telugu");
  });

  it("keeps an explicit selection after a notification link is opened", () => {
    installBrowser("en-US", "?lang=te");
    writeSiteLanguage({ value: "english", code: "en", label: "English" });
    assert.equal(readSiteLanguage().code, "en");
    assert.equal(
      window.sessionStorage.getItem(SITE_LANGUAGE_VISIT_STORAGE_KEY),
      null,
    );
  });

  it("does not let account language overwrite a current notification visit overlay", () => {
    installBrowser("en-US", "?lang=te");
    assert.equal(readSiteLanguage().code, "te");
    applyAccountSiteLanguage("en");
    assert.equal(readSiteLanguage().code, "te");
  });

  it("applies account language when there is no visit overlay", () => {
    installBrowser("en-US");
    applyAccountSiteLanguage("te");
    assert.equal(readSiteLanguage().code, "te");
    assert.equal(readExplicitSiteLanguage()?.code, "te");
  });

  it("does not let account language overwrite an explicit selection this visit", () => {
    installBrowser("en-US");
    writeSiteLanguage({ value: "english", code: "en", label: "English" });
    applyAccountSiteLanguage("te");
    assert.equal(readSiteLanguage().code, "en");
  });

  it("rejects invalid lang query values", () => {
    assert.equal(parseSiteLanguageQuery("te")?.code, "te");
    assert.equal(parseSiteLanguageQuery("javascript:alert(1)"), null);
    assert.equal(parseSiteLanguageQuery("fr"), null);
    assert.equal(SITE_LANGUAGE_QUERY_PARAM, "lang");
    assert.equal(
      withSiteLanguageQuery("/jobs/AJ-1", "te"),
      "/jobs/AJ-1?lang=te",
    );
    assert.equal(
      withSiteLanguageQuery("/jobs/AJ-1?tab=overview", "unknown"),
      "/jobs/AJ-1?tab=overview&lang=en",
    );
  });

  it("normalizes language aliases to query codes", () => {
    assert.equal(normalizeSiteLanguageCode("telugu"), "te");
    assert.equal(normalizeSiteLanguageCode("TE"), "te");
    assert.equal(normalizeSiteLanguageCode("hi"), "hi");
    assert.equal(normalizeSiteLanguageCode("english"), "en");
    assert.equal(normalizeSiteLanguageCode("malayalam"), "ml");
    assert.equal(normalizeSiteLanguageCode("unknown"), "en");
  });

  it("does not read the saved language for render-time labels until hydrated", () => {
    installBrowser("te-IN");
    writeSiteLanguage({ value: "telugu", code: "te", label: "తెలుగు" });
    assert.equal(readSiteLanguage().code, "te");
    assert.equal(getSiteLanguageServerSnapshot().code, "en");
    assert.equal(getSiteLanguageReadyServerSnapshot(), false);
    assert.equal(getSiteLanguageClientSnapshot().code, "te");
    assert.equal(getSiteLanguageReadyClientSnapshot(), true);
  });
});

describe("unified language wiring", () => {
  const here = dirname(fileURLToPath(import.meta.url));

  it("sends an explicit website language on job-seeker registration", () => {
    const registerForm = readFileSync(
      join(here, "../components/job-seeker-register/JobSeekerRegisterForm.tsx"),
      "utf8",
    );
    const registerService = readFileSync(
      join(here, "../services/job-seeker-register.service.ts"),
      "utf8",
    );
    assert.match(
      registerForm,
      /readExplicitSiteLanguage\(\)\?\.code \?\? siteLanguage\.code/,
    );
    assert.match(registerService, /preferredLanguage/);
  });

  it("uses the shared site language store in settings instead of a second key", () => {
    const settings = readFileSync(
      join(here, "../components/job-seeker-settings/LanguageSettingsPanel.tsx"),
      "utf8",
    );
    assert.match(settings, /writeSiteLanguage/);
    assert.doesNotMatch(settings, /aslijobs\.job-seeker\.settings\.language/);
  });
});
