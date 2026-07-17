import type { LegalSection as LegalSectionType } from "@/types/legal";
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
  return (
    <article className="w-full bg-transparent">
      <div className="mb-8 space-y-1 border-b-2 border-border pb-6 text-xs text-muted sm:mb-10 md:text-sm">
        <p>
          <span className="font-semibold text-foreground">Effective Date:</span>{" "}
          {effectiveDate}
        </p>
        <p>
          <span className="font-semibold text-foreground">Last Updated:</span>{" "}
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
