import {
  BriefcaseBusiness,
  CalendarDays,
  MapPin,
  ShieldAlert,
  ShieldCheck,
  ShieldX,
} from "lucide-react";
import { Link } from "react-router-dom";
import { operationsEmployerDetailPath } from "../../../constants/operations-routes";
import type { OperationsEmployerListItem } from "../../../types/operations-employers";
import { cn } from "../../../utils/cn";
import { resolveMediaUrl } from "../../../utils/resolve-media-url";
import { OperationsBadge } from "../../ui/OperationsBadge";
import {
  employerAvatarInitials,
  formatIndustryOrCategory,
  industryOrAccountLabel,
} from "./employers-format";
import { EmployersRowActions } from "./EmployersRowActions";

interface EmployersMobileCardProps {
  employer: OperationsEmployerListItem;
  onVerify?: (employer: OperationsEmployerListItem) => void;
  onReject?: (employer: OperationsEmployerListItem) => void;
  onToggleStatus?: (employer: OperationsEmployerListItem) => void;
}

function AccountStatusDot({
  status,
  label,
}: {
  status: OperationsEmployerListItem["status"];
  label: string;
}) {
  const dotClass =
    status === "active"
      ? "bg-success"
      : status === "suspended"
        ? "bg-danger"
        : "bg-muted";

  const textClass =
    status === "active"
      ? "text-success"
      : status === "suspended"
        ? "text-danger"
        : "text-muted";

  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center gap-1 text-[10px] font-semibold",
        textClass,
      )}
      title={`Account status: ${label}`}
    >
      <span
        className={cn("size-1.5 shrink-0 rounded-full", dotClass)}
        aria-hidden="true"
      />
      <span>{label}</span>
    </span>
  );
}

function VerificationLine({
  status,
  label,
}: {
  status: OperationsEmployerListItem["verificationStatus"];
  label: string;
}) {
  if (status === "pending") {
    return (
      <div
        className="flex items-center gap-2 rounded-lg bg-warning/10 px-2.5 py-2"
        role="status"
      >
        <ShieldAlert
          className="size-3.5 shrink-0 text-warning"
          aria-hidden="true"
        />
        <p className="min-w-0 flex-1 truncate text-[11px] font-semibold text-warning">
          Pending verification
        </p>
        <span className="shrink-0 text-[9px] font-bold uppercase tracking-wide text-warning">
          Review
        </span>
      </div>
    );
  }

  if (status === "rejected") {
    return (
      <div
        className="flex items-center gap-2 rounded-lg bg-danger/10 px-2.5 py-2"
        role="status"
      >
        <ShieldX className="size-3.5 shrink-0 text-danger" aria-hidden="true" />
        <p className="min-w-0 flex-1 truncate text-[11px] font-semibold text-danger">
          {label || "Verification rejected"}
        </p>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-1.5 text-[11px] font-medium text-success">
      <ShieldCheck className="size-3.5 shrink-0" aria-hidden="true" />
      <span>{label || "Verified"}</span>
    </div>
  );
}

/**
 * Mobile-only employer list card (rendered under `sm`).
 * Desktop table layout is unchanged.
 */
export function EmployersMobileCard({
  employer,
  onVerify,
  onReject,
  onToggleStatus,
}: EmployersMobileCardProps) {
  const logoUrl = resolveMediaUrl(employer.logoUrl);
  const profilePath = operationsEmployerDetailPath(employer.id);
  const companyName =
    employer.companyName || employer.displayName || "—";
  const rawIndustry = industryOrAccountLabel(employer);
  const industryLabel =
    formatIndustryOrCategory(rawIndustry) || rawIndustry;
  const location =
    employer.location?.trim() && employer.location.trim() !== "—"
      ? employer.location.trim()
      : "Not specified";
  const jobsPosted = employer.totalJobsCount ?? 0;

  return (
    <li className="list-none overflow-hidden rounded-2xl border border-border-subtle bg-surface shadow-[0_1px_2px_rgba(15,23,42,0.04),0_4px_12px_rgba(15,23,42,0.03)]">
      {/* Identity header */}
      <div className="border-b border-border-subtle/80 bg-hero-bg/40 px-3 py-2.5">
        <div className="flex items-start gap-2">
          <Link
            to={profilePath}
            className="group flex min-w-0 flex-1 items-center gap-2.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 focus-visible:ring-offset-2 focus-visible:ring-offset-surface"
          >
            <span className="inline-flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-primary-light text-[11px] font-semibold text-primary ring-1 ring-border-subtle/60">
              {logoUrl ? (
                <img src={logoUrl} alt="" className="size-full object-cover" />
              ) : (
                employerAvatarInitials(companyName)
              )}
            </span>

            <span className="min-w-0 flex-1">
              <span className="flex min-w-0 flex-wrap items-center gap-1.5">
                <span className="truncate text-[13px] font-semibold tracking-tight text-foreground group-hover:text-primary">
                  {companyName}
                </span>
                {employer.isNewRegistration ? (
                  <OperationsBadge
                    variant="high"
                    className="px-1.5 py-0 text-[9px] font-bold uppercase tracking-wider"
                  >
                    <span aria-label="New registration">New</span>
                  </OperationsBadge>
                ) : null}
              </span>
              <span className="mt-0.5 block truncate font-mono text-[10px] font-medium tracking-wide text-muted">
                {employer.displayId}
              </span>
            </span>
          </Link>

          <div className="flex shrink-0 items-start gap-1.5 pt-0.5">
            <AccountStatusDot
              status={employer.status}
              label={employer.statusLabel}
            />
            <EmployersRowActions
              employer={employer}
              onVerify={onVerify}
              onReject={onReject}
              onToggleStatus={onToggleStatus}
            />
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="space-y-2.5 px-3 py-2.5">
        <div className="min-w-0">
          <p className="truncate text-[12px] font-semibold text-foreground">
            {industryLabel}
          </p>
          <p className="mt-1 inline-flex max-w-full items-center gap-1 text-[11px] text-muted">
            <MapPin className="size-3 shrink-0" aria-hidden="true" />
            <span className="truncate">{location}</span>
          </p>
        </div>

        <VerificationLine
          status={employer.verificationStatus}
          label={employer.verificationStatusLabel}
        />

        <div className="flex items-center justify-between gap-2 border-t border-border-subtle/70 pt-2 text-[10px] text-muted">
          <span className="inline-flex min-w-0 items-center gap-1 truncate">
            <CalendarDays className="size-3 shrink-0" aria-hidden="true" />
            <span className="truncate">
              {employer.registeredAtDate}
              {employer.registeredAtTime ? (
                <span className="text-muted/80"> · {employer.registeredAtTime}</span>
              ) : null}
            </span>
          </span>
          <span className="inline-flex shrink-0 items-center gap-1 font-semibold tabular-nums text-foreground">
            <BriefcaseBusiness
              className="size-3 text-primary"
              aria-hidden="true"
            />
            {jobsPosted.toLocaleString("en-IN")}{" "}
            {jobsPosted === 1 ? "job" : "jobs"}
          </span>
        </div>
      </div>
    </li>
  );
}
