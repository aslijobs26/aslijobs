import { Download, Plus } from "lucide-react";
import { Link } from "react-router-dom";
import { OPERATIONS_ROUTES } from "../../../../constants/operations-routes";
import { OperationsCanKey } from "../../auth/OperationsCanKey";

interface MyWorkOverviewHeaderProps {
  onExport: () => void;
  isExporting?: boolean;
  onCreate?: () => void;
}

export function MyWorkOverviewHeader({
  onExport,
  isExporting = false,
  onCreate,
}: MyWorkOverviewHeaderProps) {
  return (
    <header className="flex min-w-0 flex-col gap-3 max-lg:gap-2.5 max-sm:gap-2">
      <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <h1 className="text-xl font-bold tracking-tight text-foreground max-lg:text-lg max-sm:text-base">
            My Work
          </h1>
          <p className="mt-0.5 text-xs text-muted max-sm:text-[11px] max-sm:leading-snug">
            Your tasks, requests and assignments — all in one place.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <OperationsCanKey permissionKey="my_work.create">
            {onCreate ? (
              <button
                type="button"
                onClick={onCreate}
                className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-border-subtle bg-surface px-3 text-[11px] font-semibold text-foreground shadow-sm hover:bg-hero-bg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
              >
                <Plus className="size-3.5" aria-hidden />
                Create work
              </button>
            ) : null}
          </OperationsCanKey>
          <OperationsCanKey permissionKey="my_work.export">
            <button
              type="button"
              onClick={onExport}
              disabled={isExporting}
              className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-border-subtle bg-surface px-3 text-[11px] font-semibold text-foreground shadow-sm hover:bg-hero-bg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <Download className="size-3.5" aria-hidden />
              {isExporting ? "Exporting…" : "Export"}
            </button>
          </OperationsCanKey>
          <Link
            to={OPERATIONS_ROUTES.MY_WORK_PERFORMANCE}
            className="inline-flex h-8 items-center gap-1 rounded-lg border border-border-subtle bg-surface px-3 text-[11px] font-semibold text-foreground shadow-sm hover:bg-hero-bg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
          >
            My Performance
            <span aria-hidden>›</span>
          </Link>
        </div>
      </div>
    </header>
  );
}
