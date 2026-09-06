import { OperationsLayout } from "../components/operations/layout/OperationsLayout";
import { Link } from "react-router-dom";
import { OPERATIONS_ROUTES } from "../constants/operations-routes";

/**
 * Management → Operations hub shell.
 * The command center lives on Home; this page remains a lightweight ops entry.
 */
export function OperationsDashboardPage() {
  return (
    <OperationsLayout
      title="Operations"
      subtitle="Manage day-to-day operational workflows."
      headerVariant="command"
    >
      <section className="rounded-xl border border-dashed border-border-subtle bg-surface px-5 py-8 text-center shadow-sm">
        <h2 className="text-base font-semibold text-foreground">Operations</h2>
        <p className="mx-auto mt-2 max-w-md text-[13px] text-muted">
          Use Home for the live command center. Jump into queues and modules from
          here when you need focused operational work.
        </p>
        <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
          <Link
            to={OPERATIONS_ROUTES.HOME}
            className="inline-flex h-9 items-center rounded-md bg-primary px-3.5 text-[12px] font-semibold text-surface hover:bg-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
          >
            Open Home
          </Link>
          <Link
            to={OPERATIONS_ROUTES.WORK_QUEUE}
            className="inline-flex h-9 items-center rounded-md border border-border-subtle bg-surface px-3.5 text-[12px] font-semibold text-foreground hover:bg-hero-bg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
          >
            What Needs Attention
          </Link>
        </div>
      </section>
    </OperationsLayout>
  );
}
