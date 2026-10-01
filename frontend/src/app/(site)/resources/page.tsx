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

  if (params.resource === "faqs") {
    redirect(ROUTES.FAQS);
  }

  if (params.resource === "help-center") {
    redirect(ROUTES.HELP_CENTER);
  }

  if (params.page === "sitemap") {
    return <SitemapPageContent />;
  }

  return <ResourcesIndexPage />;
}
