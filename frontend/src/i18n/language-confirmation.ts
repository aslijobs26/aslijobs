import {
  SITE_LANGUAGE_OPTIONS,
  type SiteLanguageCode,
  type SiteLanguageOption,
} from "../constants/site-language";
import {
  clearLocationLanguageDecision,
  hasDeclinedLocationLanguageSuggestion,
  rememberLocationLanguageDeclined,
} from "./location-language-preference";
import { readSiteLanguage, setSiteLanguageAccountPersister, writeSiteLanguage } from "./site-language";
import type { MessageKey } from "./translate";

export const LOCATION_SUGGESTION_DISMISS_MS = 10_000;
export const NAVBAR_CONFIRMATION_DISMISS_MS = 10_000;

export type LanguagePromptKind = "location" | "navbar";

export type LanguagePrompt = {
  kind: LanguagePromptKind;
  language: SiteLanguageOption;
  revision: number;
};

export const LANGUAGE_PROMPT_A11Y = {
  role: "status",
  live: "polite",
} as const;

type Schedule = (callback: () => void, durationMs: number) => ReturnType<typeof setTimeout>;
type CancelSchedule = (id: ReturnType<typeof setTimeout>) => void;

const listeners = new Set<() => void>();
let prompt: LanguagePrompt | null = null;
let revision = 0;

function notify(): void {
  listeners.forEach((listener) => listener());
}

export function subscribeLanguagePrompt(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function readLanguagePrompt(): LanguagePrompt | null {
  return prompt;
}

export function languagePromptDuration(kind: LanguagePromptKind): number {
  return kind === "location" ? LOCATION_SUGGESTION_DISMISS_MS : NAVBAR_CONFIRMATION_DISMISS_MS;
}

export function languageNameKey(code: SiteLanguageCode): MessageKey {
  switch (code) {
    case "hi":
      return "languageConfirm.names.hi";
    case "te":
      return "languageConfirm.names.te";
    case "ta":
      return "languageConfirm.names.ta";
    case "kn":
      return "languageConfirm.names.kn";
    case "ml":
      return "languageConfirm.names.ml";
    default:
      return "languageConfirm.names.en";
  }
}

export function shouldPromptForLanguage(
  current: SiteLanguageOption,
  next: SiteLanguageOption,
): boolean {
  return current.code !== next.code;
}

/**
 * Opens or replaces the single language prompt.
 * A location suggestion does not replace a navbar confirmation already on screen.
 * Returns false when no prompt should be shown.
 */
export function openLanguagePrompt(
  kind: LanguagePromptKind,
  language: SiteLanguageOption,
): boolean {
  if (!SITE_LANGUAGE_OPTIONS.some((option) => option.code === language.code)) {
    return false;
  }
  if (!shouldPromptForLanguage(readSiteLanguage(), language)) {
    return false;
  }
  if (kind === "location" && hasDeclinedLocationLanguageSuggestion()) {
    return false;
  }
  if (kind === "location" && prompt?.kind === "navbar") {
    return false;
  }
  if (prompt && prompt.kind === kind && prompt.language.code === language.code) {
    return true;
  }
  revision += 1;
  prompt = { kind, language, revision };
  notify();
  return true;
}

/** Apply the pending language through the existing manual language store. */
export function acceptLanguagePrompt(): boolean {
  const current = prompt;
  if (!current) {
    return false;
  }
  prompt = null;
  notify();
  clearLocationLanguageDecision();
  writeSiteLanguage(current.language);
  return true;
}

/** Keep English for a location suggestion, or cancel a navbar change. */
export function rejectLanguagePrompt(): void {
  const current = prompt;
  prompt = null;
  notify();
  if (current?.kind === "location") {
    rememberLocationLanguageDeclined();
  }
}

/**
 * Close without a decision. Does not save a language and does not record
 * Keep English. A navbar prompt is cancelled the same way as Cancel.
 */
export function closeLanguagePromptWithoutApplying(): void {
  if (prompt?.kind === "navbar") {
    rejectLanguagePrompt();
    return;
  }
  prompt = null;
  notify();
}

export function startLanguagePromptTimer(
  kind: LanguagePromptKind,
  onFire: () => void,
  schedule: Schedule = setTimeout,
  cancel: CancelSchedule = clearTimeout,
): () => void {
  const id = schedule(onFire, languagePromptDuration(kind));
  let cleared = false;
  return () => {
    if (cleared) {
      return;
    }
    cleared = true;
    cancel(id);
  };
}

export function resetLanguagePromptForTests(): void {
  prompt = null;
  revision = 0;
  setSiteLanguageAccountPersister(null);
}

export function languagePromptRevisionForTests(): number {
  return revision;
}
