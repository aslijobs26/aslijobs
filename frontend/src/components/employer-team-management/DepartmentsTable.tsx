"use client";

import {
  DEPARTMENT_COLOR_ICON_WRAP,
  DEPARTMENT_STATUS_PILL_CLASS,
} from "@/constants/employer-team-management";
import { ROUTES } from "@/constants/routes";
import type { DepartmentListItem } from "@/types/employer-team";
import { cn } from "@/utils/cn";
import {
  formatDepartmentDate,
  getInitials,
} from "@/utils/employer-team";
import {
  Building2,
  Briefcase,
  Eye,
  Headphones,
  Megaphone,
  MoreVertical,
  Pencil,
  Power,
  Settings,
  Shield,
  Trash2,
  Users,
  Wallet,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useId, useRef, useState } from "react";

const ICON_MAP: Record<string, LucideIcon> = {
  building: Building2,
  users: Users,
  briefcase: Briefcase,
  headphones: Headphones,
  wallet: Wallet,
  megaphone: Megaphone,
  settings: Settings,
  shield: Shield,
};

type DepartmentsTableProps = {
  departments: DepartmentListItem[];
  isLoading?: boolean;
  isError?: boolean;
  canUpdate?: boolean;
  canDelete?: boolean;
  onRetry?: () => void;
  onEdit: (department: DepartmentListItem) => void;
  onDeactivate: (department: DepartmentListItem) => void;
  onDelete: (department: DepartmentListItem) => void;
};

