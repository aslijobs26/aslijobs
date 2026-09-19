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
import { OperationsCanKey } from "../../auth/OperationsCanKey";

interface EmployersQuickActionsProps {
  onExport: () => void;
  isExporting?: boolean;
}

const className =
  "group flex w-full items-center gap-2.5 rounded-xl border border-border-subtle bg-surface px-3 py-2.5 text-left transition-colors hover:border-primary/25 hover:bg-primary-light/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 disabled:opacity-60 max-sm:gap-2 max-sm:px-2.5 max-sm:py-2";

function ActionContent({
  label,
  icon: Icon,
}: {
  label: string;
  icon: LucideIcon;
}) {
  return (
    <>
      <span className="inline-flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary-light text-primary max-sm:size-7">
        <Icon className="size-4 max-sm:size-3.5" strokeWidth={2} aria-hidden="true" />
      </span>
      <span className="min-w-0 flex-1 text-[12px] font-semibold leading-snug text-foreground max-sm:text-[11px]">
        {label}
      </span>
      <ArrowRight
        className="size-3.5 shrink-0 text-muted transition-transform group-hover:translate-x-0.5 group-hover:text-primary"
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
    <OperationsCard title="Quick Actions" className="min-w-0">
      <ul className="grid grid-cols-1 gap-2">
        <li>
          <Link to={OPERATIONS_ROUTES.VERIFICATIONS} className={className}>
            <ActionContent label="Review Verifications" icon={ShieldCheck} />
          </Link>
        </li>
        <li>
          <Link
            to={`${OPERATIONS_ROUTES.EMPLOYERS}?verificationStatus=pending`}
            className={className}
          >
            <ActionContent label="Pending Employers" icon={Building2} />
          </Link>
        </li>
        <OperationsCanKey permissionKey="jobs.post.create">
          <li>
            <Link to={OPERATIONS_ROUTES.JOBS_POST} className={className}>
              <ActionContent label="Post a Job" icon={Briefcase} />
            </Link>
          </li>
        </OperationsCanKey>
        <li>
          <Link to={OPERATIONS_ROUTES.WHATSAPP_INBOX} className={className}>
            <ActionContent label="WhatsApp Inbox" icon={MessageSquare} />
          </Link>
        </li>
        <li>
          <Link to={OPERATIONS_ROUTES.TEAM_MANAGEMENT} className={className}>
            <ActionContent label="Team Management" icon={Users} />
          </Link>
        </li>
        <OperationsCanKey permissionKey="employers.list.export">
          <li>
            <button
              type="button"
              onClick={onExport}
              disabled={isExporting}
              className={className}
            >
              <ActionContent
                label={isExporting ? "Exporting…" : "Export Employers"}
                icon={Download}
              />
            </button>
          </li>
        </OperationsCanKey>
      </ul>
    </OperationsCard>
  );
}
