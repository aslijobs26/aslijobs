import { useState } from "react";
import { isAxiosError } from "axios";
import { ArrowLeft } from "lucide-react";
import { Link, useParams } from "react-router-dom";
import { CandidateApplicationsTable } from "../components/operations/candidates/profile/CandidateApplicationsTable";
import { CandidateDocumentsPanel } from "../components/operations/candidates/profile/CandidateDocumentsPanel";
import { CandidateEmptyStatePanel } from "../components/operations/candidates/profile/CandidateEmptyStatePanel";
import { CandidatePreferencesPanel } from "../components/operations/candidates/profile/CandidatePreferencesPanel";
import { CandidateProfileDetailsPanel } from "../components/operations/candidates/profile/CandidateProfileDetailsPanel";
import { CandidateProfileHeader } from "../components/operations/candidates/profile/CandidateProfileHeader";
import { CandidateProfileOverview } from "../components/operations/candidates/profile/CandidateProfileOverview";
import {
  CandidateProfileTabs,
  type CandidateProfileTabId,
} from "../components/operations/candidates/profile/CandidateProfileTabs";
import { OperationsLayout } from "../components/operations/layout/OperationsLayout";
import { OPERATIONS_ROUTES } from "../constants/operations-routes";
import {
  useOperationsCandidateApplications,
  useOperationsCandidateDetail,
} from "../hooks/use-operations-candidates";
import { JobsPaginationBar } from "../components/operations/jobs/JobsPaginationBar";
import { isOperationsSessionTransientError } from "../utils/operations-session-errors";

function DetailSkeleton() {
  return (
    <div className="flex w-full min-w-0 flex-col gap-3" aria-busy="true">
      <div className="h-40 animate-pulse rounded-xl border border-border-subtle bg-surface" />
      <div className="h-10 animate-pulse rounded-lg border border-border-subtle bg-surface" />
      <div className="grid gap-3 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <div
            key={index}
            className="h-24 animate-pulse rounded-xl border border-border-subtle bg-surface"
          />
        ))}
      </div>
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
  const [activeTab, setActiveTab] =
    useState<CandidateProfileTabId>("overview");
  const [applicationsPage, setApplicationsPage] = useState(1);
  const [applicationsLimit, setApplicationsLimit] = useState(10);

  const detailQuery = useOperationsCandidateDetail(jobSeekerId);
  const applicationsQuery = useOperationsCandidateApplications(
    jobSeekerId,
    {
      page: activeTab === "applications" ? applicationsPage : 1,
      limit: activeTab === "applications" ? applicationsLimit : 5,
    },
    { enabled: Boolean(detailQuery.data) },
  );

  const detail = detailQuery.data;
  const applications = applicationsQuery.data?.applications ?? [];
  const applicationsPagination = applicationsQuery.data?.pagination ?? {
    page: applicationsPage,
    limit: applicationsLimit,
    total: detail?.applicationCount ?? 0,
    totalPages: 1,
    hasNextPage: false,
    hasPreviousPage: false,
  };

  const errorMessage = (() => {
    if (!detailQuery.error) {
      return "Failed to load candidate details.";
    }

    if (isOperationsSessionTransientError(detailQuery.error)) {
      return "The API server is temporarily unavailable. Please wait a moment and retry.";
    }

    if (isAxiosError(detailQuery.error)) {
      const message = detailQuery.error.response?.data?.message;
      if (typeof message === "string" && message.trim()) {
        return message;
      }
      if (detailQuery.error.response?.status === 404) {
        return "This candidate could not be found.";
      }
      if (detailQuery.error.response?.status === 401) {
        return "Your session expired. Please refresh or sign in again.";
      }
    }

    return "Failed to load candidate details.";
  })();

  const applicationsErrorMessage = (() => {
    if (!applicationsQuery.error) {
      return undefined;
    }
    if (isOperationsSessionTransientError(applicationsQuery.error)) {
      return "The API server is temporarily unavailable. Please retry.";
    }
    if (isAxiosError(applicationsQuery.error)) {
      const message = applicationsQuery.error.response?.data?.message;
      if (typeof message === "string" && message.trim()) {
        return message;
      }
    }
    return "Failed to load applications.";
  })();

  return (
    <OperationsLayout
      title="Candidate Profile"
      subtitle="Candidates > Candidate Profile"
    >
      <div className="mb-3 flex justify-end">
        <Link
          to={OPERATIONS_ROUTES.CANDIDATES}
          className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-border-subtle bg-surface px-3 text-xs font-semibold text-foreground transition-colors hover:bg-hero-bg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
        >
          <ArrowLeft className="size-3.5" aria-hidden="true" />
          Back to Candidates
        </Link>
      </div>

      {detailQuery.isPending || (detailQuery.isFetching && !detail) ? (
        <DetailSkeleton />
      ) : null}

      {detailQuery.isError && !detail && !detailQuery.isFetching ? (
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
          <CandidateProfileHeader detail={detail} />

          <div className="rounded-xl border border-border-subtle bg-surface shadow-sm">
            <div className="px-2 sm:px-3">
              <CandidateProfileTabs
                activeTab={activeTab}
                applicationsCount={
                  applicationsPagination.total || detail.applicationCount || 0
                }
                notesCount={detail.notesCount ?? 0}
                onChange={setActiveTab}
              />
            </div>

            <div className="p-3 sm:p-4">
              {activeTab === "overview" ? (
                <CandidateProfileOverview
                  detail={detail}
                  applications={applications}
                  applicationsTotal={
                    applicationsPagination.total || detail.applicationCount || 0
                  }
                  onViewAllApplications={() => setActiveTab("applications")}
                />
              ) : null}

              {activeTab === "applications" ? (
                <div className="flex flex-col gap-3">
                  <section className="rounded-xl border border-border-subtle bg-surface shadow-sm">
                    <div className="border-b border-border-subtle px-4 py-3">
                      <h3 className="text-sm font-semibold text-foreground">
                        All Applications (
                        {(
                          applicationsPagination.total ||
                          detail.applicationCount ||
                          0
                        ).toLocaleString("en-IN")}
                        )
                      </h3>
                    </div>
                    <CandidateApplicationsTable
                      applications={applications}
                      isLoading={applicationsQuery.isLoading}
                      isError={applicationsQuery.isError}
                      errorMessage={applicationsErrorMessage}
                      onRetry={() => void applicationsQuery.refetch()}
                    />
                  </section>
                  {(applicationsPagination.total || 0) > 0 ? (
                    <JobsPaginationBar
                      pagination={applicationsPagination}
                      ariaLabel="Candidate applications pagination"
                      onPageChange={setApplicationsPage}
                      onLimitChange={(nextLimit) => {
                        setApplicationsLimit(nextLimit);
                        setApplicationsPage(1);
                      }}
                    />
                  ) : null}
                </div>
              ) : null}

              {activeTab === "preferences" ? (
                <CandidatePreferencesPanel detail={detail} />
              ) : null}

              {activeTab === "profile_details" ? (
                <CandidateProfileDetailsPanel detail={detail} />
              ) : null}

              {activeTab === "documents" ? (
                <CandidateDocumentsPanel detail={detail} />
              ) : null}

              {activeTab === "activity" ? (
                <CandidateEmptyStatePanel
                  title="No activity yet"
                  description="Candidate activity timeline will appear here when available."
                />
              ) : null}

              {activeTab === "notes" ? (
                <CandidateEmptyStatePanel
                  title="No notes yet"
                  description="Internal notes for this candidate will appear here when available."
                />
              ) : null}
            </div>
          </div>
        </div>
      ) : null}
    </OperationsLayout>
  );
}
