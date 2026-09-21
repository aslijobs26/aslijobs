import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Plus,
  Search,
} from "lucide-react";
import { OrganizationTabs } from "../components/operations/organization/OrganizationTabs";
import { OperationsLayout } from "../components/operations/layout/OperationsLayout";
import { OperationsCan } from "../components/operations/auth/OperationsCan";
import { OperationsFilterSelect } from "../components/operations/jobs/OperationsFilterSelect";
import { RolesHierarchyPanel } from "../components/operations/roles/RolesHierarchyPanel";
import { RolesRowActions } from "../components/operations/roles/RolesRowActions";
import { getRoleVisual } from "../components/operations/roles/role-visuals";
import { getOperationsApiErrorMessage } from "../components/operations/team/team-format";
import { OPERATIONS_ROUTES } from "../constants/operations-routes";
import {
  useArchiveOperationsRole,
  useOperationsRoleHierarchy,
  useOperationsRoles,
  useRestoreOperationsRole,
} from "../hooks/use-operations-roles";
import type { OperationsRole } from "../types/operations-team";
import { cn } from "../utils/cn";

const ROLE_STATUS_OPTIONS = [
  { value: "active", label: "Active" },
  { value: "archived", label: "Archived" },
  { value: "all", label: "All" },
] as const;

const ROLE_SCOPE_OPTIONS = [
  { value: "all", label: "All Roles" },
] as const;

const PAGE_SIZE = 10;

