import { OperationsLayout } from "../components/operations/layout/OperationsLayout";
import { OperationsPostJobWizardAligned } from "../components/operations/jobs/post/OperationsPostJobWizardAligned";
import { useSearchParams } from "react-router-dom";

export function OperationsJobsPostPage() {
  const [searchParams] = useSearchParams();
  const isEditMode = Boolean(searchParams.get("edit")?.trim());

  return (
    <OperationsLayout
      title={isEditMode ? "Edit Job" : "Post New Job"}
      subtitle={
        isEditMode
          ? "Update job details, review the live preview, and save your changes."
          : "Create a job for an employer, preview it live, save drafts, assign an employer, and publish when ready."
      }
    >
      <OperationsPostJobWizardAligned />
    </OperationsLayout>
  );
}
