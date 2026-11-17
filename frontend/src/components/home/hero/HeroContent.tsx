"use client";

import { SITE_LANGUAGE_OPTIONS } from "@/constants/site-language";
import { useSiteLanguage, writeSiteLanguage } from "@/i18n/site-language";
import { useTranslate } from "@/i18n/translate";
import { cn } from "@/utils/cn";

export function HeroContent() {
  const t = useTranslate();
  const activeLanguage = useSiteLanguage();

  return (
    <div className="relative z-20 flex min-w-0 flex-col justify-start pt-4 mobile:px-0.5 mobile:pt-3 sm:pt-6 lg:mt-20 lg:px-0 lg:pt-0 lg:pr-8 xl:mt-24">
      <p className="mb-4 inline-flex w-fit max-w-full items-center gap-2 rounded-full border border-border-subtle bg-surface px-3 py-1.5 text-xs font-medium text-foreground shadow-sm mobile:mb-3 mobile:gap-1.5 mobile:px-2.5 mobile:py-1 mobile:text-[11px] sm:gap-2 sm:px-3 sm:py-1.5 sm:text-sm">
        <span
          className="size-2 shrink-0 rounded-full bg-emerald-500 mobile:size-1.5 sm:size-2"
          aria-hidden="true"
        />
        <span className="min-w-0 break-words">{t("home.hero.badge")}</span>
      </p>

      <h1 className="text-balance break-words text-4xl font-bold leading-tight tracking-tight text-foreground mobile:text-[1.75rem] mobile:leading-[1.12] sm:text-5xl lg:text-[3.25rem] lg:leading-[1.1]">
        {t("home.hero.headingLine1")}
        <br />
        <span className="text-primary-soft">{t("home.hero.headingLine2")}</span>
      </h1>

      <p className="mt-3 max-w-xl whitespace-pre-line text-sm leading-snug text-muted mobile:mt-2.5 mobile:text-[0.8125rem] sm:text-sm lg:mt-4">
        {t("home.hero.supportingLine1")}
      </p>

      <p className="mt-4 break-words text-sm font-semibold text-foreground mobile:mt-3 sm:text-base">
        {t("home.hero.supportingLine2")}
      </p>

      <div className="mt-5 pb-1 mobile:mt-4 lg:mt-6 lg:pb-2">
        <ul
          className="flex flex-wrap gap-2 mobile:gap-2 sm:gap-2.5"
          aria-label={t("home.hero.languagesAria")}
        >
          {SITE_LANGUAGE_OPTIONS.map((language) => {
            const selected = language.code === activeLanguage.code;
            return (
              <li key={language.code}>
                <button
                  type="button"
                  lang={language.code}
                  aria-pressed={selected}
                  onClick={() => writeSiteLanguage(language)}
                  className={cn(
                    "inline-flex min-h-9 items-center rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors mobile:min-h-9 mobile:px-3.5 mobile:py-2 mobile:text-[0.8125rem] sm:px-4 sm:py-2",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30",
                    selected
                      ? "border-primary bg-primary-light text-primary"
                      : "border-border bg-surface text-foreground hover:border-primary/40 hover:text-primary",
                  )}
                >
                  {language.label}
                </button>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
