import {
  Building2,
  Briefcase,
  Check,
  ClipboardList,
  FileText,
  LayoutDashboard,
  ListChecks,
  MessageSquare,
  RotateCcw,
  Search,
  Settings,
  Shield,
  Users,
  UserRound,
  Workflow,
  type LucideIcon,
} from "lucide-react";
import { useMemo, useState } from "react";
import type {
  OperationsCatalogTreeNode,
  OperationsRole,
  OperationsRoleGrant,
} from "../../../types/operations-team";
import { cn } from "../../../utils/cn";
import { OperationsFilterSelect } from "../jobs/OperationsFilterSelect";
import {
  areKeysFullyGranted,
  areKeysPartiallyGranted,
  buildPermissionMatrixRows,
  filterDelegatableKeys,
  grantKeySet,
  isPermissionColumnLocked,
  PERMISSION_MATRIX_COLUMN_LABELS,
  PERMISSION_MATRIX_COLUMNS,
  selectAllApplicableKeys,
  toggleKeysInGrants,
  type PermissionMatrixColumnId,
  type PermissionMatrixModuleRow,
} from "./permission-matrix";

type PermissionsTab = "module" | "field";

type PermissionMatrixPanelProps = {
  tree: OperationsCatalogTreeNode[];
  grants: OperationsRoleGrant[];
  onChange: (grants: OperationsRoleGrant[]) => void;
  initialGrants: OperationsRoleGrant[];
  templateRoles: OperationsRole[];
  allowedKeys?: string[] | null;
  isSuperAdmin: boolean;
};

const MODULE_ICONS: Record<string, LucideIcon> = {
  dashboard: LayoutDashboard,
  my_work: ClipboardList,
  work_queue: Workflow,
  employers: Building2,
  jobs: Briefcase,
  candidates: UserRound,
  placements: ListChecks,
  team: Users,
  roles: Shield,
  departments: Building2,
  settings: Settings,
  reports: FileText,
  campaigns: MessageSquare,
  whatsapp: MessageSquare,
  support: MessageSquare,
  verifications: Shield,
  activity_logs: FileText,
};

function moduleIcon(moduleId: string): LucideIcon {
  return MODULE_ICONS[moduleId] ?? LayoutDashboard;
}

function MatrixCheckbox({
  checked,
  indeterminate = false,
  disabled = false,
  label,
  onChange,
}: {
  checked: boolean;
  indeterminate?: boolean;
  disabled?: boolean;
  label: string;
  onChange: (next: boolean) => void;
}) {
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={indeterminate ? "mixed" : checked}
      aria-label={label}
      disabled={disabled}
      title={label}
      onClick={() => onChange(!(checked || indeterminate))}
      className={cn(
        "group inline-flex size-8 items-center justify-center rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30",
        disabled && "cursor-not-allowed opacity-45",
      )}
    >
      <span
        className={cn(
          "inline-flex size-[15px] items-center justify-center rounded-[3px] border transition-[background-color,border-color,box-shadow]",
          checked || indeterminate
            ? "border-primary bg-primary text-surface shadow-sm"
            : "border-[#c5ced6] bg-white group-hover:border-primary/70 dark:border-slate-500 dark:bg-slate-900/40",
        )}
        aria-hidden="true"
      >
        {(checked || indeterminate) && (
          <Check className="size-2.5 stroke-[3]" />
        )}
      </span>
    </button>
  );
}

