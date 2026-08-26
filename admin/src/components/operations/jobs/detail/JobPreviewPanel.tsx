import type { OperationsJobDetail } from "../../../../types/operations-jobs";
import { JobListingPreviewArticle } from "./JobListingPreviewArticle";

interface JobPreviewPanelProps {
  job: OperationsJobDetail;
}

export function JobPreviewPanel({ job }: JobPreviewPanelProps) {
  return (
    <div className="job-preview-canvas -m-2.5 flex min-h-[32rem] justify-center bg-surface px-3 py-6 sm:-m-3.5 sm:px-8 sm:py-10">
      <JobListingPreviewArticle job={job} className="w-full max-w-[40rem]" />
    </div>
  );
}
