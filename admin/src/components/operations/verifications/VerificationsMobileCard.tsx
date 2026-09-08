import { Building2, MapPin } from "lucide-react";
import { Link } from "react-router-dom";
import { operationsVerificationReviewPath } from "../../../constants/operations-routes";
import type { OperationsEmployerListItem } from "../../../types/operations-employers";
import { resolveMediaUrl } from "../../../utils/resolve-media-url";
import { OperationsBadge } from "../../ui/OperationsBadge";
import {
  employerAvatarInitials,
  formatEmployerDateTime,
  formatEmployerDisplayId,
  verificationStatusBadgeVariant,
} from "../employers/employers-format";

interface VerificationsMobileCardProps {
  employer: OperationsEmployerListItem;
}

function submittedLabel(employer: OperationsEmployerListItem): {
  date: string;
  time: string;
} {
  if (employer.verificationSubmittedAt) {
    return formatEmployerDateTime(employer.verificationSubmittedAt);
  }
  return {
    date: employer.registeredAtDate || "—",
    time: employer.registeredAtTime || "",
  };
}

function accountTypeLabel(employer: OperationsEmployerListItem): string {
  const type = employer.accountType?.trim();
  if (!type) return employer.organizationType || "—";
  return type.charAt(0).toUpperCase() + type.slice(1).toLowerCase();
}

export function VerificationsMobileCard({
  employer,
}: VerificationsMobileCardProps) {
  const logoUrl = resolveMediaUrl(employer.logoUrl);
  const submitted = submittedLabel(employer);
  const documentsCount =
    typeof employer.documentsCount === "number"
      ? employer.documentsCount
      : null;
  const reviewPath = operationsVerificationReviewPath(employer.id);

  return (
    <li className="min-w-0 rounded-xl border border-border-subtle bg-surface p-3 shadow-sm ops-brand-border-glow">
      <div className="flex items-start justify-between gap-2 border-b border-border-subtle pb-2.5">
        <Link to={reviewPath} className="flex min-w-0 items-center gap-2.5">
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
              {formatEmployerDisplayId(employer.id)}
            </p>
          </div>
        </Link>

        <OperationsBadge
          variant={verificationStatusBadgeVariant(employer.verificationStatus)}
        >
          {employer.verificationStatusLabel}
        </OperationsBadge>
      </div>

      <div className="mt-2.5 space-y-1.5 text-xs">
        <p className="flex items-center gap-1.5 text-muted">
          <Building2 className="size-3.5 shrink-0" aria-hidden="true" />
          <span className="truncate">{accountTypeLabel(employer)}</span>
        </p>
        <p className="flex items-center gap-1.5 text-muted">
          <MapPin className="size-3.5 shrink-0" aria-hidden="true" />
          <span className="truncate">
            {employer.location?.trim() && employer.location.trim() !== "—"
              ? employer.location
              : "Not specified"}
          </span>
        </p>
      </div>

      <div className="mt-3 flex items-center justify-between border-t border-border-subtle pt-2.5 text-xs">
        <div className="space-y-0.5">
          <span className="block text-[10px] uppercase text-muted">
            Submitted
          </span>
          <span className="font-medium text-foreground">{submitted.date}</span>
          {submitted.time ? (
            <span className="block text-[11px] text-muted">{submitted.time}</span>
          ) : null}
        </div>
        <div className="text-right">
          <span className="block text-[10px] uppercase text-muted">
            Documents
          </span>
          <span className="font-bold tabular-nums text-foreground">
            {documentsCount == null ? "—" : documentsCount}
          </span>
        </div>
      </div>

      <div className="mt-3 border-t border-border-subtle pt-2">
        <Link
          to={reviewPath}
          className="inline-flex h-8 w-full items-center justify-center rounded-lg bg-primary-light px-3 text-xs font-semibold text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
        >
          Review
        </Link>
      </div>
    </li>
  );
}
