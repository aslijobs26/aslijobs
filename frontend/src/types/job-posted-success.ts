import type { JobStatus } from "@/types/employer-jobs";

export type JobPostedSuccessSummary = {
  jobMongoId: string;
  publicJobId: string;
  jobTitle: string;
  companyName: string;
  location: string;
  salaryLabel: string;
  jobTypeLabel: string;
  status: JobStatus;
  liveChangeReviewStatus?: string;
  publishedAt: string | null;
  applications: number;
  visibility: "Public" | "Not public yet";
};
