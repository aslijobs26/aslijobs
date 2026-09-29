import { ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";
import { OPERATIONS_ROUTES } from "../../../constants/operations-routes";
import type { OperationsVerificationDetail } from "../../../types/operations-verifications";
import { resolveMediaUrl } from "../../../utils/resolve-media-url";
import { OperationsBadge } from "../../ui/OperationsBadge";
import {
  employerAvatarInitials,
  formatEmployerDateTimeFull,
  formatEmployerDisplayId,
} from "../employers/employers-format";
import { verificationOperationalStatusBadgeVariant } from "./verifications-format";

interface VerificationReviewHeaderProps {
  verification: OperationsVerificationDetail;
}

function MetaItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0 max-sm:rounded-md max-sm:bg-hero-bg/60 max-sm:px-2 max-sm:py-1.5">
      <dt className="text-[9px] font-medium uppercase tracking-wide text-muted sm:text-[10px]">
        {label}
      </dt>
      <dd className="mt-0.5 break-words text-[11px] font-semibold leading-snug text-foreground sm:text-xs">
        {value}
      </dd>
    </div>
  );
}

function accountTypeLabel(verification: OperationsVerificationDetail): string {
  if (verification.accountType) {
    return (
      verification.accountType.charAt(0).toUpperCase() +
      verification.accountType.slice(1).toLowerCase()
    );
  }
  return verification.organizationType || "—";
}

export function VerificationReviewHeader({
  verification,
}: VerificationReviewHeaderProps) {
  const logoUrl = resolveMediaUrl(verification.logoUrl);
  const submittedOn = formatEmployerDateTimeFull(verification.submittedAt);
  const displayId =
    verification.displayId || formatEmployerDisplayId(verification.id);

  return (
    <div className="rounded-xl border border-border-subtle bg-surface p-2.5 shadow-sm ops-brand-border-glow max-sm:rounded-lg sm:p-3.5 lg:p-4">
      <div className="flex min-w-0 items-start gap-2 sm:gap-3">
        <Link
          to={OPERATIONS_ROUTES.VERIFICATIONS}
          aria-label="Back to Verifications"
          className="inline-flex size-7 shrink-0 items-center justify-center rounded-lg border border-border-subtle text-muted transition-colors hover:bg-hero-bg/60 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 sm:size-8"
        >
          <ArrowLeft className="size-3.5 sm:size-4" aria-hidden="true" />
        </Link>

        <span className="inline-flex size-9 shrink-0 items-center justify-center overflow-hidden rounded-md bg-primary-light text-[11px] font-bold text-primary sm:size-10 sm:rounded-lg sm:text-xs lg:size-12">
          {logoUrl ? (
            <img src={logoUrl} alt="" className="size-full object-cover" />
          ) : (
            employerAvatarInitials(verification.displayName)
          )}
        </span>

        <div className="min-w-0 flex-1">
          <h1 className="break-words text-[13px] font-bold leading-snug text-foreground sm:text-sm lg:text-base">
            {verification.displayName}
          </h1>
          <div className="mt-1 flex min-w-0 flex-wrap items-center gap-1.5">
            <span className="break-all font-mono text-[10px] font-semibold text-muted sm:text-[11px]">
              {displayId}
            </span>
            <OperationsBadge
              variant={verificationOperationalStatusBadgeVariant(
                verification.operationalStatus,
              )}
              className="shrink-0 px-1.5 py-0 text-[9px] sm:text-[10px]"
            >
              {verification.statusLabel}
            </OperationsBadge>
          </div>
        </div>
      </div>

      <dl className="mt-2.5 grid grid-cols-2 gap-2 text-xs sm:mt-3 sm:grid-cols-3 sm:gap-x-4 sm:gap-y-2 xl:grid-cols-5">
        <MetaItem label="Account Type" value={accountTypeLabel(verification)} />
        <MetaItem label="Submitted On" value={submittedOn} />
        {verification.location && verification.location !== "—" ? (
          <MetaItem label="Location" value={verification.location} />
        ) : null}
        {verification.assignedToLabel?.trim() ? (
          <MetaItem
            label="Assigned To"
            value={verification.assignedToLabel}
          />
        ) : null}
        {verification.slaLabel ? (
          <MetaItem label="SLA" value={verification.slaLabel} />
        ) : null}
        {verification.verificationStatus === "verified" &&
        verification.verifiedAt ? (
          <MetaItem
            label="Verified At"
            value={formatEmployerDateTimeFull(verification.verifiedAt)}
          />
        ) : null}
        {verification.verificationStatus === "rejected" &&
        verification.rejectedAt ? (
          <MetaItem
            label="Rejected At"
            value={formatEmployerDateTimeFull(verification.rejectedAt)}
          />
        ) : null}
      </dl>

      {verification.verificationStatus === "rejected" &&
      verification.verificationRemarks?.trim() ? (
        <div className="mt-3 rounded-lg border border-danger/20 bg-danger/5 px-3 py-2">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-danger">
            Previous rejection reason
          </p>
          <p className="mt-1 whitespace-pre-wrap text-xs text-foreground">
            {verification.verificationRemarks}
          </p>
        </div>
      ) : null}
    </div>
  );
}
