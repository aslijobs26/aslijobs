import { isAxiosError } from "axios";
import {
  CheckCircle2,
  FileWarning,
  ShieldAlert,
  ShieldCheck,
} from "lucide-react";
import { useCallback, useId, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { OperationsCanKey } from "../components/operations/auth/OperationsCanKey";
import { EmployerDocumentsPanel } from "../components/operations/employers/detail/EmployerDocumentsPanel";
import { EmployerOverviewPanel } from "../components/operations/employers/detail/EmployerOverviewPanel";
import { OperationsLayout } from "../components/operations/layout/OperationsLayout";
import { VerificationReviewHeader } from "../components/operations/verifications/VerificationReviewHeader";
import { OPERATIONS_ROUTES } from "../constants/operations-routes";
import { useOperationsEmployerDetail } from "../hooks/use-operations-employers";
import {
  useOperationsVerificationDetail,
  useRequestOperationsVerificationDocuments,
  useUpdateOperationsVerification,
} from "../hooks/use-operations-verifications";
import { fetchOperationsVerificationDocumentBlob } from "../services/operations-verifications.service";
import type { OperationsEmployerDocumentItem } from "../types/operations-employers";
import { isOperationsSessionTransientError } from "../utils/operations-session-errors";

function ReviewSkeleton() {
  return (
    <div className="flex w-full min-w-0 flex-col gap-3" aria-busy="true">
      <div className="h-28 animate-pulse rounded-xl border border-border-subtle bg-surface" />
      <div className="h-40 animate-pulse rounded-xl border border-border-subtle bg-surface" />
      <div className="h-72 animate-pulse rounded-xl border border-border-subtle bg-surface" />
    </div>
  );
}

function mapVerificationDocuments(
  documents: Array<{
    id: string;
    documentType: string;
    documentTypeLabel: string;
    fileName: string;
    mimeType: string;
    fileSize: number;
    verificationStatus: string;
    uploadedAt: string | null;
    url: string;
  }>,
): OperationsEmployerDocumentItem[] {
  return documents.map((doc) => ({
    id: doc.id,
    documentType: doc.documentType,
    documentTypeLabel: doc.documentTypeLabel,
    originalName: doc.fileName,
    url: doc.url,
    mimeType: doc.mimeType,
    fileSize: doc.fileSize,
    verificationStatus: doc.verificationStatus,
    uploadedAt: doc.uploadedAt ?? "",
  }));
}

export function OperationsVerificationReviewPage() {
  const { employerId: rawId } = useParams<{ employerId: string }>();
  const verificationId = rawId ? decodeURIComponent(rawId) : undefined;
  const navigate = useNavigate();
  const approveTitleId = useId();
  const rejectTitleId = useId();
  const requestDocsTitleId = useId();

  const [actionType, setActionType] = useState<
    "approve" | "reject" | "requestDocs" | null
  >(null);
  const [rejectReason, setRejectReason] = useState("");
  const [requestMessage, setRequestMessage] = useState("");
  const [actionError, setActionError] = useState<string | null>(null);

  const detailQuery = useOperationsVerificationDetail(verificationId);
  const employerOverviewQuery = useOperationsEmployerDetail(verificationId);
  const verifyMutation = useUpdateOperationsVerification(verificationId);
  const requestDocsMutation =
    useRequestOperationsVerificationDocuments(verificationId);
  const verification = detailQuery.data;

  const mappedDocuments = useMemo(
    () =>
      verification
        ? mapVerificationDocuments(verification.documents)
        : [],
    [verification],
  );

  const fetchVerificationDocumentBlob = useCallback(
    (documentId: string) => {
      const id = verification?.id;
      if (!id) {
        return Promise.reject(new Error("Verification not found."));
      }
      return fetchOperationsVerificationDocumentBlob(id, documentId);
    },
    [verification?.id],
  );

  const closeModal = () => {
    setActionType(null);
    setRejectReason("");
    setRequestMessage("");
    setActionError(null);
  };

  const handleApprove = async () => {
    if (!verificationId) return;
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
    if (!verificationId) return;
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

  const handleRequestDocuments = async () => {
    if (!verificationId) return;
    const trimmed = requestMessage.trim();
    if (trimmed.length < 3) {
      setActionError(
        "Please provide a message for the employer (at least 3 characters).",
      );
      return;
    }
    setActionError(null);
    try {
      await requestDocsMutation.mutateAsync({ message: trimmed });
      closeModal();
      void detailQuery.refetch();
    } catch (err) {
      if (isAxiosError(err)) {
        setActionError(
          err.response?.data?.message ||
            "Failed to request documents. Please try again.",
        );
      } else {
        setActionError("Failed to request documents. Please try again.");
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
        return "This verification could not be found.";
      }
    }
    return "Failed to load verification details.";
  })();

  const canApprove = Boolean(verification?.allowedActions.canApprove);
  const canReject = Boolean(verification?.allowedActions.canReject);
  const canRequestDocuments = Boolean(
    verification?.allowedActions.canRequestDocuments,
  );
  const isActionPending =
    verifyMutation.isPending || requestDocsMutation.isPending;

  return (
    <OperationsLayout
      title={verification?.displayName ?? "Verification Review"}
      subtitle="Verifications > Review"
    >
      <div className="flex w-full min-w-0 flex-col gap-3">
        {detailQuery.isLoading && !verification ? (
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
        ) : verification ? (
          <>
            <VerificationReviewHeader verification={verification} />

            <div className="rounded-xl border border-border-subtle bg-surface p-4 shadow-sm sm:p-5">
              <h2 className="text-xs font-bold uppercase tracking-wider text-foreground">
                Verification Decision
              </h2>
              <p className="mt-1 text-xs text-muted">
                Approve or reject this employer after reviewing their profile and
                documents.
              </p>

              <div className="mt-3 flex flex-col gap-2 min-[420px]:flex-row min-[420px]:flex-wrap">
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

                <OperationsCanKey permissionKey="employers.profile.actions.reject">
                  {canRequestDocuments ? (
                    <button
                      type="button"
                      onClick={() => {
                        setActionType("requestDocs");
                        setRequestMessage("");
                        setActionError(null);
                      }}
                      className="inline-flex h-9 items-center justify-center gap-1.5 rounded-lg border border-warning/30 bg-warning/10 px-3 text-xs font-semibold text-warning transition-colors hover:bg-warning/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-warning/30"
                    >
                      <FileWarning className="size-3.5" aria-hidden="true" />
                      Request Additional Documents
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

            {employerOverviewQuery.data ? (
              <EmployerOverviewPanel employer={employerOverviewQuery.data} />
            ) : null}

            <EmployerDocumentsPanel
              documents={mappedDocuments}
              employerId={verification.id}
              fetchDocumentBlob={fetchVerificationDocumentBlob}
            />
          </>
        ) : null}
      </div>

      {actionType === "approve" && verification ? (
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
              {verification.displayName}? Their account will be marked as
              verified.
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
                disabled={isActionPending}
                className="w-full rounded-lg border border-border-subtle bg-surface px-3 py-1.5 text-xs font-semibold text-muted hover:bg-hero-bg/60 hover:text-foreground sm:w-auto"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => void handleApprove()}
                disabled={isActionPending}
                className="inline-flex w-full items-center justify-center gap-1.5 rounded-lg bg-success px-3 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-success/90 sm:w-auto"
              >
                <CheckCircle2 className="size-3.5" aria-hidden="true" />
                {verifyMutation.isPending ? "Approving…" : "Confirm Approve"}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {actionType === "reject" && verification ? (
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
              {verification.displayName}. This will be visible to the operations
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
                disabled={isActionPending}
                className="w-full rounded-lg border border-border-subtle bg-surface px-3 py-1.5 text-xs font-semibold text-muted hover:bg-hero-bg/60 hover:text-foreground sm:w-auto"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => void handleReject()}
                disabled={
                  isActionPending || rejectReason.trim().length < 3
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

      {actionType === "requestDocs" && verification ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-3 sm:p-4 backdrop-blur-xs"
          role="dialog"
          aria-modal="true"
          aria-labelledby={requestDocsTitleId}
        >
          <div className="w-full max-w-md rounded-xl border border-border-subtle bg-surface p-4 shadow-xl sm:p-5">
            <h3
              id={requestDocsTitleId}
              className="text-sm font-bold text-foreground"
            >
              Request Additional Documents
            </h3>
            <p className="mt-2 text-xs text-muted">
              Send a message to {verification.displayName} requesting any
              missing or clearer verification documents.
            </p>
            <div className="mt-3">
              <label
                htmlFor="verification-request-docs-message"
                className="mb-1 block text-[11px] font-semibold text-muted"
              >
                Message <span className="text-danger">*</span>
              </label>
              <textarea
                id="verification-request-docs-message"
                value={requestMessage}
                onChange={(event) => setRequestMessage(event.target.value)}
                placeholder="Describe which documents are needed (min. 3 characters)…"
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
                disabled={isActionPending}
                className="w-full rounded-lg border border-border-subtle bg-surface px-3 py-1.5 text-xs font-semibold text-muted hover:bg-hero-bg/60 hover:text-foreground sm:w-auto"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => void handleRequestDocuments()}
                disabled={
                  isActionPending || requestMessage.trim().length < 3
                }
                className="w-full rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-primary/90 disabled:opacity-60 sm:w-auto"
              >
                {requestDocsMutation.isPending
                  ? "Sending…"
                  : "Send Request"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </OperationsLayout>
  );
}
