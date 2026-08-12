import { Container } from "@/components/layout/Container";
import { ROUTES } from "@/constants/routes";
import type {
  JobSeekerContentPageData,
  JobSeekerContentSection,
} from "@/types/job-seeker-content";
import { cn } from "@/utils/cn";
import {
  ArrowRight,
  CheckCircle2,
  MessageCircle,
  ShieldAlert,
} from "lucide-react";
import Link from "next/link";

type JobSeekerContentPageProps = {
  content: JobSeekerContentPageData;
};

function isSafetySection(variant: JobSeekerContentSection["variant"]) {
  return variant === "safety";
}

export function JobSeekerContentPage({ content }: JobSeekerContentPageProps) {
  const [lead, ...supportingIntro] = content.intro;

  return (
    <main className="bg-hero-bg/40">
      <section className="relative overflow-hidden border-b border-border-subtle bg-legal-hero-surface">
        <div
          className="pointer-events-none absolute -top-24 right-0 h-72 w-72 rounded-full bg-primary-soft/15 blur-3xl"
          aria-hidden="true"
        />
        <div
          className="pointer-events-none absolute -bottom-28 left-0 h-64 w-64 rounded-full bg-primary/10 blur-3xl"
          aria-hidden="true"
        />

        <Container className="relative py-6 sm:py-10 lg:py-12">
          <nav aria-label="Breadcrumb" className="text-[11px] text-muted sm:text-sm">
            <ol className="flex flex-wrap items-center gap-1.5 sm:gap-2">
              <li>
                <Link
                  href={ROUTES.HOME}
                  className="font-medium transition-colors hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
                >
                  Home
                </Link>
              </li>
              <li aria-hidden="true" className="text-border">
                &gt;
              </li>
              <li className="font-semibold text-foreground" aria-current="page">
                {content.title}
              </li>
            </ol>
          </nav>

          <div className="mx-auto mt-5 max-w-3xl text-center sm:mt-9">
            <h1 className="text-xl font-bold tracking-tight text-foreground sm:text-4xl lg:text-5xl">
              {content.title}
            </h1>
            <div
              className="mx-auto mt-3 h-0.5 w-10 rounded-full bg-primary-soft sm:mt-5 sm:h-1 sm:w-14"
              aria-hidden="true"
            />
            {lead ? (
              <p className="mt-4 text-xs leading-relaxed text-foreground/80 sm:mt-6 sm:text-base lg:text-lg">
                {lead}
              </p>
            ) : null}
          </div>
        </Container>
      </section>

      <section className="py-8 sm:py-10 lg:py-14">
        <Container className="max-w-3xl">
          {supportingIntro.length > 0 ? (
            <div className="mb-10 space-y-3.5 border-b border-border-subtle pb-8 sm:mb-12 sm:pb-10">
              {supportingIntro.map((paragraph, index) => (
                <p
                  key={`${content.slug}-intro-${index}`}
                  className="text-xs leading-relaxed text-muted sm:text-[15px]"
                >
                  {paragraph}
                </p>
              ))}
            </div>
          ) : null}

          <div className="relative">
            <div
              className="absolute top-3 bottom-3 left-[15px] w-px bg-border-subtle sm:left-[17px]"
              aria-hidden="true"
            />

            <div className="space-y-0">
              {content.sections.map((section, sectionIndex) => {
                const safety = isSafetySection(section.variant);
                const stepNumber = String(sectionIndex + 1).padStart(2, "0");
                const isLast = sectionIndex === content.sections.length - 1;

                return (
                  <article
                    key={section.id}
                    id={section.id}
                    className={cn(
                      "relative grid grid-cols-[2rem_minmax(0,1fr)] gap-x-4 sm:grid-cols-[2.25rem_minmax(0,1fr)] sm:gap-x-5",
                      !isLast && "pb-8 sm:pb-10",
                    )}
                  >
                    <div className="relative z-[1] flex justify-center">
                      <span
                        className={cn(
                          "inline-flex size-8 items-center justify-center rounded-full text-[11px] font-bold sm:size-9 sm:text-xs",
                          safety
                            ? "bg-red-100 text-red-700 ring-2 ring-red-200"
                            : "bg-primary-light text-primary ring-2 ring-primary/15",
                        )}
                      >
                        {stepNumber}
                      </span>
                    </div>

                    <div
                      className={cn(
                        !isLast && "border-b border-border-subtle pb-8 sm:pb-10",
                      )}
                    >
                      <div className="flex flex-wrap items-center gap-2">
                        {safety ? (
                          <ShieldAlert
                            className="size-4 shrink-0 text-red-600"
                            strokeWidth={2.25}
                            aria-hidden="true"
                          />
                        ) : null}
                        <h2
                          className={cn(
                            "text-base font-bold tracking-tight sm:text-xl",
                            safety ? "text-red-700" : "text-foreground",
                          )}
                        >
                          {section.title}
                        </h2>
                      </div>

                      {section.paragraphs?.map((paragraph, index) => (
                        <p
                          key={`${section.id}-p-${index}`}
                          className={cn(
                            "mt-2.5 text-xs leading-relaxed sm:mt-3 sm:text-[15px]",
                            safety ? "text-red-900/75" : "text-muted",
                          )}
                        >
                          {paragraph}
                        </p>
                      ))}

                      {section.bullets && section.bullets.length > 0 ? (
                        <ul className="mt-3 space-y-2 sm:mt-4 sm:space-y-2.5">
                          {section.bullets.map((bullet) => (
                            <li
                              key={bullet}
                              className="flex items-start gap-2 text-xs text-foreground sm:gap-2.5 sm:text-sm"
                            >
                              <CheckCircle2
                                className={cn(
                                  "mt-0.5 size-3.5 shrink-0 sm:size-4",
                                  safety ? "text-red-600" : "text-primary",
                                )}
                                aria-hidden="true"
                              />
                              <span className="min-w-0 leading-snug">
                                {bullet}
                              </span>
                            </li>
                          ))}
                        </ul>
                      ) : null}

                      {section.cards && section.cards.length > 0 ? (
                        <ul className="mt-4 divide-y divide-border-subtle border-y border-border-subtle sm:mt-5">
                          {section.cards.map((card) => (
                            <li key={card.id} className="py-3 first:pt-2.5 last:pb-2.5 sm:py-4 sm:first:pt-3 sm:last:pb-3">
                              <h3 className="text-xs font-bold text-foreground sm:text-[15px]">
                                {card.title}
                              </h3>
                              <p className="mt-1 text-[11px] leading-relaxed text-muted sm:mt-1.5 sm:text-sm">
                                {card.description}
                              </p>
                            </li>
                          ))}
                        </ul>
                      ) : null}
                    </div>
                  </article>
                );
              })}
            </div>
          </div>

          <aside className="relative mt-10 overflow-hidden rounded-[1.35rem] border border-primary/20 bg-surface shadow-[0_16px_40px_rgba(26,43,60,0.07)] sm:mt-12">
            <div
              className="pointer-events-none absolute inset-0 bg-[linear-gradient(135deg,color-mix(in_srgb,var(--color-primary-soft)_16%,transparent)_0%,transparent_42%,color-mix(in_srgb,var(--color-primary)_10%,transparent)_100%)]"
              aria-hidden="true"
            />
            <div
              className="pointer-events-none absolute -right-16 -bottom-20 h-56 w-56 rounded-full bg-primary-soft/20 blur-3xl"
              aria-hidden="true"
            />

            <div className="relative grid gap-6 p-5 sm:gap-7 sm:p-7 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center lg:p-8">
              <div className="min-w-0">
                {content.cta.badge ? (
                  <p className="inline-flex items-center gap-2 rounded-full bg-primary-light px-3 py-1 text-[11px] font-bold tracking-wide text-primary uppercase">
                    <MessageCircle className="size-3.5" aria-hidden="true" />
                    {content.cta.badge}
                  </p>
                ) : null}
                <h2
                  className={cn(
                    "text-lg font-bold tracking-tight text-foreground sm:text-2xl",
                    content.cta.badge ? "mt-3" : "mt-0",
                  )}
                >
                  {content.cta.title}
                </h2>
                {content.cta.paragraphs.map((paragraph, index) => (
                  <p
                    key={`${content.slug}-cta-${index}`}
                    className="mt-2.5 text-xs leading-relaxed text-muted sm:mt-3 sm:text-[15px]"
                  >
                    {paragraph}
                  </p>
                ))}
                <p className="mt-3 border-l-2 border-primary-soft pl-3 text-xs font-semibold text-foreground sm:mt-4 sm:text-base">
                  {content.cta.tagline}
                </p>
              </div>

              <div className="flex w-full flex-col gap-2.5 sm:w-auto sm:flex-row lg:flex-col">
                {content.cta.actions.map((action) => {
                  const className =
                    action.variant === "secondary"
                      ? "inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border border-primary/30 bg-surface px-4 text-xs font-semibold text-primary transition-colors hover:border-primary hover:bg-primary/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 sm:min-h-11 sm:px-5 sm:text-sm"
                      : "inline-flex min-h-10 items-center justify-center gap-2 rounded-xl bg-primary px-4 text-xs font-semibold text-surface transition-colors hover:bg-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 sm:min-h-11 sm:px-5 sm:text-sm";

                  if (action.external) {
                    return (
                      <a
                        key={action.label}
                        href={action.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={className}
                      >
                        {action.variant !== "secondary" ? (
                          <MessageCircle
                            className="size-3.5 sm:size-4"
                            aria-hidden="true"
                          />
                        ) : null}
                        {action.label}
                        {action.variant !== "secondary" ? (
                          <ArrowRight
                            className="size-3.5 opacity-80 sm:size-4"
                            aria-hidden="true"
                          />
                        ) : null}
                      </a>
                    );
                  }

                  return (
                    <Link
                      key={action.label}
                      href={action.href}
                      className={className}
                    >
                      {action.label}
                    </Link>
                  );
                })}
              </div>
            </div>
          </aside>
        </Container>
      </section>
    </main>
  );
}
