"use client";

import { HIRING_SOLUTION_KEYS } from "@/components/home/home-i18n";
import { Container } from "@/components/layout/Container";
import { HIRING_SOLUTIONS } from "@/constants/hiring-solutions";
import { useTranslate } from "@/i18n/translate";
import { HiringSolutionCard } from "./HiringSolutionCard";

export function HiringSolutionsSection() {
  const t = useTranslate();

  return (
    <section
      aria-labelledby="hiring-solutions-heading"
      className="bg-surface pb-10 pt-2 sm:pb-12 sm:pt-4 lg:pb-14"
    >
      <Container>
        <div className="mb-6 min-w-0 sm:mb-8">
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
