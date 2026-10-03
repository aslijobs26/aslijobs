import type { Metadata } from "next";
import { LocalizedPublicPage } from "@/components/job-seeker-content/LocalizedPublicPage";
import { publicPagesBundle } from "@/i18n/bundles/public-pages";

const english = publicPagesBundle.en.publicPages.interviewTips;

export const metadata: Metadata = {
  title: `${english.title} | AsliJobs`,
  description: english.metaDescription,
};

export default function InterviewTipsPage() {
  return <LocalizedPublicPage pageKey="interviewTips" />;
}
