import type { ReactNode } from "react";
import { cn } from "../../utils/cn";

interface OperationsFormFieldProps {
  label: string;
  htmlFor?: string;
  required?: boolean;
  error?: string;
  hint?: string;
  className?: string;
  children: ReactNode;
}

export function OperationsFormField({
  label,
  htmlFor,
  required = false,
  error,
  hint,
  className,
  children,
}: OperationsFormFieldProps) {
  return (
    <div className={cn("flex min-w-0 flex-col gap-1.5", className)}>
      <label
        htmlFor={htmlFor}
        className="text-[11px] font-semibold text-foreground"
      >
        {label}
        {required ? <span className="text-danger"> *</span> : null}
      </label>
      {children}
      {hint && !error ? (
        <p className="text-[10px] text-muted">{hint}</p>
      ) : null}
      {error ? (
        <p className="text-[10px] font-medium text-danger" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}

export const operationsFieldInputClassName =
  "h-9 w-full min-w-0 rounded-lg border border-border-subtle bg-hero-bg/60 px-3 text-xs font-medium text-foreground outline-none transition-[border-color,box-shadow,background-color] placeholder:font-normal placeholder:text-muted hover:border-primary/25 hover:bg-surface focus-visible:border-primary focus-visible:bg-surface focus-visible:ring-2 focus-visible:ring-primary/30";

export const operationsFieldTextareaClassName =
  "min-h-[96px] w-full min-w-0 rounded-lg border border-border-subtle bg-hero-bg/60 px-3 py-2.5 text-xs font-medium leading-relaxed text-foreground outline-none transition-[border-color,box-shadow,background-color] placeholder:font-normal placeholder:text-muted hover:border-primary/25 hover:bg-surface focus-visible:border-primary focus-visible:bg-surface focus-visible:ring-2 focus-visible:ring-primary/30";
