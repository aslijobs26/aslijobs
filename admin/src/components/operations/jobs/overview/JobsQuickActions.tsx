import {
  AlertTriangle,
  ArrowRight,
  Briefcase,
  ClipboardCheck,
  Download,
  type LucideIcon,
} from "lucide-react";
import { Link } from "react-router-dom";
import { OPERATIONS_ROUTES } from "../../../../constants/operations-routes";
import { OperationsCard } from "../../../ui/OperationsCard";

interface JobsQuickActionsProps {
  onExport: () => void;
  onReviewPending: () => void;
  onCheckAtRisk: () => void;
}

export function JobsQuickActions({
  onExport,
  onReviewPending,
  onCheckAtRisk,
}: JobsQuickActionsProps) {
  const className =
    "group flex w-full items-center gap-2.5 rounded-xl border border-border-subtle bg-surface px-3 py-2.5 text-left transition-colors hover:border-primary/25 hover:bg-primary-light/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 xl:gap-2 xl:px-2.5 xl:py-2";

  const content = (label: string, Icon: LucideIcon) => (
    <>
      <span className="inline-flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary-light text-primary xl:size-7">
        <Icon className="size-4 xl:size-3.5" aria-hidden="true" />
      </span>
      <span className="min-w-0 flex-1 text-[12px] font-semibold text-foreground xl:text-[11px]">
        {label}
      </span>
      <ArrowRight
        className="size-3.5 shrink-0 text-muted group-hover:text-primary xl:size-3"
        aria-hidden="true"
      />
    </>
  );

  return (
    <OperationsCard title="Quick Actions" className="jobs-analytics-card min-w-0">
      <ul className="grid gap-2">
        <li>
          <button type="button" onClick={onReviewPending} className={className}>
            {content("Review Pending Jobs", ClipboardCheck)}
          </button>
        </li>
        <li>
          <button type="button" onClick={onCheckAtRisk} className={className}>
            {content("Check Jobs at Risk", AlertTriangle)}
          </button>
        </li>
        <li>
          <Link to={OPERATIONS_ROUTES.JOBS_POST} className={className}>
            {content("Post a Job", Briefcase)}
          </Link>
        </li>
        <li>
          <button type="button" onClick={onExport} className={className}>
            {content("Download Jobs Report", Download)}
          </button>
        </li>
      </ul>
    </OperationsCard>
  );
}
