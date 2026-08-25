import { isAxiosError } from "axios";
import { ArrowLeft, BadgeCheck, MapPin } from "lucide-react";
import { Link, useParams } from "react-router-dom";
import {
  applicationStatusBadgeVariant,
  candidateAvatarInitials,
  formatCandidateDateTimeFull,
  formatCandidateDisplayId,
  shortApplicationId,
} from "../components/operations/candidates/candidates-format";
import { OperationsLayout } from "../components/operations/layout/OperationsLayout";
import { OperationsBadge } from "../components/ui/OperationsBadge";
import { OperationsCard } from "../components/ui/OperationsCard";
import { OPERATIONS_ROUTES } from "../constants/operations-routes";
import { useOperationsCandidateDetail } from "../hooks/use-operations-candidates";
import { resolveMediaUrl } from "../utils/resolve-media-url";

function DetailSkeleton() {
  return (
    <div className="flex w-full min-w-0 flex-col gap-3" aria-busy="true">
      <div className="h-24 animate-pulse rounded-xl border border-border-subtle bg-surface" />
      <div className="grid gap-3 lg:grid-cols-3">
        <div className="h-64 animate-pulse rounded-xl border border-border-subtle bg-surface lg:col-span-2" />
        <div className="h-64 animate-pulse rounded-xl border border-border-subtle bg-surface" />
      </div>
    </div>
  );
}

