import { Link } from "react-router-dom";
import { OperationsLayout } from "../components/operations/layout/OperationsLayout";
import { OPERATIONS_ROUTES } from "../constants/operations-routes";

export function OperationsJobsPostPage() {
  return (
    <OperationsLayout
      title="Post Job"
      subtitle="Create a new job posting for an employer."
    >
      <div className="mx-auto flex max-w-2xl flex-col items-center justify-center rounded-xl border border-dashed border-border bg-surface px-6 py-16 text-center shadow-sm">
        <p className="text-sm font-medium text-foreground">
          Post Job flow entry point is ready.
        </p>
        <p className="mt-2 text-xs text-muted">
          The full Post Job form will be implemented in a follow-up. Job listing
          data continues to load from the Operations Jobs API.
        </p>
        <Link
          to={OPERATIONS_ROUTES.JOBS}
          className="mt-4 inline-flex h-9 items-center rounded-md bg-primary-soft px-3 text-xs font-semibold text-surface transition-colors hover:bg-primary-soft-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
        >
          Back to Jobs
        </Link>
      </div>
    </OperationsLayout>
  );
}
