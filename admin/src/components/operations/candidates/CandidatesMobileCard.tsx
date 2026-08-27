import { MapPin } from "lucide-react";
import { Link } from "react-router-dom";
import { operationsCandidateDetailPath } from "../../../constants/operations-routes";
import type { OperationsCandidateListItem } from "../../../types/operations-candidates";
import { resolveMediaUrl } from "../../../utils/resolve-media-url";
import { OperationsBadge } from "../../ui/OperationsBadge";
import { CandidatesRowActions } from "./CandidatesRowActions";
import {
  candidateAvatarInitials,
  formatCandidateDateTime,
  formatCandidateDisplayId,
  profileStatusBadgeVariant,
} from "./candidates-format";

interface CandidatesMobileCardProps {
  application: OperationsCandidateListItem;
}

export function CandidatesMobileCard({
  application,
}: CandidatesMobileCardProps) {
  const registered = formatCandidateDateTime(application.registeredAt);
  const roles = (application.preferredRoles ?? []).slice(0, 2);
  const remaining = (application.preferredRoles ?? []).length - roles.length;

  return (
    <article className="overflow-hidden rounded-xl border border-border-subtle bg-surface shadow-[0_1px_3px_rgba(15,23,42,0.06)]">
      <div className="border-b border-border-subtle/80 bg-hero-bg/35 px-3 py-2.5">
        <div className="flex items-start gap-2">
          <div className="min-w-0 flex-1">
            <Link
              to={operationsCandidateDetailPath(
                application.jobSeekerId || application.id,
              )}
              className="group flex items-start gap-2.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
            >
              <span className="inline-flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-primary-light text-xs font-semibold text-primary">
                {resolveMediaUrl(application.profilePhotoUrl) ? (
                  <img
                    src={resolveMediaUrl(application.profilePhotoUrl)}
                    alt=""
                    className="size-full object-cover"
                  />
                ) : (
                  candidateAvatarInitials(application.candidateName)
                )}
              </span>
              <span className="min-w-0">
                <span className="block text-sm font-semibold leading-snug text-foreground group-hover:text-primary">
                  {application.candidateName}
                </span>
                <span className="mt-1 block font-mono text-[10px] font-medium tracking-wide text-muted">
                  {formatCandidateDisplayId(
                    application.jobSeekerId || application.id,
                  )}
                </span>
              </span>
            </Link>
          </div>
          <CandidatesRowActions
            application={application}
            showViewButton={false}
          />
        </div>
      </div>

      <div className="space-y-3 px-3 py-3">
        <div className="flex flex-wrap items-center gap-1.5">
          <OperationsBadge
            variant={profileStatusBadgeVariant(application.profileStatus)}
          >
            {application.profileStatusLabel || "Incomplete"}
          </OperationsBadge>
          <span className="text-[11px] font-semibold tabular-nums text-foreground">
            {application.applicationCount ?? 0} applications
          </span>
        </div>

        <div className="grid grid-cols-2 gap-1.5">
          <div className="rounded-lg bg-hero-bg/60 px-2 py-2">
            <p className="text-[9px] font-semibold uppercase tracking-wide text-muted">
              Contact
            </p>
            <p className="mt-1 truncate text-[11px] font-medium text-foreground">
              {application.candidatePhone || "—"}
            </p>
          </div>
          <div className="rounded-lg bg-hero-bg/60 px-2 py-2">
            <p className="text-[9px] font-semibold uppercase tracking-wide text-muted">
              Experience
            </p>
            <p className="mt-1 truncate text-[11px] font-medium text-foreground">
              {application.candidateExperienceLabel || "Not specified"}
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
          <div className="rounded-lg bg-hero-bg/60 px-2 py-2">
            <p className="text-[9px] font-semibold uppercase tracking-wide text-muted">
              Registered
            </p>
            <p className="mt-1 text-[11px] font-medium text-foreground">
              {registered.date}
            </p>
          </div>
        </div>

        {roles.length > 0 ? (
          <div className="flex flex-wrap gap-1">
            {roles.map((role) => (
              <span
                key={role}
                className="inline-flex rounded-md bg-border-subtle px-1.5 py-0.5 text-[10px] font-medium text-foreground"
              >
                {role}
              </span>
            ))}
            {remaining > 0 ? (
              <span className="inline-flex rounded-md bg-border-subtle px-1.5 py-0.5 text-[10px] font-semibold text-muted">
                +{remaining}
              </span>
            ) : null}
          </div>
        ) : null}
      </div>
    </article>
  );
}
