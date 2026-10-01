import { TermsAndConditionsPage } from "@/components/legal/TermsAndConditionsPage";
import { termsBundle } from "@/i18n/bundles/terms";
import type { Metadata } from "next";

const english = termsBundle.en.terms.meta;

export const metadata: Metadata = {
  title: `${english.title} | AsliJobs`,
  description: english.description,
};

export default function TermsAndConditionsRoute() {
  return <TermsAndConditionsPage />;
}
