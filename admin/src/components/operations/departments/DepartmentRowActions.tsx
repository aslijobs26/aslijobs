import { MoreVertical } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import {
  OPERATIONS_ROUTES,
} from "../../../constants/operations-routes";
import type { OperationsDepartment } from "../../../types/operations-team";
import { cn } from "../../../utils/cn";
import { OperationsCan } from "../auth/OperationsCan";

interface DepartmentRowActionsProps {
  department: OperationsDepartment;
  onView: () => void;
  onEdit: () => void;
  onActivate: () => void;
  onDeactivate: () => void;
  onDelete: () => void;
  isStatusPending?: boolean;
}

export function DepartmentRowActions({
  department,
  onView,
  onEdit,
  onActivate,
  onDeactivate,
  onDelete,
  isStatusPending,
}: DepartmentRowActionsProps) {
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const isActive = department.status === "active";

  useEffect(() => {
    if (!open) return;
    const handlePointer = (event: MouseEvent) => {
      if (!menuRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handlePointer);
    return () => document.removeEventListener("mousedown", handlePointer);
  }, [open]);

  const close = () => setOpen(false);

  return (
    <div className="relative flex shrink-0 justify-end" ref={menuRef}>
      <button
        type="button"
        aria-label={`More actions for ${department.name}`}
        aria-expanded={open}
        aria-haspopup="menu"
        onClick={() => setOpen((current) => !current)}
        className={cn(
          "inline-flex size-8 items-center justify-center rounded-lg text-muted transition-colors",
          "hover:bg-hero-bg hover:text-foreground",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30",
          open && "bg-hero-bg text-foreground",
        )}
      >
        <MoreVertical className="size-3.5" aria-hidden="true" />
      </button>
      {open ? (
        <div
          role="menu"
          className="absolute right-0 z-20 mt-1.5 min-w-[12.5rem] overflow-hidden rounded-lg border border-border bg-surface py-1 shadow-[0_10px_30px_color-mix(in_srgb,var(--color-foreground)_12%,transparent)]"
        >
          <button
            type="button"
            role="menuitem"
            onClick={() => {
              close();
              onView();
            }}
            className="flex w-full px-3 py-2 text-left text-xs text-foreground hover:bg-primary-light hover:text-primary"
          >
            View
          </button>
          <OperationsCan module="departments" action="update">
            <button
              type="button"
              role="menuitem"
              onClick={() => {
                close();
                onEdit();
              }}
              className="flex w-full px-3 py-2 text-left text-xs text-foreground hover:bg-primary-light hover:text-primary"
            >
              Edit
            </button>
          </OperationsCan>
          <Link
            role="menuitem"
            to={`${OPERATIONS_ROUTES.TEAM_MANAGEMENT}?departmentId=${encodeURIComponent(department.id)}`}
            onClick={close}
            className="flex w-full px-3 py-2 text-left text-xs text-foreground hover:bg-primary-light hover:text-primary"
          >
            Manage Members
          </Link>
          <Link
            role="menuitem"
            to={OPERATIONS_ROUTES.ROLES}
            onClick={close}
            className="flex w-full px-3 py-2 text-left text-xs text-foreground hover:bg-primary-light hover:text-primary"
          >
            Manage Roles
          </Link>
          <OperationsCan module="departments" action="update">
            {isActive ? (
              <button
                type="button"
                role="menuitem"
                disabled={isStatusPending}
                onClick={() => {
                  close();
                  onDeactivate();
                }}
                className="flex w-full px-3 py-2 text-left text-xs text-foreground hover:bg-primary-light hover:text-primary disabled:opacity-50"
              >
                Deactivate
              </button>
            ) : (
              <button
                type="button"
                role="menuitem"
                disabled={isStatusPending}
                onClick={() => {
                  close();
                  onActivate();
                }}
                className="flex w-full px-3 py-2 text-left text-xs text-foreground hover:bg-primary-light hover:text-primary disabled:opacity-50"
              >
                Activate
              </button>
            )}
            <button
              type="button"
              role="menuitem"
              onClick={() => {
                close();
                onDelete();
              }}
              className="flex w-full px-3 py-2 text-left text-xs text-danger hover:bg-danger/5"
            >
              Delete
            </button>
          </OperationsCan>
        </div>
      ) : null}
    </div>
  );
}
