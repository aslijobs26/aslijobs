"use client";

import { GUIDELINES_SECTIONS } from "@/constants/guidelines";
import { useTranslate } from "@/i18n/translate";
import type { LegalDocumentMeta, LegalSection } from "@/types/legal";
import { LegalDocumentPage } from "./LegalDocumentPage";

export function GuidelinesPage() {
  const t = useTranslate();

  const meta: LegalDocumentMeta = {
    title: t("guidelines.meta.title"),
    effectiveDate: t("guidelines.meta.effectiveDate"),
    lastUpdated: t("guidelines.meta.lastUpdated"),
  };

  const sections: LegalSection[] = GUIDELINES_SECTIONS.map((section) => ({
    id: section.id,
    navLabel: t(section.navLabelKey),
    title: t(section.titleKey),
    blocks: section.paragraphKeys.map((key) => ({
      type: "paragraph" as const,
      text: t(key),
    })),
  }));

  return <LegalDocumentPage meta={meta} sections={sections} />;
}