export function OperationsCandidatesDetailPage() {
  const { jobSeekerId: rawId } = useParams<{ jobSeekerId: string }>();
  const jobSeekerId = rawId ? decodeURIComponent(rawId) : undefined;
  const detailQuery = useOperationsCandidateDetail(jobSeekerId);
  const detail = detailQuery.data;

  const errorMessage = (() => {
    if (!detailQuery.error) {
      return "Failed to load candidate details.";
    }

    if (isAxiosError(detailQuery.error)) {
      const message = detailQuery.error.response?.data?.message;
      if (typeof message === "string" && message.trim()) {
        return message;
      }
      if (detailQuery.error.response?.status === 404) {
        return "This candidate application could not be found.";
      }
    }

    return "Failed to load candidate details.";
  })();

  return (
    <OperationsLayout
      title="Candidate Details"
      subtitle="Application and profile information for operations review."
    >
      <div className="mb-3">
        <Link
          to={OPERATIONS_ROUTES.CANDIDATES}
          className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-border-subtle bg-surface px-3 text-xs font-semibold text-foreground transition-colors hover:bg-hero-bg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
        >
          <ArrowLeft className="size-3.5" aria-hidden="true" />
          Back to Candidates
        </Link>
      </div>

      {detailQuery.isPending ? <DetailSkeleton /> : null}

      {detailQuery.isError && !detail ? (
        <div className="rounded-xl border border-border-subtle bg-surface px-4 py-16 text-center shadow-sm">
          <p className="text-sm font-medium text-danger">{errorMessage}</p>
          <button
            type="button"
            onClick={() => void detailQuery.refetch()}
            className="mt-3 inline-flex h-9 items-center rounded-lg bg-primary-light px-3 text-xs font-semibold text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
          >
            Retry
          </button>
        </div>
      ) : null}

      {detail ? (
        <div className="flex w-full min-w-0 flex-col gap-3">
          <section className="rounded-xl border border-border-subtle bg-surface p-4 shadow-sm sm:p-5">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div className="flex min-w-0 items-start gap-3">
                <span
                  className="inline-flex size-14 shrink-0 items-center justify-center overflow-hidden rounded-full bg-primary-light text-sm font-semibold text-primary"
                  aria-hidden="true"
                >
                  {resolveMediaUrl(detail.profilePhotoUrl) ? (
                    <img
                      src={resolveMediaUrl(detail.profilePhotoUrl)}
                      alt=""
                      className="size-full object-cover"
                    />
                  ) : (
                    candidateAvatarInitials(detail.candidateName)
                  )}
                </span>
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-lg font-bold text-foreground sm:text-xl">
                      {detail.candidateName}
                    </h2>
                    <OperationsBadge
                      variant={applicationStatusBadgeVariant(detail.status)}
                    >
                      {detail.statusLabel}
                    </OperationsBadge>
                  </div>
                  <p className="mt-1 font-mono text-[11px] text-muted">
                    Candidate{" "}
                    {formatCandidateDisplayId(detail.jobSeekerId || detail.id)}
                    {detail.applicationId
                      ? ` · App ${shortApplicationId(detail.applicationId)}`
                      : " · No application"}
                  </p>
                  {detail.candidateHeadline ? (
                    <p className="mt-2 text-sm text-muted">
                      {detail.candidateHeadline}
                    </p>
                  ) : null}
                  <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted">
                    {detail.candidateEmail ? (
                      <span>{detail.candidateEmail}</span>
                    ) : null}
                    {detail.candidatePhone ? (
                      <span>{detail.candidatePhone}</span>
                    ) : null}
                    {detail.candidateLocation ? (
                      <span className="inline-flex items-center gap-1">
                        <MapPin className="size-3" aria-hidden="true" />
                        {detail.candidateLocation}
                      </span>
                    ) : null}
                  </div>
                </div>
              </div>
            </div>
          </section>

          <div className="grid min-w-0 gap-3 lg:grid-cols-3">
            <div className="flex min-w-0 flex-col gap-3 lg:col-span-2">
              <OperationsCard title="Application">
                <dl className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div>
                    <dt className="text-[10px] font-semibold uppercase tracking-wide text-muted">
                      Job
                    </dt>
                    <dd className="mt-1 text-sm font-semibold text-foreground">
                      {detail.jobTitle}
                    </dd>
                    <dd className="mt-0.5 font-mono text-[11px] text-muted">
                      {detail.publicJobId}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-[10px] font-semibold uppercase tracking-wide text-muted">
                      Employer
                    </dt>
                    <dd className="mt-1 flex items-center gap-1 text-sm font-semibold text-foreground">
                      {detail.employerName}
                      {detail.employerVerified ? (
                        <BadgeCheck
                          className="size-3.5 text-chart-accent"
                          aria-label="Verified employer"
                        />
                      ) : null}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-[10px] font-semibold uppercase tracking-wide text-muted">
                      Applied on
                    </dt>
                    <dd className="mt-1 text-sm text-foreground">
                      {formatCandidateDateTimeFull(detail.appliedAt)}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-[10px] font-semibold uppercase tracking-wide text-muted">
                      Registered on
                    </dt>
                    <dd className="mt-1 text-sm text-foreground">
                      {formatCandidateDateTimeFull(detail.registeredAt)}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-[10px] font-semibold uppercase tracking-wide text-muted">
                      Experience
                    </dt>
                    <dd className="mt-1 text-sm text-foreground">
                      {detail.candidateExperienceLabel || "—"}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-[10px] font-semibold uppercase tracking-wide text-muted">
                      Gender
                    </dt>
                    <dd className="mt-1 text-sm capitalize text-foreground">
                      {detail.candidateGender
                        ? detail.candidateGender.replaceAll("_", " ")
                        : "—"}
                    </dd>
                  </div>
                </dl>
                {detail.descriptionExcerpt ? (
                  <div className="mt-4 border-t border-border-subtle pt-4">
                    <p className="text-[10px] font-semibold uppercase tracking-wide text-muted">
                      Job description excerpt
                    </p>
                    <p className="mt-2 text-sm leading-relaxed text-muted">
                      {detail.descriptionExcerpt}
                    </p>
                  </div>
                ) : null}
              </OperationsCard>

              {detail.skills.length > 0 ? (
                <OperationsCard title="Skills">
                  <ul className="flex flex-wrap gap-1.5">
                    {detail.skills.map((skill) => (
                      <li key={skill}>
                        <span className="inline-flex rounded-full border border-border-subtle bg-hero-bg/60 px-2.5 py-1 text-[11px] font-medium text-foreground">
                          {skill}
                        </span>
                      </li>
                    ))}
                  </ul>
                </OperationsCard>
              ) : null}
            </div>

            <div className="flex min-w-0 flex-col gap-3">
              <OperationsCard title="Resume snapshot">
                <dl className="space-y-3 text-sm">
                  <div>
                    <dt className="text-[10px] font-semibold uppercase tracking-wide text-muted">
                      Version
                    </dt>
                    <dd className="mt-1 text-foreground">
                      {detail.resumeVersion}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-[10px] font-semibold uppercase tracking-wide text-muted">
                      Status
                    </dt>
                    <dd className="mt-1 capitalize text-foreground">
                      {detail.resumeStatus || "—"}
                    </dd>
                  </div>
                </dl>
              </OperationsCard>

              <OperationsCard title="Status history">
                {detail.statusHistory.length === 0 ? (
                  <p className="text-xs text-muted">No status history yet.</p>
                ) : (
                  <ol className="space-y-3">
                    {detail.statusHistory.map((entry, index) => (
                      <li
                        key={`${entry.status}-${entry.at}-${index}`}
                        className="border-l-2 border-border-subtle pl-3"
                      >
                        <p className="text-xs font-semibold text-foreground">
                          {entry.statusLabel}
                        </p>
                        <p className="mt-0.5 text-[11px] text-muted">
                          {formatCandidateDateTimeFull(entry.at)}
                          {entry.actor ? ` · ${entry.actor}` : ""}
                        </p>
                      </li>
                    ))}
                  </ol>
                )}
              </OperationsCard>
            </div>
          </div>
        </div>
      ) : null}
    </OperationsLayout>
  );
}
