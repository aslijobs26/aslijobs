import { PrivacyPolicyPage } from "@/components/legal/PrivacyPolicyPage";
import { privacyBundle } from "@/i18n/bundles/privacy";
import type { Metadata } from "next";

const english = privacyBundle.en.privacy.meta;

export const metadata: Metadata = {
  title: `${english.title} | AsliJobs`,
  description: english.description,
};

export default function PrivacyPolicyRoute() {
  return <PrivacyPolicyPage />;
}
