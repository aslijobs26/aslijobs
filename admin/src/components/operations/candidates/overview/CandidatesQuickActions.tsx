import {
  ArrowRight,
  Download,
  FileWarning,
  ShieldCheck,
  type LucideIcon,
} from "lucide-react";
import { Link } from "react-router-dom";
import { OPERATIONS_ROUTES } from "../../../../constants/operations-routes";
import { OperationsCard } from "../../../ui/OperationsCard";
import { OperationsCanKey } from "../../auth/OperationsCanKey";

const links: Array<{ label: string; icon: LucideIcon; href: string }> = [
  {
    label: "View Incomplete Profiles",
    icon: FileWarning,
    href: `${OPERATIONS_ROUTES.CANDIDATES}?overviewTab=profileIncomplete`,
  },
  {
    label: "View WhatsApp Pending",
    icon: ShieldCheck,
    href: `${OPERATIONS_ROUTES.CANDIDATES}?overviewTab=verificationPending`,
  },
];

export function CandidatesQuickActions({
  onExport,
  isExporting = false,
}: {
  onExport: () => void;
  isExporting?: boolean;
}) {
  const className =
    "group flex w-full items-center gap-2.5 rounded-xl border border-border-subtle bg-surface px-3 py-2.5 text-left hover:border-primary/25 hover:bg-primary-light/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 disabled:cursor-not-allowed disabled:opacity-60 max-sm:gap-2 max-sm:px-2.5 max-sm:py-2";
  const content = (label: string, Icon: LucideIcon) => (
    <>
      <span className="inline-flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary-light text-primary max-sm:size-7">
        <Icon className="size-4 max-sm:size-3.5" aria-hidden="true" />
      </span>
      <span className="min-w-0 flex-1 text-[12px] font-semibold text-foreground max-sm:text-[11px]">
        {label}
      </span>
      <ArrowRight
        className="size-3.5 shrink-0 text-muted group-hover:text-primary"
        aria-hidden="true"
      />
    </>
  );
  return (
    <OperationsCard title="Quick Actions" className="min-w-0">
      <ul className="grid gap-2">
        <OperationsCanKey permissionKey="candidates.list.export">
          <li>
            <button
              type="button"
              onClick={onExport}
              disabled={isExporting}
              className={className}
            >
              {content(
                isExporting ? "Exporting…" : "Export Jobseeker List",
                Download,
              )}
            </button>
          </li>
        </OperationsCanKey>
        {links.map((item) => (
          <li key={item.href}>
            <Link to={item.href} className={className}>
              {content(item.label, item.icon)}
            </Link>
          </li>
        ))}
      </ul>
    </OperationsCard>
  );
}
