import type { ReactNode } from "react";

import { cn } from "../../utils/cn";



type BadgeVariant =

  | "default"

  | "employer"

  | "candidate"

  | "job"

  | "verification"

  | "support"

  | "high"

  | "medium"

  | "low"

  | "beta";



interface OperationsBadgeProps {

  children: ReactNode;

  variant?: BadgeVariant;

  className?: string;

}



const VARIANT_CLASSES: Record<BadgeVariant, string> = {
  default:
    "bg-primary-light text-primary dark:bg-primary-soft/90 dark:text-[#042f2e]",
  employer:
    "bg-primary-light text-primary dark:bg-primary-soft/20 dark:text-primary-soft",
  candidate:
    "bg-success/10 text-success dark:bg-success/90 dark:text-[#022c22]",
  job: "bg-warning/10 text-warning dark:bg-warning/20 dark:text-warning",
  verification:
    "bg-primary-light text-primary-hover dark:bg-chart-accent/20 dark:text-chart-accent",
  support: "bg-hero-bg text-muted dark:bg-border-subtle dark:text-muted",
  high: "bg-danger/10 text-danger dark:bg-danger/20 dark:text-danger",
  medium: "bg-warning/10 text-warning dark:bg-warning/20 dark:text-warning",
  low: "bg-border-subtle text-muted dark:bg-border/60 dark:text-muted",
  beta: "bg-brand-accent/20 text-foreground",
};



export function OperationsBadge({

  children,

  variant = "default",

  className,

}: OperationsBadgeProps) {

  return (

    <span

      className={cn(

        "inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium",

        VARIANT_CLASSES[variant],

        className,

      )}

    >

      {children}

    </span>

  );

}

