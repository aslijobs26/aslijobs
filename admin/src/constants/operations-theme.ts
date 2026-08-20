export type OperationsTheme = "light" | "dark";

export const OPERATIONS_THEME_STORAGE_KEY = "aslijobs_operations_theme" as const;

export const OPERATIONS_THEME_CHANGE_EVENT = "aslijobs:operations-theme-change" as const;

export const OPERATIONS_THEME_TRANSITION_MS = 250 as const;

export const OPERATIONS_THEME_CSS_VARIABLES = {
  primary: "--ds-primary",
  primarySoft: "--ds-primary-soft",
  borderSubtle: "--ds-border-subtle",
  danger: "--ds-danger",
  warning: "--ds-warning",
  success: "--ds-success",
  chartAccent: "--ds-chart-accent",
  chartAccentAlt: "--ds-chart-accent-alt",
} as const;
