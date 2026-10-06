"use client";

import {
  SITE_DEFAULT_LANGUAGE,
  SITE_LANGUAGE_CHANGE_EVENT,
  SITE_LANGUAGE_STORAGE_KEY,
  siteLanguageFromValue,
  type SiteLanguageCode,
  type SiteLanguageOption,
} from "../constants/site-language";
import { useEffect, useState, useSyncExternalStore } from "react";

let hasHydratedSiteLanguage = false;
const siteLanguageReadyListeners = new Set<() => void>();

function subscribeSiteLanguageReady(onStoreChange: () => void): () => void {
  siteLanguageReadyListeners.add(onStoreChange);
  return () => {
    siteLanguageReadyListeners.delete(onStoreChange);
  };
}

function markSiteLanguageHydrated(): void {
  if (hasHydratedSiteLanguage) {
    return;
  }
  hasHydratedSiteLanguage = true;
  siteLanguageReadyListeners.forEach((listener) => listener());
}

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
  markSiteLanguageHydrated();
  try {
    window.localStorage.setItem(SITE_LANGUAGE_STORAGE_KEY, option.value);
  } catch {
    // Ignore storage access errors.
  }
  window.dispatchEvent(new CustomEvent(SITE_LANGUAGE_CHANGE_EVENT));
  document.documentElement.lang = option.code;
}

export function getSiteLanguageCode(): SiteLanguageCode {
  if (typeof window === "undefined" || !hasHydratedSiteLanguage) {
    return SITE_DEFAULT_LANGUAGE.code;
  }
  return readSiteLanguage().code;
}

export function getSiteLanguageClientSnapshot(): SiteLanguageOption {
  return readSiteLanguage();
}

export function getSiteLanguageServerSnapshot(): SiteLanguageOption {
  return SITE_DEFAULT_LANGUAGE;
}

export function getSiteLanguageReadyClientSnapshot(): boolean {
  return true;
}

export function getSiteLanguageReadyServerSnapshot(): boolean {
  return false;
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
    markSiteLanguageHydrated();
    window.addEventListener(SITE_LANGUAGE_CHANGE_EVENT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(SITE_LANGUAGE_CHANGE_EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  return language;
}

/**
 * False during SSR and the first client render so Find Jobs can wait for the
 * persisted language instead of requesting `language=en` and aborting it.
 */
export function useIsSiteLanguageReady(): boolean {
  return useSyncExternalStore(
    subscribeSiteLanguageReady,
    () => hasHydratedSiteLanguage,
    getSiteLanguageReadyServerSnapshot,
  );
}
