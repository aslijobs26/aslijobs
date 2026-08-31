import { isAxiosError } from "axios";
import { useState } from "react";
import { useParams } from "react-router-dom";
import { EmployerActivityPanel } from "../components/operations/employers/detail/EmployerActivityPanel";
import { EmployerDetailHeader } from "../components/operations/employers/detail/EmployerDetailHeader";
import {
  EmployerDetailTabs,
  type EmployerDetailTabId,
} from "../components/operations/employers/detail/EmployerDetailTabs";
import { EmployerDocumentsPanel } from "../components/operations/employers/detail/EmployerDocumentsPanel";
import { EmployerJobsPanel } from "../components/operations/employers/detail/EmployerJobsPanel";
import { EmployerOverviewPanel } from "../components/operations/employers/detail/EmployerOverviewPanel";
import { OperationsLayout } from "../components/operations/layout/OperationsLayout";
import {
  useOperationsEmployerDetail,
  useUpdateOperationsEmployerStatus,
  useUpdateOperationsEmployerVerification,
} from "../hooks/use-operations-employers";
import { isOperationsSessionTransientError } from "../utils/operations-session-errors";

function EmployerDetailSkeleton() {
  return (
    <div className="flex w-full min-w-0 flex-col gap-3" aria-busy="true">
      <div className="h-36 animate-pulse rounded-xl border border-border-subtle bg-surface" />
      <div className="h-10 animate-pulse rounded-lg border border-border-subtle bg-surface" />
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="h-20 animate-pulse rounded-xl border border-border-subtle bg-surface"
          />
        ))}
      </div>
      <div className="grid gap-3 lg:grid-cols-2">
        <div className="h-72 animate-pulse rounded-xl border border-border-subtle bg-surface" />
        <div className="h-72 animate-pulse rounded-xl border border-border-subtle bg-surface" />
      </div>
    </div>
  );
}

