import { Container } from "@/components/layout/Container";
import { HeroCtaRow } from "./HeroCtaRow";

export function HeroCtaSection() {
  return (
    <section
      aria-label="Quick actions"
      className="bg-surface pb-8 pt-6 mobile:pb-7 mobile:pt-5 sm:pb-10 sm:pt-8 lg:pb-12 lg:pt-10"
    >
      <Container className="mobile:px-3.5">
        <HeroCtaRow />
      </Container>
    </section>
  );
}
