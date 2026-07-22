import { PostJobPageClient } from "@/components/post-job/PostJobPageClient";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Post Job | AsliJobs",
  description: "Post a job on AsliJobs",
};

export default function PostJobPage() {
  return <PostJobPageClient />;
}
