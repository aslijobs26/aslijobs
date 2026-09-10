import { useState } from "react";
import { isAxiosError } from "axios";
import {
  ArrowLeft,
  Building2,
  Briefcase,
  CalendarDays,
  CheckCircle2,
  MapPin,
  User,
  UserX,
} from "lucide-react";
import { Link, useParams } from "react-router-dom";
import { OperationsCanKey } from "../components/operations/auth/OperationsCanKey";
import { formatEmployerDateTimeFull } from "../components/operations/employers/employers-format";
import { OperationsLayout } from "../components/operations/layout/OperationsLayout";
import {
  placementCandidateInitials,
  placementJoiningStatusBadgeVariant,
} from "../components/operations/placements/placements-format";
import { OperationsBadge } from "../components/ui/OperationsBadge";
import {
  OPERATIONS_ROUTES,
  operationsCandidateDetailPath,
  operationsEmployerDetailPath,
  operationsJobDetailPath,
} from "../constants/operations-routes";
import {
  useOperationsPlacementDetail,
  useUpdateOperationsPlacementJoining,
} from "../hooks/use-operations-placements";
import { isOperationsSessionTransientError } from "../utils/operations-session-errors";
import { resolveMediaUrl } from "../utils/resolve-media-url";

function DetailSkeleton() {
  return (
    <div className="flex w-full min-w-0 flex-col gap-3" aria-busy="true">
      <div className="h-36 animate-pulse rounded-xl border border-border-subtle bg-surface" />
      <div className="grid gap-3 lg:grid-cols-2">
        <div className="h-48 animate-pulse rounded-xl border border-border-subtle bg-surface" />
        <div className="h-48 animate-pulse rounded-xl border border-border-subtle bg-surface" />
      </div>
      <div className="h-64 animate-pulse rounded-xl border border-border-subtle bg-surface" />
    </div>
  );
}

function queryErrorMessage(error: unknown, fallback: string): string {
  if (isOperationsSessionTransientError(error)) {
    return "The API server is temporarily unavailable. Please wait a moment and retry.";
  }
  if (isAxiosError(error)) {
    if (error.response?.status === 401) {
      return "Your session expired. Please refresh or sign in again.";
    }
    if (error.response?.status === 404) {
      return "Placement not found.";
    }
    if (error.response?.status === 403) {
      return "You do not have permission to view this placement.";
    }
    if (error.response?.status === 409) {
      const conflict = error.response?.data?.message;
      if (typeof conflict === "string" && conflict.trim()) {
        return conflict;
      }
      return "Joining status was already updated. Refresh and try again.";
    }
    const message = error.response?.data?.message;
    if (typeof message === "string" && message.trim()) {
      return message;
    }
  }
  if (error instanceof Error && error.message.trim()) {
    return error.message;
  }
  return fallback;
}