export function PermissionMatrixPanel({
  tree,
  grants,
  onChange,
  initialGrants,
  templateRoles,
  allowedKeys,
  isSuperAdmin,
}: PermissionMatrixPanelProps) {
  const [tab, setTab] = useState<PermissionsTab>("module");
  const [search, setSearch] = useState("");
  const [moduleFilter, setModuleFilter] = useState("all");
  const [templateId, setTemplateId] = useState("custom");

  const allowed = useMemo(
    () => (isSuperAdmin || !allowedKeys ? null : new Set(allowedKeys)),
    [allowedKeys, isSuperAdmin],
  );

  const rows = useMemo(
    () => buildPermissionMatrixRows(tree, allowed),
    [allowed, tree],
  );

  const selected = useMemo(() => grantKeySet(grants), [grants]);

  const filteredRows = useMemo(() => {
    const query = search.trim().toLowerCase();
    return rows.filter((row) => {
      if (moduleFilter !== "all" && row.id !== moduleFilter) {
        return false;
      }
      if (!query) {
        return true;
      }
      return (
        row.label.toLowerCase().includes(query) ||
        row.id.toLowerCase().includes(query)
      );
    });
  }, [moduleFilter, rows, search]);

  const fieldRows = useMemo(
    () =>
      filteredRows
        .map((row) => ({
          id: row.id,
          label: row.label,
          fieldKeys: row.fieldKeys,
        }))
        .filter((row) => row.fieldKeys.length > 0),
    [filteredRows],
  );

  const setColumn = (
    row: PermissionMatrixModuleRow,
    column: PermissionMatrixColumnId,
    enabled: boolean,
  ) => {
    const unlocked = filterDelegatableKeys(row.columnKeys[column], allowed);
    if (unlocked.length === 0) {
      return;
    }
    onChange(toggleKeysInGrants(grants, unlocked, enabled));
  };

  const setFullAccess = (row: PermissionMatrixModuleRow, enabled: boolean) => {
    const unlocked = filterDelegatableKeys(row.leafKeys, allowed);
    if (unlocked.length === 0) {
      return;
    }
    onChange(toggleKeysInGrants(grants, unlocked, enabled));
  };

  const handleSelectAll = () => {
    const keys = selectAllApplicableKeys(rows, tab === "field").filter(
      (key) => !allowed || allowed.has(key),
    );
    onChange(toggleKeysInGrants(grants, keys, true));
  };

  const handleReset = () => {
    if (templateId === "full") {
      const keys = selectAllApplicableKeys(rows, true).filter(
        (key) => !allowed || allowed.has(key),
      );
      onChange(
        keys.map((key) => ({
          key,
          access: "allow" as const,
          canDelegate: false,
        })),
      );
      return;
    }
    if (templateId !== "custom") {
      const template = templateRoles.find((role) => role.id === templateId);
      if (template) {
        const next = (template.grants ?? []).filter(
          (grant) => !allowed || allowed.has(grant.key),
        );
        onChange(next);
        return;
      }
    }
    onChange(initialGrants);
  };

  const handleTemplateChange = (nextTemplateId: string) => {
    setTemplateId(nextTemplateId);
    if (nextTemplateId === "custom") {
      return;
    }
    if (nextTemplateId === "full") {
      const keys = selectAllApplicableKeys(rows, true).filter(
        (key) => !allowed || allowed.has(key),
      );
      onChange(
        keys.map((key) => ({
          key,
          access: "allow" as const,
          canDelegate: false,
        })),
      );
      return;
    }
    const template = templateRoles.find((role) => role.id === nextTemplateId);
    if (!template) {
      return;
    }
    onChange(
      (template.grants ?? []).filter(
        (grant) => !allowed || allowed.has(grant.key),
      ),
    );
  };

  const templateOptions = useMemo(
    () => [
      { value: "custom", label: "Custom" },
      { value: "full", label: "Admin (Full Access)" },
      ...templateRoles.map((role) => ({
        value: role.id,
        label: role.name,
      })),
    ],
    [templateRoles],
  );

  const moduleFilterOptions = useMemo(
    () => [
      { value: "all", label: "All Modules" },
      ...rows.map((row) => ({ value: row.id, label: row.label })),
    ],
    [rows],
  );

  return (
    <section className="flex h-full min-h-[28rem] max-h-[min(42rem,calc(100dvh-10rem))] flex-col overflow-hidden rounded-xl border border-border-subtle bg-surface xl:max-h-[calc(100dvh-9.5rem)]">
      <header className="flex flex-col gap-3 border-b border-border-subtle px-4 py-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <h2 className="text-[14px] font-semibold text-foreground">
            Permissions
          </h2>
          <p className="mt-0.5 text-[11px] text-muted">
            Manage permissions for the selected role.
          </p>
        </div>
        <div className="w-full sm:min-w-[14rem] sm:max-w-[16rem]">
          <OperationsFilterSelect
            label="Permission template"
            value={templateId}
            options={templateOptions}
            onChange={handleTemplateChange}
            hideSearch={templateOptions.length <= 8}
            triggerClassName="h-9 rounded-lg text-[12px]"
          />
        </div>
      </header>

      <div className="border-b border-border-subtle px-4">
        <div className="flex gap-4" role="tablist" aria-label="Permission views">
          {(
            [
              { id: "module", label: "Module Access" },
              { id: "field", label: "Field Level Access" },
            ] as const
          ).map((item) => (
            <button
              key={item.id}
              type="button"
              role="tab"
              aria-selected={tab === item.id}
              onClick={() => setTab(item.id)}
              className={cn(
                "relative py-2.5 text-[12px] font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30",
                tab === item.id
                  ? "text-primary"
                  : "text-muted hover:text-foreground",
              )}
            >
              {item.label}
              {tab === item.id ? (
                <span className="absolute inset-x-0 bottom-0 h-0.5 rounded-full bg-primary" />
              ) : null}
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-2 border-b border-border-subtle px-3 py-2.5 sm:flex-row sm:flex-wrap sm:items-center">
        <label className="relative min-w-0 flex-1 sm:max-w-xs">
          <span className="sr-only">Search modules</span>
          <Search
            className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted"
            aria-hidden="true"
          />
          <input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search modules..."
            className="ops-brand-border-glow h-8 w-full rounded-md border border-border-subtle bg-surface pl-8 pr-2.5 text-[11px] font-medium text-foreground shadow-[0_1px_2px_rgba(15,23,42,0.04)] placeholder:font-normal placeholder:text-muted transition-[border-color,box-shadow] hover:border-primary/25 focus-visible:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
          />
        </label>
        <div className="w-full shrink-0 sm:w-[10.5rem]">
          <OperationsFilterSelect
            label="Filter modules"
            value={moduleFilter}
            options={moduleFilterOptions}
            onChange={setModuleFilter}
            hideSearch={moduleFilterOptions.length <= 10}
          />
        </div>
        <div className="flex flex-wrap items-center gap-2 sm:ml-auto">
          <button
            type="button"
            onClick={handleReset}
            className="ops-brand-border-glow inline-flex h-8 items-center gap-1.5 rounded-md border border-border-subtle bg-surface px-2.5 text-[11px] font-semibold text-foreground shadow-[0_1px_2px_rgba(15,23,42,0.04)] hover:border-primary/25 hover:bg-hero-bg focus-visible:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
          >
            <RotateCcw className="size-3.5" aria-hidden="true" />
            Reset
          </button>
          <button
            type="button"
            onClick={handleSelectAll}
            className="inline-flex h-8 items-center gap-1.5 rounded-md bg-primary px-2.5 text-[11px] font-semibold text-surface shadow-[0_1px_2px_rgba(15,23,42,0.08)] hover:bg-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
          >
            <Check className="size-3.5" aria-hidden="true" />
            Select All
          </button>
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-auto overscroll-contain scrollbar-hidden">
        {tab === "module" ? (
          <table className="min-w-[64rem] w-full border-collapse text-left">
            <thead className="sticky top-0 z-10 bg-hero-bg">
              <tr className="border-b border-border-subtle">
                <th className="sticky left-0 z-20 bg-hero-bg px-3 py-2 text-[10px] font-semibold uppercase tracking-wide text-muted">
                  Module
                </th>
                {PERMISSION_MATRIX_COLUMNS.map((column) => (
                  <th
                    key={column}
                    className="whitespace-nowrap px-2 py-2 text-center text-[10px] font-semibold uppercase tracking-wide text-muted"
                  >
                    {PERMISSION_MATRIX_COLUMN_LABELS[column]}
                  </th>
                ))}
                <th className="whitespace-nowrap px-2 py-2 text-center text-[10px] font-semibold uppercase tracking-wide text-muted">
                  Full Access
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredRows.length === 0 ? (
                <tr>
                  <td
                    colSpan={PERMISSION_MATRIX_COLUMNS.length + 2}
                    className="px-3 py-10 text-center text-[12px] text-muted"
                  >
                    No modules match your search.
                  </td>
                </tr>
              ) : (
                filteredRows.map((row) => {
                  const Icon = moduleIcon(row.id);
                  const fullKeys = filterDelegatableKeys(row.leafKeys, allowed);
                  const fullLocked = isPermissionColumnLocked(
                    row.leafKeys,
                    allowed,
                  );
                  const fullChecked = areKeysFullyGranted(fullKeys, selected);
                  const fullPartial = areKeysPartiallyGranted(
                    fullKeys,
                    selected,
                  );
                  return (
                    <tr
                      key={row.id}
                      className="border-b border-border-subtle/80 hover:bg-hero-bg/40"
                    >
                      <th
                        scope="row"
                        className="sticky left-0 z-[1] bg-surface px-3 py-2.5 text-left"
                      >
                        <span className="inline-flex items-center gap-2 text-[12px] font-medium text-foreground">
                          <span className="inline-flex size-6 items-center justify-center rounded-md bg-hero-bg text-muted">
                            <Icon className="size-3.5" aria-hidden="true" />
                          </span>
                          {row.label}
                        </span>
                      </th>
                      {PERMISSION_MATRIX_COLUMNS.map((column) => {
                        const keys = row.columnKeys[column];
                        if (keys.length === 0) {
                          return (
                            <td
                              key={column}
                              className="px-2 py-2.5 text-center text-[12px] text-muted"
                              aria-label={`${row.label} ${PERMISSION_MATRIX_COLUMN_LABELS[column]} not applicable`}
                            >
                              —
                            </td>
                          );
                        }
                        const unlocked = filterDelegatableKeys(keys, allowed);
                        const locked = isPermissionColumnLocked(keys, allowed);
                        const checked = areKeysFullyGranted(
                          unlocked.length > 0 ? unlocked : keys,
                          selected,
                        );
                        const partial = areKeysPartiallyGranted(
                          unlocked.length > 0 ? unlocked : keys,
                          selected,
                        );
                        return (
                          <td key={column} className="px-2 py-2.5 text-center">
                            <div className="flex justify-center">
                              <MatrixCheckbox
                                checked={checked && !locked}
                                indeterminate={partial && !locked}
                                disabled={locked}
                                label={
                                  locked
                                    ? `${row.label} ${PERMISSION_MATRIX_COLUMN_LABELS[column]} — you do not have permission to delegate this action`
                                    : `${row.label} ${PERMISSION_MATRIX_COLUMN_LABELS[column]}`
                                }
                                onChange={(next) =>
                                  setColumn(row, column, next)
                                }
                              />
                            </div>
                          </td>
                        );
                      })}
                      <td className="px-2 py-2.5 text-center">
                        {row.leafKeys.length === 0 ? (
                          <span className="text-[12px] text-muted">—</span>
                        ) : (
                          <div className="flex justify-center">
                            <MatrixCheckbox
                              checked={fullChecked && !fullLocked}
                              indeterminate={fullPartial && !fullLocked}
                              disabled={fullLocked}
                              label={
                                fullLocked
                                  ? `${row.label} full access — you do not have permission to delegate this action`
                                  : `${row.label} full access`
                              }
                              onChange={(next) => setFullAccess(row, next)}
                            />
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        ) : (
          <div className="space-y-3 p-4">
            {fieldRows.length === 0 ? (
              <p className="py-10 text-center text-[12px] text-muted">
                No field-level permissions match your filters.
              </p>
            ) : (
              fieldRows.map((row) => {
                const Icon = moduleIcon(row.id);
                return (
                  <div
                    key={row.id}
                    className="rounded-lg border border-border-subtle p-3"
                  >
                    <p className="mb-2 inline-flex items-center gap-2 text-[12px] font-semibold text-foreground">
                      <Icon className="size-3.5 text-muted" aria-hidden="true" />
                      {row.label}
                    </p>
                    <ul className="grid gap-1.5 sm:grid-cols-2">
                      {row.fieldKeys.map((key) => {
                        const checked = selected.has(key);
                        const locked = Boolean(
                          allowed && !allowed.has(key),
                        );
                        const label = key.split(".").slice(-2, -1)[0] ?? key;
                        return (
                          <li key={key}>
                            <label
                              className={cn(
                                "flex items-center gap-2 rounded-md px-1.5 py-1 text-[12px] text-foreground",
                                locked
                                  ? "cursor-not-allowed opacity-60"
                                  : "hover:bg-hero-bg/60",
                              )}
                              title={
                                locked
                                  ? "You do not have permission to delegate this field."
                                  : undefined
                              }
                            >
                              <MatrixCheckbox
                                checked={checked && !locked}
                                disabled={locked}
                                label={`${row.label} field ${label}`}
                                onChange={(next) =>
                                  onChange(
                                    toggleKeysInGrants(grants, [key], next),
                                  )
                                }
                              />
                              <span className="capitalize">
                                {label.replace(/_/g, " ")}
                                {locked ? " (locked)" : ""}
                              </span>
                            </label>
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                );
              })
            )}
          </div>
        )}
      </div>

      <footer className="flex flex-wrap items-center justify-between gap-2 border-t border-border-subtle px-4 py-2.5 text-[11px] text-muted">
        <div className="flex flex-wrap items-center gap-3">
          <span className="inline-flex items-center gap-1.5">
            <span className="inline-flex size-[15px] items-center justify-center rounded-[3px] border border-primary bg-primary text-surface">
              <Check className="size-2.5 stroke-[3]" aria-hidden="true" />
            </span>
            Allowed
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="size-[15px] rounded-[3px] border border-[#c5ced6] bg-white dark:border-slate-500 dark:bg-slate-900/40" />
            Not Allowed
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span aria-hidden="true">—</span>
            Not Applicable
          </span>
        </div>
        <p>
          {tab === "module"
            ? `${filteredRows.length} module${filteredRows.length === 1 ? "" : "s"}`
            : `${fieldRows.length} module${fieldRows.length === 1 ? "" : "s"} with fields`}
        </p>
      </footer>
    </section>
  );
}
