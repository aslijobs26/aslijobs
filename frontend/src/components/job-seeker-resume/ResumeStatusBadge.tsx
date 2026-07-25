import { cn } from "@/utils/cn";
import type { ResumeStatus } from "@/types/job-seeker-resume";

const STATUS_STYLES: Record<
  ResumeStatus,
  { label: string; className: string }
> = {
  READY: {
    label: "Ready",
    className: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  },
  OUTDATED: {
    label: "Outdated",
    className: "bg-amber-50 text-amber-800 ring-amber-200",
  },
  FAILED: {
    label: "Failed",
    className: "bg-red-50 text-red-700 ring-red-200",
  },
  REGENERATING: {
    label: "Regenerating",
    className: "bg-sky-50 text-sky-800 ring-sky-200",
  },
  NOT_GENERATED: {
    label: "Not generated",
    className: "bg-primary-light/50 text-muted ring-border-subtle",
  },
};

type ResumeStatusBadgeProps = {
  status: ResumeStatus;
  className?: string;
};

export function ResumeStatusBadge({ status, className }: ResumeStatusBadgeProps) {
  const style = STATUS_STYLES[status] ?? STATUS_STYLES.NOT_GENERATED;

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset",
        style.className,
        className,
      )}
    >
      {style.label}
    </span>
  );
}