export function OperationsPlacementDetailPage() {
  const { placementId: rawId } = useParams<{ placementId: string }>();
  const placementId = rawId ? decodeURIComponent(rawId) : undefined;
  const [actionError, setActionError] = useState<string | null>(null);
  const [remarks, setRemarks] = useState("");

  const detailQuery = useOperationsPlacementDetail(placementId);
  const updateMutation = useUpdateOperationsPlacementJoining(placementId);
  const placement = detailQuery.data;

  const handleUpdateJoining = async (
    joiningStatus: "joined" | "did_not_join",
  ) => {
    if (!placementId) return;
    setActionError(null);
    try {
      await updateMutation.mutateAsync({
        joiningStatus,
        expectedStatus: "selected",
        remarks: remarks.trim(),
      });
      setRemarks("");
      void detailQuery.refetch();
    } catch (err) {
      setActionError(
        queryErrorMessage(err, "Failed to update joining status."),
      );
    }
  };

  const errorMessage = detailQuery.error
    ? queryErrorMessage(
        detailQuery.error,
        "Failed to load placement details.",
      )
    : null;

  return (
    <OperationsLayout
      title="Placement Detail"
      subtitle="Candidate, job, employer, offer, and joining timeline."
      headerVariant="command"
    >
      <div className="flex w-full min-w-0 flex-col gap-3 max-sm:gap-2">
        <nav
          aria-label="Breadcrumb"
          className="flex min-w-0 flex-wrap items-center gap-1.5 text-[11px] text-muted"
        >
          <Link
            to={OPERATIONS_ROUTES.HOME}
            className="font-medium hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
          >
            Home
          </Link>
          <span aria-hidden="true">›</span>
          <Link
            to={OPERATIONS_ROUTES.PLACEMENTS}
            className="font-medium hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
          >
            Placements
          </Link>
          <span aria-hidden="true">›</span>
          <span className="font-semibold text-foreground">
            {placement?.displayId || "Detail"}
          </span>
        </nav>

        <div>
          <Link
            to={OPERATIONS_ROUTES.PLACEMENTS_LIST}
            className="inline-flex items-center gap-1.5 text-[12px] font-semibold text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
          >
            <ArrowLeft className="size-3.5" aria-hidden="true" />
            Back to list
          </Link>
        </div>

        {detailQuery.isLoading && !placement ? <DetailSkeleton /> : null}

        {errorMessage && !placement ? (
          <div className="rounded-xl border border-danger/20 bg-danger/5 px-4 py-6 text-center">
            <p className="text-sm text-danger">{errorMessage}</p>
            <button
              type="button"
              className="mt-3 text-sm font-semibold text-primary underline"
              onClick={() => void detailQuery.refetch()}
            >
              Retry
            </button>
          </div>
        ) : null}

        {placement ? (
          <>
            <section className="rounded-xl border border-border-subtle bg-surface p-4 shadow-sm max-sm:p-3">
              <div className="flex min-w-0 flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="flex min-w-0 items-start gap-3">
                  <span className="inline-flex size-12 shrink-0 items-center justify-center rounded-full bg-primary-light text-sm font-semibold text-primary">
                    {placementCandidateInitials(placement.candidateName)}
                  </span>
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h1 className="text-lg font-bold text-foreground max-sm:text-base">
                        {placement.candidateName || "—"}
                      </h1>
                      <OperationsBadge
                        variant={placementJoiningStatusBadgeVariant(
                          placement.joiningStatus,
                        )}
                      >
                        {placement.statusLabel}
                      </OperationsBadge>
                    </div>
                    <p className="mt-1 text-xs text-muted">
                      {placement.displayId} · {placement.jobRole || "—"} at{" "}
                      {placement.company || "—"}
                    </p>
                    <p className="mt-1 flex items-center gap-1 text-[11px] text-muted">
                      <MapPin className="size-3" aria-hidden="true" />
                      {placement.location || "Not specified"}
                    </p>
                  </div>
                </div>

                {placement.canUpdateJoining ? (
                  <OperationsCanKey permissionKey="placements.detail.actions.update_joining">
                    <div className="flex min-w-0 flex-col gap-2 sm:items-end">
                      <label className="block w-full max-w-xs">
                        <span className="sr-only">Remarks</span>
                        <input
                          type="text"
                          value={remarks}
                          onChange={(event) => setRemarks(event.target.value)}
                          placeholder="Optional remarks"
                          className="h-8 w-full rounded-md border border-border-subtle bg-surface px-2.5 text-[11px] outline-none focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/30"
                        />
                      </label>
                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          disabled={updateMutation.isPending}
                          onClick={() => void handleUpdateJoining("joined")}
                          className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-success px-3 text-[11px] font-semibold text-surface hover:bg-success/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-success/30 disabled:opacity-60"
                        >
                          <CheckCircle2
                            className="size-3.5"
                            aria-hidden="true"
                          />
                          Joined
                        </button>
                        <button
                          type="button"
                          disabled={updateMutation.isPending}
                          onClick={() =>
                            void handleUpdateJoining("did_not_join")
                          }
                          className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-danger px-3 text-[11px] font-semibold text-surface hover:bg-danger/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-danger/30 disabled:opacity-60"
                        >
                          <UserX className="size-3.5" aria-hidden="true" />
                          Did Not Join
                        </button>
                      </div>
                      {actionError ? (
                        <p className="text-[11px] text-danger" role="alert">
                          {actionError}
                        </p>
                      ) : null}
                    </div>
                  </OperationsCanKey>
                ) : null}
              </div>
            </section>

            <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
              <section className="rounded-xl border border-border-subtle bg-surface p-3.5 shadow-sm">
                <h2 className="mb-2 flex items-center gap-1.5 text-[12px] font-semibold text-foreground">
                  <User className="size-3.5 text-primary" aria-hidden="true" />
                  Candidate
                </h2>
                <dl className="space-y-1.5 text-[11px]">
                  <div>
                    <dt className="text-muted">Name</dt>
                    <dd className="font-medium text-foreground">
                      <Link
                        to={operationsCandidateDetailPath(
                          placement.jobSeekerId,
                        )}
                        className="text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
                      >
                        {placement.candidateName || "—"}
                      </Link>
                    </dd>
                  </div>
                  <div>
                    <dt className="text-muted">Phone</dt>
                    <dd className="text-foreground">
                      {placement.candidatePhone || "—"}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-muted">Email</dt>
                    <dd className="truncate text-foreground">
                      {placement.candidateEmail || "—"}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-muted">Location</dt>
                    <dd className="text-foreground">
                      {[placement.candidateCity, placement.candidateState]
                        .filter(Boolean)
                        .join(", ") || "—"}
                    </dd>
                  </div>
                </dl>
              </section>

              <section className="rounded-xl border border-border-subtle bg-surface p-3.5 shadow-sm">
                <h2 className="mb-2 flex items-center gap-1.5 text-[12px] font-semibold text-foreground">
                  <Briefcase
                    className="size-3.5 text-primary"
                    aria-hidden="true"
                  />
                  Job
                </h2>
                <dl className="space-y-1.5 text-[11px]">
                  <div>
                    <dt className="text-muted">Title</dt>
                    <dd className="font-medium text-foreground">
                      <Link
                        to={operationsJobDetailPath(placement.jobId)}
                        className="text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
                      >
                        {placement.jobTitle || placement.jobRole || "—"}
                      </Link>
                    </dd>
                  </div>
                  <div>
                    <dt className="text-muted">Public Job ID</dt>
                    <dd className="text-foreground">
                      {placement.publicJobId || "—"}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-muted">Category</dt>
                    <dd className="text-foreground">
                      {placement.category || "—"}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-muted">Location</dt>
                    <dd className="text-foreground">
                      {placement.jobLocation || "—"}
                    </dd>
                  </div>
                </dl>
              </section>

              <section className="rounded-xl border border-border-subtle bg-surface p-3.5 shadow-sm">
                <h2 className="mb-2 flex items-center gap-1.5 text-[12px] font-semibold text-foreground">
                  <Building2
                    className="size-3.5 text-primary"
                    aria-hidden="true"
                  />
                  Employer
                </h2>
                <div className="mb-2 flex items-center gap-2">
                  <span className="inline-flex size-8 shrink-0 items-center justify-center overflow-hidden rounded-full bg-primary-light text-[10px] font-semibold text-primary">
                    {resolveMediaUrl(placement.employerLogoUrl) ? (
                      <img
                        src={resolveMediaUrl(placement.employerLogoUrl)}
                        alt=""
                        className="size-full object-cover"
                      />
                    ) : (
                      placementCandidateInitials(
                        placement.employerName || placement.company,
                      )
                    )}
                  </span>
                  <Link
                    to={operationsEmployerDetailPath(placement.employerId)}
                    className="truncate text-[12px] font-semibold text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
                  >
                    {placement.employerName || placement.company || "—"}
                  </Link>
                </div>
                <dl className="space-y-1.5 text-[11px]">
                  <div>
                    <dt className="text-muted">Phone</dt>
                    <dd className="text-foreground">
                      {placement.employerPhone || "—"}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-muted">Email</dt>
                    <dd className="truncate text-foreground">
                      {placement.employerEmail || "—"}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-muted">Verified</dt>
                    <dd className="text-foreground">
                      {placement.employerVerified ? "Yes" : "No"}
                    </dd>
                  </div>
                </dl>
              </section>

              <section className="rounded-xl border border-border-subtle bg-surface p-3.5 shadow-sm">
                <h2 className="mb-2 flex items-center gap-1.5 text-[12px] font-semibold text-foreground">
                  <CalendarDays
                    className="size-3.5 text-primary"
                    aria-hidden="true"
                  />
                  Offer
                </h2>
                {placement.offer ? (
                  <dl className="space-y-1.5 text-[11px]">
                    <div>
                      <dt className="text-muted">Offer date</dt>
                      <dd className="text-foreground">
                        {formatEmployerDateTimeFull(placement.offer.offerDate)}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-muted">Joining date</dt>
                      <dd className="text-foreground">
                        {formatEmployerDateTimeFull(
                          placement.offer.joiningDate,
                        )}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-muted">Package</dt>
                      <dd className="text-foreground">
                        {placement.offer.packageText || "—"}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-muted">Notes</dt>
                      <dd className="text-foreground">
                        {placement.offer.notes || "—"}
                      </dd>
                    </div>
                    {placement.daysToJoin != null ? (
                      <div>
                        <dt className="text-muted">Days to join</dt>
                        <dd className="font-semibold tabular-nums text-foreground">
                          {placement.daysToJoin}
                        </dd>
                      </div>
                    ) : null}
                  </dl>
                ) : (
                  <p className="text-[11px] text-muted">No offer details.</p>
                )}
              </section>
            </div>

            <section className="rounded-xl border border-border-subtle bg-surface p-4 shadow-sm max-sm:p-3">
              <h2 className="mb-3 text-[13px] font-semibold text-foreground">
                Timeline
              </h2>
              {placement.timeline.length === 0 ? (
                <p className="text-xs text-muted">No timeline events yet.</p>
              ) : (
                <ol className="relative space-y-3 border-l border-border-subtle pl-4">
                  {placement.timeline.map((entry, index) => (
                    <li key={`${entry.status}-${entry.at}-${index}`} className="relative">
                      <span
                        className="absolute -left-[1.3rem] top-1 size-2.5 rounded-full bg-primary"
                        aria-hidden="true"
                      />
                      <div className="flex min-w-0 flex-wrap items-center gap-2">
                        <p className="text-[12px] font-semibold text-foreground">
                          {entry.statusLabel || entry.status}
                        </p>
                        {entry.joiningStatus ? (
                          <OperationsBadge
                            variant={placementJoiningStatusBadgeVariant(
                              entry.joiningStatus,
                            )}
                          >
                            {entry.joiningStatus.replaceAll("_", " ")}
                          </OperationsBadge>
                        ) : null}
                      </div>
                      <p className="mt-0.5 text-[11px] text-muted">
                        {formatEmployerDateTimeFull(entry.at)} ·{" "}
                        {entry.actorType || "system"}
                      </p>
                      {entry.remark ? (
                        <p className="mt-1 text-[11px] text-foreground">
                          {entry.remark}
                        </p>
                      ) : null}
                    </li>
                  ))}
                </ol>
              )}
            </section>
          </>
        ) : null}
      </div>
    </OperationsLayout>
  );
}
