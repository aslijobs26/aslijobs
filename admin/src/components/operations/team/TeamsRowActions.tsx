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
import { useNavigate } from "react-router-dom";
import { operationsTeamDetailPath } from "../../../constants/operations-routes";
import type { OperationsOpsTeam } from "../../../types/operations-ops-teams";
import { cn } from "../../../utils/cn";
import { OperationsCanKey } from "../auth/OperationsCanKey";

const MENU_WIDTH_PX = 180;
const MENU_ESTIMATED_HEIGHT_PX = 120;
const DROPDOWN_GAP_PX = 4;

type TeamsRowActionsProps = {
  team: OperationsOpsTeam;
  onArchive: (team: OperationsOpsTeam) => void;
};

export function TeamsRowActions({ team, onArchive }: TeamsRowActionsProps) {
  const navigate = useNavigate();
  const menuId = useId();
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [menuStyle, setMenuStyle] = useState<CSSProperties>({});

  const isActive = team.status === "active";

  useLayoutEffect(() => {
    if (!isOpen || !triggerRef.current) return;
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
        aria-label={`More actions for ${team.name}`}
        aria-haspopup="menu"
        aria-expanded={isOpen}
        aria-controls={menuId}
        onClick={() => setIsOpen((open) => !open)}
        className={cn(
          "inline-flex size-8 items-center justify-center rounded-lg border border-border-subtle bg-surface text-muted transition-colors hover:bg-hero-bg hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30",
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
              className="overflow-hidden rounded-lg border border-border-subtle bg-surface py-1 shadow-md"
            >
              <button
                type="button"
                role="menuitem"
                className="block w-full px-3 py-2 text-left text-[12px] font-medium text-foreground hover:bg-hero-bg"
                onClick={() => {
                  setIsOpen(false);
                  void navigate(operationsTeamDetailPath(team.id));
                }}
              >
                View
              </button>
              <OperationsCanKey permissionKey="team.teams.archive">
                {isActive ? (
                  <button
                    type="button"
                    role="menuitem"
                    className="block w-full px-3 py-2 text-left text-[12px] font-medium text-danger hover:bg-hero-bg"
                    onClick={() => {
                      setIsOpen(false);
                      onArchive(team);
                    }}
                  >
                    Archive
                  </button>
                ) : null}
              </OperationsCanKey>
            </div>,
            document.body,
          )
        : null}
    </>
  );
}
