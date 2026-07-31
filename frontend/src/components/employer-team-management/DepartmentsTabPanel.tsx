"use client";

import { DepartmentFormModal } from "@/components/employer-team-management/DepartmentFormModal";
import { DepartmentsPagination } from "@/components/employer-team-management/DepartmentsPagination";
import { DepartmentsTable } from "@/components/employer-team-management/DepartmentsTable";
import {
  countActiveDepartmentFilters,
  DEFAULT_DEPARTMENT_FILTERS,
  DepartmentsFilterPanel,
  DepartmentsToolbar,
  type DepartmentFiltersState,
} from "@/components/employer-team-management/DepartmentsToolbar";
import { EmployerProfileDialog } from "@/components/employer-profile/EmployerProfileDialog";
import {
  EMPLOYER_TEAM_DEFAULT_PAGE_SIZE,
  EMPLOYER_TEAM_QUERY_KEYS,
  EMPLOYER_TEAM_SEARCH_DEBOUNCE_MS,
} from "@/constants/employer-team-management";
import {
  createDepartment,
  deactivateDepartment,
  deleteDepartment,
  fetchDepartments,
  updateDepartment,
} from "@/services/employer-team.service";
import type {
  CreateDepartmentPayload,
  DepartmentListItem,
} from "@/types/employer-team";
import { getTeamApiErrorMessage } from "@/utils/employer-team";
import { invalidateEmployerAccessCaches } from "@/utils/employer-rbac-cache";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useRef, useState } from "react";

