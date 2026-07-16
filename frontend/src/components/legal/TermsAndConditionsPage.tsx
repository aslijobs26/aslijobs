"use client";

import {
  TERMS_AND_CONDITIONS_SECTIONS,
  TERMS_DOCUMENT_META,
} from "@/constants/terms-and-conditions";
import { LegalDocumentPage } from "./LegalDocumentPage";

export function TermsAndConditionsPage() {
  return (
    <LegalDocumentPage
      meta={TERMS_DOCUMENT_META}
      sections={TERMS_AND_CONDITIONS_SECTIONS}
    />
  );
}
