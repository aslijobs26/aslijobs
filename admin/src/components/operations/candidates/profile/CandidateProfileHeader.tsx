import { useState } from "react";
import { Download, MapPin, Phone } from "lucide-react";
import type { OperationsCandidateDetail } from "../../../../types/operations-candidates";
import { fetchOperationsCandidateResumeBlob } from "../../../../services/operations-candidates.service";
import { OperationsBadge } from "../../../ui/OperationsBadge";
import { OperationsCanKey } from "../../auth/OperationsCanKey";
import { OperationsCandidateAvatar } from "../OperationsCandidateAvatar";
import {
  formatCandidateDateTime,
  formatCandidateDateTimeFull,
  formatCandidateDisplayId,
  profileStatusBadgeVariant,
} from "../candidates-format";

interface CandidateProfileHeaderProps {
  detail: OperationsCandidateDetail;
}

function ProfileCompletenessRing({ percent }: { percent: number }) {
  const size = 36;
  const strokeWidth = 3;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percent / 100) * circumference;

  return (
    <div
      className="relative mx-auto inline-flex size-9 items-center justify-center"
      role="progressbar"
      aria-valuenow={percent}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label="Profile completeness"
    >
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className="-rotate-90"
        aria-hidden="true"
      >
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          className="stroke-border-subtle"
          strokeWidth={strokeWidth}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          className="stroke-success transition-[stroke-dashoffset]"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
        />
      </svg>
      <span className="absolute text-[9px] font-semibold tabular-nums text-success">
        {percent}%
      </span>
    </div>
  );
}

