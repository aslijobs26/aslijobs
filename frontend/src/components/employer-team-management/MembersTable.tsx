"use client";

import {
  ACCESS_LEVEL_LABELS,
  ACCESS_LEVEL_PILL_CLASS,
  MEMBER_STATUS_PILL_CLASS,
} from "@/constants/employer-team-management";
import { ROUTES } from "@/constants/routes";
import { useCan } from "@/providers/employer-permission-provider";
import type { TeamMemberListItem } from "@/types/employer-team";
import { cn } from "@/utils/cn";
import {
  formatLastActive,
  getInitials,
  roleBadgeClass,
} from "@/utils/employer-team";
import {
  Eye,
  MoreVertical,
  Pencil,
  Power,
  RefreshCw,
  Trash2,
  UserMinus,
  UserPlus,
  XCircle,
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

type MembersTableProps = {
  members: TeamMemberListItem[];
  currentUserEmail?: string | null;
  isLoading?: boolean;
  isError?: boolean;
  onRetry?: () => void;
  onEdit: (member: TeamMemberListItem) => void;
  onDeactivate: (member: TeamMemberListItem) => void;
  onActivate: (member: TeamMemberListItem) => void;
  onRemove: (member: TeamMemberListItem) => void;
  onResend: (member: TeamMemberListItem) => void;
  onCancelInvite: (member: TeamMemberListItem) => void;
};

export function MembersTable({
  members,
  currentUserEmail = null,
  isLoading = false,
  isError = false,
  onRetry,
  onEdit,
  onDeactivate,
  onActivate,
  onRemove,
  onResend,
  onCancelInvite,
}: MembersTableProps) {
  const { can, canField } = useCan();
  const canViewEmail = canField("team_management", "email");
  const canViewRole = canField("team_management", "role");
  const canViewDepartment = canField("team_management", "department");
  const canUpdateMember = can("team_management", "update");
  const canCreateMember = can("team_management", "create");
  const canDeleteMember = can("team_management", "delete");
  const normalizedCurrentEmail = currentUserEmail?.trim().toLowerCase() ?? "";
  if (isError) {
    return (
      <div className="p-8 text-center">
        <p className="text-sm font-semibold text-foreground">
          Unable to load team members
        </p>
        {onRetry ? (
          <button
            type="button"
            onClick={onRetry}
            className="mt-3 inline-flex h-9 items-center rounded-lg bg-primary px-3 text-sm font-semibold text-surface"
          >
            Try again
          </button>
        ) : null}
      </div>
    );
  }

  return (
    <div className="min-w-0 overflow-x-auto overscroll-x-contain scrollbar-hidden">
      <table className="min-w-[70rem] w-full border-collapse text-left">
        <thead>
          <tr className="border-b border-border-subtle bg-hero-bg/60 text-xs font-semibold uppercase tracking-wide text-muted">
            <th className="px-4 py-3">Member</th>
            <th className="px-4 py-3">Role</th>
            <th className="px-4 py-3">Department</th>
            <th className="px-4 py-3">Access Level</th>
            <th className="px-4 py-3">Status</th>
            <th className="px-4 py-3">Last Active</th>
            <th className="px-4 py-3 text-right">Actions</th>
          </tr>
        </thead>
        <tbody>
          {isLoading
            ? Array.from({ length: 6 }).map((_, index) => (
                <tr key={`sk-${index}`} className="border-b border-border-subtle">
                  {Array.from({ length: 7 }).map((__, cell) => (
                    <td key={cell} className="px-4 py-3.5">
                      <div className="h-4 w-24 animate-pulse rounded bg-hero-bg" />
                    </td>
                  ))}
                </tr>
              ))
            : null}

          {!isLoading && members.length === 0 ? (
            <tr>
              <td colSpan={7} className="px-4 py-12 text-center text-sm text-muted">
                No team members yet. Invite your first teammate to get started.
              </td>
            </tr>
          ) : null}

          {!isLoading
            ? members.map((member) => {
                const isYou =
                  normalizedCurrentEmail.length > 0 &&
                  member.email.trim().toLowerCase() === normalizedCurrentEmail;

                return (
                <tr
                  key={member.id}
                  className="border-b border-border-subtle last:border-b-0 hover:bg-primary-light/20"
                >
                  <td className="px-4 py-3.5">
                    <div className="flex min-w-0 items-center gap-2.5">
                      <span className="inline-flex size-9 shrink-0 items-center justify-center rounded-full bg-primary-light text-[0.6875rem] font-bold text-primary">
                        {getInitials(member.fullName)}
                      </span>
                      <div className="min-w-0">
                        <div className="flex min-w-0 items-center gap-1.5">
                          <p className="truncate text-sm font-semibold text-foreground">
                            {member.fullName}
                          </p>
                          {isYou ? (
                            <span className="inline-flex shrink-0 rounded-full bg-primary-light px-1.5 py-0.5 text-[0.625rem] font-bold uppercase tracking-wide text-primary">
                              You
                            </span>
                          ) : null}
                        </div>
                        <p className="truncate text-xs text-muted">
                          {canViewEmail ? member.email : "—"}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3.5">
                    {canViewRole && member.role ? (
                      <span
                        className={cn(
                          "inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold",
                          roleBadgeClass(member.role.name),
                        )}
                      >
                        {member.role.name}
                      </span>
                    ) : (
                      <span className="text-sm text-muted">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3.5 text-sm text-foreground">
                    {canViewDepartment
                      ? (member.department?.name ?? "—")
                      : "—"}
                  </td>
                  <td className="px-4 py-3.5">
                    <span
                      className={cn(
                        "inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold",
                        ACCESS_LEVEL_PILL_CLASS[member.accessLevel],
                      )}
                    >
                      {ACCESS_LEVEL_LABELS[member.accessLevel]}
                    </span>
                  </td>
                  <td className="px-4 py-3.5">
                    <span
                      className={cn(
                        "inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize",
                        MEMBER_STATUS_PILL_CLASS[member.status],
                      )}
                    >
                      {member.status}
                    </span>
                    {member.status === "invited" &&
                    member.emailDeliveryStatus === "failed" ? (
                      <span className="mt-1 block text-[0.6875rem] font-medium text-amber-700">
                        Email delivery failed — resend
                      </span>
                    ) : null}
                  </td>
                  <td className="px-4 py-3.5 text-sm text-muted">
                    {formatLastActive(member.lastActiveAt)}
                  </td>
                  <td className="px-4 py-3.5">
                    <div className="flex items-center justify-end gap-1">
                      {member.status === "invited" ? (
                        canCreateMember || canUpdateMember ? (
                          <button
                            type="button"
                            onClick={() => onResend(member)}
                            className="inline-flex h-8 items-center gap-1 rounded-md px-2 text-xs font-semibold text-primary hover:bg-primary-light focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
                          >
                            <RefreshCw className="size-3.5" aria-hidden="true" />
                            Resend Invite
                          </button>
                        ) : null
                      ) : (
                        <>
                          <Link
                            href={ROUTES.employerTeamMember(member.id)}
                            className="inline-flex size-8 items-center justify-center rounded-md text-muted hover:bg-primary-light hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
                            aria-label={`View ${member.fullName}`}
                          >
                            <Eye className="size-4" aria-hidden="true" />
                          </Link>
                          {canUpdateMember ? (
                            <button
                              type="button"
                              onClick={() => onEdit(member)}
                              className="inline-flex size-8 items-center justify-center rounded-md text-muted hover:bg-primary-light hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
                              aria-label={`Edit ${member.fullName}`}
                            >
                              <Pencil className="size-4" aria-hidden="true" />
                            </button>
                          ) : null}
                        </>
                      )}
                      <MemberActionsMenu
                        member={member}
                        canUpdate={canUpdateMember}
                        canCreate={canCreateMember}
                        canDelete={canDeleteMember}
                        onEdit={onEdit}
                        onActivate={onActivate}
                        onDeactivate={onDeactivate}
                        onRemove={onRemove}
                        onResend={onResend}
                        onCancelInvite={onCancelInvite}
                      />
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

function MemberActionsMenu({
  member,
  canUpdate,
  canCreate,
  canDelete,
  onEdit,
  onActivate,
  onDeactivate,
  onRemove,
  onResend,
  onCancelInvite,
}: {
  member: TeamMemberListItem;
  canUpdate: boolean;
  canCreate: boolean;
  canDelete: boolean;
  onEdit: (member: TeamMemberListItem) => void;
  onActivate: (member: TeamMemberListItem) => void;
  onDeactivate: (member: TeamMemberListItem) => void;
  onRemove: (member: TeamMemberListItem) => void;
  onResend: (member: TeamMemberListItem) => void;
  onCancelInvite: (member: TeamMemberListItem) => void;
}) {
  const [open, setOpen] = useState(false);
  const [menuStyle, setMenuStyle] = useState<CSSProperties | null>(null);
  const menuId = useId();
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const hasMenuActions =
    (member.status !== "invited" && canUpdate) ||
    (member.status === "invited" && (canCreate || canUpdate || canDelete)) ||
    (member.status === "active" && canUpdate) ||
    ((member.status === "inactive" || member.status === "suspended") &&
      canUpdate) ||
    canDelete;

  if (!hasMenuActions) {
    return null;
  }

  const updateMenuPosition = () => {
    const trigger = triggerRef.current;
    if (!trigger) return;

    const rect = trigger.getBoundingClientRect();
    const menuWidth = 192;
    const estimatedHeight =
      member.status === "invited" ? 140 : member.status === "active" ? 160 : 180;
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
  }, [open, member.status]);

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
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={menuId}
        onClick={(event) => {
          event.preventDefault();
          event.stopPropagation();
          setOpen((current) => !current);
        }}
        className="inline-flex size-8 items-center justify-center rounded-md text-muted hover:bg-primary-light hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
        aria-label={`More actions for ${member.fullName}`}
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
              {member.status !== "invited" && canUpdate ? (
                <button
                  type="button"
                  role="menuitem"
                  className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-foreground hover:bg-primary-light"
                  onClick={() => closeAndRun(() => onEdit(member))}
                >
                  <Pencil className="size-3.5" aria-hidden="true" />
                  Edit
                </button>
              ) : null}
              {member.status === "invited" ? (
                <>
                  {canCreate || canUpdate ? (
                    <button
                      type="button"
                      role="menuitem"
                      className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-foreground hover:bg-primary-light"
                      onClick={() => closeAndRun(() => onResend(member))}
                    >
                      <RefreshCw className="size-3.5" aria-hidden="true" />
                      Resend Invitation
                    </button>
                  ) : null}
                  {canUpdate || canDelete ? (
                    <button
                      type="button"
                      role="menuitem"
                      className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-foreground hover:bg-primary-light"
                      onClick={() => closeAndRun(() => onCancelInvite(member))}
                    >
                      <XCircle className="size-3.5" aria-hidden="true" />
                      Cancel Invitation
                    </button>
                  ) : null}
                </>
              ) : null}
              {member.status === "active" && canUpdate ? (
                <button
                  type="button"
                  role="menuitem"
                  className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-foreground hover:bg-primary-light"
                  onClick={() => closeAndRun(() => onDeactivate(member))}
                >
                  <Power className="size-3.5" aria-hidden="true" />
                  Deactivate
                </button>
              ) : null}
              {(member.status === "inactive" || member.status === "suspended") &&
              canUpdate ? (
                <button
                  type="button"
                  role="menuitem"
                  className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-foreground hover:bg-primary-light"
                  onClick={() => closeAndRun(() => onActivate(member))}
                >
                  <UserPlus className="size-3.5" aria-hidden="true" />
                  Activate
                </button>
              ) : null}
              {canDelete ? (
                <button
                  type="button"
                  role="menuitem"
                  className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50"
                  onClick={() => closeAndRun(() => onRemove(member))}
                >
                  {member.status === "invited" ? (
                    <Trash2 className="size-3.5" aria-hidden="true" />
                  ) : (
                    <UserMinus className="size-3.5" aria-hidden="true" />
                  )}
                  Remove
                </button>
              ) : null}
            </div>,
            document.body,
          )
        : null}
    </div>
  );
}
