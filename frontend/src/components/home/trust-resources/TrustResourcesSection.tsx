import { Container } from "@/components/layout/Container";
import { HowItWorksSection } from "./HowItWorksSection";
import { JobSeekerResources } from "./JobSeekerResources";
import { WhatsAppCtaBanner } from "./WhatsAppCtaBanner";
import { WhyChooseSection } from "./WhyChooseSection";

export function TrustResourcesSection() {
  return (
    <section
      aria-label="Why choose AsliJobs, how it works, and resources"
      className="bg-surface pb-10 pt-2 sm:pb-12 sm:pt-4 lg:pb-14"
    >
      <Container className="flex flex-col gap-10 sm:gap-12 lg:gap-14">
        <WhyChooseSection />
        <HowItWorksSection />
        <JobSeekerResources />
        <WhatsAppCtaBanner />
      </Container>
    </section>
  );
}
