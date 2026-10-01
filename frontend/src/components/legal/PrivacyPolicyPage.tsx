"use client";

import { PRIVACY_SECTIONS } from "@/constants/privacy-policy";
import { useTranslate } from "@/i18n/translate";
import type { LegalDocumentMeta, LegalSection } from "@/types/legal";
import { LegalDocumentPage } from "./LegalDocumentPage";

export function PrivacyPolicyPage() {
  const t = useTranslate();

  const meta: LegalDocumentMeta = {
    title: t("privacy.meta.title"),
    effectiveDate: t("privacy.meta.effectiveDate"),
    lastUpdated: t("privacy.meta.lastUpdated"),
  };

  const sections: LegalSection[] = PRIVACY_SECTIONS.map((section) => ({
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
