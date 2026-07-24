import { HelpCenterPageContent } from "@/components/help-center/HelpCenterPageContent";
import { HELP_CENTER_PAGE_TITLE } from "@/constants/help-center";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: `${HELP_CENTER_PAGE_TITLE} | AsliJobs`,
  description:
    "AsliJobs Help Center with guides for job seekers, employers, WhatsApp, safety, payments, and support.",
};

export default function HelpCenterPage() {
  return <HelpCenterPageContent />;
}
