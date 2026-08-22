import { OperationsLayout } from "../components/operations/layout/OperationsLayout";
import { OperationsPostJobWizard } from "../components/operations/jobs/post/OperationsPostJobWizard";

export function OperationsJobsPostPage() {
  return (
    <OperationsLayout
      title="Post New Job"
      subtitle="Create a job for an employer, preview it live, save drafts, assign an employer, and publish when ready."
    >
      <OperationsPostJobWizard />
    </OperationsLayout>
  );
}