function formatRoleCreatedAt(value: string | null | undefined): string {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  const day = new Intl.DateTimeFormat("en-GB", { day: "2-digit" }).format(date);
  const month = new Intl.DateTimeFormat("en-GB", { month: "short" }).format(date);
  const year = new Intl.DateTimeFormat("en-GB", { year: "numeric" }).format(date);
  const time = new Intl.DateTimeFormat("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  })
    .format(date)
    .toLowerCase();
  return `${day} ${month} ${year},\n${time}`;
}

function RolesHierarchyToggle({
  tab,
  onChange,
}: {
  tab: "roles" | "hierarchy";
  onChange: (next: "roles" | "hierarchy") => void;
}) {
  return (
    <div className="inline-flex w-fit rounded-lg border border-border-subtle bg-surface p-1 shadow-[0_1px_2px_rgba(15,23,42,0.03)]">
      <button
        type="button"
        onClick={() => onChange("roles")}
        className={cn(
          "rounded-md px-3.5 py-1.5 text-[12px] font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30",
          tab === "roles"
            ? "bg-primary text-white"
            : "text-muted hover:text-foreground",
        )}
      >
        Roles
      </button>
      <button
        type="button"
        onClick={() => onChange("hierarchy")}
        className={cn(
          "rounded-md px-3.5 py-1.5 text-[12px] font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30",
          tab === "hierarchy"
            ? "bg-primary text-white"
            : "text-muted hover:text-foreground",
        )}
      >
        Hierarchy
      </button>
    </div>
  );
}

export function OperationsRolesPage() {
  const [tab, setTab] = useState<"roles" | "hierarchy">("roles");
  const [status, setStatus] = useState<"active" | "archived" | "all">("active");
  const [scope, setScope] = useState("all");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [archiveTarget, setArchiveTarget] = useState<OperationsRole | null>(
    null,
  );
  const [reassignRoleId, setReassignRoleId] = useState("");
  const [error, setError] = useState("");

  const rolesQuery = useOperationsRoles({ search, status });
  const hierarchyQuery = useOperationsRoleHierarchy();
  const archiveMutation = useArchiveOperationsRole();
  const restoreMutation = useRestoreOperationsRole();
  const roles = rolesQuery.data?.roles ?? [];

  const totalPages = Math.max(1, Math.ceil(roles.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const pagedRoles = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return roles.slice(start, start + PAGE_SIZE);
  }, [currentPage, roles]);

  const openArchive = (role: OperationsRole) => {
    setError("");
    setReassignRoleId("");
    setArchiveTarget(role);
  };

  return (
    <OperationsLayout title="Roles & Permissions" headerVariant="command">
      <div className="flex flex-col gap-4 lg:gap-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <Link
              to={OPERATIONS_ROUTES.ORGANIZATION}
              className="inline-flex items-center gap-1.5 text-[12px] font-medium text-muted transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
            >
              <ArrowLeft className="size-3.5" aria-hidden="true" />
              Organization
            </Link>
            <h1 className="mt-2 text-[22px] font-semibold tracking-tight text-foreground sm:text-[24px]">
              Roles &amp; Permissions
            </h1>
            <p className="mt-1 max-w-2xl text-[13px] leading-snug text-muted">
              Manage roles, permissions and control access across the
              organization.
            </p>
          </div>
          <OperationsCan module="roles" action="create">
            <Link
              to={OPERATIONS_ROUTES.ROLES_NEW}
              className="inline-flex h-[42px] min-w-[130px] shrink-0 items-center justify-center gap-1.5 rounded-[10px] bg-primary px-4 text-[13px] font-semibold text-white shadow-sm hover:bg-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
            >
              <Plus className="size-4" strokeWidth={2.5} aria-hidden="true" />
              Create Role
            </Link>
          </OperationsCan>
        </div>

        <OrganizationTabs />

        {tab === "hierarchy" ? (
          <RolesHierarchyPanel
            tree={hierarchyQuery.data?.tree ?? []}
            isLoading={hierarchyQuery.isPending}
            isError={hierarchyQuery.isError}
            errorMessage={getOperationsApiErrorMessage(
              hierarchyQuery.error,
              "Unable to load role hierarchy.",
            )}
            onRetry={() => void hierarchyQuery.refetch()}
            onArchive={openArchive}
            onRestore={(role) => {
              void restoreMutation.mutateAsync({
                roleId: role.id,
                expectedRevision: role.revision,
              });
            }}
            leadingControls={
              <RolesHierarchyToggle tab={tab} onChange={setTab} />
            }
          />
        ) : (
          <>
            <RolesHierarchyToggle tab={tab} onChange={setTab} />

            <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center">
              <label className="relative min-w-0 flex-1">
                <span className="sr-only">Search roles</span>
                <Search
                  className="pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-muted"
                  aria-hidden="true"
                />
                <input
                  type="search"
                  value={search}
                  onChange={(event) => {
                    setSearch(event.target.value);
                    setPage(1);
                  }}
                  placeholder="Search roles..."
                  className="h-10 w-full rounded-lg border border-border-subtle bg-surface pl-9 pr-3 text-[12px] font-medium text-foreground shadow-[0_1px_2px_rgba(15,23,42,0.04)] placeholder:font-normal placeholder:text-muted transition-[border-color,box-shadow] hover:border-primary/25 focus-visible:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
                />
              </label>
              <div className="grid w-full grid-cols-2 gap-2.5 sm:flex sm:w-auto sm:shrink-0">
                <div className="min-w-0 sm:w-[9.5rem]">
                  <OperationsFilterSelect
                    label="All Roles"
                    value={scope}
                    options={ROLE_SCOPE_OPTIONS}
                    onChange={setScope}
                    hideSearch
                    triggerClassName="h-10 rounded-lg text-[12px]"
                  />
                </div>
                <div className="min-w-0 sm:w-[8.5rem]">
                  <OperationsFilterSelect
                    label="Role status"
                    value={status}
                    options={ROLE_STATUS_OPTIONS}
                    onChange={(value) => {
                      setStatus(value as "active" | "archived" | "all");
                      setPage(1);
                    }}
                    hideSearch
                    triggerClassName="h-10 rounded-lg text-[12px]"
                  />
                </div>
              </div>
            </div>

            {rolesQuery.isError ? (
              <p className="text-sm text-danger">
                {getOperationsApiErrorMessage(
                  rolesQuery.error,
                  "Unable to load roles.",
                )}
              </p>
            ) : rolesQuery.isPending ? (
              <div className="h-64 animate-pulse rounded-xl border border-border-subtle bg-surface" />
            ) : roles.length === 0 ? (
              <div className="rounded-xl border border-dashed border-border-subtle bg-surface px-6 py-16 text-center text-sm text-muted">
                No custom roles yet. Create a role with any name, then assign
                exact permissions.
              </div>
            ) : (
              <div className="overflow-hidden rounded-xl border border-border-subtle bg-surface shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
                <div className="overflow-x-auto">
                  <table className="min-w-[64rem] w-full border-collapse text-left">
                    <thead>
                      <tr className="border-b border-border-subtle bg-[#F8FAFC]">
                        {(
                          [
                            "Role",
                            "Department",
                            "Parent",
                            "Members",
                            "Created by",
                            "Created",
                            "Can create roles",
                            "Actions",
                          ] as const
                        ).map((label) => (
                          <th
                            key={label}
                            className={cn(
                              "px-4 py-3 text-[10px] font-semibold uppercase tracking-[0.06em] text-muted",
                              label === "Actions" && "text-center",
                              label === "Members" && "text-center",
                              label === "Can create roles" && "text-center",
                            )}
                          >
                            {label}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {pagedRoles.map((role) => {
                        const { Icon, className: iconClass } = getRoleVisual(
                          role.name,
                        );
                        return (
                          <tr
                            key={role.id}
                            className="border-b border-border-subtle/80 last:border-0 hover:bg-[#F8FAFC]/50"
                          >
                            <td className="px-4 py-3.5 align-middle">
                              <div className="flex min-w-0 items-start gap-2.5">
                                <span
                                  className={cn(
                                    "mt-0.5 inline-flex size-7 shrink-0 items-center justify-center rounded-md",
                                    iconClass,
                                  )}
                                  aria-hidden="true"
                                >
                                  <Icon className="size-3.5" strokeWidth={2} />
                                </span>
                                <div className="min-w-0">
                                  <p className="truncate text-[14px] font-semibold leading-snug text-foreground">
                                    {role.name}
                                  </p>
                                  <p className="mt-0.5 line-clamp-2 text-[12px] leading-snug text-muted">
                                    {role.description?.trim() || "—"}
                                  </p>
                                </div>
                              </div>
                            </td>
                            <td className="px-4 py-3.5 align-middle text-[13px] text-muted">
                              {role.departmentName || "—"}
                            </td>
                            <td className="px-4 py-3.5 align-middle text-[13px] text-muted">
                              {role.parentRoleName || "—"}
                            </td>
                            <td className="px-4 py-3.5 align-middle text-center text-[13px] font-medium text-foreground">
                              {role.memberCount}
                            </td>
                            <td className="px-4 py-3.5 align-middle text-[13px] text-muted">
                              {role.createdByName || "—"}
                            </td>
                            <td className="px-4 py-3.5 align-middle text-[12px] leading-snug whitespace-pre-line text-muted">
                              {formatRoleCreatedAt(role.createdAt)}
                            </td>
                            <td className="px-4 py-3.5 align-middle text-center">
                              {role.canCreateRoles ? (
                                <span className="inline-flex rounded-full bg-[#E8F7EE] px-2.5 py-0.5 text-[11px] font-semibold text-[#15803D]">
                                  Yes
                                </span>
                              ) : (
                                <span className="inline-flex rounded-full bg-[#FDECEC] px-2.5 py-0.5 text-[11px] font-semibold text-[#B42318]">
                                  No
                                </span>
                              )}
                            </td>
                            <td className="px-4 py-3.5 align-middle text-center">
                              <div className="flex justify-center">
                                <RolesRowActions
                                  role={role}
                                  onArchive={openArchive}
                                  onRestore={(target) => {
                                    void restoreMutation.mutateAsync({
                                      roleId: target.id,
                                      expectedRevision: target.revision,
                                    });
                                  }}
                                />
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                <div className="flex flex-col gap-3 border-t border-border-subtle px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                  <p className="text-[12px] text-muted">
                    Showing {roles.length} role{roles.length === 1 ? "" : "s"}
                  </p>
                  <nav
                    className="flex items-center gap-1.5"
                    aria-label="Roles pagination"
                  >
                    <button
                      type="button"
                      disabled={currentPage <= 1}
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      className="inline-flex size-8 items-center justify-center rounded-md border border-border-subtle bg-surface text-muted transition-colors hover:bg-hero-bg hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 disabled:cursor-not-allowed disabled:opacity-40"
                      aria-label="Previous page"
                    >
                      <ChevronLeft className="size-4" aria-hidden="true" />
                    </button>
                    <span
                      className="inline-flex size-8 items-center justify-center rounded-md bg-primary text-[12px] font-semibold text-white"
                      aria-current="page"
                    >
                      {currentPage}
                    </span>
                    <button
                      type="button"
                      disabled={currentPage >= totalPages}
                      onClick={() =>
                        setPage((p) => Math.min(totalPages, p + 1))
                      }
                      className="inline-flex size-8 items-center justify-center rounded-md border border-border-subtle bg-surface text-muted transition-colors hover:bg-hero-bg hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 disabled:cursor-not-allowed disabled:opacity-40"
                      aria-label="Next page"
                    >
                      <ChevronRight className="size-4" aria-hidden="true" />
                    </button>
                  </nav>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {archiveTarget ? (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-foreground/40 p-4 sm:items-center">
          <div className="w-full max-w-md rounded-2xl border border-border-subtle bg-surface p-5 shadow-lg">
            <h2 className="text-base font-bold text-foreground">Archive role</h2>
            <p className="mt-2 text-sm text-muted">
              {archiveTarget.name} has {archiveTarget.memberCount} assigned
              members and {archiveTarget.childCount} child roles. Child roles
              must be archived first. Members must be reassigned if any remain.
            </p>
            {archiveTarget.memberCount > 0 ? (
              <div className="mt-3 grid gap-1.5">
                <p className="text-xs font-semibold text-muted">
                  Reassign members to
                </p>
                <OperationsFilterSelect
                  label="Reassign members to"
                  value={reassignRoleId}
                  options={[
                    { value: "", label: "Select a role" },
                    ...roles
                      .filter(
                        (role) =>
                          role.id !== archiveTarget.id &&
                          role.status === "active",
                      )
                      .map((role) => ({
                        value: role.id,
                        label: role.name,
                      })),
                  ]}
                  onChange={setReassignRoleId}
                  hideSearch={roles.length <= 8}
                  triggerClassName="h-9 rounded-lg text-xs"
                />
              </div>
            ) : null}
            {error ? <p className="mt-2 text-sm text-danger">{error}</p> : null}
            <div className="mt-4 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setArchiveTarget(null)}
                className="h-10 rounded-lg border border-border-subtle px-4 text-sm font-semibold"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={async () => {
                  try {
                    await archiveMutation.mutateAsync({
                      roleId: archiveTarget.id,
                      expectedRevision: archiveTarget.revision,
                      reassignRoleId: reassignRoleId || undefined,
                    });
                    setArchiveTarget(null);
                  } catch (archiveError) {
                    setError(
                      getOperationsApiErrorMessage(
                        archiveError,
                        "Unable to archive this role.",
                      ),
                    );
                  }
                }}
                className="h-10 rounded-lg bg-danger px-4 text-sm font-semibold text-white"
              >
                Archive
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </OperationsLayout>
  );
}
