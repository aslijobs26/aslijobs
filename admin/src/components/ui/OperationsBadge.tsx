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

  default: "bg-primary-light text-primary",

  employer: "bg-primary-light text-primary",

  candidate: "bg-success/10 text-success",

  job: "bg-warning/10 text-warning",

  verification: "bg-primary-light text-primary-hover",

  support: "bg-hero-bg text-muted",

  high: "bg-danger/10 text-danger",

  medium: "bg-warning/10 text-warning",

  low: "bg-border-subtle text-muted",

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

