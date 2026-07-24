import { Container } from "@/components/layout/Container";
import { ROUTES } from "@/constants/routes";
import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "Resources | AsliJobs",
  description: "Browse AsliJobs resources, guides, and FAQs.",
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

  return (
    <main className="bg-hero-bg/40">
      <Container className="py-16 sm:py-20">
        <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
          Resources
        </h1>
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted sm:text-base">
          Find helpful answers and guides for job seekers and employers on
          AsliJobs.
        </p>
        <Link
          href={ROUTES.FAQS}
          className="mt-8 inline-flex h-12 items-center justify-center rounded-xl bg-primary px-6 text-sm font-bold text-white transition-colors hover:bg-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
        >
          Browse FAQs
        </Link>
      </Container>
    </main>
  );
}
