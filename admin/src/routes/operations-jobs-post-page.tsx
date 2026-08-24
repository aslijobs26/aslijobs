import { OperationsLayout } from "../components/operations/layout/OperationsLayout";
import { OperationsPostJobWizardAligned } from "../components/operations/jobs/post/OperationsPostJobWizardAligned";

export function OperationsJobsPostPage() {
  return (
    <OperationsLayout
      title="Post New Job"
      subtitle="Create a job for an employer, preview it live, save drafts, assign an employer, and publish when ready."
    >
      <OperationsPostJobWizardAligned />
    </OperationsLayout>
  );
}
