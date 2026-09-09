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

const actionBtnBase =
  "inline-flex h-8 w-full items-center justify-center gap-1.5 rounded-lg px-2.5 text-[11px] font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 sm:h-9 sm:w-auto sm:px-3 sm:text-xs lg:h-9";

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
    <div className="rounded-xl border border-border-subtle bg-surface p-2.5 shadow-sm ops-brand-border-glow max-sm:rounded-lg max-sm:p-2 sm:p-4 lg:p-5">
      <div className="flex flex-col gap-3 max-sm:gap-2.5 sm:gap-3.5 lg:flex-row lg:items-start lg:justify-between lg:gap-4">
        <div className="flex min-w-0 items-start gap-2 max-sm:gap-2 sm:gap-3 lg:gap-3.5">
          <Link
            to={OPERATIONS_ROUTES.EMPLOYERS}
            aria-label="Back to Employers"
            className="inline-flex size-7 shrink-0 items-center justify-center rounded-lg border border-border-subtle text-muted transition-colors hover:bg-hero-bg/60 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 sm:size-8 lg:size-9"
          >
            <ArrowLeft className="size-3.5 sm:size-4" aria-hidden="true" />
          </Link>

          <span className="inline-flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-primary-light text-[11px] font-bold text-primary max-sm:size-9 max-sm:rounded-md sm:size-12 sm:rounded-xl sm:text-sm lg:size-16 lg:text-base">
            {logoUrl ? (
              <img src={logoUrl} alt="" className="size-full object-cover" />
            ) : (
              employerAvatarInitials(employer.displayName)
            )}
          </span>

          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-1 max-sm:gap-1 sm:gap-1.5 lg:gap-2">
              <h1 className="break-words text-[13px] font-bold leading-snug text-foreground sm:text-base lg:text-xl">
                {employer.displayName}
              </h1>
              <span className="font-mono text-[10px] font-semibold text-muted sm:text-[11px] lg:text-xs">
                {employer.displayId}
              </span>
              <OperationsBadge
                variant={verificationStatusBadgeVariant(
                  employer.verificationStatus,
                )}
                className="px-1.5 py-0 text-[9px] sm:text-[10px]"
              >
                {employer.verificationStatusLabel}
              </OperationsBadge>
              <OperationsBadge
                variant={employerStatusBadgeVariant(employer.status)}
                className="px-1.5 py-0 text-[9px] sm:text-[10px]"
              >
                {employer.statusLabel}
              </OperationsBadge>
            </div>

            <div className="mt-1.5 flex flex-col gap-1 text-[11px] text-muted max-sm:mt-1 sm:mt-2 sm:flex-row sm:flex-wrap sm:items-center sm:gap-x-3 sm:gap-y-1 sm:text-xs lg:gap-x-3.5 lg:gap-y-1.5">
              {employer.phone ? (
                <span className="flex min-w-0 items-center gap-1">
                  <Phone className="size-3 shrink-0 sm:size-3.5" aria-hidden="true" />
                  <span className="break-all">{employer.phone}</span>
                </span>
              ) : null}

              {employer.email ? (
                <span className="flex min-w-0 items-center gap-1">
                  <Mail className="size-3 shrink-0 sm:size-3.5" aria-hidden="true" />
                  <span className="break-all">{employer.email}</span>
                </span>
              ) : null}

              <span className="flex min-w-0 items-center gap-1">
                <Briefcase className="size-3 shrink-0 sm:size-3.5" aria-hidden="true" />
                <span className="truncate">{employer.organizationType}</span>
              </span>

              {employer.location && employer.location !== "—" ? (
                <span className="flex min-w-0 items-center gap-1">
                  <MapPin className="size-3 shrink-0 sm:size-3.5" aria-hidden="true" />
                  <span className="truncate">{employer.location}</span>
                </span>
              ) : null}
            </div>
          </div>
        </div>

        <div className="grid w-full grid-cols-2 gap-1.5 max-sm:gap-1.5 min-[420px]:grid-cols-2 sm:flex sm:w-auto sm:flex-wrap sm:items-center sm:gap-2 lg:shrink-0">
          <OperationsCan module="jobs" action="create">
            <button
              type="button"
              onClick={() =>
                navigate(
                  `${OPERATIONS_ROUTES.JOBS_POST}?employerId=${encodeURIComponent(employer.id)}`,
                )
              }
              className={`${actionBtnBase} border border-border-subtle bg-hero-bg/60 text-foreground hover:bg-surface focus-visible:ring-primary/30`}
            >
              <Plus className="size-3 sm:size-3.5" aria-hidden="true" />
              Post Job
            </button>
          </OperationsCan>

          <OperationsCanKey permissionKey="employers.profile.actions.verify">
            {!isVerified && onVerify ? (
              <button
                type="button"
                onClick={onVerify}
                className={`${actionBtnBase} bg-success text-white shadow-sm hover:bg-success/90 focus-visible:ring-success/30`}
              >
                <ShieldCheck className="size-3 sm:size-3.5" aria-hidden="true" />
                <span className="sm:hidden">Verify</span>
                <span className="hidden sm:inline">Verify Employer</span>
              </button>
            ) : null}
          </OperationsCanKey>

          <OperationsCanKey permissionKey="employers.profile.actions.reject">
            {employer.verificationStatus !== "rejected" && onReject ? (
              <button
                type="button"
                onClick={onReject}
                className={`${actionBtnBase} border border-danger/30 bg-danger/10 text-danger hover:bg-danger/20 focus-visible:ring-danger/30`}
              >
                <ShieldAlert className="size-3 sm:size-3.5" aria-hidden="true" />
                <span className="sm:hidden">Reject</span>
                <span className="hidden sm:inline">Reject Verification</span>
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
                className={`${actionBtnBase} border ${
                  isSuspended
                    ? "border-success/30 bg-success/10 text-success hover:bg-success/20 focus-visible:ring-success/30"
                    : "border-danger/30 bg-danger/10 text-danger hover:bg-danger/20 focus-visible:ring-danger/30"
                }`}
              >
                {isSuspended ? (
                  <>
                    <CheckCircle2 className="size-3 sm:size-3.5" aria-hidden="true" />
                    <span className="sm:hidden">Activate</span>
                    <span className="hidden sm:inline">Activate Account</span>
                  </>
                ) : (
                  <>
                    <Ban className="size-3 sm:size-3.5" aria-hidden="true" />
                    <span className="sm:hidden">Suspend</span>
                    <span className="hidden sm:inline">Suspend Account</span>
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
