import { Container } from "@/components/layout/Container";
import { HeroContent } from "./HeroContent";
import { HeroCtaRow } from "./HeroCtaRow";
import { HeroSearchForm } from "./HeroSearchForm";
import { HeroVisual } from "./HeroVisual";

export function HeroSection() {
  return (
    <section className="relative overflow-hidden bg-hero-bg pb-10 sm:pb-12 lg:pb-14">
      <Container className="relative">
        <div className="flex flex-col gap-3 pt-2 sm:gap-4 sm:pt-3 lg:gap-2 lg:pt-4">
          <div className="grid grid-cols-1 items-start gap-4 lg:grid-cols-2 lg:gap-6">
            <HeroContent />
            <HeroVisual />
          </div>

          <div className="relative z-20 -mt-4 flex flex-col gap-3 sm:-mt-6 sm:gap-4 lg:-mt-20">
            <HeroSearchForm />
            <HeroCtaRow />
          </div>
        </div>
      </Container>
    </section>
  );
}
