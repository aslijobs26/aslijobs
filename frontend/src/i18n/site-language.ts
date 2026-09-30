"use client";

import {
  SITE_DEFAULT_LANGUAGE,
  SITE_LANGUAGE_CHANGE_EVENT,
  SITE_LANGUAGE_STORAGE_KEY,
  siteLanguageFromValue,
  type SiteLanguageCode,
  type SiteLanguageOption,
} from "../constants/site-language";
import { useEffect, useState } from "react";

export function readSiteLanguage(): SiteLanguageOption {
  if (typeof window === "undefined") return SITE_DEFAULT_LANGUAGE;
  try {
    const stored = window.localStorage.getItem(SITE_LANGUAGE_STORAGE_KEY);
    if (stored) return siteLanguageFromValue(stored);
  } catch {
    return SITE_DEFAULT_LANGUAGE;
  }
  const browser = window.navigator.language.toLowerCase();
  if (browser.startsWith("te")) return siteLanguageFromValue("te");
  if (browser.startsWith("hi")) return siteLanguageFromValue("hi");
  if (browser.startsWith("ta")) return siteLanguageFromValue("ta");
  if (browser.startsWith("kn")) return siteLanguageFromValue("kn");
  if (browser.startsWith("ml")) return siteLanguageFromValue("ml");
  return SITE_DEFAULT_LANGUAGE;
}

export function writeSiteLanguage(option: SiteLanguageOption): void {
  try {
    window.localStorage.setItem(SITE_LANGUAGE_STORAGE_KEY, option.value);
  } catch {
    // Ignore storage access errors.
  }
  window.dispatchEvent(new CustomEvent(SITE_LANGUAGE_CHANGE_EVENT));
  document.documentElement.lang = option.code;
}

export function getSiteLanguageCode(): SiteLanguageCode {
  return readSiteLanguage().code;
}

export function useSiteLanguage(): SiteLanguageOption {
  const [language, setLanguage] = useState<SiteLanguageOption>(SITE_DEFAULT_LANGUAGE);

  useEffect(() => {
    const sync = () => {
      const next = readSiteLanguage();
      setLanguage(next);
      document.documentElement.lang = next.code;
    };
    sync();
    window.addEventListener(SITE_LANGUAGE_CHANGE_EVENT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(SITE_LANGUAGE_CHANGE_EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  return language;
}
