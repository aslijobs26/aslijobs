import { Plus, Search, Users, UsersRound } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { DepartmentCreateForm } from "../components/operations/departments/DepartmentCreateForm";
import { generateAsliDepartmentCode } from "../components/operations/departments/department-code";
import { DepartmentDeleteDialog } from "../components/operations/departments/DepartmentDeleteDialog";
import { DepartmentEditDialog } from "../components/operations/departments/DepartmentEditDialog";
import { DepartmentRowActions } from "../components/operations/departments/DepartmentRowActions";
import { DepartmentViewDialog } from "../components/operations/departments/DepartmentViewDialog";
import { DepartmentsKpiStrip } from "../components/operations/departments/DepartmentsKpiStrip";
import { getDepartmentVisual } from "../components/operations/departments/department-visual";
import { OrganizationTabs } from "../components/operations/organization/OrganizationTabs";
import { OperationsLayout } from "../components/operations/layout/OperationsLayout";
import { OperationsCan } from "../components/operations/auth/OperationsCan";
import { JobsPaginationBar } from "../components/operations/jobs/JobsPaginationBar";
import { OperationsFilterSelect } from "../components/operations/jobs/OperationsFilterSelect";
import {
  formatOperationsTimestamp,
  getOperationsApiErrorDetails,
  getOperationsApiErrorMessage,
} from "../components/operations/team/team-format";
import { OPERATIONS_ROUTES } from "../constants/operations-routes";
import {
  useCreateOperationsDepartment,
  useDeleteOperationsDepartment,
  useOperationsDepartmentDependencies,
  useOperationsDepartmentMetrics,
  useOperationsDepartments,
  useUpdateOperationsDepartment,
} from "../hooks/use-operations-departments";
import type { OperationsDepartmentDependencies } from "../services/operations-departments.service";
import type { OperationsDepartment } from "../types/operations-team";
import { cn } from "../utils/cn";

const STATUS_OPTIONS = [
  { value: "all", label: "All Status" },
  { value: "active", label: "Active" },
  { value: "archived", label: "Inactive" },
] as const;

function parseDependencyDetails(
  details: unknown,
): OperationsDepartmentDependencies | null {
  if (!details || typeof details !== "object") return null;
  const record = details as {
    dependencies?: OperationsDepartmentDependencies;
  };
  const deps = record.dependencies;
  if (!deps || typeof deps !== "object") return null;
  return {
    activeMembers: Number(deps.activeMembers) || 0,
    scopedRoles: Number(deps.scopedRoles) || 0,
    openWorkItems: Number(deps.openWorkItems) || 0,
    activeTeams: Number(deps.activeTeams) || 0,
  };
}

