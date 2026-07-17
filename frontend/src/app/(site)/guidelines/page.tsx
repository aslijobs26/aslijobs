import { GuidelinesPage } from "@/components/legal/GuidelinesPage";
import { GUIDELINES_DOCUMENT_META } from "@/constants/guidelines";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: `${GUIDELINES_DOCUMENT_META.title} | AsliJobs`,
  description:
    "AsliJobs Guidelines for employers, job seekers, and platform users.",
};

export default function GuidelinesRoute() {
  return <GuidelinesPage />;
}
