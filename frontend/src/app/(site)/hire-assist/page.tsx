import { HireAssistPageContent } from "@/components/hire-assist/HireAssistPageContent";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Hire Assist | AsliJobs",
  description:
    "Tell us about your hiring requirements. Our team will help you connect with the right candidates faster.",
};

export default function HireAssistPage() {
  return <HireAssistPageContent />;
}
