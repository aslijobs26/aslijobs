import { PostJobContent } from "@/components/post-job/PostJobContent";
import { PostJobHeader } from "@/components/post-job/PostJobHeader";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Post Job | AsliJobs",
  description: "Post a job on AsliJobs",
};

export default function PostJobPage() {
  return (
    <main className="flex min-h-dvh flex-col bg-hero-bg">
      <PostJobHeader />
      <PostJobContent />
    </main>
  );
}
