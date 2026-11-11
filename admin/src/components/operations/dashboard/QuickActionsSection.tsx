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
import {
  quickActionArrowClass,
  quickActionCardClass,
  quickActionIconClass,
  quickActionLabelClass,
  type QuickActionTone,
} from "../../ui/quick-action-tone";

const ICON_MAP: Record<QuickActionItem["icon"], LucideIcon> = {
  jobseeker: UserPlus,
  employer: Building2,
  job: Briefcase,
  support: Headset,
};

const TONE_MAP: Record<QuickActionItem["icon"], QuickActionTone> = {
  jobseeker: "primary",
  employer: "accent",
  job: "success",
  support: "warning",
};

interface QuickActionsSectionProps {
  actions: QuickActionItem[];
}

export function QuickActionsSection({ actions }: QuickActionsSectionProps) {
  return (
    <OperationsCard
      title="Quick Actions"
      className="min-w-0"
      dataTour="ops-home-quick-actions"
    >
      <ul className="grid grid-cols-1 gap-1.5 sm:grid-cols-2 sm:gap-2">
        {actions.map((action) => {
          const Icon = ICON_MAP[action.icon];
          const tone = TONE_MAP[action.icon];
          return (
            <li key={action.id}>
              <Link
                to={action.href}
                className={quickActionCardClass(
                  tone,
                  "flex items-center gap-2 rounded-lg px-2.5 py-2 sm:gap-2.5 sm:rounded-xl sm:px-3 sm:py-2.5",
                )}
              >
                <span
                  className={quickActionIconClass(
                    tone,
                    "inline-flex size-7 shrink-0 items-center justify-center rounded-md sm:size-8 sm:rounded-lg",
                  )}
                >
                  <Icon className="size-3.5 sm:size-4" strokeWidth={2} aria-hidden="true" />
                </span>
                <span
                  className={quickActionLabelClass(
                    tone,
                    "min-w-0 flex-1 text-[11px] font-semibold leading-snug sm:text-[12px]",
                  )}
                >
                  {action.label}
                </span>
                <ArrowRight
                  className={quickActionArrowClass(tone, "size-3 shrink-0 sm:size-3.5")}
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
