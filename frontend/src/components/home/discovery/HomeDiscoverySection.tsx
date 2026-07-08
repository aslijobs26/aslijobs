import { Container } from "@/components/layout/Container";
import { CategorySection } from "./CategorySection";
import { EmployerSection } from "./EmployerSection";

export function HomeDiscoverySection() {
  return (
    <section
      aria-label="Discover jobs and employers"
      className="bg-surface pb-10 pt-2 sm:pb-12 sm:pt-4 lg:pb-14"
    >
      <Container className="flex flex-col gap-10 sm:gap-12">
        <CategorySection />
        <EmployerSection />
      </Container>
    </section>
  );
}
