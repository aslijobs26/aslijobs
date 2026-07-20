import type { LucideIcon } from "lucide-react";

export type EmployerDashboardNavItem = {
  id: string;
  label: string;
  href: string;
  icon: LucideIcon;
  badge?: number;
};
