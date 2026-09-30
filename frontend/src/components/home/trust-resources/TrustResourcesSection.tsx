"use client";

import { Container } from "@/components/layout/Container";
import { useTranslate } from "@/i18n/translate";
import { HomeStatsBanner } from "./HomeStatsBanner";
import { HowItWorksSection } from "./HowItWorksSection";
import { JobSeekerResources } from "./JobSeekerResources";
import { WhyChooseSection } from "./WhyChooseSection";

export function TrustResourcesSection() {
  const t = useTranslate();

  return (
    <section
      aria-label={t("home.trust.sectionAria")}
      className="bg-surface pb-10 pt-2 sm:pb-12 sm:pt-4 lg:pb-14"
    >
      <Container className="flex flex-col gap-10 sm:gap-12 lg:gap-14">
        <WhyChooseSection />
        <HowItWorksSection />
        <JobSeekerResources />
        <HomeStatsBanner />
      </Container>
    </section>
  );
}
