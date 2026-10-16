import { MoreVertical } from "lucide-react";
import {
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
} from "react";
import { createPortal } from "react-dom";
import { useOperationsPermissions } from "../../../hooks/use-operations-permissions";
import type { OperationsTeamMember } from "../../../types/operations-team";
import { cn } from "../../../utils/cn";

const MENU_WIDTH_PX = 180;
const MENU_GAP_PX = 4;
const MENU_ITEM_HEIGHT_PX = 36;
const MENU_VERTICAL_PADDING_PX = 8;
const MENU_EDGE_PADDING_PX = 8;

type PeopleMemberRowActionsProps = {
  member: OperationsTeamMember;
  currentUserId?: string | null;
  isSuperAdminViewer?: boolean;
  showEditInMenu?: boolean;
  onEdit: (member: OperationsTeamMember) => void;
  onActivate: (member: OperationsTeamMember) => void;
  onDeactivate: (member: OperationsTeamMember) => void;
  onDelete: (member: OperationsTeamMember) => void;
};

function peopleMemberMenuStyle(
  triggerRect: DOMRect,
  menuHeight: number,
): CSSProperties {
  const spaceBelow = window.innerHeight - triggerRect.bottom;
  const spaceAbove = triggerRect.top;
  const shouldOpenUp =
    spaceBelow < menuHeight + MENU_GAP_PX && spaceAbove > spaceBelow;
  const available = shouldOpenUp
    ? spaceAbove - MENU_GAP_PX - MENU_EDGE_PADDING_PX
    : spaceBelow - MENU_GAP_PX - MENU_EDGE_PADDING_PX;

  return {
    position: "fixed",
    top: shouldOpenUp ? undefined : triggerRect.bottom + MENU_GAP_PX,
    bottom: shouldOpenUp
      ? window.innerHeight - triggerRect.top + MENU_GAP_PX
      : undefined,
    right: Math.max(MENU_EDGE_PADDING_PX, window.innerWidth - triggerRect.right),
    width: MENU_WIDTH_PX,
    maxHeight: Math.max(available, MENU_ITEM_HEIGHT_PX + MENU_VERTICAL_PADDING_PX),
    overflowY: "auto",
    zIndex: 1000,
  };
}

export function PeopleMemberRowActions({
  member,
  currentUserId,
  isSuperAdminViewer,
  onEdit,
  onActivate,
  onDeactivate,
  onDelete,
}: PeopleMemberRowActionsProps) {
  const menuId = useId();
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [menuStyle, setMenuStyle] = useState<CSSProperties>({});
  const { can, canKey, isLoading } = useOperationsPermissions();

  const isSelf = member.id === currentUserId;
  const canManageSuperAdmin =
    member.role !== "SUPER_ADMIN" || Boolean(isSuperAdminViewer);
  const showEdit =
    !isLoading && can("team", "update") && canManageSuperAdmin;
  const showActivate =
    !isLoading &&
    canKey("team.members.activate") &&
    member.status !== "active" &&
    !isSelf;
  const showDeactivate =
    !isLoading &&
    canKey("team.members.deactivate") &&
    member.status === "active" &&
    !isSelf;
  const showDelete =
    !isLoading &&
    canKey("team.members.delete") &&
    canManageSuperAdmin &&
    member.role !== "SUPER_ADMIN" &&
    !isSelf;
  const menuItemCount =
    Number(showEdit) +
    Number(showActivate) +
    Number(showDeactivate) +
    Number(showDelete);
  const hasMenuItems = menuItemCount > 0;
  const estimatedMenuHeight =
    menuItemCount * MENU_ITEM_HEIGHT_PX + MENU_VERTICAL_PADDING_PX;

  useLayoutEffect(() => {
    if (!isOpen || !hasMenuItems) {
      return;
    }
    const updatePosition = () => {
      if (!triggerRef.current) {
        return;
      }
      const measuredHeight = menuRef.current?.offsetHeight || estimatedMenuHeight;
      setMenuStyle(
        peopleMemberMenuStyle(
          triggerRef.current.getBoundingClientRect(),
          measuredHeight,
        ),
      );
    };
    updatePosition();
    window.addEventListener("resize", updatePosition);
    window.addEventListener("scroll", updatePosition, true);
    return () => {
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("scroll", updatePosition, true);
    };
  }, [isOpen, hasMenuItems, estimatedMenuHeight]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }
    if (!hasMenuItems) {
      setIsOpen(false);
      return;
    }
    const onPointerDown = (event: MouseEvent) => {
      const target = event.target as Node;
      if (
        menuRef.current?.contains(target) ||
        triggerRef.current?.contains(target)
      ) {
        return;
      }
      setIsOpen(false);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [isOpen, hasMenuItems]);

  if (!hasMenuItems) {
    return null;
  }

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        aria-label={`More actions for ${member.fullName}`}
        aria-haspopup="menu"
        aria-expanded={isOpen}
        aria-controls={menuId}
        onClick={() => {
          if (isOpen) {
            setIsOpen(false);
            return;
          }
          if (triggerRef.current) {
            setMenuStyle(
              peopleMemberMenuStyle(
                triggerRef.current.getBoundingClientRect(),
                estimatedMenuHeight,
              ),
            );
          }
          setIsOpen(true);
        }}
        className={cn(
          "inline-flex size-8 items-center justify-center rounded-lg border border-border-subtle bg-surface text-muted transition-colors hover:bg-hero-bg hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30",
          isOpen && "bg-hero-bg text-foreground",
        )}
      >
        <MoreVertical className="size-4" aria-hidden="true" />
      </button>
      {isOpen
        ? createPortal(
            <div
              ref={menuRef}
              id={menuId}
              role="menu"
              style={menuStyle}
              className="overflow-hidden rounded-lg border border-border-subtle bg-surface py-1 shadow-[0_10px_30px_color-mix(in_srgb,var(--color-foreground)_12%,transparent)]"
            >
              {showEdit ? (
                <button
                  type="button"
                  role="menuitem"
                  className="block w-full px-3 py-2 text-left text-[12px] font-medium text-foreground hover:bg-hero-bg"
                  onClick={() => {
                    setIsOpen(false);
                    onEdit(member);
                  }}
                >
                  Edit
                </button>
              ) : null}
              {showActivate ? (
                <button
                  type="button"
                  role="menuitem"
                  className="block w-full px-3 py-2 text-left text-[12px] font-medium text-success hover:bg-hero-bg"
                  onClick={() => {
                    setIsOpen(false);
                    onActivate(member);
                  }}
                >
                  Activate
                </button>
              ) : null}
              {showDeactivate ? (
                <button
                  type="button"
                  role="menuitem"
                  className="block w-full px-3 py-2 text-left text-[12px] font-medium text-danger hover:bg-hero-bg"
                  onClick={() => {
                    setIsOpen(false);
                    onDeactivate(member);
                  }}
                >
                  Deactivate
                </button>
              ) : null}
              {showDelete ? (
                <button
                  type="button"
                  role="menuitem"
                  className="block w-full px-3 py-2 text-left text-[12px] font-medium text-danger hover:bg-hero-bg"
                  onClick={() => {
                    setIsOpen(false);
                    onDelete(member);
                  }}
                >
                  Delete
                </button>
              ) : null}
            </div>,
            document.body,
          )
        : null}
    </>
  );
}
