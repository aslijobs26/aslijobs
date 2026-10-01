import { LocalizedPublicPage } from "@/components/job-seeker-content/LocalizedPublicPage";
import { publicPagesBundle } from "@/i18n/bundles/public-pages";
import type { Metadata } from "next";

const english = publicPagesBundle.en.publicPages.jobCategories;

export const metadata: Metadata = {
  title: `${english.title} | AsliJobs`,
  description: english.metaDescription,
};

export default function JobCategoriesPage() {
  return <LocalizedPublicPage pageKey="jobCategories" />;
}
