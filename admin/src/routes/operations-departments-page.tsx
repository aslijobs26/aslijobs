import { useState } from "react";
import { OperationsLayout } from "../components/operations/layout/OperationsLayout";
import { OperationsCan } from "../components/operations/auth/OperationsCan";
import {
  formatOperationsTimestamp,
  getOperationsApiErrorMessage,
} from "../components/operations/team/team-format";
import {
  useCreateOperationsDepartment,
  useOperationsDepartments,
  useUpdateOperationsDepartment,
} from "../hooks/use-operations-departments";

export function OperationsDepartmentsPage() {
  const [search, setSearch] = useState("");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [error, setError] = useState("");
  const departmentsQuery = useOperationsDepartments({ search, status: "all" });
  const createMutation = useCreateOperationsDepartment();
  const updateMutation = useUpdateOperationsDepartment();
  const departments = departmentsQuery.data?.departments ?? [];

  return (
    <OperationsLayout
      title="Departments"
      subtitle="Organize Operations team members by department."
    >
      <div className="grid gap-4 xl:grid-cols-[20rem_minmax(0,1fr)]">
        <OperationsCan module="departments" action="create">
          <form
            className="space-y-3 rounded-xl border border-border-subtle bg-surface p-4 shadow-sm"
            onSubmit={async (event) => {
              event.preventDefault();
              setError("");
              try {
                await createMutation.mutateAsync({
                  name: name.trim(),
                  description: description.trim(),
                });
                setName("");
                setDescription("");
              } catch (submitError) {
                setError(
                  getOperationsApiErrorMessage(
                    submitError,
                    "Unable to create department.",
                  ),
                );
              }
            }}
          >
            <h2 className="text-sm font-bold text-foreground">Create department</h2>
            <label className="grid gap-1 text-xs font-semibold text-muted">
              Name
              <input
                value={name}
                onChange={(event) => setName(event.target.value)}
                className="h-10 rounded-lg border border-border-subtle bg-hero-bg/50 px-3 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
              />
            </label>
            <label className="grid gap-1 text-xs font-semibold text-muted">
              Description
              <textarea
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                rows={3}
                className="rounded-lg border border-border-subtle bg-hero-bg/50 px-3 py-2 text-sm text-foreground"
              />
            </label>
            {error ? <p className="text-sm text-danger">{error}</p> : null}
            <button
              type="submit"
              disabled={createMutation.isPending || name.trim().length < 2}
              className="h-10 w-full rounded-lg bg-primary text-sm font-semibold text-surface hover:bg-primary-hover disabled:opacity-60"
            >
              {createMutation.isPending ? "Saving…" : "Create"}
            </button>
          </form>
        </OperationsCan>

        <div className="space-y-3">
          <input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search departments"
            className="h-10 w-full rounded-lg border border-border-subtle bg-surface px-3 text-sm text-foreground"
          />
          {departmentsQuery.isError ? (
            <p className="text-sm text-danger">
              {getOperationsApiErrorMessage(
                departmentsQuery.error,
                "Unable to load departments.",
              )}
            </p>
          ) : departmentsQuery.isPending ? (
            <div className="h-64 animate-pulse rounded-xl border border-border-subtle bg-surface" />
          ) : departments.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border-subtle px-6 py-16 text-center text-sm text-muted">
              No departments yet.
            </div>
          ) : (
            <ul className="space-y-2">
              {departments.map((department) => (
                <li
                  key={department.id}
                  className="flex flex-col gap-2 rounded-xl border border-border-subtle bg-surface p-4 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div>
                    <p className="font-semibold text-foreground">{department.name}</p>
                    <p className="text-xs text-muted">
                      {department.description || "No description"} · {department.status} ·{" "}
                      {formatOperationsTimestamp(department.createdAt)}
                    </p>
                  </div>
                  <OperationsCan module="departments" action="update">
                    <button
                      type="button"
                      onClick={() =>
                        void updateMutation.mutateAsync({
                          departmentId: department.id,
                          input: {
                            status:
                              department.status === "active" ? "archived" : "active",
                          },
                        })
                      }
                      className="rounded-lg border border-border-subtle px-3 py-1.5 text-xs font-semibold"
                    >
                      {department.status === "active" ? "Archive" : "Restore"}
                    </button>
                  </OperationsCan>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </OperationsLayout>
  );
}
