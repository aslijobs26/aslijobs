import { ResourcesIndexPage } from "@/components/resources/ResourcesIndexPage";
import { SitemapPageContent } from "@/components/sitemap/SitemapPageContent";
import { ROUTES } from "@/constants/routes";
import { sitePagesBundle } from "@/i18n/bundles/site-pages";
import type { Metadata } from "next";
import { redirect } from "next/navigation";

const english = sitePagesBundle.en.sitePages;

export const metadata: Metadata = {
  title: `${english.resourcesTitle} | AsliJobs`,
  description: english.resourcesDescription,
};

const RESOURCE_REDIRECTS: Readonly<Record<string, string>> = {
  faqs: ROUTES.FAQS,
  "help-center": ROUTES.HELP_CENTER,
  "resume-builder": ROUTES.JOB_SEEKER_MY_RESUME,
  "interview-tips": ROUTES.INTERVIEW_TIPS,
  "salary-guide": ROUTES.SALARY_GUIDE,
  "career-advice": ROUTES.CAREER_ADVICE,
};

type ResourcesPageProps = {
  searchParams: Promise<{
    resource?: string;
    page?: string;
  }>;
};

export default async function ResourcesPage({
  searchParams,
}: ResourcesPageProps) {
  const params = await searchParams;
  const resourceRedirect =
    params.resource && Object.hasOwn(RESOURCE_REDIRECTS, params.resource)
      ? RESOURCE_REDIRECTS[params.resource]
      : undefined;

  if (resourceRedirect) {
    redirect(resourceRedirect);
  }

  if (params.page === "sitemap") {
    return <SitemapPageContent />;
  }

  return <ResourcesIndexPage />;
}
