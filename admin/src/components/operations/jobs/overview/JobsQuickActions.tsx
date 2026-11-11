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
import {
  quickActionArrowClass,
  quickActionCardClass,
  quickActionIconClass,
  quickActionLabelClass,
  type QuickActionTone,
} from "../../../ui/quick-action-tone";
import { OperationsCanKey } from "../../auth/OperationsCanKey";

interface JobsQuickActionsProps {
  onExport: () => void;
  onReviewPending: () => void;
  onCheckAtRisk: () => void;
}

const cardLayout =
  "flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-left max-sm:gap-2 max-sm:px-2.5 max-sm:py-2 xl:gap-2 xl:px-2.5 xl:py-2";

export function JobsQuickActions({
  onExport,
  onReviewPending,
  onCheckAtRisk,
}: JobsQuickActionsProps) {
  const content = (label: string, Icon: LucideIcon, tone: QuickActionTone) => (
    <>
      <span
        className={quickActionIconClass(
          tone,
          "inline-flex size-8 shrink-0 items-center justify-center rounded-lg max-sm:size-7 xl:size-7",
        )}
      >
        <Icon className="size-4 max-sm:size-3.5 xl:size-3.5" aria-hidden="true" />
      </span>
      <span
        className={quickActionLabelClass(
          tone,
          "min-w-0 flex-1 text-[12px] font-semibold max-sm:text-[11px] xl:text-[11px]",
        )}
      >
        {label}
      </span>
      <ArrowRight
        className={quickActionArrowClass(tone, "size-3.5 shrink-0 xl:size-3")}
        aria-hidden="true"
      />
    </>
  );

  return (
    <OperationsCard
      dataTour="ops-jobs-quick-actions"
      title="Quick Actions"
      className="jobs-analytics-card min-w-0"
    >
      <ul className="grid gap-2">
        <li>
          <button
            type="button"
            onClick={onReviewPending}
            className={quickActionCardClass("warning", cardLayout)}
          >
            {content("Review Pending Jobs", ClipboardCheck, "warning")}
          </button>
        </li>
        <li>
          <button
            type="button"
            onClick={onCheckAtRisk}
            className={quickActionCardClass("danger", cardLayout)}
          >
            {content("Check Jobs at Risk", AlertTriangle, "danger")}
          </button>
        </li>
        <OperationsCanKey permissionKey="jobs.post.create">
          <li>
            <Link
              to={OPERATIONS_ROUTES.JOBS_POST}
              className={quickActionCardClass("primary", cardLayout)}
            >
              {content("Post a Job", Briefcase, "primary")}
            </Link>
          </li>
        </OperationsCanKey>
        <OperationsCanKey permissionKey="jobs.list.export">
          <li>
            <button
              type="button"
              onClick={onExport}
              className={quickActionCardClass("accent", cardLayout)}
            >
              {content("Download Jobs Report", Download, "accent")}
            </button>
          </li>
        </OperationsCanKey>
      </ul>
    </OperationsCard>
  );
}
