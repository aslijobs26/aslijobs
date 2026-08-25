import { BadgeCheck, MapPin } from "lucide-react";
import { Link } from "react-router-dom";
import { operationsCandidateDetailPath } from "../../../constants/operations-routes";
import type { OperationsCandidateListItem } from "../../../types/operations-candidates";
import { OperationsBadge } from "../../ui/OperationsBadge";
import { CandidatesRowActions } from "./CandidatesRowActions";
import {
  applicationStatusBadgeVariant,
  candidateAvatarInitials,
  formatCandidateDateTime,
  formatCandidateDisplayId,
} from "./candidates-format";

interface CandidatesMobileCardProps {
  application: OperationsCandidateListItem;
}

export function CandidatesMobileCard({
  application,
}: CandidatesMobileCardProps) {
  const applied = formatCandidateDateTime(application.appliedAt);
  const contactLine = [application.candidateEmail, application.candidatePhone]
    .filter(Boolean)
    .join(" · ");

  return (
    <article className="overflow-hidden rounded-xl border border-border-subtle bg-surface shadow-[0_1px_3px_rgba(15,23,42,0.06)]">
      <div className="border-b border-border-subtle/80 bg-hero-bg/35 px-3 py-2.5">
        <div className="flex items-start gap-2">
          <div className="min-w-0 flex-1">
            <Link
              to={operationsCandidateDetailPath(
                application.jobSeekerId || application.id,
              )}
              className="group block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
            >
              <h3 className="text-sm font-semibold leading-snug text-foreground group-hover:text-primary">
                {application.candidateName}
              </h3>
              <p className="mt-1 font-mono text-[10px] font-medium tracking-wide text-muted">
                {formatCandidateDisplayId(application.jobSeekerId || application.id)}
              </p>
            </Link>
          </div>
          <CandidatesRowActions
            application={application}
            showViewButton={false}
          />
        </div>
      </div>

      <div className="space-y-3 px-3 py-3">
        <div className="flex items-center gap-2.5">
          <span
            className="inline-flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-primary-light text-xs font-semibold text-primary"
            aria-hidden="true"
          >
            {application.profilePhotoUrl ? (
              <img
                src={application.profilePhotoUrl}
                alt=""
                className="size-full object-cover"
              />
            ) : (
              candidateAvatarInitials(application.candidateName)
            )}
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-xs font-medium text-foreground">
              {application.jobTitle || "No application"}
            </p>
            <p className="mt-0.5 truncate font-mono text-[10px] text-muted">
              {application.publicJobId || "—"}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          <OperationsBadge
            variant={applicationStatusBadgeVariant(application.status)}
          >
            {application.statusLabel}
          </OperationsBadge>
          {application.employerVerified ? (
            <span className="inline-flex items-center gap-1 text-[10px] font-medium text-chart-accent">
              <BadgeCheck className="size-3" aria-hidden="true" />
              Verified employer
            </span>
          ) : null}
        </div>

        <div className="grid grid-cols-2 gap-1.5">
          <div className="rounded-lg bg-hero-bg/60 px-2 py-2">
            <p className="text-[9px] font-semibold uppercase tracking-wide text-muted">
              Employer
            </p>
            <p className="mt-1 truncate text-[11px] font-medium text-foreground">
              {application.employerName || "—"}
            </p>
          </div>
          <div className="rounded-lg bg-hero-bg/60 px-2 py-2">
            <p className="text-[9px] font-semibold uppercase tracking-wide text-muted">
              Applied
            </p>
            <p className="mt-1 text-[11px] font-medium text-foreground">
              {applied.date}
            </p>
          </div>
          <div className="rounded-lg bg-hero-bg/60 px-2 py-2">
            <p className="text-[9px] font-semibold uppercase tracking-wide text-muted">
              Experience
            </p>
            <p className="mt-1 truncate text-[11px] font-medium text-foreground">
              {application.candidateExperienceLabel || "—"}
            </p>
          </div>
          <div className="rounded-lg bg-hero-bg/60 px-2 py-2">
            <p className="text-[9px] font-semibold uppercase tracking-wide text-muted">
              Location
            </p>
            <p className="mt-1 flex items-center gap-1 truncate text-[11px] font-medium text-foreground">
              <MapPin className="size-3 shrink-0 text-muted" aria-hidden="true" />
              <span className="truncate">
                {application.candidateLocation || "—"}
              </span>
            </p>
          </div>
        </div>

        {contactLine ? (
          <p className="truncate text-[11px] text-muted">{contactLine}</p>
        ) : null}
      </div>
    </article>
  );
}
