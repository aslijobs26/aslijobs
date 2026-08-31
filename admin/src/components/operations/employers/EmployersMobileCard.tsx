import { Building2, Mail, MapPin, Phone } from "lucide-react";
import { Link } from "react-router-dom";
import { operationsEmployerDetailPath } from "../../../constants/operations-routes";
import type { OperationsEmployerListItem } from "../../../types/operations-employers";
import { resolveMediaUrl } from "../../../utils/resolve-media-url";
import { OperationsBadge } from "../../ui/OperationsBadge";
import {
  employerAvatarInitials,
  employerStatusBadgeVariant,
  verificationStatusBadgeVariant,
} from "./employers-format";
import { EmployersRowActions } from "./EmployersRowActions";

interface EmployersMobileCardProps {
  employer: OperationsEmployerListItem;
  onVerify?: (employer: OperationsEmployerListItem) => void;
  onReject?: (employer: OperationsEmployerListItem) => void;
  onToggleStatus?: (employer: OperationsEmployerListItem) => void;
}

export function EmployersMobileCard({
  employer,
  onVerify,
  onReject,
  onToggleStatus,
}: EmployersMobileCardProps) {
  const logoUrl = resolveMediaUrl(employer.logoUrl);

  return (
    <li className="min-w-0 rounded-xl border border-border-subtle bg-surface p-3 shadow-sm ops-brand-border-glow">
      <div className="flex items-start justify-between gap-2 border-b border-border-subtle pb-2.5">
        <Link
          to={operationsEmployerDetailPath(employer.id)}
          className="flex min-w-0 items-center gap-2.5"
        >
          <span className="inline-flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-primary-light text-xs font-semibold text-primary">
            {logoUrl ? (
              <img src={logoUrl} alt="" className="size-full object-cover" />
            ) : (
              employerAvatarInitials(employer.displayName)
            )}
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-xs font-semibold text-foreground">
              {employer.displayName}
            </p>
            <p className="mt-0.5 font-mono text-[11px] text-muted">
              {employer.displayId}
            </p>
          </div>
        </Link>

        <div className="flex shrink-0 items-center gap-1">
          <OperationsBadge
            variant={employerStatusBadgeVariant(employer.status)}
          >
            {employer.statusLabel}
          </OperationsBadge>
        </div>
      </div>

      <div className="mt-2.5 space-y-1.5 text-xs">
        {employer.phone ? (
          <p className="flex items-center gap-1.5 text-muted">
            <Phone className="size-3.5 shrink-0" aria-hidden="true" />
            <span className="break-all">{employer.phone}</span>
          </p>
        ) : null}

        {employer.email ? (
          <p className="flex items-center gap-1.5 text-muted">
            <Mail className="size-3.5 shrink-0" aria-hidden="true" />
            <span className="truncate break-all">{employer.email}</span>
          </p>
        ) : null}

        <p className="flex items-center gap-1.5 text-muted">
          <Building2 className="size-3.5 shrink-0" aria-hidden="true" />
          <span className="truncate">{employer.organizationType}</span>
        </p>

        <p className="flex items-center gap-1.5 text-muted">
          <MapPin className="size-3.5 shrink-0" aria-hidden="true" />
          <span className="truncate">{employer.location}</span>
        </p>
      </div>

      <div className="mt-3 flex items-center justify-between border-t border-border-subtle pt-2.5 text-xs">
        <div className="space-y-0.5">
          <span className="block text-[10px] uppercase text-muted">Verification</span>
          <OperationsBadge
            variant={verificationStatusBadgeVariant(employer.verificationStatus)}
          >
            {employer.verificationStatusLabel}
          </OperationsBadge>
        </div>

        <div className="text-right">
          <span className="block text-[10px] uppercase text-muted">Active Jobs</span>
          <span className="font-bold tabular-nums text-foreground">
            {employer.activeJobsCount}
          </span>
        </div>
      </div>

      <div className="mt-3 flex items-center justify-between border-t border-border-subtle pt-2 text-[11px] text-muted">
        <span className="truncate">Registered {employer.registeredAtDate}</span>
        <EmployersRowActions
          employer={employer}
          onVerify={onVerify}
          onReject={onReject}
          onToggleStatus={onToggleStatus}
        />
      </div>
    </li>
  );
}
