"use client";

import { TERMS_SECTIONS } from "@/constants/terms-and-conditions";
import { useTranslate } from "@/i18n/translate";
import type { LegalDocumentMeta, LegalSection } from "@/types/legal";
import { LegalDocumentPage } from "./LegalDocumentPage";

export function TermsAndConditionsPage() {
  const t = useTranslate();

  const meta: LegalDocumentMeta = {
    title: t("terms.meta.title"),
    effectiveDate: t("terms.meta.effectiveDate"),
    lastUpdated: t("terms.meta.lastUpdated"),
  };

  const sections: LegalSection[] = TERMS_SECTIONS.map((section) => ({
    id: section.id,
    navLabel: t(section.navLabelKey),
    title: section.titleKey ? t(section.titleKey) : null,
    blocks: section.blocks.map((block) => {
      if (block.type === "paragraph") {
        return { type: "paragraph" as const, text: t(block.key) };
      }
      if (block.type === "list") {
        return { type: "list" as const, items: block.keys.map((key) => t(key)) };
      }
      return {
        type: "contact-lines" as const,
        lines: block.keys.map((key) => t(key)),
      };
    }),
  }));

  return <LegalDocumentPage meta={meta} sections={sections} />;
}
