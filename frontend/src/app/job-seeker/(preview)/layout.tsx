import { JobSeekerAuthGuard } from "@/components/job-seeker/JobSeekerAuthGuard";
import type { ReactNode } from "react";

type JobSeekerPreviewLayoutProps = {
  children: ReactNode;
};

export default function JobSeekerPreviewLayout({
  children,
}: JobSeekerPreviewLayoutProps) {
  return <JobSeekerAuthGuard>{children}</JobSeekerAuthGuard>;
}
