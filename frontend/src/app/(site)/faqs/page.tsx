import { FaqsPageContent } from "@/components/faqs/FaqsPageContent";
import { faqsBundle } from "@/i18n/bundles/faqs";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: `${faqsBundle.en.faqs.pageTitle} | AsliJobs`,
  description: faqsBundle.en.faqs.subtitle,
};

export default function FaqsPage() {
  return <FaqsPageContent />;
}
