"use client";

import {
  PRIVACY_POLICY_SECTIONS,
  PRIVACY_POLICY_META,
} from "@/constants/privacy-policy";
import { LegalDocumentPage } from "./LegalDocumentPage";

export function PrivacyPolicyPage() {
  return (
    <LegalDocumentPage
      meta={PRIVACY_POLICY_META}
      sections={PRIVACY_POLICY_SECTIONS}
    />
  );
}
