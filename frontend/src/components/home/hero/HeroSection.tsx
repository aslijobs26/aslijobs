import { Container } from "@/components/layout/Container";
import { HeroContent } from "./HeroContent";
import { HeroPopularSearches } from "./HeroPopularSearches";
import { HeroSearchForm } from "./HeroSearchForm";
import { HeroVisual } from "./HeroVisual";

export function HeroSection() {
  return (
    <section className="landing-hero-section relative overflow-x-clip bg-hero-bg pb-2 mobile:pb-2 sm:pb-3 lg:overflow-visible lg:pb-4">
      <Container className="relative min-w-0 overflow-visible mobile:px-3.5">
        <div className="flex min-w-0 flex-col gap-3 pt-2 mobile:gap-2.5 mobile:pt-1.5 sm:gap-4 sm:pt-3 lg:gap-2 lg:pt-4">
          <div className="grid min-w-0 grid-cols-1 items-start gap-4 overflow-visible mobile:gap-3 lg:grid-cols-2 lg:gap-6">
            <HeroContent />
            <HeroVisual />
          </div>

          {/*
            Keep a light tuck under the illustration only — strong negative
            margins (lg:-mt-16 / xl:-mt-20) overlapped the language chips.
          */}
          <div className="relative z-10 mt-1 flex min-w-0 flex-col gap-3 mobile:mt-1.5 mobile:gap-2.5 sm:mt-2 sm:gap-4 md:mt-3 lg:-mt-6 xl:-mt-8">
            <HeroSearchForm />
            <HeroPopularSearches />
          </div>
        </div>
      </Container>
    </section>
  );
}
