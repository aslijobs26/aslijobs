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
      <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        {actions.map((action) => {
          const Icon = ICON_MAP[action.icon];
          return (
            <li key={action.id}>
              <Link
                to={action.href}
                className="group flex items-center gap-2.5 rounded-xl border border-border-subtle bg-surface px-3 py-2.5 transition-colors hover:border-primary/25 hover:bg-primary-light/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
              >
                <span className="inline-flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary-light text-primary">
                  <Icon className="size-4" strokeWidth={2} aria-hidden="true" />
                </span>
                <span className="min-w-0 flex-1 text-[12px] font-semibold leading-snug text-foreground">
                  {action.label}
                </span>
                <ArrowRight
                  className="size-3.5 shrink-0 text-muted transition-transform group-hover:translate-x-0.5 group-hover:text-primary"
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