export function DepartmentsTable({
  departments,
  isLoading = false,
  isError = false,
  canUpdate = true,
  canDelete = true,
  onRetry,
  onEdit,
  onDeactivate,
  onDelete,
}: DepartmentsTableProps) {
  if (isError) {
    return (
      <div className="rounded-xl border border-border-subtle bg-surface p-8 text-center shadow-sm">
        <p className="text-sm font-semibold text-foreground">
          Unable to load departments
        </p>
        <p className="mt-1 text-sm text-muted">
          Something went wrong while loading departments.
        </p>
        {onRetry ? (
          <button
            type="button"
            onClick={onRetry}
            className="mt-4 inline-flex h-9 items-center rounded-lg bg-primary px-3 text-sm font-semibold text-surface hover:bg-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
          >
            Try again
          </button>
        ) : null}
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-[64rem] w-full border-collapse text-left">
          <thead>
            <tr className="border-b border-border-subtle bg-hero-bg/60 text-xs font-semibold uppercase tracking-wide text-muted">
              <th className="px-4 py-3">Department</th>
              <th className="px-4 py-3">Department Head</th>
              <th className="px-4 py-3">Members</th>
              <th className="px-4 py-3">Description</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Created Date</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {isLoading
              ? Array.from({ length: 5 }).map((_, index) => (
                  <tr
                    key={`skeleton-${index}`}
                    className="border-b border-border-subtle"
                  >
                    {Array.from({ length: 7 }).map((__, cell) => (
                      <td key={cell} className="px-4 py-3.5">
                        <div className="h-4 w-full max-w-[8rem] animate-pulse rounded bg-hero-bg" />
                      </td>
                    ))}
                  </tr>
                ))
              : null}

            {!isLoading && departments.length === 0 ? (
              <tr>
                <td
                  colSpan={7}
                  className="px-4 py-12 text-center text-sm text-muted"
                >
                  No departments found. Create your first department to build
                  your organization.
                </td>
              </tr>
            ) : null}

            {!isLoading
              ? departments.map((department) => {
                  const Icon =
                    ICON_MAP[department.icon || "building"] ?? Building2;
                  const colorKey =
                    department.color && department.color in DEPARTMENT_COLOR_ICON_WRAP
                      ? department.color
                      : "primary";
                  const wrapClass =
                    DEPARTMENT_COLOR_ICON_WRAP[colorKey] ??
                    DEPARTMENT_COLOR_ICON_WRAP.primary;

                  return (
                    <tr
                      key={department.id}
                      className="border-b border-border-subtle last:border-b-0 hover:bg-primary-light/20"
                    >
                      <td className="px-4 py-3.5">
                        <div className="flex min-w-0 items-center gap-2.5">
                          <span
                            className={cn(
                              "inline-flex size-9 shrink-0 items-center justify-center rounded-lg",
                              wrapClass,
                            )}
                          >
                            <Icon className="size-4" aria-hidden="true" />
                          </span>
                          <div className="min-w-0">
                            <p className="truncate text-sm font-semibold text-foreground">
                              {department.name}
                            </p>
                            {department.code ? (
                              <p className="truncate text-xs text-muted">
                                {department.code}
                              </p>
                            ) : null}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3.5">
                        {department.head ? (
                          <div className="flex min-w-0 items-center gap-2">
                            <span className="inline-flex size-8 shrink-0 items-center justify-center rounded-full bg-primary-light text-[0.6875rem] font-bold text-primary">
                              {getInitials(department.head.fullName)}
                            </span>
                            <div className="min-w-0">
                              <p className="truncate text-sm font-medium text-foreground">
                                {department.head.fullName}
                              </p>
                              <p className="truncate text-xs text-muted">
                                {department.head.email || "Department Head"}
                              </p>
                            </div>
                          </div>
                        ) : (
                          <span className="text-sm text-muted">
                            No Head Assigned
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3.5 text-sm font-semibold tabular-nums text-foreground">
                        {department.memberCount}
                      </td>
                      <td className="px-4 py-3.5">
                        <p className="line-clamp-2 max-w-[14rem] text-sm text-muted">
                          {department.description || "—"}
                        </p>
                      </td>
                      <td className="px-4 py-3.5">
                        <span
                          className={cn(
                            "inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize",
                            DEPARTMENT_STATUS_PILL_CLASS[department.status],
                          )}
                        >
                          {department.status}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-sm text-muted">
                        {formatDepartmentDate(department.createdAt)}
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="flex items-center justify-end gap-1">
                          <Link
                            href={ROUTES.employerTeamDepartment(department.id)}
                            className="inline-flex size-8 items-center justify-center rounded-md text-muted transition-colors hover:bg-primary-light hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
                            aria-label={`View ${department.name}`}
                          >
                            <Eye className="size-4" aria-hidden="true" />
                          </Link>
                          {canUpdate ? (
                            <button
                              type="button"
                              onClick={() => onEdit(department)}
                              className="inline-flex size-8 items-center justify-center rounded-md text-muted transition-colors hover:bg-primary-light hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
                              aria-label={`Edit ${department.name}`}
                            >
                              <Pencil className="size-4" aria-hidden="true" />
                            </button>
                          ) : null}
                          {canUpdate || canDelete ? (
                            <DepartmentActionsMenu
                              department={department}
                              canUpdate={canUpdate}
                              canDelete={canDelete}
                              onDeactivate={onDeactivate}
                              onDelete={onDelete}
                            />
                          ) : null}
                        </div>
                      </td>
                    </tr>
                  );
                })
              : null}
          </tbody>
        </table>
      </div>
  );
}

function DepartmentActionsMenu({
  department,
  canUpdate,
  canDelete,
  onDeactivate,
  onDelete,
}: {
  department: DepartmentListItem;
  canUpdate: boolean;
  canDelete: boolean;
  onDeactivate: (department: DepartmentListItem) => void;
  onDelete: (department: DepartmentListItem) => void;
}) {
  const [open, setOpen] = useState(false);
  const menuId = useId();
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) {
      return;
    }
    const handlePointer = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
      }
    };
    window.addEventListener("mousedown", handlePointer);
    window.addEventListener("keydown", handleKey);
    return () => {
      window.removeEventListener("mousedown", handlePointer);
      window.removeEventListener("keydown", handleKey);
    };
  }, [open]);

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={menuId}
        onClick={() => setOpen((current) => !current)}
        className="inline-flex size-8 items-center justify-center rounded-md text-muted transition-colors hover:bg-primary-light hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
        aria-label={`More actions for ${department.name}`}
      >
        <MoreVertical className="size-4" aria-hidden="true" />
      </button>
      {open ? (
        <div
          id={menuId}
          role="menu"
          className="absolute right-0 z-20 mt-1 w-44 overflow-hidden rounded-lg border border-border-subtle bg-surface py-1 shadow-lg"
        >
          {department.status === "active" && canUpdate ? (
            <button
              type="button"
              role="menuitem"
              className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-foreground hover:bg-primary-light"
              onClick={() => {
                setOpen(false);
                onDeactivate(department);
              }}
            >
              <Power className="size-3.5" aria-hidden="true" />
              Deactivate
            </button>
          ) : null}
          {canDelete ? (
            <button
              type="button"
              role="menuitem"
              className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50"
              onClick={() => {
                setOpen(false);
                onDelete(department);
              }}
            >
              <Trash2 className="size-3.5" aria-hidden="true" />
              Delete
            </button>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
