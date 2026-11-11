import {
  ArrowRight,
  Clock,
  Download,
  Sparkles,
  UserCheck,
  UserX,
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

interface PlacementsQuickActionsProps {
  onExport: () => void;
  isExporting?: boolean;
}

const cardLayout =
  "flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-left max-sm:gap-2 max-sm:px-2.5 max-sm:py-2";

function ActionContent({
  label,
  icon: Icon,
  tone,
  hint,
}: {
  label: string;
  icon: LucideIcon;
  tone: QuickActionTone;
  hint?: string;
}) {
  return (
    <>
      <span
        className={quickActionIconClass(
          tone,
          "inline-flex size-8 shrink-0 items-center justify-center rounded-lg max-sm:size-7",
        )}
      >
        <Icon
          className="size-4 max-sm:size-3.5"
          strokeWidth={2}
          aria-hidden="true"
        />
      </span>
      <span className="min-w-0 flex-1">
        <span
          className={quickActionLabelClass(
            tone,
            "block text-[12px] font-semibold leading-snug max-sm:text-[11px]",
          )}
        >
          {label}
        </span>
        {hint ? (
          <span className="mt-0.5 block text-[10px] leading-snug text-muted">
            {hint}
          </span>
        ) : null}
      </span>
      <ArrowRight
        className={quickActionArrowClass(tone, "size-3.5 shrink-0")}
        strokeWidth={2}
        aria-hidden="true"
      />
    </>
  );
}

export function PlacementsQuickActions({
  onExport,
  isExporting = false,
}: PlacementsQuickActionsProps) {
  return (
    <OperationsCard
      dataTour="ops-placements-quick-actions"
      title="Quick Actions"
      className="min-w-0"
    >
      <ul className="grid grid-cols-1 gap-2">
        <li>
          <Link
            to={OPERATIONS_ROUTES.CANDIDATES}
            className={quickActionCardClass("success", cardLayout)}
          >
            <ActionContent label="Review Offers" icon={UserCheck} tone="success" />
          </Link>
        </li>
        <li>
          <Link
            to={`${OPERATIONS_ROUTES.PLACEMENTS_LIST}?status=joining_pending`}
            className={quickActionCardClass("warning", cardLayout)}
          >
            <ActionContent label="Joining Pending" icon={Clock} tone="warning" />
          </Link>
        </li>
        <li>
          <Link
            to={`${OPERATIONS_ROUTES.PLACEMENTS_LIST}?status=did_not_join`}
            className={quickActionCardClass("danger", cardLayout)}
          >
            <ActionContent label="No-Shows / Did Not Join" icon={UserX} tone="danger" />
          </Link>
        </li>
        <OperationsCanKey permissionKey="placements.list.export">
          <li>
            <button
              type="button"
              onClick={onExport}
              disabled={isExporting}
              className={quickActionCardClass("primary", cardLayout, isExporting)}
            >
              <ActionContent
                label={isExporting ? "Exporting…" : "Export Placements Report"}
                icon={Download}
                tone="primary"
              />
            </button>
          </li>
        </OperationsCanKey>
        <li>
          <button
            type="button"
            disabled
            aria-disabled="true"
            title="Success Stories workflow is not available yet"
            className={quickActionCardClass("accent", cardLayout, true)}
          >
            <ActionContent
              label="Success Stories"
              icon={Sparkles}
              tone="accent"
              hint="Coming soon"
            />
          </button>
        </li>
      </ul>
    </OperationsCard>
  );
}
