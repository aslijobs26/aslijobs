import { Container } from "@/components/layout/Container";
import {
  HIRING_SOLUTIONS,
  HIRING_SOLUTIONS_SECTION,
} from "@/constants/hiring-solutions";
import Link from "next/link";
import { HiringSolutionCard } from "./HiringSolutionCard";

export function HiringSolutionsSection() {
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
              className="text-xl font-bold text-foreground sm:text-2xl"
            >
              {HIRING_SOLUTIONS_SECTION.title}
            </h2>
            <p className="mt-1.5 text-sm text-muted sm:text-base">
              {HIRING_SOLUTIONS_SECTION.description}
            </p>
          </div>

          <Link
            href={HIRING_SOLUTIONS_SECTION.compareHref}
            className="shrink-0 text-sm font-semibold text-primary transition-colors hover:text-primary-hover focus-visible:rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
          >
            {HIRING_SOLUTIONS_SECTION.compareLabel}
          </Link>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5 lg:grid-cols-4">
          {HIRING_SOLUTIONS.map((solution) => (
            <HiringSolutionCard key={solution.id} solution={solution} />
          ))}
        </div>
      </Container>
    </section>
  );
}
