import assert from "node:assert/strict";
import { afterEach, describe, it } from "node:test";
import {
  SITE_DEFAULT_LANGUAGE,
  normalizeSiteLanguageCode,
} from "../constants/site-language";
import {
  getSiteLanguageClientSnapshot,
  getSiteLanguageReadyClientSnapshot,
  getSiteLanguageReadyServerSnapshot,
  getSiteLanguageServerSnapshot,
  readSiteLanguage,
  writeSiteLanguage,
} from "./site-language";

type MemoryStorage = {
  getItem: (key: string) => string | null;
  setItem: (key: string, value: string) => void;
};

function installBrowser(language: string) {
  const values = new Map<string, string>();
  const storage: MemoryStorage = {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => {
      values.set(key, value);
    },
  };
  const documentElement = { lang: "en" };
  Object.assign(globalThis, {
    window: {
      localStorage: storage,
      navigator: { language },
      dispatchEvent: () => true,
    },
    document: { documentElement },
  });
  return documentElement;
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
  });

  it("keeps the saved language across reads", () => {
    const documentElement = installBrowser("en-US");
    writeSiteLanguage({ value: "hindi", code: "hi", label: "हिंदी" });
    assert.equal(readSiteLanguage().code, "hi");
    assert.equal(documentElement.lang, "hi");
    assert.equal(readSiteLanguage().value, "hindi");
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
