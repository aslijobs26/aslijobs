import {
  Briefcase,
  CalendarDays,
  Check,
  ChevronRight,
  Copy,
  Eye,
  FileText,
  MapPin,
  Phone,
  Truck,
} from "lucide-react";
import { useState, type KeyboardEvent, type MouseEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { operationsCandidateDetailPath } from "../../../constants/operations-routes";
import type { OperationsCandidateListItem } from "../../../types/operations-candidates";
import { cn } from "../../../utils/cn";
import { OperationsBadge } from "../../ui/OperationsBadge";
import { CandidatesRowActions } from "./CandidatesRowActions";
import { OperationsCandidateAvatar } from "./OperationsCandidateAvatar";
import {
  formatCandidateDateTime,
  formatCandidateDisplayId,
  profileStatusBadgeVariant,
} from "./candidates-format";

interface CandidatesMobileCardProps {
  application: OperationsCandidateListItem;
  onDelete?: (application: OperationsCandidateListItem) => void;
}

function InfoColumn({
  icon: Icon,
  iconWrapClassName,
  iconClassName,
  label,
  value,
}: {
  icon: typeof Phone;
  iconWrapClassName: string;
  iconClassName: string;
  label: string;
  value: string;
}) {
  return (
    <div className="flex min-w-0 flex-1 flex-col justify-center border-r border-border-subtle px-1.5 py-2.5 last:border-r-0">
      <div className="flex min-w-0 items-start gap-1">
        <span
          className={cn(
            "inline-flex size-5 shrink-0 items-center justify-center rounded-md",
            iconWrapClassName,
          )}
        >
          <Icon
            className={cn("size-2.5", iconClassName)}
            strokeWidth={2}
            aria-hidden="true"
          />
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-[7px] font-medium leading-tight text-muted">
            {label}
          </p>
          <p
            className="mt-0.5 line-clamp-2 text-[8px] font-semibold leading-snug text-foreground"
            title={value}
          >
            {value}
          </p>
        </div>
      </div>
    </div>
  );
}

/**
 * Mobile-only candidate list card (rendered under `sm`).
 * Desktop/tablet table and list layouts are unchanged.
 */
export function CandidatesMobileCard({
  application,
  onDelete,
}: CandidatesMobileCardProps) {
  const navigate = useNavigate();
  const [copiedId, setCopiedId] = useState(false);
  const registered = formatCandidateDateTime(application.registeredAt);
  const primaryRole = (application.preferredRoles ?? [])[0];
  const profilePath = operationsCandidateDetailPath(
    application.jobSeekerId || application.id,
  );
  const displayId =
    application.displayId ||
    formatCandidateDisplayId(application.jobSeekerId || application.id);
  const applicationCount = application.applicationCount ?? 0;
  const isProfileComplete = application.profileStatus === "complete";
  const candidateName = application.candidateName ?? "Candidate";

  const openDetail = () => {
    navigate(profilePath);
  };

  const handleCardKeyDown = (event: KeyboardEvent<HTMLElement>) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      openDetail();
    }
  };

  const stopCardNavigation = (event: MouseEvent) => {
    event.stopPropagation();
  };

  const handleCopyId = async (event: MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();
    try {
      await navigator.clipboard.writeText(displayId);
      setCopiedId(true);
      window.setTimeout(() => setCopiedId(false), 1500);
    } catch {
      setCopiedId(false);
    }
  };

  return (
    <article
      role="link"
      tabIndex={0}
      aria-label={`Open profile for ${candidateName}`}
      onClick={openDetail}
      onKeyDown={handleCardKeyDown}
      className="cursor-pointer overflow-hidden rounded-xl border border-border-subtle bg-surface shadow-sm ops-brand-border-glow transition-colors hover:border-primary/25 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
    >
      {/* Header */}
      <div className="border-b border-border-subtle px-3.5 py-3">
        <div className="flex items-start gap-2.5">
          <div className="relative shrink-0">
            <OperationsCandidateAvatar
              name={candidateName}
              jobSeekerId={application.jobSeekerId || application.id}
              photoUrl={application.profilePhotoUrl}
              className="inline-flex size-11 items-center justify-center overflow-hidden rounded-full bg-primary-light text-sm font-semibold text-primary ring-2 ring-surface"
              textClassName="text-sm font-semibold"
            />
            <span
              className={cn(
                "absolute bottom-0 right-0 size-2.5 rounded-full ring-2 ring-surface",
                isProfileComplete ? "bg-success" : "bg-muted",
              )}
              aria-hidden="true"
            />
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-1">
              <div className="min-w-0 flex-1">
                <div className="flex min-w-0 flex-wrap items-center gap-1.5">
                  <p className="truncate text-[15px] font-semibold leading-tight text-foreground">
                    {candidateName}
                  </p>
                  {application.isNewRegistration ? (
                    <OperationsBadge
                      variant="high"
                      className="px-1.5 py-0 text-[9px] font-bold uppercase tracking-wider"
                    >
                      <span aria-label="New registration">New</span>
                    </OperationsBadge>
                  ) : null}
                </div>
                <div className="mt-0.5 flex min-w-0 items-center gap-0.5">
                  <p className="truncate font-mono text-[10px] font-medium text-muted">
                    {displayId}
                  </p>
                  <button
                    type="button"
                    onClick={(event) => void handleCopyId(event)}
                    aria-label={
                      copiedId ? "Candidate ID copied" : "Copy candidate ID"
                    }
                    className="inline-flex size-6 shrink-0 items-center justify-center rounded-md text-muted transition-colors hover:bg-hero-bg hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
                  >
                    <Copy className="size-3" aria-hidden="true" />
                  </button>
                </div>
              </div>

              <div
                onClick={stopCardNavigation}
                onKeyDown={(event) => event.stopPropagation()}
              >
                <CandidatesRowActions
                  application={application}
                  onDelete={onDelete}
                />
              </div>
            </div>

            <div className="mt-2 flex flex-wrap items-center gap-1.5">
              <OperationsBadge
                variant={profileStatusBadgeVariant(application.profileStatus)}
                className="gap-0.5 px-1.5 py-0 text-[9px] font-semibold"
              >
                {isProfileComplete ? (
                  <Check className="size-2.5 shrink-0" aria-hidden="true" />
                ) : null}
                {application.profileStatusLabel || "Incomplete"}
              </OperationsBadge>
              <span className="inline-flex items-center gap-1 rounded-full bg-hero-bg px-1.5 py-0.5 text-[10px] font-medium text-muted">
                <FileText
                  className="size-3 shrink-0 text-muted"
                  aria-hidden="true"
                />
                <span className="tabular-nums text-foreground">
                  {applicationCount}
                </span>
                {applicationCount === 1 ? "application" : "applications"}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Info grid */}
      <div className="flex min-w-0 border-b border-border-subtle">
        <InfoColumn
          icon={Phone}
          iconWrapClassName="bg-success/15"
          iconClassName="text-success"
          label="Contact"
          value={application.candidatePhone || "—"}
        />
        <InfoColumn
          icon={MapPin}
          iconWrapClassName="bg-primary-light"
          iconClassName="text-primary"
          label="Location"
          value={application.candidateLocation || "—"}
        />
        <InfoColumn
          icon={Briefcase}
          iconWrapClassName="bg-warning/15"
          iconClassName="text-warning"
          label="Experience"
          value={application.candidateExperienceLabel || "Not specified"}
        />
        <InfoColumn
          icon={CalendarDays}
          iconWrapClassName="bg-[color-mix(in_srgb,var(--color-primary)_12%,transparent)]"
          iconClassName="text-primary-hover"
          label="Registered"
          value={registered.date}
        />
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between gap-1.5 px-3.5 py-2">
        {primaryRole ? (
          <span className="inline-flex max-w-[45%] shrink-0 items-center gap-0.5 truncate rounded-full bg-primary-light px-1.5 py-0.5 text-[8px] font-medium text-primary">
            <Truck className="size-2.5 shrink-0" aria-hidden="true" />
            <span className="truncate">{primaryRole}</span>
          </span>
        ) : (
          <span className="shrink-0 text-[8px] text-muted">No preferred role</span>
        )}

        <Link
          to={profilePath}
          onClick={stopCardNavigation}
          className="inline-flex h-6 shrink-0 items-center justify-center gap-0.5 rounded-md bg-primary px-2 text-[8px] font-semibold text-white transition-colors hover:bg-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-1 focus-visible:ring-offset-surface"
        >
          <Eye className="size-2.5 shrink-0" aria-hidden="true" />
          <span>
            Applications ({applicationCount.toLocaleString("en-IN")})
          </span>
          <ChevronRight className="size-2.5 shrink-0" aria-hidden="true" />
        </Link>
      </div>
    </article>
  );
}
