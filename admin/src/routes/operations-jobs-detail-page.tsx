import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Check } from "lucide-react";
import { CloseJobConfirmDialog } from "../components/operations/jobs/detail/CloseJobConfirmDialog";
import { JobActivityPanel } from "../components/operations/jobs/detail/JobActivityPanel";
import { JobApplicationsPanel } from "../components/operations/jobs/detail/JobApplicationsPanel";
import { JobChangeReviewPanel } from "../components/operations/jobs/detail/JobChangeReviewPanel";
import { JobDetailHeader } from "../components/operations/jobs/detail/JobDetailHeader";
import {
  JobDetailTabs,
  type JobDetailTabId,
} from "../components/operations/jobs/detail/JobDetailTabs";
import { JobOverviewPanel } from "../components/operations/jobs/detail/JobOverviewPanel";
import { JobPreviewPanel } from "../components/operations/jobs/detail/JobPreviewPanel";
import { OperationsLayout } from "../components/operations/layout/OperationsLayout";
import {
  OPERATIONS_ROUTES,
} from "../constants/operations-routes";
import {
  useOperationsJobApplications,
  useOperationsJobDetail,
  useUpdateOperationsJobStatus,
} from "../hooks/use-operations-job-detail";
import { isAxiosError } from "axios";

export function OperationsJobsDetailPage() {
  const { jobId: rawJobId } = useParams<{ jobId: string }>();
  const jobId = rawJobId ? decodeURIComponent(rawJobId) : undefined;
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<JobDetailTabId>("overview");
  const [applicationsPage, setApplicationsPage] = useState(1);
  const [applicationsLimit, setApplicationsLimit] = useState(10);
  const [closeDialogOpen, setCloseDialogOpen] = useState(false);
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [closeError, setCloseError] = useState<string | null>(null);
  const [rejectError, setRejectError] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const detailQuery = useOperationsJobDetail(jobId);
  const applicationsQuery = useOperationsJobApplications(jobId, {
    page: applicationsPage,
    limit: applicationsLimit,
  });
  const statusMutation = useUpdateOperationsJobStatus(jobId);

  const job = detailQuery.data;
  const applicationsPagination = applicationsQuery.data?.pagination ?? {
    page: applicationsPage,
    limit: applicationsLimit,
    total: 0,
    totalPages: 0,
    hasNextPage: false,
    hasPreviousPage: false,
  };
  const applicationsTotal =
    applicationsQuery.data?.pagination.total ?? job?.analytics.applications ?? 0;
  const errorMessage = useMemo(() => {
    if (!detailQuery.error) {
      return "Failed to load job details.";
    }

    if (isAxiosError(detailQuery.error)) {
      const message = detailQuery.error.response?.data?.message;
      if (typeof message === "string" && message.trim()) {
        return message;
      }

      if (detailQuery.error.response?.status === 404) {
        return "This job could not be found.";
      }
    }

    return "Failed to load job details.";
  }, [detailQuery.error]);

  const handleEdit = () => {
    if (!job) {
      return;
    }

    navigate(
      `${OPERATIONS_ROUTES.JOBS_POST}?edit=${encodeURIComponent(job.jobId)}`,
    );
  };

  const handleOpenCloseDialog = () => {
    if (!job || statusMutation.isPending) {
      return;
    }

    const canClose =
      (job.status !== "closed" &&
        job.status !== "draft" &&
        job.status !== "pending_approval") ||
      (job.status === "closed" &&
        !job.employerNotified &&
        Boolean(job.closedReason));

    if (!canClose) {
      return;
    }

    setCloseError(null);
    setCloseDialogOpen(true);
  };

  const handleApproveJob = () => {
    if (
      !job ||
      statusMutation.isPending ||
      (job.status !== "pending_approval" && !job.isLiveChangeReview)
    ) {
      return;
    }

    const confirmed = window.confirm(
      job.isLiveChangeReview
        ? `Approve and publish changes for job ${job.jobId}? The live listing will be updated and the employer will be notified.`
        : `Approve and publish job ${job.jobId}? It will become live for candidates and the employer will be notified.`,
    );
    if (!confirmed) {
      return;
    }

    statusMutation.mutate(
      { action: "approve" },
      {
        onSuccess: (result) => {
          setStatusMessage(
            result.message ||
              (job.isLiveChangeReview
                ? "Job changes approved and published successfully."
                : "Job approved and published successfully."),
          );
        },
        onError: (error) => {
          if (isAxiosError(error)) {
            const message = error.response?.data?.message;
            if (typeof message === "string" && message.trim()) {
              window.alert(message.trim());
              return;
            }
          }

          window.alert(
            job.isLiveChangeReview
              ? "Failed to approve these job changes."
              : "Failed to approve this job.",
          );
        },
      },
    );
  };

  const handleOpenRejectDialog = () => {
    if (
      !job ||
      statusMutation.isPending ||
      (job.status !== "pending_approval" && !job.isLiveChangeReview)
    ) {
      return;
    }

    setRejectError(null);
    setRejectDialogOpen(true);
  };

  const handleConfirmCloseJob = (reason: string) => {
    if (!job) {
      return;
    }

    statusMutation.mutate(
      { action: "close", reason },
      {
        onSuccess: (result) => {
          setCloseDialogOpen(false);
          setCloseError(null);
          setStatusMessage(
            result.message || "Job closed and employer notified successfully.",
          );
        },
        onError: (error) => {
          if (isAxiosError(error)) {
            const message = error.response?.data?.message;
            if (typeof message === "string" && message.trim()) {
              setCloseError(message.trim());
              return;
            }
          }

          setCloseError("Failed to close this job. Please try again.");
        },
      },
    );
  };

  const handleConfirmRejectJob = (reason: string) => {
    if (!job) {
      return;
    }

    statusMutation.mutate(
      { action: "reject", reason },
      {
        onSuccess: (result) => {
          setRejectDialogOpen(false);
          setRejectError(null);
          setStatusMessage(
            result.message || "Job rejected and employer notified successfully.",
          );
        },
        onError: (error) => {
          if (isAxiosError(error)) {
            const message = error.response?.data?.message;
            if (typeof message === "string" && message.trim()) {
              setRejectError(message.trim());
              return;
            }
          }

          setRejectError("Failed to reject this job. Please try again.");
        },
      },
    );
  };

  useEffect(() => {
    if (!statusMessage) {
      return;
    }

    const timer = window.setTimeout(() => {
      setStatusMessage(null);
    }, 3500);

    return () => window.clearTimeout(timer);
  }, [statusMessage]);

  return (
    <OperationsLayout
      title="Job Details"
      subtitle={job ? `${job.jobTitle} · ${job.jobId}` : "View complete job information."}
    >
      <div className="flex w-full min-w-0 flex-col gap-2.5">
        <div className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1 text-xs">
          <Link
            to={OPERATIONS_ROUTES.JOBS}
            className="inline-flex shrink-0 items-center gap-1.5 rounded-md px-1.5 py-1 font-semibold text-primary-soft transition-colors hover:bg-primary-light focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
          >
            <ArrowLeft className="size-3.5" aria-hidden="true" />
            Back to Jobs
          </Link>
          <span className="hidden text-muted sm:inline" aria-hidden="true">
            /
          </span>
          <span className="hidden text-muted sm:inline">Jobs</span>
          <span className="hidden text-muted sm:inline" aria-hidden="true">
            /
          </span>
          <span className="min-w-0 truncate font-medium text-foreground">Job Details</span>
        </div>

        {detailQuery.isLoading ? (
          <div className="rounded-xl border border-border-subtle bg-surface px-4 py-16 text-center shadow-sm">
            <p className="text-sm font-medium text-foreground">Loading job details…</p>
            <p className="mt-1 text-xs text-muted">Fetching listing, analytics, and applications.</p>
          </div>
        ) : null}

        {detailQuery.isError ? (
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

        {job ? (
          <>
            {job.status === "pending_approval" ? (
              <div className="rounded-lg border border-warning/30 bg-warning/10 px-3 py-2 text-xs text-warning">
                This employer-submitted job is waiting for Operations review
                before it can go Live.
              </div>
            ) : null}

            {job.isLiveChangeReview ? (
              <div className="rounded-lg border border-warning/30 bg-warning/10 px-3 py-2 text-xs text-warning">
                This is an edited live job. The current live listing stays
                public until you approve these changes.
              </div>
            ) : null}

            {job.status === "rejected" ? (
              <div className="rounded-lg border border-danger/30 bg-danger/10 px-3 py-2 text-xs text-danger">
                This job was rejected
                {job.rejectionReason ? `: ${job.rejectionReason}` : "."}
              </div>
            ) : null}

            {job.status === "active" &&
            job.liveChangeReviewStatus === "rejected" ? (
              <div className="rounded-lg border border-danger/30 bg-danger/10 px-3 py-2 text-xs text-danger">
                Live job changes were rejected
                {job.liveChangeRejectionReason
                  ? `: ${job.liveChangeRejectionReason}`
                  : "."}{" "}
                The live listing was not changed.
              </div>
            ) : null}

            {job.status === "draft" ||
            job.status === "expired" ||
            job.status === "paused" ||
            job.status === "closed" ? (
              <div className="rounded-lg border border-warning/30 bg-warning/10 px-3 py-2 text-xs text-warning">
                This job is currently <strong>{job.statusLabel}</strong>
                {job.analytics.daysRemaining != null &&
                job.analytics.daysRemaining < 0
                  ? " and past its listing expiry."
                  : "."}
              </div>
            ) : null}

            <JobDetailHeader
              job={job}
              isClosing={statusMutation.isPending && closeDialogOpen}
              isReviewing={
                statusMutation.isPending &&
                (rejectDialogOpen ||
                  job.status === "pending_approval" ||
                  Boolean(job.isLiveChangeReview))
              }
              onEdit={handleEdit}
              onCloseJob={handleOpenCloseDialog}
              onApproveJob={handleApproveJob}
              onRejectJob={handleOpenRejectDialog}
            />

            <div className="overflow-hidden rounded-xl border border-border-subtle bg-surface shadow-sm">
              <div className="px-2.5 sm:px-3.5">
                <JobDetailTabs
                  activeTab={activeTab}
                  applicationsCount={applicationsTotal}
                  onChange={setActiveTab}
                />
              </div>

              <div className="p-2.5 sm:p-3.5">
                {activeTab === "overview" ? (
                  <div className="flex flex-col gap-2.5">
                    {job.isLiveChangeReview ||
                    (job.liveChangeReviewStatus === "rejected" &&
                      job.pendingLiveRevision) ? (
                      <JobChangeReviewPanel job={job} />
                    ) : null}
                    <JobOverviewPanel
                      job={job}
                      isClosing={statusMutation.isPending}
                      onCloseJob={handleOpenCloseDialog}
                    />
                    <JobApplicationsPanel
                      applications={applicationsQuery.data?.applications ?? []}
                      total={applicationsTotal}
                      pagination={applicationsPagination}
                      isLoading={applicationsQuery.isLoading}
                      isError={applicationsQuery.isError}
                      onPageChange={setApplicationsPage}
                      onLimitChange={(nextLimit) => {
                        setApplicationsLimit(nextLimit);
                        setApplicationsPage(1);
                      }}
                      onRetry={() => void applicationsQuery.refetch()}
                      onViewAll={() => setActiveTab("applications")}
                    />
                  </div>
                ) : null}

                {activeTab === "applications" ? (
                  <JobApplicationsPanel
                    applications={applicationsQuery.data?.applications ?? []}
                    total={applicationsTotal}
                    pagination={applicationsPagination}
                    isLoading={applicationsQuery.isLoading}
                    isError={applicationsQuery.isError}
                    onPageChange={setApplicationsPage}
                    onLimitChange={(nextLimit) => {
                      setApplicationsLimit(nextLimit);
                      setApplicationsPage(1);
                    }}
                    onRetry={() => void applicationsQuery.refetch()}
                    onViewAll={() => setActiveTab("applications")}
                  />
                ) : null}

                {activeTab === "activity" ? (
                  <JobActivityPanel activity={job.activity} />
                ) : null}

                {activeTab === "preview" ? <JobPreviewPanel job={job} /> : null}
              </div>
            </div>
          </>
        ) : null}
      </div>

      {job ? (
        <CloseJobConfirmDialog
          open={closeDialogOpen}
          jobTitle={job.jobTitle}
          jobId={job.jobId}
          defaultReason={job.closedReason}
          isSubmitting={statusMutation.isPending}
          submitLabel={
            job.status === "closed" && !job.employerNotified
              ? "Send notification"
              : "Close Job / Send"
          }
          errorMessage={closeError}
          onCancel={() => {
            if (!statusMutation.isPending) {
              setCloseDialogOpen(false);
              setCloseError(null);
            }
          }}
          onConfirm={handleConfirmCloseJob}
        />
      ) : null}

      {job ? (
        <CloseJobConfirmDialog
          open={rejectDialogOpen}
          jobTitle={job.jobTitle}
          jobId={job.jobId}
          isSubmitting={statusMutation.isPending}
          title={
            job.isLiveChangeReview
              ? "Reject these changes?"
              : "Reject this job?"
          }
          description={
            job.isLiveChangeReview
              ? "The live listing will stay unchanged. The employer will be notified with your rejection reason and can edit and resubmit."
              : "This job will not go Live. The employer will be notified with your rejection reason."
          }
          reasonLabel="Reason for rejection"
          reasonPlaceholder={
            job.isLiveChangeReview
              ? "Enter why these changes are being rejected. This reason is sent to the employer."
              : "Enter why this job is being rejected. This reason is sent to the employer."
          }
          submitLabel={
            job.isLiveChangeReview ? "Reject Changes" : "Reject Job"
          }
          errorMessage={rejectError}
          onCancel={() => {
            if (!statusMutation.isPending) {
              setRejectDialogOpen(false);
              setRejectError(null);
            }
          }}
          onConfirm={handleConfirmRejectJob}
        />
      ) : null}

      {statusMessage ? (
        <div
          role="status"
          aria-live="polite"
          className="pointer-events-none fixed bottom-5 left-1/2 z-50 -translate-x-1/2 sm:bottom-6"
        >
          <div className="pointer-events-auto inline-flex items-center gap-2 rounded-full border border-primary/20 bg-surface px-4 py-2.5 text-xs font-semibold text-foreground shadow-lg">
            <span className="inline-flex size-5 items-center justify-center rounded-full bg-primary-light text-primary">
              <Check className="size-3" strokeWidth={3} aria-hidden="true" />
            </span>
            {statusMessage}
          </div>
        </div>
      ) : null}
    </OperationsLayout>
  );
}
