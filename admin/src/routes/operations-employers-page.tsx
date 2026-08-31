import { useMemo, useState } from "react";
import { isAxiosError } from "axios";
import {
  EmployersDateAnalyticsBar,
  type EmployersDateFiltersState,
} from "../components/operations/employers/EmployersDateAnalyticsBar";
import {
  EmployersFiltersBar,
  type EmployersFiltersState,
} from "../components/operations/employers/EmployersFiltersBar";
import { EmployersKpiStrip } from "../components/operations/employers/EmployersKpiStrip";
import { EmployersPageSkeleton } from "../components/operations/employers/EmployersPageSkeleton";
import { EmployersTableSection } from "../components/operations/employers/EmployersTableSection";
import { formatEmployerDisplayId } from "../components/operations/employers/employers-format";
import { JobsPaginationBar } from "../components/operations/jobs/JobsPaginationBar";
import { OperationsLayout } from "../components/operations/layout/OperationsLayout";
import {
  useOperationsEmployers,
  useUpdateOperationsEmployerStatus,
  useUpdateOperationsEmployerVerification,
} from "../hooks/use-operations-employers";
import type {
  OperationsEmployerDatePreset,
  OperationsEmployerListItem,
  OperationsEmployersListResult,
} from "../types/operations-employers";
import { isOperationsSessionTransientError } from "../utils/operations-session-errors";

const DEFAULT_FILTERS: EmployersFiltersState = {
  search: "",
  verificationStatus: "",
  employerType: "",
  location: "",
  status: "",
  registrationPreset: "",
};

const DEFAULT_DATE_FILTERS: EmployersDateFiltersState = {
  datePreset: "all",
  dateFrom: "",
  dateTo: "",
};

