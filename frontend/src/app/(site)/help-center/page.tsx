import { HelpCenterPageContent } from "@/components/help-center/HelpCenterPageContent";
import { helpCenterBundle } from "@/i18n/bundles/help-center";
import type { Metadata } from "next";

const english = helpCenterBundle.en.helpCenter;

export const metadata: Metadata = {
  title: `${english.pageTitle} | AsliJobs`,
  description: english.supportDescription,
};

export default function HelpCenterPage() {
  return <HelpCenterPageContent />;
}
