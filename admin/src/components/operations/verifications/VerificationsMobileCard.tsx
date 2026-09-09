import { Building2, MapPin } from "lucide-react";
import { Link } from "react-router-dom";
import { operationsVerificationReviewPath } from "../../../constants/operations-routes";
import type { OperationsVerificationListItem } from "../../../types/operations-verifications";
import { resolveMediaUrl } from "../../../utils/resolve-media-url";
import { OperationsBadge } from "../../ui/OperationsBadge";
import {
  employerAvatarInitials,
  formatEmployerDateTime,
} from "../employers/employers-format";
import { verificationOperationalStatusBadgeVariant } from "./verifications-format";

interface VerificationsMobileCardProps {
  item: OperationsVerificationListItem;
}

function submittedLabel(item: OperationsVerificationListItem): {
  date: string;
  time: string;
} {
  if (item.submittedAt) {
    return formatEmployerDateTime(item.submittedAt);
  }
  return {
    date: item.submittedAtDate || "—",
    time: "",
  };
}

export function VerificationsMobileCard({
  item,
}: VerificationsMobileCardProps) {
  const logoUrl = resolveMediaUrl(item.logoUrl);
  const submitted = submittedLabel(item);
  const reviewPath = operationsVerificationReviewPath(item.id);
  const companyName =
    item.companyName?.trim() || item.displayName?.trim() || "—";
  const actionLabel = item.allowedActions.canReview ? "Review" : "View";

  return (
    <li className="min-w-0 rounded-xl border border-border-subtle bg-surface p-3 shadow-sm ops-brand-border-glow">
      <div className="flex items-start justify-between gap-2 border-b border-border-subtle pb-2.5">
        <Link to={reviewPath} className="flex min-w-0 items-center gap-2.5">
          <span className="inline-flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-primary-light text-xs font-semibold text-primary">
            {logoUrl ? (
              <img src={logoUrl} alt="" className="size-full object-cover" />
            ) : (
              employerAvatarInitials(companyName)
            )}
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-xs font-semibold text-foreground">
              {companyName}
            </p>
            <p className="mt-0.5 truncate text-[11px] text-muted">
              {item.industry?.trim() || "—"}
            </p>
          </div>
        </Link>

        <OperationsBadge
          variant={verificationOperationalStatusBadgeVariant(
            item.operationalStatus,
          )}
        >
          {item.statusLabel}
        </OperationsBadge>
      </div>

      <div className="mt-2.5 space-y-1.5 text-xs">
        <p className="flex items-center gap-1.5 text-muted">
          <Building2 className="size-3.5 shrink-0" aria-hidden="true" />
          <span className="truncate tabular-nums">
            {item.documentsLabel || "—"}
          </span>
        </p>
        <p className="flex items-center gap-1.5 text-muted">
          <MapPin className="size-3.5 shrink-0" aria-hidden="true" />
          <span className="truncate">
            {item.location?.trim() && item.location.trim() !== "—"
              ? item.location
              : "Not specified"}
          </span>
        </p>
        {item.assignedToLabel?.trim() ? (
          <p className="truncate text-[11px] text-muted">
            Assigned:{" "}
            <span className="font-medium text-foreground">
              {item.assignedToLabel}
            </span>
          </p>
        ) : null}
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
          <span className="block text-[10px] uppercase text-muted">SLA</span>
          <span className="font-bold tabular-nums text-foreground">
            {item.slaLabel || "—"}
          </span>
        </div>
      </div>

      <div className="mt-3 border-t border-border-subtle pt-2">
        <Link
          to={reviewPath}
          className="inline-flex h-8 w-full items-center justify-center rounded-lg bg-primary-light px-3 text-xs font-semibold text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
        >
          {actionLabel}
        </Link>
      </div>
    </li>
  );
}
