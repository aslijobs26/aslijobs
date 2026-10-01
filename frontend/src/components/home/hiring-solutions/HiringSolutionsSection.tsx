"use client";

import { HIRING_SOLUTION_KEYS } from "@/components/home/home-i18n";
import { Container } from "@/components/layout/Container";
import {
  HIRING_SOLUTIONS,
  HIRING_SOLUTIONS_SECTION,
} from "@/constants/hiring-solutions";
import { useTranslate } from "@/i18n/translate";
import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { HiringSolutionCard } from "./HiringSolutionCard";

export function HiringSolutionsSection() {
  const t = useTranslate();

  return (
    <section
      aria-labelledby="hiring-solutions-heading"
      className="bg-surface pb-10 pt-2 sm:pb-12 sm:pt-4 lg:pb-14"
    >
      <Container>
        <div className="mb-6 flex flex-col gap-3 sm:mb-8 sm:flex-row sm:items-start sm:justify-between sm:gap-6">
          <div className="min-w-0">
            <h2
              id="hiring-solutions-heading"
              className="text-balance break-words text-xl font-bold text-foreground sm:text-2xl"
            >
              {t("home.hiring.title")}
            </h2>
            <p className="mt-1.5 break-words text-sm text-muted sm:text-base">
              {t("home.hiring.description")}
            </p>
          </div>

          <Link
            href={HIRING_SOLUTIONS_SECTION.compareHref}
            className="inline-flex shrink-0 items-center gap-1 text-sm font-semibold text-primary transition-colors hover:text-primary-hover focus-visible:rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
          >
            {t("home.hiring.compare")}
            <ArrowRight className="size-4 shrink-0" aria-hidden="true" />
          </Link>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5 lg:grid-cols-4">
          {HIRING_SOLUTIONS.map((solution) => {
            const keys = HIRING_SOLUTION_KEYS[solution.id];
            return (
              <HiringSolutionCard
                key={solution.id}
                solution={{
                  ...solution,
                  title: t(keys.title),
                  subtitle: t(keys.subtitle),
                  features: keys.features.map((featureKey) => t(featureKey)),
                  actionLabel: t(keys.action),
                }}
              />
            );
          })}
        </div>
      </Container>
    </section>
  );
}
