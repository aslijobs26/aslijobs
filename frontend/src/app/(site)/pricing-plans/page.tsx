import { JobSeekerContentPage } from "@/components/job-seeker-content/JobSeekerContentPage";
import { PRICING_PLANS_CONTENT } from "@/constants/employer-content";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: `${PRICING_PLANS_CONTENT.title} | AsliJobs`,
  description: PRICING_PLANS_CONTENT.metaDescription,
};

export default function PricingPlansPage() {
  return <JobSeekerContentPage content={PRICING_PLANS_CONTENT} />;
}
