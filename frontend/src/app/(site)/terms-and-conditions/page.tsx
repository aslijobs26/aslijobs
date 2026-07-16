import { TermsAndConditionsPage } from "@/components/legal/TermsAndConditionsPage";
import { TERMS_DOCUMENT_META } from "@/constants/terms-and-conditions";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: `${TERMS_DOCUMENT_META.title} | AsliJobs`,
  description:
    "Read the AsliJobs Terms and Conditions governing use of the website, WhatsApp services, employer tools, and related platform features.",
};

export default function TermsAndConditionsRoute() {
  return <TermsAndConditionsPage />;
}
