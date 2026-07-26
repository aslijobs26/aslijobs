import {
  HERO_HEADING,
  HERO_LANGUAGES,
  HERO_SUPPORTING,
} from "@/constants/hero";

export function HeroContent() {
  return (
    <div className="flex flex-col justify-start pt-4 mobile:px-0.5 mobile:pt-3 sm:pt-6 lg:mt-20 lg:px-0 lg:pt-0 lg:pr-8 xl:mt-24">
      <h1 className="text-4xl font-bold leading-tight tracking-tight text-foreground mobile:text-[1.75rem] mobile:leading-[1.12] sm:text-5xl lg:text-[3.25rem] lg:leading-[1.1]">
        {HERO_HEADING.line1}
        <br />
        <span className="text-primary-soft">{HERO_HEADING.line2}</span>
      </h1>

      <p className="mt-4 max-w-lg text-base font-medium leading-relaxed text-muted mobile:mt-3 mobile:text-[0.9375rem] mobile:leading-[1.55] sm:text-lg lg:mt-5">
        {HERO_SUPPORTING.line1}
        <br className="hidden mobile:inline sm:hidden" />
        <span className="mobile:hidden sm:inline"> </span>
        {HERO_SUPPORTING.line2}
      </p>

      <div className="mt-6 mobile:mt-5 lg:mt-7">
        <p className="text-sm font-semibold text-muted mobile:text-[0.8125rem]">
          Multi-language Support
        </p>
        <ul
          className="mt-3 flex flex-wrap gap-2 mobile:mt-2.5 mobile:gap-2 sm:gap-2.5"
          aria-label="Supported languages"
        >
          {HERO_LANGUAGES.map((language) => (
            <li key={language}>
              <span className="inline-flex min-h-9 items-center rounded-lg border border-border bg-surface px-3 py-1.5 text-sm font-medium text-foreground shadow-sm mobile:min-h-9 mobile:px-3.5 mobile:py-2 mobile:text-[0.8125rem] sm:px-4 sm:py-2">
                {language}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
