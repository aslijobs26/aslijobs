import { FaqsPageContent } from "@/components/faqs/FaqsPageContent";
import { FAQ_PAGE_SUBTITLE, FAQ_PAGE_TITLE } from "@/constants/faqs";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: `${FAQ_PAGE_TITLE} | AsliJobs`,
  description: FAQ_PAGE_SUBTITLE,
};

export default function FaqsPage() {
  return <FaqsPageContent />;
}