export function OperationsEmployersDetailPage() {
  const { employerId: rawId } = useParams<{ employerId: string }>();
  const employerId = rawId ? decodeURIComponent(rawId) : undefined;
  const [activeTab, setActiveTab] = useState<EmployerDetailTabId>("overview");

  // Action Modals State
  const [actionType, setActionType] = useState<
    "verify" | "reject" | "suspend" | "activate" | null
  >(null);
  const [actionReason, setActionReason] = useState("");
  const [actionError, setActionError] = useState<string | null>(null);

  const detailQuery = useOperationsEmployerDetail(employerId);
  const verifyMutation = useUpdateOperationsEmployerVerification(employerId);
  const statusMutation = useUpdateOperationsEmployerStatus(employerId);

  const employer = detailQuery.data;

  const handleOpenVerify = () => {
    setActionType("verify");
    setActionReason("");
    setActionError(null);
  };

  const handleOpenReject = () => {
    setActionType("reject");
    setActionReason("");
    setActionError(null);
  };

  const handleOpenToggleStatus = () => {
    if (!employer) return;
    setActionType(employer.status === "suspended" ? "activate" : "suspend");
    setActionReason("");
    setActionError(null);
  };

  const handleCloseModal = () => {
    setActionType(null);
    setActionReason("");
    setActionError(null);
  };

  const handleExecuteAction = async () => {
    if (!employerId || !actionType) return;
    setActionError(null);

    try {
      if (actionType === "verify") {
        await verifyMutation.mutateAsync({
          verificationStatus: "verified",
          remarks: actionReason,
        });
      } else if (actionType === "reject") {
        await verifyMutation.mutateAsync({
          verificationStatus: "rejected",
          remarks: actionReason,
        });
      } else if (actionType === "suspend") {
        await statusMutation.mutateAsync({
          status: "suspended",
          reason: actionReason,
        });
      } else if (actionType === "activate") {
        await statusMutation.mutateAsync({
          status: "active",
          reason: actionReason,
        });
      }
      handleCloseModal();
    } catch (err) {
      if (isAxiosError(err)) {
        setActionError(
          err.response?.data?.message || "Action failed. Please try again.",
        );
      } else {
        setActionError("Action failed. Please try again.");
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
    return "Failed to load employer details.";
  })();

  return (
    <OperationsLayout
      title={employer?.displayName ?? "Employer Profile"}
      subtitle="Employers > Employer Profile"
    >
      <div className="flex w-full min-w-0 flex-col gap-3">
        {detailQuery.isLoading && !employer ? (
          <EmployerDetailSkeleton />
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
            <EmployerDetailHeader
              employer={employer}
              onVerify={handleOpenVerify}
              onReject={handleOpenReject}
              onToggleStatus={handleOpenToggleStatus}
            />

            <div className="overflow-hidden rounded-xl border border-border-subtle bg-surface shadow-sm">
              <EmployerDetailTabs
                activeTab={activeTab}
                jobsCount={employer.analytics.totalJobs}
                documentsCount={employer.documents.length}
                onTabChange={setActiveTab}
              />

              <div className="p-4 sm:p-5">
                {activeTab === "overview" && (
                  <EmployerOverviewPanel employer={employer} />
                )}
                {activeTab === "jobs" && (
                  <EmployerJobsPanel employerId={employer.id} />
                )}
                {activeTab === "documents" && (
                  <EmployerDocumentsPanel documents={employer.documents} />
                )}
                {activeTab === "activity" && (
                  <EmployerActivityPanel employer={employer} />
                )}
              </div>
            </div>
          </>
        ) : null}
      </div>

      {/* Confirmation Modal */}
      {actionType && employer ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-3 sm:p-4 backdrop-blur-xs"
          role="dialog"
          aria-modal="true"
        >
          <div className="w-full max-w-md rounded-xl border border-border-subtle bg-surface p-4 sm:p-5 shadow-xl animate-in fade-in-0 zoom-in-95">
            <h3 className="text-sm font-bold text-foreground">
              {actionType === "verify" && "Verify Employer"}
              {actionType === "reject" && "Reject Employer Verification"}
              {actionType === "suspend" && "Suspend Employer Account"}
              {actionType === "activate" && "Activate Employer Account"}
            </h3>

            <p className="mt-2 text-xs text-muted">
              {actionType === "verify" &&
                `Are you sure you want to verify ${employer.displayName}? Their documents will be marked as approved.`}
              {actionType === "reject" &&
                `Are you sure you want to reject verification for ${employer.displayName}?`}
              {actionType === "suspend" &&
                `Suspending ${employer.displayName} will prevent them from posting new jobs and accessing active listings.`}
              {actionType === "activate" &&
                `Are you sure you want to reactivate ${employer.displayName}?`}
            </p>

            {(actionType === "reject" || actionType === "suspend") && (
              <div className="mt-3">
                <label className="mb-1 block text-[11px] font-semibold text-muted">
                  Reason / Remarks
                </label>
                <textarea
                  value={actionReason}
                  onChange={(e) => setActionReason(e.target.value)}
                  placeholder="Enter reason for this action…"
                  rows={3}
                  className="w-full rounded-lg border border-border-subtle bg-hero-bg/60 p-2 text-xs text-foreground outline-none focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/30"
                />
              </div>
            )}

            {actionError ? (
              <p className="mt-2 text-xs text-danger">{actionError}</p>
            ) : null}

            <div className="mt-4 flex flex-col-reverse sm:flex-row items-center justify-end gap-2">
              <button
                type="button"
                onClick={handleCloseModal}
                disabled={
                  verifyMutation.isPending || statusMutation.isPending
                }
                className="w-full sm:w-auto rounded-lg border border-border-subtle bg-surface px-3 py-1.5 text-xs font-semibold text-muted hover:bg-hero-bg/60 hover:text-foreground"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleExecuteAction}
                disabled={
                  verifyMutation.isPending || statusMutation.isPending
                }
                className={`w-full sm:w-auto rounded-lg px-3 py-1.5 text-xs font-semibold text-white shadow-sm transition-colors ${
                  actionType === "reject" || actionType === "suspend"
                    ? "bg-danger hover:bg-danger/90"
                    : "bg-primary hover:bg-primary/90"
                }`}
              >
                {verifyMutation.isPending || statusMutation.isPending
                  ? "Processing…"
                  : "Confirm"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </OperationsLayout>
  );
}
