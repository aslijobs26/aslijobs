"use client";

import type { LegalSection as LegalSectionType } from "@/types/legal";
import { useTranslate } from "@/i18n/translate";
import { LegalSection } from "./LegalSection";

type LegalContentProps = {
  effectiveDate: string;
  lastUpdated: string;
  sections: LegalSectionType[];
};

export function LegalContent({
  effectiveDate,
  lastUpdated,
  sections,
}: LegalContentProps) {
  const t = useTranslate();

  return (
    <article className="w-full bg-transparent">
      <div className="mb-8 space-y-1 border-b-2 border-border pb-6 text-[11px] text-muted sm:mb-10 sm:text-xs md:text-sm">
        <p>
          <span className="font-semibold text-foreground">
            {t("legalChrome.effectiveDateLabel")}
          </span>{" "}
          {effectiveDate}
        </p>
        <p>
          <span className="font-semibold text-foreground">
            {t("legalChrome.lastUpdatedLabel")}
          </span>{" "}
          {lastUpdated}
        </p>
      </div>

      <div className="space-y-0">
        {sections.map((section) => (
          <LegalSection
            key={section.id}
            id={section.id}
            title={section.title}
            blocks={section.blocks}
          />
        ))}
      </div>
    </article>
  );
}
