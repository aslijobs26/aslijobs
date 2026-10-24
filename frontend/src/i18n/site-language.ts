"use client";

import {
  SITE_DEFAULT_LANGUAGE,
  SITE_LANGUAGE_CHANGE_EVENT,
  SITE_LANGUAGE_QUERY_APPLIED_KEY,
  SITE_LANGUAGE_QUERY_PARAM,
  SITE_LANGUAGE_STORAGE_KEY,
  SITE_LANGUAGE_VISIT_STORAGE_KEY,
  parseSiteLanguageQuery,
  siteLanguageFromValue,
  type SiteLanguageCode,
  type SiteLanguageOption,
} from "../constants/site-language";
import { resolveInterfaceSiteLanguage } from "./employer-interface-language";
import { usePathname } from "next/navigation";
import { useSyncExternalStore } from "react";

let hasHydratedSiteLanguage = false;
const siteLanguageReadyListeners = new Set<() => void>();
const siteLanguageListeners = new Set<() => void>();

type SiteLanguageAccountPersister = (option: SiteLanguageOption) => void;
let persistAccountLanguage: SiteLanguageAccountPersister | null = null;

function subscribeSiteLanguageReady(onStoreChange: () => void): () => void {
  siteLanguageReadyListeners.add(onStoreChange);
  return () => {
    siteLanguageReadyListeners.delete(onStoreChange);
  };
}

function subscribeSiteLanguage(onStoreChange: () => void): () => void {
  siteLanguageListeners.add(onStoreChange);
  if (typeof window === "undefined") {
    return () => {
      siteLanguageListeners.delete(onStoreChange);
    };
  }
  const handler = () => onStoreChange();
  window.addEventListener(SITE_LANGUAGE_CHANGE_EVENT, handler);
  window.addEventListener("storage", handler);
  return () => {
    siteLanguageListeners.delete(onStoreChange);
    window.removeEventListener(SITE_LANGUAGE_CHANGE_EVENT, handler);
    window.removeEventListener("storage", handler);
  };
}

function notifySiteLanguage(): void {
  siteLanguageListeners.forEach((listener) => listener());
}

function markSiteLanguageHydrated(): void {
  if (hasHydratedSiteLanguage) {
    return;
  }
  hasHydratedSiteLanguage = true;
  if (typeof document !== "undefined") {
    document.documentElement.lang = readSiteLanguage().code;
  }
  siteLanguageReadyListeners.forEach((listener) => listener());
}

function readVisitLanguage(): SiteLanguageOption | null {
  if (typeof window === "undefined") {
    return null;
  }
  try {
    return parseSiteLanguageQuery(
      window.sessionStorage.getItem(SITE_LANGUAGE_VISIT_STORAGE_KEY),
    );
  } catch {
    return null;
  }
}

function readStoredLanguage(): SiteLanguageOption | null {
  if (typeof window === "undefined") {
    return null;
  }
  try {
    const stored = window.localStorage.getItem(SITE_LANGUAGE_STORAGE_KEY);
    return stored ? parseSiteLanguageQuery(stored) : null;
  } catch {
    return null;
  }
}

function readBrowserLanguage(): SiteLanguageOption | null {
  if (typeof window === "undefined") {
    return null;
  }
  const browser = window.navigator.language.toLowerCase();
  if (browser.startsWith("te")) return siteLanguageFromValue("te");
  if (browser.startsWith("hi")) return siteLanguageFromValue("hi");
  if (browser.startsWith("ta")) return siteLanguageFromValue("ta");
  if (browser.startsWith("kn")) return siteLanguageFromValue("kn");
  if (browser.startsWith("ml")) return siteLanguageFromValue("ml");
  return null;
}

/**
 * Apply a trusted `lang` query for this visit.
 * Incoming URL language always becomes the visit overlay (unless the user
 * already made an explicit navbar/settings choice this tab). It does not
 * overwrite an already saved localStorage preference.
 */
function applyVisitLanguageHint(): void {
  if (typeof window === "undefined") {
    return;
  }
  try {
    if (
      window.sessionStorage.getItem(SITE_LANGUAGE_QUERY_APPLIED_KEY) ===
      "explicit"
    ) {
      return;
    }
    const fromQuery = parseSiteLanguageQuery(
      new URLSearchParams(window.location.search).get(SITE_LANGUAGE_QUERY_PARAM),
    );
    if (!fromQuery) {
      return;
    }
    window.sessionStorage.setItem(
      SITE_LANGUAGE_VISIT_STORAGE_KEY,
      fromQuery.value,
    );
    window.sessionStorage.setItem(
      SITE_LANGUAGE_QUERY_APPLIED_KEY,
      fromQuery.value,
    );
    // Seed storage only when empty so a Hindi WhatsApp link cannot permanently
    // replace a saved English website preference — the visit overlay still wins
    // for UI during this tab.
    if (!window.localStorage.getItem(SITE_LANGUAGE_STORAGE_KEY)) {
      window.localStorage.setItem(SITE_LANGUAGE_STORAGE_KEY, fromQuery.value);
    }
  } catch {
    // Ignore storage access errors.
  }
}

