import {
  Ban,
  Briefcase,
  CheckCircle2,
  Copy,
  ExternalLink,
  MoreVertical,
  ShieldAlert,
  ShieldCheck,
} from "lucide-react";
import {
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
} from "react";
import { createPortal } from "react-dom";
import { Link, useNavigate } from "react-router-dom";
import {
  OPERATIONS_ROUTES,
  operationsEmployerDetailPath,
} from "../../../constants/operations-routes";
import type { OperationsEmployerListItem } from "../../../types/operations-employers";
import { cn } from "../../../utils/cn";
import { OperationsCan } from "../auth/OperationsCan";
import { OperationsCanKey } from "../auth/OperationsCanKey";

interface EmployersRowActionsProps {
  employer: OperationsEmployerListItem;
  onVerify?: (employer: OperationsEmployerListItem) => void;
  onReject?: (employer: OperationsEmployerListItem) => void;
  onToggleStatus?: (employer: OperationsEmployerListItem) => void;
}

const MENU_WIDTH_PX = 200;
const MENU_ESTIMATED_HEIGHT_PX = 230;
const DROPDOWN_GAP_PX = 4;

export function EmployersRowActions({
  employer,
  onVerify,
  onReject,
  onToggleStatus,
}: EmployersRowActionsProps) {
  const navigate = useNavigate();
  const menuId = useId();
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [menuStyle, setMenuStyle] = useState<CSSProperties>({});
  const [copiedText, setCopiedText] = useState<string | null>(null);

  useLayoutEffect(() => {
    if (!isOpen || !triggerRef.current) {
      return;
    }

    const updatePosition = () => {
      if (!triggerRef.current) return;
      const rect = triggerRef.current.getBoundingClientRect();
      const spaceBelow = window.innerHeight - rect.bottom;
      const openUp = spaceBelow < MENU_ESTIMATED_HEIGHT_PX && rect.top > spaceBelow;

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
    window.addEventListener("scroll", updatePosition, true);
    window.addEventListener("resize", updatePosition);

    return () => {
      window.removeEventListener("scroll", updatePosition, true);
      window.removeEventListener("resize", updatePosition);
    };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (
        triggerRef.current?.contains(target) ||
        menuRef.current?.contains(target)
      ) {
        return;
      }
      setIsOpen(false);
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  const handleCopy = async (textToCopy: string, label: string) => {
    try {
      await navigator.clipboard.writeText(textToCopy);
      setCopiedText(label);
      setTimeout(() => setCopiedText(null), 2000);
    } catch {
      // Ignore
    }
  };

  const isVerified = employer.verificationStatus === "verified";
  const isSuspended = employer.status === "suspended";

  const menu = isOpen ? (
    <div
      ref={menuRef}
      id={menuId}
      style={menuStyle}
      role="menu"
      className="rounded-xl border border-border-subtle bg-surface p-1 shadow-md animate-in fade-in-0 zoom-in-95 duration-100"
    >
      <Link
        to={operationsEmployerDetailPath(employer.id)}
        onClick={() => setIsOpen(false)}
        role="menuitem"
        className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-left text-xs font-medium text-foreground transition-colors hover:bg-primary-light hover:text-primary"
      >
        <ExternalLink className="size-3.5 shrink-0" aria-hidden="true" />
        View Details
      </Link>

      <OperationsCan module="jobs" action="read">
        <Link
          to={`${OPERATIONS_ROUTES.JOBS}?employerId=${encodeURIComponent(employer.id)}`}
          onClick={() => setIsOpen(false)}
          role="menuitem"
          className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-left text-xs font-medium text-foreground transition-colors hover:bg-primary-light hover:text-primary"
        >
          <Briefcase className="size-3.5 shrink-0" aria-hidden="true" />
          View Posted Jobs ({employer.totalJobsCount})
        </Link>
      </OperationsCan>

      <div className="my-1 border-t border-border-subtle" />

      <OperationsCanKey permissionKey="employers.profile.actions.verify">
        {!isVerified && onVerify ? (
          <button
            type="button"
            onClick={() => {
              setIsOpen(false);
              onVerify(employer);
            }}
            role="menuitem"
            className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-left text-xs font-medium text-success transition-colors hover:bg-success/10"
          >
            <ShieldCheck className="size-3.5 shrink-0" aria-hidden="true" />
            Verify Employer
          </button>
        ) : null}
      </OperationsCanKey>

      <OperationsCanKey permissionKey="employers.profile.actions.reject">
        {employer.verificationStatus !== "rejected" && onReject ? (
          <button
            type="button"
            onClick={() => {
              setIsOpen(false);
              onReject(employer);
            }}
            role="menuitem"
            className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-left text-xs font-medium text-danger transition-colors hover:bg-danger/10"
          >
            <ShieldAlert className="size-3.5 shrink-0" aria-hidden="true" />
            Reject Verification
          </button>
        ) : null}
      </OperationsCanKey>

      {onToggleStatus ? (
        <OperationsCanKey
          permissionKey={
            isSuspended
              ? "employers.profile.actions.activate"
              : "employers.profile.actions.suspend"
          }
        >
          <button
            type="button"
            onClick={() => {
              setIsOpen(false);
              onToggleStatus(employer);
            }}
            role="menuitem"
            className={cn(
              "flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-left text-xs font-medium transition-colors",
              isSuspended
                ? "text-success hover:bg-success/10"
                : "text-danger hover:bg-danger/10",
            )}
          >
            {isSuspended ? (
              <>
                <CheckCircle2 className="size-3.5 shrink-0" aria-hidden="true" />
                Activate Employer
              </>
            ) : (
              <>
                <Ban className="size-3.5 shrink-0" aria-hidden="true" />
                Suspend Employer
              </>
            )}
          </button>
        </OperationsCanKey>
      ) : null}

      <div className="my-1 border-t border-border-subtle" />

      <button
        type="button"
        onClick={() => {
          handleCopy(employer.displayId || employer.id, "id");
          setIsOpen(false);
        }}
        role="menuitem"
        className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-left text-xs font-medium text-muted transition-colors hover:bg-surface hover:text-foreground"
      >
        <Copy className="size-3.5 shrink-0" aria-hidden="true" />
        {copiedText === "id" ? "Copied ID!" : "Copy Employer ID"}
      </button>

      {employer.phone ? (
        <button
          type="button"
          onClick={() => {
            handleCopy(employer.phone, "phone");
            setIsOpen(false);
          }}
          role="menuitem"
          className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-left text-xs font-medium text-muted transition-colors hover:bg-surface hover:text-foreground"
        >
          <Copy className="size-3.5 shrink-0" aria-hidden="true" />
          {copiedText === "phone" ? "Copied Phone!" : "Copy Phone"}
        </button>
      ) : null}
    </div>
  ) : null;

  return (
    <div className="relative inline-flex items-center gap-1.5">
      <button
        type="button"
        onClick={() => navigate(operationsEmployerDetailPath(employer.id))}
        className="inline-flex h-8 items-center justify-center rounded-lg border border-primary/30 px-2.5 text-[11px] font-semibold text-primary transition-colors hover:bg-primary-light focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
      >
        View Details
      </button>

      <button
        ref={triggerRef}
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-haspopup="menu"
        aria-expanded={isOpen}
        aria-controls={isOpen ? menuId : undefined}
        aria-label={`Actions for ${employer.displayName}`}
        className={cn(
          "inline-flex size-8 items-center justify-center rounded-lg border border-border-subtle text-muted transition-colors hover:bg-hero-bg hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30",
          isOpen && "bg-hero-bg text-foreground",
        )}
      >
        <MoreVertical className="size-3.5" aria-hidden="true" />
      </button>

      {typeof document !== "undefined" && menu ? createPortal(menu, document.body) : null}
    </div>
  );
}
