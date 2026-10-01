import { ContactPageContent } from "@/components/contact/ContactPageContent";
import { sitePagesBundle } from "@/i18n/bundles/site-pages";
import type { Metadata } from "next";

const english = sitePagesBundle.en.sitePages;

export const metadata: Metadata = {
  title: `${english.contactTitle} | AsliJobs`,
  description: english.contactDescription,
};

export default function ContactPage() {
  return <ContactPageContent />;
}
