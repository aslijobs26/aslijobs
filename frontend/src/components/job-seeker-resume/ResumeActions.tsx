import type { ReactNode } from "react";
import { cn } from "@/utils/cn";
import { Download, Eye, Pencil, Printer, RefreshCw } from "lucide-react";

type ResumeActionsProps = {
  canDownload: boolean;
  canPrint: boolean;
  canEdit?: boolean;
  isRegenerating: boolean;
  isDownloading: boolean;
  regenerateLabel?: string;
  onPreview: () => void;
  onEdit?: () => void;
  onDownload: () => void;
  onPrint: () => void;
  onRegenerate: () => void;
  className?: string;
};

function ActionButton({
  children,
  onClick,
  disabled,
  variant = "secondary",
}: {
  children: ReactNode;
  onClick: () => void;
  disabled?: boolean;
  variant?: "primary" | "secondary";
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "inline-flex w-full items-center justify-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 disabled:cursor-not-allowed disabled:opacity-60 sm:py-2.5 sm:text-sm",
        variant === "primary"
          ? "bg-primary text-surface hover:bg-primary-hover"
          : "border border-border-subtle bg-surface text-foreground hover:bg-primary-light/40",
      )}
    >
      {children}
    </button>
  );
}

export function ResumeActions({
  canDownload,
  canPrint,
  canEdit = false,
  isRegenerating,
  isDownloading,
  regenerateLabel = "Regenerate Resume",
  onPreview,
  onEdit,
  onDownload,
  onPrint,
  onRegenerate,
  className,
}: ResumeActionsProps) {
  return (
    <div className={cn("resume-no-print space-y-2", className)}>
      <h3 className="text-xs font-semibold text-foreground sm:text-sm">
        Resume Actions
      </h3>
      <ActionButton onClick={onPreview} variant="secondary">
        <Eye className="size-4" aria-hidden="true" />
        Preview Resume
      </ActionButton>
      {canEdit && onEdit ? (
        <ActionButton onClick={onEdit} variant="secondary">
          <Pencil className="size-4" aria-hidden="true" />
          Edit Resume
        </ActionButton>
      ) : null}
      <ActionButton
        onClick={onDownload}
        disabled={!canDownload || isDownloading}
        variant="primary"
      >
        <Download className="size-4" aria-hidden="true" />
        {isDownloading ? "Downloading…" : "Download PDF"}
      </ActionButton>
      <ActionButton onClick={onPrint} disabled={!canPrint} variant="secondary">
        <Printer className="size-4" aria-hidden="true" />
        Print Resume
      </ActionButton>
      <ActionButton
        onClick={onRegenerate}
        disabled={isRegenerating}
        variant="secondary"
      >
        <RefreshCw
          className={cn("size-4", isRegenerating && "animate-spin")}
          aria-hidden="true"
        />
        {isRegenerating ? "Regenerating…" : regenerateLabel}
      </ActionButton>
    </div>
  );
}
