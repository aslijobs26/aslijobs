"use client";

import { Container } from "@/components/layout/Container";
import { useActiveLegalSection } from "@/hooks/useActiveLegalSection";
import type { LegalDocumentMeta, LegalSection } from "@/types/legal";
import { useMemo } from "react";
import { LegalContent } from "./LegalContent";
import { LegalHero } from "./LegalHero";
import { LegalSidebar } from "./LegalSidebar";

type LegalDocumentPageProps = {
  meta: LegalDocumentMeta;
  sections: LegalSection[];
};

export function LegalDocumentPage({ meta, sections }: LegalDocumentPageProps) {
  const sectionIds = useMemo(
    () => sections.map((section) => section.id),
    [sections],
  );

  const tocItems = useMemo(
    () =>
      sections.map((section) => ({
        id: section.id,
        label: section.navLabel,
      })),
    [sections],
  );

  const { activeId, activateSection } = useActiveLegalSection({ sectionIds });

  return (
    <main>
      <LegalHero title={meta.title} lastUpdated={meta.lastUpdated} />

      <section className="bg-hero-bg/30 pb-16 pt-8 sm:pb-20 sm:pt-10 lg:pb-24">
        <Container>
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-[15.5rem_minmax(0,1fr)] lg:gap-0">
            <LegalSidebar
              items={tocItems}
              activeId={activeId}
              onItemSelect={activateSection}
            />
            <div className="min-w-0 w-full lg:border-l-2 lg:border-border lg:pl-12 xl:pl-16">
              <LegalContent
                effectiveDate={meta.effectiveDate}
                lastUpdated={meta.lastUpdated}
                sections={sections}
              />
            </div>
          </div>
        </Container>
      </section>
    </main>
  );
}
