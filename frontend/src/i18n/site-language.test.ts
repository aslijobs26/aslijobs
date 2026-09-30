import assert from "node:assert/strict";
import { afterEach, describe, it } from "node:test";
import { SITE_DEFAULT_LANGUAGE } from "../constants/site-language";
import { readSiteLanguage, writeSiteLanguage } from "./site-language";

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
});
