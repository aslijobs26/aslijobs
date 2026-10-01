"use client";

import { Container } from "@/components/layout/Container";
import { ROUTES } from "@/constants/routes";
import { sitePagesBundle } from "@/i18n/bundles/site-pages";
import { useSiteLanguage } from "@/i18n/site-language";
import Link from "next/link";

export function ResourcesIndexPage() {
  const language = useSiteLanguage();
  const copy = sitePagesBundle[language.code].sitePages;

  return (
    <main className="bg-hero-bg/40">
      <Container className="py-16 sm:py-20">
        <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
          {copy.resourcesTitle}
        </h1>
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted sm:text-base">
          {copy.resourcesDescription}
        </p>
        <Link
          href={ROUTES.FAQS}
          className="mt-8 inline-flex h-12 items-center justify-center rounded-xl bg-primary px-6 text-sm font-bold text-white transition-colors hover:bg-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
        >
          {copy.browseFaqs}
        </Link>
      </Container>
    </main>
  );
}
