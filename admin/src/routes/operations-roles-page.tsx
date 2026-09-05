import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { GitBranch, Plus } from "lucide-react";
import { OperationsLayout } from "../components/operations/layout/OperationsLayout";
import { OperationsCan } from "../components/operations/auth/OperationsCan";
import {
  formatOperationsTimestamp,
  getOperationsApiErrorMessage,
} from "../components/operations/team/team-format";
import {
  OPERATIONS_ROUTES,
  operationsRoleDetailPath,
  operationsRoleEditPath,
} from "../constants/operations-routes";
import {
  useArchiveOperationsRole,
  useOperationsRoleHierarchy,
  useOperationsRoles,
  useRestoreOperationsRole,
} from "../hooks/use-operations-roles";
import type { OperationsRole, OperationsRoleTreeNode } from "../types/operations-team";
import { cn } from "../utils/cn";

function RoleTree({
  nodes,
  onSelect,
}: {
  nodes: OperationsRoleTreeNode[];
  onSelect: (roleId: string) => void;
}) {
  return (
    <ul className="space-y-2">
      {nodes.map((node) => (
        <li key={node.id} className="min-w-0">
          <button
            type="button"
            onClick={() => {
              if (!node.isSystemRoot) {
                onSelect(node.id);
              }
            }}
            className="flex w-full flex-col rounded-xl border border-border-subtle bg-surface px-3 py-2 text-left shadow-sm hover:border-primary/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 sm:flex-row sm:items-center sm:justify-between"
          >
            <span className="font-semibold text-foreground">{node.name}</span>
            <span className="text-xs text-muted">
              {node.memberCount} members
              {node.departmentName ? ` · ${node.departmentName}` : ""}
              {node.status !== "active" ? ` · ${node.status}` : ""}
            </span>
          </button>
          {node.children.length > 0 ? (
            <div className="ml-4 mt-2 border-l border-border-subtle pl-3">
              <RoleTree nodes={node.children} onSelect={onSelect} />
            </div>
          ) : null}
        </li>
      ))}
    </ul>
  );
}

