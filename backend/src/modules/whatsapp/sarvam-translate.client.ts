import { env } from "../../config/env.js";
import {
  buildDeterministicReply,
  isCacheableSituation,
  properNounsFromFacts,
  serviceErrorCopy,
  type BotLanguage,
} from "./whatsapp-bot.logic.js";

/** Official Sarvam Text Translation API. https://docs.sarvam.ai/api-reference/text/translate-text */
export const SARVAM_TRANSLATE_URL = "https://api.sarvam.ai/translate";
const TRANSLATE_TIMEOUT_MS = 8_000;
const TRANSLATE_INPUT_MAX = 1000;

const LANGUAGE_TO_SARVAM: Record<BotLanguage, string> = {
  en: "en-IN",
  hi: "hi-IN",
  te: "te-IN",
  ta: "ta-IN",
  kn: "kn-IN",
  ml: "ml-IN",
};

const staticTranslationCache = new Map<string, string>();

export function toSarvamLanguageCode(language: BotLanguage): string {
  return LANGUAGE_TO_SARVAM[language];
}

export function shouldTranslate(source: BotLanguage, target: BotLanguage): boolean {
  return source !== target;
}

export function cacheKeyForTranslation(
  text: string,
  source: BotLanguage,
  target: BotLanguage,
): string {
  return `${source}|${target}|${text}`;
}

export function clearTranslationCache(): void {
  staticTranslationCache.clear();
}

export function translationCacheSize(): number {
  return staticTranslationCache.size;
}

export function protectProperNouns(
  text: string,
  terms: readonly string[],
): { text: string; tokens: string[] } {
  let next = text;
  const tokens: string[] = [];
  const unique = [...new Set(terms.map((term) => term.trim()).filter((term) => term.length > 1))];
  unique.sort((a, b) => b.length - a.length);
  for (const term of unique) {
    if (!next.includes(term)) continue;
    const token = `__AJ${tokens.length}__`;
    tokens.push(term);
    next = next.split(term).join(token);
  }
  return { text: next, tokens };
}

export function restoreProperNouns(text: string, tokens: readonly string[]): string {
  let next = text;
  tokens.forEach((term, index) => {
    next = next.split(`__AJ${index}__`).join(term);
  });
  return next;
}

export type TranslateTextInput = {
  text: string;
  sourceLanguage: BotLanguage;
  targetLanguage: BotLanguage;
  /** Cache only static, non-personalized copy. Never cache job/application rows. */
  cache?: boolean;
  fetchImpl?: typeof fetch;
};

export type TranslateTextResult = {
  text: string;
  translated: boolean;
  skipped: boolean;
  failed: boolean;
  durationMs: number;
};

