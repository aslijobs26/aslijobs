import type { SiteLanguageCode } from "../constants/site-language";
import { authBundle } from "./bundles/auth";
import { employerBundle } from "./bundles/employer";
import { faqsBundle } from "./bundles/faqs";
import { guidelinesBundle } from "./bundles/guidelines";
import { homeBundle } from "./bundles/home";
import { privacyBundle } from "./bundles/privacy";
import { publicContentBundle } from "./bundles/public-content";
import { seekerBundle } from "./bundles/seeker";
import { termsBundle } from "./bundles/terms";
import { useSiteLanguage } from "./site-language";
import en from "./locales/en.json";
import hi from "./locales/hi.json";
import kn from "./locales/kn.json";
import ml from "./locales/ml.json";
import ta from "./locales/ta.json";
import te from "./locales/te.json";

const CORE = { en, hi, te, ta, kn, ml } as const;
const BUNDLES = [
  homeBundle,
  authBundle,
  seekerBundle,
  employerBundle,
  faqsBundle,
  guidelinesBundle,
  publicContentBundle,
  termsBundle,
  privacyBundle,
] as const;

type Messages = typeof en &
  (typeof homeBundle)["en"] &
  (typeof authBundle)["en"] &
  (typeof seekerBundle)["en"] &
  (typeof employerBundle)["en"] &
  (typeof faqsBundle)["en"] &
  (typeof guidelinesBundle)["en"] &
  (typeof publicContentBundle)["en"] &
  (typeof termsBundle)["en"] &
  (typeof privacyBundle)["en"];

export type { Messages };

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function deepMerge(
  base: Record<string, unknown>,
  extra: Record<string, unknown>,
): Record<string, unknown> {
  const output: Record<string, unknown> = { ...base };
  for (const [key, value] of Object.entries(extra)) {
    const current = output[key];
    output[key] =
      isRecord(current) && isRecord(value) ? deepMerge(current, value) : value;
  }
  return output;
}

function buildCatalog(language: SiteLanguageCode): Messages {
  return BUNDLES.reduce(
    (catalog, bundle) =>
      deepMerge(catalog, bundle[language] as Record<string, unknown>),
    { ...CORE[language] } as Record<string, unknown>,
  ) as Messages;
}

const CATALOGS: Record<SiteLanguageCode, Messages> = {
  en: buildCatalog("en"),
  hi: buildCatalog("hi"),
  te: buildCatalog("te"),
  ta: buildCatalog("ta"),
  kn: buildCatalog("kn"),
  ml: buildCatalog("ml"),
};

type LeafPaths<T, Prefix extends string = ""> = T extends string
  ? Prefix
  : {
      [K in keyof T & string]: LeafPaths<T[K], Prefix extends "" ? K : `${Prefix}.${K}`>;
    }[keyof T & string];

export type MessageKey = LeafPaths<Messages>;

function readPath(catalog: Messages, key: string): string | undefined {
  const value = key.split(".").reduce<unknown>((current, part) => {
    if (current && typeof current === "object" && part in current) {
      return (current as Record<string, unknown>)[part];
    }
    return undefined;
  }, catalog);
  return typeof value === "string" && value.trim() ? value : undefined;
}

export function translate(
  language: SiteLanguageCode,
  key: MessageKey,
  values?: Record<string, string | number>,
): string {
  const localized = readPath(CATALOGS[language], key);
  const fallback = localized ?? readPath(CATALOGS.en, key);
  if (process.env.NODE_ENV !== "production" && !fallback) {
    console.warn(`[i18n] Missing translation key: ${key}`);
  }
  const template = fallback ?? key;
  if (!values) return template;
  return template.replace(/\{(\w+)\}/g, (token, name: string) => {
    const value = values[name];
    return value === undefined ? token : String(value);
  });
}

export function useTranslate(): (
  key: MessageKey,
  values?: Record<string, string | number>,
) => string {
  const language = useSiteLanguage();
  return (key, values) => translate(language.code, key, values);
}
