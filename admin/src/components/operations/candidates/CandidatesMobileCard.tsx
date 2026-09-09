import {
  Briefcase,
  CalendarDays,
  MapPin,
  Phone,
} from "lucide-react";
import { Link } from "react-router-dom";
import { operationsCandidateDetailPath } from "../../../constants/operations-routes";
import type { OperationsCandidateListItem } from "../../../types/operations-candidates";
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
}

function MetaTile({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Phone;
  label: string;
  value: string;
}) {
  return (
    <div className="min-w-0 rounded-lg bg-hero-bg/70 px-2 py-1.5">
      <div className="flex items-center gap-1">
        <span className="inline-flex size-4 shrink-0 items-center justify-center rounded bg-surface text-primary shadow-[0_0_0_1px_color-mix(in_srgb,var(--color-border-subtle)_85%,transparent)]">
          <Icon className="size-2.5" strokeWidth={2} aria-hidden="true" />
        </span>
        <p className="truncate text-[8px] font-semibold uppercase tracking-[0.05em] text-muted">
          {label}
        </p>
      </div>
      <p className="mt-1 truncate text-[10px] font-semibold leading-snug text-foreground">
        {value}
      </p>
    </div>
  );
}

/**
 * Mobile-only candidate list card (rendered under `sm`).
 * Desktop/tablet table and list layouts are unchanged.
 */
export function CandidatesMobileCard({
  application,
}: CandidatesMobileCardProps) {
  const registered = formatCandidateDateTime(application.registeredAt);
  const roles = (application.preferredRoles ?? []).slice(0, 2);
  const remaining = (application.preferredRoles ?? []).length - roles.length;
  const profilePath = operationsCandidateDetailPath(
    application.jobSeekerId || application.id,
  );
  const displayId =
    application.displayId ||
    formatCandidateDisplayId(application.jobSeekerId || application.id);
  const applicationCount = application.applicationCount ?? 0;

  return (
    <article className="relative overflow-hidden rounded-2xl border border-border-subtle bg-surface shadow-[0_1px_2px_rgba(15,23,42,0.04),0_4px_12px_rgba(15,23,42,0.03)]">
      {/* Quiet brand accent — identity without a heavy header band */}
      <span
        className="absolute inset-y-3 left-0 w-0.5 rounded-full bg-primary/55"
        aria-hidden="true"
      />

      <div className="pl-3.5 pr-2.5 pt-3">
        <div className="flex items-start gap-2.5">
          <Link
            to={profilePath}
            className="group flex min-w-0 flex-1 items-start gap-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 focus-visible:ring-offset-2 focus-visible:ring-offset-surface"
          >
            <OperationsCandidateAvatar
              name={application.candidateName ?? "Candidate"}
              jobSeekerId={application.jobSeekerId || application.id}
              photoUrl={application.profilePhotoUrl}
              className="inline-flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-primary-light text-[11px] font-semibold text-primary ring-2 ring-surface shadow-[0_0_0_1px_color-mix(in_srgb,var(--color-border-subtle)_90%,transparent)]"
            />
            <span className="min-w-0 flex-1 pt-0.5">
              <span className="flex min-w-0 flex-wrap items-center gap-1.5">
                <span className="truncate text-[13px] font-semibold tracking-tight text-foreground group-hover:text-primary">
                  {application.candidateName ?? "Candidate"}
                </span>
                {application.isNewRegistration ? (
                  <OperationsBadge
                    variant="high"
                    className="px-1.5 py-0 text-[9px] font-bold uppercase tracking-wider"
                  >
                    <span aria-label="New registration">New</span>
                  </OperationsBadge>
                ) : null}
              </span>
              <span className="mt-0.5 block truncate font-mono text-[9px] font-medium tracking-wide text-muted">
                {displayId}
              </span>
            </span>
          </Link>

          <CandidatesRowActions application={application} />
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-2">
          <OperationsBadge
            variant={profileStatusBadgeVariant(application.profileStatus)}
            className="px-1.5 py-0 text-[9px]"
          >
            {application.profileStatusLabel || "Incomplete"}
          </OperationsBadge>
          <span className="inline-flex items-center gap-1 rounded-full bg-hero-bg px-1.5 py-0.5 text-[10px] font-medium tabular-nums text-muted">
            <span className="font-semibold text-foreground">
              {applicationCount}
            </span>
            {applicationCount === 1 ? "application" : "applications"}
          </span>
        </div>
      </div>

      <div className="mx-3.5 mt-3 border-t border-border-subtle/80" />

      <div className="grid grid-cols-2 gap-1.5 px-3 py-2.5">
        <MetaTile
          icon={Phone}
          label="Contact"
          value={application.candidatePhone || "—"}
        />
        <MetaTile
          icon={MapPin}
          label="Location"
          value={application.candidateLocation || "—"}
        />
        <MetaTile
          icon={Briefcase}
          label="Experience"
          value={application.candidateExperienceLabel || "Not specified"}
        />
        <MetaTile
          icon={CalendarDays}
          label="Registered"
          value={registered.date}
        />
      </div>

      {roles.length > 0 ? (
        <div className="flex flex-wrap gap-1 border-t border-border-subtle/80 bg-hero-bg/40 px-3 py-2">
          {roles.map((role) => (
            <span
              key={role}
              className="inline-flex max-w-full truncate rounded-full border border-border-subtle bg-surface px-1.5 py-0.5 text-[9px] font-medium text-foreground"
            >
              {role}
            </span>
          ))}
          {remaining > 0 ? (
            <span className="inline-flex rounded-full border border-border-subtle bg-surface px-1.5 py-0.5 text-[9px] font-semibold text-muted">
              +{remaining}
            </span>
          ) : null}
        </div>
      ) : null}
    </article>
  );
}