function exportEmployersCsv(result: OperationsEmployersListResult): void {
  const header = [
    "Employer ID",
    "Display Name",
    "Company Name",
    "Phone",
    "Email",
    "Organization Type",
    "Location",
    "Registered Date",
    "Registered Time",
    "Verification Status",
    "Status",
    "Active Jobs",
    "Total Jobs",
  ];

  const rows = result.employers.map((item) => [
    formatEmployerDisplayId(item.id),
    item.displayName,
    item.companyName,
    item.phone,
    item.email,
    item.organizationType,
    item.location,
    item.registeredAtDate,
    item.registeredAtTime,
    item.verificationStatusLabel,
    item.statusLabel,
    String(item.activeJobsCount),
    String(item.totalJobsCount),
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
  const link = document.createElement("a");
  link.href = url;
  link.download = `operations-employers-page-${result.pagination.page}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}

export function OperationsEmployersPage() {
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [filters, setFilters] = useState<EmployersFiltersState>(DEFAULT_FILTERS);
  const [dateFilters, setDateFilters] =
    useState<EmployersDateFiltersState>(DEFAULT_DATE_FILTERS);

  // Status/Verification Mutation Modals state
  const [selectedEmployer, setSelectedEmployer] =
    useState<OperationsEmployerListItem | null>(null);
  const [actionType, setActionType] = useState<
    "verify" | "reject" | "suspend" | "activate" | null
  >(null);
  const [actionReason, setActionReason] = useState("");
  const [actionError, setActionError] = useState<string | null>(null);

  const listDatePreset: OperationsEmployerDatePreset =
    filters.registrationPreset || dateFilters.datePreset;
  const listDateFrom =
    listDatePreset === "custom" ? dateFilters.dateFrom : "";
  const listDateTo = listDatePreset === "custom" ? dateFilters.dateTo : "";

  const queryParams = useMemo(
    () => ({
      page,
      limit,
      search: filters.search.trim(),
      verificationStatus: filters.verificationStatus,
      employerType: filters.employerType,
      location: filters.location,
      status: filters.status,
      datePreset: listDatePreset,
      dateFrom: listDateFrom,
      dateTo: listDateTo,
      analyticsPreset: dateFilters.datePreset,
      analyticsFrom:
        dateFilters.datePreset === "custom" ? dateFilters.dateFrom : "",
      analyticsTo: dateFilters.datePreset === "custom" ? dateFilters.dateTo : "",
    }),
    [
      page,
      limit,
      filters.search,
      filters.verificationStatus,
      filters.employerType,
      filters.location,
      filters.status,
      listDatePreset,
      listDateFrom,
      listDateTo,
      dateFilters.datePreset,
      dateFilters.dateFrom,
      dateFilters.dateTo,
    ],
  );

  const employersQuery = useOperationsEmployers(queryParams);
  const verifyMutation = useUpdateOperationsEmployerVerification(
    selectedEmployer?.id,
  );
  const statusMutation = useUpdateOperationsEmployerStatus(
    selectedEmployer?.id,
  );

  const handleFilterChange = (next: Partial<EmployersFiltersState>) => {
    setFilters((prev) => ({ ...prev, ...next }));
    setPage(1);
  };

  const handleClearFilters = () => {
    setFilters(DEFAULT_FILTERS);
    setDateFilters(DEFAULT_DATE_FILTERS);
    setPage(1);
  };

  const handleExportCsv = () => {
    if (!employersQuery.data) return;
    exportEmployersCsv(employersQuery.data);
  };

  // Action handlers
  const handleOpenVerify = (employer: OperationsEmployerListItem) => {
    setSelectedEmployer(employer);
    setActionType("verify");
    setActionReason("");
    setActionError(null);
  };

  const handleOpenReject = (employer: OperationsEmployerListItem) => {
    setSelectedEmployer(employer);
    setActionType("reject");
    setActionReason("");
    setActionError(null);
  };

  const handleOpenToggleStatus = (employer: OperationsEmployerListItem) => {
    setSelectedEmployer(employer);
    setActionType(employer.status === "suspended" ? "activate" : "suspend");
    setActionReason("");
    setActionError(null);
  };

  const handleCloseModal = () => {
    setSelectedEmployer(null);
    setActionType(null);
    setActionReason("");
    setActionError(null);
  };

  const handleExecuteAction = async () => {
    if (!selectedEmployer || !actionType) return;
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
    if (!employersQuery.error) {
      return undefined;
    }
    if (isOperationsSessionTransientError(employersQuery.error)) {
      return "The API server is temporarily unavailable. Please wait a moment and retry.";
    }
    if (isAxiosError(employersQuery.error)) {
      const message = employersQuery.error.response?.data?.message;
      if (typeof message === "string" && message.trim()) {
        return message;
      }
      if (employersQuery.error.response?.status === 401) {
        return "Your session expired. Please refresh or sign in again.";
      }
    }
    return "Failed to load employers. Please try again.";
  })();

  const data = employersQuery.data;
  const isInitialLoading = employersQuery.isLoading && !data;

  return (
    <OperationsLayout
      title="Employers"
      subtitle="View, search and manage all employers."
    >
      <div className="flex w-full min-w-0 flex-col gap-3">
        {isInitialLoading ? (
          <EmployersPageSkeleton />
        ) : (
          <>
            {data?.kpis ? <EmployersKpiStrip kpis={data.kpis} /> : null}

            {data?.periodStats ? (
              <EmployersDateAnalyticsBar
                filters={dateFilters}
                periodStats={data.periodStats}
                onChange={(next) => {
                  setDateFilters((prev) => ({ ...prev, ...next }));
                  setPage(1);
                }}
              />
            ) : null}

            <EmployersFiltersBar
              filters={filters}
              filterOptions={
                data?.filterOptions ?? {
                  verificationStatuses: [],
                  employerTypes: [],
                  locations: [],
                  statuses: [],
                }
              }
              onChange={handleFilterChange}
              onClear={handleClearFilters}
              onExport={handleExportCsv}
            />

            <div className="min-w-0 overflow-hidden rounded-xl border border-border-subtle bg-surface shadow-sm ops-brand-border-glow">
              <EmployersTableSection
                employers={data?.employers ?? []}
                totalEmployers={data?.pagination.total ?? 0}
                isLoading={employersQuery.isFetching && !data}
                isError={employersQuery.isError}
                errorMessage={errorMessage}
                onRetry={() => void employersQuery.refetch()}
                onVerify={handleOpenVerify}
                onReject={handleOpenReject}
                onToggleStatus={handleOpenToggleStatus}
              />

              {data?.pagination ? (
                <div className="border-t border-border-subtle p-3">
                  <JobsPaginationBar
                    pagination={data.pagination}
                    onPageChange={setPage}
                    onLimitChange={(newLimit: number) => {
                      setLimit(newLimit);
                      setPage(1);
                    }}
                  />
                </div>
              ) : null}
            </div>
          </>
        )}
      </div>

      {/* Operational Action Confirmation Modal */}
      {actionType && selectedEmployer ? (
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
                `Are you sure you want to verify ${selectedEmployer.displayName}? Their documents will be marked as approved.`}
              {actionType === "reject" &&
                `Are you sure you want to reject verification for ${selectedEmployer.displayName}?`}
              {actionType === "suspend" &&
                `Suspending ${selectedEmployer.displayName} will prevent them from posting new jobs and accessing active listings.`}
              {actionType === "activate" &&
                `Are you sure you want to reactivate ${selectedEmployer.displayName}?`}
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
