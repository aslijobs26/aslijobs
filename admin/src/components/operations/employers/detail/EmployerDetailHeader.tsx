import {
  ArrowLeft,
  Ban,
  Briefcase,
  CheckCircle2,
  Mail,
  MapPin,
  Phone,
  Plus,
  ShieldAlert,
  ShieldCheck,
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import {
  OPERATIONS_ROUTES,
} from "../../../../constants/operations-routes";
import type { OperationsEmployerDetail } from "../../../../types/operations-employers";
import { resolveMediaUrl } from "../../../../utils/resolve-media-url";
import { OperationsBadge } from "../../../ui/OperationsBadge";
import { OperationsCan } from "../../auth/OperationsCan";
import { OperationsCanKey } from "../../auth/OperationsCanKey";
import {
  employerAvatarInitials,
  employerStatusBadgeVariant,
  verificationStatusBadgeVariant,
} from "../employers-format";

interface EmployerDetailHeaderProps {
  employer: OperationsEmployerDetail;
  onVerify?: () => void;
  onReject?: () => void;
  onToggleStatus?: () => void;
}

export function EmployerDetailHeader({
  employer,
  onVerify,
  onReject,
  onToggleStatus,
}: EmployerDetailHeaderProps) {
  const navigate = useNavigate();
  const logoUrl = resolveMediaUrl(employer.logoUrl);
  const isVerified = employer.verificationStatus === "verified";
  const isSuspended = employer.status === "suspended";

  return (
    <div className="rounded-xl border border-border-subtle bg-surface p-3.5 shadow-sm ops-brand-border-glow sm:p-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex min-w-0 items-start gap-3 sm:gap-3.5">
          <Link
            to={OPERATIONS_ROUTES.EMPLOYERS}
            aria-label="Back to Employers"
            className="inline-flex size-8 shrink-0 items-center justify-center rounded-lg border border-border-subtle text-muted transition-colors hover:bg-hero-bg/60 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 sm:size-9"
          >
            <ArrowLeft className="size-4" aria-hidden="true" />
          </Link>

          <span className="inline-flex size-12 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-primary-light text-sm font-bold text-primary sm:size-14 sm:text-base lg:size-16">
            {logoUrl ? (
              <img src={logoUrl} alt="" className="size-full object-cover" />
            ) : (
              employerAvatarInitials(employer.displayName)
            )}
          </span>

          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
              <h1 className="break-words text-base font-bold text-foreground sm:text-lg lg:text-xl">
                {employer.displayName}
              </h1>
              <span className="font-mono text-[11px] font-semibold text-muted sm:text-xs">
                {employer.displayId}
              </span>
              <OperationsBadge
                variant={verificationStatusBadgeVariant(
                  employer.verificationStatus,
                )}
              >
                {employer.verificationStatusLabel}
              </OperationsBadge>
              <OperationsBadge
                variant={employerStatusBadgeVariant(employer.status)}
              >
                {employer.statusLabel}
              </OperationsBadge>
            </div>

            <div className="mt-2 flex flex-wrap items-center gap-x-3.5 gap-y-1.5 text-xs text-muted">
              {employer.phone ? (
                <span className="flex items-center gap-1">
                  <Phone className="size-3.5 shrink-0" aria-hidden="true" />
                  <span className="break-all">{employer.phone}</span>
                </span>
              ) : null}

              {employer.email ? (
                <span className="flex items-center gap-1">
                  <Mail className="size-3.5 shrink-0" aria-hidden="true" />
                  <span className="break-all">{employer.email}</span>
                </span>
              ) : null}

              <span className="flex items-center gap-1">
                <Briefcase className="size-3.5 shrink-0" aria-hidden="true" />
                <span>{employer.organizationType}</span>
              </span>

              {employer.location && employer.location !== "—" ? (
                <span className="flex items-center gap-1">
                  <MapPin className="size-3.5 shrink-0" aria-hidden="true" />
                  <span>{employer.location}</span>
                </span>
              ) : null}
            </div>
          </div>
        </div>

        {/* Operational Actions */}
        <div className="grid w-full grid-cols-1 gap-2 min-[420px]:grid-cols-2 sm:flex sm:w-auto sm:flex-wrap sm:items-center lg:shrink-0">
          <OperationsCan module="jobs" action="create">
            <button
              type="button"
              onClick={() =>
                navigate(
                  `${OPERATIONS_ROUTES.JOBS_POST}?employerId=${encodeURIComponent(employer.id)}`,
                )
              }
              className="inline-flex h-9 w-full items-center justify-center gap-1.5 rounded-lg border border-border-subtle bg-hero-bg/60 px-3 text-xs font-semibold text-foreground transition-colors hover:bg-surface focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 sm:w-auto"
            >
              <Plus className="size-3.5" aria-hidden="true" />
              Post Job
            </button>
          </OperationsCan>

          <OperationsCanKey permissionKey="employers.profile.actions.verify">
            {!isVerified && onVerify ? (
              <button
                type="button"
                onClick={onVerify}
                className="inline-flex h-9 w-full items-center justify-center gap-1.5 rounded-lg bg-success px-3.5 text-xs font-semibold text-white shadow-sm transition-colors hover:bg-success/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-success/30 sm:w-auto"
              >
                <ShieldCheck className="size-3.5" aria-hidden="true" />
                Verify Employer
              </button>
            ) : null}
          </OperationsCanKey>

          <OperationsCanKey permissionKey="employers.profile.actions.reject">
            {employer.verificationStatus !== "rejected" && onReject ? (
              <button
                type="button"
                onClick={onReject}
                className="inline-flex h-9 w-full items-center justify-center gap-1.5 rounded-lg border border-danger/30 bg-danger/10 px-3 text-xs font-semibold text-danger transition-colors hover:bg-danger/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-danger/30 sm:w-auto"
              >
                <ShieldAlert className="size-3.5" aria-hidden="true" />
                Reject Verification
              </button>
            ) : null}
          </OperationsCanKey>

          {onToggleStatus ? (
            <OperationsCanKey
              permissionKey={
                isSuspended
                  ? "employers.profile.actions.activate"
                  : "employers.profile.actions.suspend"
              }
            >
              <button
                type="button"
                onClick={onToggleStatus}
                className={`inline-flex h-9 w-full items-center justify-center gap-1.5 rounded-lg border px-3 text-xs font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 sm:w-auto ${
                  isSuspended
                    ? "border-success/30 bg-success/10 text-success hover:bg-success/20 focus-visible:ring-success/30"
                    : "border-danger/30 bg-danger/10 text-danger hover:bg-danger/20 focus-visible:ring-danger/30"
                }`}
              >
                {isSuspended ? (
                  <>
                    <CheckCircle2 className="size-3.5" aria-hidden="true" />
                    Activate Account
                  </>
                ) : (
                  <>
                    <Ban className="size-3.5" aria-hidden="true" />
                    Suspend Account
                  </>
                )}
              </button>
            </OperationsCanKey>
          ) : null}
        </div>
      </div>
    </div>
  );
}
