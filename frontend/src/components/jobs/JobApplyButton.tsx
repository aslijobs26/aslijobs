import { Check } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/utils/cn";

type JobApplyButtonProps = {
  isApplied: boolean;
  isApplying: boolean;
  onClick: () => void;
  className?: string;
  appliedClassName?: string;
  startIcon?: ReactNode;
  endIcon?: ReactNode;
};

/**
 * Shared Apply Now / Applied CTA for public job surfaces.
 */
export function JobApplyButton({
  isApplied,
  isApplying,
  onClick,
  className,
  appliedClassName,
  startIcon,
  endIcon,
}: JobApplyButtonProps) {
  if (isApplied) {
    return (
      <button
        type="button"
        disabled
        aria-disabled="true"
        className={cn(
          "inline-flex items-center justify-center gap-1.5 rounded-xl px-4 font-semibold transition-colors",
          className,
          appliedClassName,
          // Applied look must win over idle CTA colors from `className`.
          "border border-primary/30 bg-primary-light text-primary shadow-none hover:bg-primary-light hover:text-primary disabled:cursor-not-allowed disabled:opacity-100",
        )}
      >
        <Check className="size-4 shrink-0" strokeWidth={2.5} aria-hidden="true" />
        Applied
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={isApplying}
      className={cn(className, "disabled:cursor-not-allowed disabled:opacity-60")}
    >
      {startIcon}
      {isApplying ? "Submitting…" : "Apply Now"}
      {endIcon}
    </button>
  );
}
