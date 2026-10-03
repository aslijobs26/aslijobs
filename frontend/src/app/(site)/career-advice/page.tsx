import type { Metadata } from "next";
import { LocalizedPublicPage } from "@/components/job-seeker-content/LocalizedPublicPage";
import { publicPagesBundle } from "@/i18n/bundles/public-pages";

const english = publicPagesBundle.en.publicPages.careerAdvice;

export const metadata: Metadata = {
  title: `${english.title} | AsliJobs`,
  description: english.metaDescription,
};

export default function CareerAdvicePage() {
  return <LocalizedPublicPage pageKey="careerAdvice" />;
}