export function OperationsRolesPage() {
  const navigate = useNavigate();
  const [tab, setTab] = useState<"roles" | "hierarchy">("roles");
  const [status, setStatus] = useState<"active" | "archived" | "all">("active");
  const [search, setSearch] = useState("");
  const [archiveTarget, setArchiveTarget] = useState<OperationsRole | null>(null);
  const [reassignRoleId, setReassignRoleId] = useState("");
  const [error, setError] = useState("");

  const rolesQuery = useOperationsRoles({ search, status });
  const hierarchyQuery = useOperationsRoleHierarchy();
  const archiveMutation = useArchiveOperationsRole();
  const restoreMutation = useRestoreOperationsRole();
  const roles = rolesQuery.data?.roles ?? [];

  return (
    <OperationsLayout
      title="Roles & Permissions"
      subtitle="Create custom roles and define exactly what each role can access and delegate."
    >
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="inline-flex rounded-lg border border-border-subtle bg-surface p-1">
            <button
              type="button"
              onClick={() => setTab("roles")}
              className={cn(
                "rounded-md px-3 py-1.5 text-xs font-semibold",
                tab === "roles"
                  ? "bg-primary text-surface"
                  : "text-muted hover:text-foreground",
              )}
            >
              Roles
            </button>
            <button
              type="button"
              onClick={() => setTab("hierarchy")}
              className={cn(
                "inline-flex items-center gap-1 rounded-md px-3 py-1.5 text-xs font-semibold",
                tab === "hierarchy"
                  ? "bg-primary text-surface"
                  : "text-muted hover:text-foreground",
              )}
            >
              <GitBranch className="size-3.5" aria-hidden="true" />
              Hierarchy
            </button>
          </div>
          <OperationsCan module="roles" action="create">
            <Link
              to={OPERATIONS_ROUTES.ROLES_NEW}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-primary px-4 text-sm font-semibold text-surface hover:bg-primary-hover"
            >
              <Plus className="size-4" aria-hidden="true" />
              Create role
            </Link>
          </OperationsCan>
        </div>

        {tab === "hierarchy" ? (
          hierarchyQuery.isError ? (
            <p className="text-sm text-danger">
              {getOperationsApiErrorMessage(
                hierarchyQuery.error,
                "Unable to load hierarchy.",
              )}
            </p>
          ) : hierarchyQuery.isPending ? (
            <div className="h-64 animate-pulse rounded-xl border border-border-subtle bg-surface" />
          ) : (hierarchyQuery.data?.tree.length ?? 0) === 0 ? (
            <div className="rounded-xl border border-dashed border-border-subtle px-6 py-16 text-center text-sm text-muted">
              No roles are visible in your hierarchy yet.
            </div>
          ) : (
            <RoleTree
              nodes={hierarchyQuery.data?.tree ?? []}
              onSelect={(roleId) => navigate(operationsRoleDetailPath(roleId))}
            />
          )
        ) : (
          <>
            <div className="flex flex-col gap-3 sm:flex-row">
              <input
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search roles"
                className="h-10 min-w-0 flex-1 rounded-lg border border-border-subtle bg-surface px-3 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
              />
              <select
                value={status}
                onChange={(event) =>
                  setStatus(event.target.value as "active" | "archived" | "all")
                }
                className="h-10 rounded-lg border border-border-subtle bg-surface px-3 text-sm text-foreground"
              >
                <option value="active">Active</option>
                <option value="archived">Archived</option>
                <option value="all">All</option>
              </select>
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
              <div className="rounded-xl border border-dashed border-border-subtle px-6 py-16 text-center text-sm text-muted">
                No custom roles yet. Create a role with any name, then assign
                exact permissions.
              </div>
            ) : (
              <div className="overflow-x-auto rounded-xl border border-border-subtle bg-surface">
                <table className="min-w-full text-left text-sm">
                  <thead className="border-b border-border-subtle bg-hero-bg/60 text-[11px] uppercase tracking-wide text-muted">
                    <tr>
                      <th className="px-4 py-3">Role</th>
                      <th className="px-4 py-3">Department</th>
                      <th className="px-4 py-3">Parent</th>
                      <th className="px-4 py-3">Members</th>
                      <th className="px-4 py-3">Created by</th>
                      <th className="px-4 py-3">Created</th>
                      <th className="px-4 py-3">Can create roles</th>
                      <th className="px-4 py-3">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {roles.map((role) => (
                      <tr key={role.id} className="border-b border-border-subtle last:border-0">
                        <td className="px-4 py-3">
                          <p className="font-semibold text-foreground">{role.name}</p>
                          <p className="text-xs text-muted">{role.description || "—"}</p>
                        </td>
                        <td className="px-4 py-3 text-muted">
                          {role.departmentName || "—"}
                        </td>
                        <td className="px-4 py-3 text-muted">
                          {role.parentRoleName || "—"}
                        </td>
                        <td className="px-4 py-3">{role.memberCount}</td>
                        <td className="px-4 py-3 text-muted">
                          {role.createdByName || "—"}
                        </td>
                        <td className="px-4 py-3 text-muted">
                          {formatOperationsTimestamp(role.createdAt)}
                        </td>
                        <td className="px-4 py-3">
                          {role.canCreateRoles ? "Yes" : "No"}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex flex-wrap gap-1.5">
                            <Link
                              to={operationsRoleDetailPath(role.id)}
                              className="rounded-lg border border-border-subtle px-2 py-1 text-xs font-semibold"
                            >
                              View
                            </Link>
                            <OperationsCan module="roles" action="update">
                              {role.status === "active" ? (
                                <Link
                                  to={operationsRoleEditPath(role.id)}
                                  className="rounded-lg border border-border-subtle px-2 py-1 text-xs font-semibold"
                                >
                                  Edit
                                </Link>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => void restoreMutation.mutateAsync(role.id)}
                                  className="rounded-lg border border-success/30 px-2 py-1 text-xs font-semibold text-success"
                                >
                                  Restore
                                </button>
                              )}
                            </OperationsCan>
                            <OperationsCan module="roles" action="delete">
                              {role.status === "active" ? (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setError("");
                                    setReassignRoleId("");
                                    setArchiveTarget(role);
                                  }}
                                  className="rounded-lg border border-danger/30 px-2 py-1 text-xs font-semibold text-danger"
                                >
                                  Archive
                                </button>
                              ) : null}
                            </OperationsCan>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}
      </div>

      {archiveTarget ? (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-foreground/40 p-4 sm:items-center">
          <div className="w-full max-w-md rounded-2xl border border-border-subtle bg-surface p-5">
            <h2 className="text-base font-bold text-foreground">Archive role</h2>
            <p className="mt-2 text-sm text-muted">
              {archiveTarget.name} has {archiveTarget.memberCount} assigned
              members and {archiveTarget.childCount} child roles. Child roles
              must be archived first. Members must be reassigned if any remain.
            </p>
            {archiveTarget.memberCount > 0 ? (
              <label className="mt-3 grid gap-1 text-xs font-semibold text-muted">
                Reassign members to
                <select
                  value={reassignRoleId}
                  onChange={(event) => setReassignRoleId(event.target.value)}
                  className="h-10 rounded-lg border border-border-subtle bg-hero-bg/50 px-3 text-sm text-foreground"
                >
                  <option value="">Select a role</option>
                  {roles
                    .filter(
                      (role) =>
                        role.id !== archiveTarget.id && role.status === "active",
                    )
                    .map((role) => (
                      <option key={role.id} value={role.id}>
                        {role.name}
                      </option>
                    ))}
                </select>
              </label>
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
