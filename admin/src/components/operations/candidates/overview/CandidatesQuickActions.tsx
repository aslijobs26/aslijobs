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
import {
  quickActionArrowClass,
  quickActionCardClass,
  quickActionIconClass,
  quickActionLabelClass,
  type QuickActionTone,
} from "../../../ui/quick-action-tone";
import { OperationsCanKey } from "../../auth/OperationsCanKey";

const links: Array<{
  label: string;
  icon: LucideIcon;
  href: string;
  tone: QuickActionTone;
}> = [
  {
    label: "View Incomplete Profiles",
    icon: FileWarning,
    href: `${OPERATIONS_ROUTES.CANDIDATES}?overviewTab=profileIncomplete`,
    tone: "warning",
  },
  {
    label: "View WhatsApp Pending",
    icon: ShieldCheck,
    href: `${OPERATIONS_ROUTES.CANDIDATES}?overviewTab=verificationPending`,
    tone: "success",
  },
];

const cardLayout =
  "flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-left max-sm:gap-2 max-sm:px-2.5 max-sm:py-2";

export function CandidatesQuickActions({
  onExport,
  isExporting = false,
}: {
  onExport: () => void;
  isExporting?: boolean;
}) {
  const content = (label: string, Icon: LucideIcon, tone: QuickActionTone) => (
    <>
      <span
        className={quickActionIconClass(
          tone,
          "inline-flex size-8 shrink-0 items-center justify-center rounded-lg max-sm:size-7",
        )}
      >
        <Icon className="size-4 max-sm:size-3.5" aria-hidden="true" />
      </span>
      <span
        className={quickActionLabelClass(
          tone,
          "min-w-0 flex-1 text-[12px] font-semibold max-sm:text-[11px]",
        )}
      >
        {label}
      </span>
      <ArrowRight
        className={quickActionArrowClass(tone, "size-3.5 shrink-0")}
        aria-hidden="true"
      />
    </>
  );
  return (
    <OperationsCard
      dataTour="ops-job-seekers-quick-actions"
      title="Quick Actions"
      className="min-w-0"
    >
      <ul className="grid gap-2">
        <OperationsCanKey permissionKey="candidates.list.export">
          <li>
            <button
              type="button"
              onClick={onExport}
              disabled={isExporting}
              className={quickActionCardClass("primary", cardLayout, isExporting)}
            >
              {content(
                isExporting ? "Exporting…" : "Export Jobseeker List",
                Download,
                "primary",
              )}
            </button>
          </li>
        </OperationsCanKey>
        {links.map((item) => (
          <li key={item.href}>
            <Link to={item.href} className={quickActionCardClass(item.tone, cardLayout)}>
              {content(item.label, item.icon, item.tone)}
            </Link>
          </li>
        ))}
      </ul>
    </OperationsCard>
  );
}