/**
 * Website language (this tab):
 * 1. Explicit selection this visit (navbar / settings) — stored, visit overlay cleared
 * 2. Trusted `lang` query overlay for this tab (does not overwrite a saved preference)
 * 3. Saved website / account preference in localStorage
 * 4. Browser language as a hint
 * 5. English
 *
 * Account language is copied into localStorage on login unless a visit overlay
 * or this-visit explicit choice is already active. Notification `lang` wins
 * for the current tab so English/Telugu template links open in that language,
 * without permanently overriding the saved preference.
 */
export function readSiteLanguage(): SiteLanguageOption {
  if (typeof window === "undefined") return SITE_DEFAULT_LANGUAGE;
  applyVisitLanguageHint();
  const visit = readVisitLanguage();
  if (visit) return visit;
  return (
    readStoredLanguage() ?? readBrowserLanguage() ?? SITE_DEFAULT_LANGUAGE
  );
}

/**
 * Language for account writes and registration during this visit.
 * Visit overlay from a trusted `lang` query (e.g. WhatsApp job link) wins over
 * a stale localStorage preference so Hindi/Telugu entry links seed correctly.
 * Browser language is excluded so it is never written to the account.
 */
export function readExplicitSiteLanguage(): SiteLanguageOption | null {
  if (typeof window === "undefined") {
    return null;
  }
  applyVisitLanguageHint();
  return readVisitLanguage() ?? readStoredLanguage();
}

/** True after the user picks a language in the navbar or settings this tab. */
export function hasExplicitSiteLanguageChoiceThisVisit(): boolean {
  if (typeof window === "undefined") {
    return false;
  }
  try {
    return (
      window.sessionStorage.getItem(SITE_LANGUAGE_QUERY_APPLIED_KEY) ===
      "explicit"
    );
  } catch {
    return false;
  }
}

export function writeSiteLanguage(
  option: SiteLanguageOption,
  options?: { persistAccount?: boolean },
): void {
  markSiteLanguageHydrated();
  try {
    window.sessionStorage.removeItem(SITE_LANGUAGE_VISIT_STORAGE_KEY);
    window.sessionStorage.setItem(SITE_LANGUAGE_QUERY_APPLIED_KEY, "explicit");
    window.localStorage.setItem(SITE_LANGUAGE_STORAGE_KEY, option.value);
  } catch {
    // Ignore storage access errors.
  }
  window.dispatchEvent(new CustomEvent(SITE_LANGUAGE_CHANGE_EVENT));
  notifySiteLanguage();
  document.documentElement.lang = option.code;
  if (options?.persistAccount !== false) {
    persistAccountLanguage?.(option);
  }
}

/**
 * Apply the authenticated account preference unless this visit already has
 * an explicit selection or a trusted notification `lang` overlay.
 */
export function applyAccountSiteLanguage(language: string | null | undefined): void {
  const option = parseSiteLanguageQuery(language);
  if (!option) {
    return;
  }
  if (readVisitLanguage() || hasExplicitSiteLanguageChoiceThisVisit()) {
    return;
  }
  writeSiteLanguage(option, { persistAccount: false });
}

export function setSiteLanguageAccountPersister(
  persister: SiteLanguageAccountPersister | null,
): void {
  persistAccountLanguage = persister;
}

export function getSiteLanguageCode(): SiteLanguageCode {
  if (typeof window === "undefined" || !hasHydratedSiteLanguage) {
    return SITE_DEFAULT_LANGUAGE.code;
  }
  return resolveInterfaceSiteLanguage(
    window.location?.pathname ?? "/",
    readSiteLanguage(),
  ).code;
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
  const pathname = usePathname() || "/";
  const stored = useSyncExternalStore(
    subscribeSiteLanguage,
    () => {
      markSiteLanguageHydrated();
      return readSiteLanguage();
    },
    getSiteLanguageServerSnapshot,
  );
  return resolveInterfaceSiteLanguage(pathname, stored);
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
