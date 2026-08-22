import type { OperationsJobDetail } from "../../../../types/operations-jobs";

import { OperationsCard } from "../../../ui/OperationsCard";

import { JobListingPreviewArticle } from "./JobListingPreviewArticle";



interface JobPreviewPanelProps {

  job: OperationsJobDetail;

}



export function JobPreviewPanel({ job }: JobPreviewPanelProps) {

  return (

    <OperationsCard

      title="Job Preview"

      subtitle="How this job appears using stored listing data."

    >

      <JobListingPreviewArticle job={job} />

    </OperationsCard>

  );

}

