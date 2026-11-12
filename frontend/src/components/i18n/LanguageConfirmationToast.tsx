"use client";

import {
  LANGUAGE_PROMPT_A11Y,
  acceptLanguagePrompt,
  closeLanguagePromptWithoutApplying,
  languageNameKey,
  readLanguagePrompt,
  rejectLanguagePrompt,
  startLanguagePromptTimer,
  subscribeLanguagePrompt,
} from "@/i18n/language-confirmation";
import { useTranslate } from "@/i18n/translate";
import { Globe, X } from "lucide-react";
import { usePathname } from "next/navigation";
import { useEffect, useId, useRef, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";

/**
 * One confirmation card for a location suggestion or a navbar language change.
 * Dismissing it never applies a language.
 */
export function LanguageConfirmationToast() {
  const prompt = useSyncExternalStore(
    subscribeLanguagePrompt,
    readLanguagePrompt,
    () => null,
  );
  const pathname = usePathname() || "/";
  const pathnameRef = useRef(pathname);
  const openedOnPath = useRef<string | null>(null);
  pathnameRef.current = pathname;
  const t = useTranslate();
  const titleId = useId();
  const messageId = useId();

  useEffect(() => {
    if (!prompt) {
      openedOnPath.current = null;
      return;
    }
    if (openedOnPath.current == null) {
      openedOnPath.current = pathnameRef.current;
    }
    return startLanguagePromptTimer(prompt.kind, () => {
      closeLanguagePromptWithoutApplying();
    });
  }, [prompt]);

  useEffect(() => {
    if (!prompt || openedOnPath.current == null) {
      return;
    }
    if (pathname !== openedOnPath.current) {
      closeLanguagePromptWithoutApplying();
    }
  }, [pathname, prompt]);

  useEffect(() => {
    if (!prompt) {
      return;
    }
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") {
        return;
      }
      event.preventDefault();
      closeLanguagePromptWithoutApplying();
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [prompt]);

  if (!prompt || typeof document === "undefined") {
    return null;
  }

  const name = t(languageNameKey(prompt.language.code));
  const native = prompt.language.label;
  const location = prompt.kind === "location";
  const title = location
    ? t("languageConfirm.suggestionTitle")
    : t("languageConfirm.confirmTitle");
  const message = location
    ? t("languageConfirm.suggestionMessage", { language: name, native })
    : t("languageConfirm.confirmMessage", { language: name, native });
  const confirmLabel = location
    ? t("languageConfirm.changeTo", { language: name })
    : t("languageConfirm.apply");
  const rejectLabel = location
    ? t("languageConfirm.keepEnglish")
    : t("languageConfirm.cancel");

  return createPortal(
    <div className="pointer-events-none fixed inset-x-0 top-[4.75rem] z-[110] flex justify-center px-4 md:top-[5.5rem] lg:top-[6rem]">
      <section
        role={LANGUAGE_PROMPT_A11Y.role}
        aria-live={LANGUAGE_PROMPT_A11Y.live}
        aria-atomic="true"
        aria-labelledby={titleId}
        aria-describedby={messageId}
        className="language-prompt pointer-events-auto w-[min(28rem,calc(100vw-2rem))] rounded-2xl border border-border-subtle bg-surface p-4 shadow-[0_18px_50px_rgba(26,43,60,0.14)] sm:p-5"
      >
        <div className="flex items-start gap-3">
          <span
            className="grid size-10 shrink-0 place-items-center rounded-full bg-primary-light text-primary"
            aria-hidden="true"
          >
            <Globe className="size-5" strokeWidth={2} />
          </span>
          <div className="min-w-0 flex-1 pt-0.5">
            <div className="flex items-start justify-between gap-3">
              <h2 id={titleId} className="text-[15px] font-semibold leading-5 text-foreground">
                {title}
              </h2>
              <button
                type="button"
                className="-mr-1 -mt-1 inline-flex size-8 shrink-0 items-center justify-center rounded-full text-muted transition-colors hover:bg-primary-light hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
                aria-label={t("languageConfirm.close")}
                onClick={() => closeLanguagePromptWithoutApplying()}
              >
                <X className="size-4" strokeWidth={2.25} aria-hidden="true" />
              </button>
            </div>
            <p id={messageId} className="mt-1.5 text-sm leading-6 text-muted">
              {message}
            </p>
          </div>
        </div>
        <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:justify-end">
          <button
            type="button"
            className="inline-flex min-h-11 items-center justify-center whitespace-nowrap rounded-xl bg-primary px-4 text-sm font-semibold text-white transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 sm:min-w-36"
            onClick={() => acceptLanguagePrompt()}
          >
            {confirmLabel}
          </button>
          <button
            type="button"
            className="inline-flex min-h-11 items-center justify-center whitespace-nowrap rounded-xl border border-border-subtle bg-white px-4 text-sm font-semibold text-foreground transition-colors hover:bg-primary-light focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 sm:min-w-32"
            onClick={() => rejectLanguagePrompt()}
          >
            {rejectLabel}
          </button>
        </div>
      </section>
    </div>,
    document.body,
  );
}
