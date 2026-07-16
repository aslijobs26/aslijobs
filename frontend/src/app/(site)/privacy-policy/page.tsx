import { PrivacyPolicyPage } from "@/components/legal/PrivacyPolicyPage";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy | AsliJobs",
  description:
    "AsliJobs Privacy Policy explaining how user information is collected, used, stored, and protected.",
};

export default function PrivacyPolicyRoute() {
  return <PrivacyPolicyPage />;
}
