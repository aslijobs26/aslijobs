import { useState } from "react";
import { isAxiosError } from "axios";
import { ArrowLeft } from "lucide-react";
import { Link, useParams } from "react-router-dom";
import { CandidateApplicationsTable } from "../components/operations/candidates/profile/CandidateApplicationsTable";
import { CandidateDocumentsPanel } from "../components/operations/candidates/profile/CandidateDocumentsPanel";
import { CandidatePreferencesPanel } from "../components/operations/candidates/profile/CandidatePreferencesPanel";
import { CandidateProfileDetailsPanel } from "../components/operations/candidates/profile/CandidateProfileDetailsPanel";
import { CandidateProfileHeader } from "../components/operations/candidates/profile/CandidateProfileHeader";
import { CandidateProfileOverview } from "../components/operations/candidates/profile/CandidateProfileOverview";
import {
  CandidateProfileTabs,
  type CandidateProfileTabId,
} from "../components/operations/candidates/profile/CandidateProfileTabs";
import { OperationsLayout } from "../components/operations/layout/OperationsLayout";
import { OperationsCanKey } from "../components/operations/auth/OperationsCanKey";
import { OPERATIONS_ROUTES } from "../constants/operations-routes";
import {
  useOperationsCandidateApplications,
  useOperationsCandidateDetail,
} from "../hooks/use-operations-candidates";
import { useInvalidateRegistrationAwarenessOnDetail } from "../hooks/use-operations-registration-awareness";
import { useOperationsPermissions } from "../hooks/use-operations-permissions";
import { JobsPaginationBar } from "../components/operations/jobs/JobsPaginationBar";
import { isOperationsSessionTransientError } from "../utils/operations-session-errors";

function DetailSkeleton() {
  return (
    <div
      className="flex w-full min-w-0 flex-col gap-2.5 max-sm:gap-2 sm:gap-3"
      aria-busy="true"
    >
      <div className="h-36 animate-pulse rounded-xl border border-border-subtle bg-surface max-sm:h-32 sm:h-40" />
      <div className="h-9 animate-pulse rounded-lg border border-border-subtle bg-surface max-sm:h-8 sm:h-10" />
      <div className="grid grid-cols-2 gap-1.5 sm:gap-3 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <div
            key={index}
            className="h-16 animate-pulse rounded-xl border border-border-subtle bg-surface max-sm:h-14 sm:h-24"
          />
        ))}
      </div>
      <div className="grid gap-2.5 sm:gap-3 lg:grid-cols-3">
        <div className="h-48 animate-pulse rounded-xl border border-border-subtle bg-surface max-sm:h-40 sm:h-64 lg:col-span-2" />
        <div className="h-48 animate-pulse rounded-xl border border-border-subtle bg-surface max-sm:h-40 sm:h-64" />
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
  const { canKey } = useOperationsPermissions();
  const canViewApplications = canKey("candidates.profile.applications.view");

  const detailQuery = useOperationsCandidateDetail(jobSeekerId);
  const applicationsQuery = useOperationsCandidateApplications(
    jobSeekerId,
    {
      page: activeTab === "applications" ? applicationsPage : 1,
      limit: activeTab === "applications" ? applicationsLimit : 5,
    },
    {
      enabled:
        Boolean(detailQuery.data) &&
        canViewApplications &&
        (activeTab === "overview" || activeTab === "applications"),
    },
  );

  useInvalidateRegistrationAwarenessOnDetail(detailQuery.isSuccess);

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
      <div className="mb-2.5 flex justify-end max-sm:mb-2 sm:mb-3">
        <Link
          to={OPERATIONS_ROUTES.CANDIDATES}
          className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-border-subtle bg-surface px-2.5 text-[11px] font-semibold text-foreground transition-colors hover:bg-hero-bg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 max-sm:h-7 max-sm:gap-1 max-sm:px-2 max-sm:text-[10px] sm:h-9 sm:px-3 sm:text-xs"
        >
          <ArrowLeft
            className="size-3 max-sm:size-2.5 sm:size-3.5"
            aria-hidden="true"
          />
          <span className="max-sm:hidden">Back to Candidates</span>
          <span className="sm:hidden">Back</span>
        </Link>
      </div>

      {detailQuery.isPending || (detailQuery.isFetching && !detail) ? (
        <DetailSkeleton />
      ) : null}

      {detailQuery.isError && !detail && !detailQuery.isFetching ? (
        <div className="rounded-xl border border-border-subtle bg-surface px-3 py-12 text-center shadow-sm max-sm:px-2.5 max-sm:py-10 sm:px-4 sm:py-16">
          <p className="text-[13px] font-medium text-danger max-sm:text-[12px] sm:text-sm">
            {errorMessage}
          </p>
          <button
            type="button"
            onClick={() => void detailQuery.refetch()}
            className="mt-2.5 inline-flex h-8 items-center rounded-lg bg-primary-light px-2.5 text-[11px] font-semibold text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 max-sm:mt-2 max-sm:h-7 max-sm:text-[10px] sm:mt-3 sm:h-9 sm:px-3 sm:text-xs"
          >
            Retry
          </button>
        </div>
      ) : null}

      {detail ? (
        <div className="flex w-full min-w-0 flex-col gap-2.5 max-sm:gap-2 sm:gap-3">
          <CandidateProfileHeader detail={detail} />

          <div className="min-w-0 overflow-hidden rounded-xl border border-border-subtle bg-surface shadow-sm">
            <div className="px-1.5 max-sm:px-1 sm:px-3">
              <CandidateProfileTabs
                activeTab={activeTab}
                applicationsCount={
                  applicationsPagination.total || detail.applicationCount || 0
                }
                onChange={setActiveTab}
              />
            </div>

            <div className="p-2.5 max-sm:p-2 sm:p-4">
              {activeTab === "overview" ? (
                <CandidateProfileOverview
                  detail={detail}
                  applications={canViewApplications ? applications : []}
                  applicationsTotal={
                    canViewApplications
                      ? applicationsPagination.total ||
                        detail.applicationCount ||
                        0
                      : detail.applicationCount || 0
                  }
                  onViewAllApplications={() => setActiveTab("applications")}
                />
              ) : null}

              {activeTab === "applications" ? (
                <OperationsCanKey
                  permissionKey="candidates.profile.applications.view"
                  fallback={
                    <p className="rounded-xl border border-border-subtle bg-surface px-3 py-8 text-center text-[11px] text-muted max-sm:px-2.5 max-sm:py-6 max-sm:text-[10px] sm:px-4 sm:py-10 sm:text-xs">
                      You do not have permission to view candidate applications.
                    </p>
                  }
                >
                  <div className="flex flex-col gap-2.5 max-sm:gap-2 sm:gap-3">
                    <section className="rounded-xl border border-border-subtle bg-surface shadow-sm">
                      <div className="border-b border-border-subtle px-3 py-2 max-sm:px-2.5 max-sm:py-1.5 sm:px-4 sm:py-3">
                        <h3 className="text-[13px] font-semibold text-foreground max-sm:text-[12px] sm:text-sm">
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
                </OperationsCanKey>
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
            </div>
          </div>
        </div>
      ) : null}
    </OperationsLayout>
  );
}
