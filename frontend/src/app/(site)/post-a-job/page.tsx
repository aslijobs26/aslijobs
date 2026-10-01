import { PostAJobPageContent } from "@/components/employer-content/PostAJobPageContent";
import { publicContentBundle } from "@/i18n/bundles/public-content";
import type { Metadata } from "next";

const english = publicContentBundle.en.publicContent.postAJob;

export const metadata: Metadata = {
  title: `${english.title} | AsliJobs`,
  description: english.metaDescription,
};

export default function PostAJobContentPage() {
  return <PostAJobPageContent />;
}
