"use client";

import { EmployerAuthGuard } from "@/components/employer-dashboard/EmployerAuthGuard";
import { PostJobContent } from "@/components/post-job/PostJobContent";
import { PostJobHeader } from "@/components/post-job/PostJobHeader";

type PostJobPageClientProps = {
  draftJobId?: string;
};

export function PostJobPageClient({ draftJobId }: PostJobPageClientProps) {
  return (
    <EmployerAuthGuard>
      <main className="flex min-h-dvh flex-col bg-hero-bg">
        <PostJobHeader />
        <PostJobContent draftJobId={draftJobId} />
      </main>
    </EmployerAuthGuard>
  );
}
