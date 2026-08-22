import { useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { JobActivityPanel } from "../components/operations/jobs/detail/JobActivityPanel";
import { JobApplicationsPanel } from "../components/operations/jobs/detail/JobApplicationsPanel";
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
  operationsJobDetailPath,
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

  const handleShare = async () => {
    if (!job) {
      return;
    }

    const shareText = `${job.jobTitle} (${job.jobId}) at ${job.employer.companyName}`;
    const shareUrl =
      typeof window !== "undefined"
        ? `${window.location.origin}${operationsJobDetailPath(job.jobId)}`
        : job.jobId;

    try {
      if (navigator.share) {
        await navigator.share({
          title: job.jobTitle,
          text: shareText,
          url: shareUrl,
        });
        return;
      }

      await navigator.clipboard.writeText(`${shareText}\n${shareUrl}`);
    } catch {
      // User cancelled share or clipboard blocked — ignore.
    }
  };

  const handleEdit = () => {
    if (!job) {
      return;
    }

    navigate(
      `${OPERATIONS_ROUTES.JOBS_POST}?edit=${encodeURIComponent(job.jobId)}`,
    );
  };

  const handleCloseJob = () => {
    if (!job || statusMutation.isPending) {
      return;
    }

    const confirmed = window.confirm(
      `Close job ${job.jobId}? Candidates will no longer be able to apply.`,
    );

    if (!confirmed) {
      return;
    }

    statusMutation.mutate("close");
  };

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
              isClosing={statusMutation.isPending}
              onShare={() => void handleShare()}
              onEdit={handleEdit}
              onCloseJob={handleCloseJob}
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
                    <JobOverviewPanel
                      job={job}
                      isClosing={statusMutation.isPending}
                      onCloseJob={handleCloseJob}
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
    </OperationsLayout>
  );
}
