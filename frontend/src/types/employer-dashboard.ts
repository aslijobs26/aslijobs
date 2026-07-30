import type { LucideIcon } from "lucide-react";

export type EmployerDashboardNavItem = {
  id: string;
  label: string;
  href: string;
  icon: LucideIcon;
  badge?: number;
  /** One-time onboarding indicator. Separate from numeric notifications. */
  showOnboardingDot?: boolean;
};