export function OperationsDepartmentsPage() {
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<"active" | "archived" | "all">("all");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);

  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [codeTouched, setCodeTouched] = useState(false);
  const [description, setDescription] = useState("");
  const [createError, setCreateError] = useState("");
  const [createSuccess, setCreateSuccess] = useState("");
  const [showCreateForm, setShowCreateForm] = useState(true);

  const [viewTarget, setViewTarget] = useState<OperationsDepartment | null>(
    null,
  );
  const [editTarget, setEditTarget] = useState<OperationsDepartment | null>(
    null,
  );
  const [deleteTarget, setDeleteTarget] =
    useState<OperationsDepartment | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [conflictDependencies, setConflictDependencies] =
    useState<OperationsDepartmentDependencies | null>(null);
  const [actionError, setActionError] = useState("");

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setSearch(searchInput.trim());
      setPage(1);
    }, 300);
    return () => window.clearTimeout(timer);
  }, [searchInput]);

  const listParams = useMemo(
    () => ({
      page,
      limit,
      search,
      status,
    }),
    [limit, page, search, status],
  );

  const departmentsQuery = useOperationsDepartments(listParams);
  const allDepartmentsQuery = useOperationsDepartments({
    page: 1,
    limit: 100,
    status: "all",
  });
  const metricsQuery = useOperationsDepartmentMetrics();
  const createMutation = useCreateOperationsDepartment();
  const updateMutation = useUpdateOperationsDepartment();
  const deleteMutation = useDeleteOperationsDepartment();

  const departments = departmentsQuery.data?.departments ?? [];
  const pagination = departmentsQuery.data?.pagination ?? {
    page: 1,
    limit,
    total: 0,
    totalPages: 1,
    hasNextPage: false,
    hasPreviousPage: false,
  };

  const dependenciesQuery = useOperationsDepartmentDependencies(
    deleteTarget?.id ?? null,
    Boolean(deleteTarget),
  );

  const existingSlugs = useMemo(
    () =>
      (allDepartmentsQuery.data?.departments ?? []).map(
        (department) => department.slug,
      ),
    [allDepartmentsQuery.data?.departments],
  );

  const derivedCode = useMemo(() => {
    if (codeTouched) return code;
    return generateAsliDepartmentCode(name, existingSlugs).code;
  }, [code, codeTouched, existingSlugs, name]);

  const effectiveDependencies =
    conflictDependencies ?? dependenciesQuery.data?.dependencies ?? null;
  const isBlocking = effectiveDependencies
    ? effectiveDependencies.activeMembers > 0 ||
      effectiveDependencies.scopedRoles > 0 ||
      effectiveDependencies.openWorkItems > 0
    : Boolean(dependenciesQuery.data?.blocking);

  const resetCreateForm = () => {
    setName("");
    setCode("");
    setCodeTouched(false);
    setDescription("");
    setCreateError("");
  };

  const handleCreate = async () => {
    setCreateError("");
    setCreateSuccess("");
    const trimmedName = name.trim();
    const trimmedCode = derivedCode.trim();
    if (trimmedName.length < 2) {
      setCreateError("Department name is required (min 2 characters).");
      return;
    }
    if (trimmedCode.length < 2) {
      setCreateError("Department code is required (min 2 characters).");
      return;
    }
    try {
      await createMutation.mutateAsync({
        name: trimmedName,
        code: trimmedCode,
        description: description.trim(),
      });
      resetCreateForm();
      setCreateSuccess("Department created successfully.");
      window.setTimeout(() => setCreateSuccess(""), 3000);
    } catch (submitError) {
      setCreateError(
        getOperationsApiErrorMessage(
          submitError,
          "Unable to create department.",
        ),
      );
    }
  };

  const openDelete = (department: OperationsDepartment) => {
    setDeleteError(null);
    setConflictDependencies(null);
    setDeleteTarget(department);
  };

  const handleStatusChange = async (
    department: OperationsDepartment,
    nextStatus: "active" | "archived",
  ) => {
    setActionError("");
    try {
      await updateMutation.mutateAsync({
        departmentId: department.id,
        input: {
          status: nextStatus,
          expectedRevision: department.revision,
        },
      });
    } catch (error) {
      const deps = parseDependencyDetails(getOperationsApiErrorDetails(error));
      if (deps) {
        setConflictDependencies(deps);
        setDeleteTarget(department);
      }
      setActionError(
        getOperationsApiErrorMessage(
          error,
          nextStatus === "archived"
            ? "Unable to deactivate department."
            : "Unable to activate department.",
        ),
      );
    }
  };

  return (
    <OperationsLayout
      title="Departments"
      subtitle="Manage departments, operational ownership, teams and department structure."
    >
      <div className="space-y-3">
        <nav
          aria-label="Breadcrumb"
          className="flex flex-wrap items-center gap-1.5 text-[11px] text-muted"
        >
          <span>Management</span>
          <span aria-hidden="true">›</span>
          <Link
            to={OPERATIONS_ROUTES.ORGANIZATION}
            className="hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
          >
            Organization
          </Link>
          <span aria-hidden="true">›</span>
          <span className="font-medium text-foreground">Departments</span>
        </nav>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <OrganizationTabs />
          <OperationsCan module="departments" action="create">
            <button
              type="button"
              onClick={() => {
                setShowCreateForm(true);
                window.setTimeout(() => {
                  document
                    .getElementById("create-department-name")
                    ?.focus();
                }, 50);
              }}
              className="inline-flex h-9 shrink-0 items-center gap-1.5 self-start rounded-lg bg-primary px-3 text-[12px] font-semibold text-surface shadow-sm hover:bg-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
            >
              <Plus className="size-3.5" aria-hidden="true" />
              Add Department
            </button>
          </OperationsCan>
        </div>

        <DepartmentsKpiStrip
          metrics={metricsQuery.data}
          isLoading={metricsQuery.isPending}
        />

        {actionError ? (
          <p className="rounded-lg border border-danger/30 bg-danger/5 px-3 py-2 text-[12px] text-danger">
            {actionError}
          </p>
        ) : null}

        <div className="grid items-stretch gap-3 xl:grid-cols-[minmax(16rem,20rem)_minmax(0,1fr)]">
          <OperationsCan module="departments" action="create">
            {showCreateForm ? (
              <DepartmentCreateForm
                name={name}
                onNameChange={setName}
                code={code}
                codeTouched={codeTouched}
                onCodeChange={setCode}
                onCodeTouchedChange={setCodeTouched}
                description={description}
                onDescriptionChange={setDescription}
                existingSlugs={existingSlugs}
                error={createError}
                success={createSuccess}
                isSubmitting={createMutation.isPending}
                onCancel={resetCreateForm}
                onSubmit={() => {
                  void handleCreate();
                }}
              />
            ) : null}
          </OperationsCan>

          <section className="flex min-h-[28rem] min-w-0 flex-col rounded-xl border border-border-subtle bg-surface shadow-sm xl:min-h-0 xl:h-full">
            <div className="flex flex-col gap-2 border-b border-border-subtle p-3 sm:flex-row sm:items-center">
              <label className="relative min-w-0 flex-1">
                <span className="sr-only">Search departments</span>
                <Search
                  className="pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-muted"
                  aria-hidden="true"
                />
                <input
                  type="search"
                  value={searchInput}
                  onChange={(event) => setSearchInput(event.target.value)}
                  placeholder="Search departments by name, code or description..."
                  className="h-9 w-full rounded-lg border border-border-subtle bg-hero-bg/50 py-2 pl-9 pr-3 text-[12px] text-foreground placeholder:text-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
                />
              </label>
              <OperationsFilterSelect
                label="Status"
                value={status}
                options={STATUS_OPTIONS}
                hideSearch
                className="w-full sm:w-[9.5rem]"
                onChange={(value) => {
                  setStatus(value as "active" | "archived" | "all");
                  setPage(1);
                }}
              />
            </div>

            {departmentsQuery.isError ? (
              <p className="flex flex-1 items-center justify-center px-4 py-10 text-center text-[12px] text-danger">
                {getOperationsApiErrorMessage(
                  departmentsQuery.error,
                  "Unable to load departments.",
                )}
              </p>
            ) : departmentsQuery.isPending && departments.length === 0 ? (
              <div className="flex-1 space-y-2 p-4">
                {Array.from({ length: 6 }).map((_, index) => (
                  <div
                    key={index}
                    className="h-12 animate-pulse rounded-lg bg-hero-bg"
                  />
                ))}
              </div>
            ) : departments.length === 0 ? (
              <div className="flex flex-1 flex-col items-center justify-center space-y-3 px-4 py-14 text-center">
                <p className="text-[12px] text-muted">
                  {search
                    ? "No departments match your search."
                    : "No departments found"}
                </p>
                {search || status !== "all" ? (
                  <button
                    type="button"
                    onClick={() => {
                      setSearchInput("");
                      setSearch("");
                      setStatus("all");
                      setPage(1);
                    }}
                    className="text-[12px] font-semibold text-primary hover:underline"
                  >
                    Clear search / reset filters
                  </button>
                ) : null}
              </div>
            ) : (
              <>
                <div className="min-h-0 flex-1 overflow-auto scrollbar-hidden">
                  <table className="w-full min-w-[52rem] text-left text-[12px]">
                    <thead>
                      <tr className="border-b border-border-subtle bg-hero-bg/50 text-[10px] uppercase tracking-wide text-muted">
                        <th className="px-3 py-2.5 font-semibold">Department</th>
                        <th className="px-3 py-2.5 font-semibold">Code</th>
                        <th className="px-3 py-2.5 font-semibold">Teams</th>
                        <th className="px-3 py-2.5 font-semibold">Members</th>
                        <th className="px-3 py-2.5 font-semibold">Status</th>
                        <th className="px-3 py-2.5 font-semibold">Created On</th>
                        <th className="px-3 py-2.5 font-semibold">
                          <span className="sr-only">Actions</span>
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {departments.map((department) => {
                        const isActive = department.status === "active";
                        const visual = getDepartmentVisual(
                          department.slug,
                          department.name,
                        );
                        const DepartmentIcon = visual.icon;
                        return (
                          <tr
                            key={department.id}
                            className="border-b border-border-subtle/70 last:border-0"
                          >
                            <td className="px-3 py-2.5">
                              <div className="flex min-w-0 items-start gap-2.5">
                                <span
                                  className={cn(
                                    "mt-0.5 inline-flex size-8 shrink-0 items-center justify-center rounded-lg",
                                    visual.wrapClass,
                                    visual.iconClass,
                                  )}
                                >
                                  <DepartmentIcon
                                    className="size-3.5"
                                    aria-hidden="true"
                                  />
                                </span>
                                <div className="min-w-0">
                                  <p className="font-semibold text-foreground">
                                    {department.name}
                                  </p>
                                  <p className="mt-0.5 line-clamp-1 text-[11px] text-muted">
                                    {department.description || "No description"}
                                  </p>
                                </div>
                              </div>
                            </td>
                            <td className="px-3 py-2.5">
                              <span className="inline-flex rounded-full bg-sky-500/10 px-2 py-0.5 text-[10px] font-semibold text-sky-700">
                                {department.code || department.slug}
                              </span>
                            </td>
                            <td className="px-3 py-2.5">
                              <span className="inline-flex items-center gap-1 tabular-nums text-foreground">
                                <UsersRound
                                  className="size-3 text-muted"
                                  aria-hidden="true"
                                />
                                {department.teamCount.toLocaleString("en-IN")}
                              </span>
                            </td>
                            <td className="px-3 py-2.5">
                              <span className="inline-flex items-center gap-1 tabular-nums text-foreground">
                                <Users
                                  className="size-3 text-muted"
                                  aria-hidden="true"
                                />
                                {department.memberCount.toLocaleString("en-IN")}
                              </span>
                            </td>
                            <td className="px-3 py-2.5">
                              <span
                                className={cn(
                                  "inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold",
                                  isActive
                                    ? "bg-success/10 text-success"
                                    : "bg-danger/10 text-danger",
                                )}
                              >
                                {isActive ? "Active" : "Inactive"}
                              </span>
                            </td>
                            <td className="px-3 py-2.5 text-muted">
                              {formatOperationsTimestamp(department.createdAt)}
                            </td>
                            <td className="px-3 py-2.5">
                              <DepartmentRowActions
                                department={department}
                                isStatusPending={updateMutation.isPending}
                                onView={() => setViewTarget(department)}
                                onEdit={() => setEditTarget(department)}
                                onActivate={() =>
                                  void handleStatusChange(department, "active")
                                }
                                onDeactivate={() => openDelete(department)}
                                onDelete={() => openDelete(department)}
                              />
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
                <div className="mt-auto border-t border-border-subtle px-3 py-2.5">
                  <JobsPaginationBar
                    pagination={pagination}
                    ariaLabel="Departments pagination"
                    onPageChange={setPage}
                    onLimitChange={(nextLimit) => {
                      setLimit(nextLimit);
                      setPage(1);
                    }}
                  />
                </div>
              </>
            )}
          </section>
        </div>
      </div>

      <DepartmentViewDialog
        open={Boolean(viewTarget)}
        department={viewTarget}
        onClose={() => setViewTarget(null)}
      />

      <DepartmentEditDialog
        open={Boolean(editTarget)}
        department={editTarget}
        isSubmitting={updateMutation.isPending}
        onClose={() => setEditTarget(null)}
        onSubmit={async (input) => {
          if (!editTarget) return;
          await updateMutation.mutateAsync({
            departmentId: editTarget.id,
            input: {
              ...input,
              expectedRevision: editTarget.revision,
            },
          });
        }}
      />

      <DepartmentDeleteDialog
        open={Boolean(deleteTarget)}
        departmentName={deleteTarget?.name ?? ""}
        departmentId={deleteTarget?.id}
        isLoadingDependencies={dependenciesQuery.isPending}
        dependencies={effectiveDependencies}
        isBlocking={isBlocking}
        isSubmitting={deleteMutation.isPending}
        errorMessage={deleteError}
        onCancel={() => {
          if (deleteMutation.isPending) return;
          setDeleteTarget(null);
          setDeleteError(null);
          setConflictDependencies(null);
        }}
        onConfirmDelete={() => {
          if (!deleteTarget) return;
          setDeleteError(null);
          void deleteMutation
            .mutateAsync({
              departmentId: deleteTarget.id,
              expectedRevision: deleteTarget.revision,
            })
            .then(() => {
              setDeleteTarget(null);
              setConflictDependencies(null);
            })
            .catch((deleteErr: unknown) => {
              const deps = parseDependencyDetails(
                getOperationsApiErrorDetails(deleteErr),
              );
              if (deps) {
                setConflictDependencies(deps);
              }
              setDeleteError(
                getOperationsApiErrorMessage(
                  deleteErr,
                  "Unable to delete department.",
                ),
              );
            });
        }}
      />
    </OperationsLayout>
  );
}
