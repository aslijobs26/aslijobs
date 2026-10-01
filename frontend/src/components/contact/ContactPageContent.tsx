"use client";

import { Container } from "@/components/layout/Container";
import { WHATSAPP_CONTACT_URL } from "@/constants/cta";
import { ROUTES } from "@/constants/routes";
import { sitePagesBundle } from "@/i18n/bundles/site-pages";
import { useTranslate } from "@/i18n/translate";
import { useSiteLanguage } from "@/i18n/site-language";
import Link from "next/link";

const SUPPORT_EMAIL = "contact@aslijobs.com";
const SUPPORT_PHONE = "9248719057";

export function ContactPageContent() {
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
                {copy.contactTitle}
              </li>
            </ol>
          </nav>

          <div className="mx-auto mt-8 max-w-3xl text-center sm:mt-10">
            <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-4xl lg:text-5xl">
              {copy.contactTitle}
            </h1>
            <p className="mt-4 text-xs leading-relaxed text-muted sm:text-base lg:text-lg">
              {copy.contactDescription}
            </p>
          </div>
        </Container>
      </section>

      <section className="py-10 sm:py-12 lg:py-16">
        <Container className="max-w-3xl">
          <div className="space-y-4 rounded-[1.5rem] border border-primary/15 bg-surface px-6 py-8 shadow-[0_16px_40px_rgba(26,43,60,0.07)] sm:px-8 sm:py-10">
            <p className="text-sm text-foreground sm:text-base">
              <span className="font-semibold">{copy.email}:</span>{" "}
              <a
                href={`mailto:${SUPPORT_EMAIL}`}
                className="text-primary underline-offset-2 hover:underline"
              >
                {SUPPORT_EMAIL}
              </a>
            </p>
            <p className="text-sm text-foreground sm:text-base">
              <span className="font-semibold">{copy.phone}:</span>{" "}
              <a
                href={`tel:+91${SUPPORT_PHONE}`}
                className="text-primary underline-offset-2 hover:underline"
              >
                {SUPPORT_PHONE}
              </a>
            </p>
            <p className="text-sm text-foreground sm:text-base">
              <span className="font-semibold">{copy.address}:</span>{" "}
              {copy.addressValue}
            </p>
            <p className="text-sm text-foreground sm:text-base">
              <span className="font-semibold">{copy.hours}:</span> {copy.hoursValue}
            </p>
            <a
              href={WHATSAPP_CONTACT_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-4 inline-flex h-11 items-center justify-center rounded-xl bg-primary px-5 text-xs font-bold text-white transition-colors hover:bg-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 sm:h-12 sm:px-6 sm:text-sm"
            >
              {copy.whatsapp}
            </a>
          </div>
        </Container>
      </section>
    </main>
  );
}
