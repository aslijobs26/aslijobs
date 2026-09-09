import { useState } from "react";
import { Download, MapPin, Phone } from "lucide-react";
import type { OperationsCandidateDetail } from "../../../../types/operations-candidates";
import { fetchOperationsCandidateResumeBlob } from "../../../../services/operations-candidates.service";
import { OperationsBadge } from "../../../ui/OperationsBadge";
import { OperationsCanKey } from "../../auth/OperationsCanKey";
import { OperationsCandidateAvatar } from "../OperationsCandidateAvatar";
import {
  formatCandidateDateTimeFull,
  formatCandidateDisplayId,
  profileStatusBadgeVariant,
} from "../candidates-format";

interface CandidateProfileHeaderProps {
  detail: OperationsCandidateDetail;
}

export function CandidateProfileHeader({
  detail,
}: CandidateProfileHeaderProps) {
  const completion = Math.max(
    0,
    Math.min(100, detail.profileCompletionPercent ?? 0),
  );
  const registrationComplete = detail.registrationStatus === "COMPLETED";
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
    <section className="rounded-xl border border-border-subtle bg-surface p-4 shadow-sm sm:p-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0 flex-1">
          <div className="flex min-w-0 items-start gap-3 sm:gap-4">
            <OperationsCandidateAvatar
              name={detail.candidateName ?? "Candidate"}
              jobSeekerId={detail.jobSeekerId || detail.id}
              photoUrl={detail.profilePhotoUrl}
              className="inline-flex size-16 shrink-0 items-center justify-center overflow-hidden rounded-full bg-primary-light text-base font-semibold text-primary sm:size-20 sm:text-lg"
            />

            <div className="min-w-0 flex-1">
              <div className="flex min-w-0 flex-wrap items-center gap-2">
                <h2 className="text-lg font-bold text-foreground sm:text-xl">
                  {detail.candidateName ?? "Candidate"}
                </h2>
                <OperationsBadge
                  variant={profileStatusBadgeVariant(detail.profileStatus)}
                >
                  {registrationComplete
                    ? "Registration complete"
                    : "Registration incomplete"}
                </OperationsBadge>
                {detail.isWhatsappVerified ? (
                  <OperationsBadge variant="verification">
                    WhatsApp Verified
                  </OperationsBadge>
                ) : (
                  <OperationsBadge variant="medium">
                    WhatsApp Not Verified
                  </OperationsBadge>
                )}
              </div>
              <p className="mt-1 font-mono text-[11px] font-medium tracking-wide text-muted">
                {detail.displayId ||
                  formatCandidateDisplayId(detail.jobSeekerId || detail.id)}
              </p>

              <div className="mt-3 flex flex-col gap-1.5 text-xs text-muted sm:flex-row sm:flex-wrap sm:items-center sm:gap-x-4">
                {detail.candidatePhone ? (
                  <span className="inline-flex items-center gap-1.5">
                    <Phone className="size-3.5 shrink-0" aria-hidden="true" />
                    {detail.candidatePhone}
                  </span>
                ) : null}
                {detail.candidateEmail ? (
                  <span className="inline-flex items-center gap-1.5">
                    {detail.candidateEmail}
                  </span>
                ) : null}
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
                  Profile Completeness
                </p>
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

        <div className="flex w-full shrink-0 flex-col gap-2 sm:w-auto sm:min-w-[11rem]">
          <OperationsCanKey permissionKey="candidates.profile.documents.view">
            {detail.hasUploadedResume ? (
              <button
                type="button"
                onClick={() => void handleDownloadResume()}
                disabled={isDownloading}
                className="inline-flex h-9 items-center justify-center gap-1.5 rounded-lg border border-border-subtle bg-surface px-3 text-xs font-semibold text-foreground transition-colors hover:bg-primary-light hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 disabled:opacity-60"
              >
                <Download className="size-3.5" aria-hidden="true" />
                {isDownloading ? "Downloading…" : "Download Resume"}
              </button>
            ) : (
              <p className="rounded-lg border border-dashed border-border-subtle px-3 py-2 text-center text-[11px] text-muted">
                No resume uploaded
              </p>
            )}
          </OperationsCanKey>
          {downloadError ? (
            <p className="text-[11px] text-danger" role="alert">
              {downloadError}
            </p>
          ) : null}
        </div>
      </div>
    </section>
  );
}
