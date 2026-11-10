import { cn } from "../../utils/cn";

/** Colour family for an Operations "Quick Actions" item. */
export type QuickActionTone = "primary" | "accent" | "success" | "warning" | "danger";

const TONES: Record<
  QuickActionTone,
  { card: string; icon: string; label: string; arrow: string }
> = {
  primary: {
    card: "hover:border-primary/40 hover:bg-gradient-to-r hover:from-surface hover:to-primary/10 hover:shadow-primary/10",
    icon: "bg-primary-light text-primary group-hover:bg-primary group-hover:text-surface",
    label: "group-hover:text-primary",
    arrow: "group-hover:text-primary",
  },
  accent: {
    card: "hover:border-chart-accent/40 hover:bg-gradient-to-r hover:from-surface hover:to-chart-accent/10 hover:shadow-chart-accent/10",
    icon: "bg-chart-accent/10 text-chart-accent group-hover:bg-chart-accent group-hover:text-surface",
    label: "group-hover:text-chart-accent",
    arrow: "group-hover:text-chart-accent",
  },
  success: {
    card: "hover:border-success/40 hover:bg-gradient-to-r hover:from-surface hover:to-success/10 hover:shadow-success/10",
    icon: "bg-success/10 text-success group-hover:bg-success group-hover:text-surface",
    label: "group-hover:text-success",
    arrow: "group-hover:text-success",
  },
  warning: {
    card: "hover:border-warning/40 hover:bg-gradient-to-r hover:from-surface hover:to-warning/10 hover:shadow-warning/10",
    icon: "bg-warning/10 text-warning group-hover:bg-warning group-hover:text-surface",
    label: "group-hover:text-warning",
    arrow: "group-hover:text-warning",
  },
  danger: {
    card: "hover:border-danger/40 hover:bg-gradient-to-r hover:from-surface hover:to-danger/10 hover:shadow-danger/10",
    icon: "bg-danger/10 text-danger group-hover:bg-danger group-hover:text-surface",
    label: "group-hover:text-danger",
    arrow: "group-hover:text-danger",
  },
};

/** Card classes; layout (padding, radius, gap) stays with the caller. */
export function quickActionCardClass(
  tone: QuickActionTone,
  layout: string,
  disabled = false,
): string {
  return cn(
    "group border border-border-subtle bg-surface transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30",
    layout,
    disabled
      ? "cursor-not-allowed opacity-60"
      : cn("hover:-translate-y-px hover:shadow-md", TONES[tone].card),
  );
}

export function quickActionIconClass(tone: QuickActionTone, layout: string): string {
  return cn("transition-colors duration-200", layout, TONES[tone].icon);
}

export function quickActionLabelClass(tone: QuickActionTone, layout: string): string {
  return cn("text-foreground transition-colors duration-200", layout, TONES[tone].label);
}

export function quickActionArrowClass(tone: QuickActionTone, layout: string): string {
  return cn(
    "text-muted transition-all duration-200 group-hover:translate-x-0.5",
    layout,
    TONES[tone].arrow,
  );
}
