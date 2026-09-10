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
import { OperationsCanKey } from "../../auth/OperationsCanKey";

interface PlacementsQuickActionsProps {
  onExport: () => void;
  isExporting?: boolean;
}

const className =
  "group flex w-full items-center gap-2.5 rounded-xl border border-border-subtle bg-surface px-3 py-2.5 text-left transition-colors hover:border-primary/25 hover:bg-primary-light/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 disabled:opacity-60 max-sm:gap-2 max-sm:px-2.5 max-sm:py-2";

function ActionContent({
  label,
  icon: Icon,
  hint,
}: {
  label: string;
  icon: LucideIcon;
  hint?: string;
}) {
  return (
    <>
      <span className="inline-flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary-light text-primary max-sm:size-7">
        <Icon
          className="size-4 max-sm:size-3.5"
          strokeWidth={2}
          aria-hidden="true"
        />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-[12px] font-semibold leading-snug text-foreground max-sm:text-[11px]">
          {label}
        </span>
        {hint ? (
          <span className="mt-0.5 block text-[10px] leading-snug text-muted">
            {hint}
          </span>
        ) : null}
      </span>
      <ArrowRight
        className="size-3.5 shrink-0 text-muted transition-transform group-hover:translate-x-0.5 group-hover:text-primary"
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
    <OperationsCard title="Quick Actions" className="min-w-0">
      <ul className="grid grid-cols-1 gap-2">
        <li>
          <Link to={OPERATIONS_ROUTES.CANDIDATES} className={className}>
            <ActionContent label="Review Offers" icon={UserCheck} />
          </Link>
        </li>
        <li>
          <Link
            to={`${OPERATIONS_ROUTES.PLACEMENTS_LIST}?status=joining_pending`}
            className={className}
          >
            <ActionContent label="Joining Pending" icon={Clock} />
          </Link>
        </li>
        <li>
          <Link
            to={`${OPERATIONS_ROUTES.PLACEMENTS_LIST}?status=did_not_join`}
            className={className}
          >
            <ActionContent label="No-Shows / Did Not Join" icon={UserX} />
          </Link>
        </li>
        <OperationsCanKey permissionKey="placements.list.export">
          <li>
            <button
              type="button"
              onClick={onExport}
              disabled={isExporting}
              className={className}
            >
              <ActionContent
                label={isExporting ? "Exporting…" : "Export Placements Report"}
                icon={Download}
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
            className={`${className} cursor-not-allowed opacity-60`}
          >
            <ActionContent
              label="Success Stories"
              icon={Sparkles}
              hint="Coming soon"
            />
          </button>
        </li>
      </ul>
    </OperationsCard>
  );
}
