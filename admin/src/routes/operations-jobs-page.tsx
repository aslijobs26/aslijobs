import { useEffect, useMemo, useState } from "react";
import { isAxiosError } from "axios";
import { JobsFiltersBar, type JobsFiltersState } from "../components/operations/jobs/JobsFiltersBar";
import { JobsInsightsStrip } from "../components/operations/jobs/JobsInsightsStrip";
import { JobsKpiStrip } from "../components/operations/jobs/JobsKpiStrip";
import { JobsPaginationBar } from "../components/operations/jobs/JobsPaginationBar";
import { JobsTableSection } from "../components/operations/jobs/JobsTableSection";
import { JobsTabs } from "../components/operations/jobs/JobsTabs";
import { OperationsLayout } from "../components/operations/layout/OperationsLayout";
import { useOperationsJobs } from "../hooks/use-operations-jobs";
import type {
  OperationsJobTab,
  OperationsJobsInsight,
  OperationsJobsListResult,
} from "../types/operations-jobs";

const EMPTY_RESULT: OperationsJobsListResult = {
  kpis: {
    totalJobs: 0,
    activeJobs: 0,
    pendingPaymentJobs: 0,
    liveJobs: 0,
    expiredJobs: 0,
    draftJobs: 0,
  },
  counts: {
    all: 0,
    live: 0,
    pending_payment: 0,
    expired: 0,
    drafts: 0,
  },
  insights: [],
  filterOptions: {
    categories: [],
    locations: [],
  },
  jobs: [],
  pagination: {
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 1,
    hasNextPage: false,
    hasPreviousPage: false,
  },
};

const DEFAULT_FILTERS: JobsFiltersState = {
  search: "",
  status: "",
  paymentStatus: "",
  category: "",
  location: "",
};

function exportJobsCsv(result: OperationsJobsListResult): void {
  const header = [
    "Job ID",
    "Job Title",
    "Job Type",
    "Employer",
    "Category",
    "Location",
    "Status",
    "Payment Status",
    "Applications",
    "Published At",
  ];

  const rows = result.jobs.map((job) => [
    job.jobId,
    job.jobTitle,
    job.jobType,
    job.employer.companyName,
    job.businessCategory,
    job.locationLabel,
    job.statusLabel,
    job.paymentStatusLabel,
    String(job.applications),
    job.publishedAt ?? job.createdAt,
  ]);

  const csv = [header, ...rows]
    .map((row) =>
      row
        .map((cell) => `"${String(cell).replaceAll('"', '""')}"`)
        .join(","),
    )
    .join("\n");

  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `operations-jobs-page-${result.pagination.page}.csv`;
  anchor.click();
  URL.revokeObjectURL(url);
}

export function OperationsJobsPage() {
  const [tab, setTab] = useState<OperationsJobTab>("all");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [filters, setFilters] = useState<JobsFiltersState>(DEFAULT_FILTERS);
  const [debouncedSearch, setDebouncedSearch] = useState("");

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setDebouncedSearch(filters.search.trim());
    }, 300);

    return () => window.clearTimeout(timeoutId);
  }, [filters.search]);

  const queryParams = useMemo(
    () => ({
      page,
      limit,
      tab,
      search: debouncedSearch,
      status: filters.status,
      paymentStatus: filters.paymentStatus,
      category: filters.category,
      location: filters.location,
    }),
    [
      page,
      limit,
      tab,
      debouncedSearch,
      filters.status,
      filters.paymentStatus,
      filters.category,
      filters.location,
    ],
  );

  const jobsQuery = useOperationsJobs(queryParams);
  const data = jobsQuery.data ?? EMPTY_RESULT;

  const errorMessage = (() => {
    if (!jobsQuery.error) {
      return undefined;
    }

    if (isAxiosError(jobsQuery.error)) {
      const status = jobsQuery.error.response?.status;
      if (status === 401) {
        return "Your session is invalid or expired. Please log out and sign in again to load jobs.";
      }

      const payload = jobsQuery.error.response?.data as
        | { message?: string }
        | undefined;
      if (payload?.message?.trim()) {
        return payload.message.trim();
      }

      return jobsQuery.error.message;
    }

    if (jobsQuery.error instanceof Error) {
      return jobsQuery.error.message;
    }

    return "Failed to load jobs.";
  })();

  const handleFiltersChange = (next: Partial<JobsFiltersState>) => {
    setFilters((current) => ({ ...current, ...next }));
    setPage(1);
  };

  const handleClearFilters = () => {
    setFilters(DEFAULT_FILTERS);
    setDebouncedSearch("");
    setPage(1);
  };

  const handleTabChange = (nextTab: OperationsJobTab) => {
    setTab(nextTab);
    setPage(1);
  };

  const handleInsightSelect = (insight: OperationsJobsInsight) => {
    if (insight.tab === "paused_inactive") {
      setTab("all");
      setFilters((current) => ({
        ...current,
        status: "paused",
        paymentStatus: "",
      }));
    } else {
      setTab(insight.tab);
      if (insight.tab === "pending_payment") {
        setFilters((current) => ({
          ...current,
          status: "",
          paymentStatus: "",
        }));
      }
    }
    setPage(1);
  };

  return (
    <OperationsLayout
      title="Jobs"
      subtitle="Manage all job postings across employers."
    >
      <div className="flex w-full min-w-0 flex-col gap-2 sm:gap-2.5">
        <JobsKpiStrip kpis={data.kpis} isLoading={jobsQuery.isLoading} />

        <JobsInsightsStrip
          insights={data.insights}
          onSelect={handleInsightSelect}
        />

        <JobsFiltersBar
          filters={filters}
          filterOptions={data.filterOptions}
          onChange={handleFiltersChange}
          onClear={handleClearFilters}
          onExport={() => exportJobsCsv(data)}
        />

        <div className="overflow-hidden rounded-xl border border-border-subtle bg-surface shadow-sm">
          <div className="border-b border-border-subtle px-2.5 py-2 sm:px-3.5 sm:py-3">
            <JobsTabs
              activeTab={tab}
              counts={data.counts}
              onChange={handleTabChange}
            />
          </div>
          <JobsTableSection
            jobs={data.jobs}
            isLoading={jobsQuery.isLoading}
            isError={jobsQuery.isError}
            errorMessage={errorMessage}
            onRetry={() => void jobsQuery.refetch()}
          />
        </div>

        <JobsPaginationBar
          pagination={data.pagination}
          onPageChange={setPage}
          onLimitChange={(nextLimit) => {
            setLimit(nextLimit);
            setPage(1);
          }}
        />
      </div>
    </OperationsLayout>
  );
}
