import { Container } from "@/components/layout/Container";
import { LocationDiscoverySection } from "./LocationDiscoverySection";
import { PopularJobsSection } from "./PopularJobsSection";

export function JobsDiscoverySection() {
  return (
    <section
      aria-label="Popular jobs and locations"
      className="bg-surface pb-10 sm:pb-12 lg:pb-14"
    >
      <Container className="flex flex-col gap-10 sm:gap-12">
        <PopularJobsSection />
        <LocationDiscoverySection />
      </Container>
    </section>
  );
}
