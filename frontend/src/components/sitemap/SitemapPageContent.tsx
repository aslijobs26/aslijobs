"use client";

import { Container } from "@/components/layout/Container";
import { FOOTER_NAV_GROUPS } from "@/constants/footer-navigation";
import { ROUTES } from "@/constants/routes";
import { sitePagesBundle } from "@/i18n/bundles/site-pages";
import { useTranslate } from "@/i18n/translate";
import { useSiteLanguage } from "@/i18n/site-language";
import Link from "next/link";

function isExternalHref(href: string) {
  return href.startsWith("http");
}

export function SitemapPageContent() {
  const t = useTranslate();
  const language = useSiteLanguage();
  const copy = sitePagesBundle[language.code].sitePages;

  return (
    <main className="bg-hero-bg/40">
      <section className="border-b border-border-subtle bg-legal-hero-surface">
        <Container className="py-8 sm:py-10 lg:py-12">
          <nav aria-label={t("faqs.breadcrumbAria")} className="text-xs text-muted sm:text-sm">
            <ol className="flex flex-wrap items-center gap-2">
              <li>
                <Link
                  href={ROUTES.HOME}
                  className="font-medium transition-colors hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
                >
                  {t("common.home")}
                </Link>
              </li>
              <li aria-hidden="true" className="text-border">
                &gt;
              </li>
              <li className="font-semibold text-foreground" aria-current="page">
                {t("footer.sitemap")}
              </li>
            </ol>
          </nav>

          <div className="mx-auto mt-8 max-w-3xl text-center sm:mt-10">
            <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-4xl lg:text-5xl">
              {t("footer.sitemap")}
            </h1>
            <p className="mt-4 text-xs leading-relaxed text-muted sm:text-base lg:text-lg">
              {copy.sitemapDescription}
            </p>
          </div>
        </Container>
      </section>

      <section className="py-10 sm:py-12 lg:py-16">
        <Container>
          <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {FOOTER_NAV_GROUPS.map((group) => (
              <nav key={group.id} aria-label={t(group.titleKey)}>
                <h2 className="text-sm font-bold text-foreground">{t(group.titleKey)}</h2>
                <ul className="mt-3 space-y-2.5">
                  {group.links.map((link) => {
                    const external = isExternalHref(link.href);
                    return (
                      <li key={link.id}>
                        <Link
                          href={link.href}
                          target={external ? "_blank" : undefined}
                          rel={external ? "noopener noreferrer" : undefined}
                          className="text-sm text-primary transition-colors hover:text-primary-hover focus-visible:rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
                        >
                          {t(link.labelKey)}
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </nav>
            ))}
          </div>
        </Container>
      </section>
    </main>
  );
}
