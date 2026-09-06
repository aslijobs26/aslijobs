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

interface QuickActionItem {
  id: string;
  label: string;
  icon: LucideIcon;
  href?: string;
  onClick?: () => void;
}

interface EmployersQuickActionsProps {
  onExport: () => void;
  isExporting?: boolean;
}

export function EmployersQuickActions({
  onExport,
  isExporting = false,
}: EmployersQuickActionsProps) {
  const actions: QuickActionItem[] = [
    {
      id: "verifications",
      label: "Review Verifications",
      icon: ShieldCheck,
      href: OPERATIONS_ROUTES.VERIFICATIONS,
    },
    {
      id: "pending",
      label: "Pending Employers",
      icon: Building2,
      href: `${OPERATIONS_ROUTES.EMPLOYERS}?verificationStatus=pending`,
    },
    {
      id: "post-job",
      label: "Post a Job",
      icon: Briefcase,
      href: OPERATIONS_ROUTES.JOBS_POST,
    },
    {
      id: "inbox",
      label: "WhatsApp Inbox",
      icon: MessageSquare,
      href: OPERATIONS_ROUTES.WHATSAPP_INBOX,
    },
    {
      id: "team",
      label: "Team Management",
      icon: Users,
      href: OPERATIONS_ROUTES.TEAM_MANAGEMENT,
    },
    {
      id: "export",
      label: isExporting ? "Exporting…" : "Export Employers",
      icon: Download,
      onClick: onExport,
    },
  ];

  return (
    <OperationsCard title="Quick Actions" className="min-w-0">
      <ul className="grid grid-cols-1 gap-2">
        {actions.map((action) => {
          const Icon = action.icon;
          const content = (
            <>
              <span className="inline-flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary-light text-primary">
                <Icon className="size-4" strokeWidth={2} aria-hidden="true" />
              </span>
              <span className="min-w-0 flex-1 text-[12px] font-semibold leading-snug text-foreground">
                {action.label}
              </span>
              <ArrowRight
                className="size-3.5 shrink-0 text-muted transition-transform group-hover:translate-x-0.5 group-hover:text-primary"
                strokeWidth={2}
                aria-hidden="true"
              />
            </>
          );

          const className =
            "group flex items-center gap-2.5 rounded-xl border border-border-subtle bg-surface px-3 py-2.5 transition-colors hover:border-primary/25 hover:bg-primary-light/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 disabled:opacity-60";

          return (
            <li key={action.id}>
              {action.href ? (
                <Link to={action.href} className={className}>
                  {content}
                </Link>
              ) : (
                <button
                  type="button"
                  onClick={action.onClick}
                  disabled={isExporting && action.id === "export"}
                  className={`w-full text-left ${className}`}
                >
                  {content}
                </button>
              )}
            </li>
          );
        })}
      </ul>
    </OperationsCard>
  );
}
