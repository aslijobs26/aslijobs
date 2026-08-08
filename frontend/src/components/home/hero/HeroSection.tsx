import { Container } from "@/components/layout/Container";
import { HeroContent } from "./HeroContent";
import { HeroPopularSearches } from "./HeroPopularSearches";
import { HeroSearchForm } from "./HeroSearchForm";
import { HeroVisual } from "./HeroVisual";

export function HeroSection() {
  return (
    <section className="landing-hero-section relative overflow-x-clip overflow-y-visible bg-hero-bg pb-2 mobile:pb-2 sm:pb-3 lg:pb-4">
      <Container className="relative mobile:px-3.5">
        <div className="flex flex-col gap-3 pt-2 mobile:gap-2.5 mobile:pt-1.5 sm:gap-4 sm:pt-3 lg:gap-2 lg:pt-4">
          <div className="grid grid-cols-1 items-start gap-4 mobile:gap-3 lg:grid-cols-2 lg:gap-6">
            <HeroContent />
            <HeroVisual />
          </div>

          <div className="relative z-20 -mt-4 flex flex-col gap-3 mobile:-mt-2 mobile:gap-2.5 sm:-mt-6 sm:gap-4 lg:-mt-20">
            <HeroSearchForm />
            <HeroPopularSearches />
          </div>
        </div>
      </Container>
    </section>
  );
}
