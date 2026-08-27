import type { ReactNode } from "react";
import {
  ChevronDown,
  Download,
  Mail,
  MapPin,
  MessageSquare,
  NotebookPen,
  Phone,
} from "lucide-react";
import type { OperationsCandidateDetail } from "../../../../types/operations-candidates";
import { resolveMediaUrl } from "../../../../utils/resolve-media-url";
import { OperationsBadge } from "../../../ui/OperationsBadge";
import {
  candidateAvatarInitials,
  formatCandidateDateTimeFull,
  formatCandidateDisplayId,
  profileStatusBadgeVariant,
} from "../candidates-format";

interface CandidateProfileHeaderProps {
  detail: OperationsCandidateDetail;
}

function ComingSoonButton({
  label,
  icon,
}: {
  label: string;
  icon: ReactNode;
}) {
  return (
    <button
      type="button"
      disabled
      title="Coming soon"
      aria-disabled="true"
      className="inline-flex h-9 w-full items-center justify-center gap-1.5 rounded-lg border border-border-subtle bg-surface px-3 text-xs font-semibold text-muted opacity-70 sm:w-auto"
    >
      {icon}
      {label}
    </button>
  );
}

export function CandidateProfileHeader({
  detail,
}: CandidateProfileHeaderProps) {
  const photoUrl = resolveMediaUrl(detail.profilePhotoUrl);
  const resumeUrl = resolveMediaUrl(detail.uploadedResumeUrl);
  const completion = Math.max(
    0,
    Math.min(100, detail.profileCompletionPercent ?? 0),
  );
  const isActive = detail.registrationStatus === "COMPLETED";

  return (
    <section className="rounded-xl border border-border-subtle bg-surface p-4 shadow-sm sm:p-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0 flex-1">
          <div className="flex min-w-0 items-start gap-3 sm:gap-4">
            <span className="inline-flex size-16 shrink-0 items-center justify-center overflow-hidden rounded-full bg-primary-light text-base font-semibold text-primary sm:size-20 sm:text-lg">
              {photoUrl ? (
                <img
                  src={photoUrl}
                  alt=""
                  className="size-full object-cover"
                />
              ) : (
                candidateAvatarInitials(detail.candidateName)
              )}
            </span>

            <div className="min-w-0 flex-1">
              <div className="flex min-w-0 flex-wrap items-center gap-2">
                <h2 className="text-lg font-bold text-foreground sm:text-xl">
                  {detail.candidateName}
                </h2>
                <OperationsBadge
                  variant={isActive ? "candidate" : profileStatusBadgeVariant(detail.profileStatus)}
                >
                  {isActive ? "Active" : detail.profileStatusLabel || "Incomplete"}
                </OperationsBadge>
              </div>
              <p className="mt-1 font-mono text-[11px] font-medium tracking-wide text-muted">
                {formatCandidateDisplayId(detail.jobSeekerId || detail.id)}
              </p>

              <div className="mt-3 flex flex-col gap-1.5 text-xs text-muted sm:flex-row sm:flex-wrap sm:items-center sm:gap-x-4">
                <span className="inline-flex items-center gap-1.5">
                  <Phone className="size-3.5 shrink-0" aria-hidden="true" />
                  {detail.candidatePhone || "—"}
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <Mail className="size-3.5 shrink-0" aria-hidden="true" />
                  {detail.candidateEmail || "—"}
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <MapPin className="size-3.5 shrink-0" aria-hidden="true" />
                  {detail.candidateLocation ||
                    [detail.candidateCity, detail.candidateState]
                      .filter(Boolean)
                      .join(", ") ||
                    "—"}
                </span>
              </div>
            </div>
          </div>

          <div className="mt-4 grid gap-3 border-t border-border-subtle pt-4 sm:grid-cols-3">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wide text-muted">
                Registered on
              </p>
              <p className="mt-1 text-xs font-medium text-foreground">
                {formatCandidateDateTimeFull(detail.registeredAt)}
              </p>
            </div>
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wide text-muted">
                Last Active
              </p>
              <p className="mt-1 text-xs font-medium text-foreground">
                {formatCandidateDateTimeFull(detail.lastActiveAt)}
              </p>
            </div>
            <div>
              <div className="flex items-center justify-between gap-2">
                <p className="text-[10px] font-semibold uppercase tracking-wide text-muted">
                  Profile Completion
                </p>
                <p className="text-xs font-semibold text-success">{completion}%</p>
              </div>
              <div
                className="mt-1.5 h-2 overflow-hidden rounded-full bg-border-subtle"
                role="progressbar"
                aria-valuenow={completion}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-label="Profile completion"
              >
                <div
                  className="h-full rounded-full bg-success transition-[width]"
                  style={{ width: `${completion}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        <div className="flex w-full shrink-0 flex-col gap-2 sm:w-auto sm:min-w-[11rem]">
          <ComingSoonButton
            label="Send Message"
            icon={<MessageSquare className="size-3.5" aria-hidden="true" />}
          />
          <ComingSoonButton
            label="Add Note"
            icon={<NotebookPen className="size-3.5" aria-hidden="true" />}
          />
          {resumeUrl ? (
            <a
              href={resumeUrl}
              target="_blank"
              rel="noreferrer"
              download={detail.uploadedResumeName || undefined}
              className="inline-flex h-9 items-center justify-center gap-1.5 rounded-lg border border-border-subtle bg-surface px-3 text-xs font-semibold text-foreground transition-colors hover:bg-primary-light hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
            >
              <Download className="size-3.5" aria-hidden="true" />
              Download Resume
            </a>
          ) : (
            <ComingSoonButton
              label="Download Resume"
              icon={<Download className="size-3.5" aria-hidden="true" />}
            />
          )}
          <button
            type="button"
            disabled
            title="Coming soon"
            aria-disabled="true"
            className="inline-flex h-9 items-center justify-center gap-1.5 rounded-lg border border-border-subtle bg-surface px-3 text-xs font-semibold text-muted opacity-70"
          >
            More Actions
            <ChevronDown className="size-3.5" aria-hidden="true" />
          </button>
        </div>
      </div>
    </section>
  );
}
