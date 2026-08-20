import { OperationsLayout } from "../components/operations/layout/OperationsLayout";

interface OperationsPlaceholderPageProps {
  title: string;
  description?: string;
}

export function OperationsPlaceholderPage({
  title,
  description = "This section will connect to Operations APIs in a future release.",
}: OperationsPlaceholderPageProps) {
  return (
    <OperationsLayout title={title} subtitle={description}>
      <div className="mx-auto flex max-w-2xl flex-col items-center justify-center rounded-xl border border-dashed border-border bg-surface px-6 py-16 text-center shadow-sm">
        <p className="text-sm text-muted">
          UI shell is ready. Backend integration pending.
        </p>
      </div>
    </OperationsLayout>
  );
}