export function DepartmentsTabPanel() {
  const queryClient = useQueryClient();
  const [searchInput, setSearchInput] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(EMPLOYER_TEAM_DEFAULT_PAGE_SIZE);
  const [filters, setFilters] = useState<DepartmentFiltersState>(
    DEFAULT_DEPARTMENT_FILTERS,
  );
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"create" | "edit" | null>(null);
  const [editing, setEditing] = useState<DepartmentListItem | null>(null);
  const [confirmAction, setConfirmAction] = useState<{
    type: "deactivate" | "delete";
    department: DepartmentListItem;
  } | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const isFirstSearchDebounce = useRef(true);

  useEffect(() => {
    if (isFirstSearchDebounce.current) {
      isFirstSearchDebounce.current = false;
      return;
    }
    const timeoutId = window.setTimeout(() => {
      setDebouncedSearch(searchInput.trim());
      setPage(1);
    }, EMPLOYER_TEAM_SEARCH_DEBOUNCE_MS);
    return () => window.clearTimeout(timeoutId);
  }, [searchInput]);

  const listParams = useMemo(
    () => ({
      search: debouncedSearch || undefined,
      status: filters.status,
      createdFrom: filters.createdFrom || undefined,
      createdTo: filters.createdTo || undefined,
      memberCountMin:
        filters.memberCountMin === ""
          ? undefined
          : Number(filters.memberCountMin),
      memberCountMax:
        filters.memberCountMax === ""
          ? undefined
          : Number(filters.memberCountMax),
      page,
      limit,
      sort: "newest" as const,
    }),
    [debouncedSearch, filters, page, limit],
  );

  const departmentsQuery = useQuery({
    queryKey: EMPLOYER_TEAM_QUERY_KEYS.departments(listParams),
    queryFn: () => fetchDepartments(listParams),
    placeholderData: (previous) => previous,
  });

  const invalidateTeamQueries = async () => {
    await invalidateEmployerAccessCaches(queryClient);
  };

  const createMutation = useMutation({
    mutationFn: createDepartment,
    onSuccess: async () => {
      setFormError(null);
      setModalMode(null);
      await invalidateTeamQueries();
    },
    onError: (error) => {
      setFormError(getTeamApiErrorMessage(error));
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: string;
      payload: CreateDepartmentPayload;
    }) => updateDepartment(id, payload),
    onSuccess: async () => {
      setFormError(null);
      setModalMode(null);
      setEditing(null);
      await invalidateTeamQueries();
    },
    onError: (error) => {
      setFormError(getTeamApiErrorMessage(error));
    },
  });

  const deactivateMutation = useMutation({
    mutationFn: (id: string) => deactivateDepartment(id),
    onSuccess: async () => {
      setActionError(null);
      setConfirmAction(null);
      await invalidateTeamQueries();
    },
    onError: (error) => {
      setActionError(getTeamApiErrorMessage(error));
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteDepartment(id),
    onSuccess: async () => {
      setActionError(null);
      setConfirmAction(null);
      await invalidateTeamQueries();
    },
    onError: (error) => {
      setActionError(getTeamApiErrorMessage(error));
    },
  });

  const activeFilterCount = countActiveDepartmentFilters(filters);
  const pagination = departmentsQuery.data?.pagination;

  const handleSubmit = (payload: CreateDepartmentPayload) => {
    if (modalMode === "edit" && editing) {
      updateMutation.mutate({ id: editing.id, payload });
      return;
    }
    createMutation.mutate(payload);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-base font-bold text-foreground sm:text-lg">
            Departments
          </h2>
          <p className="text-sm text-muted">
            Organize your company into departments.
          </p>
        </div>
      </div>

      <DepartmentsToolbar
        search={searchInput}
        onSearchChange={setSearchInput}
        filtersOpen={filtersOpen}
        onToggleFilters={() => setFiltersOpen((current) => !current)}
        activeFilterCount={activeFilterCount}
        onAddDepartment={() => {
          setFormError(null);
          setEditing(null);
          setModalMode("create");
        }}
      />

      {filtersOpen ? (
        <DepartmentsFilterPanel
          filters={filters}
          onChange={(next) => {
            setFilters(next);
            setPage(1);
          }}
          onClear={() => {
            setFilters(DEFAULT_DEPARTMENT_FILTERS);
            setPage(1);
          }}
          onClose={() => setFiltersOpen(false)}
        />
      ) : null}

      <div className="overflow-hidden rounded-xl border border-border-subtle bg-surface shadow-sm">
        <DepartmentsTable
          departments={departmentsQuery.data?.departments ?? []}
          isLoading={departmentsQuery.isLoading}
          isError={departmentsQuery.isError}
          onRetry={() => {
            void departmentsQuery.refetch();
          }}
          onEdit={(department) => {
            setFormError(null);
            setEditing(department);
            setModalMode("edit");
          }}
          onDeactivate={(department) => {
            setActionError(null);
            setConfirmAction({ type: "deactivate", department });
          }}
          onDelete={(department) => {
            setActionError(null);
            setConfirmAction({ type: "delete", department });
          }}
        />
        {pagination ? (
          <DepartmentsPagination
            page={pagination.page}
            limit={pagination.limit}
            total={pagination.total}
            totalPages={pagination.totalPages}
            isLoading={departmentsQuery.isFetching}
            onPageChange={setPage}
            onLimitChange={(nextLimit) => {
              setLimit(nextLimit);
              setPage(1);
            }}
          />
        ) : null}
      </div>

      {modalMode ? (
        <DepartmentFormModal
          mode={modalMode}
          department={editing}
          isSubmitting={createMutation.isPending || updateMutation.isPending}
          errorMessage={formError}
          onClose={() => {
            if (createMutation.isPending || updateMutation.isPending) {
              return;
            }
            setModalMode(null);
            setEditing(null);
            setFormError(null);
          }}
          onSubmit={handleSubmit}
        />
      ) : null}

      {confirmAction ? (
        <EmployerProfileDialog
          title={
            confirmAction.type === "deactivate"
              ? "Deactivate department"
              : "Delete department"
          }
          description={
            confirmAction.type === "deactivate"
              ? `${confirmAction.department.name} will become inactive and cannot receive new members.`
              : `Soft-delete ${confirmAction.department.name}. Departments with members cannot be deleted.`
          }
          onClose={() => {
            if (deactivateMutation.isPending || deleteMutation.isPending) {
              return;
            }
            setConfirmAction(null);
            setActionError(null);
          }}
          footer={
            <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() => {
                  setConfirmAction(null);
                  setActionError(null);
                }}
                disabled={
                  deactivateMutation.isPending || deleteMutation.isPending
                }
                className="inline-flex h-10 items-center justify-center rounded-xl border border-border-subtle bg-surface px-4 text-sm font-semibold text-foreground hover:bg-primary-light/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  if (confirmAction.type === "deactivate") {
                    deactivateMutation.mutate(confirmAction.department.id);
                    return;
                  }
                  deleteMutation.mutate(confirmAction.department.id);
                }}
                disabled={
                  deactivateMutation.isPending || deleteMutation.isPending
                }
                className={
                  confirmAction.type === "delete"
                    ? "inline-flex h-10 items-center justify-center rounded-xl bg-red-600 px-4 text-sm font-semibold text-white hover:bg-red-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-300 disabled:opacity-50"
                    : "inline-flex h-10 items-center justify-center rounded-xl bg-primary px-4 text-sm font-semibold text-surface hover:bg-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 disabled:opacity-50"
                }
              >
                {confirmAction.type === "deactivate"
                  ? deactivateMutation.isPending
                    ? "Deactivating…"
                    : "Deactivate"
                  : deleteMutation.isPending
                    ? "Deleting…"
                    : "Delete"}
              </button>
            </div>
          }
        >
          {actionError ? (
            <p
              role="alert"
              className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700"
            >
              {actionError}
            </p>
          ) : (
            <p className="text-sm text-muted">
              {confirmAction.type === "deactivate"
                ? "Inactive departments remain visible in history and filters."
                : "This performs a soft delete. The department will no longer appear in active lists."}
            </p>
          )}
        </EmployerProfileDialog>
      ) : null}
    </div>
  );
}
