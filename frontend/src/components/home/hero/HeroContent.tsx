"use client";

import { HERO_LANGUAGES } from "@/constants/hero";
import { useTranslate } from "@/i18n/translate";
import { WhatsAppIcon } from "./HeroIcons";

export function HeroContent() {
  const t = useTranslate();

  return (
    <div className="relative z-20 flex min-w-0 flex-col justify-start pt-4 mobile:px-0.5 mobile:pt-3 sm:pt-6 lg:mt-20 lg:px-0 lg:pt-0 lg:pr-8 xl:mt-24">
      <h1 className="text-balance break-words text-4xl font-bold leading-tight tracking-tight text-foreground mobile:text-[1.75rem] mobile:leading-[1.12] sm:text-5xl lg:text-[3.25rem] lg:leading-[1.1]">
        {t("home.hero.headingLine1")}
        <br />
        <span className="text-primary-soft">{t("home.hero.headingLine2")}</span>
      </h1>

      <p className="mt-4 max-w-lg break-words text-base font-medium leading-relaxed text-muted mobile:mt-3 mobile:text-[0.9375rem] mobile:leading-[1.55] sm:text-lg lg:mt-5">
        {t("home.hero.supportingLine1")}
        <br />
        <span className="inline-flex flex-wrap items-center gap-1.5">
          {t("home.hero.supportingLine2")}
          <WhatsAppIcon className="text-[1.05em] text-whatsapp" />
        </span>
      </p>

      <div className="mt-6 pb-1 mobile:mt-5 lg:mt-7 lg:pb-2">
        <p className="text-sm font-semibold text-muted mobile:text-[0.8125rem]">
          {t("home.hero.languagesLabel")}
        </p>
        <ul
          className="mt-3 flex flex-wrap gap-2 mobile:mt-2.5 mobile:gap-2 sm:gap-2.5"
          aria-label={t("home.hero.languagesAria")}
        >
          {HERO_LANGUAGES.map((language) => (
            <li key={language}>
              <span className="inline-flex min-h-9 items-center rounded-lg border border-border bg-surface px-3 py-1.5 text-sm font-medium text-foreground mobile:min-h-9 mobile:px-3.5 mobile:py-2 mobile:text-[0.8125rem] sm:px-4 sm:py-2">
                {language}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
