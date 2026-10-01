import { GuidelinesPage } from "@/components/legal/GuidelinesPage";
import { guidelinesBundle } from "@/i18n/bundles/guidelines";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: `${guidelinesBundle.en.guidelines.meta.title} | AsliJobs`,
  description:
    "AsliJobs Guidelines for employers, job seekers, and platform users.",
};

export default function GuidelinesRoute() {
  return <GuidelinesPage />;
}
