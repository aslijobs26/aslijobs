import { isAxiosError } from "axios";
import {
  ArrowLeft,
  CheckCircle2,
  ShieldAlert,
  ShieldCheck,
} from "lucide-react";
import { useId, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { OperationsCanKey } from "../components/operations/auth/OperationsCanKey";
import { EmployerDocumentsPanel } from "../components/operations/employers/detail/EmployerDocumentsPanel";
import { EmployerOverviewPanel } from "../components/operations/employers/detail/EmployerOverviewPanel";
import {
  employerAvatarInitials,
  formatEmployerDateTimeFull,
  formatEmployerDisplayId,
  verificationStatusBadgeVariant,
} from "../components/operations/employers/employers-format";
import { OperationsLayout } from "../components/operations/layout/OperationsLayout";
import { OperationsBadge } from "../components/ui/OperationsBadge";
import { OPERATIONS_ROUTES } from "../constants/operations-routes";
import {
  useOperationsEmployerDetail,
  useUpdateOperationsEmployerVerification,
} from "../hooks/use-operations-employers";
import { isOperationsSessionTransientError } from "../utils/operations-session-errors";
import { resolveMediaUrl } from "../utils/resolve-media-url";

function ReviewSkeleton() {
  return (
    <div className="flex w-full min-w-0 flex-col gap-3" aria-busy="true">
      <div className="h-28 animate-pulse rounded-xl border border-border-subtle bg-surface" />
      <div className="h-40 animate-pulse rounded-xl border border-border-subtle bg-surface" />
      <div className="h-72 animate-pulse rounded-xl border border-border-subtle bg-surface" />
    </div>
  );
}

export function OperationsVerificationReviewPage() {
  const { employerId: rawId } = useParams<{ employerId: string }>();
  const employerId = rawId ? decodeURIComponent(rawId) : undefined;
  const navigate = useNavigate();
  const approveTitleId = useId();
  const rejectTitleId = useId();

  const [actionType, setActionType] = useState<"approve" | "reject" | null>(
    null,
  );
  const [rejectReason, setRejectReason] = useState("");
  const [actionError, setActionError] = useState<string | null>(null);

  const detailQuery = useOperationsEmployerDetail(employerId);
  const verifyMutation = useUpdateOperationsEmployerVerification(employerId);
  const employer = detailQuery.data;

  const closeModal = () => {
    setActionType(null);
    setRejectReason("");
    setActionError(null);
  };

  const handleApprove = async () => {
    if (!employerId) return;
    setActionError(null);
    try {
      await verifyMutation.mutateAsync({
        verificationStatus: "verified",
      });
      closeModal();
      void detailQuery.refetch();
    } catch (err) {
      if (isAxiosError(err)) {
        setActionError(
          err.response?.data?.message || "Approval failed. Please try again.",
        );
      } else {
        setActionError("Approval failed. Please try again.");
      }
    }
  };

  const handleReject = async () => {
    if (!employerId) return;
    const trimmed = rejectReason.trim();
    if (trimmed.length < 3) {
      setActionError("Please provide a rejection reason (at least 3 characters).");
      return;
    }
    setActionError(null);
    try {
      await verifyMutation.mutateAsync({
        verificationStatus: "rejected",
        remarks: trimmed,
      });
      closeModal();
      void detailQuery.refetch();
    } catch (err) {
      if (isAxiosError(err)) {
        setActionError(
          err.response?.data?.message || "Rejection failed. Please try again.",
        );
      } else {
        setActionError("Rejection failed. Please try again.");
      }
    }
  };

  const errorMessage = (() => {
    if (!detailQuery.error) return null;
    if (isOperationsSessionTransientError(detailQuery.error)) {
      return "The API server is temporarily unavailable. Please wait a moment and retry.";
    }
    if (isAxiosError(detailQuery.error)) {
      const msg = detailQuery.error.response?.data?.message;
      if (typeof msg === "string" && msg.trim()) return msg;
      if (detailQuery.error.response?.status === 404) {
        return "This employer could not be found.";
      }
    }
    return "Failed to load employer verification details.";
  })();

  const logoUrl = employer ? resolveMediaUrl(employer.logoUrl) : null;
  const submittedOn = employer
    ? formatEmployerDateTimeFull(
        employer.verificationSubmittedAt || employer.registeredAt,
      )
    : "—";
  const accountTypeLabel = employer?.accountType
    ? employer.accountType.charAt(0).toUpperCase() +
      employer.accountType.slice(1).toLowerCase()
    : employer?.organizationType || "—";
  const canApprove = employer?.verificationStatus !== "verified";
  const canReject = employer?.verificationStatus !== "rejected";

  return (
    <OperationsLayout
      title={employer?.displayName ?? "Verification Review"}
      subtitle="Verifications > Review"
    >
      <div className="flex w-full min-w-0 flex-col gap-3">
        {detailQuery.isLoading && !employer ? (
          <ReviewSkeleton />
        ) : errorMessage ? (
          <div className="rounded-xl border border-border-subtle bg-surface p-8 text-center">
            <p className="text-sm font-medium text-danger">{errorMessage}</p>
            <button
              type="button"
              onClick={() => void detailQuery.refetch()}
              className="mt-3 inline-flex h-8 items-center rounded-lg bg-primary-light px-3 text-xs font-semibold text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
            >
              Retry
            </button>
          </div>
        ) : employer ? (
          <>
            <div className="rounded-xl border border-border-subtle bg-surface p-3.5 shadow-sm ops-brand-border-glow sm:p-5">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div className="flex min-w-0 items-start gap-3 sm:gap-3.5">
                  <Link
                    to={OPERATIONS_ROUTES.VERIFICATIONS}
                    aria-label="Back to Verifications"
                    className="inline-flex size-8 shrink-0 items-center justify-center rounded-lg border border-border-subtle text-muted transition-colors hover:bg-hero-bg/60 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 sm:size-9"
                  >
                    <ArrowLeft className="size-4" aria-hidden="true" />
                  </Link>

                  <span className="inline-flex size-12 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-primary-light text-sm font-bold text-primary sm:size-14">
                    {logoUrl ? (
                      <img
                        src={logoUrl}
                        alt=""
                        className="size-full object-cover"
                      />
                    ) : (
                      employerAvatarInitials(employer.displayName)
                    )}
                  </span>

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                      <h1 className="break-words text-base font-bold text-foreground sm:text-lg">
                        {employer.displayName}
                      </h1>
                      <span className="font-mono text-[11px] font-semibold text-muted sm:text-xs">
                        {formatEmployerDisplayId(employer.id)}
                      </span>
                      <OperationsBadge
                        variant={verificationStatusBadgeVariant(
                          employer.verificationStatus,
                        )}
                      >
                        {employer.verificationStatusLabel}
                      </OperationsBadge>
                    </div>

                    <dl className="mt-2 grid gap-1.5 text-xs text-muted sm:grid-cols-2 lg:grid-cols-3">
                      <div>
                        <dt className="text-[10px] uppercase tracking-wide">
                          Account Type
                        </dt>
                        <dd className="font-semibold text-foreground">
                          {accountTypeLabel}
                        </dd>
                      </div>
                      <div>
                        <dt className="text-[10px] uppercase tracking-wide">
                          Submitted On
                        </dt>
                        <dd className="font-semibold text-foreground">
                          {submittedOn}
                        </dd>
                      </div>
                      {employer.location && employer.location !== "—" ? (
                        <div>
                          <dt className="text-[10px] uppercase tracking-wide">
                            Location
                          </dt>
                          <dd className="font-semibold text-foreground">
                            {employer.location}
                          </dd>
                        </div>
                      ) : null}
                      {employer.verificationStatus === "verified" &&
                      employer.verifiedByLabel ? (
                        <div>
                          <dt className="text-[10px] uppercase tracking-wide">
                            Verified By
                          </dt>
                          <dd className="font-semibold text-foreground">
                            {employer.verifiedByLabel}
                            {employer.verifiedAtDate &&
                            employer.verifiedAtDate !== "—"
                              ? ` · ${employer.verifiedAtDate}`
                              : ""}
                          </dd>
                        </div>
                      ) : null}
                      {employer.verificationStatus === "rejected" &&
                      employer.rejectedByLabel ? (
                        <div>
                          <dt className="text-[10px] uppercase tracking-wide">
                            Rejected By
                          </dt>
                          <dd className="font-semibold text-foreground">
                            {employer.rejectedByLabel}
                            {employer.rejectedAt
                              ? ` · ${formatEmployerDateTimeFull(employer.rejectedAt)}`
                              : ""}
                          </dd>
                        </div>
                      ) : null}
                    </dl>

                    {employer.verificationStatus === "rejected" &&
                    employer.verificationRemarks?.trim() ? (
                      <div className="mt-3 rounded-lg border border-danger/20 bg-danger/5 px-3 py-2">
                        <p className="text-[10px] font-semibold uppercase tracking-wide text-danger">
                          Previous rejection reason
                        </p>
                        <p className="mt-1 text-xs text-foreground whitespace-pre-wrap">
                          {employer.verificationRemarks}
                        </p>
                      </div>
                    ) : null}
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-border-subtle bg-surface p-4 shadow-sm sm:p-5">
              <h2 className="text-xs font-bold uppercase tracking-wider text-foreground">
                Verification Decision
              </h2>
              <p className="mt-1 text-xs text-muted">
                Approve or reject this employer after reviewing their profile and
                documents.
              </p>

              <div className="mt-3 flex flex-col gap-2 min-[420px]:flex-row">
                <OperationsCanKey permissionKey="employers.profile.actions.verify">
                  {canApprove ? (
                    <button
                      type="button"
                      onClick={() => {
                        setActionType("approve");
                        setActionError(null);
                      }}
                      className="inline-flex h-9 items-center justify-center gap-1.5 rounded-lg bg-success px-3.5 text-xs font-semibold text-white shadow-sm transition-colors hover:bg-success/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-success/30"
                    >
                      <ShieldCheck className="size-3.5" aria-hidden="true" />
                      Approve
                    </button>
                  ) : null}
                </OperationsCanKey>

                <OperationsCanKey permissionKey="employers.profile.actions.reject">
                  {canReject ? (
                    <button
                      type="button"
                      onClick={() => {
                        setActionType("reject");
                        setRejectReason("");
                        setActionError(null);
                      }}
                      className="inline-flex h-9 items-center justify-center gap-1.5 rounded-lg border border-danger/30 bg-danger/10 px-3 text-xs font-semibold text-danger transition-colors hover:bg-danger/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-danger/30"
                    >
                      <ShieldAlert className="size-3.5" aria-hidden="true" />
                      Reject
                    </button>
                  ) : null}
                </OperationsCanKey>

                <button
                  type="button"
                  onClick={() => navigate(OPERATIONS_ROUTES.VERIFICATIONS)}
                  className="inline-flex h-9 items-center justify-center rounded-lg border border-border-subtle bg-surface px-3 text-xs font-semibold text-muted hover:bg-hero-bg/60 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
                >
                  Back to list
                </button>
              </div>
            </div>

            <EmployerOverviewPanel employer={employer} />

            <EmployerDocumentsPanel
              documents={employer.documents}
              employerId={employer.id}
            />
          </>
        ) : null}
      </div>

      {actionType === "approve" && employer ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-3 sm:p-4 backdrop-blur-xs"
          role="dialog"
          aria-modal="true"
          aria-labelledby={approveTitleId}
        >
          <div className="w-full max-w-md rounded-xl border border-border-subtle bg-surface p-4 shadow-xl sm:p-5">
            <h3
              id={approveTitleId}
              className="text-sm font-bold text-foreground"
            >
              Approve Employer Verification
            </h3>
            <p className="mt-2 text-xs text-muted">
              Are you sure you want to approve verification for{" "}
              {employer.displayName}? Their account will be marked as verified.
            </p>
            {actionError ? (
              <p className="mt-2 text-xs text-danger" role="alert">
                {actionError}
              </p>
            ) : null}
            <div className="mt-4 flex flex-col-reverse items-center justify-end gap-2 sm:flex-row">
              <button
                type="button"
                onClick={closeModal}
                disabled={verifyMutation.isPending}
                className="w-full rounded-lg border border-border-subtle bg-surface px-3 py-1.5 text-xs font-semibold text-muted hover:bg-hero-bg/60 hover:text-foreground sm:w-auto"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => void handleApprove()}
                disabled={verifyMutation.isPending}
                className="inline-flex w-full items-center justify-center gap-1.5 rounded-lg bg-success px-3 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-success/90 sm:w-auto"
              >
                <CheckCircle2 className="size-3.5" aria-hidden="true" />
                {verifyMutation.isPending ? "Approving…" : "Confirm Approve"}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {actionType === "reject" && employer ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-3 sm:p-4 backdrop-blur-xs"
          role="dialog"
          aria-modal="true"
          aria-labelledby={rejectTitleId}
        >
          <div className="w-full max-w-md rounded-xl border border-border-subtle bg-surface p-4 shadow-xl sm:p-5">
            <h3 id={rejectTitleId} className="text-sm font-bold text-foreground">
              Reject Verification
            </h3>
            <p className="mt-2 text-xs text-muted">
              Provide a reason for rejecting verification for{" "}
              {employer.displayName}. This will be visible to the operations
              team.
            </p>
            <div className="mt-3">
              <label
                htmlFor="verification-reject-reason"
                className="mb-1 block text-[11px] font-semibold text-muted"
              >
                Rejection reason <span className="text-danger">*</span>
              </label>
              <textarea
                id="verification-reject-reason"
                value={rejectReason}
                onChange={(event) => setRejectReason(event.target.value)}
                placeholder="Enter rejection reason (min. 3 characters)…"
                rows={4}
                required
                minLength={3}
                className="w-full rounded-lg border border-border-subtle bg-hero-bg/60 p-2 text-xs text-foreground outline-none focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/30"
              />
            </div>
            {actionError ? (
              <p className="mt-2 text-xs text-danger" role="alert">
                {actionError}
              </p>
            ) : null}
            <div className="mt-4 flex flex-col-reverse items-center justify-end gap-2 sm:flex-row">
              <button
                type="button"
                onClick={closeModal}
                disabled={verifyMutation.isPending}
                className="w-full rounded-lg border border-border-subtle bg-surface px-3 py-1.5 text-xs font-semibold text-muted hover:bg-hero-bg/60 hover:text-foreground sm:w-auto"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => void handleReject()}
                disabled={
                  verifyMutation.isPending || rejectReason.trim().length < 3
                }
                className="w-full rounded-lg bg-danger px-3 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-danger/90 disabled:opacity-60 sm:w-auto"
              >
                {verifyMutation.isPending
                  ? "Rejecting…"
                  : "Reject Verification"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </OperationsLayout>
  );
}
