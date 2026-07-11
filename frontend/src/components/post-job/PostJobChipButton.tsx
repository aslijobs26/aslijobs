"use client";

import { cn } from "@/utils/cn";
import { Plus, X } from "lucide-react";
import { postJobPerkPillClassName } from "./post-job-form-styles";

type PostJobChipButtonProps = {
  label: string;
  isSelected: boolean;
  onClick: () => void;
};

export function PostJobChipButton({
  label,
  isSelected,
  onClick,
}: PostJobChipButtonProps) {
  return (
    <button
      type="button"
      aria-pressed={isSelected}
      onClick={onClick}
      className={cn(
        postJobPerkPillClassName,
        isSelected
          ? "border-primary-soft bg-primary-light text-primary"
          : "border-border bg-surface text-foreground hover:border-primary/20",
      )}
    >
      <span className="truncate">{label}</span>
      {isSelected ? (
        <X className="size-3.5 shrink-0" strokeWidth={2.5} aria-hidden="true" />
      ) : (
        <Plus className="size-3.5 shrink-0" strokeWidth={2.5} aria-hidden="true" />
      )}
    </button>
  );
}