export async function translateText(input: TranslateTextInput): Promise<TranslateTextResult> {
  const started = Date.now();
  const source = input.sourceLanguage;
  const target = input.targetLanguage;
  const original = input.text.trim();
  if (!original || !shouldTranslate(source, target)) {
    return { text: input.text, translated: false, skipped: true, failed: false, durationMs: 0 };
  }

  const key = cacheKeyForTranslation(original, source, target);
  if (input.cache) {
    const hit = staticTranslationCache.get(key);
    if (hit != null) {
      console.info(
        `[WA-AI-COST] stage=TRANSLATE provider=sarvam-translation source=${source} target=${target} cache=hit durationMs=0`,
      );
      return { text: hit, translated: true, skipped: false, failed: false, durationMs: 0 };
    }
  }

  if (!input.fetchImpl && !env.SARVAM_API_KEY.trim()) {
    console.error("[Sarvam] SARVAM_UNAVAILABLE stage=translate reason=missing_key");
    return { text: input.text, translated: false, skipped: false, failed: true, durationMs: Date.now() - started };
  }

  try {
    const fetchImpl = input.fetchImpl ?? fetch;
    const response = await fetchImpl(SARVAM_TRANSLATE_URL, {
      method: "POST",
      headers: {
        "api-subscription-key": env.SARVAM_API_KEY,
        "Content-Type": "application/json",
      },
      signal: AbortSignal.timeout(TRANSLATE_TIMEOUT_MS),
      body: JSON.stringify({
        input: original.slice(0, TRANSLATE_INPUT_MAX),
        source_language_code: toSarvamLanguageCode(source),
        target_language_code: toSarvamLanguageCode(target),
        model: "mayura:v1",
        mode: "formal",
        numerals_format: "international",
      }),
    });
    if (!response.ok) {
      console.error(`[Sarvam] SARVAM_TRANSLATE_FAILED status=${response.status}`);
      console.info(
        `[WA-AI-COST] stage=TRANSLATE provider=sarvam-translation source=${source} target=${target} ok=no durationMs=${Date.now() - started}`,
      );
      return { text: input.text, translated: false, skipped: false, failed: true, durationMs: Date.now() - started };
    }
    const body = (await response.json()) as { translated_text?: string };
    const translated = body.translated_text?.trim();
    if (!translated) {
      console.error("[Sarvam] SARVAM_TRANSLATE_FAILED reason=empty");
      return { text: input.text, translated: false, skipped: false, failed: true, durationMs: Date.now() - started };
    }
    if (input.cache) {
      staticTranslationCache.set(key, translated);
    }
    console.info(
      `[WA-AI-COST] stage=TRANSLATE provider=sarvam-translation source=${source} target=${target} ok=yes cache=${input.cache ? "store" : "no"} durationMs=${Date.now() - started}`,
    );
    return { text: translated, translated: true, skipped: false, failed: false, durationMs: Date.now() - started };
  } catch (error) {
    const timedOut = error instanceof Error && error.name === "TimeoutError";
    console.error(
      `[Sarvam] SARVAM_TRANSLATE_FAILED reason=${timedOut ? "timeout" : error instanceof Error ? error.name : "unknown"}`,
    );
    console.info(
      `[WA-AI-COST] stage=TRANSLATE provider=sarvam-translation source=${source} target=${target} ok=no durationMs=${Date.now() - started}`,
    );
    return { text: input.text, translated: false, skipped: false, failed: true, durationMs: Date.now() - started };
  }
}

const INDIC_SCRIPT = /[\u0900-\u0D7F]/;

/** If templates already wrote the user's language, source === target and we skip Translate. */
export function detectGeneratedLanguage(text: string, intended: BotLanguage): BotLanguage {
  if (/[\u0C00-\u0C7F]/.test(text)) return "te";
  if (/[\u0900-\u097F]/.test(text)) return "hi";
  if (/[\u0B80-\u0BFF]/.test(text)) return "ta";
  if (/[\u0C80-\u0CFF]/.test(text)) return "kn";
  if (/[\u0D00-\u0D7F]/.test(text)) return "ml";
  if (intended !== "en" && !INDIC_SCRIPT.test(text) && /[A-Za-z]{4,}/.test(text)) {
    return "en";
  }
  return intended;
}

export function whatsappAiCallPlan(input: {
  protocol: boolean;
  voice: boolean;
  needsTranslation: boolean;
}): { chatLlmCalls: number; sttCalls: number; translateCalls: number; finalChatLlmCalls: number } {
  return {
    chatLlmCalls: input.protocol ? 0 : 1,
    finalChatLlmCalls: 0,
    sttCalls: input.voice ? 1 : 0,
    translateCalls: input.protocol || !input.needsTranslation ? 0 : 1,
  };
}

export async function localizeDeterministicReply(input: {
  language: BotLanguage;
  facts: Record<string, unknown>;
  fetchImpl?: typeof fetch;
}): Promise<{
  text: string;
  generatedLanguage: BotLanguage;
  translated: boolean;
  skipped: boolean;
  failed: boolean;
  chatLlmUsed: false;
}> {
  const draft =
    buildDeterministicReply(input.language, input.facts) ?? serviceErrorCopy(input.language);
  const generatedLanguage = detectGeneratedLanguage(draft, input.language);
  const protectedText = protectProperNouns(draft, properNounsFromFacts(input.facts));
  const localized = await translateText({
    text: protectedText.text,
    sourceLanguage: generatedLanguage,
    targetLanguage: input.language,
    cache: isCacheableSituation(String(input.facts.situation ?? ""), input.facts),
    fetchImpl: input.fetchImpl,
  });
  if (localized.failed && generatedLanguage !== input.language) {
    return {
      text: serviceErrorCopy(input.language),
      generatedLanguage,
      translated: false,
      skipped: false,
      failed: true,
      chatLlmUsed: false,
    };
  }
  return {
    text: restoreProperNouns(localized.text, protectedText.tokens),
    generatedLanguage,
    translated: localized.translated,
    skipped: localized.skipped,
    failed: localized.failed,
    chatLlmUsed: false,
  };
}
