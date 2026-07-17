"use client";

import {
  GUIDELINES_DOCUMENT_META,
  GUIDELINES_SECTIONS,
} from "@/constants/guidelines";
import { LegalDocumentPage } from "./LegalDocumentPage";

export function GuidelinesPage() {
  return (
    <LegalDocumentPage
      meta={GUIDELINES_DOCUMENT_META}
      sections={GUIDELINES_SECTIONS}
    />
  );
}
