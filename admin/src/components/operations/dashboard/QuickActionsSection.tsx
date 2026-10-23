import {
  ArrowRight,
  Briefcase,
  Building2,
  Headset,
  UserPlus,
  type LucideIcon,
} from "lucide-react";
import { Link } from "react-router-dom";
import type { QuickActionItem } from "../../../types/operations-dashboard";
import { OperationsCard } from "../../ui/OperationsCard";

const ICON_MAP: Record<QuickActionItem["icon"], LucideIcon> = {
  jobseeker: UserPlus,
  employer: Building2,
  job: Briefcase,
  support: Headset,
};

interface QuickActionsSectionProps {
  actions: QuickActionItem[];
}

export function QuickActionsSection({ actions }: QuickActionsSectionProps) {
  return (
    <OperationsCard title="Quick Actions" className="min-w-0">
      <ul className="grid grid-cols-1 gap-1.5 sm:grid-cols-2 sm:gap-2">
        {actions.map((action) => {
          const Icon = ICON_MAP[action.icon];
          return (
            <li key={action.id}>
              <Link
                to={action.href}
                className="group flex items-center gap-2 rounded-lg border border-border-subtle bg-surface px-2.5 py-2 transition-colors hover:border-primary/25 hover:bg-primary-light/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 sm:gap-2.5 sm:rounded-xl sm:px-3 sm:py-2.5"
              >
                <span className="inline-flex size-7 shrink-0 items-center justify-center rounded-md bg-primary-light text-primary sm:size-8 sm:rounded-lg">
                  <Icon className="size-3.5 sm:size-4" strokeWidth={2} aria-hidden="true" />
                </span>
                <span className="min-w-0 flex-1 text-[11px] font-semibold leading-snug text-foreground sm:text-[12px]">
                  {action.label}
                </span>
                <ArrowRight
                  className="size-3 shrink-0 text-muted transition-transform group-hover:translate-x-0.5 group-hover:text-primary sm:size-3.5"
                  strokeWidth={2}
                  aria-hidden="true"
                />
              </Link>
            </li>
          );
        })}
      </ul>
    </OperationsCard>
  );
}