export function CandidateProfileHeader({
  detail,
}: CandidateProfileHeaderProps) {
  const completion = Math.max(
    0,
    Math.min(100, detail.profileCompletionPercent ?? 0),
  );
  const registrationComplete = detail.registrationStatus === "COMPLETED";
  const registeredAt = formatCandidateDateTime(detail.registeredAt);
  const lastActiveAt = formatCandidateDateTime(detail.lastActiveAt);
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadError, setDownloadError] = useState<string | null>(null);

  const handleDownloadResume = async () => {
    if (!detail.hasUploadedResume || isDownloading) return;
    setIsDownloading(true);
    setDownloadError(null);
    try {
      const { blob, fileName } = await fetchOperationsCandidateResumeBlob(
        detail.jobSeekerId || detail.id,
      );
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = fileName || detail.uploadedResumeName || "resume.pdf";
      link.click();
      URL.revokeObjectURL(url);
    } catch {
      setDownloadError("Unable to download resume. Check your permissions.");
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <section className="rounded-xl border border-border-subtle bg-surface p-3 shadow-sm max-sm:p-2.5 sm:p-5">
      <div className="flex flex-col gap-3 max-sm:gap-2.5 lg:flex-row lg:items-start lg:justify-between lg:gap-4">
        <div className="min-w-0 flex-1">
          <div className="flex min-w-0 items-start gap-2.5 sm:gap-4">
            <OperationsCandidateAvatar
              name={detail.candidateName ?? "Candidate"}
              jobSeekerId={detail.jobSeekerId || detail.id}
              photoUrl={detail.profilePhotoUrl}
              className="inline-flex size-12 shrink-0 items-center justify-center overflow-hidden rounded-full bg-primary-light text-sm font-semibold text-primary max-sm:size-11 max-sm:text-[12px] sm:size-20 sm:text-lg"
            />

            <div className="min-w-0 flex-1">
              <div className="flex min-w-0 flex-wrap items-center gap-1.5 max-sm:gap-1 sm:gap-2">
                <h2 className="text-[15px] font-bold leading-tight text-foreground max-sm:text-[14px] sm:text-xl">
                  {detail.candidateName ?? "Candidate"}
                </h2>
                <OperationsBadge
                  variant={profileStatusBadgeVariant(detail.profileStatus)}
                  className="px-1.5 py-0 text-[9px] max-sm:text-[8px] sm:text-[11px] sm:px-2 sm:py-0.5"
                >
                  {registrationComplete
                    ? "Registration complete"
                    : "Registration incomplete"}
                </OperationsBadge>
                {detail.isWhatsappVerified ? (
                  <OperationsBadge
                    variant="verification"
                    className="px-1.5 py-0 text-[9px] max-sm:text-[8px] sm:text-[11px] sm:px-2 sm:py-0.5"
                  >
                    WhatsApp Verified
                  </OperationsBadge>
                ) : (
                  <OperationsBadge
                    variant="medium"
                    className="px-1.5 py-0 text-[9px] max-sm:text-[8px] sm:text-[11px] sm:px-2 sm:py-0.5"
                  >
                    WhatsApp Not Verified
                  </OperationsBadge>
                )}
              </div>
              <p className="mt-0.5 font-mono text-[10px] font-medium tracking-wide text-muted max-sm:text-[9px] sm:mt-1 sm:text-[11px]">
                {detail.displayId ||
                  formatCandidateDisplayId(detail.jobSeekerId || detail.id)}
              </p>

              <div className="mt-2 flex min-w-0 flex-row flex-wrap items-center gap-x-1.5 gap-y-0.5 text-[11px] text-muted max-sm:mt-1.5 max-sm:text-[10px] sm:mt-3 sm:gap-x-2 sm:text-xs">
                {detail.candidatePhone ? (
                  <span className="inline-flex min-w-0 items-center gap-1 sm:gap-1.5">
                    <Phone
                      className="size-3 shrink-0 sm:size-3.5"
                      aria-hidden="true"
                    />
                    <span className="truncate">{detail.candidatePhone}</span>
                  </span>
                ) : null}
                {detail.candidatePhone &&
                (detail.candidateEmail ||
                  detail.candidateLocation ||
                  detail.candidateCity ||
                  detail.candidateState) ? (
                  <span className="select-none text-muted" aria-hidden="true">
                    |
                  </span>
                ) : null}
                {detail.candidateEmail ? (
                  <span className="inline-flex min-w-0 items-center gap-1 truncate sm:gap-1.5">
                    {detail.candidateEmail}
                  </span>
                ) : null}
                {detail.candidateEmail &&
                (detail.candidateLocation ||
                  detail.candidateCity ||
                  detail.candidateState) ? (
                  <span className="select-none text-muted" aria-hidden="true">
                    |
                  </span>
                ) : null}
                <span className="inline-flex min-w-0 items-center gap-1 sm:gap-1.5">
                  <MapPin
                    className="size-3 shrink-0 sm:size-3.5"
                    aria-hidden="true"
                  />
                  <span className="truncate">
                    {detail.candidateLocation ||
                      [detail.candidateCity, detail.candidateState]
                        .filter(Boolean)
                        .join(", ") ||
                      "—"}
                  </span>
                </span>
              </div>
            </div>
          </div>

          <div className="mt-3 grid grid-cols-3 gap-1 border-t border-border-subtle pt-3 max-sm:mt-2.5 max-sm:pt-2.5 sm:mt-4 sm:gap-3 sm:pt-4">
            <div className="min-w-0">
              <p className="text-[8px] font-semibold uppercase leading-tight tracking-wide text-muted max-sm:text-[7px] sm:text-[10px]">
                Registered on
              </p>
              <div className="mt-0.5 sm:hidden">
                <p className="text-[9px] font-medium leading-snug text-foreground">
                  {registeredAt.date}
                </p>
                {registeredAt.time ? (
                  <p className="text-[8px] leading-snug text-muted">
                    {registeredAt.time}
                  </p>
                ) : null}
              </div>
              <p className="mt-1 hidden text-xs font-medium text-foreground sm:block">
                {formatCandidateDateTimeFull(detail.registeredAt)}
              </p>
            </div>
            <div className="min-w-0">
              <p className="text-[8px] font-semibold uppercase leading-tight tracking-wide text-muted max-sm:text-[7px] sm:text-[10px]">
                Last Active
              </p>
              <div className="mt-0.5 sm:hidden">
                <p className="text-[9px] font-medium leading-snug text-foreground">
                  {lastActiveAt.date}
                </p>
                {lastActiveAt.time ? (
                  <p className="text-[8px] leading-snug text-muted">
                    {lastActiveAt.time}
                  </p>
                ) : null}
              </div>
              <p className="mt-1 hidden text-xs font-medium text-foreground sm:block">
                {formatCandidateDateTimeFull(detail.lastActiveAt)}
              </p>
            </div>
            <div className="min-w-0">
              <p className="text-center text-[8px] font-semibold uppercase leading-tight tracking-wide text-muted max-sm:text-[7px] sm:text-left sm:text-[10px]">
                Profile Completeness
              </p>
              <div className="mt-1 flex justify-center sm:hidden">
                <ProfileCompletenessRing percent={completion} />
              </div>
              <div className="hidden sm:block">
                <div className="mt-1 flex items-center justify-end gap-2">
                  <p className="text-xs font-semibold text-success">
                    {completion}%
                  </p>
                </div>
                <div
                  className="mt-1.5 h-2 overflow-hidden rounded-full bg-border-subtle"
                  role="progressbar"
                  aria-valuenow={completion}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-label="Profile completeness"
                >
                  <div
                    className="h-full rounded-full bg-success transition-[width]"
                    style={{ width: `${completion}%` }}
                  />
                </div>
                <p className="mt-1 text-[10px] text-muted">
                  Field fill score — separate from registration status
                </p>
              </div>
            </div>
          </div>
          <p className="mt-1.5 text-center text-[8px] text-muted sm:hidden">
            Field fill score — separate from registration status
          </p>
        </div>

        <div className="flex w-full shrink-0 flex-col gap-1.5 sm:w-auto sm:min-w-[11rem] sm:gap-2">
          <OperationsCanKey permissionKey="candidates.profile.documents.view">
            {detail.hasUploadedResume ? (
              <button
                type="button"
                onClick={() => void handleDownloadResume()}
                disabled={isDownloading}
                className="inline-flex h-8 items-center justify-center gap-1.5 rounded-lg border border-border-subtle bg-surface px-2.5 text-[11px] font-semibold text-foreground transition-colors hover:bg-primary-light hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 disabled:opacity-60 max-sm:h-7 max-sm:text-[10px] sm:h-9 sm:px-3 sm:text-xs"
              >
                <Download
                  className="size-3 max-sm:size-2.5 sm:size-3.5"
                  aria-hidden="true"
                />
                {isDownloading ? "Downloading…" : "Download Resume"}
              </button>
            ) : (
              <p className="rounded-lg border border-dashed border-border-subtle px-2.5 py-1.5 text-center text-[10px] text-muted max-sm:text-[9px] sm:px-3 sm:py-2 sm:text-[11px]">
                No resume uploaded
              </p>
            )}
          </OperationsCanKey>
          {downloadError ? (
            <p
              className="text-[10px] text-danger max-sm:text-[9px] sm:text-[11px]"
              role="alert"
            >
              {downloadError}
            </p>
          ) : null}
        </div>
      </div>
    </section>
  );
}
