import { MoreHorizontal } from "lucide-react";
import {
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
} from "react";
import { createPortal } from "react-dom";
import { Link } from "react-router-dom";
import {
  operationsRoleEditPath,
  operationsRolePreviewPath,
} from "../../../constants/operations-routes";
import type { OperationsRole } from "../../../types/operations-team";
import { cn } from "../../../utils/cn";
import { OperationsCan } from "../auth/OperationsCan";

const MENU_WIDTH_PX = 180;
const MENU_ESTIMATED_HEIGHT_PX = 200;
const DROPDOWN_GAP_PX = 4;

interface RolesRowActionsProps {
  role: OperationsRole;
  onArchive: (role: OperationsRole) => void;
  onRestore: (role: OperationsRole) => void;
}

export function RolesRowActions({
  role,
  onArchive,
  onRestore,
}: RolesRowActionsProps) {
  const menuId = useId();
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [menuStyle, setMenuStyle] = useState<CSSProperties>({});

  useLayoutEffect(() => {
    if (!isOpen || !triggerRef.current) {
      return;
    }

    const updatePosition = () => {
      if (!triggerRef.current) return;
      const rect = triggerRef.current.getBoundingClientRect();
      const spaceBelow = window.innerHeight - rect.bottom;
      const openUp =
        spaceBelow < MENU_ESTIMATED_HEIGHT_PX && rect.top > spaceBelow;

      const top = openUp
        ? rect.top - MENU_ESTIMATED_HEIGHT_PX - DROPDOWN_GAP_PX
        : rect.bottom + DROPDOWN_GAP_PX;

      let left = rect.right - MENU_WIDTH_PX;
      if (left < 8) left = 8;
      if (left + MENU_WIDTH_PX > window.innerWidth - 8) {
        left = window.innerWidth - MENU_WIDTH_PX - 8;
      }

      setMenuStyle({
        position: "fixed",
        top: Math.max(8, top),
        left,
        width: MENU_WIDTH_PX,
        zIndex: 50,
      });
    };

    updatePosition();
    window.addEventListener("resize", updatePosition);
    window.addEventListener("scroll", updatePosition, true);
    return () => {
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("scroll", updatePosition, true);
    };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
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
      if (event.key === "Escape") setIsOpen(false);
    };
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [isOpen]);

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        aria-label={`Actions for ${role.name}`}
        aria-haspopup="menu"
        aria-expanded={isOpen}
        aria-controls={menuId}
        onClick={() => setIsOpen((open) => !open)}
        className={cn(
          "inline-flex size-8 items-center justify-center rounded-lg border border-border-subtle bg-surface text-muted shadow-[0_1px_2px_rgba(15,23,42,0.04)] transition-colors hover:bg-hero-bg hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30",
        )}
      >
        <MoreHorizontal className="size-4" aria-hidden="true" />
      </button>
      {isOpen
        ? createPortal(
            <div
              ref={menuRef}
              id={menuId}
              role="menu"
              style={menuStyle}
              className="overflow-hidden rounded-lg border border-border-subtle bg-surface py-1 shadow-md"
            >
              <OperationsCan module="roles" action="update">
                {role.status === "active" ? (
                  <Link
                    role="menuitem"
                    to={operationsRoleEditPath(role.id)}
                    className="block px-3 py-2 text-[12px] font-medium text-foreground hover:bg-hero-bg"
                    onClick={() => setIsOpen(false)}
                  >
                    Edit
                  </Link>
                ) : (
                  <button
                    type="button"
                    role="menuitem"
                    className="block w-full px-3 py-2 text-left text-[12px] font-medium text-success hover:bg-hero-bg"
                    onClick={() => {
                      setIsOpen(false);
                      onRestore(role);
                    }}
                  >
                    Restore
                  </button>
                )}
              </OperationsCan>
              <OperationsCan module="roles" action="read">
                <Link
                  role="menuitem"
                  to={operationsRolePreviewPath(role.id)}
                  className="block px-3 py-2 text-[12px] font-medium text-foreground hover:bg-hero-bg"
                  onClick={() => setIsOpen(false)}
                >
                  Preview
                </Link>
              </OperationsCan>
              <OperationsCan module="roles" action="delete">
                {role.status === "active" ? (
                  <button
                    type="button"
                    role="menuitem"
                    className="block w-full px-3 py-2 text-left text-[12px] font-medium text-danger hover:bg-hero-bg"
                    onClick={() => {
                      setIsOpen(false);
                      onArchive(role);
                    }}
                  >
                    Archive
                  </button>
                ) : null}
              </OperationsCan>
            </div>,
            document.body,
          )
        : null}
    </>
  );
}
