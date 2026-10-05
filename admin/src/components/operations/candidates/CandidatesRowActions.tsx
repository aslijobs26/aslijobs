import { Copy, MoreVertical } from "lucide-react";
import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
} from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";
import { operationsCandidateDetailPath } from "../../../constants/operations-routes";
import type { OperationsCandidateListItem } from "../../../types/operations-candidates";
import { cn } from "../../../utils/cn";
import { formatCandidateDisplayId } from "./candidates-format";

interface CandidatesRowActionsProps {
  application: OperationsCandidateListItem;
}

const MENU_GAP_PX = 6;
const MENU_ESTIMATED_HEIGHT_PX = 80;

export function CandidatesRowActions({
  application,
}: CandidatesRowActionsProps) {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [menuStyle, setMenuStyle] = useState<CSSProperties>({});
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    if (!open || !triggerRef.current) {
      return;
    }

    const updatePosition = () => {
      if (!triggerRef.current) {
        return;
      }

      const rect = triggerRef.current.getBoundingClientRect();
      const spaceBelow = window.innerHeight - rect.bottom;
      const spaceAbove = rect.top;
      const shouldOpenUp =
        spaceBelow < MENU_ESTIMATED_HEIGHT_PX + MENU_GAP_PX &&
        spaceAbove > spaceBelow;

      setMenuStyle({
        position: "fixed",
        top: shouldOpenUp ? undefined : rect.bottom + MENU_GAP_PX,
        bottom: shouldOpenUp
          ? window.innerHeight - rect.top + MENU_GAP_PX
          : undefined,
        right: window.innerWidth - rect.right,
        zIndex: 1000,
      });
    };

    updatePosition();
    window.addEventListener("resize", updatePosition);
    window.addEventListener("scroll", updatePosition, true);
    return () => {
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("scroll", updatePosition, true);
    };
  }, [open]);

  useEffect(() => {
    if (!open) {
      return;
    }

    const handlePointer = (event: MouseEvent) => {
      const target = event.target as Node;
      if (
        triggerRef.current?.contains(target) ||
        menuRef.current?.contains(target)
      ) {
        return;
      }
      setOpen(false);
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handlePointer);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handlePointer);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [open]);

  const handleView = () => {
    setOpen(false);
    navigate(
      operationsCandidateDetailPath(application.jobSeekerId || application.id),
    );
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(
        formatCandidateDisplayId(application.jobSeekerId || application.id),
      );
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      setCopied(false);
    }
    setOpen(false);
  };

  const menu = open ? (
    <div
      ref={menuRef}
      role="menu"
      style={menuStyle}
      className="min-w-[11rem] overflow-hidden rounded-lg border border-border bg-surface py-1 shadow-[0_10px_30px_color-mix(in_srgb,var(--color-foreground)_12%,transparent)]"
    >
      <button
        type="button"
        role="menuitem"
        onClick={handleView}
        className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs text-foreground transition-colors hover:bg-primary-light hover:text-primary"
      >
        View Profile
      </button>
      <button
        type="button"
        role="menuitem"
        onClick={() => void handleCopy()}
        className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs text-foreground transition-colors hover:bg-primary-light hover:text-primary"
      >
        <Copy className="size-3.5 shrink-0" aria-hidden="true" />
        {copied ? "Copied" : "Copy Candidate ID"}
      </button>
    </div>
  ) : null;

  return (
    <div className="relative flex shrink-0 items-center gap-1.5">
      <button
        ref={triggerRef}
        type="button"
        aria-label={`More actions for ${application.candidateName}`}
        aria-expanded={open}
        aria-haspopup="menu"
        onClick={() => setOpen((current) => !current)}
        className={cn(
          "inline-flex size-8 items-center justify-center rounded-lg text-muted transition-colors xl:size-7",
          "hover:bg-hero-bg hover:text-foreground",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30",
          open && "bg-hero-bg text-foreground",
        )}
      >
        <MoreVertical className="size-3.5 xl:size-3" aria-hidden="true" />
      </button>
      {typeof document !== "undefined" && menu
        ? createPortal(menu, document.body)
        : null}
    </div>
  );
}
