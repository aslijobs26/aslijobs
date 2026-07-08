import { HomeDiscoverySection } from "@/components/home/discovery/HomeDiscoverySection";
import { JobsDiscoverySection } from "@/components/home/jobs-discovery/JobsDiscoverySection";
import { HeroSection } from "@/components/home/hero/HeroSection";
import { TrustResourcesSection } from "@/components/home/trust-resources/TrustResourcesSection";

export default function Home() {
  return (
    <main>
      <HeroSection />
      <HomeDiscoverySection />
      <JobsDiscoverySection />
      <TrustResourcesSection />
    </main>
  );
}
