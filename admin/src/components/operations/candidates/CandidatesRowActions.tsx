import { Copy, MoreVertical } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { operationsCandidateDetailPath } from "../../../constants/operations-routes";
import type { OperationsCandidateListItem } from "../../../types/operations-candidates";
import { cn } from "../../../utils/cn";
import { formatCandidateDisplayId } from "./candidates-format";

interface CandidatesRowActionsProps {
  application: OperationsCandidateListItem;
  showViewButton?: boolean;
}

export function CandidatesRowActions({
  application,
  showViewButton = true,
}: CandidatesRowActionsProps) {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) {
      return;
    }

    const handlePointer = (event: MouseEvent) => {
      if (!menuRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handlePointer);
    return () => document.removeEventListener("mousedown", handlePointer);
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

  return (
    <div className="relative flex shrink-0 items-center gap-1.5" ref={menuRef}>
      {showViewButton ? (
        <button
          type="button"
          onClick={handleView}
          className={cn(
            "inline-flex h-8 items-center justify-center rounded-lg border border-primary/30 px-2.5 text-[11px] font-semibold text-primary transition-colors",
            "hover:bg-primary-light",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30",
          )}
        >
          View Profile
        </button>
      ) : null}
      <button
        type="button"
        aria-label={`More actions for ${application.candidateName}`}
        aria-expanded={open}
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
          className="absolute right-0 z-20 mt-1.5 min-w-[11rem] overflow-hidden rounded-lg border border-border bg-surface py-1 shadow-[0_10px_30px_color-mix(in_srgb,var(--color-foreground)_12%,transparent)]"
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
      ) : null}
    </div>
  );
}
