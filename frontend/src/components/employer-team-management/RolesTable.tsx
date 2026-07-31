"use client";

import {
  ROLE_COLOR_ICON_WRAP,
  ROLE_STATUS_PILL_CLASS,
} from "@/constants/employer-team-management";
import { ROUTES } from "@/constants/routes";
import type { TeamRoleListItem } from "@/types/employer-team";
import { cn } from "@/utils/cn";
import {
  Archive,
  Briefcase,
  Building2,
  Copy,
  Eye,
  Headphones,
  MoreVertical,
  Pencil,
  Power,
  Settings,
  Shield,
  Star,
  Trash2,
  Users,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";
import {
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
} from "react";
import { createPortal } from "react-dom";

const ICON_MAP: Record<string, LucideIcon> = {
  shield: Shield,
  users: Users,
  briefcase: Briefcase,
  settings: Settings,
  eye: Eye,
  star: Star,
  building: Building2,
  headphones: Headphones,
};

type RolesTableProps = {
  roles: TeamRoleListItem[];
  selectedRoleId?: string | null;
  isLoading?: boolean;
  isError?: boolean;
  onRetry?: () => void;
  onSelect: (role: TeamRoleListItem) => void;
  onEdit: (role: TeamRoleListItem) => void;
  onDuplicate: (role: TeamRoleListItem) => void;
  onArchive: (role: TeamRoleListItem) => void;
  onDeactivate: (role: TeamRoleListItem) => void;
  onActivate: (role: TeamRoleListItem) => void;
  onDelete: (role: TeamRoleListItem) => void;
};

export function RolesTable({
  roles,
  selectedRoleId,
  isLoading = false,
  isError = false,
  onRetry,
  onSelect,
  onEdit,
  onDuplicate,
  onArchive,
  onDeactivate,
  onActivate,
  onDelete,
}: RolesTableProps) {
  if (isError) {
    return (
      <div className="p-8 text-center">
        <p className="text-sm font-semibold text-foreground">
          Unable to load roles
        </p>
        {onRetry ? (
          <button
            type="button"
            onClick={onRetry}
            className="mt-4 inline-flex h-9 items-center rounded-lg bg-primary px-3 text-sm font-semibold text-surface hover:bg-primary-hover"
          >
            Try again
          </button>
        ) : null}
      </div>
    );
  }

  return (
    <div className="min-w-0 overflow-x-auto overscroll-x-contain scrollbar-hidden">
      <table className="min-w-[36rem] w-full border-collapse text-left">
        <thead>
          <tr className="border-b border-border-subtle text-xs font-semibold uppercase tracking-wide text-muted">
            <th className="px-3 py-2.5 sm:px-4">Role Name</th>
            <th className="px-3 py-2.5">Members</th>
            <th className="px-3 py-2.5">Description</th>
            <th className="px-3 py-2.5">Status</th>
            <th className="px-3 py-2.5 text-right">Actions</th>
          </tr>
        </thead>
        <tbody>
          {isLoading
            ? Array.from({ length: 6 }).map((_, index) => (
                <tr key={`skeleton-${index}`} className="border-b border-border-subtle">
                  {Array.from({ length: 5 }).map((__, cell) => (
                    <td key={cell} className="px-3 py-3">
                      <div className="h-4 w-full max-w-[7rem] animate-pulse rounded bg-hero-bg" />
                    </td>
                  ))}
                </tr>
              ))
            : null}

          {!isLoading && roles.length === 0 ? (
            <tr>
              <td colSpan={5} className="px-3 py-10 text-center text-sm text-muted">
                No roles found. Create a role to get started.
              </td>
            </tr>
          ) : null}

          {!isLoading
            ? roles.map((role) => {
                const Icon = ICON_MAP[role.icon || "shield"] ?? Shield;
                const colorKey =
                  role.color && role.color in ROLE_COLOR_ICON_WRAP
                    ? role.color
                    : "primary";
                return (
                  <tr
                    key={role.id}
                    onClick={() => onSelect(role)}
                    className={cn(
                      "cursor-pointer border-b border-border-subtle transition-colors last:border-b-0 hover:bg-hero-bg/50",
                      selectedRoleId === role.id && "bg-primary-light/35",
                    )}
                  >
                    <td className="px-3 py-3 sm:px-4">
                      <div className="flex min-w-0 items-center gap-2.5">
                        <span
                          className={cn(
                            "inline-flex size-8 shrink-0 items-center justify-center rounded-lg",
                            ROLE_COLOR_ICON_WRAP[colorKey],
                          )}
                        >
                          <Icon className="size-4" aria-hidden="true" />
                        </span>
                        <span className="truncate text-sm font-semibold text-foreground">
                          {role.name}
                        </span>
                      </div>
                    </td>
                    <td className="px-3 py-3 text-sm tabular-nums text-foreground">
                      {role.memberCount}
                    </td>
                    <td className="px-3 py-3 text-xs leading-snug text-muted">
                      {role.description?.trim() || "—"}
                    </td>
                    <td className="px-3 py-3">
                      <span
                        className={cn(
                          "inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize",
                          ROLE_STATUS_PILL_CLASS[role.status],
                        )}
                      >
                        {role.status}
                      </span>
                    </td>
                    <td
                      className="px-3 py-3"
                      onClick={(event) => event.stopPropagation()}
                    >
                      <RoleRowActions
                        role={role}
                        onEdit={onEdit}
                        onDuplicate={onDuplicate}
                        onArchive={onArchive}
                        onDeactivate={onDeactivate}
                        onActivate={onActivate}
                        onDelete={onDelete}
                      />
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

function RoleRowActions({
  role,
  onEdit,
  onDuplicate,
  onArchive,
  onDeactivate,
  onActivate,
  onDelete,
}: {
  role: TeamRoleListItem;
  onEdit: (role: TeamRoleListItem) => void;
  onDuplicate: (role: TeamRoleListItem) => void;
  onArchive: (role: TeamRoleListItem) => void;
  onDeactivate: (role: TeamRoleListItem) => void;
  onActivate: (role: TeamRoleListItem) => void;
  onDelete: (role: TeamRoleListItem) => void;
}) {
  const [open, setOpen] = useState(false);
  const [menuStyle, setMenuStyle] = useState<CSSProperties | null>(null);
  const menuId = useId();
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const updateMenuPosition = () => {
    const trigger = triggerRef.current;
    if (!trigger) return;

    const rect = trigger.getBoundingClientRect();
    const menuWidth = 176;
    const estimatedHeight = 220;
    const gap = 4;
    const spaceBelow = window.innerHeight - rect.bottom;
    const openUpward = spaceBelow < estimatedHeight && rect.top > spaceBelow;

    const left = Math.min(
      Math.max(8, rect.right - menuWidth),
      window.innerWidth - menuWidth - 8,
    );

    if (openUpward) {
      setMenuStyle({
        position: "fixed",
        left,
        bottom: window.innerHeight - rect.top + gap,
        width: menuWidth,
        zIndex: 80,
      });
      return;
    }

    setMenuStyle({
      position: "fixed",
      left,
      top: rect.bottom + gap,
      width: menuWidth,
      zIndex: 80,
    });
  };

  useLayoutEffect(() => {
    if (!open) {
      setMenuStyle(null);
      return;
    }

    updateMenuPosition();
    window.addEventListener("resize", updateMenuPosition);
    window.addEventListener("scroll", updateMenuPosition, true);
    return () => {
      window.removeEventListener("resize", updateMenuPosition);
      window.removeEventListener("scroll", updateMenuPosition, true);
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;

    const onPointerDown = (event: MouseEvent) => {
      const target = event.target as Node;
      if (
        triggerRef.current?.contains(target) ||
        menuRef.current?.contains(target)
      ) {
        return;
      }
      setOpen(false);
    };

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };

    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  const closeAndRun = (action: () => void) => {
    setOpen(false);
    action();
  };

  return (
    <div className="relative flex items-center justify-end">
      <button
        ref={triggerRef}
        type="button"
        aria-label={`More actions for ${role.name}`}
        aria-expanded={open}
        aria-controls={menuId}
        aria-haspopup="menu"
        onClick={(event) => {
          event.preventDefault();
          event.stopPropagation();
          setOpen((value) => !value);
        }}
        className="inline-flex size-8 items-center justify-center rounded-md text-muted hover:bg-hero-bg hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
      >
        <MoreVertical className="size-4" aria-hidden="true" />
      </button>
      {open && menuStyle
        ? createPortal(
            <div
              ref={menuRef}
              id={menuId}
              role="menu"
              style={menuStyle}
              className="rounded-lg border border-border-subtle bg-surface py-1 shadow-lg"
            >
              <Link
                href={ROUTES.employerTeamRole(role.id)}
                role="menuitem"
                className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-foreground hover:bg-hero-bg"
                onClick={() => setOpen(false)}
              >
                <Eye className="size-3.5" aria-hidden="true" />
                View
              </Link>
              <button
                type="button"
                role="menuitem"
                className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-foreground hover:bg-hero-bg"
                onClick={() => closeAndRun(() => onEdit(role))}
              >
                <Pencil className="size-3.5" aria-hidden="true" />
                Edit
              </button>
              <button
                type="button"
                role="menuitem"
                className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-foreground hover:bg-hero-bg"
                onClick={() => closeAndRun(() => onDuplicate(role))}
              >
                <Copy className="size-3.5" aria-hidden="true" />
                Duplicate
              </button>
              {role.status === "active" ? (
                <button
                  type="button"
                  role="menuitem"
                  className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-foreground hover:bg-hero-bg"
                  onClick={() => closeAndRun(() => onDeactivate(role))}
                >
                  <Power className="size-3.5" aria-hidden="true" />
                  Deactivate
                </button>
              ) : (
                <button
                  type="button"
                  role="menuitem"
                  className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-foreground hover:bg-hero-bg"
                  onClick={() => closeAndRun(() => onActivate(role))}
                >
                  <Power className="size-3.5" aria-hidden="true" />
                  Activate
                </button>
              )}
              {!role.isSystem && role.status !== "archived" ? (
                <button
                  type="button"
                  role="menuitem"
                  className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-foreground hover:bg-hero-bg"
                  onClick={() => closeAndRun(() => onArchive(role))}
                >
                  <Archive className="size-3.5" aria-hidden="true" />
                  Archive
                </button>
              ) : null}
              {!role.isSystem ? (
                <button
                  type="button"
                  role="menuitem"
                  className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50"
                  onClick={(event) => {
                    event.preventDefault();
                    event.stopPropagation();
                    closeAndRun(() => onDelete(role));
                  }}
                >
                  <Trash2 className="size-3.5" aria-hidden="true" />
                  Delete
                </button>
              ) : null}
            </div>,
            document.body,
          )
        : null}
    </div>
  );
}

