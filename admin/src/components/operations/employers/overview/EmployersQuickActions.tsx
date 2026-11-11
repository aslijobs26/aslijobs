import {
  ArrowRight,
  Briefcase,
  Building2,
  Download,
  MessageSquare,
  ShieldCheck,
  Users,
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

interface EmployersQuickActionsProps {
  onExport: () => void;
  isExporting?: boolean;
}

const cardLayout =
  "flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-left max-sm:gap-2 max-sm:px-2.5 max-sm:py-2";

function ActionContent({
  label,
  icon: Icon,
  tone,
}: {
  label: string;
  icon: LucideIcon;
  tone: QuickActionTone;
}) {
  return (
    <>
      <span
        className={quickActionIconClass(
          tone,
          "inline-flex size-8 shrink-0 items-center justify-center rounded-lg max-sm:size-7",
        )}
      >
        <Icon className="size-4 max-sm:size-3.5" strokeWidth={2} aria-hidden="true" />
      </span>
      <span
        className={quickActionLabelClass(
          tone,
          "min-w-0 flex-1 text-[12px] font-semibold leading-snug max-sm:text-[11px]",
        )}
      >
        {label}
      </span>
      <ArrowRight
        className={quickActionArrowClass(tone, "size-3.5 shrink-0")}
        strokeWidth={2}
        aria-hidden="true"
      />
    </>
  );
}

export function EmployersQuickActions({
  onExport,
  isExporting = false,
}: EmployersQuickActionsProps) {
  return (
    <OperationsCard
      dataTour="ops-employers-quick-actions"
      title="Quick Actions"
      className="min-w-0"
    >
      <ul className="grid grid-cols-1 gap-2">
        <li>
          <Link
            to={OPERATIONS_ROUTES.VERIFICATIONS}
            className={quickActionCardClass("success", cardLayout)}
          >
            <ActionContent label="Review Verifications" icon={ShieldCheck} tone="success" />
          </Link>
        </li>
        <li>
          <Link
            to={`${OPERATIONS_ROUTES.EMPLOYERS}?verificationStatus=pending`}
            className={quickActionCardClass("warning", cardLayout)}
          >
            <ActionContent label="Pending Employers" icon={Building2} tone="warning" />
          </Link>
        </li>
        <OperationsCanKey permissionKey="jobs.post.create">
          <li>
            <Link
              to={OPERATIONS_ROUTES.JOBS_POST}
              className={quickActionCardClass("primary", cardLayout)}
            >
              <ActionContent label="Post a Job" icon={Briefcase} tone="primary" />
            </Link>
          </li>
        </OperationsCanKey>
        <li>
          <Link
            to={OPERATIONS_ROUTES.WHATSAPP_INBOX}
            className={quickActionCardClass("success", cardLayout)}
          >
            <ActionContent label="WhatsApp Inbox" icon={MessageSquare} tone="success" />
          </Link>
        </li>
        <li>
          <Link
            to={OPERATIONS_ROUTES.TEAM_MANAGEMENT}
            className={quickActionCardClass("accent", cardLayout)}
          >
            <ActionContent label="Team Management" icon={Users} tone="accent" />
          </Link>
        </li>
        <OperationsCanKey permissionKey="employers.list.export">
          <li>
            <button
              type="button"
              onClick={onExport}
              disabled={isExporting}
              className={quickActionCardClass("primary", cardLayout, isExporting)}
            >
              <ActionContent
                label={isExporting ? "Exporting…" : "Export Employers"}
                icon={Download}
                tone="primary"
              />
            </button>
          </li>
        </OperationsCanKey>
      </ul>
    </OperationsCard>
  );
}
