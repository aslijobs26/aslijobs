import { Eye } from "lucide-react";

import type { OperationsJobDetail } from "../../../../types/operations-jobs";
import { JobListingPreviewArticle } from "../detail/JobListingPreviewArticle";

interface OperationsPostJobLivePreviewProps {
  job: OperationsJobDetail;
  employerAssigned: boolean;
}

export function OperationsPostJobLivePreview({
  job,
  employerAssigned,
}: OperationsPostJobLivePreviewProps) {
  return (
    <aside className="min-w-0 xl:sticky xl:top-2">
      <div className="rounded-xl border border-border-subtle bg-surface shadow-sm">
        <div className="flex items-center gap-2 border-b border-border-subtle px-3 py-2.5 sm:px-4">
          <Eye className="size-4 text-primary" aria-hidden="true" />
          <h2 className="text-sm font-semibold text-foreground">Live Preview</h2>
          <span className="ml-auto inline-flex rounded-full bg-primary-light px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-primary">
            Preview
          </span>
        </div>

        <div className="p-3 sm:p-4">
          <JobListingPreviewArticle
            job={job}
            emptyDescriptionMessage="Job description will appear here as you type."
            className="border-0 bg-transparent p-0 sm:p-0"
          />

          <div
            className="mt-3 rounded-lg border border-warning/25 bg-warning/10 px-3 py-2.5 text-[11px] leading-relaxed text-foreground"
            role="status"
          >
            {employerAssigned
              ? "Employer assigned. Complete all required fields and publish when ready."
              : "Job will remain in Draft until you assign an employer and publish it."}
          </div>
        </div>
      </div>
    </aside>
  );
}
